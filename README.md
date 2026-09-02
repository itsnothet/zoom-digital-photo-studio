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
│                        galleries, lightbox — fetches photos from
│                        /api/photos and /api/site-photos
├── admin.html           The photo manager — go here to add/remove ANY
│                          photo on the site
├── api/
│   ├── photos.js         Backend for the catalogue — lists, uploads, and
│   │                      deletes gallery photos (many per category)
│   └── site-photos.js     Backend for every other photo spot on the
│                          site — hero, about, service cards (one photo
│                          per spot, uploading replaces it)
├── package.json          Tells Vercel to install the one library both
│                          backend files need (@vercel/blob)
├── assets/
│   └── icons/favicon.svg
├── robots.txt            Keeps admin.html out of search engines
└── README.md
```

## 📸 How the photo manager works

`admin.html` manages **every** photo on the site, in two sections:

- **Website Photos** — the hero banner (2 photos), the About section photo,
  and all 8 service card photos. Each of these is a single slot: uploading
  a new photo replaces whatever was there, and removing one reverts that
  spot to its gray placeholder. Backed by `api/site-photos.js`.
- **Catalogue Photos** — the 10 portfolio categories under "Explore Our
  Work". Each category can hold as many photos as you like, shown in its
  own gallery. Backed by `api/photos.js`.

Both backends store photos in **Vercel Blob** (Vercel's built-in file
storage — no database to set up) and share the same `ADMIN_PASSWORD`.
The moment you upload or delete a photo in `admin.html`, it's saved to
Blob storage immediately. The main website (`script.js`) asks
`/api/photos` and `/api/site-photos` for the current photos on every page
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
3. Under **Website Photos**, tap **"+ Add photo"** (or **"+ Change photo"**)
   on the hero, about, or any service card to set/replace that one photo.
   Tap the small **×** on a photo to remove it and go back to its
   placeholder.
4. Under **Catalogue Photos**, tap **"+ Add photo"** under any of the 10
   categories to add another photo to that gallery; tap **×** on a tile to
   remove it.
5. Switch back to your actual website and refresh — changes are already
   there.

Anyone with the password can manage photos; nobody else can (viewing the
live website doesn't require it — only uploading/deleting does).

## ⚠️ Placeholders that still need replacing

1. **Logo** — the navbar/footer use a simple circular mark built in inline
   SVG (in `index.html`, search for `<span class="brand-mark">`), not the
   studio's real logo. This is a vector mark, not a photo, so it isn't
   managed by `admin.html`. Once you have the logo file, drop it at
   `assets/logo.png` and swap those spans for
   `<img src="assets/logo.png" alt="Zoom Digital Photo Studio" class="brand-logo-img">`
   (add `.brand-logo-img { height: 40px; width: auto; }` to `style.css`).

2. **Reviews** — shows only the 4.8★ rating and a link to the Google
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
