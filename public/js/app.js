import { BUSINESS as B } from "./config.js";
import { CATEGORIES, MENU, MERCH, PACKAGING, EVENTS, BOOKING_TYPES, PACKAGES, TIME_SLOTS } from "./menu.js";
import { createOrder, createBooking, watchOne, watchSoldOut, local, isLive } from "./store.js";

// ── Helpers ──────────────────────────────────────────────────
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => `<small>${B.currency}</small> ${Math.round(n).toLocaleString("en-KE")}`;
const moneyT = (n) => `${B.currency} ${Math.round(n).toLocaleString("en-KE")}`;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ALL = [...MENU, ...MERCH];
const byId = (id) => ALL.find((x) => x.id === id);
const phoneOk = (p) => /^(\+?254|0)?[17]\d{8}$/.test(String(p).replace(/[\s-]/g, ""));
const vibrate = (ms = 12) => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const niceDate = (iso) => { const d = new Date(iso + "T00:00"); return `${dayNames[d.getDay()]} ${d.getDate()} ${monNames[d.getMonth()]}`; };

let soldOut = [];
let likes = new Set(local.get("likes", []));

// ── Splash ───────────────────────────────────────────────────
addEventListener("load", () => setTimeout(() => $("#splash").classList.add("hide"), reduce ? 0 : 450));
setTimeout(() => $("#splash").classList.add("hide"), 2500);

// ── Business details ─────────────────────────────────────────
$$("[data-biz]").forEach((el) => (el.textContent = B[el.dataset.biz]));
$("#yr").textContent = new Date().getFullYear();
const SOC = { facebook: "i-fb", instagram: "i-ig", youtube: "i-yt", tiktok: "i-tt" };
$("#socials").innerHTML = Object.entries(B.socials).map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener" aria-label="${k}"><svg width="14" height="14"><use href="#${SOC[k]}"/></svg></a>`).join("");

function openState() {
  const now = new Date(); const [o, c] = B.openTimes[now.getDay()];
  const h = now.getHours() + now.getMinutes() / 60;
  const fmt = (x) => { const hh = Math.floor(x), mm = Math.round((x - hh) * 60); const ap = hh >= 12 ? "pm" : "am"; return `${((hh + 11) % 12) + 1}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${ap}`; };
  if (h >= o && h < c) return { open: true, text: `Open now · till ${fmt(c)}` };
  return { open: false, text: h < o ? `Closed · opens ${fmt(o)}` : "Closed · opens tomorrow" };
}
function paintOpen() {
  const s = openState(); const p = $("#openPill");
  p.classList.toggle("closed", !s.open); p.querySelector("em").textContent = s.text;
}
paintOpen(); setInterval(paintOpen, 60000);

$("#hours").innerHTML = B.hours.map(([d, t]) => {
  const today = dayNames[new Date().getDay()];
  const isToday = (d.includes(today)) || (d.includes("–") && (() => { const [a, b] = d.split("–").map((s) => dayNames.indexOf(s.trim())); const t2 = new Date().getDay(); return a > -1 && b > -1 && t2 >= a && t2 <= b; })()) || (d === "Sunday" && today === "Sun");
  return `<div class="${isToday ? "today" : ""}"><span>${esc(d)}${isToday ? " · today" : ""}</span><span>${esc(t)}</span></div>`;
}).join("");
$("#contact").innerHTML = `
  <span><span class="ic"><svg width="18" height="18"><use href="#i-pin"/></svg></span>${esc(B.address)}</span>
  <a href="tel:${esc(B.phone.replace(/\s/g, ""))}"><span class="ic"><svg width="18" height="18"><use href="#i-phone"/></svg></span>${esc(B.phone)}</a>
  <a href="mailto:${esc(B.email)}"><span class="ic"><svg width="18" height="18"><use href="#i-mail"/></svg></span>${esc(B.email)}</a>`;
$("#dirBtn").href = `https://www.openstreetmap.org/directions?route=%3B${B.lat}%2C${B.lng}#map=15/${B.lat}/${B.lng}`;
$("#waBtn").href = `https://wa.me/${B.whatsapp}?text=${encodeURIComponent("Hi Arisa's Kitchen! 👋")}`;

// ── Toast / ripple / confetti ────────────────────────────────
function toast(html, action) {
  const t = document.createElement("div"); t.className = "toast"; t.innerHTML = `<span>${html}</span>`;
  if (action) { const b = document.createElement("button"); b.textContent = action.label; b.onclick = () => { action.fn(); kill(); }; t.append(b); }
  $("#toasts").append(t);
  const kill = () => { t.classList.add("out"); setTimeout(() => t.remove(), 300); };
  setTimeout(kill, 3200);
}
document.addEventListener("pointerdown", (e) => {
  const b = e.target.closest("[data-ripple],.btn"); if (!b || reduce) return;
  const r = b.getBoundingClientRect(); const s = Math.max(r.width, r.height);
  const sp = document.createElement("span"); sp.className = "ripple";
  sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  b.append(sp); setTimeout(() => sp.remove(), 600);
});
function confetti() {
  if (reduce) return;
  const c = document.createElement("div"); c.className = "confetti";
  const cols = ["#ffc20e", "#d7261e", "#3a1a0d", "#3f9b2f", "#f59e0b"];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("i");
    p.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % 5]};animation-duration:${1.6 + Math.random() * 1.6}s;animation-delay:${Math.random() * .4}s;transform:rotate(${Math.random() * 360}deg)`;
    c.append(p);
  }
  document.body.append(c); setTimeout(() => c.remove(), 3800);
}

// ── Header, nav, reveal ──────────────────────────────────────
const hdr = $("#hdr");
addEventListener("scroll", () => hdr.classList.toggle("scrolled", scrollY > 10), { passive: true });
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
const observeReveal = () => $$(".reveal:not(.in)").forEach((el) => io.observe(el));
observeReveal();
const secIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return; const id = e.target.id;
  $$("nav.main a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
  $$(".tabbar [data-tab]").forEach((a) => a.classList.toggle("on", a.dataset.tab === id || (id === "signature" && a.dataset.tab === "home")));
}), { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach((s) => secIO.observe(s));

// ── Hotspots on food spread ──────────────────────────────────
const HOTS = [["sig-grill-platter", 17, 52], ["sig-burger", 34, 30], ["bg-fries", 47, 40], ["ke-pilau", 61, 44], ["in-bolognese", 78, 50], ["dr-passion", 89, 28]];
$("#spread").insertAdjacentHTML("beforeend", HOTS.map(([id, x, y]) => { const it = byId(id); return `<button class="hot" style="left:${x}%;top:${y}%" data-item="${id}" aria-label="Add ${esc(it.name)}">+<span class="tip">${esc(it.name)} · ${moneyT(it.price)}</span></button>`; }).join(""));

// ── Rendering: dishes, menu, merch ───────────────────────────
function dishCard(it) {
  const so = soldOut.includes(it.id);
  return `<article class="dish reveal ${so ? "is-sold" : ""}" data-item="${it.id}">
    <div class="ph"><img src="${it.img}" alt="${esc(it.name)}" loading="lazy" ${it.pos ? `style="object-position:${it.pos}"` : ""}>
      <div class="tags">${(it.tags || []).map((t, i) => `<span class="tag ${i ? "" : "red"}">${esc(t)}</span>`).join("")}</div>
      <button class="like ${likes.has(it.id) ? "on" : ""}" data-like="${it.id}" aria-label="Save to favourites" aria-pressed="${likes.has(it.id)}"><svg width="20" height="20"><use href="#i-heart"/></svg></button>
      ${so ? `<div class="soldout">SOLD OUT TODAY</div>` : ""}
    </div>
    <div class="body"><h3>${esc(it.name)}</h3><p>${esc(it.desc)}</p>
      <div class="foot"><span class="price">${money(it.price)}</span><button class="add" data-add="${it.id}" aria-label="Add ${esc(it.name)}"><svg width="20" height="20"><use href="#i-plus"/></svg></button></div>
    </div></article>`;
}
function renderSignature() { $("#sigGrid").innerHTML = MENU.filter((m) => m.signature).map(dishCard).join(""); observeReveal(); }

let cat = "all", q = "";
function renderCats() {
  const cats = [{ id: "all", label: "All", icon: "✨" }, ...CATEGORIES];
  $("#cats").innerHTML = cats.map((c) => `<button class="chip ${c.id === cat ? "on" : ""}" role="tab" aria-selected="${c.id === cat}" data-cat="${c.id}">${c.icon} ${c.label}</button>`).join("");
}
function renderMenu() {
  const src = cat === "merch" ? MERCH : cat === "all" ? MENU : MENU.filter((m) => m.cat === cat || (cat === "signature" && m.signature));
  const list = src.filter((m) => !q || (m.name + " " + m.desc).toLowerCase().includes(q));
  $("#menuGrid").innerHTML = list.length ? list.map((it, i) => {
    const so = soldOut.includes(it.id);
    return `<div class="mi ${so ? "is-sold" : ""}" data-item="${it.id}" style="animation-delay:${Math.min(i, 12) * 35}ms" tabindex="0" role="button" aria-label="${esc(it.name)}, ${moneyT(it.price)}">
      <img src="${it.img}" alt="" loading="lazy" ${it.pos ? `style="object-position:${it.pos}"` : ""}>
      <div class="t"><h4>${esc(it.name)} ${(it.tags || []).includes("Vegetarian") ? "🌱" : ""}</h4><p>${esc(it.desc)}</p>
      <div class="row"><span class="price">${money(it.price)}</span><button class="add" data-add="${it.id}" aria-label="Add ${esc(it.name)}"><svg width="18" height="18"><use href="#i-plus"/></svg></button></div></div></div>`;
  }).join("") : `<div class="empty">🍽️ Nothing matches "${esc(q)}". Try "chicken" or "juice".</div>`;
}
function renderMerch() {
  $("#merchGrid").innerHTML = MERCH.map((it) => `<article class="merch reveal" data-item="${it.id}">
    <div class="ph"><img src="${it.img}" alt="${esc(it.name)}" loading="lazy" style="object-position:${it.pos || "50% 50%"}">${it.tags ? `<div class="tags">${it.tags.map((t) => `<span class="tag red">${esc(t)}</span>`).join("")}</div>` : ""}</div>
    <div class="body"><h4>${esc(it.name)}</h4><p>${esc(it.desc)}</p>
    <div class="foot" style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span class="price">${money(it.price)}</span><button class="add" data-add="${it.id}" aria-label="Add ${esc(it.name)}"><svg width="18" height="18"><use href="#i-plus"/></svg></button></div></div></article>`).join("");
  $("#packList").innerHTML = PACKAGING.map((p) => `<div><span class="e">${p.e}</span><span><b>${esc(p.title)}</b><small>${esc(p.note)}</small></span></div>`).join("");
  observeReveal();
}
function renderEvents() {
  $("#eventsGrid").innerHTML = EVENTS.map((ev) => `<article class="ev reveal">
    <div class="ph"><img src="${ev.img}" alt="" loading="lazy" style="object-position:50% 30%">
      <div class="datebadge"><b>${ev.date.getDate()}</b><small>${monNames[ev.date.getMonth()]}</small></div></div>
    <div class="body"><span class="tag" style="align-self:flex-start">${esc(ev.tag)}</span><h3>${esc(ev.title)}</h3>
      <div class="meta"><span>📅 ${dayNames[ev.date.getDay()]}, ${ev.time}</span><span>🎟️ ${ev.price ? moneyT(ev.price) : "Free"}</span></div>
      <p>${esc(ev.blurb)}</p>
      <button class="btn btn-sm" data-event="${ev.id}" data-ripple>Reserve my spot <span class="arr">›</span></button></div></article>`).join("");
  observeReveal();
}
renderSignature(); renderCats(); renderMenu(); renderMerch(); renderEvents();

watchSoldOut((ids) => { soldOut = ids || []; renderSignature(); renderMenu(); });

$("#cats").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  cat = b.dataset.cat; renderCats(); renderMenu(); vibrate(8);
  b.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" });
});
let qT; $("#q").addEventListener("input", (e) => { clearTimeout(qT); qT = setTimeout(() => { q = e.target.value.trim().toLowerCase(); if (q && cat !== "all") { cat = "all"; renderCats(); } renderMenu(); }, 140); });

// Global click delegation
document.addEventListener("click", (e) => {
  const like = e.target.closest("[data-like]");
  if (like) { e.stopPropagation(); const id = like.dataset.like; likes.has(id) ? likes.delete(id) : likes.add(id); local.set("likes", [...likes]); like.classList.toggle("on"); like.setAttribute("aria-pressed", likes.has(id)); vibrate(); if (likes.has(id)) toast("❤️ Saved to favourites"); return; }
  const add = e.target.closest("[data-add]");
  if (add) { e.stopPropagation(); const it = byId(add.dataset.add); if (soldOut.includes(it.id)) return toast("Sorry, that's sold out today 😔"); if (it.options && it.options.some((o) => o.type === "one")) return openSheet(it); addToCart(it, {}, 1, add); return; }
  const item = e.target.closest("[data-item]");
  if (item && !e.target.closest("button:not(.hot)")) { const it = byId(item.dataset.item); if (it) openSheet(it); return; }
  if (item && item.classList.contains("hot")) { openSheet(byId(item.dataset.item)); return; }
  const op = e.target.closest("[data-open]");
  if (op) { e.preventDefault(); op.dataset.open === "cart" ? openCart() : openTrack(); return; }
  if (e.target.closest("[data-close]") || e.target === $("#scrim") || e.target === $("#modal")) { closeAll(); return; }
  const ev = e.target.closest("[data-event]"); if (ev) { startEventBooking(ev.dataset.event); return; }
  const bk = e.target.closest("[data-book]"); if (bk) { bState.type = bk.dataset.book; renderTypes(); goStep(0); location.hash = "book"; return; }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAll();
  if ((e.key === "Enter" || e.key === " ") && e.target.matches(".mi")) { e.preventDefault(); openSheet(byId(e.target.dataset.item)); }
});

// ── Overlays ─────────────────────────────────────────────────
let lastFocus = null;
function showScrim() { $("#scrim").classList.add("on"); document.body.style.overflow = "hidden"; }
function closeAll() {
  ["#cart", "#sheet", "#modal"].forEach((s) => { $(s).classList.remove("on"); $(s).setAttribute("aria-hidden", "true"); });
  $("#scrim").classList.remove("on"); document.body.style.overflow = "";
  if (trackUnsub) { trackUnsub(); trackUnsub = null; }
  lastFocus && lastFocus.focus && lastFocus.focus();
}
function openPanel(sel) { lastFocus = document.activeElement; closeAllSilently(); showScrim(); const p = $(sel); p.classList.add("on"); p.setAttribute("aria-hidden", "false"); setTimeout(() => (p.querySelector("button,input") || p).focus({ preventScroll: true }), 350); }
function closeAllSilently() { ["#cart", "#sheet", "#modal"].forEach((s) => $(s).classList.remove("on")); if (trackUnsub) { trackUnsub(); trackUnsub = null; } }

// ── Item sheet ───────────────────────────────────────────────
let sheetState = null;
function openSheet(it) {
  if (!it) return;
  const so = soldOut.includes(it.id);
  sheetState = { it, sel: {}, qty: 1 };
  (it.options || []).forEach((o) => { sheetState.sel[o.name] = o.type === "one" ? o.choices[0] : []; });
  $("#sheetInner").innerHTML = `
    <img class="hero-img" src="${it.img}" alt="" style="object-position:${it.pos || "50% 50%"}">
    <div class="sheet-b">
      <div style="display:flex;gap:6px;margin-bottom:6px">${(it.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <h3 style="font-size:1.5rem">${esc(it.name)}</h3>
      <p style="color:var(--muted);margin-top:4px">${esc(it.desc)}</p>
      ${(it.options || []).map((o) => `<div class="optgroup"><h5>${esc(o.name)} <small>${o.type === "one" ? "Pick one" : "Optional"}</small></h5><div class="pills">${o.choices.map((c) => { const [label, extra] = Array.isArray(c) ? c : [c, 0]; return `<button type="button" class="pill ${o.type === "one" && sheetState.sel[o.name] === label ? "on" : ""}" data-o="${esc(o.name)}" data-c="${esc(label)}" data-x="${extra}">${esc(label)}${extra ? ` +${extra}` : ""}</button>`; }).join("")}</div></div>`).join("")}
      <div class="field" style="margin-top:14px"><label for="itNote">Special request</label><input id="itNote" placeholder="e.g. no onions" maxlength="120"></div>
    </div>
    <div class="sheet-f">
      <div class="counter"><button type="button" data-sq="-1" aria-label="Less">−</button><output id="sQty">1</output><button type="button" data-sq="1" aria-label="More">+</button></div>
      <button class="btn btn-red" style="flex:1" id="sAdd" ${so ? "disabled" : ""} data-ripple>${so ? "Sold out today" : `Add · <span id="sTotal"></span>`}</button>
    </div>`;
  paintSheet(); openPanel("#sheet");
}
function sheetUnit() {
  const { it, sel } = sheetState; let p = it.price;
  (it.options || []).forEach((o) => { if (o.type === "many") o.choices.forEach((c) => { if (Array.isArray(c) && sel[o.name].includes(c[0])) p += c[1]; }); });
  return p;
}
function paintSheet() { const t = $("#sTotal"); if (t) t.textContent = moneyT(sheetUnit() * sheetState.qty); $("#sQty").textContent = sheetState.qty; }
$("#sheet").addEventListener("click", (e) => {
  const pill = e.target.closest(".pill");
  if (pill) {
    const o = sheetState.it.options.find((x) => x.name === pill.dataset.o);
    if (o.type === "one") { sheetState.sel[o.name] = pill.dataset.c; $$(`.pill[data-o="${CSS.escape(o.name)}"]`, $("#sheet")).forEach((p) => p.classList.toggle("on", p === pill)); }
    else { const arr = sheetState.sel[o.name]; const i = arr.indexOf(pill.dataset.c); i > -1 ? arr.splice(i, 1) : arr.push(pill.dataset.c); pill.classList.toggle("on"); }
    vibrate(6); paintSheet(); return;
  }
  const sq = e.target.closest("[data-sq]");
  if (sq) { sheetState.qty = Math.max(1, Math.min(20, sheetState.qty + +sq.dataset.sq)); const o = $("#sQty"); o.classList.remove("bump"); void o.offsetWidth; o.classList.add("bump"); paintSheet(); return; }
  if (e.target.closest("#sAdd")) {
    const opts = { ...sheetState.sel }; const note = $("#itNote").value.trim(); if (note) opts.Note = note;
    addToCart(sheetState.it, opts, sheetState.qty, e.target.closest("#sAdd"), sheetUnit());
    closeAll();
  }
});

// ── Cart ─────────────────────────────────────────────────────
let cart = local.get("cart", []);
let cartView = "cart";
const optText = (o) => Object.entries(o || {}).map(([k, v]) => Array.isArray(v) ? (v.length ? v.join(", ") : "") : (k === "Note" ? `“${v}”` : v)).filter(Boolean).join(" · ");
function addToCart(it, opts, qty, fromEl, unit) {
  const key = it.id + "|" + JSON.stringify(opts);
  const ex = cart.find((c) => c.key === key);
  if (ex) ex.qty += qty; else cart.push({ key, id: it.id, name: it.name, img: it.img, pos: it.pos, unit: unit ?? it.price, qty, opts });
  saveCart(); flyToCart(fromEl); vibrate(15);
  toast(`<b>${esc(it.name)}</b> added`, { label: "View cart", fn: openCart });
}
function saveCart() { local.set("cart", cart); paintBadges(); if ($("#cart").classList.contains("on") && cartView === "cart") renderCart(); }
const count = () => cart.reduce((a, c) => a + c.qty, 0);
const subtotal = () => cart.reduce((a, c) => a + c.qty * c.unit, 0);
function paintBadges() {
  const n = count();
  $$("[data-cart-count]").forEach((b) => { b.textContent = n; b.classList.toggle("show", n > 0); b.classList.remove("pop"); void b.offsetWidth; if (n) b.classList.add("pop"); });
}
paintBadges();
function flyToCart(from) {
  if (reduce || !from) return;
  const targets = $$("[data-cart-count]").map((b) => b.parentElement).filter((el) => el.offsetParent !== null);
  const to = targets[targets.length - 1]; if (!to) return;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const d = document.createElement("div"); d.className = "fly";
  d.style.left = a.left + a.width / 2 - 11 + "px"; d.style.top = a.top + a.height / 2 - 11 + "px";
  document.body.append(d);
  requestAnimationFrame(() => { d.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px,${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.4)`; d.style.opacity = ".2"; });
  setTimeout(() => d.remove(), 720);
}
let checkout = local.get("checkout", { mode: "delivery", name: "", phone: "", address: "", notes: "", pay: "mpesa_delivery", when: "asap" });
const hasFood = () => cart.some((c) => !c.id.startsWith("mc-"));
function fee() { if (checkout.mode !== "delivery") return 0; return subtotal() >= B.freeDeliveryOver ? 0 : B.deliveryFee; }

function openCart() { cartView = cart.length ? (cartView === "done" ? "cart" : cartView) : "cart"; if (cartView === "done") cartView = "cart"; renderCart(); openPanel("#cart"); }
function renderCart() {
  const body = $("#cartBody"), foot = $("#cartFoot");
  $("#cartBack").style.display = cartView === "checkout" ? "" : "none";
  if (cartView === "cart") {
    $("#cartTitle").textContent = "Your order";
    if (!cart.length) {
      const last = local.get("myOrders", [])[0];
      body.innerHTML = `<div class="cart-empty"><span class="bowl">🍲</span><h3 style="margin:10px 0 6px">Your bowl is empty</h3><p>Let's fix that. Our fire-grilled chicken is a great start.</p>
        <div style="display:grid;gap:10px;margin-top:18px"><button class="btn btn-red" data-goto="menu">Browse the menu</button>${last ? `<button class="btn btn-ghost" id="reorder">↻ Reorder last (${esc(last.id)})</button>` : ""}</div></div>`;
      foot.innerHTML = ""; return;
    }
    const sub = subtotal(); const left = Math.max(0, B.freeDeliveryOver - sub);
    body.innerHTML = `<div class="progress-free">${left ? `Add <b>${moneyT(left)}</b> more for <b>free delivery</b> 🛵` : `🎉 You've unlocked <b>free delivery</b>!`}<i><b style="width:${Math.min(100, sub / B.freeDeliveryOver * 100)}%"></b></i></div>` +
      cart.map((c) => `<div class="ci" data-key="${esc(c.key)}"><img src="${c.img}" alt="" style="object-position:${c.pos || "50% 50%"}"><div class="t"><b>${esc(c.name)}</b>${optText(c.opts) ? `<small>${esc(optText(c.opts))}</small>` : ""}
        <div class="q"><button data-q="-1" aria-label="Less">${c.qty === 1 ? "🗑" : "−"}</button><span>${c.qty}</span><button data-q="1" aria-label="More">+</button></div></div><span class="price" style="font-size:1rem">${money(c.unit * c.qty)}</span></div>`).join("") +
      `<button class="btn btn-ghost btn-sm" style="margin-top:14px" data-goto="menu">+ Add more items</button>`;
    foot.innerHTML = `<div class="summary" style="background:none;padding:0 0 12px"><div><span>Subtotal (${count()} items)</span><b>${moneyT(sub)}</b></div></div><button class="btn btn-red btn-block" id="toCheckout" data-ripple>Checkout · ${moneyT(sub)} <span class="arr">›</span></button>`;
  } else if (cartView === "checkout") {
    $("#cartTitle").textContent = "Checkout";
    body.innerHTML = `
      <div class="seg ${checkout.mode === "pickup" ? "r" : ""}" role="tablist"><span class="knob"></span><button type="button" class="${checkout.mode === "delivery" ? "on" : ""}" data-mode="delivery">🛵 Delivery</button><button type="button" class="${checkout.mode === "pickup" ? "on" : ""}" data-mode="pickup">🏃 Pickup</button></div>
      <div class="row2"><div class="field"><label for="cName">Name</label><input id="cName" autocomplete="name" value="${esc(checkout.name)}"><div class="msg">Please enter your name</div></div>
      <div class="field"><label for="cPhone">Phone (M-Pesa)</label><input id="cPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="07xx xxx xxx" value="${esc(checkout.phone)}"><div class="msg">Enter a valid Kenyan number</div></div></div>
      ${checkout.mode === "delivery" ? `<div class="field"><label for="cAddr">Delivery address</label><input id="cAddr" autocomplete="street-address" placeholder="Estate, street, building, house no." value="${esc(checkout.address)}"><div class="msg">Where should we deliver?</div></div>` : `<div class="summary" style="margin-bottom:12px"><div><span>Pickup at</span><b>${esc(B.address)}</b></div></div>`}
      <div class="field"><label for="cWhen">When</label><select id="cWhen"><option value="asap">As soon as possible (~${checkout.mode === "delivery" ? 35 : 20} min)</option>${["12:30", "13:00", "13:30", "18:30", "19:00", "19:30", "20:00"].map((t) => `<option ${checkout.when === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label for="cNotes">Note for the kitchen / rider</label><input id="cNotes" placeholder="Gate code, landmark…" value="${esc(checkout.notes)}"></div>
      <span class="lbl">Payment</span>
      <div class="pay">
        <label><input type="radio" name="pay" value="mpesa_delivery" ${checkout.pay === "mpesa_delivery" ? "checked" : ""}><span><b>M-Pesa on ${checkout.mode === "delivery" ? "delivery" : "pickup"}</b><small>Pay when your food arrives</small></span></label>
        <label><input type="radio" name="pay" value="mpesa_till" ${checkout.pay === "mpesa_till" ? "checked" : ""}><span><b>M-Pesa Buy Goods · Till ${esc(B.mpesaTill)}</b><small>Pay now & add the M-Pesa code below</small></span></label>
        <label><input type="radio" name="pay" value="cash" ${checkout.pay === "cash" ? "checked" : ""}><span><b>Cash</b><small>Have exact change if you can 🙏</small></span></label>
      </div>
      <div class="field" id="mpesaCodeF" style="margin-top:10px;${checkout.pay === "mpesa_till" ? "" : "display:none"}"><label for="cCode">M-Pesa confirmation code (optional)</label><input id="cCode" placeholder="e.g. SKL2AB3CDE" style="text-transform:uppercase"></div>`;
    paintCheckoutFoot();
  } else if (cartView === "done") {
    $("#cartTitle").textContent = "Order placed";
    body.innerHTML = doneHTML; foot.innerHTML = `<button class="btn btn-block" data-goto="menu">Back to the menu</button>`;
  }
}
function paintCheckoutFoot() {
  const sub = subtotal(), f = fee();
  $("#cartFoot").innerHTML = `<div class="summary" style="margin-bottom:12px"><div><span>Subtotal</span><b>${moneyT(sub)}</b></div>${checkout.mode === "delivery" ? `<div><span>Delivery</span><b>${f ? moneyT(f) : "FREE 🎉"}</b></div>` : ""}<div class="total"><span>Total</span><b>${moneyT(sub + f)}</b></div></div>
    <button class="btn btn-red btn-block" id="placeOrder" data-ripple>Place order · ${moneyT(sub + f)}</button>`;
}
function readCheckout() {
  const v = (id) => ($("#" + id) ? $("#" + id).value.trim() : "");
  checkout.name = v("cName"); checkout.phone = v("cPhone"); if ($("#cAddr")) checkout.address = v("cAddr");
  checkout.notes = v("cNotes"); checkout.when = v("cWhen") || "asap";
  const p = $('input[name="pay"]:checked'); if (p) checkout.pay = p.value;
  local.set("checkout", checkout);
}
let doneHTML = "";
$("#cart").addEventListener("click", async (e) => {
  const q2 = e.target.closest("[data-q]");
  if (q2) {
    const row = q2.closest(".ci"); const c = cart.find((x) => x.key === row.dataset.key);
    c.qty += +q2.dataset.q; vibrate(6);
    if (c.qty <= 0) { row.classList.add("out"); setTimeout(() => { cart = cart.filter((x) => x !== c); saveCart(); toast(`Removed ${esc(c.name)}`, { label: "Undo", fn: () => { c.qty = 1; cart.push(c); saveCart(); } }); }, 280); }
    else saveCart();
    return;
  }
  if (e.target.closest("[data-goto]")) { closeAll(); location.hash = e.target.closest("[data-goto]").dataset.goto; return; }
  if (e.target.closest("#reorder")) { const last = local.get("myOrders", [])[0]; if (last && last.items) { cart = last.items.map((i) => ({ ...i })); saveCart(); renderCart(); toast("↻ Last order added to cart"); } return; }
  if (e.target.closest("#toCheckout")) { cartView = "checkout"; renderCart(); return; }
  if (e.target.closest("#cartBack")) { readCheckout(); cartView = "cart"; renderCart(); return; }
  const m = e.target.closest("[data-mode]");
  if (m) { readCheckout(); checkout.mode = m.dataset.mode; local.set("checkout", checkout); renderCart(); return; }
  if (e.target.closest("#placeOrder")) placeOrder(e.target.closest("#placeOrder"));
});
$("#cart").addEventListener("change", (e) => {
  if (e.target.name === "pay") { readCheckout(); $("#mpesaCodeF").style.display = checkout.pay === "mpesa_till" ? "" : "none"; }
});
function markErr(id, bad) { const f = $("#" + id)?.closest(".field"); if (f) { f.classList.toggle("err", bad); } return bad; }
async function placeOrder(btn) {
  readCheckout();
  let bad = false;
  bad = markErr("cName", checkout.name.length < 2) || bad;
  bad = markErr("cPhone", !phoneOk(checkout.phone)) || bad;
  if (checkout.mode === "delivery") bad = markErr("cAddr", checkout.address.length < 4) || bad;
  if (bad) { vibrate([20, 40, 20]); $(".field.err input")?.focus(); return; }
  btn.disabled = true; btn.innerHTML = `<span class="spin">⏳</span> Sending to the kitchen…`;
  const sub = subtotal(), f = fee();
  const order = {
    items: cart.map((c) => ({ id: c.id, name: c.name, qty: c.qty, unit: c.unit, opts: optText(c.opts) })),
    customer: { name: checkout.name, phone: checkout.phone, address: checkout.mode === "delivery" ? checkout.address : "" },
    mode: checkout.mode, when: checkout.when, notes: checkout.notes,
    payment: checkout.pay, mpesaCode: ($("#cCode")?.value || "").trim().toUpperCase(),
    subtotal: sub, deliveryFee: f, total: sub + f
  };
  try {
    const id = await createOrder(order);
    const mine = local.get("myOrders", []); mine.unshift({ id, at: Date.now(), total: sub + f, items: cart }); local.set("myOrders", mine.slice(0, 10));
    const waText = encodeURIComponent(`Hi Arisa's Kitchen! I just placed order ${id} (${moneyT(sub + f)}).`);
    doneHTML = `<div style="text-align:center;padding:16px 0">
      <div class="success-ico"><svg width="44" height="44" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#3a1a0d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h3 style="font-size:1.6rem">Asante, ${esc(checkout.name.split(" ")[0])}! 🎉</h3>
      <p style="color:var(--muted);margin:6px 0 16px">Your order is in. We'll call or WhatsApp ${esc(checkout.phone)} to confirm.</p>
      <div class="summary"><div><span>Order code</span><b class="track-code" style="font-size:1.2rem">${id}</b></div><div><span>Total</span><b>${moneyT(sub + f)}</b></div><div><span>${checkout.mode === "delivery" ? "Delivering to" : "Pickup"}</span><b>${esc(checkout.mode === "delivery" ? checkout.address : B.address)}</b></div></div>
      <div style="display:grid;gap:10px;margin-top:16px"><button class="btn btn-red" data-track="${id}">Track my order live</button>
      <a class="btn btn-ghost" href="https://wa.me/${B.whatsapp}?text=${waText}" target="_blank" rel="noopener"><svg width="16" height="16"><use href="#i-wa"/></svg>Send to WhatsApp</a></div></div>`;
    cart = []; saveCart(); cartView = "done"; renderCart(); confetti(); vibrate([30, 60, 30]);
  } catch (err) {
    console.error(err); btn.disabled = false; paintCheckoutFoot();
    toast("😔 Couldn't send your order. Check your connection and try again.");
  }
}
document.addEventListener("click", (e) => { const t = e.target.closest("[data-track]"); if (t) { e.preventDefault(); openTrack(t.dataset.track); } });

// ── Order tracking ───────────────────────────────────────────
let trackUnsub = null;
const STEPS_DELIVERY = [["new", "📝", "Order received", "The kitchen has your order"], ["preparing", "👩‍🍳", "Preparing", "Fresh on the grill"], ["on_the_way", "🛵", "On the way", "Your rider is heading over"], ["delivered", "🎉", "Delivered", "Enjoy every bite!"]];
const STEPS_PICKUP = [["new", "📝", "Order received", "The kitchen has your order"], ["preparing", "👩‍🍳", "Preparing", "Fresh on the grill"], ["ready", "🛍️", "Ready for pickup", "Come grab it while it's hot"], ["delivered", "🎉", "Collected", "Enjoy every bite!"]];
function openTrack(id) {
  const mine = local.get("myOrders", []);
  $("#modalBody").innerHTML = `<h3 style="font-size:1.5rem;margin-bottom:6px">Track your order</h3>
    <p style="color:var(--muted);margin-bottom:12px">Enter the code from your confirmation.</p>
    <form id="trackForm" style="display:flex;gap:8px"><div class="field" style="flex:1;margin:0"><input id="tCode" placeholder="AK-XXXXXX" value="${esc(id || "")}" style="text-transform:uppercase" aria-label="Order code"></div><button class="btn btn-red">Track</button></form>
    ${mine.length ? `<div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">${mine.slice(0, 4).map((o) => `<button class="pill" data-track="${o.id}">${o.id}</button>`).join("")}</div>` : ""}
    <div id="tOut"></div>`;
  $("#trackForm").onsubmit = (e) => { e.preventDefault(); const c = $("#tCode").value.trim().toUpperCase(); if (c) runTrack(c); };
  openPanel("#modal");
  if (id) runTrack(id);
}
function runTrack(id) {
  if (trackUnsub) trackUnsub();
  $("#tOut").innerHTML = `<p style="margin-top:16px;color:var(--muted)">Looking up ${esc(id)}…</p>`;
  trackUnsub = watchOne("orders", id, (o) => {
    if (!o) { $("#tOut").innerHTML = `<p style="margin-top:16px;color:var(--red)">We couldn't find order <b>${esc(id)}</b>. Check the code and try again.</p>`; return; }
    if (o.status === "cancelled") { $("#tOut").innerHTML = `<div class="summary" style="margin-top:16px"><div><span>Order ${esc(o.id)}</span><b style="color:var(--red)">Cancelled</b></div></div><p style="margin-top:10px;color:var(--muted)">Questions? Call ${esc(B.phone)}.</p>`; return; }
    const steps = o.mode === "pickup" ? STEPS_PICKUP : STEPS_DELIVERY;
    const idx = Math.max(0, steps.findIndex((s) => s[0] === o.status));
    $("#tOut").innerHTML = `<div class="track-code" style="margin-top:18px">${esc(o.id)}</div>
      <ol class="tl">${steps.map((s, i) => `<li class="${i < idx || (i === idx && i === steps.length - 1) ? "done" : i === idx ? "now done" : ""}"><span class="dot">${s[1]}</span><span><b>${s[2]}</b><small>${s[3]}</small></span></li>`).join("")}</ol>
      <div class="summary"><div><span>${(o.items || []).reduce((a, i) => a + i.qty, 0)} items</span><b>${moneyT(o.total || 0)}</b></div>${o.eta ? `<div><span>ETA</span><b>${esc(o.eta)}</b></div>` : ""}</div>`;
  });
}

// ── Booking wizard ───────────────────────────────────────────
const bState = { step: 0, type: "table", event: null, date: null, time: null, guests: 2, pkg: "classic", occasion: "" };
const OCCASIONS = ["None", "Birthday 🎂", "Anniversary 💕", "Business 💼", "Date night 🌙", "Family 👨‍👩‍👧"];
function renderTypes() {
  $("#bTypes").innerHTML = BOOKING_TYPES.map((t) => `<button type="button" class="opt ${bState.type === t.id && !bState.event ? "on" : ""}" data-type="${t.id}"><span class="em">${t.icon}</span><b>${t.label}</b><small>${t.hint}</small></button>`).join("");
  $("#evPick").style.display = bState.event ? "" : "none";
  if (bState.event) $("#bEventName").value = bState.event.title;
}
function renderDates() {
  const days = []; const d0 = new Date(); d0.setHours(0, 0, 0, 0);
  const minLead = ["catering", "corporate", "chef"].includes(bState.type) ? 3 : 0;
  for (let i = minLead; i < minLead + 21; i++) { const d = new Date(d0); d.setDate(d.getDate() + i); days.push(d); }
  if (!bState.date || new Date(bState.date) < days[0]) bState.date = isoDate(days[0]);
  $("#bDates").innerHTML = days.map((d) => `<button type="button" class="date ${isoDate(d) === bState.date ? "on" : ""}" data-date="${isoDate(d)}"><small>${isoDate(d) === isoDate(d0) ? "Today" : dayNames[d.getDay()]}</small><b>${d.getDate()}</b><small>${monNames[d.getMonth()]}</small></button>`).join("");
  $("#dateHint").textContent = minLead ? "Events need at least 3 days' notice so we can prepare." : "Choose a date, then a time.";
  renderSlots();
}
function renderSlots() {
  const now = new Date(); const today = isoDate(now) === bState.date;
  $("#bSlots").innerHTML = TIME_SLOTS.map((t) => { const [h, m] = t.split(":").map(Number); const past = today && (h + m / 60) <= now.getHours() + now.getMinutes() / 60 + 1; return `<button type="button" class="slot ${bState.time === t ? "on" : ""}" data-time="${t}" ${past ? "disabled" : ""}>${t}</button>`; }).join("");
}
function renderGuests() {
  const isEvent = ["birthday", "corporate", "catering", "chef"].includes(bState.type) && !bState.event;
  $("#pkgWrap").style.display = isEvent ? "" : "none";
  $("#occWrap").style.display = bState.type === "table" && !bState.event ? "" : "none";
  $("#guestHint").textContent = bState.event ? "How many spots should we hold?" : bState.type === "table" ? "Tables seat up to 12. Larger groups: choose an event type." : "Roughly how many guests? You can change this later.";
  $("#bPkgs").innerHTML = PACKAGES.map((p) => `<button type="button" class="opt ${bState.pkg === p.id ? "on" : ""}" data-pkg="${p.id}"><b>${p.label}</b><span class="pp">${moneyT(p.pp)}</span><br><small>${p.items}</small></button>`).join("");
  $("#bOcc").innerHTML = OCCASIONS.map((o) => `<button type="button" class="pill ${(bState.occasion || "None") === o ? "on" : ""}" data-occ="${o}">${o}</button>`).join("");
  $("#bGuests").textContent = bState.guests;
  $("#venueField").style.display = ["catering", "chef"].includes(bState.type) && !bState.event ? "" : "none";
}
function maxGuests() { return bState.event ? 20 : bState.type === "table" ? 12 : 500; }
function estimate() {
  if (bState.event) return bState.event.price * bState.guests;
  const isEvent = ["birthday", "corporate", "catering", "chef"].includes(bState.type);
  return isEvent ? PACKAGES.find((p) => p.id === bState.pkg).pp * bState.guests : 0;
}
function bookingLabel() { return bState.event ? bState.event.title : BOOKING_TYPES.find((t) => t.id === bState.type).label; }
function renderSummary() {
  const est = estimate();
  $("#bSummary").innerHTML = `<div><span>Booking</span><b>${esc(bookingLabel())}</b></div><div><span>When</span><b>${niceDate(bState.date)} · ${bState.time}</b></div><div><span>Guests</span><b>${bState.guests}</b></div>
    ${bState.pkg && $("#pkgWrap").style.display !== "none" ? `<div><span>Package</span><b>${PACKAGES.find((p) => p.id === bState.pkg).label}</b></div>` : ""}
    ${est ? `<div class="total"><span>Estimated total</span><b>${moneyT(est)}</b></div>` : `<div class="total"><span>Deposit</span><b>None needed 🙌</b></div>`}`;
}
function goStep(n) {
  bState.step = n;
  $$("#bookForm .pane").forEach((p) => p.classList.toggle("on", +p.dataset.p === n));
  $$("#bSteps .s").forEach((s, i) => { s.classList.toggle("done", i < n); s.classList.toggle("cur", i === n); });
  $("#bBack").style.visibility = n ? "visible" : "hidden";
  $("#bNext").innerHTML = n === 3 ? "Confirm booking ✓" : `Continue <span class="arr">›</span>`;
  if (n === 1) renderDates();
  if (n === 2) renderGuests();
  if (n === 3) renderSummary();
}
renderTypes(); goStep(0);
$("#bookForm").addEventListener("click", (e) => {
  const t = e.target.closest("[data-type]");
  if (t) { bState.type = t.dataset.type; bState.event = null; bState.time = null; bState.guests = bState.type === "table" ? 2 : 20; renderTypes(); vibrate(8); setTimeout(() => goStep(1), reduce ? 0 : 260); return; }
  const d = e.target.closest("[data-date]"); if (d) { bState.date = d.dataset.date; bState.time = null; renderDates(); vibrate(6); return; }
  const s = e.target.closest("[data-time]"); if (s) { bState.time = s.dataset.time; renderSlots(); vibrate(6); return; }
  const g = e.target.closest("[data-g]");
  if (g) { bState.guests = Math.max(1, Math.min(maxGuests(), bState.guests + (+g.dataset.g) * (bState.guests >= 20 && bState.type !== "table" && !bState.event ? 5 : 1))); const o = $("#bGuests"); o.textContent = bState.guests; o.classList.remove("bump"); void o.offsetWidth; o.classList.add("bump"); return; }
  const p = e.target.closest("[data-pkg]"); if (p) { bState.pkg = p.dataset.pkg; renderGuests(); return; }
  const oc = e.target.closest("[data-occ]"); if (oc) { bState.occasion = oc.dataset.occ === "None" ? "" : oc.dataset.occ; renderGuests(); return; }
});
$("#bBack").onclick = () => goStep(Math.max(0, bState.step - (bState.event && bState.step === 2 ? 2 : 1)));
$("#bNext").onclick = async () => {
  if (bState.step === 0) return goStep(1);
  if (bState.step === 1) { if (!bState.time) { toast("⏰ Pick a time slot"); $("#bSlots").animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "none" }], { duration: 300 }); return; } return goStep(2); }
  if (bState.step === 2) return goStep(3);
  const name = $("#bName").value.trim(), phone = $("#bPhone").value.trim();
  let bad = markErr("bName", name.length < 2); bad = markErr("bPhone", !phoneOk(phone)) || bad;
  if (bad) { vibrate([20, 40, 20]); return; }
  const btn = $("#bNext"); btn.disabled = true; btn.textContent = "Booking…";
  const rec = {
    type: bState.event ? "event" : bState.type, label: bookingLabel(), eventId: bState.event?.id || "", date: bState.date, time: bState.time, guests: bState.guests,
    package: $("#pkgWrap").style.display !== "none" ? bState.pkg : "", occasion: bState.occasion, estimate: estimate(),
    customer: { name, phone, email: $("#bEmail").value.trim() }, venue: $("#bVenue").value.trim(), notes: $("#bNotes").value.trim()
  };
  try {
    const id = await createBooking(rec);
    const mine = local.get("myBookings", []); mine.unshift({ id, ...rec }); local.set("myBookings", mine.slice(0, 10));
    const wa = encodeURIComponent(`Hi Arisa's Kitchen! Booking ${id}: ${rec.label}, ${niceDate(rec.date)} at ${rec.time} for ${rec.guests}.`);
    $("#modalBody").innerHTML = `<div style="text-align:center"><div class="success-ico"><svg width="44" height="44" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#3a1a0d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h3 style="font-size:1.6rem">You're booked in, ${esc(name.split(" ")[0])}!</h3><p style="color:var(--muted);margin:6px 0 14px">We'll confirm on ${esc(phone)} shortly.</p>
      <div class="summary" style="text-align:left"><div><span>Reference</span><b class="track-code" style="font-size:1.1rem">${id}</b></div><div><span>${esc(rec.label)}</span><b>${niceDate(rec.date)} · ${rec.time}</b></div><div><span>Guests</span><b>${rec.guests}</b></div></div>
      <div style="display:grid;gap:10px;margin-top:16px"><a class="btn btn-red" href="https://wa.me/${B.whatsapp}?text=${wa}" target="_blank" rel="noopener"><svg width="16" height="16"><use href="#i-wa"/></svg>Send to WhatsApp</a><button class="btn btn-ghost" data-close>Done</button></div></div>`;
    openPanel("#modal"); confetti(); vibrate([30, 60, 30]);
    Object.assign(bState, { event: null, time: null, guests: 2, type: "table", occasion: "" }); $("#bookForm").reset(); renderTypes(); goStep(0);
  } catch (err) { console.error(err); toast("😔 Couldn't save your booking. Please try again."); }
  btn.disabled = false; if (bState.step === 3) btn.textContent = "Confirm booking ✓";
};
function startEventBooking(id) {
  const ev = EVENTS.find((x) => x.id === id);
  Object.assign(bState, { event: ev, type: "table", date: isoDate(ev.date), time: ev.time, guests: 2 });
  renderTypes(); goStep(2);
  $("#book").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  toast(`🎟️ Reserving: <b>${esc(ev.title)}</b>`);
}

// ── Subscribe ────────────────────────────────────────────────
$("#subForm").onsubmit = (e) => { e.preventDefault(); e.target.reset(); toast("💌 You're on the list. Watch your inbox!"); confetti(); };

// ── Map (Leaflet + OpenStreetMap) ────────────────────────────
function initMap() {
  if (!window.L || $("#map")._done) return; $("#map")._done = true;
  const map = L.map("map", { scrollWheelZoom: false, zoomControl: true }).setView([B.lat, B.lng], 14);
  const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
  let errs = 0; tiles.on("tileerror", () => { if (++errs > 3) $("#mapNote").classList.add("show"); });
  const icon = L.divIcon({ className: "", html: `<div class="pin"><img src="assets/logo-sm.png" alt=""></div>`, iconSize: [54, 54], iconAnchor: [27, 54], popupAnchor: [0, -50] });
  L.marker([B.lat, B.lng], { icon }).addTo(map).bindPopup(`<b>Arisa's Kitchen</b><br>${esc(B.address)}<br><a href="${$("#dirBtn").href}" target="_blank" rel="noopener">Get directions →</a>`);
  L.circle([B.lat, B.lng], { radius: B.deliveryRadiusKm * 1000, color: "#d7261e", weight: 2, fillColor: "#ffc20e", fillOpacity: .12, dashArray: "6 6" }).addTo(map).bindTooltip(`We deliver within ${B.deliveryRadiusKm} km`);
  map.on("click", () => map.scrollWheelZoom.enable());
  [300, 900].forEach((t) => setTimeout(() => map.invalidateSize(), t));
}
const mapIO = new IntersectionObserver((es) => { if (es[0].isIntersecting) { const go = () => window.L ? initMap() : setTimeout(go, 200); go(); mapIO.disconnect(); } }, { rootMargin: "300px" });
mapIO.observe($("#map"));

// ── PWA: service worker + install ────────────────────────────
try { if ("serviceWorker" in navigator && location.protocol === "https:" || location.hostname === "localhost") navigator.serviceWorker.register("sw.js").catch(() => {}); } catch {}
let deferred = null;
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
const dismissed = () => { const t = local.get("installDismissed", 0); return Date.now() - t < 3 * 864e5; };
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); deferred = e; $("#installBtn").classList.add("show");
  if (!dismissed()) setTimeout(() => $("#installBanner").classList.add("show"), 6000);
});
async function doInstall() {
  if (deferred) { deferred.prompt(); const r = await deferred.userChoice; deferred = null; $("#installBanner").classList.remove("show"); if (r.outcome === "accepted") toast("🎉 Arisa's is on your home screen!"); return; }
  if (ios) { $("#modalBody").innerHTML = `<h3 style="font-size:1.4rem">Add to Home Screen</h3><ol style="margin:14px 0 0 20px;display:grid;gap:10px"><li>Tap the <b>Share</b> button <span style="font-size:1.2rem">⎋</span> in Safari</li><li>Scroll and tap <b>Add to Home Screen</b> ➕</li><li>Tap <b>Add</b>. Done! 🎉</li></ol>`; openPanel("#modal"); }
}
$("#installBtn").onclick = doInstall; $("#installGo").onclick = doInstall;
$("#installX").onclick = () => { $("#installBanner").classList.remove("show"); local.set("installDismissed", Date.now()); };
if (ios && !standalone && !dismissed()) { $("#installText").textContent = "Tap Install to see how to add it to your iPhone."; setTimeout(() => $("#installBanner").classList.add("show"), 8000); $("#installBtn").classList.add("show"); }
addEventListener("appinstalled", () => { $("#installBtn").classList.remove("show"); $("#installBanner").classList.remove("show"); });

// ── Deep links (#track-AK-XXXXXX) & demo notice ──────────────
function route() { const h = location.hash.slice(1); if (h.startsWith("track-")) openTrack(h.slice(6).toUpperCase()); }
addEventListener("hashchange", route); route();
isLive().then((live) => { if (!live) console.info("[Arisa's] Demo mode: orders & bookings are stored in this browser. Add your Firebase config in js/config.js to go live."); });
