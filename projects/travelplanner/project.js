/* ---------------------------------------------------------------------------
   project.js — CLEANED + CLICKABLE MINIMAP + STABLE DRAG + MOMENTUM
   - VSCode-style minimap
   - Scaled miniDoc
   - Frame drag with momentum
   - Click minimap -> jump to section or page
   - Parallax hero
   - Scroll indicator
   - Fade-in
---------------------------------------------------------------------------*/

(function(){

/* -------------------------
   METADATA
--------------------------*/
const meta = {
  title: "Travel Planner - Case Study",
  abstract: "A comprehensive travel-planning application inspired by MakeMyTrip, designed to streamline trip organization and itinerary management into one seamless experience.",
  role: "Experience Designer",
  tags: ["ux","ui","research","mobile","travel","app"],
  hero: "assets/hero.jpg"
};

/* -------------------------
   ELEMENTS
--------------------------*/
const hero = document.getElementById("hero");
const heroPanel = document.querySelector(".hero-panel");
const heroBg = document.getElementById("heroBg");

const projectBody = document.getElementById("projectBody");
const pdfContainer = document.getElementById("pdfContainer");
const pdfPages = [...document.querySelectorAll(".pdf-page")];

const miniMap = document.getElementById("miniMap");
const miniDoc = document.getElementById("miniDoc");
const miniPages = [...document.querySelectorAll(".mini-page")];
const miniFrame = document.getElementById("miniFrame");

const closeBtn = document.getElementById("closeBtn");
const scrollIndicator = document.getElementById("scrollIndicator");
const scrollLabel = document.getElementById("scrollLabel");
const scrollArrow = document.getElementById("scrollArrow");


/* -------------------------
   Close button with crossfade (referrer -> candidates -> history.back -> fallback)
   Adds a 400ms fade before navigation so the page crossfades smoothly.
--------------------------*/
if (typeof closeBtn !== 'undefined' && closeBtn) {

  // helper: fade body then navigate
  function fadeAndGo(url) {
    // ensure body transition present; add class to trigger opacity -> 0
    document.body.classList.add('page-fade-out');
    // wait for CSS to complete (match 400ms)
    setTimeout(() => {
      // final navigate
      window.location.href = url;
    }, 400);
  }

  closeBtn.addEventListener('click', async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    // 1) If we have a same-origin referrer, go there (preserves original navigation)
    try {
      if (document.referrer) {
        const ref = new URL(document.referrer);
        if (ref.origin === window.location.origin) {
          fadeAndGo(document.referrer);
          return;
        }
      }
    } catch (err) {
      // ignore malformed referrer
    }

    // 2) Try common candidate paths with a quick HEAD to check existence
    const candidates = [
      '/work.html',
      '/index.html#work',
      'index.html#work',
      '../work.html',
      '../../work.html'
    ];

    // attempt HEAD requests sequentially; the first successful found path will be used
    for (const p of candidates) {
      try {
        // Build absolute URL relative to current location
        const url = new URL(p, window.location.href).href;
        // Only same-origin HEADs will be allowed; catch failures silently
        const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        if (r && (r.status === 200 || r.status === 304)) {
          fadeAndGo(url);
          return;
        }
      } catch (err) {
        // ignore network or CORS errors and continue to next candidate
      }
    }

    // 3) If no candidate resolved, try history.back() (user came here from previous page)
    if (history.length > 1) {
      // fade out then call history.back() so transition plays
      document.body.classList.add('page-fade-out');
      setTimeout(() => {
        history.back();
      }, 400);
      // fallback: if history.back() didn't navigate after small delay, go to /work.html
      setTimeout(() => {
        if (!document.referrer && window.location.pathname.indexOf('work') === -1) {
          window.location.href = '/work.html';
        }
      }, 900);
      return;
    }

    // 4) Final fallback
    fadeAndGo('/work.html');
  });
}


/* -------------------------
   SAFETY: missing elements
--------------------------*/
if (!hero || !projectBody || !pdfContainer) {
  console.error("Core elements missing (hero/projectBody/pdfContainer). Aborting.");
  return;
}

/* -------------------------
   MOBILE DISABLE (behave lightly)
--------------------------*/
const isMobile = window.matchMedia("(max-width: 599px)").matches;
if (isMobile) {
  if (miniMap) miniMap.style.display = "none";
  populateHero();
  setupFadeIn();
  setupScrollIndicator();
  setupParallax();
  // on mobile we don't run minimap logic
  return;
}

/* -------------------------
   HERO POPULATION
--------------------------*/
function populateHero() {
  const titleEl = document.getElementById("heroTitle");
  const absEl = document.getElementById("metaAbstract");
  const roleEl = document.getElementById("metaRole");
  const tagWrap = document.getElementById("metaTags");

  if (titleEl) titleEl.textContent = meta.title;
  if (absEl) absEl.textContent = meta.abstract;
  if (roleEl) roleEl.textContent = meta.role;
  if (heroBg) heroBg.style.backgroundImage = `url(${meta.hero})`;

  if (tagWrap && meta.tags && meta.tags.length) {
    tagWrap.innerHTML = ""; // reset
    meta.tags.forEach(t => {
      const s = document.createElement("span");
      s.textContent = t;
      tagWrap.appendChild(s);
    });
  }
}
populateHero();

/* -------------------------
   FADE-IN OBSERVER
--------------------------*/
function setupFadeIn() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  }, { threshold: 0.12 });

  pdfPages.forEach(p => io.observe(p));
  const figma = document.getElementById("figmaEmbed");
  if (figma) io.observe(figma);
}
setupFadeIn();

/* -------------------------
   SCROLL INDICATOR
--------------------------*/
function updateScrollIndicator() {
  if (!scrollLabel || !scrollArrow) return;
  const heroH = hero.offsetHeight;
  if (window.scrollY < heroH - 50) {
    scrollLabel.textContent = "Scroll down";
    scrollArrow.textContent = "↓";
  } else {
    scrollLabel.textContent = "Back to top";
    scrollArrow.textContent = "↑";
  }
}

function setupScrollIndicator() {
  if (!scrollIndicator || !pdfContainer) return;
  scrollIndicator.onclick = () => {
    const heroH = hero.offsetHeight;
    if (window.scrollY < heroH - 50) {
      pdfContainer.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
}
setupScrollIndicator();

/* -------------------------
   PARALLAX HERO
--------------------------*/
function applyParallax() {
  const heroH = hero.offsetHeight;
  const y = window.scrollY;
  if (y <= heroH) {
    const p = y / heroH;
    if (heroBg) heroBg.style.transform = `translateY(${p * 60}px)`;
    if (heroPanel) heroPanel.style.transform = `translateY(${p * 25}px)`;
  }
}

/* -------------------------
   MINIMAP: scale logic
--------------------------*/
function applyMiniMapScale() {
  if (!miniMap || !miniDoc) return;
  const availH = miniMap.clientHeight || 1;
  const docH = miniDoc.scrollHeight || 1;

  let scale = availH / docH;
  if (scale > 1) scale = 1;
  miniDoc.style.transformOrigin = "top left";
  miniDoc.style.transform = `scale(${scale})`;
  miniDoc.dataset.scale = scale;
  computeFrame();
}

/* -------------------------
   MINIMAP: frame math (maps window.scroll -> frame)
--------------------------*/
function computeFrame() {
  if (!miniMap || !miniDoc || !miniFrame) return;

  const bodyStart = projectBody.offsetTop;
  const bodyHeight = projectBody.scrollHeight;
  const viewportH = window.innerHeight;

  // hide until user enters body
  if (window.scrollY < bodyStart - 10) {
    document.body.classList.add("not-in-body");
    document.body.classList.remove("in-body");
    return;
  } else {
    document.body.classList.remove("not-in-body");
    document.body.classList.add("in-body");
  }

  const totalScrollable = Math.max(0, bodyHeight - viewportH);
  if (totalScrollable === 0) {
    // If no scrollable content, just set frame to fill miniDoc visually
    const scale = parseFloat(miniDoc.dataset.scale || 1);
    const scaledMiniH = miniDoc.scrollHeight * scale;
    miniFrame.style.top = "0px";
    miniFrame.style.height = Math.max(24, scaledMiniH) + "px";
    return;
  }

  const scale = parseFloat(miniDoc.dataset.scale || 1);
  const scaledMiniH = miniDoc.scrollHeight * scale;

  // frame height proportional to viewport/bodyHeight
  const frameH = Math.max(20, (viewportH / bodyHeight) * scaledMiniH);
  miniFrame.style.height = frameH + "px";

  const trackH = Math.max(0, scaledMiniH - frameH);
  // compute visible start inside project body
  let visibleStart = window.scrollY - bodyStart;
  visibleStart = Math.max(0, Math.min(visibleStart, totalScrollable));
  const ratio = visibleStart / totalScrollable;
  const frameTop = Math.round(ratio * trackH);
  miniFrame.style.top = frameTop + "px";
}

/* -------------------------
   HELPER: scaled mini height
--------------------------*/
function getScaledMiniH() {
  if (!miniDoc) return 0;
  const scale = parseFloat(miniDoc.dataset.scale || 1);
  return miniDoc.scrollHeight * scale;
}

/* -------------------------
   CLICK: mini pages and miniDoc background
   - clicking a mini-page with data-target scrolls to that page id
   - clicking elsewhere maps clicked Y -> window scroll within project body
--------------------------*/
function setupMiniClicking() {
  if (!miniMap || !miniDoc || !miniFrame) return;

  // click on specific mini-page elements
  miniPages.forEach(mini => {
    mini.style.cursor = "pointer";
    mini.addEventListener("click", (ev) => {
      ev.stopPropagation();
      // if data-target present, scroll to that page element
      const targetId = mini.dataset.target;
      const pageEl = targetId ? document.getElementById(targetId) : null;
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      // otherwise fallback to mapping position
      const rect = mini.getBoundingClientRect();
      const clickY = ev.clientY - rect.top; // position inside this mini
      const miniOffsetTop = mini.offsetTop * (parseFloat(miniDoc.dataset.scale || 1));
      const scaledClickY = miniOffsetTop + clickY;
      scrollToScaledPosition(scaledClickY);
    });
  });

  // click on the miniDoc area (background) — map click position to doc scroll
  miniDoc.addEventListener("click", (ev) => {
    // ignore clicks that bubbled from miniPages (they handled themselves)
    // Compute Y relative to miniDoc top (unscaled coords -> scale aware)
    const rect = miniDoc.getBoundingClientRect();
    const clickY = ev.clientY - rect.top; // this is in screen coords for the scaled element
    // convert to unscaled coordinate: divide by scale, then map to scaled position
    const scale = parseFloat(miniDoc.dataset.scale || 1) || 1;
    const unscaledY = clickY / scale;
    // convert to scaled coordinate inside scaled mini doc
    const scaledY = unscaledY * scale;
    scrollToScaledPosition(scaledY);
  });
}

// map a scaledY (px from top of scaled miniDoc) to window scroll position and perform smooth scroll
function scrollToScaledPosition(scaledY) {
  if (!projectBody || !miniDoc) return;
  const scale = parseFloat(miniDoc.dataset.scale || 1) || 1;
  const scaledMiniH = miniDoc.scrollHeight * scale;

  // Clamp scaledY inside miniDoc bounds
  const clampedY = Math.max(0, Math.min(scaledY, Math.max(0, scaledMiniH)));

  // Determine ratio within scaled mini document
  const ratio = (scaledMiniH <= 0) ? 0 : (clampedY / scaledMiniH);

  // Map ratio to project's scrollable range
  const viewportH = window.innerHeight;
  const bodyStart = projectBody.offsetTop;
  const bodyHeight = projectBody.scrollHeight;
  const totalScrollable = Math.max(0, bodyHeight - viewportH);

  const targetScroll = Math.round(bodyStart + ratio * totalScrollable);
  window.scrollTo({ top: targetScroll, behavior: "smooth" });
}

/* -------------------------
   DRAG + MOMENTUM
--------------------------*/
let dragging = false;
let startY = 0;
let startTop = 0;

let lastY = 0;
let lastTime = 0;
let velocity = 0;
let inertiaRAF = null;

function stopInertia() {
  if (inertiaRAF) cancelAnimationFrame(inertiaRAF);
  inertiaRAF = null;
}

function startInertia(initialV) {
  let v = initialV;
  const friction = 0.0018;
  const minV = 0.002;
  let prev = performance.now();

  function step(now) {
    const dt = now - prev;
    prev = now;

    const dy = v * dt;
    const frameH = miniFrame.offsetHeight || 20;
    const scaledMiniH = getScaledMiniH();
    const trackH = Math.max(0, scaledMiniH - frameH);
    let currentTop = parseFloat(miniFrame.style.top) || 0;
    let nextTop = currentTop + dy;
    nextTop = Math.max(0, Math.min(nextTop, trackH));

    miniFrame.style.top = nextTop + "px";

    // map frameTop -> window scroll
    const bodyStart = projectBody.offsetTop;
    const bodyScroll = Math.max(0, projectBody.scrollHeight - window.innerHeight);
    const ratio = trackH > 0 ? nextTop / trackH : 0;
    const targetScroll = Math.round(bodyStart + ratio * bodyScroll);
    window.scrollTo({ top: targetScroll, behavior: "auto" });

    // friction
    v *= (1 - friction * dt);

    if (Math.abs(v) < minV || nextTop === 0 || nextTop === trackH) {
      inertiaRAF = null;
      return;
    }
    inertiaRAF = requestAnimationFrame(step);
  }

  stopInertia();
  inertiaRAF = requestAnimationFrame(step);
}

if (miniFrame) {
  miniFrame.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    startY = e.clientY;
    startTop = parseFloat(miniFrame.style.top) || 0;
    lastY = e.clientY;
    lastTime = performance.now();
    velocity = 0;
    miniFrame.classList.add("dragging");
    try { miniFrame.setPointerCapture(e.pointerId); } catch (err) {}
    stopInertia();
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    e.preventDefault();

    const y = e.clientY;
    const dy = y - startY;
    const scaledMiniH = getScaledMiniH();
    const frameH = miniFrame.offsetHeight || 20;
    const trackH = Math.max(0, scaledMiniH - frameH);

    let newTop = startTop + dy;
    newTop = Math.max(0, Math.min(newTop, trackH));
    miniFrame.style.top = newTop + "px";

    const now = performance.now();
    const dt = Math.max(1, now - lastTime);
    const instVel = (y - lastY) / dt;
    velocity = velocity * 0.6 + instVel * 0.4;
    lastY = y;
    lastTime = now;

    // map to window scroll
    const bodyStart = projectBody.offsetTop;
    const bodyScroll = Math.max(0, projectBody.scrollHeight - window.innerHeight);
    const ratio = trackH > 0 ? newTop / trackH : 0;
    const targetScroll = Math.round(bodyStart + ratio * bodyScroll);
    window.scrollTo({ top: targetScroll, behavior: "auto" });
  });

  window.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    miniFrame.classList.remove("dragging");
    try { miniFrame.releasePointerCapture && miniFrame.releasePointerCapture(e.pointerId); } catch (err) {}
    if (Math.abs(velocity) > 0.002) {
      const maxVel = 2.5;
      startInertia(Math.max(-maxVel, Math.min(maxVel, velocity)));
    }
  });
}

/* -------------------------
   SETUP MINI CLICKING & other handlers
--------------------------*/
setupMiniClicking();

/* -------------------------
   GLOBAL listeners: scroll / resize / load
--------------------------*/
window.addEventListener("scroll", () => {
  requestAnimationFrame(() => {
    applyParallax();
    computeFrame();
    updateScrollIndicator();
  });
}, { passive: true });

window.addEventListener("resize", () => {
  applyMiniMapScale();
  computeFrame();
});

window.addEventListener("load", () => {
  // ensure images loaded in miniDoc before scale
  const imgs = miniPages.filter(i => i.tagName === "IMG");
  let remaining = imgs.length;
  if (remaining === 0) {
    applyMiniMapScale();
    computeFrame();
  } else {
    imgs.forEach(img => {
      if (img.complete) {
        remaining--;
        if (remaining === 0) { applyMiniMapScale(); computeFrame(); }
      } else {
        img.addEventListener("load", () => {
          remaining--; if (remaining === 0) { applyMiniMapScale(); computeFrame(); }
        });
        img.addEventListener("error", () => {
          remaining--; if (remaining === 0) { applyMiniMapScale(); computeFrame(); }
        });
      }
    });
  }
});

})();
