/* ============================================================
   INVENTRA — content layer renderer (reads /content/*.json)
   Non-destructive: static HTML stays as fallback; this overwrites
   on successful fetch so CMS edits appear on the live site.
   ============================================================ */
(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const getJSON = (p) => fetch(p, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }); } catch(e){ return d; } };

  const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const SHAPES = {
    robot: '<rect x="5" y="9" width="14" height="10" rx="2"/><path d="M12 9V5M9 2h6"/><circle cx="9" cy="14" r="1.4"/><circle cx="15" cy="14" r="1.4"/>',
    building: '<path d="M3 21h18M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/>',
    chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
    eye: '<circle cx="12" cy="12" r="3.5"/><path d="M2 12a10 10 0 0 1 20 0 10 10 0 0 1-20 0Z"/>',
    energy: '<path d="M12 2v6M5 9l3 3M19 9l-3 3M4 20h16M7 20l1-5h8l1 5"/>',
    ml: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M18 6l-3 3M6 18l3-3M18 18l-3-3"/><circle cx="12" cy="12" r="3"/>',
    cube: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>'
  };
  const COVERS = {
    Automation: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    Embedded: SHAPES.chip,
    IoT: '<path d="M5 12a7 7 0 0 1 14 0M2 12a10 10 0 0 1 20 0"/><circle cx="12" cy="18" r="2"/>',
    Control: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    Robotics: SHAPES.robot
  };
  const shapeSvg = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1">${SHAPES[k] || SHAPES.chip}</svg>`;
  const coverSvg = (cat, size) => {
    const a = size ? ` width="${size}" height="${size}" style="color:rgba(255,255,255,.2)"` : '';
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"${a}>${COVERS[cat] || COVERS.Automation}</svg>`;
  };
  const chip = (t) => `<span class="chip">${esc(t)}</span>`;

  /* ---- builders ---- */
  const projectCard = (p) => `
    <article class="card project glow" data-cat="${esc(p.category)}">
      <div class="thumb"><span class="cat badge-cat">${esc(p.badge)}</span>${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">` : `<div class="ph">${shapeSvg(p.shape)}</div>`}</div>
      <div class="body"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
        <div class="tag-row">${(p.tags || []).map(chip).join('')}</div>
        <div class="result">${CHECK} ${esc(p.result)}</div></div>
    </article>`;

  const postCard = (p) => `
    <a href="post.html?slug=${encodeURIComponent(p.slug)}" class="card post-card glow" data-cat="${esc((p.category||'').toLowerCase())}">
      <div class="cover"><span class="cat badge-cat">${esc(p.category)}</span>${coverSvg(p.category)}</div>
      <div class="pbody"><div class="meta"><span>${fmtDate(p.date)}</span><span>${esc(p.reading_time)}</span></div>
        <h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p>
        <span class="card-link">Read ${ARROW}</span></div>
    </a>`;

  const featuredCard = (p) => `
    <a href="post.html?slug=${encodeURIComponent(p.slug)}" class="card glow" style="display:grid;grid-template-columns:1.1fr 1fr;gap:0;padding:0;overflow:hidden;margin-bottom:2.5rem">
      <div style="background:radial-gradient(circle at 30% 30%,rgba(34,211,238,.28),transparent 60%),radial-gradient(circle at 80% 80%,rgba(139,92,246,.22),transparent 55%),var(--surface-2);min-height:280px;display:grid;place-items:center;position:relative">
        <span class="badge-cat" style="position:absolute;top:1rem;left:1rem">Featured · ${esc(p.category)}</span>${coverSvg(p.category, 72)}
      </div>
      <div style="padding:clamp(1.6rem,3vw,2.4rem);display:flex;flex-direction:column;justify-content:center">
        <div style="font-family:var(--font-mono);font-size:.72rem;color:var(--text-muted);display:flex;gap:.8rem;margin-bottom:.7rem"><span>${fmtDate(p.date)}</span><span>${esc(p.reading_time)}</span></div>
        <h2 style="font-size:clamp(1.5rem,1.1rem+1.4vw,2rem);margin-bottom:.7rem">${esc(p.title)}</h2>
        <p>${esc(p.excerpt)}</p><span class="card-link mt-2">Read article ${ARROW}</span>
      </div>
    </a>`;

  /* ---- filters (re-bound for rendered grids) ---- */
  const bindFilters = (gridSel) => {
    const grid = $(gridSel); const group = $(`[data-filter-target="${gridSel}"]`);
    if (!grid || !group) return;
    const btns = $$('.filter', group);
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.classList.remove('active')); b.classList.add('active');
      const f = b.dataset.f;
      $$('[data-cat]', grid).forEach(c => { c.style.display = (f === 'all' || c.dataset.cat === f) ? '' : 'none'; });
    }));
  };

  const applySettings = (s) => {
    $$('a[href^="mailto:"]').forEach(a => { a.href = 'mailto:' + s.email; });
    $$('a[href^="tel:"]').forEach(a => { a.href = 'tel:' + (s.phone_href || s.phone || '').replace(/\s/g, ''); });
    $$('[data-cms="email"]').forEach(e => e.textContent = s.email);
    $$('[data-cms="phone"]').forEach(e => e.textContent = s.phone);
    $$('[data-cms="location"]').forEach(e => e.textContent = s.location);
    $$('[data-cms="response"]').forEach(e => e.textContent = s.response_time);
    const soc = { LinkedIn: s.linkedin, GitHub: s.github, X: s.x };
    Object.entries(soc).forEach(([k, v]) => { if (v && v !== '#') $$(`a[aria-label="${k}"]`).forEach(a => a.href = v); });
    const cf = $('#contact-form'); if (cf && s.email) cf.dataset.email = s.email;
  };

  const renderPost = (posts) => {
    const pa = $('#post-article'); if (!pa) return;
    const slug = new URLSearchParams(location.search).get('slug');
    const p = posts.find(x => x.slug === slug);
    if (!p) { pa.innerHTML = '<section class="section center" style="padding-top:8rem"><div class="container"><h1>Post not found</h1><p class="lead mt-2 muted">That article doesn\'t exist or was moved.</p><a href="blog.html" class="btn btn-ghost mt-3">← All insights</a></div></section>'; return; }
    document.title = p.title + ' | INVENTRA Insights';
    // SEO: per-post canonical + description
    const head = document.head;
    let can = head.querySelector('link[rel="canonical"]');
    if (!can) { can = document.createElement('link'); can.rel = 'canonical'; head.appendChild(can); }
    can.href = 'https://inventradas.github.io/post.html?slug=' + encodeURIComponent(p.slug);
    let mdesc = head.querySelector('meta[name="description"]');
    if (!mdesc) { mdesc = document.createElement('meta'); mdesc.name = 'description'; head.appendChild(mdesc); }
    mdesc.content = (p.excerpt || '').slice(0, 160);
    const md = Array.isArray(p.body) ? p.body.join('\n') : (p.body || '');
    const html = (window.marked ? window.marked.parse(md) : esc(md));
    pa.innerHTML = `
      <section class="page-hero bg-grid">
        <div class="glow-orb glow-pulse" style="width:460px;height:460px;background:#22d3ee;top:-160px;right:-40px"></div>
        <div class="container" style="max-width:820px">
          <div class="breadcrumb"><a href="index.html">Home</a><span class="sep">/</span><a href="blog.html">Insights</a><span class="sep">/</span><span>${esc(p.category)}</span></div>
          <span class="badge-cat mt-2" style="display:inline-block">${esc(p.category)}</span>
          <h1 style="margin-top:1rem">${esc(p.title)}</h1>
          <div style="font-family:var(--font-mono);font-size:.78rem;color:var(--text-muted);display:flex;gap:.8rem;margin-top:1rem"><span>${fmtDate(p.date)}</span><span>·</span><span>${esc(p.reading_time)}</span><span>·</span><span>By INVENTRA</span></div>
        </div>
      </section>
      <section class="section" style="padding-top:clamp(1.5rem,3vw,2.5rem)"><div class="container prose">${html}</div></section>
      <section class="section" style="padding-top:0"><div class="container"><div class="cta-band">
        <h2>Have a similar challenge?</h2><p>Tell us what you're building — a senior engineer will reply within a day.</p>
        <div class="cta-actions"><a href="contact.html" class="btn btn-primary">Get in touch ${ARROW}</a><a href="blog.html" class="btn btn-ghost">← All insights</a></div>
      </div></div></section>`;
  };

  async function init() {
    try { applySettings(await getJSON('content/settings.json')); } catch (e) {}

    if ($('#project-grid') || $('#home-projects')) {
      try {
        const items = (await getJSON('content/projects.json')).items || [];
        const hp = $('#home-projects'); if (hp) hp.innerHTML = items.slice(0, 3).map(projectCard).join('');
        const pg = $('#project-grid'); if (pg) { pg.innerHTML = items.map(projectCard).join(''); bindFilters('#project-grid'); }
      } catch (e) {}
    }

    if ($('#blog-grid') || $('#blog-featured') || $('#home-insights') || $('#post-article')) {
      try {
        const posts = (await getJSON('content/blog.json')).posts || [];
        const bf = $('#blog-featured'); if (bf) bf.innerHTML = featuredCard(posts.find(p => p.featured) || posts[0]);
        const bg = $('#blog-grid'); if (bg) { bg.innerHTML = posts.map(postCard).join(''); bindFilters('#blog-grid'); }
        const hi = $('#home-insights'); if (hi) hi.innerHTML = posts.slice(0, 3).map(postCard).join('');
        renderPost(posts);
      } catch (e) { const pa = $('#post-article'); if (pa) pa.innerHTML = '<section class="section center" style="padding-top:8rem"><div class="container"><h1>Couldn\'t load this article</h1><a href="blog.html" class="btn btn-ghost mt-3">← All insights</a></div></section>'; }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
