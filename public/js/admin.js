import { BUSINESS as B } from "./config.js";
import { MENU, MERCH, CATEGORIES } from "./menu.js";
import { isLive, onAuth, signIn, signOutAdmin, watchAll, updateRecord, watchSoldOut, setSoldOut, createOrder } from "./store.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => `${B.currency} ${Math.round(n || 0).toLocaleString("en-KE")}`;
const ago = (ms) => { const m = Math.round((Date.now() - ms) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(ms).toLocaleDateString("en-KE", { day: "numeric", month: "short" }); };
const tel = (p) => String(p || "").replace(/[^\d+]/g, "");
const wa = (p) => { let d = String(p || "").replace(/\D/g, ""); if (d.startsWith("0")) d = "254" + d.slice(1); return d; };
const isToday = (ms) => new Date(ms).toDateString() === new Date().toDateString();

function toast(html) {
  const t = document.createElement("div"); t.className = "toast"; t.innerHTML = html; $("#toasts").append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 3200);
}

// ── Auth ─────────────────────────────────────────────────────
const live = await isLive();
$("#modeTag").textContent = live ? "Connected to Firebase" : "DEMO mode · data stays in this browser";
if (!live) {
  $("#emailField").hidden = true; $("#lPassLbl").textContent = "Demo PIN";
  $("#lPass").inputMode = "numeric"; $("#lPass").autocomplete = "off";
  $("#loginHint").innerHTML = `Demo mode. Enter the PIN from <code>js/config.js</code> (default <b>1234</b>).`;
  $("#seed").hidden = false;
}
let started = false;
onAuth((u) => {
  if (u && !u.notAdmin) { $("#login").hidden = true; $("#dash").hidden = false; if (!started) { started = true; start(); } }
  else {
    $("#login").hidden = false; $("#dash").hidden = true;
    if (u && u.notAdmin) { $("#lErr").textContent = "This account isn't an admin yet. See README → step 5."; $("#lPass").closest(".field").classList.add("err"); }
  }
});
$("#loginForm").onsubmit = async (e) => {
  e.preventDefault(); const f = $("#lPass").closest(".field"); f.classList.remove("err");
  try { await signIn($("#lEmail").value.trim(), $("#lPass").value); if (!live) location.reload(); }
  catch (err) { $("#lErr").textContent = live ? "Wrong email or password" : err.message; f.classList.remove("err"); void f.offsetWidth; f.classList.add("err"); }
};
$("#logout").onclick = async () => { await signOutAdmin(); location.reload(); };

// ── Views ────────────────────────────────────────────────────
const TITLES = { orders: "Orders", bookings: "Bookings", menu: "Menu stock" };
$$("[data-view]").forEach((b) => b.onclick = () => {
  const v = b.dataset.view;
  $$("[data-view]").forEach((x) => x.classList.toggle("on", x.dataset.view === v));
  $$(".view").forEach((x) => x.classList.toggle("on", x.dataset.v === v));
  $("#viewTitle").textContent = TITLES[v];
});

// ── Sound + notifications ────────────────────────────────────
let actx;
function ding() {
  if (!$("#soundOn").checked) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; o.type = "sine"; g.gain.setValueAtTime(.0001, actx.currentTime + i * .18); g.gain.exponentialRampToValueAtTime(.3, actx.currentTime + i * .18 + .02); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + i * .18 + .35); o.connect(g).connect(actx.destination); o.start(actx.currentTime + i * .18); o.stop(actx.currentTime + i * .18 + .4); });
  } catch {}
}
document.addEventListener("click", () => { try { actx ||= new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch {} if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {}); }, { once: true });
function notify(title, body) { try { if ("Notification" in window && Notification.permission === "granted" && document.hidden) new Notification(title, { body, icon: "icons/icon-192.png" }); } catch {} }

// ── Orders ───────────────────────────────────────────────────
const O_FLOW_DELIVERY = { new: ["preparing", "👩‍🍳 Start preparing"], preparing: ["on_the_way", "🛵 Out for delivery"], on_the_way: ["delivered", "✅ Mark delivered"] };
const O_FLOW_PICKUP = { new: ["preparing", "👩‍🍳 Start preparing"], preparing: ["ready", "🛍️ Ready for pickup"], ready: ["delivered", "✅ Mark collected"] };
const O_LABEL = { new: "New", preparing: "Preparing", on_the_way: "On the way", ready: "Ready", delivered: "Done", cancelled: "Cancelled" };
const O_FILTERS = [["active", "Active"], ["new", "New"], ["preparing", "Preparing"], ["out", "Out / Ready"], ["delivered", "Done"], ["cancelled", "Cancelled"], ["all", "All"]];
let orders = [], oFilter = "active", oQ = "", seen = null;
const PAY = { mpesa_delivery: "M-Pesa on arrival", mpesa_till: `M-Pesa Till ${B.mpesaTill}`, cash: "Cash" };

function matchO(o, f = oFilter, q = oQ) {
  const ok = f === "all" || (f === "active" && ["new", "preparing", "on_the_way", "ready"].includes(o.status)) || (f === "out" && ["on_the_way", "ready"].includes(o.status)) || o.status === f;
  const s = `${o.id} ${o.customer?.name} ${o.customer?.phone}`.toLowerCase();
  return ok && (!q || s.includes(q));
}
function renderOrders(freshIds = []) {
  const cnt = (f) => orders.filter((o) => matchO(o, f, "")).length;
  $("#oFilters").innerHTML = O_FILTERS.map(([k, l]) => `<button class="chip ${oFilter === k ? "on" : ""}" data-of="${k}">${l}<span class="n">${cnt(k)}</span></button>`).join("");
  const list = orders.filter((o) => matchO(o));
  $("#oList").innerHTML = list.length ? list.map((o) => {
    const flow = (o.mode === "pickup" ? O_FLOW_PICKUP : O_FLOW_DELIVERY)[o.status];
    const done = ["delivered", "cancelled"].includes(o.status);
    return `<article class="oc ${freshIds.includes(o.id) ? "fresh" : ""}">
      <div class="oc-h"><div><b>${esc(o.id)}</b><small>${ago(o.createdAtMs)} · ${o.mode === "pickup" ? "🏃 Pickup" : "🛵 Delivery"}${o.when && o.when !== "asap" ? ` · ⏰ ${esc(o.when)}` : ""}</small></div><span class="st ${o.status}">${O_LABEL[o.status] || o.status}</span></div>
      <div class="oc-b">
        <ul class="oc-items">${(o.items || []).map((i) => `<li><span><b>${i.qty}×</b> ${esc(i.name)}${i.opts ? `<small>${esc(i.opts)}</small>` : ""}</span><span>${money(i.unit * i.qty)}</span></li>`).join("")}</ul>
        <div class="total-row"><span>Total${o.deliveryFee ? ` (incl. ${money(o.deliveryFee)} delivery)` : ""}</span><span>${money(o.total)}</span></div>
        <div class="oc-meta">
          <span>👤 <b>${esc(o.customer?.name)}</b> · <a href="tel:${tel(o.customer?.phone)}">${esc(o.customer?.phone)}</a> · <a href="https://wa.me/${wa(o.customer?.phone)}?text=${encodeURIComponent(`Hi ${o.customer?.name}, this is Arisa's Kitchen about order ${o.id} 🍗`)}" target="_blank" rel="noopener">WhatsApp</a></span>
          ${o.customer?.address ? `<span>📍 ${esc(o.customer.address)}</span>` : ""}
          <span>💳 ${PAY[o.payment] || esc(o.payment)}${o.mpesaCode ? ` · code <b>${esc(o.mpesaCode)}</b>` : ""}</span>
          ${o.notes ? `<span>📝 ${esc(o.notes)}</span>` : ""}
          ${o.eta ? `<span>⏱️ ETA: ${esc(o.eta)}</span>` : ""}
        </div>
      </div>
      ${done ? "" : `<div class="oc-f">
        ${flow ? `<button class="btn btn-sm btn-red" data-o="${o.id}" data-s="${flow[0]}">${flow[1]}</button>` : ""}
        <button class="btn btn-sm btn-ghost" data-o="${o.id}" data-s="cancelled">Cancel</button>
        <form class="eta" data-eta="${o.id}"><input placeholder="ETA for customer e.g. 7:40 pm" value="${esc(o.eta || "")}" aria-label="ETA"><button class="btn btn-sm btn-sun">Set</button></form>
      </div>`}
    </article>`;
  }).join("") : `<div class="empty-state"><span class="e">🍳</span>No orders here yet. New orders appear instantly.</div>`;
  const n = orders.filter((o) => o.status === "new").length;
  $("#nOrders").textContent = n || ""; document.title = (n ? `(${n}) ` : "") + "Arisa's Kitchen — Admin";
  renderStats();
}
$("#oFilters").onclick = (e) => { const b = e.target.closest("[data-of]"); if (b) { oFilter = b.dataset.of; renderOrders(); } };
$("#oSearch").oninput = (e) => { oQ = e.target.value.trim().toLowerCase(); renderOrders(); };
$("#oList").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-o]"); if (!b) return;
  if (b.dataset.s === "cancelled" && !b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "Tap again to cancel"; setTimeout(() => { b.dataset.sure = ""; b.textContent = "Cancel"; }, 2500); return; }
  b.disabled = true;
  try { await updateRecord("orders", b.dataset.o, { status: b.dataset.s }); toast(`✅ ${esc(b.dataset.o)} → <b>${O_LABEL[b.dataset.s]}</b>`); }
  catch (err) { console.error(err); toast("Couldn't update. Check your connection."); b.disabled = false; }
});
$("#oList").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.target.closest("[data-eta]");
  await updateRecord("orders", f.dataset.eta, { eta: f.querySelector("input").value.trim() }); toast("⏱️ ETA sent to customer");
});

// ── Bookings ─────────────────────────────────────────────────
const B_LABEL = { pending: "Pending", confirmed: "Confirmed", declined: "Declined", completed: "Completed" };
const B_FILTERS = [["upcoming", "Upcoming"], ["pending", "Pending"], ["confirmed", "Confirmed"], ["past", "Past"], ["all", "All"]];
let bookings = [], bFilter = "upcoming", bQ = "";
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
function matchB(b, f = bFilter) {
  const t = todayISO();
  const ok = f === "all" || (f === "upcoming" && b.date >= t && !["declined"].includes(b.status)) || (f === "past" && b.date < t) || b.status === f;
  return ok && (!bQ || `${b.id} ${b.customer?.name} ${b.customer?.phone}`.toLowerCase().includes(bQ));
}
function renderBookings() {
  $("#bFilters").innerHTML = B_FILTERS.map(([k, l]) => `<button class="chip ${bFilter === k ? "on" : ""}" data-bf="${k}">${l}<span class="n">${bookings.filter((b) => matchB(b, k)).length}</span></button>`).join("");
  const list = bookings.filter((b) => matchB(b)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) * (bFilter === "past" ? -1 : 1));
  let lastDate = "";
  $("#bList").innerHTML = list.length ? list.map((b) => {
    const head = b.date !== lastDate ? `<div class="bday">${new Date(b.date + "T00:00").toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "short" })}</div>` : ""; lastDate = b.date;
    return `${head}<article class="oc" style="margin-bottom:12px">
      <div class="oc-h"><div><b>${esc(b.time)} · ${esc(b.label)}</b><small>${esc(b.id)} · booked ${ago(b.createdAtMs)}</small></div><span class="st ${b.status}">${B_LABEL[b.status] || b.status}</span></div>
      <div class="oc-b"><div class="oc-meta">
        <span>👥 <b>${b.guests} guests</b>${b.package ? ` · ${esc(b.package)} package` : ""}${b.occasion ? ` · ${esc(b.occasion)}` : ""}${b.estimate ? ` · est. ${money(b.estimate)}` : ""}</span>
        <span>👤 <b>${esc(b.customer?.name)}</b> · <a href="tel:${tel(b.customer?.phone)}">${esc(b.customer?.phone)}</a> · <a href="https://wa.me/${wa(b.customer?.phone)}?text=${encodeURIComponent(`Hi ${b.customer?.name}, Arisa's Kitchen here about booking ${b.id} 📅`)}" target="_blank" rel="noopener">WhatsApp</a>${b.customer?.email ? ` · ${esc(b.customer.email)}` : ""}</span>
        ${b.venue ? `<span>📍 ${esc(b.venue)}</span>` : ""}${b.notes ? `<span>📝 ${esc(b.notes)}</span>` : ""}
      </div></div>
      <div class="oc-f">${b.status === "pending" ? `<button class="btn btn-sm btn-red" data-b="${b.id}" data-s="confirmed">✅ Confirm</button><button class="btn btn-sm btn-ghost" data-b="${b.id}" data-s="declined">Decline</button>` : b.status === "confirmed" ? `<button class="btn btn-sm" data-b="${b.id}" data-s="completed">Mark completed</button><button class="btn btn-sm btn-ghost" data-b="${b.id}" data-s="declined">Cancel</button>` : ""}</div>
    </article>`;
  }).join("") : `<div class="empty-state"><span class="e">📅</span>No bookings in this view.</div>`;
  const n = bookings.filter((b) => b.status === "pending").length; $("#nBookings").textContent = n || "";
  renderStats();
}
$("#bFilters").onclick = (e) => { const b = e.target.closest("[data-bf]"); if (b) { bFilter = b.dataset.bf; renderBookings(); } };
$("#bSearch").oninput = (e) => { bQ = e.target.value.trim().toLowerCase(); renderBookings(); };
$("#bList").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-b]"); if (!b) return; b.disabled = true;
  try { await updateRecord("bookings", b.dataset.b, { status: b.dataset.s }); toast(`📅 ${esc(b.dataset.b)} → <b>${B_LABEL[b.dataset.s]}</b>`); }
  catch (err) { console.error(err); toast("Couldn't update."); b.disabled = false; }
});

// ── Stats ────────────────────────────────────────────────────
function renderStats() {
  const today = orders.filter((o) => isToday(o.createdAtMs) && o.status !== "cancelled");
  const active = orders.filter((o) => ["new", "preparing", "on_the_way", "ready"].includes(o.status)).length;
  const pend = bookings.filter((b) => b.status === "pending").length;
  const todayB = bookings.filter((b) => b.date === todayISO() && b.status !== "declined").length;
  $("#stats").innerHTML = `<div class="stat hl"><small>Active orders</small><b>${active}</b></div>
    <div class="stat"><small>Orders today</small><b>${today.length}</b></div>
    <div class="stat"><small>Revenue today</small><b>${money(today.reduce((a, o) => a + (o.total || 0), 0))}</b></div>
    <div class="stat"><small>Bookings today / pending</small><b>${todayB} / ${pend}</b></div>`;
}

// ── Menu stock ───────────────────────────────────────────────
let soldOut = [];
function renderStock() {
  const all = [...MENU, ...MERCH];
  $("#stock").innerHTML = all.map((m) => { const on = !soldOut.includes(m.id); return `<label class="${on ? "" : "off"}"><img src="${m.img}" alt=""><span class="t">${esc(m.name)}<small>${CATEGORIES.find((c) => c.id === m.cat)?.label || ""} · ${money(m.price)}</small></span><input type="checkbox" data-stock="${m.id}" ${on ? "checked" : ""}><span class="sw"></span></label>`; }).join("");
}
$("#stock").addEventListener("change", async (e) => {
  const id = e.target.dataset.stock; if (!id) return;
  const next = e.target.checked ? soldOut.filter((x) => x !== id) : [...new Set([...soldOut, id])];
  try { await setSoldOut(next); toast(e.target.checked ? "✅ Back on the menu" : "🚫 Marked sold out"); } catch { toast("Couldn't save"); e.target.checked = !e.target.checked; }
});

// ── Start live listeners ─────────────────────────────────────
function start() {
  const err = (e) => { console.error(e); toast("⚠️ No permission to read data. Is this account in the admins collection?"); };
  watchAll("orders", (list) => {
    const ids = new Set(list.map((o) => o.id));
    const fresh = seen ? list.filter((o) => !seen.has(o.id) && o.status === "new").map((o) => o.id) : [];
    seen = ids; orders = list; renderOrders(fresh);
    if (fresh.length) { ding(); toast(`🔔 <b>New order</b> ${esc(fresh[0])}`); notify("New order 🔔", `${fresh[0]} · ${money(list.find((o) => o.id === fresh[0])?.total)}`); }
  }, err);
  let seenB = null;
  watchAll("bookings", (list) => {
    const fresh = seenB ? list.filter((b) => !seenB.has(b.id)) : [];
    seenB = new Set(list.map((b) => b.id)); bookings = list; renderBookings();
    if (fresh.length) { ding(); toast(`📅 <b>New booking</b> ${esc(fresh[0].label)}`); notify("New booking 📅", `${fresh[0].label} · ${fresh[0].date} ${fresh[0].time}`); }
  }, err);
  watchSoldOut((ids) => { soldOut = ids; renderStock(); });
  setInterval(() => { renderOrders(); }, 60000);
}

// Demo: create a sample order
$("#seed").onclick = async () => {
  const pick = MENU.slice().sort(() => Math.random() - .5).slice(0, 2 + Math.floor(Math.random() * 2));
  const items = pick.map((m) => ({ id: m.id, name: m.name, qty: 1 + Math.floor(Math.random() * 2), unit: m.price, opts: "" }));
  const sub = items.reduce((a, i) => a + i.qty * i.unit, 0); const mode = Math.random() > .4 ? "delivery" : "pickup";
  const fee = mode === "delivery" && sub < B.freeDeliveryOver ? B.deliveryFee : 0;
  const names = ["Wanjiru K.", "Brian O.", "Achieng M.", "Kevin N.", "Faith W."];
  await createOrder({ items, customer: { name: names[Math.floor(Math.random() * 5)], phone: "0712 000 111", address: mode === "delivery" ? "Kilimani, Argwings Kodhek Rd, Apt 4B" : "" }, mode, when: "asap", notes: "", payment: "mpesa_delivery", mpesaCode: "", subtotal: sub, deliveryFee: fee, total: sub + fee });
};
