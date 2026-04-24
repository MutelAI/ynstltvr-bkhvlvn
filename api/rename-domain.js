/**
 * Vercel Serverless Function — POST /api/rename-domain
 *
 * Checks availability and optionally renames the site's custom subdomain
 * on the Vercel project.
 *
 * Body: { editToken, newSlug, checkOnly?: boolean }
 *   checkOnly=true  → probe availability without persisting any changes
 *   checkOnly=false → add new domain, remove old domain, update SITE_DOMAIN env var, trigger redeploy
 *
 * Required env vars (set during `deploy` in business-site-generator):
 *   GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO  — for editToken validation
 *   VERCEL_API_TOKEN  — Vercel token with API access
 *   VERCEL_PROJECT_SLUG  — the Vercel project name
 *   SITE_DOMAIN  — current full domain, e.g. "my-biz.il.mutelai.com"
 *
 * Optional:
 *   VERCEL_TEAM_ID    — Vercel team/org ID
 *   VERCEL_DEPLOY_HOOK — webhook URL to trigger redeploy after rename
 */

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

async function updateVercelEnvVar(vercelToken, teamId, projectSlug, key, value) {
  const qs = teamId ? `?teamId=${teamId}` : '';
  const base = `https://api.vercel.com/v10/projects/${projectSlug}/env${qs}`;
  const authHeader = { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' };
  const body = JSON.stringify({ key, value, type: 'encrypted', target: ['production', 'preview'] });

  const postRes = await fetch(base, { method: 'POST', headers: authHeader, body });
  if (postRes.ok) return;

  // Already exists — find ID and PATCH
  const listRes = await fetch(base, { headers: { Authorization: `Bearer ${vercelToken}` } });
  if (!listRes.ok) return;
  const { envs } = await listRes.json();
  const existing = envs?.find(e => e.key === key);
  if (!existing) return;
  await fetch(
    `https://api.vercel.com/v10/projects/${projectSlug}/env/${existing.id}${qs}`,
    { method: 'PATCH', headers: authHeader, body: JSON.stringify({ value, type: 'encrypted', target: ['production', 'preview'] }) }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const { editToken, newSlug: rawSlug, checkOnly = false } = body ?? {};

  if (!editToken) { res.status(400).json({ error: 'Missing editToken' }); return; }
  if (!rawSlug)   { res.status(400).json({ error: 'Missing newSlug' }); return; }

  const newSlug = String(rawSlug).toLowerCase().trim();
  if (!SLUG_RE.test(newSlug)) {
    res.status(400).json({ error: 'Invalid subdomain — use lowercase letters, numbers and hyphens only' });
    return;
  }

  // ── Validate editToken against env var ─────────────────────────────────────
  const envToken = process.env.EDIT_TOKEN;
  if (!envToken || envToken !== editToken) {
    res.status(403).json({ error: 'Invalid edit token' });
    return;
  }

  // ── Resolve Vercel credentials ────────────────────────────────────────────
  const vercelToken   = process.env.VERCEL_API_TOKEN;
  const teamId        = process.env.VERCEL_TEAM_ID || '';
  const projectSlug   = process.env.VERCEL_PROJECT_SLUG;
  const siteDomain    = process.env.SITE_DOMAIN;

  if (!vercelToken || !projectSlug || !siteDomain) {
    res.status(503).json({ error: 'Vercel credentials not configured on this deployment' });
    return;
  }

  // Parse cc + root from SITE_DOMAIN (format: slug.cc.mutelai.com)
  const parts = siteDomain.split('.');
  if (parts.length < 3) {
    res.status(500).json({ error: 'Invalid SITE_DOMAIN format' });
    return;
  }
  const cc   = parts[1];
  const root = parts.slice(2).join('.');
  const newDomain = `${newSlug}.${cc}.${root}`;

  if (newDomain === siteDomain) {
    res.status(400).json({ error: 'New domain is the same as current domain' });
    return;
  }

  const qs = teamId ? `?teamId=${teamId}` : '';
  const vercelHeaders = {
    Authorization: `Bearer ${vercelToken}`,
    'Content-Type': 'application/json',
  };

  // ── Try adding the new domain ─────────────────────────────────────────────
  const addRes = await fetch(
    `https://api.vercel.com/v10/projects/${projectSlug}/domains${qs}`,
    { method: 'POST', headers: vercelHeaders, body: JSON.stringify({ name: newDomain }) }
  );

  if (!addRes.ok) {
    const errData = await addRes.json().catch(() => ({}));
    const code = errData?.error?.code ?? errData?.code ?? '';
    if (addRes.status === 409 || code === 'domain_already_in_use' || code === 'project_domain_already_exists') {
      if (checkOnly) {
        res.status(200).json({ available: false, domain: newDomain });
      } else {
        res.status(409).json({ error: `Domain "${newDomain}" is already in use` });
      }
      return;
    }
    res.status(500).json({ error: `Failed to add domain (${addRes.status}): ${JSON.stringify(errData)}` });
    return;
  }

  if (checkOnly) {
    // Probe succeeded — remove immediately (it was just a check) and report available
    await fetch(
      `https://api.vercel.com/v10/projects/${projectSlug}/domains/${newDomain}${qs}`,
      { method: 'DELETE', headers: vercelHeaders }
    ).catch(() => {});
    res.status(200).json({ available: true, domain: newDomain });
    return;
  }

  // ── Full rename: remove old domain + update env var + redeploy ────────────
  await fetch(
    `https://api.vercel.com/v10/projects/${projectSlug}/domains/${siteDomain}${qs}`,
    { method: 'DELETE', headers: vercelHeaders }
  ).catch(() => {});

  await updateVercelEnvVar(vercelToken, teamId, projectSlug, 'SITE_DOMAIN', newDomain);

  const deployHook = process.env.VERCEL_DEPLOY_HOOK;
  if (deployHook) {
    fetch(deployHook, { method: 'POST' }).catch(() => {});
  }

  res.status(200).json({ ok: true, newDomain });
}
