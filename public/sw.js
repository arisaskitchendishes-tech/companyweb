// Arisa's Kitchen service worker — offline shell + fast repeat visits.
const VERSION = "arisa-v1";
const SHELL = [
  "./", "./index.html", "./admin.html", "./css/style.css", "./css/admin.css",
  "./js/app.js", "./js/admin.js", "./js/store.js", "./js/menu.js", "./js/config.js",
  "./vendor/leaflet/leaflet.js", "./vendor/leaflet/leaflet.css",
  "./assets/logo.png", "./assets/logo-sm.png", "./assets/food-spread.webp", "./assets/plate.jpg",
  "./icons/icon-192.png", "./manifest.webmanifest"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never cache Firebase/Firestore traffic
  if (/googleapis\.com|firebaseio|gstatic\.com\/firebasejs/.test(url.href) && !url.href.includes("fonts")) return;
  // Pages: network first (fresh menu), fall back to cache
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(VERSION).then((ca) => ca.put(req, c)); return r; }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html"))));
    return;
  }
  // Everything else: stale-while-revalidate (includes map tiles & fonts)
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === "opaque")) { const c = r.clone(); caches.open(VERSION).then((ca) => ca.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
