# Arisa's Kitchen website (Firebase, free Spark plan)

This is a responsive, installable website (a PWA) for Arisa's Kitchen. It covers:

- **Ordering**: menu with search and categories, item options, a cart, checkout (delivery or pickup, M-Pesa or cash) and live order tracking
- **Booking**: tables, birthdays, corporate events, catering and private chef, in a 4-step flow with packages and estimates
- **Events**: upcoming events with "Reserve my spot"
- **The vibe**: a gallery
- **Merch and packaging**: merch can be added to any order
- **Signature dishes**
- **Map**: OpenStreetMap through Leaflet, with a delivery-radius circle and directions
- **Admin dashboard** (`/admin`): live orders and bookings, a new-order sound, status updates, ETAs and sold-out toggles

Everything here runs on Firebase's **free Spark plan**: Hosting, Firestore and Authentication. Cloud Functions and billing aren't needed.

---

## Try it first (no setup)

Open `public/index.html` through any local server, for example `npx serve public`. Out of the box the site runs in **DEMO mode**. In this mode, orders and bookings are saved in your browser only. Place an order, then open `/admin.html` (PIN **1234**) in another tab. The order shows up there live.

## Go live in 10 minutes

1. **Create a project** at https://console.firebase.google.com. Click "Add project" and use the free plan.
2. **Add a web app**: go to Project settings → Your apps → `</>`. Copy the `firebaseConfig` object into `public/js/config.js` (it replaces `FIREBASE_CONFIG`). In the same file, update the phone number, WhatsApp number, M-Pesa till, address and map coordinates (`lat`/`lng`).
3. **Turn on Firestore**: go to Build → Firestore Database → Create database and choose production mode. The region `europe-west1` is closest to Kenya.
4. **Turn on Auth**: go to Build → Authentication → Get started → Email/Password → Enable. Then go to the **Users** tab, click **Add user** and create the staff login (email and password). Copy that user's **UID**.
5. **Make that user an admin**: go to Firestore → Start collection → name it `admins`. Set the Document ID to the **UID** you copied, and add any field, for example `name: "Arisa"`.
6. **Deploy** from this folder:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add            # pick your project
   firebase deploy               # uploads the site + firestore.rules
   ```
   Your site goes live at `https://YOUR_PROJECT.web.app`, and the admin dashboard at `https://YOUR_PROJECT.web.app/admin`.

To add a custom domain such as arisaskitchen.co.ke, go to Hosting → Add custom domain. SSL is free.

## Editing content

| What | Where |
|---|---|
| Menu items, prices, signature dishes | `public/js/menu.js` → `MENU` |
| Merch | `public/js/menu.js` → `MERCH` |
| Events | `public/js/menu.js` → `EVENTS` |
| Booking types, packages, time slots | `public/js/menu.js` |
| Phone, WhatsApp, hours, delivery fee, map pin | `public/js/config.js` |
| Images | `public/assets/` |

After changing anything, run `firebase deploy --only hosting`. Also bump `VERSION` in `public/sw.js` so phones that installed the app pick up the update.

## Install as an app

- **Android / Chrome / Edge / desktop**: an "Install app" button appears in the header, plus a banner after a few seconds.
- **iPhone**: tap Install and the site shows the steps (Share → Add to Home Screen).
- Staff can install the admin page too. Open `/admin` and install it, or use the "Orders admin" shortcut on the app icon (long-press it).

## Notes

- **Payments**: customers choose M-Pesa on delivery, M-Pesa Till (they can paste the confirmation code) or cash. Automatic M-Pesa STK push needs a server (Cloud Functions on the paid Blaze plan, or another backend) and the Daraja API. It can be added later.
- **Security**: `firestore.rules` lets anyone *create* an order or booking with validated fields, and *read one* by its random code (that's how tracking works). Only admins can list or change records.
- **Order totals**: check prices in the dashboard before you confirm, since the browser calculates them.
- **New-order alerts**: keep the admin page open on a kitchen tablet or phone, with sound on. Allow notifications when the browser asks.
