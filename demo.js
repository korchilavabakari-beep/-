'use strict';
/* დემო "სერვერი": ყველა მონაცემი ინახება ბრაუზერის localStorage-ში.
   ინტერფეისი იგივეა, რაც Api-ს აქვს (იხ. api.js). */

const Demo = (() => {
  const KEY = 'rc_demo_db_v1';
  const COORDS = {
    'თბილისი': [41.7151, 44.8271], 'ბათუმი': [41.6168, 41.6367], 'ქუთაისი': [42.2679, 42.718], 'რუსთავი': [41.5495, 45.009],
    'გორი': [41.9842, 44.1158], 'ზუგდიდი': [42.5088, 41.8709], 'თელავი': [41.9198, 45.4731], 'ბორჯომი': [41.8406, 43.3828],
    'სიღნაღი': [41.6192, 45.9219], 'ბაკურიანი': [41.7506, 43.5285]
  };
  // [ბრენდი, მოდელი, წელი, ფასი/დღე, ტევადობა, ტრანსმისია, ბაკი, ქალაქი, ფერი, ძარა, მფლობელი, ქირაობები]
  const SEED = [
    ['Mercedes', 'E320', 2015, 90, 4, 'automatic', 80, 'თბილისი', '#1d2a44', 'sedan', 1, 14],
    ['Toyota', 'Prius', 2012, 55, 5, 'automatic', 45, 'თბილისი', '#d8dde4', 'hatch', 2, 22],
    ['Toyota', 'Land Cruiser Prado', 2018, 190, 7, 'automatic', 87, 'ბათუმი', '#2f3b34', 'suv', 3, 19],
    ['BMW', 'X5', 2017, 170, 5, 'tiptronic', 85, 'თბილისი', '#3a4f7a', 'suv', 1, 11],
    ['Hyundai', 'Elantra', 2016, 60, 5, 'automatic', 50, 'ქუთაისი', '#a3342d', 'sedan', 2, 9],
    ['Volkswagen', 'Golf', 2008, 40, 5, 'manual', 55, 'რუსთავი', '#6b7a8f', 'hatch', 3, 6],
    ['Opel', 'Zafira', 2006, 45, 7, 'manual', 58, 'თელავი', '#8a8d92', 'van', 2, 5],
    ['Mercedes', 'Sprinter', 2014, 220, 12, 'manual', 75, 'თბილისი', '#e9ecef', 'van', 1, 8],
    ['Honda', 'Fit', 2010, 35, 4, 'automatic', 40, 'ბათუმი', '#e0a526', 'hatch', 3, 7],
    ['Kia', 'Sportage', 2019, 120, 5, 'automatic', 62, 'გორი', '#5a6b78', 'suv', 2, 13],
    ['Subaru', 'Forester', 2013, 85, 5, 'tiptronic', 60, 'ბორჯომი', '#46604f', 'suv', 1, 10],
    ['Lexus', 'RX350', 2016, 160, 5, 'tiptronic', 72, 'ბათუმი', '#171a21', 'suv', 3, 17],
    ['Skoda', 'Octavia', 2011, 50, 5, 'manual', 50, 'ზუგდიდი', '#b9bfc8', 'sedan', 2, 4],
    ['Mercedes', 'W124 E220', 1995, 45, 5, 'manual', 70, 'თბილისი', '#7a2f2f', 'sedan', 1, 3],
    ['Toyota', 'Hiace', 2003, 80, 9, 'manual', 70, 'ქუთაისი', '#cfd3d9', 'van', 3, 6],
    ['Opel', 'Vectra', 2002, 30, 5, 'manual', 60, 'სიღნაღი', '#3f5a73', 'sedan', 2, 2],
    ['Honda', 'Odyssey', 2004, 70, 6, 'automatic', 65, 'ბათუმი', '#4d4a63', 'van', 1, 5],
    ['Subaru', 'Outback', 2009, 65, 5, 'tiptronic', 65, 'ბაკურიანი', '#7b8a6e', 'hatch', 3, 8]
  ];

  const USERS = [
    { id: 1, name: 'ნიკა', surname: 'ბერიძე', phone: '555112233', email: 'nika@example.com', password: 'demo123' },
    { id: 2, name: 'მარიამ', surname: 'გელაშვილი', phone: '599445566', email: 'mariam@example.com', password: 'demo123' },
    { id: 3, name: 'დავით', surname: 'კაპანაძე', phone: '577778899', email: 'davit@example.com', password: 'demo123' }
  ];

  function seed() {
    const cars = SEED.map((c, i) => {
      const [lat, lng] = COORDS[c[7]] || COORDS['თბილისი'];
      const owner = USERS.find((u) => u.id === c[10]);
      return {
        id: i + 1, brand: c[0], model: c[1], year: c[2], pricePerDay: c[3], capacity: c[4], transmission: c[5],
        fuelCapacity: c[6], city: c[7], ownerId: owner.id, ownerPhone: owner.phone,
        latitude: +(lat + ((i * 37) % 10 - 5) * 0.0021).toFixed(5), longitude: +(lng + ((i * 53) % 10 - 5) * 0.0027).toFixed(5),
        images: [0, 1, 2].map((k) => carSvg({ color: c[8], body: c[9], scene: i + k, crop: k })),
        rentCount: c[11], createdAt: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString()
      };
    });
    return { users: USERS.map((u) => ({ ...u })), cars, rentals: [], notifications: [], nextUserId: 4, nextCarId: cars.length + 1, nextId: 1 };
  }

  function load() {
    let db = Store.get(KEY);
    if (!db) { db = seed(); save(db); }
    return db;
  }
  function save(db) {
    if (!Store.set(KEY, db)) throw new Error('ბრაუზერის მეხსიერება გაივსო. სცადეთ უფრო პატარა ფოტოები.');
  }
  const pub = (u) => ({ id: u.id, name: u.name, surname: u.surname, phone: u.phone, email: u.email });
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const userOf = (token) => {
    const m = /^demo-(\d+)$/.exec(token || ''); if (!m) return null;
    return load().users.find((u) => u.id === +m[1]) || null;
  };

  return {
    mode: 'demo',
    async init() { load(); },

    async register(d) {
      await delay(300);
      const db = load(); const phone = cleanPhone(d.phone);
      if (db.users.some((u) => u.phone === phone)) throw new Error('ამ ტელეფონის ნომრით მომხმარებელი უკვე არსებობს');
      const u = { id: db.nextUserId++, name: d.name, surname: d.surname, phone, email: d.email, password: d.password };
      db.users.push(u); save(db);
      return pub(u);
    },

    async login(d) {
      await delay(300);
      const phone = cleanPhone(d.phone);
      const u = load().users.find((x) => x.phone === phone && x.password === d.password);
      if (!u) throw new Error('ტელეფონის ნომერი ან პაროლი არასწორია');
      return { token: 'demo-' + u.id, user: pub(u) };
    },

    async getCars() { await delay(200); return copy(load().cars); },
    async getCar(id) { await delay(120); const c = load().cars.find((x) => String(x.id) === String(id)); return c ? copy(c) : null; },

    async addCar(d, user) {
      const db = load();
      const images = [];
      for (const f of d.files) images.push(await fileToDataUrl(f));
      const car = {
        id: db.nextCarId++, brand: d.brand, model: d.model, year: +d.year, pricePerDay: +d.pricePerDay, capacity: +d.capacity,
        transmission: d.transmission, fuelCapacity: +d.fuelCapacity, city: d.city, ownerId: user.id, ownerPhone: user.phone,
        latitude: d.latitude ?? null, longitude: d.longitude ?? null, images, rentCount: 0, createdAt: new Date().toISOString()
      };
      db.cars.unshift(car); save(db);
      return copy(car);
    },

    async rentCar({ carId, days }, user) {
      await delay(300);
      const db = load();
      const car = db.cars.find((c) => String(c.id) === String(carId));
      if (!car) throw new Error('მანქანა ვერ მოიძებნა');
      if (car.ownerId === user.id) throw new Error('საკუთარი მანქანის ქირაობა შეუძლებელია');
      const rental = {
        id: db.nextId++, userId: user.id, carId: car.id, brand: car.brand, model: car.model, image: car.images[0],
        city: car.city, days, amount: days * car.pricePerDay, date: new Date().toISOString()
      };
      db.rentals.unshift(rental);
      car.rentCount = (car.rentCount || 0) + 1;
      db.notifications.unshift({
        id: db.nextId++, userId: car.ownerId, carId: car.id, text: `თქვენი ${car.brand} ${car.model} ${days} დღით დაიქირავეს`,
        renter: `${user.name} ${user.surname}`, renterPhone: user.phone, amount: rental.amount, date: rental.date, read: false
      });
      save(db);
      return copy(rental);
    },

    async getRentals(user) { await delay(120); return copy(load().rentals.filter((r) => r.userId === user.id)); },
    async getNotifications(user) { return copy(load().notifications.filter((n) => n.userId === user.id)); },
    async markNotificationsRead(user) {
      const db = load(); db.notifications.forEach((n) => { if (n.userId === user.id) n.read = true; }); save(db);
    },
    hint: 'დემო ანგარიში: ტელეფონი 555 11 22 33, პაროლი demo123'
  };
})();
