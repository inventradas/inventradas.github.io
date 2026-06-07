/* ============================================================
   INVENTRA — main interactions (vanilla JS, zero dependencies)
   ============================================================ */
(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Preloader / loading screen (first visit per session) ---- */
  const pl = document.getElementById('preloader');
  if (pl) {
    if (sessionStorage.getItem('inventra_loaded')) {
      pl.remove();
    } else {
      const hide = () => {
        if (!pl.isConnected) return;
        pl.classList.add('done');
        sessionStorage.setItem('inventra_loaded', '1');
        setTimeout(() => pl.remove(), 850);
      };
      window.addEventListener('load', () => setTimeout(hide, reduceMotion ? 0 : 650));
      setTimeout(hide, 4500); // safety
    }
  }

  /* ---- Header: scrolled state + scroll progress ---- */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    const top = $('.to-top');
    if (top) top.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  const toggle = $('.nav-toggle');
  const menu = $('.mobile-menu');
  if (toggle && menu) {
    const close = () => { toggle.classList.remove('open'); menu.classList.remove('open'); document.body.style.overflow = ''; toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => {
      const open = toggle.classList.toggle('open');
      menu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('.mobile-menu a').forEach(a => a.addEventListener('click', close));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ---- Active nav link based on current path ---- */
  const path = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const file = href.split('/').pop();
    if (file === path || (path === 'index.html' && (href === 'index.html' || href === './' || href === '/'))) {
      a.classList.add('active');
    }
  });

  /* ---- Reveal on scroll (IntersectionObserver) ---- */
  const revealEls = $$('[data-reveal], [data-stagger]');
  if (reduceMotion) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const delay = parseInt(el.dataset.delay || '0', 10);
        setTimeout(() => el.classList.add('in'), delay);
        if (el.hasAttribute('data-stagger')) {
          Array.from(el.children).forEach((c, i) => { c.style.transitionDelay = (i * 90) + 'ms'; });
        }
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---- Animated counters ---- */
  const counters = $$('[data-count]');
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const end = parseFloat(el.dataset.count);
        const dur = parseInt(el.dataset.dur || '2000', 10);
        const dec = (el.dataset.count.split('.')[1] || '').length;
        if (reduceMotion) { el.textContent = end.toFixed(dec); cio.unobserve(el); return; }
        let start = null;
        const tick = (t) => {
          if (!start) start = t;
          const p = Math.min((t - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (end * eased).toFixed(dec);
          if (p < 1) requestAnimationFrame(tick); else el.textContent = end.toFixed(dec);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  }

  /* ---- Typewriter: static fallback only (cms.js drives the animation from editable settings) ---- */
  const tw = $('[data-typewriter]');
  if (tw) {
    const out = $('.tw-text', tw) || tw;
    try { out.textContent = JSON.parse(tw.dataset.typewriter)[0] || ''; } catch (e) {}
  }

  /* ---- Card sheen follows cursor ---- */
  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    $$('.card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ---- Accordion ---- */
  $$('.acc-head').forEach(head => {
    head.addEventListener('click', () => {
      const item = head.closest('.acc-item');
      const body = $('.acc-body', item);
      const open = item.classList.toggle('open');
      head.setAttribute('aria-expanded', String(open));
      body.style.maxHeight = open ? body.scrollHeight + 'px' : '0px';
    });
  });

  /* ---- Project / blog filters ---- */
  $$('[data-filter-group]').forEach(group => {
    const btns = $$('.filter', group);
    const targets = $$('[data-cat]', document.querySelector(group.dataset.filterTarget) || document);
    btns.forEach(btn => btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.f;
      targets.forEach(t => {
        const show = f === 'all' || t.dataset.cat === f;
        t.style.display = show ? '' : 'none';
        if (show) { t.classList.remove('in'); requestAnimationFrame(() => t.classList.add('in')); }
      });
    }));
  });

  /* ---- Contact form (Web3Forms / graceful fallback) ---- */
  const form = $('#contact-form');
  if (form) {
    const status = $('#form-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('button[type="submit"]', form);
      const key = form.dataset.accessKey;
      const setMsg = (cls, msg) => { if (status) { status.className = 'form-status show ' + cls; status.textContent = msg; } };
      // No access key configured yet → open mail client as fallback
      if (!key || key.includes('YOUR_')) {
        const fd = new FormData(form);
        const subject = encodeURIComponent('Project enquiry — ' + (fd.get('name') || ''));
        const body = encodeURIComponent(`Name: ${fd.get('name')}\nEmail: ${fd.get('email')}\nCompany: ${fd.get('company') || '-'}\nService: ${fd.get('service') || '-'}\n\n${fd.get('message')}`);
        window.location.href = `mailto:${form.dataset.email || 'hello@inventra.dev'}?subject=${subject}&body=${body}`;
        setMsg('ok', 'Opening your email app… If nothing happens, email us directly.');
        return;
      }
      btn.disabled = true; const label = btn.textContent; btn.textContent = 'Sending…';
      try {
        const fd = new FormData(form);
        fd.append('access_key', key);
        const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) { setMsg('ok', '✓ Thanks! Your message is on its way. We reply within 24 hours.'); form.reset(); }
        else setMsg('err', data.message || 'Something went wrong. Please email us directly.');
      } catch (_) {
        setMsg('err', 'Network error. Please email us directly at ' + (form.dataset.email || 'hello@inventra.dev'));
      } finally { btn.disabled = false; btn.textContent = label; }
    });
  }

  /* ---- Newsletter (demo) ---- */
  $$('.newsletter').forEach(nl => nl.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('input', nl);
    nl.innerHTML = '<p style="color:var(--cyan);font-size:.9rem">✓ Subscribed — welcome aboard.</p>';
  }));

  /* ---- Back to top ---- */
  const top = $('.to-top');
  if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---- Footer year ---- */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* ---- Smooth in-page anchor scroll ---- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }
    });
  });
})();
