// --------------------- Full stable sketch.js (complete) ---------------------
// Lightweight p5 ASCII + Perlin ripple with theme-aware fade (white in light mode)
// Put this file as Site-7/sketch.js (replace existing sketch.js)

//
// CONFIG / STATE
//
let chars = "Ñ@#W$9876543210?!abc;:+=-,._   ";
let noiseScale = 0.015;
let speed = 0.02;

let cellW = 8;
let cellH = 12;
let cols = 0, rows = 0;
let t = 0;

let rippleAmp = 0.9;
let rippleFreq = 3.0;
let rippleDecay = 0.7;
let ignoreMouse = false;

// transition timing (milliseconds)
const TRANSITION_MS = 700;

// theme state used by drawing logic
let sketchTheme = 'dark';          // 'dark' | 'light'
let fadeColor = { r: 0, g: 0, b: 0, alphaMult: 1.0 }; // updated by updateSketchTheme

// ascii brightness mapping (values used in map(...))
let asciiWhite = 220;
let asciiDark = 40;

// canvas bg color
let bgColor = '#0b0b0c';

//
// transition state (smooth reversing supported)
//
let transitioning = false;
let transitionStart = 0;
let transitionFromP = 0;
let transitionToP = 0;
let transitionP = 0; // current eased progress 0..1
let transitionTarget = null; // 'toImage' or 'toAbstract'

//
// caches & state
//
const imageCache = new Map();
const pixelsCache = new Map();
let mode = 'abstract';
let imgKey = null;
let activeBtn = null;
let pendingLoadToken = null;

//
// Helpers
//
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOutCubic(x) { return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2; }

//
// Theme syncing: unified handler (called from DOM script)
//
function updateSketchTheme(theme) {
  const t = (typeof theme === 'string' && theme.toLowerCase() === 'light') ? 'light' : 'dark';
  sketchTheme = t;

  if (t === 'light') {
    // Light-mode appearance (canvas)
    bgColor = '#f7f7f8';
    // In light mode we want ASCII to appear darker on the light bg:
    asciiWhite = 40;   // mapping low -> darker value
    asciiDark = 220;   // mapping high -> lighter value
    // overlay color -> white
    fadeColor = { r: 255, g: 255, b: 255, alphaMult: 1.0 };
  } else {
    // Dark-mode appearance
    bgColor = '#0b0b0c';
    asciiWhite = 220;
    asciiDark = 40;
    fadeColor = { r: 0, g: 0, b: 0, alphaMult: 1.0 };
  }
  // draw() will pick up new values next frame
}

//
// p5 lifecycle
//
function setup() {
  // Use container sizing for small screens, otherwise keep original pad-based sizing
  const useContainerSizing = window.innerWidth <= 425;
  let canvas;

  if (useContainerSizing) {
    const containerEl = document.getElementById('container');
    const rect = containerEl.getBoundingClientRect();

    // create canvas to fit the container exactly
    const cW = Math.max(4, Math.floor(rect.width));
    const cH = Math.max(4, Math.floor(rect.height));
    canvas = createCanvas(cW, cH);
    canvas.parent(containerEl);
    // ensure canvas positioned at top-left of container
    canvas.position(0, 0);
  } else {
    // original desktop sizing (preserve your pad behavior)
    const pad = 100;
    canvas = createCanvas(windowWidth - pad * 2, windowHeight - pad * 2);
    canvas.parent(document.getElementById('container'));
    canvas.position(pad, pad);
  }

  textFont('monospace', cellH);
  textAlign(CENTER, CENTER);
  noStroke();
  frameRate(20);

  computeGrid();

  // init theme from DOM
  sketchTheme = (document && document.body && document.body.classList.contains('light')) ? 'light' : 'dark';
  updateSketchTheme(sketchTheme);

  // nav handlers (keep existing)
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => hoverNav(btn));
    btn.addEventListener('mouseleave', () => leaveNav(btn));
    btn.addEventListener('focus', () => hoverNav(btn));
    btn.addEventListener('blur', () => leaveNav(btn));
    btn.addEventListener('click', () => {
      if (btn.classList.contains('pinned')) {
        btn.classList.remove('pinned');
        leaveNav(btn);
      } else {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('pinned'));
        btn.classList.add('pinned');
        hoverNav(btn);
      }
    });
  });

  // notify DOM that p5 is ready (topbar alignment etc.)
  signalP5Ready();
}

function computeGrid(){
  cols = Math.max(4, floor(width / cellW));
  rows = Math.max(4, floor(height / cellH));
  if (cols > 140) { cellW = 12; cellH = 16; cols = floor(width / cellW); rows = floor(height / cellH); }
}

function windowResized(){
  const useContainerSizing = window.innerWidth <= 425;

  if (useContainerSizing) {
    const containerEl = document.getElementById('container');
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    const newW = Math.max(4, Math.floor(rect.width));
    const newH = Math.max(4, Math.floor(rect.height));
    resizeCanvas(newW, newH);

    // ensure canvas positioned at container origin
    const canv = document.querySelector('#container canvas');
    if (canv) {
      canv.style.left = '0px';
      canv.style.top = '0px';
      canv.style.width = newW + 'px';
      canv.style.height = newH + 'px';
    }
  } else {
    const pad = 100;
    resizeCanvas(windowWidth - pad * 2, windowHeight - pad * 2);
    const canv = document.querySelector('#container canvas');
    if (canv) {
      canv.style.left = pad + 'px';
      canv.style.top = pad + 'px';
      canv.style.width = (windowWidth - pad * 2) + 'px';
      canv.style.height = (windowHeight - pad * 2) + 'px';
    }
  }

  computeGrid();
}

function draw(){
  t += deltaTime / 1000 * speed;

  // --- transition update (smooth from current value to target) ---
  if (transitioning) {
    let elapsed = millis() - transitionStart;
    let raw = constrain(elapsed / TRANSITION_MS, 0, 1);
    let eased = easeInOutCubic(raw);
    transitionP = lerp(transitionFromP, transitionToP, eased);

    if (raw >= 1) {
      transitioning = false;
      transitionP = transitionToP;
      if (transitionTarget === 'toImage') { mode = 'image'; ignoreMouse = true; }
      else { mode = 'abstract'; ignoreMouse = false; }
    }
  }

  // draw background using theme-appropriate bgColor
  background(bgColor);

  // compute alphas based on transitionP
  let p = transitionP;
  let abstractAlpha = Math.max(0, 1 - p * 2);
  let blackAlpha = 1 - Math.abs(p - 0.5) * 2; // peaks at p=0.5
  let imageAlpha = Math.max(0, (p - 0.5) * 2);

  // center offsets so ascii block is centered
  let xOffset = (width - cols * cellW) / 2 + cellW / 2;
  let yOffset = (height - rows * cellH) / 2 + cellH / 2;

  // draw abstract (if visible)
  if (abstractAlpha > 0.001) drawAbstract(xOffset, yOffset, abstractAlpha);

  // draw theme-appropriate fade overlay (white in light mode, black in dark mode)
  if (blackAlpha > 0.001) {
    push();
    noStroke();
    const a = constrain(blackAlpha, 0, 1);
    if (document && document.body && document.body.classList.contains('light')) {
      // light mode -> fade through white
      fill(255, 255 * a);
    } else {
      // dark mode -> fade through black
      fill(0, 255 * a);
    }
    rect(0, 0, width, height);
    pop();
  }

  // draw ascii-image if ready
  if (imageAlpha > 0.001 && pixelsCache.has(imgKey)) {
    drawAsciiImage(xOffset, yOffset, imageAlpha, pixelsCache.get(imgKey));
  }
}

//
// Drawing routines
//
function drawAbstract(xOffset, yOffset, layerAlpha=1){
  let mx = constrain(mouseX, 0, width);
  let my = constrain(mouseY, 0, height);

  for (let j = 0; j < rows; j++){
    for (let i = 0; i < cols; i++){
      let x = xOffset + i * cellW;
      let y = yOffset + j * cellH;
      let n = noise(i * noiseScale, j * noiseScale, t * 0.6);
      let base = n;

      let wave = 0;
      if (!ignoreMouse){
        let dx = x - mx, dy = y - my;
        let d = sqrt(dx*dx + dy*dy) + 0.0001;
        wave = (sin(d * (rippleFreq * 0.02) - t * 6) * rippleAmp) / (1 + pow(d * 0.02, rippleDecay * 6));
      }

      let value = constrain(base + wave * 0.6, 0, 1);
      let jitter = 0.02 * sin((i + j) * 0.13 + t * 1.2);
      value = constrain(value + jitter, 0, 1);

      // map value to character index
      let idx = floor(map(value, 0, 1, chars.length - 1, 0));
      idx = constrain(idx, 0, chars.length - 1);
      let ch = chars[idx];

      // map brightness using asciiWhite/asciiDark (these are theme-aware)
      let bright = map(value, 0, 1, asciiWhite, asciiDark);
      let finalBright = bright * layerAlpha + (sketchTheme === 'light' ? 255 * (1 - layerAlpha) : 10 * (1 - layerAlpha));
      fill(finalBright);

      let sizeBoost = (!ignoreMouse) ? map(1 / ((dist(x, y, mx, my) * 0.02) + 1), 0, 1, 0, 0.55) : 0;
      let drawSize = cellH * (1 + 0.25 * sizeBoost);
      textSize(drawSize);
      text(ch, x, y);
    }
  }
}

function drawAsciiImage(xOffset, yOffset, layerAlpha=1, buf){
  const offW = buf._w;
  const offH = buf._h;
  const use1to1 = (offW === cols && offH === rows);

  for (let j = 0; j < rows; j++){
    for (let i = 0; i < cols; i++){
      let px = use1to1 ? i : Math.min(offW - 1, Math.floor(i * offW / cols));
      let py = use1to1 ? j : Math.min(offH - 1, Math.floor(j * offH / rows));
      let idx = (py * offW + px) * 4;
      let r = buf.data[idx], g = buf.data[idx+1], b = buf.data[idx+2];
      let bright = (0.299*r + 0.587*g + 0.114*b) / 255;
      let targetIdx = floor(map(bright, 0, 1, chars.length - 1, 0));
      targetIdx = constrain(targetIdx, 0, chars.length - 1);
      let ch = chars[targetIdx];

      let x = xOffset + i * cellW;
      let y = yOffset + j * cellH;

      // greys used for image text: adjust based on theme (we want visible contrast)
      let gray = (sketchTheme === 'light') ? map(bright, 0, 1, 40, 220) : map(bright, 0, 1, 220, 40);
      fill(gray * layerAlpha + (sketchTheme === 'light' ? 255 * (1 - layerAlpha) : 8 * (1 - layerAlpha)));
      textSize(cellH * 1.0);
      text(ch, x, y);
    }
  }
}

//
// NAV: image loading & prepare pixels (1:1 buffer sized to cols x rows)
//
function hoverNav(btn){
  const url = btn.getAttribute('data-img');
  if (!url) return;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeBtn = btn;
  const key = btn.dataset.key || url;
  imgKey = key;

  // if pixels cached -> start transition immediately
  if (pixelsCache.has(key)){
    mode = 'image';
    ignoreMouse = true;
    startTransition('toImage');
    return;
  }

  const token = Symbol();
  pendingLoadToken = token;

  if (imageCache.has(key)){
    const cached = imageCache.get(key);
    preparePixels(cached, key, token, btn);
  } else {
    loadImage(url,
      img => {
        imageCache.set(key, img);
        preparePixels(img, key, token, btn);
      },
      err => {
        console.error('[NAV] load failed', err);
        btn.classList.remove('active');
        activeBtn = null;
        imgKey = null;
      }
    );
  }
}

function leaveNav(btn){
  if (btn) btn.classList.remove('active');
  activeBtn = null;
  imgKey = null;
  pendingLoadToken = null; // cancel pending loads
  const anyPinned = Array.from(document.querySelectorAll('.nav-btn')).some(b => b.classList.contains('pinned'));
  if (!anyPinned){
    startTransition('toAbstract');
  }
}

function preparePixels(img, key, token, btn) {

  // Offscreen buffer exactly cols x rows -> 1:1 mapping
  const offW = Math.max(4, cols);
  const offH = Math.max(4, rows);

  const offG = createGraphics(offW, offH);
  offG.pixelDensity(1);
  offG.clear();
  offG.imageMode(CORNER);

  // contain-fit so the whole image appears (letterbox areas filled according to theme)
  const imgAr = img.width / img.height;
  const bufAr = offW / offH;
  let drawW, drawH, dx = 0, dy = 0;

  if (imgAr > bufAr) {
    drawW = offW;
    drawH = Math.round(offW / imgAr);
    dx = 0;
    dy = Math.round((offH - drawH) / 2);
  } else {
    drawH = offH;
    drawW = Math.round(offH * imgAr);
    dy = 0;
    dx = Math.round((offW - drawW) / 2);
  }

  // letterbox background should match theme: white for light, black for dark
  if (document && document.body && document.body.classList.contains('light')) offG.background(255);
  else offG.background(0);


  offG.push();
  offG.image(img, dx, dy, drawW, drawH);
  offG.pop();

  offG.loadPixels();
  // store typed copy of pixels
  pixelsCache.set(key, { data: offG.pixels.slice(), _w: offW, _h: offH });

  if (btn) btn.classList.remove('loading');

  // if still hovered, start transition
  if (imgKey === key) {
    mode = 'image';
    ignoreMouse = true;
    startTransition('toImage');
  }
}

function startTransition(target) {
  transitionTarget = target;
  transitionStart = millis();
  transitioning = true;
  const to = (target === 'toImage') ? 1 : 0;
  transitionFromP = transitionP;
  transitionToP = to;
  if (target === 'toImage') ignoreMouse = true;
}

// prevent touch scroll
function touchMoved(){ return false; }

//
// Topbar alignment + readiness hooks (DOM integration helpers)
//
function alignTopbarToCanvas() {
  try {
    const canv = document.querySelector('#container canvas');
    const topbar = document.querySelector('.topbar');
    if (!canv || !topbar) return;
    const rect = canv.getBoundingClientRect();
    topbar.style.width = rect.width + 'px';
    topbar.style.left = rect.left + window.scrollX + 'px';
    topbar.style.transform = 'none';
  } catch (e) {
    console.warn('alignTopbarToCanvas failed', e);
  }
}

function signalP5Ready() {
  if (window.onP5Ready) window.onP5Ready();
}

// -----------------------------------------------------------------------------
// End of sketch.js
