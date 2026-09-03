// ============================================================================
// SITE CONTENT BACKEND — lets admin.html edit the homepage's text: the hero
// heading/paragraph, the About section text, and the Google review rating
// (since a review rating obviously isn't a fixed number forever).
//
//   GET   /api/site-content          -> current text (falls back to the
//                                        site's original wording for
//                                        anything never edited)
//   POST  /api/site-content          -> save new text (admin password
//                                        required, same header as every
//                                        other write on this site)
//
// Stored as one JSON file in the same Vercel Blob store everything else
// already uses.
// ============================================================================

const { list, put, del } = require("@vercel/blob");

const CONTENT_PATH_PREFIX = "content/site-content";

const DEFAULTS = {
  heroKicker: "Photography & videography studio in Ahmedabad",
  heroTitleLine1: "We capture moments.",
  heroTitleLine2: "You keep them forever.",
  heroCopy:
    "Zoom Digital Photo Studio has been photographing Ahmedabad's weddings, events, " +
    "portraits and products with a steady, professional hand — so the pictures still " +
    "feel right years from now.",
  aboutTitle: "Steady, professional photography, every time",
  aboutP1:
    "Zoom Digital Photo Studio works with individuals, families, couples and " +
    "businesses across Ahmedabad — from a same-day passport photo to a full " +
    "wedding weekend. Every booking gets the same attention: careful lighting, " +
    "steady composition, and a final set of images the client is genuinely happy to keep.",
  aboutP2:
    "The studio handles documentation photography, portraits, event coverage " +
    "and product photography for catalogues and websites, backed by in-house " +
    "printing, framing and album design — so a shoot doesn't end at the camera.",
  reviewRating: "4.8"
};

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
  const { blobs } = await list({ prefix: CONTENT_PATH_PREFIX });
  res.setHeader("Cache-Control", "no-store");

  if (!blobs.length) {
    res.status(200).json(DEFAULTS);
    return;
  }

  const latest = blobs.sort(function (a, b) {
    return new Date(b.uploadedAt) - new Date(a.uploadedAt);
  })[0];
  const response = await fetch(latest.url);
  const saved = await response.json();

  const merged = {};
  Object.keys(DEFAULTS).forEach(function (key) {
    merged[key] = (typeof saved[key] === "string" && saved[key].trim()) ? saved[key] : DEFAULTS[key];
  });
  res.status(200).json(merged);
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

  const toSave = {};
  Object.keys(DEFAULTS).forEach(function (key) {
    var val = body[key];
    if (typeof val === "string" && val.trim()) {
      toSave[key] = val.trim().slice(0, key === "reviewRating" ? 4 : 600);
    } else {
      toSave[key] = DEFAULTS[key];
    }
  });

  // Keep the rating looking like a rating (a plain number, 0–5).
  var rating = parseFloat(toSave.reviewRating);
  toSave.reviewRating = (isNaN(rating) ? 4.8 : Math.max(0, Math.min(5, rating))).toFixed(1);

  const { blobs } = await list({ prefix: CONTENT_PATH_PREFIX });
  for (const old of blobs) {
    await del(old.url);
  }
  await put(CONTENT_PATH_PREFIX + "-" + Date.now() + ".json", JSON.stringify(toSave), {
    access: "public",
    contentType: "application/json"
  });

  res.status(200).json(toSave);
}

function checkPassword(req) {
  const provided = req.headers["x-admin-password"];
  const expected = process.env.ADMIN_PASSWORD;
  return expected && provided === expected;
}
