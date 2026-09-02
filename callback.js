// Step 2 of the admin-page login: GitHub sends the user back here with a
// one-time code. This function trades that code for an access token
// (using the secret key, which only this server ever sees) and hands the
// token back to the admin page so it can save your photo changes to GitHub.
module.exports = async function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const code = req.query.code;

  if (!code) {
    res.status(400).send("Missing GitHub login code.");
    return;
  }
  if (!clientId || !clientSecret) {
    res.status(500).send(
      "Missing OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET. Add them under " +
      "Vercel → Settings → Environment Variables."
    );
    return;
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      res.status(400).send(tokenData.error_description || tokenData.error);
      return;
    }

    const token = tokenData.access_token;
    const payload = JSON.stringify({ token: token, provider: "github" });

    // Standard handshake the admin page (Decap CMS) expects from a
    // GitHub OAuth popup — hands the token back via postMessage, then
    // the popup closes itself.
    const html =
      "<script>" +
      "(function() {" +
      "function receiveMessage(e) {" +
      "window.opener.postMessage(" +
      "'authorization:github:success:" + payload + "'," +
      "e.origin" +
      ");" +
      "window.removeEventListener('message', receiveMessage, false);" +
      "}" +
      "window.addEventListener('message', receiveMessage, false);" +
      "window.opener.postMessage('authorizing:github', '*');" +
      "})();" +
      "</script>";

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send("GitHub login error: " + err.message);
  }
};
