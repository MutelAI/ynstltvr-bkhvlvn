/**
 * Vercel Serverless Function — PUT /api/save-business
 *
 * Validates the editToken, commits the updated business.json to GitHub,
 * then optionally triggers a redeploy via VERCEL_DEPLOY_HOOK.
 *
 * Required env vars (set during `deploy` in business-site-generator):
 *   GITHUB_TOKEN       — personal/org token with repo write access
 *   GITHUB_REPO_OWNER  — owner/org that owns the repo
 *   GITHUB_REPO        — the repo name (e.g. "my-business-slug")
 *
 * Optional:
 *   VERCEL_DEPLOY_HOOK — webhook URL to trigger a redeploy
 */

const FILE_PATH = 'public/data/business.json';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Parse body (Vercel provides it already as an object if Content-Type is application/json)
  let data;
  try {
    data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  if (!data?.editToken) {
    res.status(400).json({ error: 'Missing editToken in body' });
    return;
  }

  // Validate token against env var (never stored in the repo)
  const envToken = process.env.EDIT_TOKEN;
  if (!envToken || envToken !== data.editToken) {
    res.status(403).json({ error: 'Invalid edit token' });
    return;
  }

  const ghToken = process.env.GITHUB_TOKEN;
  const owner   = process.env.GITHUB_REPO_OWNER || process.env.GITHUB_ORG || process.env.VERCEL_GIT_REPO_OWNER;
  const repo    = process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG;

  if (!ghToken || !owner || !repo) {
    res.status(503).json({ error: 'GitHub credentials not configured on this deployment' });
    return;
  }

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${ghToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // 1. Fetch current file to get SHA and validate token
  const getRes = await fetch(apiBase, { headers });
  if (!getRes.ok) {
    const err = await getRes.text();
    res.status(500).json({ error: `GitHub GET failed (${getRes.status}): ${err}` });
    return;
  }

  const fileData = await getRes.json();
  let current;
  try {
    current = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));
  } catch {
    res.status(500).json({ error: 'Could not parse current business.json from GitHub' });
    return;
  }

  // 2. (Token already validated against env var above)

  // 3. Commit updated file — strip editToken so it is never stored in the repo
  const { editToken: _tok, ...dataToSave } = data;
  const newContent = Buffer.from(JSON.stringify(dataToSave, null, 2)).toString('base64');
  const now = new Date().toLocaleString('en-GB', { hour12: false });
  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `edit-mode: save ${now}`,
      content: newContent,
      sha: fileData.sha,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    res.status(500).json({ error: `GitHub PUT failed (${putRes.status}): ${err}` });
    return;
  }

  const putData = await putRes.json();
  const commitHash = putData.commit?.sha?.slice(0, 7) ?? '?';

  // 4. Trigger redeploy via deploy hook (if configured)
  const deployHook = process.env.VERCEL_DEPLOY_HOOK;
  if (deployHook) {
    fetch(deployHook, { method: 'POST' }).catch(() => { /* best-effort */ });
  }

  res.status(200).json({ ok: true, committed: true, hash: commitHash });
}
