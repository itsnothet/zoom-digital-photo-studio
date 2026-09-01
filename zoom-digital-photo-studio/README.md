# Zoom Digital Photo Studio — Website

A single-page, static website for Zoom Digital Photo Studio (Ahmedabad, Gujarat).
Pure HTML/CSS/JS — no build step, no custom backend, no database, no server
code of ours. Photos are managed through a free drag-and-drop admin page
(Decap CMS) backed by Netlify's built-in Identity + Git Gateway — the site
stays 100% static.

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
├── data/
│   └── catalogue-images.json   Photo lists per category (edited by /admin)
├── assets/
│   ├── icons/favicon.svg
│   └── images/          (empty — see "Adding real photos" below)
├── robots.txt           Keeps /admin out of search engines
└── README.md
```

## 📸 Adding photos through the admin page (recommended)

A drag-and-drop photo manager lives at **yoursite.com/admin**. This is the
easiest way to add catalogue photos — no code editing required. One-time
setup, then it's ready to use for good.

**One-time setup (a few minutes):**

1. Deploy this site to Netlify **via a connected Git repository** (GitHub,
   GitLab, or Bitbucket) — not the drag-and-drop folder upload. The admin
   page needs Netlify's Git Gateway, which only works with a Git-connected
   site. Push this folder to a new repo, then "Import an existing project"
   in Netlify and point it at that repo (build command: none, publish
   directory: `/`).
2. In the Netlify dashboard for the site: **Site configuration → Identity**
   → **Enable Identity**.
3. Still under Identity: **Services → Git Gateway → Enable Git Gateway**.
4. Under **Identity → Invite users**, invite yourself (or whoever should be
   able to add photos) by email. They'll get an email link to set a password.

**Using it day to day:**

1. Go to `yoursite.com/admin`, log in.
2. You'll see the 10 categories (Wedding Photography, Event Photography, etc.).
3. Drag photos into the category they belong to, or click to browse files.
4. Click **Save**. The change is committed automatically and the live site
   updates within about a minute (Netlify rebuilds it for you).
5. Reorder or delete photos the same way — just re-save.

No coding, FTP, or file renaming needed — the admin page writes to
`data/catalogue-images.json` and uploads photos into `assets/images/uploads/`
for you.

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

This is a fully static site — the admin page is the only part that needs a
Git-connected Netlify deploy (see the setup steps above); everything else
works the same either way.

1. **To use the photo-manager admin page:** push this folder to a GitHub/
   GitLab/Bitbucket repo and import it into Netlify, then enable Identity +
   Git Gateway as described above.
2. **If you don't need the admin page:** drag the folder straight onto
   Netlify's deploy area — still works, you'd just edit
   `data/catalogue-images.json` by hand instead.

No environment variables, API keys, database, or server of ours are required
either way — Netlify Identity and Git Gateway are Netlify's own free,
built-in services.

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
