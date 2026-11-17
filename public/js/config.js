// ─────────────────────────────────────────────────────────────
//  Arisa's Kitchen — site settings
//  1) Paste your Firebase web config below (Firebase console →
//     Project settings → Your apps → Web app → SDK setup).
//  2) Update the business details. Everything else reads from here.
//  While apiKey still says "YOUR_API_KEY" the site runs in DEMO mode:
//  orders/bookings are kept in this browser only (great for testing).
// ─────────────────────────────────────────────────────────────

export const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000"
};

export const FIREBASE_SDK_VERSION = "13.4.0";

export const BUSINESS = {
  name: "Arisa's Kitchen",
  tagline: "Good Food • Great Mood",
  address: "123 Foodie Lane, Nairobi, Kenya",
  phone: "+254 712 345 678",
  whatsapp: "254712345678",          // digits only, with country code
  email: "info@arisaskitchen.com",
  mpesaTill: "123456",               // shown at checkout for M-Pesa payments
  currency: "KES",
  lat: -1.2864,                      // map pin — set to your exact location
  lng: 36.8172,
  deliveryRadiusKm: 8,
  deliveryFee: 150,
  freeDeliveryOver: 2500,
  hours: [
    ["Mon – Thu", "8:00 am – 10:00 pm"],
    ["Fri – Sat", "8:00 am – 11:30 pm"],
    ["Sunday",   "10:00 am – 9:00 pm"]
  ],
  // Opening times used for the live "Open now" badge. Index 0 = Sunday. [open, close] in 24h hours (23.5 = 11:30 pm)
  openTimes: [[10, 21], [8, 22], [8, 22], [8, 22], [8, 22], [8, 23.5], [8, 23.5]],
  socials: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    youtube: "https://youtube.com/"
  },
  demoAdminPin: "1234"               // only used in DEMO mode
};
