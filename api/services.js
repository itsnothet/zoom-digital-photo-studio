// ============================================================================
// SERVICES BACKEND — lets admin.html add, rename, replace the photo of, and
// delete Services carousel entries — instead of a fixed list of 8.
//
//   GET    /api/services                          -> [{id, name, url}, ...]
//   POST   /api/services?name=...                 -> create a new service
//                                                     (name in query, photo
//                                                     bytes in the body)
//   POST   /api/services?id=...&name=...          -> rename an existing
//                                                     service (empty body)
//   POST   /api/services?id=...&name=...  + body  -> rename AND replace its
//                                                     photo in one go
//   DELETE /api/services?id=...                    -> remove a service
//                                                     entirely
//
// The 8 services this site launched with (Passport, Visa, Wedding, ...) are
// treated as defaults built into this file, not hard-saved anywhere — so if
// nobody has ever added/renamed/deleted a service, GET just returns those 8
// automatically. The moment admin.html changes anything, the full resulting
// list gets saved to Blob storage and becomes the new source of truth.
//
// Photos already uploaded for those 8 through the OLD /api/site-photos
// system (paths like "site/service-passport/...") keep working automatically
// — this file checks there as a fallback so nothing "disappears". Any new
// upload (through this endpoint) is stored under "services/<id>/..." instead.
// ============================================================================

const { list, put, del } = require("@vercel/blob");

const LIST_PATH_PREFIX = "services/_list";

const DEFAULT_SERVICES = [
  { id: "service-passport", name: "Passport Photos" },
  { id: "service-visa", name: "Visa Photos" },
  { id: "service-wedding", name: "Wedding Photography" },
  { id: "service-frames", name: "Photo Frames" },
  { id: "service-videography", name: "Event Videography" },
  { id: "service-albums", name: "Event Albums" },
  { id: "service-portraits", name: "Professional Photoshoot" },
  { id: "service-product", name: "Product Photography" }
];

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return await handleList(req, res);
    }
    if (req.method === "POST") {
      return await handleSave(req, res);
    }
    if (req.method === "DELETE") {
      return await handleDelete(req, res);
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
};

async function getEffectiveList() {
  const { blobs } = await list({ prefix: LIST_PATH_PREFIX });
  if (!blobs.length) return DEFAULT_SERVICES.slice();

  const latest = blobs.sort(function (a, b) {
    return new Date(b.uploadedAt) - new Date(a.uploadedAt);
  })[0];
  const response = await fetch(latest.url);
  const saved = await response.json();
  return Array.isArray(saved) ? saved : DEFAULT_SERVICES.slice();
}

async function saveList(entries) {
  const { blobs } = await list({ prefix: LIST_PATH_PREFIX });
  for (const old of blobs) {
    await del(old.url);
  }
  await put(LIST_PATH_PREFIX + "-" + Date.now() + ".json", JSON.stringify(entries), {
    access: "public",
    contentType: "application/json"
  });
}

async function resolvePhotoUrl(id) {
  // New uploads (through this file) live here.
  const fresh = await list({ prefix: "services/" + id + "/" });
  if (fresh.blobs.length) {
    return fresh.blobs.sort(function (a, b) {
      return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    })[0].url;
  }
  // Fall back to the old single-slot system, for the original 8 services.
  const legacy = await list({ prefix: "site/" + id + "/" });
  if (legacy.blobs.length) {
    return legacy.blobs.sort(function (a, b) {
      return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    })[0].url;
  }
  return null;
}

async function handleList(req, res) {
  const entries = await getEffectiveList();
  const withUrls = await Promise.all(entries.map(async function (entry) {
    return { id: entry.id, name: entry.name, url: await resolvePhotoUrl(entry.id) };
  }));
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(withUrls);
}

async function handleSave(req, res) {
  if (!checkPassword(req)) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }

  const rawName = (req.query.name || "").toString().trim().slice(0, 60);
  let id = req.query.id;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const fileBuffer = Buffer.concat(chunks);

  const entries = await getEffectiveList();

  if (id) {
    const existing = entries.find(function (e) { return e.id === id; });
    if (!existing) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    if (rawName) existing.name = rawName;
    if (fileBuffer.length > 0) {
      await clearServicePhoto(id);
      const filename = req.query.filename || "photo-" + Date.now() + ".jpg";
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      await put("services/" + id + "/" + Date.now() + "-" + safeName, fileBuffer, {
        access: "public",
        contentType: req.headers["content-type"] || "image/jpeg"
      });
    }
    await saveList(entries);
    res.status(200).json({ id: id, name: existing.name, url: await resolvePhotoUrl(id) });
    return;
  }

  // Creating a new service — needs both a name and a photo.
  if (!rawName) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  if (fileBuffer.length === 0) {
    res.status(400).json({ error: "Photo is required" });
    return;
  }

  id = "svc-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const filename = req.query.filename || "photo-" + Date.now() + ".jpg";
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  await put("services/" + id + "/" + Date.now() + "-" + safeName, fileBuffer, {
    access: "public",
    contentType: req.headers["content-type"] || "image/jpeg"
  });

  entries.push({ id: id, name: rawName });
  await saveList(entries);

  res.status(200).json({ id: id, name: rawName, url: await resolvePhotoUrl(id) });
}

async function handleDelete(req, res) {
  if (!checkPassword(req)) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }

  const id = req.query.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const entries = await getEffectiveList();
  const next = entries.filter(function (e) { return e.id !== id; });

  await clearServicePhoto(id);
  // Also clean up the legacy slot, if this was one of the original 8.
  const legacy = await list({ prefix: "site/" + id + "/" });
  for (const old of legacy.blobs) {
    await del(old.url);
  }

  await saveList(next);
  res.status(200).json({ deleted: true });
}

async function clearServicePhoto(id) {
  const { blobs } = await list({ prefix: "services/" + id + "/" });
  for (const old of blobs) {
    await del(old.url);
  }
}

function checkPassword(req) {
  const provided = req.headers["x-admin-password"];
  const expected = process.env.ADMIN_PASSWORD;
  return expected && provided === expected;
}
