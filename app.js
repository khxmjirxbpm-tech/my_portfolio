// ============================================================
// SHARED APP SCRIPT — nav, pagination, reveal, zoomable lightbox
// ============================================================

const PAGES = [
  { file: 'index.html',   label: 'Portfolio นางสาวเขมจิรา บ่าพิมาย' },
  { file: 'page-02.html', label: 'Statement of Purpose' },
  { file: 'page-03.html', label: 'Profile' },
  { file: 'page-04.html', label: 'Activity — กิจกรรมด้านวิชาการ' },
  { file: 'page-05.html', label: 'Activity — กิจกรรมที่เกี่ยวกับวิชาชีพพยาบาล' },
  { file: 'page-06.html', label: 'Activity — กิจกรรมจิตอาสา 01' },
  { file: 'page-07.html', label: 'Activity — กิจกรรมจิตอาสา 02' },
  { file: 'page-08.html', label: 'Activity — กิจกรรมด้านภาวะผู้นำ' },
  { file: 'page-09.html', label: 'Activity — กิจกรรมอื่นๆ 01' },
  { file: 'page-10.html', label: 'Activity — กิจกรรมอื่นๆ 02' },
  { file: 'page-11.html', label: 'Activity — เกียรติบัตรเพิ่มเติม' },
  { file: 'page-12.html', label: 'Thank You' },
];

document.addEventListener('DOMContentLoaded', () => {

  const currentFile = (location.pathname.split('/').pop() || 'index.html');
  const currentIndex = Math.max(0, PAGES.findIndex(p => p.file === currentFile));

  function pad(n){ return n.toString().padStart(2, '0'); }

  /* ---------- Build top nav ---------- */
  const navHost = document.getElementById('site-nav');
  if (navHost) {
    navHost.innerHTML = `
      <header class="site-nav">
        <a class="nav-logo" href="index.html">PORTFOLIO</a>
        <div class="nav-right">
          <span class="nav-page-count">${pad(currentIndex + 1)} / ${pad(PAGES.length)}</span>
          <button class="menu-btn" id="menuBtn" aria-label="เปิดเมนู"><span></span><span></span><span></span></button>
        </div>
      </header>
      <div class="menu-overlay" id="menuOverlay">
        <ul class="menu-list">
          ${PAGES.map((p, i) => `
            <li class="${i === currentIndex ? 'current' : ''}">
              <a href="${p.file}"><span class="idx">${pad(i + 1)}</span>${p.label}</a>
            </li>`).join('')}
        </ul>
      </div>
    `;
    const menuBtn = document.getElementById('menuBtn');
    const overlay = document.getElementById('menuOverlay');
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menuBtn.classList.remove('open'); overlay.classList.remove('open');
    }));
  }

  /* ---------- Build footer pagination ---------- */
  const footerHost = document.getElementById('page-footer');
  if (footerHost) {
    const prev = PAGES[currentIndex - 1];
    const next = PAGES[currentIndex + 1];
    footerHost.innerHTML = `
      <footer class="page-footer">
        ${prev ? `<a class="prev" href="${prev.file}"><span class="arrow">‹</span> ก่อนหน้า</a>` : `<span class="disabled">‹ ก่อนหน้า</span>`}
        <span class="pf-count">${pad(currentIndex + 1)} / ${pad(PAGES.length)}</span>
        ${next ? `<a class="next" href="${next.file}">ถัดไป <span class="arrow">›</span></a>` : `<span class="disabled">ถัดไป ›</span>`}
      </footer>
    `;
  }

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in-view'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- Keyboard arrow navigation between pages ---------- */
  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (lb && lb.classList.contains('open')) return; // let lightbox handle its own keys
    if (e.key === 'ArrowRight' && PAGES[currentIndex + 1]) location.href = PAGES[currentIndex + 1].file;
    if (e.key === 'ArrowLeft' && PAGES[currentIndex - 1]) location.href = PAGES[currentIndex - 1].file;
  });

  /* ---------- Cursor-reactive spotlight on cover pages ---------- */
  const coverStage = document.querySelector('.stage.cover');
  if (coverStage) {
    coverStage.addEventListener('mousemove', (e) => {
      const rect = coverStage.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      coverStage.style.setProperty('--mx', mx + '%');
      coverStage.style.setProperty('--my', my + '%');
    });
  }

  /* ---------- Swipe navigation (mobile) on the image stage ---------- */
  const stage = document.querySelector('.stage');
  if (stage) {
    let touchStartX = 0, touchStartY = 0;
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        const lb = document.getElementById('lightbox');
        if (lb && lb.classList.contains('open')) return;
        if (dx < 0 && PAGES[currentIndex + 1]) location.href = PAGES[currentIndex + 1].file;
        if (dx > 0 && PAGES[currentIndex - 1]) location.href = PAGES[currentIndex - 1].file;
      }
    }, { passive: true });
  }

  /* ================================================================
     LIGHTBOX — click-to-zoom viewer with pan + wheel/pinch/double-tap
     ================================================================ */
  const frame = document.querySelector('.image-frame');
  if (!frame) return;
  const sourceImg = frame.querySelector('img');

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.id = 'lightbox';
  lb.innerHTML = `
    <div class="lightbox-count">${pad(currentIndex + 1)} / ${pad(PAGES.length)}</div>
    <button class="lightbox-close" aria-label="ปิด">✕</button>
    <div class="lightbox-img-wrap">
      <img src="${sourceImg.src}" alt="${sourceImg.alt || ''}">
    </div>
    <div class="lightbox-toolbar">
      <button data-act="out" aria-label="ซูมออก">−</button>
      <button data-act="reset" aria-label="รีเซ็ต">⤾</button>
      <button data-act="in" aria-label="ซูมเข้า">+</button>
    </div>
  `;
  document.body.appendChild(lb);

  const lbImg = lb.querySelector('img');
  const closeBtn = lb.querySelector('.lightbox-close');
  let scale = 1, posX = 0, posY = 0, isDragging = false, dragStartX = 0, dragStartY = 0;

  function applyTransform(){
    lbImg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
  }
  function resetView(){ scale = 1; posX = 0; posY = 0; applyTransform(); }
  function clampScale(v){ return Math.min(Math.max(v, 1), 4); }

  function openLightbox(){
    resetView();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox(){
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  frame.addEventListener('click', openLightbox);
  closeBtn.addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox-img-wrap')) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (lb.classList.contains('open') && e.key === 'Escape') closeLightbox(); });

  /* Toolbar buttons */
  lb.querySelector('.lightbox-toolbar').addEventListener('click', (e) => {
    const act = e.target.dataset.act;
    if (!act) return;
    if (act === 'in') scale = clampScale(scale + 0.5);
    if (act === 'out') scale = clampScale(scale - 0.5);
    if (act === 'reset') { resetView(); return; }
    applyTransform();
  });

  /* Mouse wheel zoom */
  lb.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale = clampScale(scale + (e.deltaY < 0 ? 0.25 : -0.25));
    if (scale === 1) { posX = 0; posY = 0; }
    applyTransform();
  }, { passive: false });

  /* Double-click / double-tap to toggle zoom */
  let lastTap = 0;
  function toggleZoomAt(clientX, clientY){
    if (scale === 1) {
      scale = 2.4;
    } else {
      scale = 1; posX = 0; posY = 0;
    }
    applyTransform();
  }
  lbImg.addEventListener('dblclick', (e) => toggleZoomAt(e.clientX, e.clientY));

  /* Drag to pan (mouse) */
  lbImg.addEventListener('mousedown', (e) => {
    if (scale === 1) return;
    isDragging = true;
    dragStartX = e.clientX - posX; dragStartY = e.clientY - posY;
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    posX = e.clientX - dragStartX; posY = e.clientY - dragStartY;
    applyTransform();
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  /* Touch: drag to pan + double-tap to zoom */
  let touchLastX = 0, touchLastY = 0, touchDragging = false;
  lbImg.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap < 300) {
        toggleZoomAt(e.touches[0].clientX, e.touches[0].clientY);
      }
      lastTap = now;
      if (scale > 1) {
        touchDragging = true;
        touchLastX = e.touches[0].clientX - posX;
        touchLastY = e.touches[0].clientY - posY;
      }
    }
  }, { passive: true });
  lbImg.addEventListener('touchmove', (e) => {
    if (touchDragging && e.touches.length === 1) {
      posX = e.touches[0].clientX - touchLastX;
      posY = e.touches[0].clientY - touchLastY;
      applyTransform();
    }
  }, { passive: true });
  lbImg.addEventListener('touchend', () => { touchDragging = false; });

});
