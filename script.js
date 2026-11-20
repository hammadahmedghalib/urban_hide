(function () {
  "use strict";

  let DATA = { settings: {}, products: [] };
  let activeCategory = "all";
  let searchTerm = "";
  let sortBy = "newest";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  
  const escapeHtml = (str) => String(str || "").replace(/[&<>"']/g, match => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[match]));
  const formatPrice = (val) => (DATA.settings.currencySymbol || "Rs ") + Number(val).toLocaleString("en-PK");
  const catLabel = (cat) => String(cat || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    // Find this line:
  // const waLink = (msg) => `https://wa.me/${String(DATA.settings.whatsappNumber || "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(msg)}`;
  
  // Replace it with this:
  const waLink = (msg) => {
    const defaultMsg = "Hello Urban Hide! 👋 I am browsing your website and would like to inquire about your premium jackets.";
    return `https://wa.me/${String(DATA.settings.whatsappNumber || "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(msg || defaultMsg)}`;
  };

  /* ========== UI UPDATES ========== */
  function updateSettings() {
    $$("[data-wa]").forEach(el => el.href = waLink("Hi Urban Hide! I would like to place an order."));
    if ($("#storeAddress")) $("#storeAddress").textContent = DATA.settings.address || "Islamabad, Pakistan";
    if ($("#storePhone")) $("#storePhone").textContent = DATA.settings.phoneDisplay || "+92 336 5447075";
    if ($("#year")) $("#year").textContent = new Date().getFullYear();
  }

   function createCard(p) {
    const img = p.image || "https://placehold.co/600x800/141414/333?text=Urban+Hide";
    const hasDiscount = p.oldPrice && p.oldPrice > p.price;
    
    return `
      <div class="card" data-id="${p.id}">
        <div class="card-img">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://placehold.co/600x800/141414/333?text=Urban+Hide'">
          ${p.badge ? `<span class="card-badge">${escapeHtml(p.badge)}</span>` : ""}
          ${!p.inStock ? `<span class="card-badge" style="background:#ef4444;color:#fff;left:auto;right:1rem;">Sold Out</span>` : ""}
        </div>
        <div class="card-info">
          <div class="card-cat">${escapeHtml(catLabel(p.category))}</div>
          <div class="card-title">${escapeHtml(p.name)}</div>
          <div class="card-price">
            ${hasDiscount ? `<span class="card-old">${formatPrice(p.oldPrice)}</span>` : ""}
            <span>${formatPrice(p.price)}</span>
          </div>
          <!-- NEW BUY NOW BUTTON -->
          <button class="btn-card-order ${!p.inStock ? 'disabled' : ''}">
            ${p.inStock ? 'Order Now <i class="fab fa-whatsapp"></i>' : 'Out of Stock'}
          </button>
        </div>
      </div>
    `;
  }

  function renderFeatured() {
    const grid = $("#featuredGrid");
    if (!grid) return;
    const featured = DATA.products.filter(p => p.featured).slice(0, 4);
    
    if (featured.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;border:1px dashed var(--border);border-radius:12px;color:var(--text-muted)">No featured products yet. Add some in the Admin panel.</div>`;
      return;
    }
    grid.innerHTML = featured.map(createCard).join("");
  }

  function renderFilters() {
    const wrap = $("#categoryFilters");
    if (!wrap) return;
    
    const cats = ["all", ...new Set(DATA.products.map(p => p.category).filter(Boolean))];
    
    wrap.innerHTML = cats.map(c => `
      <button class="filter-btn ${c === activeCategory ? 'active' : ''}" data-cat="${escapeHtml(c)}">
        ${c === "all" ? "All Jackets" : escapeHtml(catLabel(c))}
      </button>
    `).join("");
  }

  function renderShop() {
    const grid = $("#productGrid");
    if (!grid) return;

    let items = DATA.products.filter(p => {
      const matchesCat = activeCategory === "all" || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });

    if (sortBy === "price-low") items.sort((a,b) => a.price - b.price);
    else if (sortBy === "price-high") items.sort((a,b) => b.price - a.price);
    else items.sort((a,b) => String(b.id).localeCompare(String(a.id)));

    if (items.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted)">No products found matching your criteria.</div>`;
    } else {
      grid.innerHTML = items.map(createCard).join("");
    }
  }

  function renderAll() {
    updateSettings();
    renderFeatured();
    renderFilters();
    renderShop();
  }

  /* ========== MODAL ========== */
  const overlay = $("#modalOverlay");
  const modalBody = $("#modalBody");

  function openModal(id) {
    const p = DATA.products.find(item => String(item.id) === String(id));
    if (!p || !overlay) return;

    const img = p.image || "https://placehold.co/600x800/141414/333?text=Urban+Hide";
    const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ["One Size"];
    const available = p.inStock !== false;

    // ==========================================
    // PROFESSIONAL WHATSAPP MESSAGE TEMPLATE
    // ==========================================
        // ==========================================
    // PROFESSIONAL WHATSAPP MESSAGE WITH IMAGE LINK
    // ==========================================
    const professionalMessage = `Hello Urban Hide! 👋\n\nI would like to place an order for this jacket:\n\n📦 *Product:* ${p.name}\n🏷️ *Category:* ${catLabel(p.category)}\n💰 *Price:* ${formatPrice(p.price)}\n🖼️ *Image:* ${p.image}\n\nCould you please confirm if my size is available? I am looking for size: [Type your size here]`;

    modalBody.innerHTML = `
      <button class="close-btn" onclick="document.getElementById('modalOverlay').classList.remove('open')"><i class="fas fa-times"></i></button>
      <div class="modal-content">
        <div class="modal-img"><img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}"></div>
        <div class="modal-details">
          <div class="card-cat">${escapeHtml(catLabel(p.category))}</div>
          <h2>${escapeHtml(p.name)}</h2>
          <div class="modal-price">
            ${p.oldPrice ? `<span class="card-old">${formatPrice(p.oldPrice)}</span>` : ""}
            ${formatPrice(p.price)}
          </div>
          <p class="modal-desc">${escapeHtml(p.description || "Premium quality jacket from Urban Hide.")}</p>
          <div>
            <span class="size-label">Available Sizes</span>
            <div class="sizes">
              ${sizes.map(s => `<span class="size-tag">${escapeHtml(s)}</span>`).join("")}
            </div>
          </div>
          <a href="${available ? waLink(professionalMessage) : '#'}" 
             class="btn btn-primary" target="_blank" ${!available ? 'style="opacity:0.5;pointer-events:none"' : ''}>
            <i class="fab fa-whatsapp"></i> ${available ? "Order via WhatsApp" : "Out of Stock"}
          </a>
        </div>
      </div>
    `;
    overlay.classList.add("open");
  }

  if (overlay) overlay.addEventListener("click", e => { if (e.target === overlay) overlay.classList.remove("open"); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && overlay) overlay.classList.remove("open"); });

  /* ========== EVENTS ========== */
  document.addEventListener("click", e => {
    const filter = e.target.closest(".filter-btn");
    if (filter) {
      activeCategory = filter.dataset.cat;
      renderFilters();
      renderShop();
      return;
    }
    const card = e.target.closest(".card");
    if (card) openModal(card.dataset.id);
  });

  if ($("#searchInput")) $("#searchInput").addEventListener("input", e => { searchTerm = e.target.value; renderShop(); });
  if ($("#sortSelect")) $("#sortSelect").addEventListener("change", e => { sortBy = e.target.value; renderShop(); });
  if ($("#menuToggle")) $("#menuToggle").addEventListener("click", () => $("#mainNav").classList.toggle("open"));

  /* ========== FETCH DATA ========== */
  async function init() {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error("DB Error");
      const result = await res.json();
      
      DATA.products = result.products || [];
      DATA.settings = result.settings || {};
      
      renderAll();
    } catch (err) {
      console.error(err);
      // Show a graceful fallback if database connection fails
      if ($("#featuredGrid")) $("#featuredGrid").innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#ef4444;padding:2rem;">Failed to connect to database. Check your API URL.</div>`;
    }
  }

  init();
})();