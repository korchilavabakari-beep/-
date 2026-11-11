/* =========================================================
   დემო რეჟიმი — localStorage-ზე დაფუძნებული "სერვერი".
   გამოიყენება, როცა რეალური API მიუწვდომელია.
   ========================================================= */
(function () {
  const KEY = 'autorent_mock_db_v1';

  function svgCar(bg, label, shade) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${shade}"/></linearGradient></defs>
      <rect width="800" height="520" fill="url(#g)"/>
      <g fill="none" stroke="rgba(255,255,255,.9)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
        <path d="M150 330h500M120 270l40-110a40 40 0 0 1 38-27h404a40 40 0 0 1 38 27l40 110v70h-40a55 55 0 0 1-110 0H310a55 55 0 0 1-110 0h-40z"/>
      </g>
      <text x="400" y="460" font-family="Arial, sans-serif" font-size="34" fill="rgba(255,255,255,.9)" text-anchor="middle">${label}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function seed() {
    const mk = (id, brand, model, year, price, cap, trans, city, fuel, color, lat, lng, owner, rents) => ({
      id, brand, model, year, pricePerDay: price, capacity: cap, transmission: trans, city,
      fuelCapacity: fuel, phone: '591299899', ownerId: owner, rentCount: rents,
      latitude: lat, longitude: lng,
      images: [
        svgCar(color[0], brand + ' ' + model, color[1]),
        svgCar(color[1], brand + ' ' + model + ' · 2', color[0]),
        svgCar(color[0], brand + ' ' + model + ' · 3', '#111827')
      ]
    });
    return {
      users: [{ id: 'u1', firstName: 'დემო', lastName: 'მომხმარებელი', phone: '555000111', email: 'demo@example.com', password: 'demo1234' }],
      cars: [
        mk('c1', 'Mercedes', 'E320', 2015, 90, 4, 'ავტომატიკა', 'თბილისი', 80, ['#1e3a8a', '#3b82f6'], 41.7151, 44.8271, 'u1', 14),
        mk('c2', 'Toyota', 'Prius', 2012, 55, 5, 'ავტომატიკა', 'ბათუმი', 45, ['#047857', '#34d399'], 41.6168, 41.6367, 'u1', 22),
        mk('c3', 'BMW', 'X5', 2019, 160, 5, 'ტიპტრონიკი', 'თბილისი', 85, ['#111827', '#6b7280'], 41.7225, 44.7925, 'u1', 9),
        mk('c4', 'Ford', 'Transit', 2005, 75, 9, 'მექანიკა', 'ქუთაისი', 80, ['#b45309', '#f59e0b'], 42.2679, 42.6946, 'u1', 5),
        mk('c5', 'Opel', 'Astra', 1998, 30, 5, 'მექანიკა', 'ბათუმი', 52, ['#7c2d12', '#ea580c'], 41.6458, 41.6416, 'u1', 11),
        mk('c6', 'Hyundai', 'Tucson', 2021, 120, 5, 'ავტომატიკა', 'თბილისი', 62, ['#4c1d95', '#a78bfa'], 41.7, 44.85, 'u1', 17),
        mk('c7', 'Mercedes', 'Vito', 2010, 100, 7, 'ავტომატიკა', 'ბათუმი', 70, ['#0f766e', '#2dd4bf'], 41.62, 41.63, 'u1', 7),
        mk('c8', 'Volkswagen', 'Passat', 2003, 40, 5, 'მექანიკა', 'რუსთავი', 70, ['#9f1239', '#fb7185'], 41.55, 44.99, 'u1', 3)
      ],
      rentals: [],
      notifs: []
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    const db = seed();
    save(db);
    return db;
  }
  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { throw new Error('მეხსიერება გაივსო — სურათები ძალიან დიდია'); }
  }
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const fail = (msg) => { throw new Error(msg); };

  // სურათის დაპატარავება, რომ localStorage არ გაივსოს
  function fileToDataUrl(file, max = 900) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('ფაილის წაკითხვა ვერ მოხერხდა'));
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('სურათი დაზიანებულია'));
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  const publicUser = (u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, phone: u.phone, email: u.email });

  window.MockApi = {
    async register(d) {
      const db = load();
      if (db.users.some((u) => u.phone === d.phone)) fail('ამ ტელეფონის ნომრით მომხმარებელი უკვე არსებობს');
      const u = { id: uid('u'), ...d };
      db.users.push(u); save(db);
      return { user: publicUser(u), token: 'mock-' + u.id };
    },
    async login(d) {
      const u = load().users.find((x) => x.phone === d.phone && x.password === d.password);
      if (!u) fail('ტელეფონის ნომერი ან პაროლი არასწორია');
      return { user: publicUser(u), token: 'mock-' + u.id };
    },
    async getCars() { return load().cars; },
    async getCar(id) {
      const c = load().cars.find((x) => String(x.id) === String(id));
      if (!c) fail('მანქანა ვერ მოიძებნა');
      return c;
    },
    async addCar(values, files, user) {
      const db = load();
      const images = await Promise.all(files.map((f) => fileToDataUrl(f)));
      const car = { id: uid('c'), ...values, images, ownerId: user.id, rentCount: 0 };
      db.cars.unshift(car); save(db);
      return car;
    },
    async rent(carId, days, user) {
      const db = load();
      const car = db.cars.find((c) => String(c.id) === String(carId));
      if (!car) fail('მანქანა ვერ მოიძებნა');
      if (car.ownerId === user.id) fail('საკუთარი მანქანის დაქირავება შეუძლებელია');
      const paid = car.pricePerDay * days;
      db.rentals.push({ id: uid('r'), carId: car.id, userId: user.id, days, paid, city: car.city, date: Date.now() });
      car.rentCount = (car.rentCount || 0) + 1;
      db.notifs.push({
        id: uid('n'), userId: car.ownerId, read: false, date: Date.now(),
        text: `${user.firstName} ${user.lastName} (${user.phone}) დაქირავა თქვენი ${car.brand} ${car.model} ${days} დღით.`
      });
      save(db);
      return { paid, days };
    },
    async myRentals(user) {
      const db = load();
      return db.rentals.filter((r) => r.userId === user.id).map((r) => ({ ...r, car: db.cars.find((c) => c.id === r.carId) }));
    },
    async myCars(user) { return load().cars.filter((c) => c.ownerId === user.id); },
    async notifications(user) { return load().notifs.filter((n) => n.userId === user.id).sort((a, b) => b.date - a.date); },
    async markNotificationsRead(user) {
      const db = load();
      db.notifs.forEach((n) => { if (n.userId === user.id) n.read = true; });
      save(db);
    }
  };
})();
