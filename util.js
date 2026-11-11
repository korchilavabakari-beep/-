'use strict';
/* საერთო დამხმარე ფუნქციები: DOM, ფორმატირება, localStorage, SVG ილუსტრაციები */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US').replace(/,/g, ' ')}`;

const TRANS = { automatic: 'ავტომატიკა', manual: 'მექანიკა', tiptronic: 'ტიპტრონიკი' };
const CITIES = ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'გორი', 'ზუგდიდი', 'ფოთი', 'თელავი', 'ბორჯომი', 'სიღნაღი', 'ახალციხე', 'მესტია', 'ბაკურიანი', 'გუდაური'];
const BRANDS = ['Mercedes', 'BMW', 'Toyota', 'Lexus', 'Hyundai', 'Kia', 'Volkswagen', 'Opel', 'Ford', 'Honda', 'Subaru', 'Skoda', 'Audi', 'Nissan', 'Mitsubishi', 'Chevrolet', 'Land Rover', 'Porsche'];

/* ბრენდის/მოდელის ძებნა: ქართული და ლათინური დასახელებით */
const BRAND_ALIASES = {
  'მერსედესი': 'mercedes', 'მერსედეს': 'mercedes', 'ბმვ': 'bmw', 'ტოიოტა': 'toyota', 'ლექსუსი': 'lexus', 'ჰიუნდაი': 'hyundai', 'ჰუნდაი': 'hyundai',
  'კია': 'kia', 'ფოლკსვაგენი': 'volkswagen', 'ოპელი': 'opel', 'ფორდი': 'ford', 'ჰონდა': 'honda', 'სუბარუ': 'subaru', 'შკოდა': 'skoda',
  'აუდი': 'audi', 'ნისანი': 'nissan', 'მიცუბიში': 'mitsubishi', 'შევროლეტი': 'chevrolet', 'პორშე': 'porsche', 'ლენდროვერი': 'land rover'
};
function carMatches(c, q) {
  const tokens = String(q || '').toLowerCase().split(/\s+/).filter(Boolean).map((t) => BRAND_ALIASES[t] || t);
  if (!tokens.length) return true;
  const hay = `${c.brand} ${c.model} ${c.year ?? ''}`.toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

function normTrans(v) {
  const s = String(v ?? '').toLowerCase();
  if (/auto|ავტომ/.test(s)) return 'automatic';
  if (/tip|ტიპ/.test(s)) return 'tiptronic';
  if (/man|მექ/.test(s)) return 'manual';
  return 'automatic';
}

function cleanPhone(s) {
  let d = String(s ?? '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('995')) d = d.slice(3);
  return d;
}
const validPhone = (s) => /^\d{9}$/.test(cleanPhone(s));
const fmtPhone = (s) => { const d = cleanPhone(s); return d.length === 9 ? `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}` : s; };
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('ka-GE', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
const fmtDateTime = (iso) => { try { return new Date(iso).toLocaleString('ka-GE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

/* ---------- localStorage (უსაფრთხო) ---------- */
const Store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
};

const Session = {
  get() { return Store.get('rc_session'); },
  set(s) { Store.set('rc_session', s); },
  clear() { Store.del('rc_session'); }
};

const Likes = {
  key: (uid) => `rc_likes_${uid}`,
  ids(uid) { return Store.get(this.key(uid), []).map(String); },
  has(uid, id) { return this.ids(uid).includes(String(id)); },
  toggle(uid, id) {
    const ids = this.ids(uid); const i = ids.indexOf(String(id));
    if (i >= 0) ids.splice(i, 1); else ids.push(String(id));
    Store.set(this.key(uid), ids);
    return i < 0;
  }
};

const LocalRentals = {
  key: (uid) => `rc_rentals_${uid}`,
  list(uid) { return Store.get(this.key(uid), []); },
  add(uid, r) { const l = this.list(uid); l.unshift(r); Store.set(this.key(uid), l); }
};

/* ---------- სურათის შეკუმშვა (დემო რეჟიმისთვის) ---------- */
function fileToDataUrl(file, max = 900, q = 0.72) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = () => rej(new Error('სურათის წაკითხვა ვერ მოხერხდა'));
      img.src = fr.result;
    };
    fr.onerror = () => rej(new Error('ფაილის წაკითხვა ვერ მოხერხდა'));
    fr.readAsDataURL(file);
  });
}

/* ---------- ავტომობილის SVG ილუსტრაცია (დემო ფოტოებისთვის) ---------- */
const CAR_BODIES = {
  sedan: {
    d: 'M90 272 L90 236 Q90 220 110 216 L190 205 L245 155 Q255 147 270 147 L385 147 Q400 147 412 157 L455 205 L525 214 Q550 218 552 240 L552 272 Z',
    w: ['M205 205 L252 160 L320 160 L320 205 Z', 'M332 160 L385 160 L428 205 L332 205 Z'], fx: 552, rx: 90
  },
  suv: {
    d: 'M85 276 L85 226 Q85 210 105 206 L175 200 L215 140 Q225 130 240 130 L440 130 Q460 130 470 145 L500 200 L540 208 Q556 212 556 236 L556 276 Z',
    w: ['M190 200 L226 148 L316 148 L316 200 Z', 'M328 148 L440 148 L478 200 L328 200 Z'], fx: 556, rx: 85
  },
  hatch: {
    d: 'M100 272 L100 232 Q100 218 120 214 L200 202 L250 150 Q260 142 275 142 L440 142 Q465 142 475 165 L500 210 L530 218 Q548 222 548 242 L548 272 Z',
    w: ['M212 202 L256 158 L322 158 L322 202 Z', 'M334 158 L440 158 L460 175 L482 202 L334 202 Z'], fx: 548, rx: 100
  },
  van: {
    d: 'M85 276 L85 222 Q85 205 105 200 L160 190 L200 135 Q208 128 222 128 L470 128 Q490 128 498 145 L520 205 L545 212 Q558 216 558 240 L558 276 Z',
    w: ['M180 190 L212 143 L300 143 L300 190 Z', 'M312 143 L470 143 L490 190 L312 190 Z'], fx: 558, rx: 85
  }
};
const SCENES = [['#DCE9F7', '#F4F8FC', '#9DB6D3', '#3A4452'], ['#F6D9C6', '#F9EEE6', '#C9A9B8', '#463F4F'], ['#CFE5DC', '#EEF6F2', '#8FB2A3', '#394845']];
const CROPS = ['0 0 640 400', '300 110 320 200', '50 130 320 200'];

function carSvg({ color = '#1A3FA6', body = 'sedan', scene = 0, crop = 0, bare = false } = {}) {
  const b = CAR_BODIES[body] || CAR_BODIES.sedan;
  const sc = SCENES[scene % 3];
  const wheel = (cx) => `<circle cx="${cx}" cy="272" r="43" fill="#161a21"/><circle cx="${cx}" cy="272" r="25" fill="#cfd5de"/><circle cx="${cx}" cy="272" r="9" fill="#7c8594"/>`;
  const bg = bare ? '' : `
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sc[0]}"/><stop offset="1" stop-color="${sc[1]}"/></linearGradient></defs>
    <rect x="-200" y="-200" width="1040" height="800" fill="url(#g)"/>
    <path d="M-200 300 L90 240 L250 285 L420 225 L640 295 L840 250 V600 H-200Z" fill="${sc[2]}" opacity=".45"/>
    <rect x="-200" y="314" width="1040" height="300" fill="${sc[3]}"/>
    <rect x="-200" y="312" width="1040" height="5" fill="#fff" opacity=".35"/>
    <rect x="-100" y="360" width="90" height="8" rx="4" fill="#FFC83D" opacity=".85"/><rect x="120" y="360" width="90" height="8" rx="4" fill="#FFC83D" opacity=".85"/><rect x="340" y="360" width="90" height="8" rx="4" fill="#FFC83D" opacity=".85"/><rect x="560" y="360" width="90" height="8" rx="4" fill="#FFC83D" opacity=".85"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bare ? '40 100 560 230' : CROPS[crop % 3]}" preserveAspectRatio="xMidYMid slice">${bg}
    <ellipse cx="320" cy="318" rx="255" ry="12" fill="#000" opacity=".28"/>
    <path d="${b.d}" fill="${color}"/>
    <path d="${b.d}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="2"/>
    <path d="M${b.rx + 6} 262 H${b.fx - 6}" stroke="#000" stroke-opacity=".2" stroke-width="3"/>
    ${b.w.map((p) => `<path d="${p}" fill="#bcd6ea" stroke="#000" stroke-opacity=".25" stroke-width="2"/>`).join('')}
    <rect x="${b.fx - 26}" y="226" width="24" height="11" rx="4" fill="#FFE9A8"/>
    <rect x="${b.rx + 2}" y="228" width="12" height="12" rx="3" fill="#D33A3A"/>
    ${wheel(170)}${wheel(470)}
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const PLACEHOLDER_IMG = carSvg({ color: '#9aa6b8', body: 'sedan', scene: 0 });
