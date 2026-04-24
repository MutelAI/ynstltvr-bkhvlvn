/**
 * Cloudflare Pages Function — GET /api/verify-token?token=<token>
 *
 * Returns { ok: true } when the token matches the EDIT_TOKEN env var,
 * or 403 { ok: false } otherwise.
 * Used by the client-side edit module so the token is never compared
 * against the business.json file in the repo.
 */
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const editToken = env.EDIT_TOKEN;

  if (!editToken || !token || token !== editToken) {
    return json({ ok: false }, 403);
  }

  return json({ ok: true });
}
