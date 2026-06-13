// api/estimate.js — Vercel serverless function.
// Proxies food-estimate requests to the Anthropic API so the API key never
// reaches the browser. Only signed-in Supabase users can call it.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // verify the caller is a signed-in user of YOUR Supabase project
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Sign in required" });
  const check = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: auth },
  });
  if (!check.ok) return res.status(401).json({ error: "Sign in required" });

  // forward to Anthropic with a hard cap on tokens
  const { messages } = req.body || {};
  if (!Array.isArray(messages)) return res.status(400).json({ error: "Bad request" });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages }),
  });

  const data = await r.json();
  return res.status(r.status).json(data);
}
