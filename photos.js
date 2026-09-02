// ============================================================================
// THE BACKEND — one file, three jobs:
//   GET     /api/photos              -> list every photo, grouped by category
//   POST    /api/photos?slug=...     -> upload a photo into that category
//   DELETE  /api/photos?url=...      -> remove one photo
//
// Photos are stored in Vercel Blob storage (Vercel's own free file storage —
// no database, nothing else to set up beyond connecting a Blob store in the
// Vercel dashboard). Every upload/delete is instant: the frontend re-fetches
// this same endpoint, so the website always shows the current photos with no
// rebuild or redeploy needed.
//
// A single shared password (the ADMIN_PASSWORD environment variable) protects
// uploading and deleting. Anyone can view (GET) since the photos are public
// on the live site anyway; only POST/DELETE check the password.
// ============================================================================

const { list, put, del } = require("@vercel/blob");

const CATEGORY_SLUGS = [
  "wedding-photography",
  "event-photography",
  "corporate-events",
  "outdoor-photoshoot",
  "professional-photoshoot",
  "photo-framing-collage",
  "passport-visa-photo",
  "enlargement",
  "led-photo-frame",
  "acrylic-frame"
];

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return await handleList(req, res);
    }
    if (req.method === "POST") {
      return await handleUpload(req, res);
    }
    if (req.method === "DELETE") {
      return await handleDelete(req, res);
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
};

async function handleList(req, res) {
  const { blobs } = await list({ prefix: "photos/" });

  const bySlug = {};
  CATEGORY_SLUGS.forEach(function (slug) { bySlug[slug] = []; });

  blobs.forEach(function (blob) {
    // pathname looks like: photos/<slug>/<filename>
    const parts = blob.pathname.split("/");
    const slug = parts[1];
    if (bySlug[slug]) {
      bySlug[slug].push({ url: blob.url, uploadedAt: blob.uploadedAt });
    }
  });

  // Newest photos first within each category.
  Object.keys(bySlug).forEach(function (slug) {
    bySlug[slug].sort(function (a, b) {
      return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    });
  });

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(bySlug);
}

async function handleUpload(req, res) {
  if (!checkPassword(req)) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }

  const slug = req.query.slug;
  if (!CATEGORY_SLUGS.includes(slug)) {
    res.status(400).json({ error: "Unknown category" });
    return;
  }

  const filename = req.query.filename || "photo-" + Date.now() + ".jpg";
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathname = "photos/" + slug + "/" + Date.now() + "-" + safeName;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const fileBuffer = Buffer.concat(chunks);

  const blob = await put(pathname, fileBuffer, {
    access: "public",
    contentType: req.headers["content-type"] || "image/jpeg"
  });

  res.status(200).json({ url: blob.url });
}

async function handleDelete(req, res) {
  if (!checkPassword(req)) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }

  const url = req.query.url;
  if (!url) {
    res.status(400).json({ error: "Missing url" });
    return;
  }

  await del(url);
  res.status(200).json({ deleted: true });
}

function checkPassword(req) {
  const provided = req.headers["x-admin-password"];
  const expected = process.env.ADMIN_PASSWORD;
  return expected && provided === expected;
}
