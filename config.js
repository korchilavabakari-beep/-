'use strict';
/* ==========================================================================
   კონფიგურაცია — ყველაფერი, რაც API-სთან კავშირს ეხება, ამ ფაილშია.

   MODE:
     'auto' – ჯერ ცდილობს რეალურ API-ს; თუ ვერ დაუკავშირდა, ირთვება დემო რეჟიმი
              (მონაცემები ინახება ბრაუზერის localStorage-ში)
     'api'  – მხოლოდ რეალური API
     'demo' – მხოლოდ დემო მონაცემები

   ყურადღება: ENDPOINTS და build/parse ფუნქციები შედგენილია სავარაუდო სახელებით.
   გადაამოწმეთ Swagger-ში (https://rentcar.stepprojects.ge/swagger/index.html)
   და საჭიროების შემთხვევაში შეცვალეთ მხოლოდ ამ ფაილში.
   ========================================================================== */
const CONFIG = {
  API_BASE: 'https://rentcar.stepprojects.ge',
  MODE: 'auto',

  ENDPOINTS: {
    register: '/api/Users/register',      // POST
    login: '/api/Users/login',            // POST
    cars: '/api/Car',                     // GET (ყველა მანქანა)
    car: (id) => `/api/Car/${id}`,        // GET (ერთი მანქანა)
    addCar: '/api/Car',                   // POST (multipart/form-data)
    rent: '/api/Booking',                 // POST
    myRentals: null,                      // GET, მაგ: (userId) => `/api/Booking/user/${userId}`
    notifications: null                   // GET, მაგ: (userId) => `/api/Notification/${userId}`
  },

  // ტრანსმისიის მნიშვნელობები, რომლებსაც API ელოდება
  TRANSMISSION_API: { automatic: 'Automatic', manual: 'Manual', tiptronic: 'Tiptronic' },

  /* ---------- მოთხოვნის სხეულები ----------
     ერთი და იგივე მნიშვნელობა რამდენიმე სახელით იგზავნება (name/firstName და ა.შ.),
     რადგან ASP.NET უცნობ ველებს უგულებელყოფს. Swagger-ის დათვალიერების შემდეგ
     შეგიძლიათ დატოვოთ მხოლოდ საჭირო სახელები. */
  build: {
    register: (d) => ({
      name: d.name, firstName: d.name,
      surname: d.surname, lastName: d.surname,
      phone: d.phone, phoneNumber: d.phone,
      email: d.email,
      password: d.password
    }),
    login: (d) => ({
      phone: d.phone, phoneNumber: d.phone, username: d.phone,
      password: d.password
    }),
    car: (d) => {
      const f = new FormData();
      const add = (names, v) => names.forEach((n) => f.append(n, v));
      add(['brand', 'make'], d.brand);
      add(['model'], d.model);
      add(['year', 'releaseYear'], d.year);
      add(['pricePerDay', 'price', 'dailyPrice'], d.pricePerDay);
      add(['capacity', 'seats'], d.capacity);
      add(['transmission'], CONFIG.TRANSMISSION_API[d.transmission] || d.transmission);
      add(['fuelCapacity', 'fuelTankCapacity'], d.fuelCapacity);
      add(['city'], d.city);
      add(['ownerPhone', 'phoneNumber', 'phone'], d.ownerPhone);
      if (d.ownerId != null) add(['ownerId', 'userId'], d.ownerId);
      if (d.latitude != null) { add(['latitude', 'lat'], d.latitude); add(['longitude', 'lng', 'lon'], d.longitude); }
      d.files.forEach((file, i) => {
        f.append('images', file);
        f.append(`image${i + 1}`, file);
      });
      return f;
    },
    rent: (d) => ({
      carId: d.carId, userId: d.userId,
      days: d.days, numberOfDays: d.days,
      totalPrice: d.amount, amount: d.amount, price: d.amount,
      city: d.city
    })
  },

  /* ---------- პასუხების დამუშავება ---------- */
  parse: {
    login: (r) => {
      const token = r?.token ?? r?.accessToken ?? r?.jwt ?? r?.data?.token ?? null;
      const u = r?.user ?? r?.data?.user ?? r?.data ?? r ?? {};
      return {
        token,
        user: {
          id: u.id ?? u.userId ?? null,
          name: u.name ?? u.firstName ?? '',
          surname: u.surname ?? u.lastName ?? '',
          phone: u.phone ?? u.phoneNumber ?? '',
          email: u.email ?? ''
        }
      };
    }
  }
};
