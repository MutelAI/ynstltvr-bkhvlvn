/**
 * Vercel Serverless Function — GET /api/verify-token?token=<token>
 *
 * Returns { ok: true } when the token matches the EDIT_TOKEN env var,
 * or 403 { ok: false } otherwise.
 * Used by the client-side edit module so the token is never compared
 * against the business.json file in the repo.
 */
export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { token } = req.query;
  const editToken = process.env.EDIT_TOKEN;

  if (!editToken || !token || token !== editToken) {
    res.status(403).json({ ok: false });
    return;
  }

  res.status(200).json({ ok: true });
}
