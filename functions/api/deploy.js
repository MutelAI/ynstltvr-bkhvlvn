/**
 * Cloudflare Pages Function — POST /api/deploy
 *
 * Validates the editToken, then triggers a redeploy via CF_DEPLOY_HOOK
 * (or VERCEL_DEPLOY_HOOK as fallback).
 *
 * Required env vars (set in Cloudflare Pages dashboard → Settings → Environment variables):
 *   CF_DEPLOY_HOOK     — Cloudflare Pages deploy hook URL
 *
 * For token validation also needs:
 *   GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO
 */

const FILE_PATH = 'public/data/business.json';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequestPost(context) {
  const { request, env } = context;

  const deployHook = env.CF_DEPLOY_HOOK || env.VERCEL_DEPLOY_HOOK;
  if (!deployHook) {
    return json({ error: 'CF_DEPLOY_HOOK is not configured on this deployment' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const token = body?.editToken ?? new URL(request.url).searchParams.get('token') ?? null;
  if (!token) {
    return json({ error: 'Missing editToken' }, 400);
  }

  const ghToken = env.GITHUB_TOKEN;
  const owner   = env.GITHUB_REPO_OWNER || env.GITHUB_ORG;
  const repo    = env.GITHUB_REPO;

  if (ghToken && owner && repo) {
    // Fetch current business.json from GitHub to verify the token
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${FILE_PATH}`;
    const getRes = await fetch(apiBase, {
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      let current;
      try {
        const decoded = atob(fileData.content.replace(/\n/g, ''));
        current = JSON.parse(new TextDecoder().decode(
          Uint8Array.from(decoded, c => c.charCodeAt(0))
        ));
      } catch {
        return json({ error: 'Could not parse business.json from GitHub' }, 500);
      }

      if (!current.editToken || current.editToken !== token) {
        return json({ error: 'Invalid edit token' }, 403);
      }
    }
    // If GitHub fetch fails, still allow deploy (non-blocking)
  }

  // Trigger redeploy
  const hookRes = await fetch(deployHook, { method: 'POST' });
  if (!hookRes.ok) {
    return json({ error: `Deploy hook failed (${hookRes.status})` }, 500);
  }

  return json({ ok: true });
}
