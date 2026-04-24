/**
 * Cloudflare Pages Function — PUT /api/save-business
 *
 * Validates the editToken, commits the updated business.json to GitHub,
 * then optionally triggers a redeploy via CF_DEPLOY_HOOK.
 *
 * Required env vars (set in Cloudflare Pages dashboard → Settings → Environment variables):
 *   GITHUB_TOKEN       — personal/org token with repo write access
 *   GITHUB_REPO_OWNER  — owner/org that owns the repo
 *   GITHUB_REPO        — the repo name (e.g. "my-business-slug")
 *
 * Optional:
 *   CF_DEPLOY_HOOK     — Cloudflare Pages deploy hook URL to trigger a redeploy
 */

const FILE_PATH = 'public/data/business.json';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequestPut(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!data?.editToken) {
    return json({ error: 'Missing editToken in body' }, 400);
  }

  // Validate token against env var (never stored in the repo)
  const envToken = env.EDIT_TOKEN;
  if (!envToken || envToken !== data.editToken) {
    return json({ error: 'Invalid edit token' }, 403);
  }

  const ghToken = env.GITHUB_TOKEN;
  const owner   = env.GITHUB_REPO_OWNER || env.GITHUB_ORG;
  const repo    = env.GITHUB_REPO;

  if (!ghToken || !owner || !repo) {
    return json({ error: 'GitHub credentials not configured on this deployment' }, 503);
  }

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${FILE_PATH}`;
  const ghHeaders = {
    Authorization: `Bearer ${ghToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // 1. Fetch current file to get SHA and validate token
  const getRes = await fetch(apiBase, { headers: ghHeaders });
  if (!getRes.ok) {
    const err = await getRes.text();
    return json({ error: `GitHub GET failed (${getRes.status}): ${err}` }, 500);
  }

  const fileData = await getRes.json();
  let current;
  try {
    const decoded = atob(fileData.content.replace(/\n/g, ''));
    current = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(decoded, c => c.charCodeAt(0))
    ));
  } catch {
    return json({ error: 'Could not parse current business.json from GitHub' }, 500);
  }

  // 2. (Token already validated against env var above)

  // 3. Commit updated file — strip editToken so it is never stored in the repo
  const { editToken: _tok, ...dataToSave } = data;
  const encoded = btoa(
    String.fromCharCode(...new TextEncoder().encode(JSON.stringify(dataToSave, null, 2)))
  );
  const now = new Date().toLocaleString('en-GB', { hour12: false });
  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers: { ...ghHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `edit-mode: save ${now}`,
      content: encoded,
      sha: fileData.sha,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    return json({ error: `GitHub PUT failed (${putRes.status}): ${err}` }, 500);
  }

  const putData = await putRes.json();
  const commitHash = putData.commit?.sha?.slice(0, 7) ?? '?';

  // 4. Trigger redeploy via deploy hook (if configured)
  const deployHook = env.CF_DEPLOY_HOOK || env.VERCEL_DEPLOY_HOOK;
  if (deployHook) {
    context.waitUntil(fetch(deployHook, { method: 'POST' }));
  }

  return json({ ok: true, committed: true, hash: commitHash });
}
