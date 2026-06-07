/* ============================================================
   INVENTRA — hero canvas: animated node/circuit network
   Lightweight, DPR-aware, cursor-reactive, pauses off-screen.
   ============================================================ */
(() => {
  'use strict';
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  let nodes = [], raf = null, running = true;
  const mouse = { x: -9999, y: -9999, active: false };

  const COLORS = ['8,145,178', '37,99,235', '124,58,237'];

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const target = Math.min(Math.floor((W * H) / 16000), 110);
    nodes = [];
    for (let i = 0; i < target; i++) {
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        c: COLORS[(Math.random() * COLORS.length) | 0]
      });
    }
  }

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const LINK = 140, LINK2 = LINK * LINK;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;

      // cursor gentle attraction
      if (mouse.active) {
        const dx = mouse.x - n.x, dy = mouse.y - n.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 26000) { n.x += dx * 0.0014; n.y += dy * 0.0014; }
      }

      // links
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        const dx = n.x - m.x, dy = n.y - m.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK2) {
          const a = (1 - d2 / LINK2) * 0.5;
          ctx.strokeStyle = `rgba(${n.c},${a})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
        }
      }

      // link to cursor
      if (mouse.active) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 30000) {
          const a = (1 - d2 / 30000) * 0.8;
          ctx.strokeStyle = `rgba(8,145,178,${a})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }

      // node
      ctx.beginPath();
      ctx.fillStyle = `rgba(${n.c},0.9)`;
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(step);
  }

  function start() { if (!running) { running = true; step(); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { DPR = Math.min(window.devicePixelRatio || 1, 2); resize(); }, 180); });
  window.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
  });
  window.addEventListener('pointerleave', () => mouse.active = false);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  // pause when hero scrolled out of view
  const hero = canvas.closest('.hero') || canvas;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0 }).observe(hero);
  }

  resize();
  step();
})();
