(function () {
  const MENU_ITEMS = [
    { id: 'idly', name: 'Idly', price: 10, image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' },
    { id: 'dosa', name: 'Dosa', price: 40, image: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' },
    { id: 'poori', name: 'Poori', price: 40, image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' },
    { id: 'pongal', name: 'Pongal', price: 45, image: 'https://images.pexels.com/photos/1117862/pexels-photo-1117862.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' },
    { id: 'vada', name: 'Vada', price: 10, image: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' },
    { id: 'other-dosa', name: 'Other Variety Dosa', price: 60, image: 'https://images.pexels.com/photos/416471/pexels-photo-416471.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' },
    { id: 'tea', name: 'Tea', price: 10, image: 'https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' },
    { id: 'coffee', name: 'Coffee', price: 15, image: 'https://images.pexels.com/photos/982612/pexels-photo-982612.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' },
    { id: 'snacks', name: 'Snacks', price: 20, image: 'https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' }
  ];

  const STORAGE_KEY = 'resto_cart_v1';
  const CUSTOM_MENU_KEY = 'resto_custom_menu_v1';
  const PRICE_OVERRIDES_KEY = 'resto_price_overrides_v1';
  const DISABLED_DEFAULTS_KEY = 'resto_disabled_defaults_v1';
  let cart = loadCart();
  let customMenu = loadCustomMenu();
  let priceOverrides = loadPriceOverrides();
  let disabledDefaults = loadDisabledDefaults();

  // Elements
  const menuGridEl = document.getElementById('menuGrid');
  const addMenuForm = document.getElementById('addMenuForm');
  const itemNameInput = document.getElementById('itemNameInput');
  const itemPriceInput = document.getElementById('itemPriceInput');
  const itemImageInput = document.getElementById('itemImageInput');
  const manageBtn = document.getElementById('manageBtn');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileSidebar = document.getElementById('mobileSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const printBtnMobile = document.getElementById('printBtnMobile');
  const manageBtnMobile = document.getElementById('manageBtnMobile');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const cartBodyEl = document.getElementById('cartTableBody');
  const subtotalEl = document.getElementById('subtotal');
  const itemCountEl = document.getElementById('itemCount');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const clearCartBtnBottom = document.getElementById('clearCartBtnBottom');
  const printBtn = document.getElementById('printBtn');
  const printBtnBottom = document.getElementById('printBtnBottom');
  const printDateEl = document.getElementById('printDate');

  // Render
  renderMenu();
  renderCart();
  wireGlobalActions();
  wireAddMenuForm();

  function renderMenu() {
    if (!menuGridEl) return;
    menuGridEl.innerHTML = '';
    getAllMenuItems().forEach((item) => {
      const card = document.createElement('div');
      card.className = 'menu-card';
      if (item.image) {
        const img = document.createElement('img');
        img.className = 'menu-image';
        img.alt = item.name;
        img.src = item.image;
        card.appendChild(img);
      }

      const title = document.createElement('div');
      title.className = 'menu-title';
      title.textContent = item.name;
      const price = document.createElement('div');
      price.className = 'menu-price';
      price.textContent = `₹${formatCurrency(item.price)}`;

      const actions = document.createElement('div');
      actions.className = 'menu-actions';

      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.step = '1';
      qtyInput.value = '1';
      qtyInput.className = 'qty-input no-manage';

      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary no-manage';
      addBtn.textContent = 'Add';
      addBtn.addEventListener('click', () => {
        const qty = clampQty(parseInt(qtyInput.value, 10));
        if (qty > 0) {
          addToCart(item.id, qty);
        }
      });

      actions.appendChild(qtyInput);
      actions.appendChild(addBtn);
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-ghost no-print manage-only';
      editBtn.textContent = 'Edit Price';
      editBtn.addEventListener('click', () => {
        const current = item.price;
        const input = prompt(`Enter new price for ${item.name}`, String(current));
        if (input == null) return;
        const next = Math.max(0, Math.floor(Number(input)));
        if (!Number.isFinite(next)) return;
        updateItemPrice(item.id, next, isCustomItem(item.id));
      });
      actions.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-ghost no-print manage-only';
      delBtn.style.color = '#ef4444';
      delBtn.textContent = isCustomItem(item.id) ? 'Delete' : 'Remove';
      delBtn.addEventListener('click', () => {
        if (!confirm(`Are you sure you want to ${isCustomItem(item.id) ? 'delete' : 'remove'} ${item.name}?`)) return;
        deleteItem(item.id);
      });
      actions.appendChild(delBtn);

      card.appendChild(title);
      card.appendChild(price);
      card.appendChild(actions);

      menuGridEl.appendChild(card);
    });
  }

  function renderCart() {
    if (!cartBodyEl) return;
    cartBodyEl.innerHTML = '';
    const entries = Object.values(cart);

    if (entries.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.className = 'muted';
      td.textContent = 'Cart is empty';
      tr.appendChild(td);
      cartBodyEl.appendChild(tr);
    } else {
      entries.forEach((entry) => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = entry.name;
        const tdPrice = document.createElement('td');
        tdPrice.className = 'num';
        tdPrice.textContent = `₹${formatCurrency(entry.unitPrice)}`;
        const tdQty = document.createElement('td');
        tdQty.className = 'num';
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.min = '0';
        qtyInput.step = '1';
        qtyInput.value = String(entry.quantity);
        qtyInput.className = 'qty-field';
        qtyInput.addEventListener('change', () => {
          const newQty = clampQty(parseInt(qtyInput.value, 10));
          updateQuantity(entry.id, newQty);
        });
        tdQty.appendChild(qtyInput);

        const tdLine = document.createElement('td');
        tdLine.className = 'num';
        tdLine.textContent = `₹${formatCurrency(entry.unitPrice * entry.quantity)}`;

        const tdActions = document.createElement('td');
        tdActions.className = 'no-print';
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => removeFromCart(entry.id));
        tdActions.appendChild(removeBtn);

        tr.appendChild(tdName);
        tr.appendChild(tdPrice);
        tr.appendChild(tdQty);
        tr.appendChild(tdLine);
        tr.appendChild(tdActions);
        cartBodyEl.appendChild(tr);
      });
    }

    const totals = calculateTotals();
    subtotalEl.textContent = `₹${formatCurrency(totals.subtotal)}`;
    itemCountEl.textContent = String(totals.itemCount);
  }

  function addToCart(itemId, qty) {
    const item = getAllMenuItems().find((i) => i.id === itemId);
    if (!item) return;
    const existing = cart[itemId];
    if (existing) {
      existing.quantity = clampQty(existing.quantity + qty);
      if (existing.quantity <= 0) delete cart[itemId];
    } else {
      cart[itemId] = {
        id: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: clampQty(qty)
      };
      if (cart[itemId].quantity <= 0) delete cart[itemId];
    }
    persistAndRender();
  }

  function updateQuantity(itemId, qty) {
    if (!cart[itemId]) return;
    if (qty <= 0) {
      delete cart[itemId];
    } else {
      cart[itemId].quantity = clampQty(qty);
    }
    persistAndRender();
  }

  function removeFromCart(itemId) {
    if (cart[itemId]) {
      delete cart[itemId];
      persistAndRender();
    }
  }

  function clearCart() {
    cart = {};
    persistAndRender();
  }

  function calculateTotals() {
    let subtotal = 0;
    let itemCount = 0;
    Object.values(cart).forEach((entry) => {
      subtotal += entry.unitPrice * entry.quantity;
      itemCount += entry.quantity;
    });
    return { subtotal, itemCount };
  }

  function persistAndRender() {
    saveCart();
    renderCart();
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (_) {}
  }

  function saveCustomMenu() {
    try {
      localStorage.setItem(CUSTOM_MENU_KEY, JSON.stringify(customMenu));
    } catch (_) {}
  }

  function savePriceOverrides() {
    try {
      localStorage.setItem(PRICE_OVERRIDES_KEY, JSON.stringify(priceOverrides));
    } catch (_) {}
  }

  function saveDisabledDefaults() {
    try {
      localStorage.setItem(DISABLED_DEFAULTS_KEY, JSON.stringify(disabledDefaults));
    } catch (_) {}
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      // Validate shape
      const valid = {};
      Object.values(parsed).forEach((e) => {
        if (!e || typeof e !== 'object') return;
        if (!e.id || typeof e.unitPrice !== 'number' || typeof e.quantity !== 'number') return;
        valid[e.id] = {
          id: String(e.id),
          name: String(e.name || e.id),
          unitPrice: Math.max(0, Math.floor(e.unitPrice)),
          quantity: clampQty(e.quantity)
        };
      });
      return valid;
    } catch (_) {
      return {};
    }
  }

  function loadCustomMenu() {
    try {
      const raw = localStorage.getItem(CUSTOM_MENU_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((e) => e && e.id && e.name && Number.isFinite(e.price)).map((e) => ({
        id: String(e.id),
        name: String(e.name),
        price: Math.max(0, Math.floor(Number(e.price))),
        image: e.image && typeof e.image === 'string' ? e.image : undefined
      }));
    } catch (_) {
      return [];
    }
  }

  function loadPriceOverrides() {
    try {
      const raw = localStorage.getItem(PRICE_OVERRIDES_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const out = {};
      Object.keys(parsed || {}).forEach((k) => {
        const v = Math.max(0, Math.floor(Number(parsed[k])));
        if (Number.isFinite(v)) out[k] = v;
      });
      return out;
    } catch (_) {
      return {};
    }
  }

  function loadDisabledDefaults() {
    try {
      const raw = localStorage.getItem(DISABLED_DEFAULTS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function wireGlobalActions() {
    const bind = (el, handler) => el && el.addEventListener('click', handler);
    bind(clearCartBtn, clearCart);
    bind(clearCartBtnBottom, clearCart);
    const printAction = () => {
      if (printDateEl) {
        const now = new Date();
        printDateEl.textContent = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      }
      window.print();
    };
    bind(printBtn, printAction);
    bind(printBtnBottom, printAction);
    bind(printBtnMobile, printAction);
    bind(manageBtn, () => {
      const body = document.body;
      const on = body.classList.toggle('manage-on');
      if (manageBtn) manageBtn.textContent = on ? 'Done' : 'Menu Management';
    });
    bind(manageBtnMobile, () => {
      const body = document.body;
      const on = body.classList.toggle('manage-on');
      if (manageBtn) manageBtn.textContent = on ? 'Done' : 'Menu Management';
      if (manageBtnMobile) manageBtnMobile.textContent = on ? 'Done' : 'Menu Management';
      body.classList.remove('sidebar-open');
    });
    bind(hamburgerBtn, () => {
      document.body.classList.toggle('sidebar-open');
    });
    bind(sidebarOverlay, () => {
      document.body.classList.remove('sidebar-open');
    });
    bind(closeSidebarBtn, () => {
      document.body.classList.remove('sidebar-open');
    });
  }

  function wireAddMenuForm() {
    if (!addMenuForm) return;
    addMenuForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = String(itemNameInput.value || '').trim();
      const priceVal = Math.max(0, Math.floor(Number(itemPriceInput.value)));
      if (!name || !Number.isFinite(priceVal)) return;
      const file = itemImageInput && itemImageInput.files && itemImageInput.files[0];
      const finalize = (imageDataUrl) => {
        const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newItem = { id, name, price: priceVal };
        if (imageDataUrl) newItem.image = imageDataUrl;
        customMenu.push(newItem);
        saveCustomMenu();
        addMenuForm.reset();
        renderMenu();
      };
      if (file) {
        const reader = new FileReader();
        reader.onload = () => finalize(reader.result);
        reader.readAsDataURL(file);
      } else {
        finalize(undefined);
      }
    });
  }

  function getAllMenuItems() {
    const defaults = MENU_ITEMS
      .filter((d) => !disabledDefaults[d.id])
      .map((d) => ({ ...d, price: priceOverrides[d.id] ?? d.price }));
    return [...defaults, ...customMenu];
  }

  function isCustomItem(id) {
    return id.startsWith('custom-');
  }

  function updateItemPrice(id, newPrice, custom) {
    if (custom) {
      const idx = customMenu.findIndex((i) => i.id === id);
      if (idx !== -1) {
        customMenu[idx].price = newPrice;
        saveCustomMenu();
        renderMenu();
      }
    } else {
      priceOverrides[id] = newPrice;
      savePriceOverrides();
      renderMenu();
    }
  }

  function deleteItem(id) {
    if (isCustomItem(id)) {
      customMenu = customMenu.filter((i) => i.id !== id);
      saveCustomMenu();
    } else {
      disabledDefaults[id] = true;
      saveDisabledDefaults();
    }
    renderMenu();
  }

  function clampQty(n) {
    if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
    const i = Math.max(0, Math.min(999, Math.floor(n)));
    return i;
  }

  function formatCurrency(n) {
    return Number(n).toLocaleString('en-IN');
  }
})();


