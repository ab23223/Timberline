/* Landscape Supply Loader Orders — front-end demo.
   This file intentionally uses sample data only. Do not place Zulu API keys in browser code. */
(() => {
  "use strict";
  const STORAGE_KEY = "landscape-loader-orders-demo-v1";
  const SETTINGS_KEY = "landscape-loader-settings-v1";
  const today = () => new Date().toISOString().slice(0,10);
  const starterOrders = [
    {id:"1842",customer:"Smith",vehicle:"White trailer",time:"09:48 AM",paid:true,status:"loading",notes:"Keep mulch separate from soil.",items:[{name:"ARB mulch",qty:2,unit:"m³",loaded:true},{name:"Topsoil",qty:0.5,unit:"m³",loaded:false}],created:Date.now()-180000,completedAt:null},
    {id:"1841",customer:"Wilson",vehicle:"Ute",time:"09:54 AM",paid:true,status:"pending",notes:"Call customer on arrival.",items:[{name:"Compost",qty:1,unit:"m³",loaded:false},{name:"Screened soil",qty:1,unit:"m³",loaded:false}],created:Date.now()-120000,completedAt:null},
    {id:"1840",customer:"Taylor",vehicle:"Tip truck",time:"10:02 AM",paid:true,status:"pending",notes:"Deliver to back of property.",items:[{name:"Bark mulch",qty:3,unit:"m³",loaded:false},{name:"Topsoil",qty:1,unit:"m³",loaded:false}],created:Date.now()-60000,completedAt:null},
    {id:"1839",customer:"Brown",vehicle:"Trailer",time:"10:08 AM",paid:true,status:"pending",notes:"Customer wants it levelled.",items:[{name:"Garden mix",qty:2,unit:"m³",loaded:false},{name:"Compost",qty:0.5,unit:"m³",loaded:false}],created:Date.now()-20000,completedAt:null}
  ];
  const products = [
    {name:"ARB mulch",category:"Mulch",unit:"m³",icon:"▧",kind:"mulch"},
    {name:"Bark mulch",category:"Mulch",unit:"m³",icon:"▧",kind:"bark"},
    {name:"Topsoil",category:"Soil",unit:"m³",icon:"▦",kind:"soil"},
    {name:"Screened soil",category:"Soil",unit:"m³",icon:"▦",kind:"soil"},
    {name:"Compost",category:"Soil improver",unit:"m³",icon:"♨",kind:"compost"},
    {name:"Garden mix",category:"Blend",unit:"m³",icon:"▤",kind:"generic"}
  ];
  let state = loadState();
  let selectedId = state.orders.find(o => o.status !== "completed")?.id || state.orders[0]?.id || null;
  let queueMode = "active";
  let toastTimer;

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed.orders)) return parsed; }
    } catch (e) { console.warn("Could not load demo state", e); }
    return {orders:structuredCloneSafe(starterOrders)};
  }
  function structuredCloneSafe(v) { return JSON.parse(JSON.stringify(v)); }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn("Could not save state", e); showToast("Browser storage is unavailable; changes may not persist."); }
    $("lastUpdated").textContent = "just now";
  }
  function showToast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function formatQty(q) { return Number.isInteger(Number(q)) ? String(Number(q)) : String(Number(q)).replace(/\.0$/,""); }
  function itemIcon(name) {
    const n = name.toLowerCase();
    if (n.includes("mulch") || n.includes("bark")) return "mulch";
    if (n.includes("soil")) return "soil";
    if (n.includes("compost")) return "compost";
    return "generic";
  }
  function currentOrders() {
    const q = $("orderSearch").value.trim().toLowerCase();
    return state.orders.filter(o => queueMode === "completed" ? o.status === "completed" : o.status !== "completed")
      .filter(o => !q || [o.id,o.customer,o.vehicle,o.notes,...o.items.map(i=>i.name)].join(" ").toLowerCase().includes(q))
      .sort((a,b) => (b.created||0)-(a.created||0));
  }
  function render() {
    $("activeCount").textContent = state.orders.filter(o => o.status !== "completed").length;
    $("completedCount").textContent = state.orders.filter(o => o.status === "completed").length;
    document.querySelectorAll(".queue-tab").forEach(b => b.classList.toggle("active", b.dataset.queue === queueMode));
    const orders = currentOrders();
    $("orderList").innerHTML = orders.map(o => `
      <article class="order-card ${o.id===selectedId?"selected":""}" data-order-id="${escapeHtml(o.id)}" tabindex="0" role="button" aria-label="Open order ${escapeHtml(o.id)}">
        <div class="order-card-top">
          <div class="order-meta">
            <div class="order-number-line"><span class="order-number">#${escapeHtml(o.id)}</span><span class="status-pill ${o.status}">${o.status==="loading"?"LOADING":o.status==="completed"?"COMPLETED":"PENDING"}</span></div>
            <div class="customer-name">${escapeHtml(o.customer)}</div>
            <div class="vehicle-line"><span class="vehicle-icon">▰</span>${escapeHtml(o.vehicle || "Vehicle not specified")}</div>
          </div>
          <div class="mini-items">${o.items.map(i=>`<div class="mini-item"><span class="mini-qty">${formatQty(i.qty)} ${escapeHtml(i.unit||"m³")}</span><span class="mini-name">${escapeHtml(i.name)}</span></div>`).join("")}</div>
          <div class="card-chevron">›</div>
        </div>
        ${o.notes ? `<div class="note-strip ${o.notes.toLowerCase().includes("separate")?"special":""}"><span class="note-symbol">▤</span><span>${escapeHtml(o.notes)}</span></div>` : ""}
      </article>`).join("");
    $("emptyOrders").classList.toggle("hidden", orders.length > 0);
    if (!orders.some(o=>o.id===selectedId)) selectedId = orders[0]?.id || null;
    renderDetail();
  }
  function renderDetail() {
    const o = state.orders.find(o => o.id === selectedId);
    $("detailEmpty").classList.toggle("hidden", !!o);
    $("detailContent").classList.toggle("hidden", !o);
    if (!o) { $("detailContent").innerHTML = ""; return; }
    const total = o.items.reduce((sum,i)=>sum+Number(i.qty||0),0);
    $("detailContent").innerHTML = `
      <div class="detail-header">
        <div class="detail-info">
          <div class="detail-title-line"><h1 class="detail-title">Order #${escapeHtml(o.id)}</h1><span class="status-pill ${o.status}">${o.status==="loading"?"LOADING":o.status==="completed"?"COMPLETED":"PENDING"}</span></div>
          <div class="detail-customer"><span class="line-icon">♙</span>${escapeHtml(o.customer)}</div>
          <div class="detail-subline"><span class="line-icon">▰</span>${escapeHtml(o.vehicle || "Vehicle not specified")}</div>
          <div class="detail-subline"><span class="line-icon">◷</span>${escapeHtml(o.time || "Time unavailable")} ${o.paid?"(Paid)":""}</div>
        </div>
        <aside class="special-box"><div class="special-title"><span>▤</span> Special Instructions</div><div class="special-text">${o.notes?escapeHtml(o.notes):"No special instructions."}</div></aside>
      </div>
      <h2 class="section-title">Products</h2>
      <div class="products-box">${o.items.map((i,index)=>`
        <div class="product-row">
          <div class="product-thumb ${itemIcon(i.name)}">${itemIcon(i.name)==="soil"?"▦":itemIcon(i.name)==="compost"?"♨":"▧"}</div>
          <div><div class="product-name">${escapeHtml(i.name)}</div><div class="product-qty">${formatQty(i.qty)} ${escapeHtml(i.unit||"m³")}</div></div>
          <button class="item-status ${i.loaded?"loaded":""}" data-toggle-item="${index}" ${o.status==="completed"?"disabled":""} aria-label="${i.loaded?"Mark as not loaded":"Mark as loaded"}"><span class="round-check ${i.loaded?"checked":""}">${i.loaded?"✓":""}</span><span>${i.loaded?"Loaded":"Pending"}</span></button>
        </div>`).join("")}</div>
      <div class="summary-strip">
        <div class="summary-cell"><div class="summary-label"><span>◇</span>Total volume</div><div class="summary-value">${formatQty(total)} m³</div></div>
        <div class="summary-cell"><div class="summary-label"><span>♙</span>Customer</div><div class="summary-value">${escapeHtml(o.customer)}</div></div>
        <div class="summary-cell"><div class="summary-label"><span>▰</span>Vehicle</div><div class="summary-value">${escapeHtml(o.vehicle||"Not specified")}</div></div>
      </div>
      <div class="detail-actions">
        ${o.status==="completed" ? `<button class="secondary-button" id="reopenOrder">↶ Reopen order</button><button class="danger-button" id="deleteOrder">Delete from demo</button>` : `<button class="complete-button" id="completeOrder"><span class="button-icon">✓</span><span>Complete Order<span class="button-subtitle">Remove from active list</span></span></button><button class="secondary-button" id="radioButton"><span class="button-icon">▤</span><span>Call on Radio<span class="button-subtitle">Need assistance?</span></span></button>`}
      </div>`;
  }
  function setPage(pageId) {
    document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===pageId));
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===pageId));
    document.querySelector(".page-name").textContent = pageId==="ordersPage"?"Loader Orders":pageId==="productsPage"?"Products":"Settings";
    $("bottomNav").classList.remove("nav-open");
  }
  function completeSelected() {
    const o = state.orders.find(o=>o.id===selectedId); if(!o || o.status==="completed") return;
    o.status="completed"; o.completedAt=Date.now(); o.items.forEach(i=>i.loaded=true);
    saveState(); queueMode="active"; render(); showToast(`Order #${o.id} marked complete in this browser.`);
  }
  function addDemoOrder(data) {
    const numericIds = state.orders.map(o=>parseInt(o.id,10)).filter(Number.isFinite);
    const id=String(Math.max(1842,...numericIds)+1);
    const items=data?.items || [{name:"ARB mulch",qty:1,unit:"m³",loaded:false},{name:"Topsoil",qty:.5,unit:"m³",loaded:false}];
    const now=new Date();
    const order={id,customer:data?.customer||"Demo customer",vehicle:data?.vehicle||"Trailer",time:now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),paid:true,status:"pending",notes:data?.notes||"",items,created:Date.now(),completedAt:null};
    state.orders.unshift(order);selectedId=id;queueMode="active";saveState();render();setPage("ordersPage");showToast(`Demo order #${id} added.`);
  }
  function renderProducts() {
    $("productGrid").innerHTML=products.map(p=>`<article class="catalog-card"><div class="product-thumb ${p.kind}">${p.icon}</div><div><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.category)}</p><div class="unit">Sold by ${escapeHtml(p.unit)}</div></div></article>`).join("");
  }
  function loadSettings() {
    try {
      const s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}");
      if(s.yardName) $("yardName").value=s.yardName;
      if(s.machineName) $("machineName").value=s.machineName;
      if(s.refreshInterval) $("refreshInterval").value=s.refreshInterval;
    } catch(e) {}
  }
  function updateClock() {
    const d=new Date();
    $("dateText").textContent=d.toLocaleDateString(undefined,{weekday:"short",day:"2-digit",month:"short",year:"numeric"});
    $("timeText").textContent=d.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});
  }
  document.addEventListener("click", e => {
    const card=e.target.closest("[data-order-id]");
    if(card){selectedId=card.dataset.orderId;render();return;}
    const tab=e.target.closest("[data-queue]");
    if(tab){queueMode=tab.dataset.queue;const first=currentOrders()[0];selectedId=first?.id||null;render();return;}
    const nav=e.target.closest("[data-page]");
    if(nav){setPage(nav.dataset.page);return;}
    const itemBtn=e.target.closest("[data-toggle-item]");
    if(itemBtn){const o=state.orders.find(o=>o.id===selectedId);if(!o)return;const i=o.items[Number(itemBtn.dataset.toggleItem)];i.loaded=!i.loaded;if(i.loaded)o.status="loading";else if(!o.items.some(x=>x.loaded))o.status="pending";saveState();render();return;}
    if(e.target.closest("#completeOrder")){completeSelected();return;}
    if(e.target.closest("#radioButton")){showToast("Use the yard walkie-talkie to coordinate this order.");return;}
    if(e.target.closest("#addDemoOrder")||e.target.closest("#addProductButton")){$("orderModal").showModal();return;}
    if(e.target.closest("#reopenOrder")){const o=state.orders.find(o=>o.id===selectedId);if(o){o.status="pending";o.completedAt=null;o.items.forEach(i=>i.loaded=false);queueMode="active";saveState();render();showToast("Order reopened.");}return;}
    if(e.target.closest("#deleteOrder")){state.orders=state.orders.filter(o=>o.id!==selectedId);selectedId=state.orders.find(o=>o.status!=="completed")?.id||null;saveState();render();showToast("Demo order deleted.");return;}
    if(e.target.closest("#refreshButton")){render();updateClock();showToast("Demo view refreshed.");return;}
    if(e.target.closest("#saveSettings")){const s={yardName:$("yardName").value.trim()||"Landscape Supply",machineName:$("machineName").value,refreshInterval:$("refreshInterval").value};localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));document.querySelector(".brand").textContent=s.yardName;$("settingsMessage").textContent="Settings saved in this browser.";showToast("Settings saved.");return;}
    if(e.target.closest("#resetDemo")){if(confirm("Reset all sample orders to the original demo data?")){state={orders:structuredCloneSafe(starterOrders)};selectedId="1842";queueMode="active";saveState();render();showToast("Sample orders reset.");}return;}
    if(e.target.closest("#clearCompleted")){state.orders=state.orders.filter(o=>o.status!=="completed");if(!state.orders.some(o=>o.id===selectedId))selectedId=state.orders[0]?.id||null;saveState();render();showToast("Completed demo history cleared.");return;}
    if(e.target.closest("#createOrder")){e.preventDefault();const customer=$("newCustomer").value.trim();const vehicle=$("newVehicle").value.trim()||"Vehicle not specified";const notes=$("newNotes").value.trim();const lines=$("newItems").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);const items=[];for(const line of lines){const parts=line.split("|");const qty=Number(parts[0]);const name=parts.slice(1).join("|").trim();if(!Number.isFinite(qty)||qty<=0||!name){showToast("Use quantity|product name on each line.");return;}items.push({qty,name,unit:"m³",loaded:false});}if(!customer||!items.length){showToast("Enter a customer and at least one valid product.");return;}addDemoOrder({customer,vehicle,notes,items});$("orderModal").close();$("orderForm").reset();return;}
    if(e.target.closest("#mobileMenu")){$("bottomNav").classList.toggle("nav-open");return;}
  });
  $("orderSearch").addEventListener("input",render);
  document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-order-id]")){e.preventDefault();selectedId=e.target.dataset.orderId;render();}});
  // This only synchronizes multiple tabs using the same browser storage, not separate devices.
  window.addEventListener("storage",e=>{if(e.key===STORAGE_KEY){state=loadState();render();}});
  renderProducts();loadSettings();render();updateClock();setInterval(updateClock,15000);
})();