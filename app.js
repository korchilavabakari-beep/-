'use strict';
/* მთავარი აპლიკაცია: როუტერი, გვერდები, UI კომპონენტები */

const main = $('#main');
const S = { user: null, notif: 0 };
let navId = 0;

/* ---------- SVG აიკონები ---------- */
const ICON = {
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 20a2 2 0 0 0 3.4 0"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.4C1.1 8.1 3 4.5 6.5 4.5c2 0 3.7 1.1 5.5 3.1 1.8-2 3.5-3.1 5.5-3.1 3.5 0 5.4 3.6 4 7.1C19.500 16.400 12 21 12 21z" stroke-linejoin="round"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.800 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.200 2 19.800 19.800 0 0 1-8.600-3.100 19.500 19.500 0 0 1-6-6A19.800 19.800 0 0 1 2.100 4.200 2 2 0 0 1 4.100 2h3a2 2 0 0 1 2 1.700c.1 1 .4 1.900.7 2.800a2 2 0 0 1-.5 2.100L8.100 9.900a16 16 0 0 0 6 6l1.300-1.300a2 2 0 0 1 2.100-.4c.9.300 1.800.6 2.800.7a2 2 0 0 1 1.700 2z"/></svg>',
  img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.800"/><path d="m21 15-5-5L5 21"/></svg>'
};

/* ---------- UI დამხმარეები ---------- */
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type; el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function openModal(html, onMount) {
  const root = $('#modal-root');
  const prev = document.activeElement;
  root.innerHTML = `<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  const bg = $('.modal-bg', root);
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) close(); });
  $$('[data-close]', root).forEach((b) => b.addEventListener('click', close));
  (root.querySelector('input,button.btn') || root.querySelector('button'))?.focus();
  onMount?.(root, close);
  return close;
}

const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };
const initials = (u) => (u.name || '?')[0] + ((u.surname || '')[0] || '');
const imgOf = (c, i = 0) => c.images?.[i] || c.images?.[0] || PLACEHOLDER_IMG;

function carTitle(c) { return `${c.brand} ${c.model}`.trim(); }

function carCard(c) {
  const liked = S.user && Likes.has(S.user.id, c.id);
  return `<article class="car">
    <a class="car-img" href="#/car/${esc(c.id)}" aria-label="${esc(carTitle(c))}"><img src="${esc(imgOf(c))}" alt="${esc(carTitle(c))}" loading="lazy"></a>
    <span class="plate price-pos"><b>${money(c.pricePerDay)}</b><i>₾ / დღე</i></span>
    <button class="like ${liked ? 'on' : ''}" data-like="${esc(c.id)}" aria-pressed="${!!liked}" aria-label="${liked ? 'მოწონების მოხსნა' : 'მოწონება'}">${ICON.heart}</button>
    <div class="car-body">
      <h3><a href="#/car/${esc(c.id)}">${esc(carTitle(c))}</a></h3>
      <ul class="meta">
        <li class="yr">${esc(c.year ?? '—')}</li>
        <li>${esc(c.capacity ?? '—')} ადგილი</li>
        <li>${esc(TRANS[c.transmission])}</li>
      </ul>
      <p class="loc">${ICON.pin}${esc(c.city || 'ქალაქი არ არის მითითებული')}</p>
    </div>
  </article>`;
}

const grid = (cars) => `<div class="grid">${cars.map(carCard).join('')}</div>`;
const skeletons = (n = 4) => `<div class="grid">${'<div class="skeleton"></div>'.repeat(n)}</div>`;
const errorBox = (msg, retry = true) => `<div class="empty"><h3>მონაცემები ვერ ჩაიტვირთა</h3><p>${esc(msg)}</p>${retry ? '<button class="btn" data-retry>თავიდან ცდა</button>' : ''}</div>`;

/* მოწონება — გლობალური დელეგირება */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-like]'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  if (!S.user) { toast('მოსაწონებლად გაიარეთ ავტორიზაცია'); go('#/login?next=' + encodeURIComponent(location.hash.slice(1) || '/')); return; }
  const on = Likes.toggle(S.user.id, b.dataset.like);
  $$(`[data-like="${CSS.escape(b.dataset.like)}"]`).forEach((x) => {
    x.classList.toggle('on', on); x.setAttribute('aria-pressed', on);
    x.setAttribute('aria-label', on ? 'მოწონების მოხსნა' : 'მოწონება');
  });
  document.dispatchEvent(new CustomEvent('likechange'));
});
document.addEventListener('error', (e) => {
  const t = e.target;
  if (t.tagName === 'IMG' && !t.dataset.fb) { t.dataset.fb = '1'; t.src = PLACEHOLDER_IMG; }
}, true);

/* ---------- ნავიგაცია და ფუტერი ---------- */
function renderNav() {
  const u = S.user;
  $('#nav').innerHTML = `<div class="wrap">
    <a class="logo" href="#/" aria-label="ავტორენტი — მთავარი"><span class="ge">GE</span><b>ავტორენტი</b></a>
    <nav class="nav-actions" aria-label="ძირითადი ნავიგაცია">${u ? `
      <a class="btn sm" href="#/add">${ICON.plus}<span>დამატება</span></a>
      <a class="icon-btn" href="#/notifications" aria-label="ნოტიფიკაციები${S.notif ? ` (${S.notif} ახალი)` : ''}">${ICON.bell}${S.notif ? `<span class="badge">${S.notif}</span>` : ''}</a>
      <a class="me" href="#/profile" title="პროფილი"><i>${esc(initials(u))}</i><span>${esc(u.name)}</span></a>
      <button class="icon-btn" id="logout" aria-label="გამოსვლა" title="გამოსვლა">${ICON.out}</button>`
    : `<a class="btn sm" href="#/login">ავტორიზაცია</a>`}</nav>
  </div>`;
  $('#logout')?.addEventListener('click', () => {
    Data.logout(); S.user = null; S.notif = 0; renderNav(); toast('გამოხვედით სისტემიდან'); go('#/');
  });
}

function renderFooter() {
  $('#footer').innerHTML = `<div class="wrap"><span>© ${new Date().getFullYear()} ავტორენტი · საკურსო პროექტი</span>
    ${Data.mode === 'demo' ? '<span class="chip" title="რეალური API ვერ მოიძებნა; მონაცემები ინახება ამ ბრაუზერში">დემო მონაცემები</span>' : '<span>დაკავშირებულია API-სთან</span>'}</div>`;
}

async function refreshNotif() {
  if (!S.user) { S.notif = 0; return; }
  try { S.notif = (await Data.getNotifications(S.user)).filter((n) => !n.read).length; } catch { S.notif = 0; }
}

/* ======================================================================
   გვერდები
   ====================================================================== */

/* ---------- მთავარი ---------- */
async function pageHome(_, __, id) {
  main.innerHTML = `
  <section class="hero"><div class="wrap">
    <div>
      <h1>იქირავე მანქანა პირდაპირ მფლობელისგან</h1>
      <p class="lead">აირჩიე ქალაქი, წელი და ადგილების რაოდენობა — დანარჩენს ჩვენ გაჩვენებთ.</p>
      <div class="search"><div class="strip">GE<span>★★★</span></div>
        <form id="hero-search">
          <label class="field"><span>ქალაქი</span><input name="city" list="city-list" placeholder="მაგ: ბათუმი" autocomplete="off"></label>
          <label class="field"><span>წლიდან</span><input name="from" type="number" inputmode="numeric" min="1950" max="2030" placeholder="1995"></label>
          <label class="field"><span>წლამდე</span><input name="to" type="number" inputmode="numeric" min="1950" max="2030" placeholder="2005"></label>
          <label class="field"><span>ტევადობა</span><select name="seats"><option value="">ნებისმიერი</option>${[2, 4, 5, 6, 7, 8, 9, 12].map((n) => `<option value="${n}">${n} კაცი</option>`).join('')}</select></label>
          <button class="btn dark" type="submit">ძებნა</button>
        </form>
      </div>
      <datalist id="city-list">${CITIES.map((c) => `<option value="${c}">`).join('')}</datalist>
    </div>
    <img class="hero-car" alt="" src="${carSvg({ color: '#ffc83d', body: 'suv', bare: true })}">
  </div></section>
  <div class="wrap">
    <section class="section" aria-labelledby="pop-h"><div class="section-head"><div><h2 id="pop-h">პოპულარული მანქანები</h2><p>ყველაზე ხშირად დაქირავებული</p></div><a href="#/filter">ყველა მანქანა</a></div><div id="popular">${skeletons(4)}</div></section>
    <section class="section" aria-labelledby="rnd-h"><div class="section-head"><div><h2 id="rnd-h">შემთხვევითი არჩევანი</h2><p>შეიძლება სწორედ ეს გიხდება</p></div><button class="btn ghost sm" id="reshuffle">სხვა მანქანები</button></div><div id="random">${skeletons(8)}</div></section>
  </div>`;

  $('#hero-search').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    new FormData(e.target).forEach((v, k) => { if (String(v).trim()) p.set(k, String(v).trim()); });
    go('#/filter' + (p.toString() ? '?' + p : ''));
  });

  const load = async () => {
    try {
      const cars = await Data.cars();
      if (id !== navId) return;
      if (!cars.length) { $('#popular').innerHTML = '<div class="empty"><h3>ჯერ მანქანები არ არის დამატებული</h3><p>იყავით პირველი — განათავსეთ თქვენი მანქანა.</p><a class="btn" href="#/add">მანქანის დამატება</a></div>'; $('#random').innerHTML = ''; return; }
      const popular = [...cars].sort((a, b) => (b.rentCount || 0) - (a.rentCount || 0)).slice(0, 4);
      const ids = new Set(popular.map((c) => c.id));
      const draw = () => { $('#random').innerHTML = grid(shuffle(cars.filter((c) => !ids.has(c.id))).slice(0, 8)); };
      $('#popular').innerHTML = grid(popular); draw();
      $('#reshuffle').onclick = draw;
    } catch (err) {
      if (id !== navId) return;
      $('#popular').innerHTML = errorBox(err.message); $('#random').innerHTML = '';
      $('[data-retry]')?.addEventListener('click', () => { Data.invalidate(); route(); });
    }
  };
  load();
}

/* ---------- რეგისტრაცია ---------- */
function pageRegister() {
  main.innerHTML = `<div class="page"><div class="auth">
    <h1 class="page-title">რეგისტრაცია</h1><p class="page-sub">შექმენით ანგარიში, რომ იქირაოთ ან განათავსოთ მანქანა.</p>
    <form class="card-form form-grid" id="reg" novalidate>
      <div class="form-grid two">
        <label class="field"><span>სახელი</span><input name="name" required autocomplete="given-name"></label>
        <label class="field"><span>გვარი</span><input name="surname" required autocomplete="family-name"></label>
      </div>
      <label class="field"><span>ტელეფონის ნომერი</span><input name="phone" type="tel" inputmode="numeric" placeholder="591299899" required autocomplete="tel"><small>9 ციფრი, კოდის გარეშე</small></label>
      <label class="field"><span>ელ. ფოსტა</span><input name="email" type="email" placeholder="name@example.com" required autocomplete="email"></label>
      <label class="field"><span>პაროლი</span><input name="password" type="password" minlength="6" required autocomplete="new-password"><small>მინიმუმ 6 სიმბოლო</small></label>
      <div class="form-error" id="reg-err" role="alert" hidden></div>
      <button class="btn block" type="submit">რეგისტრაცია</button>
      <p class="form-foot" style="margin:0">უკვე გაქვთ ანგარიში? <a href="#/login">ავტორიზაცია</a></p>
    </form></div></div>`;
  const form = $('#reg'), errBox = $('#reg-err');
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); errBox.hidden = true;
    const d = Object.fromEntries(new FormData(form)); Object.keys(d).forEach((k) => { d[k] = String(d[k]).trim(); });
    const problem = !d.name ? 'შეიყვანეთ სახელი' : !d.surname ? 'შეიყვანეთ გვარი' : !validPhone(d.phone) ? 'ტელეფონის ნომერი უნდა შედგებოდეს 9 ციფრისგან (მაგ. 591299899)'
      : !/^\S+@\S+\.\S+$/.test(d.email) ? 'შეიყვანეთ სწორი ელ. ფოსტა' : d.password.length < 6 ? 'პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს' : '';
    if (problem) { errBox.textContent = problem; errBox.hidden = false; return; }
    const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'იგზავნება…';
    try {
      await Data.register(d);
      toast('რეგისტრაცია დასრულდა. გაიარეთ ავტორიზაცია', 'ok');
      go('#/login?phone=' + encodeURIComponent(cleanPhone(d.phone)));
    } catch (err) { errBox.textContent = err.message; errBox.hidden = false; btn.disabled = false; btn.textContent = 'რეგისტრაცია'; }
  });
}

/* ---------- ავტორიზაცია ---------- */
function pageLogin(_, q) {
  main.innerHTML = `<div class="page"><div class="auth">
    <h1 class="page-title">ავტორიზაცია</h1><p class="page-sub">შედით ტელეფონის ნომრით.</p>
    <form class="card-form form-grid" id="login" novalidate>
      <label class="field"><span>ტელეფონის ნომერი</span><input name="phone" type="tel" inputmode="numeric" placeholder="591299899" required autocomplete="tel" value="${esc(q.phone || '')}"></label>
      <label class="field"><span>პაროლი</span><input name="password" type="password" required autocomplete="current-password"></label>
      <div class="form-error" id="login-err" role="alert" hidden></div>
      <button class="btn block" type="submit">შესვლა</button>
      <p class="form-foot" style="margin:0">ანგარიში არ გაქვთ? <a href="#/register">რეგისტრაცია</a></p>
    </form>
    ${Data.mode === 'demo' ? `<p class="demo-hint">${esc(Data.hint)}</p>` : ''}
  </div></div>`;
  const form = $('#login'), errBox = $('#login-err');
  (q.phone ? $('[name=password]', form) : $('[name=phone]', form)).focus();
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); errBox.hidden = true;
    const d = Object.fromEntries(new FormData(form));
    if (!validPhone(d.phone)) { errBox.textContent = 'ტელეფონის ნომერი უნდა შედგებოდეს 9 ციფრისგან'; errBox.hidden = false; return; }
    if (!d.password) { errBox.textContent = 'შეიყვანეთ პაროლი'; errBox.hidden = false; return; }
    const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'მოწმდება…';
    try {
      S.user = await Data.login(d);
      await refreshNotif(); renderNav();
      toast(`მოგესალმებით, ${S.user.name}`, 'ok');
      go('#' + (q.next ? decodeURIComponent(q.next) : '/'));
    } catch (err) { errBox.textContent = err.message; errBox.hidden = false; btn.disabled = false; btn.textContent = 'შესვლა'; }
  });
}

/* ---------- ფილტრაცია ---------- */
async function pageFilter(_, q, id) {
  main.innerHTML = `<div class="page"><div class="wrap">
    <h1 class="page-title">მანქანების ძებნა</h1><p class="page-sub">ფილტრები შეგიძლიათ გამოიყენოთ ცალ-ცალკე ან ერთად.</p>
    <div class="filter-layout">
      <form class="filter-panel" id="filters" aria-label="ფილტრები">
        <h2>ფილტრები</h2>
        <label class="field"><span>ბრენდი ან მოდელი</span><input name="q" type="search" placeholder="მაგ: Mercedes, E320, ტოიოტა" autocomplete="off" value="${esc(q.q || '')}"></label>
        <label class="field"><span>ქალაქი</span><input name="city" list="city-list" placeholder="მაგ: ბათუმი" autocomplete="off" value="${esc(q.city || '')}"></label>
        <div class="year-pair">
          <label class="field"><span>გამოშვების წელი</span><input name="from" type="number" inputmode="numeric" placeholder="1995" value="${esc(q.from || '')}"></label>
          <label class="field"><span>&nbsp;</span><input name="to" type="number" inputmode="numeric" placeholder="2005" aria-label="წლამდე" value="${esc(q.to || '')}"></label>
        </div>
        <label class="field"><span>ტევადობა</span><select name="seats"></select></label>
        <button class="btn ghost" type="button" id="reset-filters">ფილტრების გასუფთავება</button>
        <datalist id="city-list">${CITIES.map((c) => `<option value="${c}">`).join('')}</datalist>
      </form>
      <section aria-live="polite">
        <div class="result-bar"><span class="count" id="count"></span>
          <label class="field"><span>დალაგება</span><select id="sort"><option value="">ნაგულისხმევი</option><option value="p1">ფასი: ზრდადობით</option><option value="p2">ფასი: კლებადობით</option><option value="y2">ყველაზე ახალი</option></select></label></div>
        <div id="results">${skeletons(6)}</div>
      </section>
    </div></div></div>`;

  let cars;
  try { cars = await Data.cars(); } catch (err) {
    if (id !== navId) return;
    $('#results').innerHTML = errorBox(err.message); $('[data-retry]')?.addEventListener('click', () => { Data.invalidate(); route(); }); return;
  }
  if (id !== navId) return;

  const form = $('#filters');
  const caps = [...new Set([2, 4, 5, 6, 7, 8, 9, 12, ...cars.map((c) => c.capacity).filter(Boolean)])].sort((a, b) => a - b);
  $('[name=seats]', form).innerHTML = '<option value="">ნებისმიერი</option>' + caps.map((n) => `<option value="${n}" ${String(q.seats) === String(n) ? 'selected' : ''}>${n} კაციანი</option>`).join('');

  const apply = () => {
    const f = Object.fromEntries(new FormData(form));
    const kw = String(f.q || '').trim(), city = String(f.city || '').trim().toLowerCase(), from = +f.from || 0, to = +f.to || 0, seats = +f.seats || 0;
    let list = cars.filter((c) =>
      carMatches(c, kw) && (!city || String(c.city).toLowerCase().includes(city)) &&
      (!from || (c.year || 0) >= from) && (!to || (c.year || 9999) <= to) &&
      (!seats || Number(c.capacity) === seats));
    const s = $('#sort').value;
    if (s === 'p1') list.sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (s === 'p2') list.sort((a, b) => b.pricePerDay - a.pricePerDay);
    if (s === 'y2') list.sort((a, b) => (b.year || 0) - (a.year || 0));
    $('#count').textContent = list.length ? `ნაპოვნია ${list.length} მანქანა` : 'შედეგი ვერ მოიძებნა';
    $('#results').innerHTML = list.length ? grid(list)
      : '<div class="empty"><h3>ამ პარამეტრებით მანქანა არ არის</h3><p>სცადეთ წლების დიაპაზონის გაფართოება ან სხვა ქალაქის არჩევა.</p></div>';
    const p = new URLSearchParams(); Object.entries({ q: f.q, city: f.city, from: f.from, to: f.to, seats: f.seats }).forEach(([k, v]) => { if (String(v || '').trim()) p.set(k, String(v).trim()); });
    history.replaceState(null, '', '#/filter' + (p.toString() ? '?' + p : ''));
  };
  form.addEventListener('input', apply); form.addEventListener('change', apply);
  form.addEventListener('submit', (e) => e.preventDefault());
  $('#sort').addEventListener('change', apply);
  $('#reset-filters').addEventListener('click', () => { form.reset(); $('[name=seats]', form).value = ''; apply(); });
  apply();
}

/* ---------- მანქანის გვერდი ---------- */
async function pageCar([carId], _, id) {
  main.innerHTML = `<div class="page"><div class="wrap"><div class="skeleton" style="height:420px"></div></div></div>`;
  let c;
  try { c = await Data.car(carId); } catch (err) { if (id !== navId) return; main.innerHTML = `<div class="page"><div class="wrap">${errorBox(err.message)}</div></div>`; $('[data-retry]')?.addEventListener('click', route); return; }
  if (id !== navId) return;
  if (!c) { main.innerHTML = '<div class="page"><div class="wrap"><div class="empty"><h3>მანქანა ვერ მოიძებნა</h3><p>შესაძლოა განცხადება წაშლილია.</p><a class="btn" href="#/filter">ყველა მანქანა</a></div></div></div>'; return; }

  const imgs = c.images?.length ? c.images : [PLACEHOLDER_IMG];
  const mine = S.user && ((c.ownerId != null && String(c.ownerId) === String(S.user.id)) || (c.ownerPhone && cleanPhone(c.ownerPhone) === cleanPhone(S.user.phone)));
  const liked = S.user && Likes.has(S.user.id, c.id);
  const hasGeo = c.latitude != null && c.longitude != null;
  const spec = (k, v) => `<div><dt>${k}</dt><dd>${esc(v ?? '—')}</dd></div>`;

  main.innerHTML = `<div class="page"><div class="wrap">
    <p class="crumbs"><a href="#/filter">← ყველა მანქანა</a></p>
    <div class="detail">
      <div>
        <div class="gallery">
          <div class="main"><img id="main-img" src="${esc(imgs[0])}" alt="${esc(carTitle(c))}"></div>
          ${imgs.length > 1 ? `<div class="thumbs">${imgs.slice(0, 3).map((s, i) => `<button type="button" data-i="${i}" aria-label="ფოტო ${i + 1}" aria-current="${i === 0}"><img src="${esc(s)}" alt=""></button>`).join('')}</div>` : ''}
        </div>
        <div class="specs"><h2>დეტალური ინფორმაცია</h2><dl>
          ${spec('ბრენდი', c.brand)}${spec('მოდელი', c.model)}${spec('გამოშვების წელი', c.year)}${spec('ტევადობა', c.capacity != null ? c.capacity + ' კაცი' : null)}
          ${spec('ტრანსმისია', TRANS[c.transmission])}${spec('ბენზინის ბაკი', c.fuelCapacity != null ? c.fuelCapacity + ' ლ' : null)}
          ${spec('ქალაქი', c.city)}${spec('დღიური ფასი', money(c.pricePerDay) + ' ₾')}
        </dl></div>
        <div class="map-wrap"><h2>სად იმყოფება მანქანა</h2>
          ${hasGeo ? '<div id="map" role="img" aria-label="მანქანის ლოკაცია რუკაზე"></div>' : '<p class="map-empty">მფლობელს ლოკაცია არ მიუთითებია. მანქანა იმყოფება: ' + esc(c.city || 'ქალაქი უცნობია') + '.</p>'}
        </div>
      </div>
      <aside class="buy">
        <div><h1>${esc(carTitle(c))}</h1><p class="loc" style="margin-top:6px">${ICON.pin}${esc(c.city)} · ${esc(c.year ?? '')}</p></div>
        <span class="plate lg" style="justify-self:start"><b>${money(c.pricePerDay)}</b><i>₾ / დღე</i></span>
        <div class="owner">${ICON.phone}<div><small>განცხადება დაამატა</small>${c.ownerPhone ? `<a href="tel:${esc(cleanPhone(c.ownerPhone))}">${esc(fmtPhone(c.ownerPhone))}</a>` : '<span>ნომერი არ არის მითითებული</span>'}</div></div>
        ${mine ? '<p class="form-ok">ეს თქვენი განცხადებაა, ამიტომ მის დაქირავებას ვერ შეძლებთ.</p>'
      : `<button class="btn block" id="rent">მანქანის დაქირავება</button>`}
        <button class="btn ghost block like-btn ${liked ? 'on' : ''}" data-like="${esc(c.id)}" aria-pressed="${!!liked}" style="position:static;border-radius:8px;width:100%;height:auto;min-height:44px;box-shadow:none">${ICON.heart.replace('<svg', '<svg style="width:18px;height:18px;margin-right:8px;vertical-align:-3px"')} ${liked ? 'მოწონებულია' : 'მოწონება'}</button>
      </aside>
    </div></div></div>`;

  $$('.thumbs button').forEach((b) => b.addEventListener('click', () => {
    $('#main-img').src = imgs[+b.dataset.i];
    $$('.thumbs button').forEach((x) => x.setAttribute('aria-current', x === b));
  }));
  // მოწონების ღილაკის ტექსტი
  document.addEventListener('likechange', function h() {
    if (!$('.like-btn')) { document.removeEventListener('likechange', h); return; }
    const on = S.user && Likes.has(S.user.id, c.id);
    $('.like-btn').lastChild.textContent = ' ' + (on ? 'მოწონებულია' : 'მოწონება');
  });

  $('#rent')?.addEventListener('click', () => {
    if (!S.user) { toast('დასაქირავებლად გაიარეთ ავტორიზაცია'); go('#/login?next=' + encodeURIComponent('/car/' + c.id)); return; }
    openRentModal(c);
  });

  if (hasGeo) mountMap(c);
}

function mountMap(c) {
  const start = Date.now();
  (function tryMount() {
    if (!window.L) { if (Date.now() - start < 4000) return setTimeout(tryMount, 200); const mp = $('#map'); if (mp) mp.outerHTML = `<p class="map-empty">რუკა ვერ ჩაიტვირთა. <a target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=15/${c.latitude}/${c.longitude}">გახსენით OpenStreetMap-ზე</a></p>`; return; }
    const el = $('#map'); if (!el) return;
    const map = L.map(el, { scrollWheelZoom: false }).setView([c.latitude, c.longitude], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    L.marker([c.latitude, c.longitude], { icon: L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [22, 22], iconAnchor: [11, 22] }) }).addTo(map);
  })();
}

function openRentModal(c) {
  openModal(`
    <h2>${esc(carTitle(c))} — დაქირავება</h2>
    <div class="field"><span>რამდენი დღით?</span>
      <div class="stepper"><button type="button" id="dn" aria-label="დღის შემცირება">−</button><input id="days" type="number" min="1" max="90" value="1" inputmode="numeric" aria-label="დღეების რაოდენობა"><button type="button" id="up" aria-label="დღის გაზრდა">+</button></div></div>
    <div class="total"><span>სულ გადასახდელი<br><small style="color:var(--muted)"><span id="d-out">1</span> დღე × ${money(c.pricePerDay)} ₾</small></span><strong id="sum">${money(c.pricePerDay)} ₾</strong></div>
    <div class="form-error" id="rent-err" role="alert" hidden></div>
    <div class="modal-actions"><button class="btn ghost" data-close>გაუქმება</button><button class="btn" id="confirm">დადასტურება</button></div>`,
  (root, close) => {
    const inp = $('#days', root);
    const days = () => Math.min(90, Math.max(1, parseInt(inp.value, 10) || 1));
    const upd = () => { $('#d-out', root).textContent = days(); $('#sum', root).textContent = money(days() * c.pricePerDay) + ' ₾'; };
    inp.addEventListener('input', upd);
    $('#dn', root).onclick = () => { inp.value = Math.max(1, days() - 1); upd(); };
    $('#up', root).onclick = () => { inp.value = Math.min(90, days() + 1); upd(); };
    $('#confirm', root).onclick = async (e) => {
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'მუშავდება…';
      try {
        const d = days();
        await Data.rentCar({ carId: c.id, days: d, amount: d * c.pricePerDay, city: c.city }, S.user);
        close(); toast(`${carTitle(c)} დაიქირავეთ ${d} დღით`, 'ok'); go('#/profile?tab=rented');
      } catch (err) { const b = $('#rent-err', root); b.textContent = err.message; b.hidden = false; btn.disabled = false; btn.textContent = 'დადასტურება'; }
    };
  });
}

/* ---------- მანქანის დამატება ---------- */
function pageAdd() {
  const u = S.user; let geo = null; const files = [null, null, null];
  main.innerHTML = `<div class="page"><div class="wrap" style="max-width:760px">
    <h1 class="page-title">მანქანის დამატება</h1><p class="page-sub">შეავსეთ ინფორმაცია — განცხადება მაშინვე გამოჩნდება სიაში.</p>
    <form class="card-form form-grid" id="add" novalidate>
      <div class="form-grid two">
        <label class="field"><span>ბრენდი</span><input name="brand" list="brands" placeholder="Mercedes" required autocomplete="off"></label>
        <label class="field"><span>მოდელი</span><input name="model" placeholder="E320" required autocomplete="off"></label>
        <label class="field"><span>გამოშვების წელი</span><input name="year" type="number" inputmode="numeric" min="1950" max="${new Date().getFullYear() + 1}" placeholder="2015" required></label>
        <label class="field"><span>დღიური ფასი (₾)</span><input name="pricePerDay" type="number" inputmode="numeric" min="1" placeholder="90" required></label>
        <label class="field"><span>ტევადობა (კაცი)</span><input name="capacity" type="number" inputmode="numeric" min="1" max="60" placeholder="4" required></label>
        <label class="field"><span>ტრანსმისია</span><select name="transmission" required><option value="">აირჩიეთ</option>${Object.entries(TRANS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
        <label class="field"><span>ქალაქი</span><input name="city" list="cities" placeholder="თბილისი" required autocomplete="off"></label>
        <label class="field"><span>ბენზინის ბაკის მოცულობა (ლ)</span><input name="fuelCapacity" type="number" inputmode="numeric" min="1" placeholder="90" required></label>
      </div>
      <label class="field"><span>განცხადების ავტორი</span><input value="${esc(fmtPhone(u.phone))}" readonly aria-readonly="true"><small>ნომერი ავტომატურად მიებმება თქვენი ანგარიშიდან</small></label>
      <fieldset style="border:0;padding:0;margin:0"><legend class="field" style="margin-bottom:8px"><span style="font-weight:500;font-size:14px">3 ფოტო (PNG, JPG, JPEG — თითო მაქს. 5 მბ)</span></legend>
        <div class="slots">${[0, 1, 2].map((i) => `<label class="slot" data-slot="${i}"><input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" aria-label="ფოტო ${i + 1}"><span>${ICON.img}ფოტო ${i + 1}</span></label>`).join('')}</div>
      </fieldset>
      <div class="geo" id="geo">მიმდინარეობს ლოკაციის დადგენა… (არასავალდებულოა)</div>
      <div class="form-error" id="add-err" role="alert" hidden></div>
      <button class="btn block" type="submit">განცხადების დამატება</button>
    </form>
    <datalist id="brands">${BRANDS.map((b) => `<option value="${b}">`).join('')}</datalist>
    <datalist id="cities">${CITIES.map((c) => `<option value="${c}">`).join('')}</datalist>
  </div></div>`;

  // GPS — ავტომატურად, მომხმარებელს ხელით შეყვანა არ სჭირდება
  const geoEl = $('#geo');
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (p) => { geo = { latitude: +p.coords.latitude.toFixed(6), longitude: +p.coords.longitude.toFixed(6) }; geoEl.textContent = 'ლოკაცია დადგინდა და განცხადებას ავტომატურად დაემატება.'; geoEl.classList.add('ok'); },
      () => { geoEl.textContent = 'ლოკაცია ვერ დადგინდა — განცხადება რუკის გარეშე დაემატება.'; }, { timeout: 8000, maximumAge: 60000 });
  } else geoEl.textContent = 'ამ მოწყობილობას GPS არ აქვს — განცხადება რუკის გარეშე დაემატება.';

  const errBox = $('#add-err');
  $$('.slot').forEach((slot) => {
    const input = $('input', slot), i = +slot.dataset.slot;
    input.addEventListener('change', () => {
      const f = input.files[0]; errBox.hidden = true;
      if (!f) { files[i] = null; slot.classList.remove('has'); $('img', slot)?.remove(); return; }
      if (!/\.(png|jpe?g)$/i.test(f.name) || !/^image\/(png|jpeg)$/.test(f.type)) { input.value = ''; errBox.textContent = 'დაშვებულია მხოლოდ PNG, JPG ან JPEG ფორმატი'; errBox.hidden = false; return; }
      if (f.size > 5 * 1024 * 1024) { input.value = ''; errBox.textContent = 'ფოტო 5 მბ-ზე დიდია'; errBox.hidden = false; return; }
      files[i] = f; slot.classList.add('has'); $('img', slot)?.remove();
      const img = document.createElement('img'); img.alt = `ფოტო ${i + 1}`; img.src = URL.createObjectURL(f); slot.appendChild(img);
    });
  });

  const form = $('#add');
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); errBox.hidden = true;
    const d = Object.fromEntries(new FormData(form)); Object.keys(d).forEach((k) => { if (typeof d[k] === 'string') d[k] = d[k].trim(); });
    const yearMax = new Date().getFullYear() + 1;
    const fail = (m) => { errBox.textContent = m; errBox.hidden = false; errBox.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    if (!d.brand) return fail('შეიყვანეთ ბრენდი');
    if (!d.model) return fail('შეიყვანეთ მოდელი');
    if (!(+d.year >= 1950 && +d.year <= yearMax)) return fail(`გამოშვების წელი უნდა იყოს 1950-დან ${yearMax}-მდე`);
    if (!(+d.pricePerDay > 0)) return fail('მიუთითეთ დღიური ფასი');
    if (!(+d.capacity > 0)) return fail('მიუთითეთ ტევადობა');
    if (!d.transmission) return fail('აირჩიეთ ტრანსმისია');
    if (!d.city) return fail('მიუთითეთ ქალაქი');
    if (!(+d.fuelCapacity > 0)) return fail('მიუთითეთ ბენზინის ბაკის მოცულობა');
    if (files.some((f) => !f)) return fail('ატვირთეთ ზუსტად 3 ფოტო');

    const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'ემატება…';
    try {
      await Data.addCar({ ...d, files, latitude: geo?.latitude ?? null, longitude: geo?.longitude ?? null }, S.user);
      toast('განცხადება დაემატა', 'ok'); go('#/profile?tab=mine');
    } catch (err) { fail(err.message); btn.disabled = false; btn.textContent = 'განცხადების დამატება'; }
  });
}

/* ---------- პროფილი ---------- */
async function pageProfile(_, q, id) {
  const u = S.user, tab = ['rented', 'liked', 'mine'].includes(q.tab) ? q.tab : 'rented';
  main.innerHTML = `<div class="page"><div class="wrap">
    <div class="profile-head"><div class="avatar" aria-hidden="true">${esc(initials(u))}</div><div><h1>${esc(u.name)} ${esc(u.surname)}</h1><p>${esc(fmtPhone(u.phone))}${u.email ? ' · ' + esc(u.email) : ''}</p></div></div>
    <div class="tabs" role="navigation" aria-label="პროფილის სექციები" id="tabs"></div>
    <div id="tab-body">${skeletons(3)}</div></div></div>`;

  let rentals = [], liked = [], mine = [];
  try { [rentals, liked, mine] = await Promise.all([Data.getRentals(u), Data.likedCars(u), Data.myCars(u)]); }
  catch (err) { if (id !== navId) return; $('#tab-body').innerHTML = errorBox(err.message); $('[data-retry]')?.addEventListener('click', route); return; }
  if (id !== navId) return;

  const tabs = [['rented', 'ნაქირავები მანქანები', rentals.length], ['liked', 'მოწონებული', liked.length], ['mine', 'ჩემი განცხადებები', mine.length]];
  $('#tabs').innerHTML = tabs.map(([k, t, n]) => `<a href="#/profile?tab=${k}" ${k === tab ? 'aria-current="page"' : ''}>${t}<em>${n}</em></a>`).join('');

  const body = $('#tab-body');
  if (tab === 'rented') {
    body.innerHTML = rentals.length ? `<div class="rentals">${rentals.map((r) => `
      <article class="rental"><img src="${esc(r.image || PLACEHOLDER_IMG)}" alt="">
        <div><h3><a href="#/car/${esc(r.carId)}">${esc(`${r.brand} ${r.model}`.trim() || 'მანქანა')}</a></h3>
          <p class="facts"><span>ქალაქი: <b>${esc(r.city || '—')}</b></span><span>ვადა: <b>${esc(r.days)} დღე</b></span>${r.date ? `<span>დაქირავდა: <b>${esc(fmtDate(r.date))}</b></span>` : ''}</p></div>
        <div class="paid"><small>გადახდილი თანხა</small><strong>${money(r.amount)} ₾</strong></div></article>`).join('')}</div>`
      : '<div class="empty"><h3>ჯერ არცერთი მანქანა გიქირავებიათ</h3><p>იპოვეთ შესაფერისი მანქანა და დაქირავება რამდენიმე წამში შეგიძლიათ.</p><a class="btn" href="#/filter">მანქანების ძებნა</a></div>';
  } else if (tab === 'liked') {
    body.innerHTML = liked.length ? grid(liked) : '<div class="empty"><h3>მოწონებული მანქანები არ გაქვთ</h3><p>მანქანის ბარათზე გულის ღილაკით შეგიძლიათ შეინახოთ ის აქ.</p><a class="btn" href="#/">მთავარზე დაბრუნება</a></div>';
    const h = () => { if (!$('#tab-body')) return document.removeEventListener('likechange', h); setTimeout(() => { if (location.hash.startsWith('#/profile')) route(); }, 250); };
    document.addEventListener('likechange', h, { once: true });
  } else {
    body.innerHTML = mine.length ? grid(mine) : '<div class="empty"><h3>განცხადება ჯერ არ გაქვთ</h3><p>განათავსეთ მანქანა და მიიღეთ შემოსავალი გაქირავებიდან.</p><a class="btn" href="#/add">მანქანის დამატება</a></div>';
  }
}

/* ---------- ნოტიფიკაციები ---------- */
async function pageNotifications(_, __, id) {
  main.innerHTML = `<div class="page"><div class="wrap"><h1 class="page-title">ნოტიფიკაციები</h1><p class="page-sub">აქ გამოჩნდება შეტყობინება, როცა თქვენს მანქანას დაიქირავებენ.</p><div id="notes">${skeletons(2)}</div></div></div>`;
  const list = await Data.getNotifications(S.user);
  if (id !== navId) return;
  $('#notes').outerHTML = list.length ? `<div class="notes">${list.map((n) => `<article class="note ${n.read ? '' : 'new'}"><p>${esc(n.text)}</p>
      <span>${n.renter ? `დამქირავებელი: ${esc(n.renter)}` : ''}${n.renterPhone ? ` · ${esc(fmtPhone(n.renterPhone))}` : ''}${n.date ? ` · ${esc(fmtDateTime(n.date))}` : ''}</span></article>`).join('')}</div>`
    : '<div class="empty"><h3>ახალი შეტყობინებები არ არის</h3><p>როცა ვინმე თქვენს მანქანას იქირავებს, აქ დაინახავთ.</p></div>';
  if (S.notif) { await Data.markNotificationsRead(S.user); S.notif = 0; renderNav(); }
}

function pageNotFound() {
  main.innerHTML = '<div class="page"><div class="wrap"><div class="empty"><h3>გვერდი ვერ მოიძებნა</h3><p>შეამოწმეთ მისამართი ან დაბრუნდით მთავარ გვერდზე.</p><a class="btn" href="#/">მთავარი გვერდი</a></div></div></div>';
}

/* ======================================================================
   როუტერი
   ====================================================================== */
const ROUTES = [
  [/^\/$/, pageHome], [/^\/register$/, pageRegister], [/^\/login$/, pageLogin], [/^\/filter$/, pageFilter],
  [/^\/car\/([^/]+)$/, pageCar], [/^\/add$/, pageAdd, true], [/^\/profile$/, pageProfile, true], [/^\/notifications$/, pageNotifications, true]
];

async function route() {
  const id = ++navId;
  const h = location.hash.slice(1) || '/';
  const [path, qs] = h.split('?'); const q = Object.fromEntries(new URLSearchParams(qs || ''));
  $('#modal-root').innerHTML = '';
  for (const [re, fn, protectedPage] of ROUTES) {
    const m = path.match(re); if (!m) continue;
    if (protectedPage && !S.user) { toast('ამ გვერდის სანახავად გაიარეთ ავტორიზაცია'); return go('#/login?next=' + encodeURIComponent(h)); }
    if ((path === '/login' || path === '/register') && S.user) return go('#/');
    $('.nav a.me')?.setAttribute('aria-current', path === '/profile');
    await fn(m.slice(1), q, id);
    if (id === navId) { window.scrollTo(0, 0); }
    return;
  }
  pageNotFound();
}

async function boot() {
  main.innerHTML = '<div class="page"><div class="wrap">' + skeletons(4) + '</div></div>';
  renderNav();
  await Data.init();
  S.user = Session.get()?.user || null;
  await refreshNotif();
  renderNav(); renderFooter();
  window.addEventListener('hashchange', route);
  route();
}
document.addEventListener('DOMContentLoaded', boot);
