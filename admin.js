(function () {
  "use strict";

  var DATA = { settings: {}, products: [] };
  var editingId = null;
  var searchTerm = "";
  var PLACEHOLDER = "https://placehold.co/800x1000/161b22/c9985b?text=Urban+Hide";

  function $(selector, context) {
    return (context || document).querySelector(selector);
  }

  function $$(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[ch];
    });
  }

  function formatPrice(value) {
    var number = Number(value);
    if (!isFinite(number)) return "";
    return (DATA.settings.currencySymbol || "Rs ") + number.toLocaleString("en-PK");
  }

  function showAdminToast(message, type) {
    var toast = $("#adminToast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = "admin-toast show " + (type || "");
    clearTimeout(showAdminToast._timer);
    showAdminToast._timer = setTimeout(function () {
      toast.className = "admin-toast";
    }, 3400);
  }

  /* ========== RENDER ========== */
  function renderStats() {
    var grid = $("#statsGrid");
    if (!grid) return;

    var total = DATA.products.length;
    var featured = DATA.products.filter(function (p) { return p.featured; }).length;
    var outOfStock = DATA.products.filter(function (p) { return p.inStock === false; }).length;
    var categories = DATA.products.map(function (p) { return p.category; })
      .filter(Boolean)
      .filter(function (category, index, list) { return list.indexOf(category) === index; })
      .length;

    grid.innerHTML =
      '<div class="stat-card"><span>Total Products</span><strong>' + total + "</strong></div>" +
      '<div class="stat-card"><span>Featured</span><strong>' + featured + "</strong></div>" +
      '<div class="stat-card"><span>Out of Stock</span><strong>' + outOfStock + "</strong></div>" +
      '<div class="stat-card"><span>Categories</span><strong>' + categories + "</strong></div>";
  }

  function renderTable() {
    var tbody = $("#productTableBody");
    if (!tbody) return;

    var term = searchTerm.toLowerCase();

    var list = DATA.products.filter(function (product) {
      if (!term) return true;
      return [product.name, product.category, product.id]
        .join(" ")
        .toLowerCase()
        .indexOf(term) !== -1;
    });

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="table-empty">No products match your search.</div></td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (product) {
      var image = product.image || PLACEHOLDER;
      return (
        "<tr>" +
          "<td>" +
            '<div class="table-product">' +
              '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(product.name) + '" onerror="this.onerror=null;this.src=\'' + PLACEHOLDER + '\'">' +
              "<div>" +
                "<strong>" + escapeHtml(product.name) + "</strong>" +
                "<span>" + escapeHtml(product.id) + "</span>" +
              "</div>" +
            "</div>" +
          "</td>" +
          '<td><span class="pill">' + escapeHtml(product.category || "jacket") + "</span></td>" +
          "<td>" + formatPrice(product.price) + "</td>" +
          "<td>" +
            '<button class="icon-btn ' + (product.featured ? "is-on" : "") + '" data-action="featured" data-id="' + escapeHtml(product.id) + '" title="Toggle featured">' +
              '<i class="fas fa-star"></i>' +
            "</button>" +
          "</td>" +
          "<td>" +
            '<button class="icon-btn ' + (product.inStock ? "is-on" : "is-danger") + '" data-action="stock" data-id="' + escapeHtml(product.id) + '" title="Toggle stock">' +
              '<i class="fas fa-' + (product.inStock ? "check" : "ban") + '"></i>' +
            "</button>" +
          "</td>" +
          '<td class="text-right">' +
            '<button class="icon-btn" data-action="edit" data-id="' + escapeHtml(product.id) + '" title="Edit">' +
              '<i class="fas fa-pen"></i>' +
            "</button>" +
            '<button class="icon-btn is-danger" data-action="delete" data-id="' + escapeHtml(product.id) + '" title="Delete">' +
              '<i class="fas fa-trash"></i>' +
            "</button>" +
          "</td>" +
        "</tr>"
      );
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

  /* ========== FETCH DATA FROM DB ========== */
  async function loadAdminData() {
    try {
      var response = await fetch('/api/products');
      if (!response.ok) throw new Error("Failed to fetch");
      var result = await response.json();
      
      DATA.products = result.products || [];
      DATA.settings = result.settings || {};
      
      renderAll();
    } catch (error) {
      console.error("Failed to load data:", error);
      showAdminToast("Failed to connect to database.", "error");
    }
  }

  /* ========== PRODUCT MODAL ========== */
  var adminModalOverlay = $("#adminModalOverlay");
  var productForm = $("#productForm");

  function openProductForm(id) {
    if (!adminModalOverlay || !productForm) return;

    editingId = id || null;
    productForm.reset();

    var title = $("#adminModalTitle");
    var product = id
      ? DATA.products.find(function (item) { return String(item.id) === String(id); })
      : null;

    if (title) title.textContent = product ? "Edit Product" : "Add Product";

    if (product) {
      productForm.elements.name.value = product.name || "";
      productForm.elements.category.value = product.category || "";
      productForm.elements.price.value = product.price || "";
      productForm.elements.oldPrice.value = product.oldPrice || "";
      productForm.elements.image.value = product.image || "";
      productForm.elements.description.value = product.description || "";
      productForm.elements.sizes.value = Array.isArray(product.sizes) ? product.sizes.join(", ") : "";
      productForm.elements.badge.value = product.badge || "";
      productForm.elements.featured.checked = !!product.featured;
      productForm.elements.inStock.checked = product.inStock !== false;
    } else {
      productForm.elements.featured.checked = false;
      productForm.elements.inStock.checked = true;
    }

    adminModalOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(function () { productForm.elements.name.focus(); }, 50);
  }

  function closeProductForm() {
    if (!adminModalOverlay) return;
    adminModalOverlay.classList.remove("open");
    document.body.style.overflow = "";
    editingId = null;
  }

  if (adminModalOverlay) {
    adminModalOverlay.addEventListener("click", function (event) {
      if (event.target === adminModalOverlay) closeProductForm();
    });
  }

  var adminModalClose = $("#adminModalClose");
  if (adminModalClose) adminModalClose.addEventListener("click", closeProductForm);

  var cancelProductBtn = $("#cancelProductBtn");
  if (cancelProductBtn) cancelProductBtn.addEventListener("click", closeProductForm);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeProductForm();
  });

  /* ========== SAVE PRODUCT TO DB ========== */
  if (productForm) {
    productForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      var name = productForm.elements.name.value.trim();
      var category = productForm.elements.category.value.trim().toLowerCase().replace(/\s+/g, "-");
      var price = Number(productForm.elements.price.value);
      var oldPriceRaw = productForm.elements.oldPrice.value.trim();
      var oldPrice = oldPriceRaw ? Number(oldPriceRaw) : null;
      var image = productForm.elements.image.value.trim() || PLACEHOLDER;
      var description = productForm.elements.description.value.trim();
      var sizes = productForm.elements.sizes.value.split(",").map(function (size) {
        return size.trim();
      }).filter(Boolean);
      var badge = productForm.elements.badge.value.trim();
      var featured = productForm.elements.featured.checked;
      var inStock = productForm.elements.inStock.checked;

      if (!name || !category) {
        showAdminToast("Product name and category are required.", "error");
        return;
      }

      if (!isFinite(price) || price < 0) {
        showAdminToast("Please enter a valid price.", "error");
        return;
      }

      var productData = {
        id: editingId || "p_" + Date.now(),
        name: name,
        category: category,
        price: price,
        oldPrice: oldPrice && oldPrice > price ? oldPrice : null,
        image: image,
        description: description,
        sizes: sizes,
        badge: badge,
        featured: featured,
        inStock: inStock
      };

      try {
        var response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });

        if (!response.ok) throw new Error("Failed to save");

        showAdminToast(editingId ? "Product updated in Database!" : "Product added to Database!", "success");
        closeProductForm();
        loadAdminData(); // Reload fresh data from DB

      } catch (error) {
        console.error(error);
        showAdminToast("Error saving to database.", "error");
      }
    });
  }

  /* ========== TABLE ACTIONS (Toggle Stock/Featured) ========== */
  var tableBody = $("#productTableBody");
  if (tableBody) {
    tableBody.addEventListener("click", async function (event) {
      var button = event.target.closest("button[data-action]");
      if (!button) return;

      var action = button.dataset.action;
      var id = button.dataset.id;
      var product = DATA.products.find(function (item) { return String(item.id) === String(id); });

      if (!product) return;

      if (action === "edit") {
        openProductForm(id);
        return;
      }

      if (action === "delete") {
        if (!confirm('Delete "' + product.name + '"? This cannot be undone.')) return;
        
        // NOTE: To support delete, you would need to add a DELETE handler to your api/products.js
        // For now, we will just show a toast.
        showAdminToast("Delete requires API update. Please edit instead.", "error");
        return;
      }

      // Quick Toggles (Update database directly)
      var updatedData = Object.assign({}, product);
      if (action === "featured") updatedData.featured = !product.featured;
      if (action === "stock") updatedData.inStock = !product.inStock;

      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        loadAdminData(); // Refresh UI
        showAdminToast("Status updated!", "success");
      } catch (err) {
        showAdminToast("Failed to update status.", "error");
      }
    });
  }

  /* ========== SEARCH & ADD ========== */
  if ($("#productSearch")) {
    $("#productSearch").addEventListener("input", function () {
      searchTerm = $("#productSearch").value.trim();
      renderTable();
    });
  }

  if ($("#addProductBtn")) {
    $("#addProductBtn").addEventListener("click", function () { openProductForm(null); });
  }

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

      try {
        // You would need to add a POST /api/settings route to handle this in the backend.
        // Assuming you add it, here is the fetch:
        /*
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings)
        });
        */
        
        DATA.settings = Object.assign(DATA.settings, newSettings);
        showAdminToast("Settings saved locally (Requires backend API to persist).", "success");
      } catch (error) {
        showAdminToast("Error saving settings.", "error");
      }
    });
  }

  /* ========== TABS ========== */
  var tabMeta = {
    products: { title: "Products", subtitle: "Manage your catalog, featured items, and stock.", showAdd: true },
    settings: { title: "Store Settings", subtitle: "Update WhatsApp, phone, address, and currency display.", showAdd: false },
    transfer: { title: "Import / Export", subtitle: "Manage backups and data transfer.", showAdd: false }
  };

  $$(".admin-nav-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      var tab = button.dataset.tab;

      $$(".admin-nav-btn").forEach(function (btn) {
        btn.classList.toggle("active", btn === button);
      });

      $$(".admin-tab").forEach(function (section) {
        section.classList.toggle("active", section.id === "tab-" + tab);
      });

      var meta = tabMeta[tab];
      if (meta) {
        if ($("#adminTitle")) $("#adminTitle").textContent = meta.title;
        if ($("#adminSubtitle")) $("#adminSubtitle").textContent = meta.subtitle;
        if ($("#addProductBtn")) $("#addProductBtn").style.display = meta.showAdd ? "inline-flex" : "none";
      }
    });
  });

  /* ========== INITIALIZE ========== */
  loadAdminData();
})();