<<<<<<< HEAD
(function () {
  "use strict";

  var DATA = { settings: {}, products: [] };
  var activeCategory = "all";

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

  function waLink(message) {
    var number = String(DATA.settings.whatsappNumber || "").replace(/[^\d]/g, "");
    var text = message || "Hi Urban Hide! I would like to place an order.";
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(text);
  }

  function categoryLabel(category) {
    return String(category || "jacket")
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }

  function applySettings() {
    $$("[data-wa]").forEach(function (link) {
      link.href = waLink();
    });

    var address = $("#storeAddress");
    if (address) address.textContent = DATA.settings.address || "Islamabad, Pakistan";

    var phone = $("#storePhone");
    if (phone) phone.textContent = DATA.settings.phoneDisplay || "+92 336 5447075";

    var footerPhone = $("#footerPhone");
    if (footerPhone) footerPhone.textContent = DATA.settings.phoneDisplay || "+92 336 5447075";

    var year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }

  function productCard(product) {
    var image = product.image || "https://placehold.co/800x1000/161b22/c9985b?text=Urban+Hide";
    var sizes = Array.isArray(product.sizes) ? product.sizes.join(" · ") : "";

    return (
      '<article class="product-card" data-product-id="' + escapeHtml(product.id) + '" tabindex="0" role="button" aria-label="View ' + escapeHtml(product.name) + '">' +
        '<div class="product-media">' +
          '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy" onerror="this.onerror=null;this.src=\'https://placehold.co/800x1000/161b22/c9985b?text=Urban+Hide\'">' +
          (product.badge ? '<span class="product-badge">' + escapeHtml(product.badge) + "</span>" : "") +
          (!product.inStock ? '<span class="product-badge badge-out">Out of Stock</span>' : "") +
        "</div>" +
        '<div class="product-body">' +
          '<span class="product-category">' + escapeHtml(categoryLabel(product.category)) + "</span>" +
          '<h3 class="product-name">' + escapeHtml(product.name) + "</h3>" +
          '<div class="product-price">' +
            (product.oldPrice ? '<span class="old-price">' + formatPrice(product.oldPrice) + "</span>" : "") +
            "<span>" + formatPrice(product.price) + "</span>" +
          "</div>" +
          '<div class="product-card-footer">' +
            "<span>" + escapeHtml(sizes || "Sizes available") + "</span>" +
            '<span class="quick-view">Quick View <i class="fas fa-arrow-right"></i></span>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function renderFeatured() {
    var grid = $("#featuredGrid");
    if (!grid) return;

    var featured = DATA.products.filter(function (product) {
      return product.featured;
    }).slice(0, 8);

    grid.innerHTML = featured.length
      ? featured.map(productCard).join("")
      : '<div class="empty-state">No featured jackets yet. Check back soon.</div>';
  }

  function renderCategories() {
    var wrap = $("#categoryFilters");
    if (!wrap) return;

    var categories = ["all"].concat(
      DATA.products.map(function (product) {
        return product.category;
      }).filter(Boolean).filter(function (category, index, list) {
        return list.indexOf(category) === index;
      })
    );

    wrap.innerHTML = categories.map(function (category) {
      return (
        '<button class="filter-btn ' + (category === activeCategory ? "active" : "") + '" data-category="' + escapeHtml(category) + '">' +
          (category === "all" ? "All" : escapeHtml(categoryLabel(category))) +
        "</button>"
      );
    }).join("");
  }

  function renderProducts() {
    var grid = $("#productGrid");
    if (!grid) return;

    var list = activeCategory === "all"
      ? DATA.products
      : DATA.products.filter(function (product) {
          return product.category === activeCategory;
        });

    grid.innerHTML = list.length
      ? list.map(productCard).join("")
      : '<div class="empty-state">No jackets found in this category.</div>';
  }

  function renderAll() {
    applySettings();
    renderFeatured();
    renderCategories();
    renderProducts();
  }

  /* ========== MODAL ========== */
  var overlay = $("#modalOverlay");
  var modalBody = $("#modalBody");
  var modalClose = $("#modalClose");

  function openModal(productId) {
    var product = DATA.products.find(function (item) {
      return String(item.id) === String(productId);
    });
    if (!product || !overlay || !modalBody) return;

    var available = product.inStock !== false;
    var image = product.image || "https://placehold.co/800x1000/161b22/c9985b?text=Urban+Hide";
    var sizes = Array.isArray(product.sizes) ? product.sizes : [];
    var orderText = "Hi Urban Hide! I'm interested in " + product.name + " (" + formatPrice(product.price) + "). Please share availability and sizes.";

    modalBody.innerHTML =
      '<div class="modal-product">' +
        '<div class="modal-media">' +
          '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(product.name) + '" onerror="this.onerror=null;this.src=\'https://placehold.co/800x1000/161b22/c9985b?text=Urban+Hide\'">' +
        "</div>" +
        '<div class="modal-info">' +
          '<span class="product-category">' + escapeHtml(categoryLabel(product.category)) + "</span>" +
          "<h2>" + escapeHtml(product.name) + "</h2>" +
          '<div class="modal-price">' +
            (product.oldPrice ? '<span class="old-price">' + formatPrice(product.oldPrice) + "</span>" : "") +
            "<span>" + formatPrice(product.price) + "</span>" +
          "</div>" +
          '<p class="modal-desc">' + escapeHtml(product.description || "Premium Urban Hide jacket. Contact us on WhatsApp for more details.") + "</p>" +
          '<div class="modal-sizes">' +
            '<span class="label">Sizes</span>' +
            '<div class="size-list">' +
              (sizes.length
                ? sizes.map(function (size) {
                    return '<span class="size-chip">' + escapeHtml(size) + "</span>";
                  }).join("")
                : '<span class="muted">Contact for sizes</span>') +
            "</div>" +
          "</div>" +
          '<a class="btn btn-primary btn-block ' + (!available ? "disabled" : "") + '" href="' + (available ? waLink(orderText) : "#") + '" target="_blank" rel="noopener" ' + (!available ? 'aria-disabled="true"' : "") + ">" +
            '<i class="fab fa-whatsapp"></i> ' + (available ? "Order on WhatsApp" : "Out of Stock") +
          "</a>" +
        "</div>" +
      "</div>";

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (overlay) {
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeModal();
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeModal();
  });

  /* ========== EVENTS ========== */
  document.addEventListener("click", function (event) {
    var filter = event.target.closest(".filter-btn");
    if (filter) {
      activeCategory = filter.dataset.category;
      renderCategories();
      renderProducts();
      return;
    }

    var card = event.target.closest(".product-card");
    if (card) {
      openModal(card.dataset.productId);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && event.target.matches(".product-card")) {
      openModal(event.target.dataset.productId);
    }
  });

  /* ========== MOBILE NAV ========== */
  var menuToggle = $("#menuToggle");
  var nav = $("#mainNav");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  $$(".nav-link").forEach(function (link) {
    link.addEventListener("click", function () {
      $$(".nav-link").forEach(function (item) {
        item.classList.remove("active");
      });
      link.classList.add("active");
      if (nav) nav.classList.remove("open");
    });
  });

  /* ========== TOAST ========== */
  function showToast(message, type) {
    var toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = "toast show " + (type || "");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      toast.className = "toast";
    }, 3200);
  }

  /* ========== FETCH FROM DATABASE ========== */
  async function loadData() {
    try {
      // Fetch data from the Vercel API connected to Neon
      var response = await fetch('/api/products');
      if (!response.ok) throw new Error("Failed to fetch");
      
      var result = await response.json();
      
      // Update global data
      DATA.products = result.products || [];
      DATA.settings = result.settings || {};
      
      // Re-render the website with real database data
      renderAll();
      
    } catch (error) {
      console.error("Database Error:", error);
      // Optional fallback to local products.js if DB fails
      if (window.URBAN_HIDE_DATA) {
        DATA = window.URBAN_HIDE_DATA;
        renderAll();
      }
    }
  }

  // Initialize
  loadData();
=======
(function () {
  "use strict";

  var DATA = { settings: {}, products: [] };
  var activeCategory = "all";

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

  function waLink(message) {
    var number = String(DATA.settings.whatsappNumber || "").replace(/[^\d]/g, "");
    var text = message || "Hi Urban Hide! I would like to place an order.";
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(text);
  }

  function categoryLabel(category) {
    return String(category || "jacket")
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }

  function applySettings() {
    $$("[data-wa]").forEach(function (link) {
      link.href = waLink();
    });

    var address = $("#storeAddress");
    if (address) address.textContent = DATA.settings.address || "Islamabad, Pakistan";

    var phone = $("#storePhone");
    if (phone) phone.textContent = DATA.settings.phoneDisplay || "+92 336 5447075";

    var footerPhone = $("#footerPhone");
    if (footerPhone) footerPhone.textContent = DATA.settings.phoneDisplay || "+92 336 5447075";

    var year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }

  function productCard(product) {
    var image = product.image || "https://placehold.co/800x1000/161b22/c9985b?text=Urban+Hide";
    var sizes = Array.isArray(product.sizes) ? product.sizes.join(" · ") : "";

    return (
      '<article class="product-card" data-product-id="' + escapeHtml(product.id) + '" tabindex="0" role="button" aria-label="View ' + escapeHtml(product.name) + '">' +
        '<div class="product-media">' +
          '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy" onerror="this.onerror=null;this.src=\'https://placehold.co/800x1000/161b22/c9985b?text=Urban+Hide\'">' +
          (product.badge ? '<span class="product-badge">' + escapeHtml(product.badge) + "</span>" : "") +
          (!product.inStock ? '<span class="product-badge badge-out">Out of Stock</span>' : "") +
        "</div>" +
        '<div class="product-body">' +
          '<span class="product-category">' + escapeHtml(categoryLabel(product.category)) + "</span>" +
          '<h3 class="product-name">' + escapeHtml(product.name) + "</h3>" +
          '<div class="product-price">' +
            (product.oldPrice ? '<span class="old-price">' + formatPrice(product.oldPrice) + "</span>" : "") +
            "<span>" + formatPrice(product.price) + "</span>" +
          "</div>" +
          '<div class="product-card-footer">' +
            "<span>" + escapeHtml(sizes || "Sizes available") + "</span>" +
            '<span class="quick-view">Quick View <i class="fas fa-arrow-right"></i></span>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function renderFeatured() {
    var grid = $("#featuredGrid");
    if (!grid) return;

    var featured = DATA.products.filter(function (product) {
      return product.featured;
    }).slice(0, 8);

    grid.innerHTML = featured.length
      ? featured.map(productCard).join("")
      : '<div class="empty-state">No featured jackets yet. Check back soon.</div>';
  }

  function renderCategories() {
    var wrap = $("#categoryFilters");
    if (!wrap) return;

    var categories = ["all"].concat(
      DATA.products.map(function (product) {
        return product.category;
      }).filter(Boolean).filter(function (category, index, list) {
        return list.indexOf(category) === index;
      })
    );

    wrap.innerHTML = categories.map(function (category) {
      return (
        '<button class="filter-btn ' + (category === activeCategory ? "active" : "") + '" data-category="' + escapeHtml(category) + '">' +
          (category === "all" ? "All" : escapeHtml(categoryLabel(category))) +
        "</button>"
      );
    }).join("");
  }

  function renderProducts() {
    var grid = $("#productGrid");
    if (!grid) return;

    var list = activeCategory === "all"
      ? DATA.products
      : DATA.products.filter(function (product) {
          return product.category === activeCategory;
        });

    grid.innerHTML = list.length
      ? list.map(productCard).join("")
      : '<div class="empty-state">No jackets found in this category.</div>';
  }

  function renderAll() {
    applySettings();
    renderFeatured();
    renderCategories();
    renderProducts();
  }

  /* ========== MODAL ========== */
  var overlay = $("#modalOverlay");
  var modalBody = $("#modalBody");
  var modalClose = $("#modalClose");

  function openModal(productId) {
    var product = DATA.products.find(function (item) {
      return String(item.id) === String(productId);
    });
    if (!product || !overlay || !modalBody) return;

    var available = product.inStock !== false;
    var image = product.image || "https://placehold.co/800x1000/161b22/c9985b?text=Urban+Hide";
    var sizes = Array.isArray(product.sizes) ? product.sizes : [];
    var orderText = "Hi Urban Hide! I'm interested in " + product.name + " (" + formatPrice(product.price) + "). Please share availability and sizes.";

    modalBody.innerHTML =
      '<div class="modal-product">' +
        '<div class="modal-media">' +
          '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(product.name) + '" onerror="this.onerror=null;this.src=\'https://placehold.co/800x1000/161b22/c9985b?text=Urban+Hide\'">' +
        "</div>" +
        '<div class="modal-info">' +
          '<span class="product-category">' + escapeHtml(categoryLabel(product.category)) + "</span>" +
          "<h2>" + escapeHtml(product.name) + "</h2>" +
          '<div class="modal-price">' +
            (product.oldPrice ? '<span class="old-price">' + formatPrice(product.oldPrice) + "</span>" : "") +
            "<span>" + formatPrice(product.price) + "</span>" +
          "</div>" +
          '<p class="modal-desc">' + escapeHtml(product.description || "Premium Urban Hide jacket. Contact us on WhatsApp for more details.") + "</p>" +
          '<div class="modal-sizes">' +
            '<span class="label">Sizes</span>' +
            '<div class="size-list">' +
              (sizes.length
                ? sizes.map(function (size) {
                    return '<span class="size-chip">' + escapeHtml(size) + "</span>";
                  }).join("")
                : '<span class="muted">Contact for sizes</span>') +
            "</div>" +
          "</div>" +
          '<a class="btn btn-primary btn-block ' + (!available ? "disabled" : "") + '" href="' + (available ? waLink(orderText) : "#") + '" target="_blank" rel="noopener" ' + (!available ? 'aria-disabled="true"' : "") + ">" +
            '<i class="fab fa-whatsapp"></i> ' + (available ? "Order on WhatsApp" : "Out of Stock") +
          "</a>" +
        "</div>" +
      "</div>";

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (overlay) {
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeModal();
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeModal();
  });

  /* ========== EVENTS ========== */
  document.addEventListener("click", function (event) {
    var filter = event.target.closest(".filter-btn");
    if (filter) {
      activeCategory = filter.dataset.category;
      renderCategories();
      renderProducts();
      return;
    }

    var card = event.target.closest(".product-card");
    if (card) {
      openModal(card.dataset.productId);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && event.target.matches(".product-card")) {
      openModal(event.target.dataset.productId);
    }
  });

  /* ========== MOBILE NAV ========== */
  var menuToggle = $("#menuToggle");
  var nav = $("#mainNav");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  $$(".nav-link").forEach(function (link) {
    link.addEventListener("click", function () {
      $$(".nav-link").forEach(function (item) {
        item.classList.remove("active");
      });
      link.classList.add("active");
      if (nav) nav.classList.remove("open");
    });
  });

  /* ========== TOAST ========== */
  function showToast(message, type) {
    var toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = "toast show " + (type || "");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      toast.className = "toast";
    }, 3200);
  }

  /* ========== FETCH FROM DATABASE ========== */
  async function loadData() {
    try {
      // Fetch data from the Vercel API connected to Neon
      var response = await fetch('/api/products');
      if (!response.ok) throw new Error("Failed to fetch");
      
      var result = await response.json();
      
      // Update global data
      DATA.products = result.products || [];
      DATA.settings = result.settings || {};
      
      // Re-render the website with real database data
      renderAll();
      
    } catch (error) {
      console.error("Database Error:", error);
      // Optional fallback to local products.js if DB fails
      if (window.URBAN_HIDE_DATA) {
        DATA = window.URBAN_HIDE_DATA;
        renderAll();
      }
    }
  }

  // Initialize
  loadData();
>>>>>>> c249896abefd84aaeb8c158e8fbef24b0326b4fd
})();