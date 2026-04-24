/**
 * Cloudflare Pages Function — POST /api/rename-domain
 *
 * Checks availability and optionally renames the site's custom subdomain.
 * Body: { editToken, newSlug, checkOnly?: boolean }
 *
 * Required env vars (Cloudflare Pages → Settings → Environment variables):
 *   GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO  — editToken validation
 *   VERCEL_API_TOKEN   — Vercel token with API access
 *   VERCEL_PROJECT_SLUG — the Vercel project name
 *   SITE_DOMAIN        — current full domain, e.g. "my-biz.il.mutelai.com"
 *
 * Optional:
 *   VERCEL_TEAM_ID    — Vercel team/org ID
 *   CF_DEPLOY_HOOK | VERCEL_DEPLOY_HOOK — redeploy webhook after rename
 */

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

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
  const listData = await listRes.json();
  const existing = listData?.envs?.find(e => e.key === key);
  if (!existing) return;
  await fetch(
    `https://api.vercel.com/v10/projects/${projectSlug}/env/${existing.id}${qs}`,
    { method: 'PATCH', headers: authHeader, body: JSON.stringify({ value, type: 'encrypted', target: ['production', 'preview'] }) }
  );
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { editToken, newSlug: rawSlug, checkOnly = false } = body ?? {};

  if (!editToken) return json({ error: 'Missing editToken' }, 400);
  if (!rawSlug)   return json({ error: 'Missing newSlug' }, 400);

  const newSlug = String(rawSlug).toLowerCase().trim();
  if (!SLUG_RE.test(newSlug)) {
    return json({ error: 'Invalid subdomain — use lowercase letters, numbers and hyphens only' }, 400);
  }

  // ── Validate editToken against env var ──────────────────────────────
  const envToken = env.EDIT_TOKEN;
  if (!envToken || envToken !== editToken) return json({ error: 'Invalid edit token' }, 403);

  // ── Resolve Vercel credentials ────────────────────────────────────────────
  const vercelToken   = env.VERCEL_API_TOKEN;
  const teamId        = env.VERCEL_TEAM_ID || '';
  const projectSlug   = env.VERCEL_PROJECT_SLUG || repo;
  const siteDomain    = env.SITE_DOMAIN;

  if (!vercelToken || !projectSlug || !siteDomain) {
    return json({ error: 'Vercel credentials not configured on this deployment' }, 503);
  }

  // Parse cc + root from SITE_DOMAIN (format: slug.cc.mutelai.com)
  const parts = siteDomain.split('.');
  if (parts.length < 3) return json({ error: 'Invalid SITE_DOMAIN format' }, 500);

  const cc   = parts[1];
  const root = parts.slice(2).join('.');
  const newDomain = `${newSlug}.${cc}.${root}`;

  if (newDomain === siteDomain) {
    return json({ error: 'New domain is the same as current domain' }, 400);
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
      return json({ available: false, domain: newDomain });
    }
    return json({ error: `Failed to add domain (${addRes.status}): ${JSON.stringify(errData)}` }, 500);
  }

  if (checkOnly) {
    // Probe succeeded — remove immediately and report available
    context.waitUntil(
      fetch(
        `https://api.vercel.com/v10/projects/${projectSlug}/domains/${newDomain}${qs}`,
        { method: 'DELETE', headers: vercelHeaders }
      ).catch(() => {})
    );
    return json({ available: true, domain: newDomain });
  }

  // ── Full rename: remove old domain + update env var + redeploy ────────────
  await fetch(
    `https://api.vercel.com/v10/projects/${projectSlug}/domains/${siteDomain}${qs}`,
    { method: 'DELETE', headers: vercelHeaders }
  ).catch(() => {});

  await updateVercelEnvVar(vercelToken, teamId, projectSlug, 'SITE_DOMAIN', newDomain);

  const deployHook = env.CF_DEPLOY_HOOK || env.VERCEL_DEPLOY_HOOK;
  if (deployHook) {
    context.waitUntil(fetch(deployHook, { method: 'POST' }).catch(() => {}));
  }

  return json({ ok: true, newDomain });
}
