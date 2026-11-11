'use strict';
/* რეალური API-ს კლიენტი (IT Academy Step-ის სერვერი).
   ენდპოინტები და მოთხოვნის ფორმატი იცვლება config.js-ში. */

class ApiError extends Error {
  constructor(msg, status = 0, data = null) { super(msg); this.status = status; this.data = data; }
}

const Api = (() => {
  const E = () => CONFIG.ENDPOINTS;
  const token = () => Session.get()?.token || null;

  function messageOf(data) {
    if (!data) return null;
    if (typeof data === 'string') return data.length < 200 ? data : null;
    if (data.errors && typeof data.errors === 'object') {
      const first = Object.values(data.errors).flat()[0]; if (first) return String(first);
    }
    return data.message || data.title || data.error || data.detail || null;
  }

  async function req(method, path, { body, form, auth = true, timeout = 12000 } = {}) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
    const headers = {};
    if (auth && token() && !String(token()).startsWith('demo-')) headers.Authorization = 'Bearer ' + token();
    let payload;
    if (form) payload = form; else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
    let res;
    try {
      res = await fetch(CONFIG.API_BASE + path, { method, headers, body: payload, signal: ctl.signal });
    } catch {
      throw new ApiError('სერვერთან კავშირი ვერ დამყარდა');
    } finally { clearTimeout(t); }
    const text = await res.text(); let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) throw new ApiError(messageOf(data) || `სერვერის შეცდომა (${res.status})`, res.status, data);
    return data;
  }

  const asArray = (r) => Array.isArray(r) ? r : (r?.data ?? r?.cars ?? r?.items ?? r?.result ?? []);

  /* ---------- პასუხის ნორმალიზაცია ერთიან ფორმატზე ---------- */
  function images(r) {
    let list = [];
    const src = r.images ?? r.photos ?? r.imageUrls ?? r.pictures;
    if (Array.isArray(src)) list = src.map((x) => typeof x === 'string' ? x : (x?.url ?? x?.imageUrl ?? x?.path ?? ''));
    else {
      for (let i = 1; i <= 3; i++) {
        const v = r[`image${i}`] ?? r[`imageUrl${i}`] ?? r[`photo${i}`] ?? r[`img${i}`];
        if (v) list.push(v);
      }
      if (!list.length && (r.imageUrl || r.image)) list.push(r.imageUrl || r.image);
    }
    return list.filter(Boolean).map((u) => /^(https?:|data:|\/\/)/.test(u) ? u : CONFIG.API_BASE + (u.startsWith('/') ? '' : '/') + u);
  }

  function normCar(r) {
    if (!r) return null;
    const num = (v) => (v === '' || v == null ? null : Number(v));
    return {
      id: r.id ?? r.carId,
      brand: r.brand ?? r.make ?? r.mark ?? '',
      model: r.model ?? '',
      year: num(r.year ?? r.releaseYear ?? r.productionYear),
      pricePerDay: num(r.pricePerDay ?? r.price ?? r.dailyPrice ?? r.rentPrice) || 0,
      capacity: num(r.capacity ?? r.seats ?? r.passengers ?? r.peopleCapacity),
      transmission: normTrans(r.transmission ?? r.gearbox),
      fuelCapacity: num(r.fuelCapacity ?? r.fuelTankCapacity ?? r.tankCapacity ?? r.fuelTank),
      city: r.city ?? r.location ?? '',
      ownerId: r.ownerId ?? r.userId ?? r.owner?.id ?? null,
      ownerPhone: r.ownerPhone ?? r.phone ?? r.phoneNumber ?? r.owner?.phoneNumber ?? r.owner?.phone ?? '',
      images: images(r),
      latitude: num(r.latitude ?? r.lat),
      longitude: num(r.longitude ?? r.lng ?? r.lon),
      rentCount: num(r.rentCount ?? r.rentals ?? r.bookingsCount ?? r.views ?? r.likes ?? r.popularity) || 0,
      createdAt: r.createdAt ?? r.createdDate ?? null
    };
  }

  const extra = {
    known: () => Store.get('rc_known_users', {}),
    remember(phone, u) { const k = this.known(); k[phone] = u; Store.set('rc_known_users', k); }
  };

  return {
    mode: 'api',
    async init() { /* ping მოხდება Data.init-ში */ },

    async ping() {
      const r = await req('GET', E().cars, { auth: false, timeout: 6000 });
      if (!Array.isArray(asArray(r))) throw new ApiError('API-მ მოულოდნელი პასუხი დააბრუნა');
      return true;
    },

    async register(d) {
      const data = { ...d, phone: cleanPhone(d.phone) };
      const r = await req('POST', E().register, { body: CONFIG.build.register(data), auth: false });
      extra.remember(data.phone, { name: d.name, surname: d.surname, email: d.email });
      return r;
    },

    async login(d) {
      const phone = cleanPhone(d.phone);
      const r = await req('POST', E().login, { body: CONFIG.build.login({ ...d, phone }), auth: false });
      const out = CONFIG.parse.login(r);
      if (!out.token) throw new ApiError('სერვერმა ავტორიზაციის ტოკენი არ დააბრუნა');
      const k = extra.known()[phone] || {};
      out.user.phone = out.user.phone || phone;
      out.user.name = out.user.name || k.name || 'მომხმარებელი';
      out.user.surname = out.user.surname || k.surname || '';
      out.user.email = out.user.email || k.email || '';
      if (out.user.id == null) { // ტოკენიდან ვცდილობთ id-ის ამოღებას
        try {
          const p = JSON.parse(atob(out.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          out.user.id = p.nameid ?? p.sub ?? p.id ?? p.userId ?? phone;
        } catch { out.user.id = phone; }
      }
      return out;
    },

    async getCars() { return asArray(await req('GET', E().cars, { auth: false })).map(normCar); },

    async getCar(id) {
      try { const r = await req('GET', E().car(id), { auth: false }); return normCar(r?.data ?? r); }
      catch (e) { if (e.status === 0) throw e; const all = await this.getCars(); return all.find((c) => String(c.id) === String(id)) || null; }
    },

    async addCar(d, user) {
      const r = await req('POST', E().addCar, { form: CONFIG.build.car({ ...d, ownerPhone: user.phone, ownerId: user.id }) });
      return r;
    },

    async rentCar({ carId, days, amount, city }, user) {
      await req('POST', E().rent, { body: CONFIG.build.rent({ carId, userId: user.id, days, amount, city }) });
      const car = await this.getCar(carId).catch(() => null);
      const rental = {
        id: Date.now(), userId: user.id, carId, brand: car?.brand || '', model: car?.model || '', image: car?.images?.[0] || '',
        city: city || car?.city || '', days, amount, date: new Date().toISOString()
      };
      LocalRentals.add(user.id, rental); // ლოკალური ასლი პროფილისთვის
      return rental;
    },

    async getRentals(user) {
      const ep = E().myRentals;
      if (ep) {
        try {
          const r = asArray(await req('GET', ep(user.id)));
          return r.map((x) => ({
            id: x.id, carId: x.carId ?? x.car?.id, brand: x.brand ?? x.car?.brand ?? '', model: x.model ?? x.car?.model ?? '',
            image: images(x.car ?? x)[0] || '', city: x.city ?? x.car?.city ?? '', days: x.days ?? x.numberOfDays ?? 0,
            amount: x.totalPrice ?? x.amount ?? x.price ?? 0, date: x.date ?? x.createdAt ?? x.startDate ?? null
          }));
        } catch { /* ლოკალურზე გადავდივართ */ }
      }
      return LocalRentals.list(user.id);
    },

    async getNotifications(user) {
      const ep = E().notifications;
      if (!ep) return [];
      try {
        return asArray(await req('GET', ep(user.id))).map((n) => ({
          id: n.id, text: n.text ?? n.message ?? '', renter: n.renter ?? '', renterPhone: n.renterPhone ?? '',
          date: n.date ?? n.createdAt ?? null, read: !!(n.read ?? n.isRead)
        }));
      } catch { return []; }
    },
    async markNotificationsRead() { /* სერვერზე ენდპოინტი არ არის დაკონფიგურირებული */ },
    hint: ''
  };
})();

/* ==========================================================================
   Data — ერთიანი ფასადი: ირჩევს Api-ს ან Demo-ს და ამატებს საერთო ლოგიკას
   ========================================================================== */
const Data = {
  impl: Demo,
  get mode() { return this.impl.mode; },
  get hint() { return this.impl.hint || ''; },

  async init() {
    const m = CONFIG.MODE;
    if (m === 'demo') this.impl = Demo;
    else {
      try { await Api.ping(); this.impl = Api; }
      catch (e) { if (m === 'api') { this.impl = Api; this.initError = e; } else this.impl = Demo; }
    }
    await this.impl.init();
    const s = Session.get();
    if (s && s.mode && s.mode !== this.impl.mode) Session.clear(); // სესია სხვა რეჟიმიდანაა
  },

  _cars: null, _carsAt: 0,
  async cars(force = false) {
    if (!force && this._cars && Date.now() - this._carsAt < 60000) return this._cars;
    this._cars = await this.impl.getCars(); this._carsAt = Date.now();
    return this._cars;
  },
  invalidate() { this._cars = null; },
  async car(id) {
    const cached = this._cars?.find((c) => String(c.id) === String(id));
    if (cached && cached.images?.length) return cached;
    return this.impl.getCar(id);
  },
  async myCars(user) {
    const all = await this.cars(true);
    return all.filter((c) => (c.ownerId != null && String(c.ownerId) === String(user.id)) || (c.ownerPhone && cleanPhone(c.ownerPhone) === cleanPhone(user.phone)));
  },
  async likedCars(user) {
    const ids = Likes.ids(user.id); const all = await this.cars();
    return all.filter((c) => ids.includes(String(c.id)));
  },

  register: (d) => Data.impl.register(d),
  async login(d) {
    const r = await this.impl.login(d);
    Session.set({ token: r.token, user: r.user, mode: this.impl.mode });
    return r.user;
  },
  logout() { Session.clear(); },
  async addCar(d, user) { const r = await this.impl.addCar(d, user); this.invalidate(); return r; },
  async rentCar(d, user) { const r = await this.impl.rentCar(d, user); this.invalidate(); return r; },
  getRentals: (u) => Data.impl.getRentals(u),
  getNotifications: (u) => Data.impl.getNotifications(u),
  markNotificationsRead: (u) => Data.impl.markNotificationsRead(u)
};
