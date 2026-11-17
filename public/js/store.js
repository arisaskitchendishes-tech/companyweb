// Data layer: Firebase (Firestore + Auth) when configured, otherwise a
// local DEMO store (localStorage + BroadcastChannel) so the site and admin
// work out of the box in one browser.
import { FIREBASE_CONFIG, FIREBASE_SDK_VERSION, BUSINESS } from "./config.js";

const configured = !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !/^YOUR/.test(FIREBASE_CONFIG.apiKey));
let fb = null;

async function initFirebase() {
  if (!configured) return null;
  try {
    const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
    const [appMod, fs, authMod] = await Promise.all([
      import(`${base}/firebase-app.js`),
      import(`${base}/firebase-firestore.js`),
      import(`${base}/firebase-auth.js`)
    ]);
    const app = appMod.initializeApp(FIREBASE_CONFIG);
    fb = { fs, db: fs.getFirestore(app), authMod, auth: authMod.getAuth(app) };
    return fb;
  } catch (e) {
    console.warn("[Arisa's] Firebase not reachable — running in demo mode.", e);
    return null;
  }
}
export const ready = initFirebase();
export async function isLive() { return !!(await ready); }

// ── Demo store ───────────────────────────────────────────────
const PREFIX = "arisa_demo_";
const mem = {};
const listeners = {};
const bc = ("BroadcastChannel" in self) ? new BroadcastChannel("arisa-demo") : null;
if (bc) bc.onmessage = (e) => emit(e.data);
addEventListener("storage", (e) => { if (e.key && e.key.startsWith(PREFIX)) emit(e.key.slice(PREFIX.length)); });

function lsGet(k, d) {
  try { const v = localStorage.getItem(PREFIX + k); return v ? JSON.parse(v) : (mem[k] ?? d); }
  catch { return mem[k] ?? d; }
}
function lsSet(k, v) {
  mem[k] = v;
  try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch {}
  try { bc && bc.postMessage(k); } catch {}
  emit(k);
}
function on(k, fn) { (listeners[k] ||= new Set()).add(fn); return () => listeners[k].delete(fn); }
function emit(k) { (listeners[k] || []).forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); }

// Unguessable, human-friendly reference codes (e.g. AK-7F3QK2)
export function makeCode(prefix) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const a = new Uint32Array(6); crypto.getRandomValues(a);
  return `${prefix}-${[...a].map((n) => chars[n % chars.length]).join("")}`;
}

// ── Public API ───────────────────────────────────────────────
async function create(coll, prefix, data, status) {
  const id = makeCode(prefix);
  const now = Date.now();
  const rec = { ...data, id, status, createdAtMs: now };
  const f = await ready;
  if (f) {
    const { doc, setDoc, serverTimestamp } = f.fs;
    await setDoc(doc(f.db, coll, id), { ...rec, createdAt: serverTimestamp() });
  } else {
    const list = lsGet(coll, []); list.unshift(rec); lsSet(coll, list.slice(0, 300));
  }
  return id;
}
export const createOrder = (o) => create("orders", "AK", o, "new");
export const createBooking = (b) => create("bookings", "BK", b, "pending");

// Watch one record (customer tracking)
export function watchOne(coll, id, cb) {
  let unsub = () => {};
  ready.then((f) => {
    if (f) {
      const { doc, onSnapshot } = f.fs;
      unsub = onSnapshot(doc(f.db, coll, id), (s) => cb(s.exists() ? s.data() : null), () => cb(null));
    } else {
      const run = () => cb(lsGet(coll, []).find((r) => r.id === id) || null);
      run(); unsub = on(coll, run);
    }
  });
  return () => unsub();
}

// Watch a whole collection (admin)
export function watchAll(coll, cb, onError) {
  let unsub = () => {};
  ready.then((f) => {
    if (f) {
      const { collection, query, orderBy, limit, onSnapshot } = f.fs;
      const q = query(collection(f.db, coll), orderBy("createdAtMs", "desc"), limit(300));
      unsub = onSnapshot(q, (s) => cb(s.docs.map((d) => d.data())), (e) => onError && onError(e));
    } else {
      const run = () => cb(lsGet(coll, []));
      run(); unsub = on(coll, run);
    }
  });
  return () => unsub();
}

export async function updateRecord(coll, id, patch) {
  const f = await ready;
  const p = { ...patch, updatedAtMs: Date.now() };
  if (f) {
    const { doc, updateDoc } = f.fs;
    await updateDoc(doc(f.db, coll, id), p);
  } else {
    lsSet(coll, lsGet(coll, []).map((r) => (r.id === id ? { ...r, ...p } : r)));
  }
}

// Sold-out menu items (settings/menu → { soldOut: [ids] })
export function watchSoldOut(cb) {
  let unsub = () => {};
  ready.then((f) => {
    if (f) {
      const { doc, onSnapshot } = f.fs;
      unsub = onSnapshot(doc(f.db, "settings", "menu"), (s) => cb((s.exists() && s.data().soldOut) || []), () => cb([]));
    } else {
      const run = () => cb(lsGet("soldOut", []));
      run(); unsub = on("soldOut", run);
    }
  });
  return () => unsub();
}
export async function setSoldOut(ids) {
  const f = await ready;
  if (f) {
    const { doc, setDoc } = f.fs;
    await setDoc(doc(f.db, "settings", "menu"), { soldOut: ids }, { merge: true });
  } else lsSet("soldOut", ids);
}

// ── Admin auth ───────────────────────────────────────────────
export async function onAuth(cb) {
  const f = await ready;
  if (f) return f.authMod.onAuthStateChanged(f.auth, async (u) => {
    if (!u) return cb(null);
    // must be listed in /admins/{uid}
    try {
      const { doc, getDoc } = f.fs;
      const s = await getDoc(doc(f.db, "admins", u.uid));
      cb(s.exists() ? u : { ...u, notAdmin: true });
    } catch { cb({ ...u, notAdmin: true }); }
  });
  let ok = false; try { ok = sessionStorage.getItem(PREFIX + "admin") === "1"; } catch {}
  cb(ok ? { email: "demo@arisaskitchen", demo: true } : null);
}
export async function signIn(email, password) {
  const f = await ready;
  if (f) return f.authMod.signInWithEmailAndPassword(f.auth, email, password);
  if (password !== BUSINESS.demoAdminPin) throw new Error("Wrong PIN — demo PIN is in js/config.js");
  try { sessionStorage.setItem(PREFIX + "admin", "1"); } catch {}
  return { email: "demo@arisaskitchen", demo: true };
}
export async function signOutAdmin() {
  const f = await ready;
  if (f) return f.authMod.signOut(f.auth);
  try { sessionStorage.removeItem(PREFIX + "admin"); } catch {}
}

// Small persistent helpers for the customer (cart, likes, my orders)
export const local = {
  get(k, d) { try { const v = localStorage.getItem("arisa_" + k); return v ? JSON.parse(v) : d; } catch { return mem["c_" + k] ?? d; } },
  set(k, v) { mem["c_" + k] = v; try { localStorage.setItem("arisa_" + k, JSON.stringify(v)); } catch {} }
};
