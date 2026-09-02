(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById("siteHeader");
  function updateHeader() {
    if (window.scrollY > 40) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- Mobile menu ---------- */
  var menuToggle = document.getElementById("menuToggle");
  var mobileNav = document.getElementById("mobileNav");
  var mobileBackdrop = document.getElementById("mobileNavBackdrop");

  function openMenu() {
    mobileNav.classList.add("is-open");
    mobileBackdrop.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    mobileNav.classList.remove("is-open");
    mobileBackdrop.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  menuToggle.addEventListener("click", function () {
    var isOpen = mobileNav.classList.contains("is-open");
    if (isOpen) { closeMenu(); } else { openMenu(); }
  });
  mobileBackdrop.addEventListener("click", closeMenu);
  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Hero entrance ---------- */
  var hero = document.querySelector(".hero");
  requestAnimationFrame(function () {
    setTimeout(function () {
      hero.classList.add("is-ready");
    }, 120);
  });

  /* ---------- Scroll cue ---------- */
  var scrollCue = document.getElementById("scrollCue");
  scrollCue.addEventListener("click", function () {
    var about = document.getElementById("about");
    if (about) about.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  /* ---------- Scroll-triggered reveals ---------- */
  var revealTargets = document.querySelectorAll(".reveal-up, .reveal-fade");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Active nav link on scroll ---------- */
  var sections = ["home", "about", "services", "portfolio", "reviews", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navLinks = document.querySelectorAll(".main-nav a");

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      var match = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", match);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (sec) { navObserver.observe(sec); });
  }

  /* ---------- Animated stats ---------- */
  var statEls = document.querySelectorAll(".stat[data-value]");
  function animateStat(el) {
    var target = parseFloat(el.getAttribute("data-value"));
    var decimals = parseInt(el.getAttribute("data-decimals"), 10) || 0;
    var countEl = el.querySelector(".stat-count");
    if (!countEl) return;

    if (prefersReducedMotion) {
      countEl.textContent = target.toFixed(decimals);
      return;
    }

    var duration = 1200;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = target * eased;
      countEl.textContent = current.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(step);
      else countEl.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && statEls.length) {
    var statObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateStat(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    statEls.forEach(function (el) { statObserver.observe(el); });
  } else {
    statEls.forEach(animateStat);
  }

  /* ---------- Catalogue data ---------- */
  // Ten categories the catalogue and its galleries are generated from.
  // `count` is the number of placeholder photo slots shown in a category's
  // gallery until real photos exist for it. Real photos are added via the
  // admin page at /admin (see README.md) and loaded from
  // Real photos are added via /admin.html and served live from
  // /api/photos below — this array only holds layout info,
  // never edit it just to add photos.
  var catalogueData = [
    { slug: "wedding-photography", title: "Wedding Photography", span: "span-tall", count: 6 },
    { slug: "event-photography", title: "Event Photography", span: "", count: 6 },
    { slug: "corporate-events", title: "Corporate Events", span: "span-wide", count: 4 },
    { slug: "outdoor-photoshoot", title: "Outdoor Photoshoot", span: "", count: 5 },
    { slug: "professional-photoshoot", title: "Professional Photoshoot", span: "span-tall", count: 5 },
    { slug: "photo-framing-collage", title: "Photo Framing & Collage Frame", span: "", count: 4 },
    { slug: "passport-visa-photo", title: "Passport & Visa Photo", span: "span-wide", count: 3 },
    { slug: "enlargement", title: "Enlargement", span: "", count: 3 },
    { slug: "led-photo-frame", title: "LED Photo Frame", span: "", count: 3 },
    { slug: "acrylic-frame", title: "Acrylic Frame", span: "span-tall", count: 3 }
  ];

  /* ---------- Render catalogue grid ---------- */
  var catalogueGrid = document.getElementById("catalogueGrid");

  function renderCatalogue() {
    catalogueGrid.innerHTML = "";
    catalogueData.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.className = "catalogue-item reveal-up" + (cat.span ? " " + cat.span : "");
      btn.setAttribute("data-slug", cat.slug);
      btn.setAttribute("data-label", cat.title);

      var coverHtml;
      if (cat.images && cat.images.length) {
        // Real photo available — use it as the card cover.
        coverHtml = '<img class="catalogue-cover" src="' + cat.images[0] + '" alt="' + cat.title + '" loading="lazy">';
      } else {
        coverHtml = '<span class="catalogue-cover placeholder-photo"></span>';
      }

      btn.innerHTML =
        coverHtml +
        '<span class="catalogue-caption"><span>' + cat.title + '</span>' +
        '<span class="arrow" aria-hidden="true">&rarr;</span></span>';
      btn.addEventListener("click", function () { openGallery(cat, btn); });
      catalogueGrid.appendChild(btn);
    });

    // Newly-injected cards need the same scroll-reveal treatment as the rest
    // of the page, so (re)attach the observer to them here.
    var catalogueRevealTargets = catalogueGrid.querySelectorAll(".reveal-up");
    if ("IntersectionObserver" in window) {
      var catalogueRevealObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );
      catalogueRevealTargets.forEach(function (el) { catalogueRevealObserver.observe(el); });
    } else {
      catalogueRevealTargets.forEach(function (el) { el.classList.add("is-visible"); });
    }
  }

  /* ---------- Lightbox (full-screen single photo) ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxFrame = document.getElementById("lightboxFrame");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxLastFocused = null;

  function openLightbox(label, returnFocusTo) {
    lightboxImg.hidden = true;
    lightboxImg.removeAttribute("src");
    lightboxFrame.classList.add("placeholder-photo");
    lightboxFrame.setAttribute("data-label", label);
    lightboxCaption.textContent = label;
    lightboxLastFocused = returnFocusTo || document.activeElement;
    lightbox.hidden = false;
    lightboxClose.focus();
  }
  function openLightboxImage(src, label, returnFocusTo) {
    lightboxFrame.classList.remove("placeholder-photo");
    lightboxFrame.removeAttribute("data-label");
    lightboxImg.src = src;
    lightboxImg.alt = label;
    lightboxImg.hidden = false;
    lightboxCaption.textContent = label;
    lightboxLastFocused = returnFocusTo || document.activeElement;
    lightbox.hidden = false;
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    if (lightboxLastFocused) lightboxLastFocused.focus();
  }
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  /* ---------- Category gallery overlay ---------- */
  var galleryOverlay = document.getElementById("galleryOverlay");
  var galleryTitle = document.getElementById("galleryTitle");
  var galleryGrid = document.getElementById("galleryGrid");
  var galleryBack = document.getElementById("galleryBack");
  var galleryClose = document.getElementById("galleryClose");
  var galleryLastFocused = null;

  function openGallery(cat, triggerEl) {
    galleryTitle.textContent = cat.title;
    galleryGrid.innerHTML = "";

    if (cat.images && cat.images.length) {
      // Real photos supplied for this category.
      cat.images.forEach(function (src, index) {
        var label = cat.title + " " + (index + 1);
        var tile = document.createElement("button");
        tile.className = "gallery-tile";
        tile.setAttribute("aria-label", "View photo: " + label);
        tile.innerHTML = '<img src="' + src + '" alt="' + label + '" loading="lazy">';
        tile.addEventListener("click", function () { openLightboxImage(src, label, tile); });
        galleryGrid.appendChild(tile);
      });
    } else {
      // No real photos yet — numbered placeholder slots, ready to be filled in.
      for (var i = 1; i <= cat.count; i++) {
        var placeholderLabel = cat.title + " " + i;
        var placeholderTile = document.createElement("button");
        placeholderTile.className = "gallery-tile placeholder-photo";
        placeholderTile.setAttribute("data-label", placeholderLabel);
        placeholderTile.setAttribute("aria-label", "View photo: " + placeholderLabel);
        placeholderTile.addEventListener("click", function (labelForTile, tileForLabel) {
          return function () { openLightbox(labelForTile, tileForLabel); };
        }(placeholderLabel, placeholderTile));
        galleryGrid.appendChild(placeholderTile);
      }
    }

    galleryLastFocused = triggerEl || document.activeElement;
    galleryOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    galleryClose.focus();
  }
  function closeGallery() {
    galleryOverlay.hidden = true;
    document.body.style.overflow = "";
    if (galleryLastFocused) galleryLastFocused.focus();
  }

  galleryBack.addEventListener("click", closeGallery);
  galleryClose.addEventListener("click", closeGallery);

  /* ---------- Load real photos (added via /admin.html) ---------- */
  // /api/photos is the live backend — it returns { slug: [{url, uploadedAt}] }
  // for every category. This is a real API call (not a file baked into the
  // deploy), so a photo uploaded or removed in the admin page shows up here
  // on the very next page load — no rebuild needed. If the request fails for
  // any reason, the catalogue and galleries simply fall back to their
  // placeholder slots.
  renderCatalogue();
  fetch("/api/photos", { cache: "no-store" })
    .then(function (res) { return res.ok ? res.json() : {}; })
    .then(function (photosBySlug) {
      catalogueData.forEach(function (cat) {
        var photos = photosBySlug[cat.slug];
        if (Array.isArray(photos) && photos.length) {
          cat.images = photos.map(function (p) { return p.url; });
        }
      });
      renderCatalogue();
    })
    .catch(function () { /* backend not reachable yet — placeholders already rendered */ });

  /* ---------- Shared keyboard handling for overlays ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!lightbox.hidden) { closeLightbox(); return; }
    if (!galleryOverlay.hidden) { closeGallery(); }
  });
})();
