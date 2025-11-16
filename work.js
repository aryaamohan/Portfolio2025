// work.js — patched to avoid desktop canvas alignment on mobile (<=768px)
// Full file — replace your existing work.js with this copy.

(function(){
  const workView = document.getElementById('workView');
  const workContent = document.getElementById('workContent');
  const workTags = document.getElementById('workTags');
  const projectLabel = document.getElementById('projectLabel');
  const container = document.getElementById('container');
  const mobileWork = document.getElementById('mobileWork');

  // ---------------- Demo projects (replace with your real data if needed) ----------------
  const projects = [
    { id:'p1', title:'Travel Planner - Case Study', year:2025, slug:'travelplanner', img:'images/projects/travelplanner.jpg', hero:'projects/travelplanner/assets/hero.jpg', tags:["ux","ui","research","mobile","travel","app"] },
    { id:'p2', title:'Naisargika - Service Design', year:2025, slug:'naisargika', img:'images/projects/naisargika.jpg', hero:'projects/naisargika/assets/hero.jpg', tags:["business strategy","research","service design"] },
    { id:'p3', title:'Kiss Ass - Game Design', year:2024, slug:'kissass', img:'images/projects/kissass.jpg', hero:'projects/kissass/assets/hero.jpg', tags:["game design","ux","play-testing"] },

  ];

  const years = Array.from(new Set(projects.map(p => p.year))).sort((a,b)=>b-a);
  const tags = Array.from(new Set(projects.flatMap(p => p.tags))).sort();

  // ----------- Shared helper: get active tag filters --------------
  function getActiveTags() {
    const act = Array.from(document.querySelectorAll('.work-tag.active'))
                     .map(b => b.dataset.tag)
                     .filter(t => t && t !== 'all');
    return act;
  }

  // ---------------- Render Tags ----------------
  function renderTags(){
    if(!workTags) return;
    workTags.innerHTML = '';
    const all = createTag('All','all',true);
    workTags.appendChild(all);
    tags.forEach(t => workTags.appendChild(createTag(t,t,false)));
  }

  function createTag(label, tag, isActive){
    const b = document.createElement('button');
    b.className = 'work-tag' + (isActive ? ' active' : '');
    b.textContent = label;
    b.dataset.tag = tag;
    b.addEventListener('click', () => {
      if(tag === 'all'){
        document.querySelectorAll('.work-tag').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      } else {
        b.classList.toggle('active');
        const allBtn = document.querySelector('.work-tag[data-tag="all"]');
        if(allBtn) allBtn.classList.remove('active');
        const anySpecificActive = Array.from(document.querySelectorAll('.work-tag'))
                                       .some(x => x.dataset.tag !== 'all' && x.classList.contains('active'));
        if(!anySpecificActive && allBtn) allBtn.classList.add('active');
      }
      applyFilters();
    });
    return b;
  }

  // ---------------- Apply filters to both desktop rail and mobile list -------------
  function applyFilters(){
    const active = getActiveTags();
    document.querySelectorAll('.project').forEach(p => {
      const pTags = (p.dataset.tags || '').split(',').filter(Boolean);
      const keep = (active.length === 0) ? true : active.some(t => pTags.includes(t));
      p.classList.toggle('hidden', !keep);
    });
    renderMobileList();
  }

  // ---------------- Rail Rendering (with inner wrapper) ----------------
  function renderRail(){
    if(!workContent) return;

    const grouped = {};
    projects.forEach(p => { if(!grouped[p.year]) grouped[p.year] = []; grouped[p.year].push(p); });

    workContent.innerHTML = '';
    const rail = document.createElement('div');
    rail.className = 'work-rail';

    const inner = document.createElement('div');
    inner.className = 'work-rail-inner';

    years.forEach(y => {
      const block = document.createElement('div');
      block.className = 'year-block';
      block.dataset.year = y;

      const meta = document.createElement('div');
      meta.className = 'year-meta';
      const yTitle = document.createElement('div');
      yTitle.className = 'year-title';
      yTitle.textContent = y;
      const yCount = document.createElement('div');
      yCount.className = 'year-count';
      yCount.textContent = `${(grouped[y]||[]).length} PROJECTS`;
      meta.appendChild(yTitle);
      meta.appendChild(yCount);

      const imgs = document.createElement('div');
      imgs.className = 'year-images';

      (grouped[y]||[]).forEach(p => {
        const card = document.createElement('div');
        card.className = 'project';
        card.dataset.tags = (p.tags || []).join(',');
        if (p.slug) card.dataset.slug = p.slug;
        if (p.id) card.dataset.pid = p.id;

        const img = document.createElement('img');
        img.src = p.img;
        img.alt = p.title;
        img.loading = 'lazy';

        const metaSmall = document.createElement('div');
        metaSmall.className = 'project-meta';
        metaSmall.textContent = p.title;

        card.appendChild(img);
        card.appendChild(metaSmall);

        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.style.cursor = 'pointer';

        card.addEventListener('mouseenter', () => focus(card));
        card.addEventListener('mouseleave', () => unfocus());

        card.addEventListener('pointerdown', (ev) => {
          if (ev.button && ev.button !== 0) return;
          ev.stopPropagation();
          setTimeout(() => {
            if (!railState.isDragging) {
              if (typeof morphToProjectPage === 'function') morphToProjectPage(card, p);
              else window.location.href = `projects/${p.slug}/`;
            }
          }, 80);
        }, { passive: false });

        card.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            if (typeof morphToProjectPage === 'function') morphToProjectPage(card, p);
            else window.location.href = `projects/${p.slug}/`;
          }
        });

        card.addEventListener('click', (ev) => {
          if (!railState.isDragging) {
            if (typeof morphToProjectPage === 'function') morphToProjectPage(card, p);
            else window.location.href = `projects/${p.slug}/`;
          }
        });

        imgs.appendChild(card);
      });

      block.appendChild(meta);
      block.appendChild(imgs);
      inner.appendChild(block);
    });

    rail.appendChild(inner);
    workContent.appendChild(rail);

    addArrows();
    enableRailInteraction(rail, inner);
    layoutUpdate();

    applyFilters();
  }

  // ---------------- Mobile list rendering ----------------
  function renderMobileList(){
    if(!mobileWork) return;
    mobileWork.innerHTML = '';
    mobileWork.classList.remove('hidden');
    mobileWork.setAttribute('aria-hidden', 'false');

    const active = getActiveTags();

    const grouped = {};
    projects.forEach(p => { if(!grouped[p.year]) grouped[p.year] = []; grouped[p.year].push(p); });

    years.forEach(y => {
      const section = document.createElement('div');
      section.className = 'mobile-year-section';
      const heading = document.createElement('div');
      heading.className = 'year-title';
      heading.textContent = y;
      heading.style.margin = '10px 6px';
      heading.style.fontSize = '18px';
      section.appendChild(heading);

      (grouped[y]||[]).forEach(p => {
        const pTags = p.tags || [];
        const keep = (active.length === 0) ? true : active.some(t => pTags.includes(t));
        if(!keep) return;

        const card = document.createElement('a');
        card.className = 'mobile-card';
        card.href = `projects/${p.slug}/`;
        card.style.display = 'block';
        card.style.position = 'relative';
        card.style.borderRadius = '10px';
        card.style.overflow = 'hidden';
        card.style.margin = '12px 6px';
        card.style.boxShadow = '0 8px 22px rgba(0,0,0,0.18)';
        card.style.textDecoration = 'none';
        card.style.color = 'inherit';
        card.style.background = 'var(--panel)';

        const img = document.createElement('img');
        img.src = p.img;
        img.alt = p.title;
        img.loading = 'lazy';
        img.style.width = '100%';
        img.style.display = 'block';
        img.style.objectFit = 'cover';
        img.style.height = '220px';

        const overlay = document.createElement('div');
        overlay.className = 'mobile-meta';
        overlay.textContent = p.title;
        overlay.style.position = 'absolute';
        overlay.style.left = '12px';
        overlay.style.bottom = '12px';
        overlay.style.padding = '6px 10px';
        overlay.style.borderRadius = '8px';
        overlay.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.55))';
        overlay.style.color = 'var(--muted)';
        overlay.style.fontSize = '14px';
        overlay.style.fontWeight = '600';

        card.appendChild(img);
        card.appendChild(overlay);

        section.appendChild(card);
      });

      if(section.querySelector('.mobile-card')) mobileWork.appendChild(section);
    });

    if(!mobileWork.querySelector('.mobile-card')){
      const empty = document.createElement('div');
      empty.textContent = 'No projects match your filter.';
      empty.style.padding = '18px';
      empty.style.opacity = '0.7';
      mobileWork.appendChild(empty);
    }
  }

  // ---------------- Shared state & RAF loop ----------------
  let railState = {
    railEl: null,
    innerEl: null,
    targetScroll: 0,
    currentScroll: 0,
    maxScroll: 0,
    isDragging: false,
    pointerStartX: 0,
    pointerStartScroll: 0,
    lastPointerX: 0,
    lastPointerTime: 0,
    velocity: 0,
    rafId: null,
    isAnimating: false,
  };

  function layoutUpdate(){
    const rail = document.querySelector('.work-rail');
    const inner = document.querySelector('.work-rail-inner');
    if(!rail || !inner) return;
    railState.railEl = rail;
    railState.innerEl = inner;
    railState.maxScroll = Math.max(0, inner.scrollWidth - rail.clientWidth);
    railState.targetScroll = Math.min(Math.max(0, railState.targetScroll), railState.maxScroll);
    railState.currentScroll = Math.min(Math.max(0, railState.currentScroll), railState.maxScroll);
    inner.style.transform = `translateX(${-railState.currentScroll}px)`;
    inner.style.willChange = 'transform';
  }

  function startRAF(){
    if (railState.rafId) return;
    function step(){
      if (railState.innerEl && railState.railEl) {
        railState.maxScroll = Math.max(0, railState.innerEl.scrollWidth - railState.railEl.clientWidth);
        if (railState.targetScroll < 0) railState.targetScroll = 0;
        if (railState.targetScroll > railState.maxScroll) railState.targetScroll = railState.maxScroll;
      }

      if(railState.isDragging){
        railState.currentScroll = railState.targetScroll;
      } else {
        const t = 0.18;
        railState.currentScroll += (railState.targetScroll - railState.currentScroll) * t;
        if (Math.abs(railState.targetScroll - railState.currentScroll) < 0.25) {
          railState.currentScroll = railState.targetScroll;
        }
      }

      if(railState.innerEl){
        railState.innerEl.style.transform = `translateX(${-railState.currentScroll}px)`;
      }

      railState.rafId = requestAnimationFrame(step);
    }
    railState.rafId = requestAnimationFrame(step);
  }

  function stopRAF(){
    if(railState.rafId){ cancelAnimationFrame(railState.rafId); railState.rafId = null; }
  }

  // ---------------- Interaction binding ----------------
  function enableRailInteraction(rail, inner){
    railState.railEl = rail;
    railState.innerEl = inner;
    layoutUpdate();
    startRAF();

    // wheel
    rail.addEventListener('wheel', (e) => {
      const LINE_HEIGHT = 16;
      const multiplier = (e.deltaMode === 1) ? LINE_HEIGHT : (e.deltaMode === 2 ? window.innerHeight : 1);
      const dy = e.deltaY * multiplier;
      const dx = e.deltaX * multiplier;
      const delta = Math.abs(dy) > Math.abs(dx) ? dy : dx;
      const scrollDelta = Math.round(delta * 0.9);
      railState.targetScroll = clamp(railState.targetScroll + scrollDelta, 0, railState.maxScroll);
      railState.velocity = (scrollDelta) / Math.max(1, 16);
      e.preventDefault();
    }, { passive:false });

    // pointer handlers
    rail.addEventListener('pointerdown', (ev) => {
      if (ev.button && ev.button !== 0) return;
      railState.isDragging = true;
      rail.classList.add('dragging');
      if (rail.setPointerCapture) try { rail.setPointerCapture(ev.pointerId); } catch(_) {}
      railState.pointerStartX = ev.clientX;
      railState.pointerStartScroll = railState.targetScroll;
      railState.lastPointerX = ev.clientX;
      railState.lastPointerTime = performance.now();
      railState.velocity = 0;
      railState.targetScroll = clamp(railState.pointerStartScroll - (ev.clientX - railState.pointerStartX), 0, railState.maxScroll);
      railState.currentScroll = railState.targetScroll;
      ev.preventDefault();
    }, { passive:false });

    rail.addEventListener('pointermove', (ev) => {
      if(!railState.isDragging) return;
      const now = performance.now();
      const dx = ev.clientX - railState.lastPointerX;
      const dt = Math.max(1, now - railState.lastPointerTime);
      railState.targetScroll = clamp(railState.pointerStartScroll - (ev.clientX - railState.pointerStartX), 0, railState.maxScroll);
      railState.velocity = dx / dt;
      railState.lastPointerX = ev.clientX;
      railState.lastPointerTime = now;
      ev.preventDefault();
    }, { passive:false });

    const endPointer = (ev) => {
      if(!railState.isDragging) return;
      railState.isDragging = false;
      rail.classList.remove('dragging');
      const initialV = railState.velocity * 16;
      if(Math.abs(initialV) > 0.6){
        let momentumDistance = initialV * 20;
        railState.targetScroll = clamp(railState.targetScroll - momentumDistance, 0, railState.maxScroll);
      }
      try { if (ev && rail.releasePointerCapture) rail.releasePointerCapture(ev.pointerId); } catch(_) {}
    };

    rail.addEventListener('pointerup', endPointer, { passive:true });
    rail.addEventListener('pointercancel', endPointer, { passive:true });

    // mouse fallbacks
    rail.addEventListener('mousedown', (e) => {
      if (window.PointerEvent) return;
      if (e.button && e.button !== 0) return;
      railState.isDragging = true;
      rail.classList.add('dragging');
      railState.pointerStartX = e.pageX;
      railState.pointerStartScroll = railState.targetScroll;
      railState.lastPointerX = e.pageX;
      railState.lastPointerTime = performance.now();
      railState.velocity = 0;
      e.preventDefault();
    }, { passive:false });

    window.addEventListener('mousemove', (e) => {
      if (window.PointerEvent) return;
      if (!railState.isDragging) return;
      const now = performance.now();
      const dx = e.pageX - railState.lastPointerX;
      const dt = Math.max(1, now - railState.lastPointerTime);
      railState.targetScroll = clamp(railState.pointerStartScroll - (e.pageX - railState.pointerStartX), 0, railState.maxScroll);
      railState.velocity = dx / dt;
      railState.lastPointerX = e.pageX;
      railState.lastPointerTime = now;
    }, { passive:true });

    window.addEventListener('mouseup', (e) => {
      if (window.PointerEvent) return;
      if (!railState.isDragging) return;
      railState.isDragging = false;
      rail.classList.remove('dragging');
      const initialV = railState.velocity * 16;
      if(Math.abs(initialV) > 0.6){
        let momentumDistance = initialV * 20;
        railState.targetScroll = clamp(railState.targetScroll - momentumDistance, 0, railState.maxScroll);
      }
    }, { passive:true });

    // Resize observer
    const ro = new ResizeObserver(() => { layoutUpdate(); });
    ro.observe(inner);
    ro.observe(rail);

    rail._scrollByAmount = (amount) => {
      railState.targetScroll = clamp(railState.targetScroll + amount, 0, railState.maxScroll);
    };
  }

  // ---------------- helpers ----------------
  function clamp(v, a, b){ return Math.min(Math.max(v, a), b); }

  // ---------------- Arrow controls ----------------
  function addArrows(){
    if(!workView) return;
    if(workView.querySelector('.work-arrow.left')) return;

    const left = document.createElement('button');
    left.className = 'work-arrow left';
    left.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
    left.addEventListener('click', ()=>scrollByAmount(-1));

    const right = document.createElement('button');
    right.className = 'work-arrow right';
    right.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
    right.addEventListener('click', ()=>scrollByAmount(1));

    workView.appendChild(left);
    workView.appendChild(right);
  }

  function scrollByAmount(dir){
    const rail = document.querySelector('.work-rail');
    if(!rail) return;
    const railInner = document.querySelector('.work-rail-inner');
    if(!railInner) return;
    const amount = Math.round(rail.clientWidth * 0.5) * dir;
    if (rail._scrollByAmount) rail._scrollByAmount(amount);
  }

  // ---------------- focus/unfocus ----------------
  function focus(card){
    document.querySelectorAll('.project').forEach(p => {
      if(p === card){ p.classList.add('focused'); p.classList.remove('dim'); }
      else { p.classList.add('dim'); p.classList.remove('focused'); }
    });
    if(projectLabel){
      projectLabel.textContent = card.querySelector('.project-meta')?.textContent || '';
      projectLabel.classList.add('visible');
    }
  }

  function unfocus(){
    document.querySelectorAll('.project').forEach(p => { p.classList.remove('focused'); p.classList.remove('dim'); });
    if(projectLabel) projectLabel.classList.remove('visible');
  }

  // ---------------- show/hide and layout sizing ----------------
  function showWorkView(show){
    const canvas = container.querySelector('canvas');
    const topbar = document.querySelector('.topbar');
    if(!topbar) return;
    const rect = topbar.getBoundingClientRect();
    const left = rect.left + window.scrollX;
    const top = (rect.bottom + window.scrollY) || (rect.top + rect.height + window.scrollY);
    const width = Math.min(rect.width, window.innerWidth - 48);

    const capsule = document.querySelector('.capsule');
    const capsuleBottomPad = (capsule) ? ( (window.innerHeight - capsule.getBoundingClientRect().top) + 12 ) : 140;

    workView.style.left = left + 'px';
    workView.style.top = top + 'px';
    workView.style.width = width + 'px';
    workView.style.bottom = capsuleBottomPad + 'px';
    workView.style.position = 'absolute';
    workView.style.transform = 'none';

    if(show){
      if(canvas) canvas.style.display = 'none';
      workView.classList.remove('hidden');
      const railInner = document.querySelector('.work-rail-inner');
      const rail = document.querySelector('.work-rail');
      if(rail && railInner){
        railState.targetScroll = 0;
        railState.currentScroll = 0;
        layoutUpdate();
      }
      const arrows = workView.querySelectorAll('.work-arrow');
      arrows.forEach(a => { a.style.bottom = ''; a.style.display = ''; });
    } else {
      if(canvas) canvas.style.display = '';
      workView.classList.add('hidden');
      workView.style.bottom = '';
      workView.style.top = '';
      workView.style.left = '';
      workView.style.width = '';
      unfocus();
    }

    document.querySelectorAll('.project').forEach(p => p.classList.remove('dim'));
  }

  // ---------------- wire nav and init ----------------
  function wireNav(){
    const workBtn = document.querySelector('.nav-btn[data-key="work"]');
    if(!workBtn) return;
    workBtn.addEventListener('click', ()=> {
      renderTags();
      renderRail();
      renderMobileList();
      toggleMobileMode();
      showWorkView(true);
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      workBtn.classList.add('active');
    });
  }

  // ---------------- Responsive mobile-mode toggle ----------------
  function isMobileWidth() { return window.innerWidth < 768; }

  function toggleMobileMode(){
    const mobile = isMobileWidth();
    const rail = document.querySelector('.work-rail');
    const arrows = document.querySelectorAll('.work-arrow');

    if(mobile){
      if(rail) rail.style.display = 'none';
      arrows.forEach(a => { a.style.display = 'none'; });
      try { stopRAF(); } catch(e) {}
      if(mobileWork){
        mobileWork.style.display = 'block';
        mobileWork.classList.remove('hidden');
        mobileWork.setAttribute('aria-hidden','false');
        renderMobileList();
      }
    } else {
      if(rail) rail.style.display = '';
      arrows.forEach(a => { a.style.display = ''; });
      if(mobileWork){
        mobileWork.style.display = 'none';
        mobileWork.classList.add('hidden');
        mobileWork.setAttribute('aria-hidden','true');
      }
      try { layoutUpdate(); startRAF(); } catch(e){}
    }
  }

  // run on resize (debounced small)
  let resizeTimer = null;
  window.addEventListener('resize', ()=> {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(()=> {
      if(!workView.classList.contains('hidden')) showWorkView(true);
      try { layoutUpdate(); } catch(e){}
      toggleMobileMode();
    }, 80);
  }, { passive: true });

  function ensureHorizontalRailOnSmall() {
    const rail = document.querySelector('.work-rail');
    if (!rail) return;
    if (window.innerWidth <= 1100) {
      rail.style.display = 'flex';
      rail.style.flexDirection = 'row';
      rail.style.overflowX = 'auto';
      rail.style.overflowY = 'hidden';
      rail.style.height = 'auto';
      rail.style.minHeight = '160px';
      rail.style.touchAction = 'pan-y';
    }
  }

  // ---------------- init ----------------
  renderTags();
  renderRail();
  renderMobileList();
  wireNav();
  toggleMobileMode();
  ensureHorizontalRailOnSmall();

  window.addEventListener('load', ()=> {
    toggleMobileMode();
    layoutUpdate();
  });

  window._railState = railState;
  window.showWorkView = showWorkView;

  // ---------------- Morph to project page ----------------
  const morphOverlay = document.getElementById('morphOverlay') || (function(){
    const el = document.createElement('div');
    el.id = 'morphOverlay';
    el.className = 'morph-overlay';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    return el;
  })();

  window.__isMorphing = window.__isMorphing || false;

  function morphToProjectPage(card, project) {
    if (window.__isMorphing) {
      console.log('morph: already running, ignoring duplicate call');
      return;
    }
    window.__isMorphing = true;

    const img = card && card.querySelector ? card.querySelector('img') : null;
    if (!img) {
      console.warn('morph: no img found on card; falling back to navigation');
      window.location.replace(`projects/${project.slug}/index.html`);
      return;
    }

    if (!project || !project.slug) {
      console.error('morph: project.slug missing; falling back to navigation', project);
      window.location.href = `projects/${project && project.slug ? project.slug : ''}`;
      return;
    }

    const rect = img.getBoundingClientRect();
    const clone = img.cloneNode(true);
    clone.className = 'morph-clone';
    clone.style.top = rect.top + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.position = 'absolute';
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.style.opacity = '1';
    clone.style.zIndex = '100000';
    clone.style.objectFit = 'cover';
    clone.style.willChange = 'top,left,width,height,opacity,border-radius';
    clone.style.pointerEvents = 'none';

    morphOverlay.appendChild(clone);
    clone.getBoundingClientRect();

    const targetTop = 0;
    const targetLeft = 0;
    const targetWidth = window.innerWidth;
    const targetHeight = window.innerHeight;

    requestAnimationFrame(() => {
      clone.style.transition = 'all 700ms cubic-bezier(.22,.61,.36,1)';
      clone.style.borderRadius = '0px';
      clone.style.top = targetTop + 'px';
      clone.style.left = targetLeft + 'px';
      clone.style.width = targetWidth + 'px';
      clone.style.height = targetHeight + 'px';
      clone.style.opacity = '0.96';
    });

    let navigated = false;
    function navigateNow() {
      if (navigated) return;
      navigated = true;
      try { if (clone && clone.parentNode) clone.parentNode.removeChild(clone); } catch(e){}
      window.location.href = `projects/${project.slug}/`;
    }

    const onCloneEnd = (e) => {
      if (e.target !== clone) return;
      clone.removeEventListener('transitionend', onCloneEnd);
      clearTimeout(timeoutId);

      const fadeOverlay = document.createElement('div');
      fadeOverlay.className = 'morph-fade-overlay';
      fadeOverlay.style.position = 'fixed';
      fadeOverlay.style.inset = '0';
      fadeOverlay.style.zIndex = '100010';
      fadeOverlay.style.pointerEvents = 'none';
      fadeOverlay.style.backgroundSize = 'cover';
      fadeOverlay.style.backgroundPosition = 'center';
      fadeOverlay.style.opacity = '0';
      fadeOverlay.style.transition = 'opacity 320ms ease';

      const heroUrl = (project.hero && project.hero.length) ? project.hero : null;
      if (heroUrl) {
        fadeOverlay.style.backgroundImage = `url("${heroUrl}")`;
        fadeOverlay.style.backgroundColor = '#000';
        fadeOverlay.style.backgroundBlendMode = 'multiply';
      } else {
        fadeOverlay.style.backgroundColor = '#000';
      }

      document.body.appendChild(fadeOverlay);

      requestAnimationFrame(() => {
        fadeOverlay.style.opacity = '1';
        clone.style.transition = 'all 320ms ease';
        clone.style.opacity = '0';
      });

      const onFadeEnd = () => {
        fadeOverlay.removeEventListener('transitionend', onFadeEnd);
        setTimeout(navigateNow, 50);
      };
      fadeOverlay.addEventListener('transitionend', onFadeEnd, { once: true });

      setTimeout(() => {
        if (!navigated) navigateNow();
      }, 1200);
    };

    clone.addEventListener('transitionend', onCloneEnd, { once: true });

    const MAX_WAIT = 2400;
    const timeoutId = setTimeout(() => {
      console.warn('morph: transition timeout — forcing crossfade navigation');
      try { clone.removeEventListener('transitionend', onCloneEnd); } catch(_) {}
      const quickOverlay = document.createElement('div');
      quickOverlay.style.position = 'fixed';
      quickOverlay.style.inset = '0';
      quickOverlay.style.background = '#000';
      quickOverlay.style.opacity = '0';
      quickOverlay.style.transition = 'opacity 260ms ease';
      quickOverlay.style.zIndex = '100010';
      document.body.appendChild(quickOverlay);
      requestAnimationFrame(()=> quickOverlay.style.opacity = '1');
      setTimeout(navigateNow, 320);
    }, MAX_WAIT);
  }

  // ---------------- Delegated fallback click handler ----------------
  document.addEventListener('click', (ev) => {
    if (window.__isMorphing) return;
    const card = ev.target.closest && ev.target.closest('.project');
    if (!card) return;
    const slug = card.dataset.slug;
    if (!slug) return;
    const proj = projects.find(pp => pp.slug === slug || pp.id === card.dataset.pid);
    if (proj) {
      if (!railState.isDragging) {
        morphToProjectPage(card, proj);
      }
    }
  }, true);

  // ---------------- Canvas sizing / alignment (patched)
  // This is the single critical change: on mobile (<=768) we avoid forcing desktop canvas alignment.
  (function(){
    // Use same pad as the sketch did (the sketch used pad=100)
    const PAD = 100;
    const MIN_WIDTH = 420;
    const REFRESH_DEBOUNCE = 60;
    let tId = null;

    function computeCanvasWidth() {
      return Math.max(MIN_WIDTH, window.innerWidth - PAD * 2);
    }

    function alignToCanvasSize() {
      const sizer = document.getElementById('workCanvasSizer');
      const topbar = document.querySelector('.topbar');
      const capsule = document.querySelector('.capsule');
      if (!sizer || !topbar) return;

      // EARLY RETURN FOR MOBILE: if screen is mobile-sized, don't run desktop alignment
      if (window.innerWidth <= 768) {
        // Restore sizer/workView to normal flow for mobile
        sizer.style.left = '0px';
        sizer.style.width = '100%';
        sizer.style.maxWidth = '100%';
        sizer.style.position = 'static';
        if (workView) {
          workView.style.left = '';
          workView.style.top = '';
          workView.style.right = '';
          workView.style.bottom = '';
          workView.style.position = 'relative';
          workView.style.width = '100%';
          workView.style.boxSizing = 'border-box';
        }
        // Let CSS handle mobile layout; no further desktop alignment.
        return;
      }

      // Desktop alignment logic (unchanged)
      const cw = computeCanvasWidth();
      const left = PAD;

      sizer.style.width = cw + 'px';
      sizer.style.left = left + 'px';
      sizer.style.position = 'absolute';

      const topbarRect = topbar.getBoundingClientRect();
      const workViewEl = document.getElementById('workView');
      if (!workViewEl) return;

      const top = topbarRect.bottom + 8;
      const capRect = capsule ? capsule.getBoundingClientRect() : { top: window.innerHeight };
      const bottomGap = Math.max(120, window.innerHeight - capRect.top + 12);

      workViewEl.style.top = top + 'px';
      workViewEl.style.bottom = bottomGap + 'px';
      workViewEl.style.left = '0px';
      workViewEl.style.width = '100%';
      workViewEl.style.position = 'absolute';
      workViewEl.style.boxSizing = 'border-box';

      topbar.style.width = cw + 'px';
      topbar.style.transform = 'none';
      topbar.style.left = left + 'px';

      setTimeout(() => {
        if (window._workRailState && window._workRailState.inner) {
          if (typeof window._workRailState.inner.requestUpdateBounds === 'function') {
            try { window._workRailState.inner.requestUpdateBounds(); } catch(e) {}
          }
        }
      }, 40);
    }

    function scheduleAlign(){
      if (tId) clearTimeout(tId);
      tId = setTimeout(alignToCanvasSize, REFRESH_DEBOUNCE);
    }

    window.addEventListener('resize', scheduleAlign);
    window.addEventListener('orientationchange', scheduleAlign);
    window.addEventListener('load', ()=> { setTimeout(alignToCanvasSize, 30); setTimeout(alignToCanvasSize, 260); });
    window.addEventListener('workview:rendered', ()=> setTimeout(alignToCanvasSize, 20));
  })();

})(); 
