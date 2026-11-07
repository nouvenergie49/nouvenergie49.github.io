// Résultats Pagefind : pastilles de type (icône) devant l'extrait, d'après la meta `types`
window.pdlPagefindProcess = (result) => {
  const T = { video: ['videocam', 'Vidéo'], carrousel: ['filter_none', 'Carrousel'], montage: ['groups', 'Montage'], image: ['image', 'Image'], temoignage: ['record_voice_over', 'Témoignage sur David Lisnard'], short: ['tv', 'Short'] };
  const types = (result.meta && result.meta.types || '').split(',').filter(Boolean);
  const html = types.map((t) => t === 'banger'
    ? '<span class="pf-type" title="🔥 forte diffusion">🔥</span>'
    : T[t] ? `<span class="pf-type" title="${T[t][1]}"><span class="material-symbols-outlined" aria-hidden="true">${T[t][0]}</span></span>` : '').join('');
  if (result.meta) delete result.meta.types;
  if (html) result.excerpt = `<span class="pf-types">${html}</span> ${result.excerpt}`;
  return result;
};

// Onglets de filtre Pagefind (Punchlines/Shorts/Tout) : partagé entre /recherche/ et la recherche live de l'accueil
window.pdlWireFilterTabs = (container, ui) => {
  container.querySelectorAll('[data-pdl-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-pdl-filter]').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      const v = btn.dataset.pdlFilter;
      ui.triggerFilters(v ? { contenu: [v] } : {});
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const toggle = (btn, panel) => {
    if (!btn || !panel) return;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  };
  toggle(document.getElementById('drawerToggle'), document.getElementById('drawer'));
  toggle(document.querySelector('.drawer-sub-toggle'), document.getElementById('drawerSub'));

  // Copie de la citation + carte Instagram
  const toast = (msg) => {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
  };
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
  };
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    await copy(copyBtn.dataset.copy);
    const lbl = copyBtn.querySelector('.lbl'); const old = lbl.textContent;
    lbl.textContent = 'Copié !'; setTimeout(() => (lbl.textContent = old), 1800);
  });
  // Icône « copier » des cartes de punchlines et de shorts (délégation : couvre toutes les listes)
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('.card-copy, .card-copy-link');
    if (!b) return;
    e.preventDefault();
    await copy(b.dataset.copy);
    toast(b.dataset.toast || 'Copié');
  });
  const igBtn = document.getElementById('igBtn');
  if (igBtn) igBtn.addEventListener('click', async () => { await copy(igBtn.dataset.copy); toast('Légende copiée, affiche téléchargée : à coller dans Instagram'); });

  // Thème clair/sombre (sombre par défaut) : le choix est mémorisé dans le navigateur
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    const paint = () => {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      const label = light ? 'Passer en mode sombre' : 'Passer en mode clair';
      themeBtn.setAttribute('aria-label', label); themeBtn.title = label;
    };
    themeBtn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('pdl-theme', next); } catch (e) { /* navigation privée : le choix ne sera pas mémorisé */ }
      paint();
    });
    paint();
  }

  // Carrousel d'images : le glissement est natif (scroll-snap) ; flèches, points et clavier en complément
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('.carousel-track');
    const slides = [...root.querySelectorAll('.carousel-slide')];
    const dots = [...root.querySelectorAll('.carousel-dot')];
    const prev = root.querySelector('.carousel-nav--prev');
    const next = root.querySelector('.carousel-nav--next');
    const current = () => Math.round(track.scrollLeft / track.clientWidth);
    const go = (i) => track.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * track.clientWidth });
    const sync = () => {
      const i = current();
      dots.forEach((d, k) => d.setAttribute('aria-selected', String(k === i)));
      prev.hidden = i === 0;
      next.hidden = i === slides.length - 1;
    };
    track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    prev.addEventListener('click', () => go(current() - 1));
    next.addEventListener('click', () => go(current() + 1));
    dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
    });
    window.addEventListener('resize', () => go(current()));
    sync();
  });

  // Carrousel dans les cartes de liste : glissement natif, points en surimpression, flèches au survol (les clics ne suivent pas le lien de la carte)
  document.querySelectorAll('[data-card-carousel]').forEach((root) => {
    const track = root.querySelector('.cc-track');
    const n = track.children.length;
    const dots = [...root.querySelectorAll('.cc-dot')];
    const prev = root.querySelector('.cc-nav--prev');
    const next = root.querySelector('.cc-nav--next');
    const current = () => Math.round(track.scrollLeft / track.clientWidth);
    const go = (i) => track.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * track.clientWidth });
    const sync = () => {
      const i = current();
      dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
      prev.hidden = i === 0;
      next.hidden = i === n - 1;
    };
    const press = (el, fn) => el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
    press(prev, () => go(current() - 1));
    press(next, () => go(current() + 1));
    dots.forEach((d, k) => press(d, () => go(k)));
    track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    window.addEventListener('resize', () => go(current()));
    sync();
  });

  // Façade YouTube : l'iframe ne se charge qu'au clic (RGPD + performance)
  document.querySelectorAll('.yt-facade').forEach((el) => {
    const load = () => {
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + el.dataset.yt + '?autoplay=1&rel=0';
      f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; f.title = 'Vidéo';
      el.replaceChildren(f);
    };
    el.addEventListener('click', load);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(); } });
  });

  // Accueil : recherche en direct (Pagefind chargé au premier focus/frappe, repli = formulaire vers /recherche/)
  const homeForm = document.querySelector('.home-search-form');
  const homeBox = document.getElementById('home-search');
  const homeBrowse = document.getElementById('home-browse');
  if (homeForm && homeBox && homeBrowse) {
    const base = homeForm.dataset.pagefindBase;
    const input = homeForm.querySelector('input[type=search]');
    let started = false;
    const loadAsset = (tag, attrs) => new Promise((res, rej) => {
      const el = Object.assign(document.createElement(tag), attrs);
      el.onload = res; el.onerror = rej; document.head.appendChild(el);
    });
    const start = async () => {
      if (started) return;
      started = true;
      try {
        await Promise.all([
          loadAsset('link', { rel: 'stylesheet', href: base + 'pagefind-ui.css' }),
          loadAsset('script', { src: base + 'pagefind-ui.js' }),
        ]);
      } catch (e) { started = false; return; }
      const ui = new PagefindUI({
        element: '#home-search', bundlePath: base, showSubResults: false, showImages: false, autofocus: false, processResult: window.pdlPagefindProcess,
        translations: { placeholder: 'Un mot, une expression, un sujet...', clear_search: 'Effacer', load_more: 'Voir plus', search_label: 'Rechercher', filters_label: 'Filtres', zero_results: 'Aucun résultat pour [SEARCH_TERM]', many_results: '[COUNT] résultats pour [SEARCH_TERM]', one_result: '[COUNT] résultat pour [SEARCH_TERM]' },
      });
      const filterBar = document.querySelector('.home-search-filters');
      if (filterBar) { filterBar.hidden = false; window.pdlWireFilterTabs(filterBar, ui); }
      const live = homeBox.querySelector('.pagefind-ui__search-input');
      const sync = () => { homeBrowse.hidden = live.value.trim() !== ''; };
      live.addEventListener('input', sync);
      homeBox.addEventListener('click', () => setTimeout(sync, 0));
      homeForm.hidden = true; homeBox.hidden = false;
      const q = input.value;
      live.value = q; live.focus();
      if (q) live.dispatchEvent(new Event('input', { bubbles: true }));
      sync();
    };
    input.addEventListener('focus', start, { once: true });
    input.addEventListener('input', start, { once: true });
  }
});
