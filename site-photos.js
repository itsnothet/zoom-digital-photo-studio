// ============================================================================
// SITE PHOTOS BACKEND — one file, three jobs, for the *single-photo* slots
// used elsewhere on the website (hero, about, service cards) — as opposed to
// api/photos.js, which manages the *catalogue* categories (many photos each,
// shown in a gallery).
//
//   GET     /api/site-photos              -> { slotKey: url, ... } for every
//                                             slot that currently has a photo
//   POST    /api/site-photos?slug=...     -> upload/replace the photo for
//                                             that slot (any previous photo
//                                             already in the slot is deleted
//                                             automatically — one photo per
//                                             slot, always)
//   DELETE  /api/site-photos?slug=...     -> remove the slot's photo,
//                                             reverting that spot on the
//                                             site back to its placeholder
//
// Same Vercel Blob storage as api/photos.js, same ADMIN_PASSWORD check on
// POST/DELETE. The only differences: a "site/" blob prefix instead of
// "photos/", and "one photo per slot" instead of "many photos per category".
// ============================================================================

const { list, put, del } = require("@vercel/blob");

// Every single-photo spot on the site that the admin page can manage.
// The key on the left is what admin.html and script.js both refer to it as.
const SITE_SLUGS = [
  "hero-main",
  "hero-side",
  "about-studio",
  "service-passport",
  "service-visa",
  "service-wedding",
  "service-frames",
  "service-videography",
  "service-albums",
  "service-portraits",
  "service-product"
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
  const { blobs } = await list({ prefix: "site/" });

  // pathname looks like: site/<slug>/<filename>
  // Normally there's at most one blob per slug (uploads replace the old
  // one), but if two ever exist, the newest wins.
  const bySlug = {};
  blobs.forEach(function (blob) {
    const parts = blob.pathname.split("/");
    const slug = parts[1];
    if (!SITE_SLUGS.includes(slug)) return;
    const existing = bySlug[slug];
    if (!existing || new Date(blob.uploadedAt) > new Date(existing.uploadedAt)) {
      bySlug[slug] = { url: blob.url, uploadedAt: blob.uploadedAt };
    }
  });

  const flat = {};
  Object.keys(bySlug).forEach(function (slug) { flat[slug] = bySlug[slug].url; });

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(flat);
}

async function handleUpload(req, res) {
  if (!checkPassword(req)) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }

  const slug = req.query.slug;
  if (!SITE_SLUGS.includes(slug)) {
    res.status(400).json({ error: "Unknown photo slot" });
    return;
  }

  // A slot holds exactly one photo — clear out whatever was there before.
  await clearSlot(slug);

  const filename = req.query.filename || "photo-" + Date.now() + ".jpg";
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathname = "site/" + slug + "/" + Date.now() + "-" + safeName;

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

  const slug = req.query.slug;
  if (!SITE_SLUGS.includes(slug)) {
    res.status(400).json({ error: "Unknown photo slot" });
    return;
  }

  await clearSlot(slug);
  res.status(200).json({ deleted: true });
}

async function clearSlot(slug) {
  const { blobs } = await list({ prefix: "site/" + slug + "/" });
  for (const old of blobs) {
    await del(old.url);
  }
}

function checkPassword(req) {
  const provided = req.headers["x-admin-password"];
  const expected = process.env.ADMIN_PASSWORD;
  return expected && provided === expected;
}
