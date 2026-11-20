(function () {
  "use strict";

  // Global state for DB data
  var DATA = { settings: {}, products: [] };
  var editingId = null;
  var searchTerm = "";
  var PLACEHOLDER = "https://placehold.co/800x1000/161b22/c9985b?text=Urban+Hide";

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function escapeHtml(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function formatPrice(v) { var n = Number(v); return isFinite(n) ? (DATA.settings.currencySymbol || "Rs ") + n.toLocaleString("en-PK") : ""; }

  function showToast(msg, type) {
    var t = $("#adminToast");
    if (!t) return;
    t.textContent = msg;
    t.className = "admin-toast show " + (type || "");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { t.className = "admin-toast"; }, 3000);
  }

  /* ========== FETCH DATA ========== */
  async function loadData() {
    try {
      var response = await fetch('/api/products');
      if (!response.ok) throw new Error("Database connection failed");
      var result = await response.json();
      
      DATA.products = result.products || [];
      DATA.settings = result.settings || {};
      
      renderAll();
    } catch (error) {
      console.error(error);
      showToast("Error connecting to database.", "error");
    }
  }

  /* ========== RENDER UI ========== */
  function renderStats() {
    var grid = $("#statsGrid");
    if (!grid) return;
    var total = DATA.products.length;
    var featured = DATA.products.filter(function (p) { return p.featured; }).length;
    var out = DATA.products.filter(function (p) { return p.inStock === false; }).length;

    grid.innerHTML =
      '<div class="stat-card"><span>Total Products</span><strong>' + total + "</strong></div>" +
      '<div class="stat-card"><span>Featured</span><strong>' + featured + "</strong></div>" +
      '<div class="stat-card"><span>Out of Stock</span><strong>' + out + "</strong></div>";
  }

  function renderTable() {
    var tbody = $("#productTableBody");
    if (!tbody) return;

    var term = searchTerm.toLowerCase();
    var list = DATA.products.filter(function (p) {
      return term ? [p.name, p.category, p.id].join(" ").toLowerCase().indexOf(term) !== -1 : true;
    });

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="table-empty">No products found.</div></td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (p) {
      var img = p.image || PLACEHOLDER;
      return "<tr>" +
          '<td><div class="table-product"><img src="' + escapeHtml(img) + '" onerror="this.onerror=null;this.src=\'' + PLACEHOLDER + '\'"><div><strong>' + escapeHtml(p.name) + '</strong><span>#' + escapeHtml(p.id) + '</span></div></div></td>' +
          '<td><span class="pill">' + escapeHtml(p.category || "jacket") + "</span></td>" +
          "<td>" + formatPrice(p.price) + "</td>" +
          '<td><button class="icon-btn ' + (p.featured ? "is-on" : "") + '" data-action="featured" data-id="' + escapeHtml(p.id) + '"><i class="fas fa-star"></i></button></td>' +
          '<td><button class="icon-btn ' + (p.inStock ? "is-on" : "is-danger") + '" data-action="stock" data-id="' + escapeHtml(p.id) + '"><i class="fas fa-' + (p.inStock ? "check" : "ban") + '"></i></button></td>' +
          '<td class="text-right"><button class="icon-btn" data-action="edit" data-id="' + escapeHtml(p.id) + '"><i class="fas fa-pen"></i></button><button class="icon-btn is-danger" data-action="delete" data-id="' + escapeHtml(p.id) + '"><i class="fas fa-trash"></i></button></td>' +
        "</tr>";
    }).join("");
  }

  function renderSettings() {
    var s = DATA.settings || {};
    if ($("#settingsWhatsapp")) $("#settingsWhatsapp").value = s.whatsappNumber || "";
    if ($("#settingsPhone")) $("#settingsPhone").value = s.phoneDisplay || "";
    if ($("#settingsCurrency")) $("#settingsCurrency").value = s.currency || "PKR";
    if ($("#settingsCurrencySymbol")) $("#settingsCurrencySymbol").value = s.currencySymbol || "Rs ";
    if ($("#settingsAddress")) $("#settingsAddress").value = s.address || "";
  }

  function renderAll() {
    renderStats();
    renderTable();
    renderSettings();
  }

  /* ========== MODAL ACTIONS ========== */
  var modal = $("#adminModalOverlay");
  var form = $("#productForm");

  function openForm(id) {
    if (!modal || !form) return;
    editingId = id || null;
    form.reset();
    
    var p = id ? DATA.products.find(function (i) { return String(i.id) === String(id); }) : null;
    if ($("#adminModalTitle")) $("#adminModalTitle").textContent = p ? "Edit Product" : "Add New Product";

    if (p) {
      form.elements.name.value = p.name || "";
      form.elements.category.value = p.category || "";
      form.elements.price.value = p.price || "";
      form.elements.oldPrice.value = p.oldPrice || "";
      form.elements.image.value = p.image || "";
      form.elements.description.value = p.description || "";
      form.elements.sizes.value = Array.isArray(p.sizes) ? p.sizes.join(", ") : "";
      form.elements.badge.value = p.badge || "";
      form.elements.featured.checked = !!p.featured;
      form.elements.inStock.checked = p.inStock !== false;
    } else {
      form.elements.featured.checked = false;
      form.elements.inStock.checked = true;
    }
    
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(function () { form.elements.name.focus(); }, 50);
  }

  function closeForm() {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
    editingId = null;
  }

  if (modal) modal.addEventListener("click", function (e) { if (e.target === modal) closeForm(); });
  if ($("#adminModalClose")) $("#adminModalClose").addEventListener("click", closeForm);
  if ($("#cancelProductBtn")) $("#cancelProductBtn").addEventListener("click", closeForm);

  /* ========== SAVE PRODUCT ========== */
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      var pData = {
        id: editingId || "p_" + Date.now(),
        name: form.elements.name.value.trim(),
        category: form.elements.category.value.trim().toLowerCase().replace(/\s+/g, "-"),
        price: Number(form.elements.price.value),
        oldPrice: form.elements.oldPrice.value ? Number(form.elements.oldPrice.value) : null,
        image: form.elements.image.value.trim() || PLACEHOLDER,
        description: form.elements.description.value.trim(),
        sizes: form.elements.sizes.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean),
        badge: form.elements.badge.value.trim(),
        featured: form.elements.featured.checked,
        inStock: form.elements.inStock.checked
      };

      try {
        var res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pData)
        });
        if (!res.ok) throw new Error("Failed");
        
        showToast(editingId ? "Product updated!" : "Product added!", "success");
        closeForm();
        loadData(); // Reload from DB
      } catch (err) {
        showToast("Error saving product.", "error");
      }
    });
  }

  /* ========== TABLE ACTIONS (Edit/Delete/Toggle) ========== */
  if ($("#productTableBody")) {
    $("#productTableBody").addEventListener("click", async function (e) {
      var btn = e.target.closest("button[data-action]");
      if (!btn) return;
      
      var action = btn.dataset.action;
      var id = btn.dataset.id;
      var p = DATA.products.find(function (i) { return String(i.id) === String(id); });
      if (!p) return;

      if (action === "edit") { openForm(id); return; }

      if (action === "delete") {
        if (!confirm('Delete "' + p.name + '"?')) return;
        try {
          await fetch('/api/products?id=' + id, { method: 'DELETE' });
          showToast("Product deleted!", "success");
          loadData();
        } catch (err) { showToast("Delete failed.", "error"); }
        return;
      }

      // Toggle Featured or Stock
      var updatedData = Object.assign({}, p);
      if (action === "featured") updatedData.featured = !p.featured;
      if (action === "stock") updatedData.inStock = !p.inStock;

      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        loadData();
      } catch (err) { showToast("Update failed.", "error"); }
    });
  }

  /* ========== SEARCH & TABS ========== */
  if ($("#productSearch")) {
    $("#productSearch").addEventListener("input", function () {
      searchTerm = this.value.trim();
      renderTable();
    });
  }

  if ($("#addProductBtn")) $("#addProductBtn").addEventListener("click", function () { openForm(null); });

  $$(".admin-nav-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".admin-nav-btn").forEach(function (btn) { btn.classList.toggle("active", btn === b); });
      $$(".admin-tab").forEach(function (sec) { sec.classList.toggle("active", sec.id === "tab-" + b.dataset.tab); });
      
      var isProd = b.dataset.tab === "products";
      if ($("#addProductBtn")) $("#addProductBtn").style.display = isProd ? "inline-flex" : "none";
      if ($("#adminTitle")) $("#adminTitle").textContent = isProd ? "Inventory" : "Store Settings";
      if ($("#adminSubtitle")) $("#adminSubtitle").textContent = isProd ? "Manage your products, pricing, and stock in real-time." : "Update your contact details and currency display.";
    });
  });

  /* ========== SETTINGS (Save to DB) ========== */
  if ($("#settingsForm")) {
    $("#settingsForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      
      var newSettings = {
        whatsappNumber: $("#settingsWhatsapp").value.trim().replace(/[^\d]/g, ""),
        phoneDisplay: $("#settingsPhone").value.trim(),
        address: $("#settingsAddress").value.trim(),
        currency: $("#settingsCurrency").value.trim() || "PKR",
        currencySymbol: $("#settingsCurrencySymbol").value || "Rs "
      };

      var btn = this.querySelector('button[type="submit"]');
      var originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      btn.disabled = true;

      try {
        var res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings)
        });

        if (!res.ok) throw new Error("Failed to save settings");

        showToast("Settings saved to database!", "success");
        loadData(); // Reload fresh data from DB
        
      } catch (error) {
        console.error(error);
        showToast("Error saving settings.", "error");
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  /* ========== INITIALIZE ========== */
  loadData();
})();