// ============================================================================
// CAROUSEL SETTINGS BACKEND — controls the Services section's auto-scrolling
// carousel from the admin page, instead of it being hard-coded in script.js.
//
//   GET   /api/carousel-settings          -> { autoplay, intervalMs }
//   POST  /api/carousel-settings          -> save new settings (needs the
//                                             admin password, same header as
//                                             every other write in this site)
//
// Stored as one small JSON file in the same Vercel Blob store the photos
// already use — no database needed. If nothing has been saved yet, GET
// returns sensible defaults (autoplay on, 3 seconds) so the site works fine
// even before anyone opens admin.html.
// ============================================================================

const { list, put, del } = require("@vercel/blob");

const SETTINGS_PATH_PREFIX = "settings/carousel";
const DEFAULTS = { autoplay: true, intervalMs: 3000 };

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return await handleGet(req, res);
    }
    if (req.method === "POST") {
      return await handleSave(req, res);
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
};

async function handleGet(req, res) {
  const { blobs } = await list({ prefix: SETTINGS_PATH_PREFIX });
  res.setHeader("Cache-Control", "no-store");

  if (!blobs.length) {
    res.status(200).json(DEFAULTS);
    return;
  }

  // Newest file wins if more than one somehow exists.
  const latest = blobs.sort(function (a, b) {
    return new Date(b.uploadedAt) - new Date(a.uploadedAt);
  })[0];

  const response = await fetch(latest.url);
  const saved = await response.json();
  res.status(200).json({
    autoplay: typeof saved.autoplay === "boolean" ? saved.autoplay : DEFAULTS.autoplay,
    intervalMs: typeof saved.intervalMs === "number" ? saved.intervalMs : DEFAULTS.intervalMs
  });
}

async function handleSave(req, res) {
  if (!checkPassword(req)) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch (e) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const autoplay = typeof body.autoplay === "boolean" ? body.autoplay : DEFAULTS.autoplay;
  const intervalMsRaw = Number(body.intervalMs);
  const intervalMs = intervalMsRaw >= 800 && intervalMsRaw <= 20000 ? intervalMsRaw : DEFAULTS.intervalMs;

  // Only one settings file should ever exist — clear any previous one first.
  const { blobs } = await list({ prefix: SETTINGS_PATH_PREFIX });
  for (const old of blobs) {
    await del(old.url);
  }

  await put(SETTINGS_PATH_PREFIX + "-" + Date.now() + ".json", JSON.stringify({ autoplay: autoplay, intervalMs: intervalMs }), {
    access: "public",
    contentType: "application/json"
  });

  res.status(200).json({ autoplay: autoplay, intervalMs: intervalMs });
}

function checkPassword(req) {
  const provided = req.headers["x-admin-password"];
  const expected = process.env.ADMIN_PASSWORD;
  return expected && provided === expected;
}
