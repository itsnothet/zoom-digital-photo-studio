# Zoom Digital Photo Studio — Website

A static website for Zoom Digital Photo Studio (Ahmedabad, Gujarat), with a
simple password-protected page for uploading catalogue photos. No GitHub
login, no OAuth app, no database — just one password you choose yourself.

## What's here

```
zoom-digital-photo-studio/
├── index.html          The live website
├── style.css           All styling
├── script.js           Navigation, animations, catalogue rendering,
│                        galleries, lightbox — fetches photos from /api/photos
├── admin.html           The photo manager — go here to add/remove photos
├── api/
│   └── photos.js         The backend — lists, uploads, and deletes photos
├── package.json          Tells Vercel to install the one library the
│                          backend needs (@vercel/blob)
├── assets/
│   └── icons/favicon.svg
├── robots.txt            Keeps admin.html out of search engines
└── README.md
```

## 📸 How the photo manager works

- **Frontend:** `admin.html` — a page with a password box and one upload
  button per category.
- **Backend:** `api/photos.js` — one file that lists, uploads, and deletes
  photos, storing them in **Vercel Blob** (Vercel's built-in file storage —
  no database to set up).
- **Connected automatically:** the moment you upload or delete a photo in
  `admin.html`, it's saved to Blob storage immediately. The main website
  (`script.js`) asks `/api/photos` for the current photo list on every page
  load — so changes appear on the live site right away, with no rebuild,
  no redeploy, no waiting.

## One-time setup (do this once)

1. **Push everything in this folder to your GitHub repo** — including
   `admin.html`, the `api` folder, and `package.json`. Vercel will pick up
   the new deploy automatically.

2. **Turn on Blob storage** (this is what actually stores the photos):
   - In Vercel, open your project → **Storage** tab
   - Tap **Create Database** → choose **Blob**
   - Give it any name → **Create**
   - Make sure it's connected to this project (Vercel does this by default)
   - This automatically adds an environment variable called
     `BLOB_READ_WRITE_TOKEN` to your project — **you don't need to copy or
     type anything for this part.**

3. **Set your password:**
   - Vercel → your project → **Settings** → **Environment Variables**
   - Add one: Key = `ADMIN_PASSWORD`, Value = any password you want
   - Save

4. **Redeploy once** so the new files and settings take effect:
   - Vercel → **Deployments** tab → tap **"..."** on the latest one →
     **Redeploy**

That's it — no GitHub OAuth app, no Client ID/Secret, no Identity settings.

## Using it day to day

1. Go to `yoursite.vercel.app/admin.html`
2. Type your password → **Unlock**
3. You'll see all 10 categories. Tap **"+ Add photo"** under any category,
   pick a photo from your phone/computer — it uploads immediately.
4. To remove a photo, tap the small **×** on its corner.
5. Switch back to your actual website and refresh — the photo is already
   there.

Anyone with the password can manage photos; nobody else can (viewing the
live website doesn't require it — only uploading/deleting does).

## ⚠️ Placeholders that still need replacing

1. **Logo** — the navbar/footer use a simple circular mark built in inline
   SVG (in `index.html`, search for `<span class="brand-mark">`), not the
   studio's real logo. Once you have the logo file, drop it at
   `assets/logo.png` and swap those spans for
   `<img src="assets/logo.png" alt="Zoom Digital Photo Studio" class="brand-logo-img">`
   (add `.brand-logo-img { height: 40px; width: auto; }` to `style.css`).

2. **Hero, About and Services photos** — these are textured gray
   placeholder blocks with a text label, not stock photos pretending to be
   studio work. These three spots aren't managed by `admin.html` — only
   catalogue photos are. To add real photos here, put image files in
   `assets/images/` and replace the relevant
   `<div class="... placeholder-photo" data-label="...">` with an
   `<img src="assets/images/your-file.jpg" alt="...">`, keeping the class
   names so the existing CSS still applies.

3. **Reviews** — shows only the 4.8★ rating and a link to the Google
   Business Profile — no review count, no invented customer quotes.

## One place to update the Google Business link

The "View Google Reviews" button and the map/directions links point to a
Google Maps **search** for the business name and address (works with no API
key). If you have the exact Google Business Profile URL, search
`id="googleReviewsBtn"` in `index.html` and swap its `href`, and do the same
for the two "Get Directions" / map links.

## Editable business details

Phone, address and hours appear in the Contact section, the footer, the
`tel:` / WhatsApp links, and once more in the JSON-LD structured data near
the top of `<head>` — update all of them together if these ever change.

## Browser support notes

- Uses `fetch`, which needs the site served over `http(s)://` — opening
  `index.html` directly from disk won't load real photos (placeholders
  will show instead). Works normally once deployed on Vercel.
- Respects `prefers-reduced-motion`: the hero's photo drift, entrance/scroll
  animations, and the animated rating counter are skipped for users with
  that OS setting on.
- The Google Map embed needs no API key; if it's ever blocked, "Get
  Directions" still works independently.
