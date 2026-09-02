# Zoom Digital Photo Studio — Website

A single-page, static website for Zoom Digital Photo Studio (Ahmedabad, Gujarat).
Pure HTML/CSS/JS — no database, no traditional backend. Photos are managed
through a free drag-and-drop admin page (Decap CMS), which logs in via
GitHub through two tiny Vercel serverless functions (`api/auth.js` and
`api/callback.js`) — this is the only "server" involved, and it only ever
handles the login handshake, nothing else.

## What's here

```
zoom-digital-photo-studio/
├── index.html          All page content and structured data
├── style.css           All styling (design tokens at the top)
├── script.js           Navigation, scroll animations, stats counter,
│                        catalogue rendering, category galleries, lightbox
├── admin/
│   ├── index.html       Loads the photo-manager admin page
│   └── config.yml        Defines the 10 categories the admin page edits
├── api/
│   ├── auth.js           Starts GitHub login for the admin page
│   └── callback.js       Finishes GitHub login for the admin page
├── data/
│   └── catalogue-images.json   Photo lists per category (edited by /admin)
├── assets/
│   ├── icons/favicon.svg
│   └── images/          (empty — see "Adding real photos" below)
├── robots.txt           Keeps /admin out of search engines
└── README.md
```

## 📸 Adding photos through the admin page (recommended)

A drag-and-drop photo manager lives at **yoursite.vercel.app/admin**. This
is the easiest way to add catalogue photos — no code editing required.
One-time setup, then it's ready to use for good.

**One-time setup (a few minutes):**

1. Make sure this whole project (including the `api` folder) is pushed to
   your GitHub repo, and that repo is imported into Vercel as the project
   you're deploying — no special build settings needed, it's still static.
2. Create a **GitHub OAuth App** so the admin page is allowed to log in with
   GitHub:
   - Go to **github.com → Settings → Developer settings → OAuth Apps → New OAuth App**
   - **Homepage URL:** your Vercel site address, e.g. `https://zoom-digital-photo-studio.vercel.app`
   - **Authorization callback URL:** the same address + `/api/callback`, e.g.
     `https://zoom-digital-photo-studio.vercel.app/api/callback`
   - Click **Register application**
   - You'll get a **Client ID**. Click **Generate a new client secret** to get
     a **Client Secret** too — copy both somewhere safe.
3. In **Vercel → your project → Settings → Environment Variables**, add two:
   - `OAUTH_CLIENT_ID` = the Client ID from step 2
   - `OAUTH_CLIENT_SECRET` = the Client Secret from step 2
   - Redeploy the project once after adding these (Vercel → Deployments →
     "..." on the latest one → Redeploy) so they take effect.
4. Open `admin/config.yml` and fill in the two placeholders near the top:
   - `repo:` → your GitHub username slash repo name, e.g.
     `itsnothet/zoom-digital-photo-studio`
   - `base_url:` → your Vercel site address, e.g.
     `https://zoom-digital-photo-studio.vercel.app`
   - Commit that change to GitHub (Vercel redeploys automatically).

**Using it day to day:**

1. Go to `yoursite.vercel.app/admin`, click **Login with GitHub**, approve it.
2. You'll see the 10 categories (Wedding Photography, Event Photography, etc.).
3. Drag photos into the category they belong to, or click to browse files.
4. Click **Save**. The change is committed to GitHub automatically and the
   live site updates within about a minute (Vercel rebuilds it for you).
5. Reorder or delete photos the same way — just re-save.

No coding, FTP, or file renaming needed — the admin page writes to
`data/catalogue-images.json` and uploads photos into `assets/images/uploads/`
for you. Only people you'd let log into that GitHub account (or repo
collaborators) can use the admin page — GitHub itself is the "who's allowed
in" check.

## ⚠️ Placeholders that still need replacing

No logo file or studio photographs have been supplied with this project, so
the site ships with clearly-marked stand-ins instead of inventing fake ones:

1. **Logo** — the navbar/footer currently use a simple circular mark built in
   inline SVG (in `index.html`, look for `<span class="brand-mark">`), not the
   studio's real logo. Once you have the official logo file:
   - Drop it at `assets/logo.png`
   - Replace the two `<span class="brand-mark">...</span><span class="brand-text">...</span>`
     blocks with `<img src="assets/logo.png" alt="Zoom Digital Photo Studio" class="brand-logo-img">`
   - Add a `.brand-logo-img { height: 40px; width: auto; }` rule in `style.css`

2. **Hero, About and Services photos** — these are textured gray placeholder
   blocks with a text label, not stock photos pretending to be studio work.
   To add real photos, put image files in `assets/images/` and replace the
   relevant `<div class="... placeholder-photo" data-label="...">` with an
   `<img src="assets/images/your-file.jpg" alt="...">`, keeping the existing
   class names so the current CSS (aspect ratios, hover zoom, hero layering)
   still applies. (These three spots aren't managed by the admin page —
   only catalogue photos are.)

3. **Catalogue photos** — add these through **/admin** (see above). If you'd
   rather edit by hand instead, open `data/catalogue-images.json` and add
   file paths to the matching category's array, e.g.
   `"wedding-photography": ["assets/images/wedding-photography/01.jpg"]`,
   then place the matching files under `assets/images/`. Categories with no
   photos yet automatically show numbered placeholder tiles in their gallery,
   so you can fill categories in one at a time either way.

4. **Reviews** — the Reviews section shows only the 4.8★ rating and a link
   to the Google Business Profile — no review count and no invented customer
   quotes, by design.

## One place to update the Google Business link

The "View Google Reviews" button and the map/directions links currently point
to a Google Maps **search** for the business name and address, which works
immediately with no API key. If you have the studio's exact Google Business
Profile URL, search `id="googleReviewsBtn"` in `index.html` and swap its
`href`, and do the same for the two `Get Directions` / map links.

## Editable business details

Phone, address and hours appear in three places — the Contact section, the
footer, and the `tel:` / WhatsApp links — plus once more in the JSON-LD
structured data block near the top of `<head>`. Update all of them together
if any of these details change.

## Deployment

This is a static site hosted on Vercel. The `api/auth.js` and
`api/callback.js` files are small serverless functions Vercel runs
automatically — no configuration needed beyond the environment variables
in the setup steps above.

1. Push this project (including the `api` folder) to a GitHub repo.
2. In Vercel: **Add New → Project → Import** that repo, leave all build
   settings at their defaults, and deploy.
3. Follow the "Adding photos through the admin page" steps above to turn
   on `/admin`.

No database and no server of ours beyond those two small login-handshake
functions — everything else is plain static files.

## Browser support notes

- Uses `IntersectionObserver`, `aspect-ratio`, and `fetch` (all modern
  browsers). The catalogue reads `data/catalogue-images.json` over `fetch`,
  which requires the site to be served over `http(s)://` — opening
  `index.html` directly from disk (`file://`) will show placeholder photos
  only, since local `fetch` of that file is blocked by the browser. This
  works normally once deployed, or when served locally via any simple local
  web server.
- Respects `prefers-reduced-motion`: the hero's photo drift, entrance/scroll
  animations, and the animated rating counter are all skipped for users who
  have that OS setting on.
- The Google Map embed uses a no-API-key `output=embed` URL; if it's ever
  blocked, the "Get Directions" buttons still work independently.
