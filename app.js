/* ============ Maa Kali Enterprises — Storefront logic ============ */
"use strict";

/* ---------- Built-in fallback data (used if server is unreachable) ---------- */
const DEFAULT_DATA = {
  settings: {
    siteName: "Maa Kali Enterprises",
    tagline: "Premium Workspace Essentials",
    announcement: "✦ &nbsp;Launch offer — flat <strong>10% off</strong> sitewide with code <strong>WELCOME10</strong> &nbsp;·&nbsp; Free shipping on orders over ₹4,999&nbsp; ✦",
    promoCode: "WELCOME10", promoPct: 10, freeShipThreshold: 4999, shipFlat: 199,
    contactAddress: "24 Park Street, Camac Street Area<br>Kolkata 700016, India",
    contactPhone: "+91 33 4080 2400<br>Mon–Sat, 10am–7pm IST",
    contactEmail: "hello@maakalienterprises.in<br>sales@maakalienterprises.in (bulk orders)",
    footerNote: "Premium workspace essentials for modern Indian businesses. Designed for comfort, built to last."
  },
  products: [
    { id:"chair", name:"Aurora Ergonomic Chair", cat:"Furniture", price:24999, mrp:29999,
      rating:4.8, reviews:412, badge:"Bestseller", badgeClass:"hot", img:"images/chair.jpg",
      desc:"Breathable mesh back, adjustable lumbar support and a synchro-tilt mechanism — built for 10-hour workdays.",
      specs:["Ergonomic mesh back with lumbar support","4D adjustable armrests","Class-4 gas lift · 150 kg capacity","2-year on-site warranty"] },
    { id:"desk", name:"Signature Standing Desk", cat:"Furniture", price:34999, mrp:null,
      rating:4.9, reviews:268, badge:"New", badgeClass:"new", img:"images/desk.jpg",
      desc:"Solid oak top with whisper-quiet dual-motor lift. Four memory presets take you from sitting to standing in seconds.",
      specs:["Solid oak top · 140 × 70 cm","Dual-motor lift · 70–120 cm","4 memory presets + anti-collision","Free installation in 4 metros"] },
    { id:"lamp", name:"Halo Desk Lamp", cat:"Lighting", price:4499, mrp:5499,
      rating:4.7, reviews:531, badge:"Sale", badgeClass:"sale", img:"images/lamp.jpg",
      desc:"Brass-accented task lamp with warm-to-cool dimming and a weighted base that stays put on any desk.",
      specs:["2700K–6000K adjustable temperature","Stepless touch dimming","USB-C powered · 8 hr battery","360° flexible gooseneck"] },
    { id:"bag", name:"Voyager Leather Briefcase", cat:"Accessories", price:8999, mrp:null,
      rating:4.8, reviews:194, badge:null, badgeClass:"", img:"images/bag.jpg",
      desc:"Full-grain leather briefcase that fits a 16-inch laptop, documents and daily essentials. Ages beautifully.",
      specs:["Full-grain Crazy Horse leather","Padded 16\" laptop sleeve","Solid brass fittings","Water-resistant finish"] },
    { id:"headphones", name:"Echo Wireless Headphones", cat:"Tech", price:12999, mrp:15999,
      rating:4.6, reviews:623, badge:"Sale", badgeClass:"sale", img:"images/headphones.jpg",
      desc:"Flagship noise-cancelling headphones with 40-hour battery and crystal-clear mics for back-to-back calls.",
      specs:["Hybrid active noise cancellation","40-hr battery · fast charge","Dual-device multipoint","1-year warranty"] },
    { id:"mugs", name:"Kiln Stoneware Mug Set (4)", cat:"Accessories", price:1999, mrp:null,
      rating:4.9, reviews:847, badge:"Bestseller", badgeClass:"hot", img:"images/mugs.jpg",
      desc:"Four hand-glazed 350 ml stoneware mugs. Dishwasher, microwave and Monday-morning safe.",
      specs:["Set of 4 · 350 ml each","Hand-glazed speckled stoneware","Dishwasher & microwave safe","Gift-ready packaging"] },
    { id:"organizer", name:"Walnut Desk Organizer", cat:"Accessories", price:2999, mrp:3799,
      rating:4.7, reviews:356, badge:"Sale", badgeClass:"sale", img:"images/organizer.jpg",
      desc:"American black walnut organizer with slots for pens, phone, notebooks and everything that clutters genius.",
      specs:["Solid American black walnut","Fits A5 notebooks + phone dock","Felt-lined compartments","Hand-finished with natural oil"] },
    { id:"stand", name:"Arc Laptop Stand", cat:"Tech", price:3499, mrp:null,
      rating:4.8, reviews:489, badge:null, badgeClass:"", img:"images/stand.jpg",
      desc:"CNC-milled aluminium stand that raises any laptop to eye level. Folds flat for the commute.",
      specs:["CNC-milled aluminium","6 angle adjustments","Fits 11\"–17\" laptops","Folds flat · 480 g"] },
  ]
};

/* ---------- Live data (loaded from server, falls back to DEFAULT_DATA) ---------- */
let SETTINGS = DEFAULT_DATA.settings;
let PRODUCTS = DEFAULT_DATA.products;

async function loadData(){
  try {
    const r = await fetch("api/data", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    if (d && d.settings && Array.isArray(d.products) && d.products.length){
      SETTINGS = Object.assign({}, DEFAULT_DATA.settings, d.settings);
      PRODUCTS = d.products;
    }
  } catch(e){ /* offline / file preview — keep defaults */ }
}

/* ---------- State ---------- */
const filters = { cat:"all", search:"", sort:"featured" };
let promoApplied = false;
let cart = {};
try { cart = JSON.parse(localStorage.getItem("maakali_cart") || "{}"); } catch(e){ cart = {}; }

/* ---------- Helpers ---------- */
const $ = (id) => document.getElementById(id);
const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const byId = (id) => PRODUCTS.find(p => p.id === id);
const cartCount = () => Object.values(cart).reduce((a,b) => a+b, 0);
const saveCart = () => localStorage.setItem("maakali_cart", JSON.stringify(cart));
const num = (v, d) => { const n = Number(v); return isNaN(n) ? d : n; };
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
const IMG_FALLBACK = "onerror=\"this.onerror=null;this.src='images/placeholder.jpg'\"";

function toast(msg, type){
  const t = document.createElement("div");
  t.className = "toast" + (type ? " " + type : "");
  t.textContent = msg;
  $("toasts").appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = ".3s"; setTimeout(() => t.remove(), 320); }, 2600);
}

function starsHTML(r){
  const full = Math.max(0, Math.min(5, Math.round(Number(r) || 0)));
  return `<span class="stars">${"★".repeat(full)}${"☆".repeat(5-full)}</span>`;
}

/* ---------- Settings → page ---------- */
function applySettings(){
  const s = SETTINGS;
  document.title = s.siteName + " — " + s.tagline;
  const words = String(s.siteName || "").trim().split(/\s+/);
  const logoHTML = words.length > 1
    ? esc(words[0]) + ' <span>' + esc(words.slice(1).join(" ")) + '</span>'
    : esc(s.siteName);
  document.querySelectorAll(".logo-text").forEach(el => { el.innerHTML = logoHTML; });
  /* ----- Announcement bar ----- */
  const ann = $("announceText");
  if (ann) {
    ann.innerHTML = s.announcement;
    const bar = ann.closest(".announce");
    if (bar) bar.style.display = (s.announceEnabled === false) ? "none" : "";
  }
  /* ----- Contact / footer ----- */
  const setHTML = (id, v) => { const el = $(id); if (el) el.innerHTML = v; };
  setHTML("infoAddr", s.contactAddress);
  setHTML("infoPhone", s.contactPhone);
  setHTML("infoEmail", s.contactEmail);
  setHTML("infoHours", s.contactHours || "");
  setHTML("footAbout", s.footerNote);
  const fn = $("footName"); if (fn) fn.textContent = s.siteName;
  /* ----- Social links ----- */
  const setHref = (sel, v) => { const el = document.querySelector(sel); if (el && v) el.href = v; };
  setHref('a.social-tw', s.socialTwitter); setHref('a.social-fb', s.socialFacebook);
  setHref('a.social-ig', s.socialInstagram); setHref('a.social-li', s.socialLinkedin);
  /* ----- Promo ----- */
  $("promoInput").placeholder = "Promo code (try " + s.promoCode + ")";
  const dl = document.querySelector("#discountRow span");
  if (dl) dl.textContent = "Discount (" + s.promoCode + ")";
  /* ----- Hero banner text ----- */
  const hk = $("heroKicker"), ht = $("heroTitle"), hs = $("heroSub");
  if (hk && s.heroKicker) hk.textContent = s.heroKicker;
  if (ht && s.heroTitle) ht.innerHTML = s.heroTitle;
  if (hs && s.heroSub) hs.textContent = s.heroSub;
  /* ----- Theme (colours + font) ----- */
  applyTheme(s.theme || {});
}

/* ---------- Theme ---------- */
function applyTheme(t){
  const r = document.documentElement.style;
  const set = (k, v) => { if (v) r.setProperty(k, v); };
  set("--navy", t.primary);        // main brand colour (nav, buttons, headings accent)
  set("--gold", t.accent);         // accent (badges, star ratings, highlights)
  set("--ink", t.body);            // body text
  set("--bg", t.bg);               // page background
  set("--bg-soft", t.bg);
  set("--muted", t.bodyTextSoft);
  const m = $("themeMeta"); if (m && t.primary) m.setAttribute("content", t.primary);
  /* banner + hero gradient + fonts */
  let extra = "";
  if (t.bannerStart || t.bannerEnd)
    extra += `.hero{background:linear-gradient(180deg,${t.bannerStart||"#eef2f7"} 0%,${t.bannerEnd||"#ffffff"} 100%) !important;}`;
  if (t.announceBg)
    extra += `.announce{background:${t.announceBg} !important;}`;
  if (t.headingFont) extra += `h1,h2,.logo-text,.logo-mark,.qv-info h3,.checkout-card h3,.review-card blockquote{font-family:${t.headingFont} !important;}`;
  if (t.bodyFont) extra += `body{font-family:${t.bodyFont} !important;}`;
  let tag = $("themeOverrides");
  if (!tag){ tag = document.createElement("style"); tag.id = "themeOverrides"; document.head.appendChild(tag); }
  tag.textContent = extra;
}

/* ---------- Product grid ---------- */
function filteredProducts(){
  let list = PRODUCTS.filter(p =>
    (filters.cat === "all" || p.cat === filters.cat) &&
    ((p.name || "") + " " + (p.cat || "") + " " + (p.desc || "")).toLowerCase().includes(filters.search.toLowerCase())
  );
  if (filters.sort === "price-asc") list = [...list].sort((a,b) => a.price - b.price);
  if (filters.sort === "price-desc") list = [...list].sort((a,b) => b.price - a.price);
  if (filters.sort === "rating") list = [...list].sort((a,b) => (b.rating||0) - (a.rating||0));
  return list;
}

function renderProducts(){
  const list = filteredProducts();
  const grid = $("productGrid");
  grid.innerHTML = "";
  $("emptyState").hidden = list.length > 0;
  $("resultCount").textContent = list.length ? `Showing ${list.length} of ${PRODUCTS.length} products` : "";
  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="pc-media">
        <img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" ${IMG_FALLBACK}>
        ${p.badge ? `<span class="pc-badge ${esc(p.badgeClass || "")}">${esc(p.badge)}</span>` : ""}
      </div>
      <div class="pc-body">
        <span class="pc-cat">${esc(p.cat)}</span>
        <h3 class="pc-name">${esc(p.name)}</h3>
        <div class="pc-rating">${starsHTML(p.rating)} ${esc(p.rating)} (${esc(p.reviews)})</div>
        <div class="pc-price"><strong>${fmt(p.price)}</strong>${p.mrp ? `<s>${fmt(p.mrp)}</s>` : ""}</div>
        <div class="pc-actions">
          <button type="button" class="btn btn-outline" data-qv="${esc(p.id)}">Quick View</button>
          <button type="button" class="btn btn-primary" data-add="${esc(p.id)}">Add to Cart</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function setCategory(cat){
  filters.cat = cat;
  document.querySelectorAll("#catPills .pill-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.cat === cat));
  renderProducts();
}

/* ---------- Layers (drawer / modals) ---------- */
function openLayer(el){
  $("overlay").hidden = false;
  el.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeAll(){
  $("overlay").hidden = true;
  $("cartDrawer").hidden = true;
  $("quickModal").hidden = true;
  $("checkoutModal").hidden = true;
  document.body.style.overflow = "";
}

/* ---------- Cart ---------- */
function addToCart(id, qty){
  if (!byId(id)) return;
  cart[id] = (cart[id] || 0) + qty;
  saveCart(); renderCart();
  toast(`${byId(id).name} added to cart`, "success");
}
function cleanCart(){
  let changed = false;
  Object.keys(cart).forEach(id => { if (!byId(id)){ delete cart[id]; changed = true; } });
  if (changed) saveCart();
}
function totals(){
  const threshold = num(SETTINGS.freeShipThreshold, 4999);
  const flat = num(SETTINGS.shipFlat, 199);
  const pct = num(SETTINGS.promoPct, 0);
  const subtotal = Object.entries(cart).reduce((s,[id,q]) => {
    const p = byId(id); return p ? s + num(p.price, 0) * q : s;
  }, 0);
  const discount = promoApplied ? Math.round(subtotal * pct / 100) : 0;
  const shipping = subtotal === 0 ? 0 : (subtotal - discount >= threshold ? 0 : flat);
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
function renderCart(){
  cleanCart();
  const n = cartCount();
  $("cartCount").textContent = n;
  $("drawerCount").textContent = `(${n})`;
  const box = $("cartItems");
  box.innerHTML = "";
  const entries = Object.entries(cart);
  if (!entries.length){
    box.innerHTML = `<div class="cart-empty"><h3>Your cart is empty</h3><p>Beautiful workspaces start with a single click.</p></div>`;
  }
  entries.forEach(([id, qty]) => {
    const p = byId(id);
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${esc(p.img)}" alt="${esc(p.name)}" ${IMG_FALLBACK}>
      <div>
        <div class="ci-name">${esc(p.name)}</div>
        <div class="ci-price">${fmt(p.price)} each</div>
        <div class="ci-row">
          <div class="ci-qty">
            <button type="button" data-dec="${esc(id)}" aria-label="Decrease">−</button>
            <span>${qty}</span>
            <button type="button" data-inc="${esc(id)}" aria-label="Increase">+</button>
          </div>
          <button type="button" class="ci-remove" data-rem="${esc(id)}">Remove</button>
        </div>
      </div>
      <div class="ci-total">${fmt(num(p.price,0) * qty)}</div>`;
    box.appendChild(row);
  });
  const t = totals();
  const threshold = num(SETTINGS.freeShipThreshold, 4999);
  $("cartSubtotal").textContent = fmt(t.subtotal);
  $("discountRow").hidden = !promoApplied || t.discount === 0;
  $("cartDiscount").textContent = "−" + fmt(t.discount);
  $("cartShipping").textContent = t.subtotal === 0 ? "—" : (t.shipping === 0 ? "FREE" : fmt(t.shipping));
  $("cartTotal").textContent = fmt(t.total);
  $("shipNote").textContent = t.subtotal === 0 ? "" :
    (t.shipping === 0 ? "🎉 You've unlocked FREE shipping!" :
    `Add ${fmt(threshold - (t.subtotal - t.discount))} more for free shipping`);
  $("checkoutBtn").disabled = entries.length === 0;
  $("checkoutBtn").style.opacity = entries.length === 0 ? ".5" : "1";
}

/* ---------- Quick view ---------- */
let qvId = null, qvQty = 1;
function openQuick(id){
  const p = byId(id);
  if (!p) return;
  qvId = id; qvQty = 1;
  $("qvImg").onerror = function(){ this.onerror = null; this.src = "images/placeholder.jpg"; };
  $("qvImg").src = p.img; $("qvImg").alt = p.name;
  $("qvCat").textContent = p.cat;
  $("qvName").textContent = p.name;
  $("qvRating").innerHTML = `${starsHTML(p.rating)} ${esc(p.rating)} · ${esc(p.reviews)} verified reviews`;
  $("qvPrice").textContent = fmt(p.price);
  $("qvMrp").textContent = p.mrp ? fmt(p.mrp) : "";
  $("qvSave").textContent = p.mrp ? `Save ${fmt(p.mrp - p.price)}` : "";
  $("qvSave").style.display = p.mrp ? "" : "none";
  $("qvDesc").textContent = p.desc || "";
  $("qvSpecs").innerHTML = (p.specs || []).map(s => `<li>${esc(s)}</li>`).join("");
  $("qvQty").textContent = "1";
  openLayer($("quickModal"));
}

/* ---------- Checkout ---------- */
let step = 1;
function openCheckout(){
  cleanCart();
  if (!cartCount()){ toast("Your cart is empty", "error"); return; }
  closeAll();
  $("checkoutMain").hidden = false;
  $("orderSuccess").hidden = true;
  renderSummary();
  goStep(1);
  openLayer($("checkoutModal"));
}
function goStep(n){
  step = n;
  [1,2,3].forEach(i => {
    $("cstep"+i).hidden = i !== n;
    const li = document.querySelector(`#stepsBar li[data-step="${i}"]`);
    li.classList.toggle("active", i === n);
    li.classList.toggle("done", i < n);
  });
}
function renderSummary(){
  const box = $("summaryItems");
  box.innerHTML = "";
  Object.entries(cart).forEach(([id, qty]) => {
    const p = byId(id); if (!p) return;
    const d = document.createElement("div");
    d.className = "sum-item";
    d.innerHTML = `<img src="${esc(p.img)}" alt="" ${IMG_FALLBACK}><div><strong>${esc(p.name)}</strong><span>Qty ${qty} × ${fmt(p.price)}</span></div><strong>${fmt(num(p.price,0)*qty)}</strong>`;
    box.appendChild(d);
  });
  const t = totals();
  $("sumSubtotal").textContent = fmt(t.subtotal);
  $("sumDiscountRow").hidden = !promoApplied;
  $("sumDiscount").textContent = "−" + fmt(t.discount);
  $("sumShipping").textContent = t.shipping === 0 ? "FREE" : fmt(t.shipping);
  $("sumTotal").textContent = fmt(t.total);
}
function markInvalid(el, bad){ el.classList.toggle("invalid", bad); return !bad; }
function validStep1(){
  let ok = true;
  ok = markInvalid($("oName"), $("oName").value.trim().length < 2) && ok;
  ok = markInvalid($("oPhone"), !/^[6-9]\d{9}$/.test($("oPhone").value.replace(/\s/g,""))) && ok;
  ok = markInvalid($("oEmail"), !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("oEmail").value.trim())) && ok;
  ok = markInvalid($("oAddr"), $("oAddr").value.trim().length < 6) && ok;
  ok = markInvalid($("oCity"), $("oCity").value.trim().length < 2) && ok;
  ok = markInvalid($("oPin"), !/^\d{6}$/.test($("oPin").value.trim())) && ok;
  if (!ok) toast("Please fix the highlighted fields", "error");
  return ok;
}
function payMethod(){ return document.querySelector('input[name="pay"]:checked').value; }
function validStep2(){
  const m = payMethod();
  if (m === "UPI"){
    const ok = markInvalid($("upiId"), !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test($("upiId").value.trim()));
    if (!ok) toast("Enter a valid UPI ID (e.g. name@upi)", "error");
    return ok;
  }
  if (m === "Card"){
    let ok = true;
    ok = markInvalid($("cardNum"), $("cardNum").value.replace(/\s/g,"").length < 15) && ok;
    ok = markInvalid($("cardExp"), !/^(0[1-9]|1[0-2])\/\d{2}$/.test($("cardExp").value.trim())) && ok;
    ok = markInvalid($("cardCvv"), !/^\d{3,4}$/.test($("cardCvv").value.trim())) && ok;
    if (!ok) toast("Please check your card details", "error");
    return ok;
  }
  return true;
}
function payLabel(){
  const m = payMethod();
  if (m === "UPI") return `UPI (${$("upiId").value.trim()})`;
  if (m === "Card") return `Card ending ${$("cardNum").value.replace(/\s/g,"").slice(-4)}`;
  return "Cash on Delivery";
}
function renderReview(){
  const t = totals();
  $("reviewBox").innerHTML = `
    <div><strong>Ship to:</strong><br>${esc($("oName").value)}, ${esc($("oAddr").value)}, ${esc($("oCity").value)} ${esc($("oPin").value)}<br>${esc($("oPhone").value)} · ${esc($("oEmail").value)}</div>
    <div><strong>Payment:</strong> ${esc(payLabel())}</div>
    <div><strong>Items:</strong> ${cartCount()} &nbsp;·&nbsp; <strong>Total: ${fmt(t.total)}</strong>${t.shipping===0 ? " (incl. FREE shipping)" : ""}</div>`;
}
async function placeOrder(){
  const btn = $("placeOrderBtn");
  btn.disabled = true; btn.textContent = "Placing order…";
  const t = totals();
  const payload = {
    customer: {
      name: $("oName").value.trim(), phone: $("oPhone").value.trim(),
      email: $("oEmail").value.trim(), address: $("oAddr").value.trim(),
      city: $("oCity").value.trim(), pin: $("oPin").value.trim(),
    },
    items: Object.entries(cart).map(([id, qty]) => {
      const p = byId(id);
      return { id, name: p ? p.name : id, qty, price: p ? num(p.price, 0) : 0 };
    }),
    payment: { method: payMethod(), label: payLabel() },
    subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, total: t.total,
  };
  let oid = "MKE-" + Date.now().toString(36).toUpperCase().slice(-6);
  try {
    const r = await fetch("api/order", { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.ok && d.id) oid = d.id;
  } catch(e){ /* demo mode — order stays local only */ }
  setTimeout(() => {
    const eta = new Date(Date.now() + 5*864e5).toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" });
    $("successName").textContent = $("oName").value.trim().split(" ")[0] || "friend";
    $("orderId").textContent = oid;
    $("successEmail").textContent = $("oEmail").value.trim();
    $("successEta").textContent = eta;
    $("checkoutMain").hidden = true;
    $("orderSuccess").hidden = false;
    cart = {}; promoApplied = false; $("promoInput").value = ""; $("promoMsg").textContent = "";
    saveCart(); renderCart();
    btn.disabled = false; btn.textContent = "Place Order";
  }, 900);
}

/* ---------- Events ---------- */
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add){ addToCart(add.dataset.add, 1); return; }
  const qv = e.target.closest("[data-qv]");
  if (qv){ openQuick(qv.dataset.qv); return; }
  const inc = e.target.closest("[data-inc]");
  if (inc){ cart[inc.dataset.inc]++; saveCart(); renderCart(); return; }
  const dec = e.target.closest("[data-dec]");
  if (dec){ const id = dec.dataset.dec; cart[id]--; if (cart[id] <= 0) delete cart[id]; saveCart(); renderCart(); return; }
  const rem = e.target.closest("[data-rem]");
  if (rem){ delete cart[rem.dataset.rem]; saveCart(); renderCart(); toast("Item removed"); return; }
  if (e.target.closest("[data-close]")) closeAll();
  const gotoCat = e.target.closest("[data-goto-cat]");
  if (gotoCat){
    setCategory(gotoCat.dataset.gotoCat);
    document.querySelector("#shop").scrollIntoView({ behavior:"smooth" });
  }
});

$("cartBtn").addEventListener("click", () => { renderCart(); openLayer($("cartDrawer")); });
$("closeCart").addEventListener("click", closeAll);
$("continueBtn").addEventListener("click", closeAll);
$("overlay").addEventListener("click", closeAll);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

$("catPills").addEventListener("click", (e) => {
  const b = e.target.closest(".pill-btn");
  if (b) setCategory(b.dataset.cat);
});
$("searchInput").addEventListener("input", (e) => { filters.search = e.target.value; renderProducts(); });
$("sortSelect").addEventListener("change", (e) => { filters.sort = e.target.value; renderProducts(); });
$("clearFilters").addEventListener("click", () => {
  filters.search = ""; $("searchInput").value = ""; $("sortSelect").value = "featured"; filters.sort = "featured";
  setCategory("all");
});

$("qvMinus").addEventListener("click", () => { if (qvQty > 1){ qvQty--; $("qvQty").textContent = qvQty; } });
$("qvPlus").addEventListener("click", () => { if (qvQty < 10){ qvQty++; $("qvQty").textContent = qvQty; } });
$("qvAdd").addEventListener("click", () => { addToCart(qvId, qvQty); closeAll(); });

$("promoBtn").addEventListener("click", () => {
  const code = $("promoInput").value.trim().toUpperCase();
  const msg = $("promoMsg");
  if (code && code === String(SETTINGS.promoCode || "").toUpperCase()){
    promoApplied = true; msg.textContent = "✓ " + SETTINGS.promoCode + " applied — " + num(SETTINGS.promoPct,0) + "% off!"; msg.className = "promo-msg ok";
  } else {
    promoApplied = false; msg.textContent = code ? "That code isn't valid." : "Enter a promo code."; msg.className = "promo-msg err";
  }
  renderCart();
});

$("checkoutBtn").addEventListener("click", openCheckout);
$("toStep2").addEventListener("click", () => { if (validStep1()) goStep(2); });
$("backTo1").addEventListener("click", () => goStep(1));
$("toStep3").addEventListener("click", () => { if (validStep2()){ renderReview(); goStep(3); } });
$("backTo2").addEventListener("click", () => goStep(2));
$("placeOrderBtn").addEventListener("click", placeOrder);

document.querySelectorAll('input[name="pay"]').forEach(r => r.addEventListener("change", () => {
  const m = payMethod();
  $("upiField").hidden = m !== "UPI";
  $("cardFields").hidden = m !== "Card";
  $("codNote").hidden = m !== "COD";
  $("secureNote").hidden = m === "COD";
}));
$("cardNum").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g,"").slice(0,16).replace(/(\d{4})(?=\d)/g, "$1 ");
});
$("cardExp").addEventListener("input", (e) => {
  let v = e.target.value.replace(/\D/g,"").slice(0,4);
  e.target.value = v.length > 2 ? v.slice(0,2) + "/" + v.slice(2) : v;
});

/* ---------- FAQ accordion ---------- */
document.querySelectorAll(".acc-item").forEach(item => {
  const head = item.querySelector(".acc-head");
  const body = item.querySelector(".acc-body");
  head.addEventListener("click", () => {
    const open = item.classList.contains("open");
    document.querySelectorAll(".acc-item.open").forEach(o => {
      o.classList.remove("open");
      o.querySelector(".acc-body").style.maxHeight = null;
    });
    if (!open){ item.classList.add("open"); body.style.maxHeight = body.scrollHeight + "px"; }
  });
});

/* ---------- Reviews slider ---------- */
const track = $("sliderTrack");
const slides = track.children.length;
let slideIdx = 0, slideTimer = null;
const dotsBox = $("sliderDots");
for (let i = 0; i < slides; i++){
  const d = document.createElement("button");
  d.type = "button"; d.className = "dot-btn" + (i === 0 ? " active" : "");
  d.setAttribute("aria-label", "Go to review " + (i+1));
  d.addEventListener("click", () => goSlide(i));
  dotsBox.appendChild(d);
}
function goSlide(i){
  slideIdx = (i + slides) % slides;
  track.style.transform = `translateX(-${slideIdx * 100}%)`;
  dotsBox.querySelectorAll(".dot-btn").forEach((d, j) => d.classList.toggle("active", j === slideIdx));
  restartAuto();
}
function restartAuto(){ clearInterval(slideTimer); slideTimer = setInterval(() => goSlide(slideIdx + 1), 6000); }
$("prevBtn").addEventListener("click", () => goSlide(slideIdx - 1));
$("nextBtn").addEventListener("click", () => goSlide(slideIdx + 1));
restartAuto();

/* ---------- Forms ---------- */
$("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  let ok = true;
  ok = markInvalid($("cName"), $("cName").value.trim().length < 2) && ok;
  ok = markInvalid($("cEmail"), !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("cEmail").value.trim())) && ok;
  ok = markInvalid($("cMsg"), $("cMsg").value.trim().length < 5) && ok;
  if (!ok){ toast("Please complete the highlighted fields", "error"); return; }
  toast("Message sent! We'll reply within one business day.", "success");
  e.target.reset();
});
$("newsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const em = $("newsEmail").value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){ toast("Please enter a valid email", "error"); return; }
  toast("Subscribed! Your ₹500 coupon is on its way.", "success");
  e.target.reset();
});

/* ---------- Header / nav / misc ---------- */
$("menuBtn").addEventListener("click", () => $("mobileMenu").classList.toggle("open"));
document.querySelectorAll(".m-link").forEach(a =>
  a.addEventListener("click", () => $("mobileMenu").classList.remove("open")));

window.addEventListener("scroll", () => {
  $("siteHeader").classList.toggle("scrolled", window.scrollY > 10);
  $("backTop").classList.toggle("show", window.scrollY > 600);
}, { passive:true });
$("backTop").addEventListener("click", () => window.scrollTo({ top:0, behavior:"smooth" }));

/* Scroll-spy */
const spy = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting){
      document.querySelectorAll(".nav-link").forEach(a =>
        a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    }
  });
}, { rootMargin:"-40% 0px -55% 0px" });
["home","shop","about","reviews","faq","contact"].forEach(id => {
  const s = $(id); if (s) spy.observe(s);
});

$("year").textContent = new Date().getFullYear();

/* ---------- Init ---------- */
(async function init(){
  await loadData();
  applySettings();
  renderProducts();
  renderCart();
})();
