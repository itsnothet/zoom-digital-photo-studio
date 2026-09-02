const { list, put, del } = require("@vercel/blob");

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
