// Step 1 of the admin-page login: sends the user to GitHub to say "yes,
// this website is allowed to save photos on my behalf."
// This never sees or stores your GitHub password — GitHub handles that part.
module.exports = function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;

  if (!clientId) {
    res.status(500).send(
      "Missing OAUTH_CLIENT_ID. Add it under Vercel → Settings → Environment Variables."
    );
    return;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${protocol}://${host}/api/callback`;
  const state = Math.random().toString(36).slice(2);

  const authorizeUrl =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&scope=repo,user" +
    `&state=${state}`;

  res.writeHead(302, { Location: authorizeUrl });
  res.end();
};
