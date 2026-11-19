/**
 * Bakerz Bite - Cart State & Drawer Controller
 * Handles persistent shopping cart in localStorage, drawer UI, and discounts
 */

(function () {
  const CART_STORAGE_KEY = 'bakerz_bite_cart';
  const PROMO_STORAGE_KEY = 'bakerz_bite_promo';

  // Coupon catalog shared by the offers page, cart drawer, cart page and checkout.
  // `free` coupons need no minimum; every other coupon is gated by `min` basket value.
  const PROMO_CATALOG = window.BakerzPromos = {
    SWEET10:   { type: 'percent',  value: 10,   min: 0,    free: true,  label: '10% OFF',       desc: '10% off your entire bakery basket.', badge: 'bg-warning text-dark' },
    BAKERZ20:  { type: 'percent',  value: 20,   min: 2000, free: false, label: '20% OFF',       desc: '20% off orders of Rs. 2,000 or more.', badge: 'bg-danger text-white' },
    FREESHIP:  { type: 'shipping', value: 0,    min: 0,    free: true,  label: 'FREE DELIVERY', desc: 'No delivery fee on your order.', badge: 'bg-success text-white' },
    WEEKEND5:  { type: 'percent',  value: 5,    min: 0,    free: true,  label: '5% OFF',        desc: '5% off any basket — weekend treat.', badge: 'bg-primary text-white' },
    SWEETBITE: { type: 'flat',     value: 250,  min: 1000, free: false, label: 'Rs. 250 OFF',   desc: 'Rs. 250 off orders of Rs. 1,000 or more.', badge: 'bg-danger text-white' },
    DELIGHT100:{ type: 'flat',     value: 100,  min: 1500, free: false, label: 'Rs. 100 OFF',   desc: 'Rs. 100 off when your basket reaches Rs. 1,500.', badge: 'bg-info text-dark' },
    CRUMB200:  { type: 'flat',     value: 200,  min: 1800, free: false, label: 'Rs. 200 OFF',   desc: 'Rs. 200 off orders of Rs. 1,800 or more.', badge: 'bg-warning text-dark' },
    FESTIVE300:{ type: 'flat',     value: 300,  min: 2500, free: false, label: 'Rs. 300 OFF',   desc: 'Rs. 300 off festive orders of Rs. 2,500 or more.', badge: 'bg-danger text-white' },
    FEAST400:  { type: 'flat',     value: 400,  min: 3000, free: false, label: 'Rs. 400 OFF',   desc: 'Rs. 400 off family feasts of Rs. 3,000 or more.', badge: 'bg-success text-white' },
    SLICE15:   { type: 'percent',  value: 15,   min: 3500, free: false, label: '15% OFF',       desc: '15% off celebration orders of Rs. 3,500 or more.', badge: 'bg-pink text-dark' },
    TEA500:    { type: 'flat',     value: 500,  min: 4000, free: false, label: 'Rs. 500 OFF',   desc: 'Rs. 500 off orders of Rs. 4,000 or more.', badge: 'bg-primary text-white' },
    BULK12:    { type: 'percent',  value: 12,   min: 5000, free: false, label: '12% OFF',       desc: '12% off bulk catering orders of Rs. 5,000 or more.', badge: 'bg-dark text-white' },
    MEGA25:    { type: 'percent',  value: 25,   min: 7000, free: false, label: '25% OFF',       desc: '25% off mega orders of Rs. 7,000 or more.', badge: 'bg-danger text-white' },
    GRAND1000: { type: 'flat',     value: 1000, min: 8000, free: false, label: 'Rs. 1,000 OFF', desc: 'Rs. 1,000 off grand event orders of Rs. 8,000 or more.', badge: 'bg-warning text-dark' }
  };

  window.BakerzCart = {
    getItems: function () {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error("Error reading cart", e);
        return [];
      }
    },
    saveItems: function (items) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      this.updateBadges();
      this.renderDrawer();
      window.dispatchEvent(new CustomEvent('bakerz:cart-updated'));
    },

    addItem: function (productOrId, quantity, customNotes) {
      const qty = parseInt(quantity, 10) || 1;
      let product = null;

      if (typeof productOrId === 'string') {
        product = (window.BakerzProducts || []).find(p => p.id === productOrId);
      } else {
        product = productOrId;
      }

      if (!product) return;

      const items = this.getItems();
      const existing = items.find(i => i.id === product.id && i.notes === (customNotes || ''));

      if (existing) {
        existing.quantity += qty;
      } else {
        items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          categoryName: product.categoryName || 'Bakery Item',
          icon: product.icon || '🧁',
          placeholderBg: product.placeholderBg || 'placeholder-bg-cake',
          quantity: qty,
          notes: customNotes || '',
          imageAsset: product.imageAsset || '',
          giftItems: product.giftItems || undefined
        });
      }

      this.saveItems(items);
      this.animateBadge();

      const savedLine = this.getItems().find(i => i.id === product.id && i.notes === (customNotes || ''));
      if (savedLine) {
        this.showAddPopup(savedLine, qty);
      }
    },

    updateQuantity: function (id, notes, newQty) {
      let items = this.getItems();
      if (newQty <= 0) {
        items = items.filter(i => !(i.id === id && i.notes === (notes || '')));
      } else {
        const item = items.find(i => i.id === id && i.notes === (notes || ''));
        if (item) item.quantity = newQty;
      }
      this.saveItems(items);
    },

    updateQuantityByIndex: function (index, newQty) {
      let items = this.getItems();
      if (index < 0 || index >= items.length) return;
      if (newQty <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = newQty;
      }
      this.saveItems(items);
    },

    removeItem: function (id, notes) {
      let items = this.getItems();
      const index = items.findIndex(i => i.id === id && i.notes === (notes || ''));
      if (index === -1) return;
      const removed = items[index];
      items.splice(index, 1);
      this.saveItems(items);
      this.showUndoToast(removed, index);
    },

    removeItemByIndex: function (index) {
      let items = this.getItems();
      if (index < 0 || index >= items.length) return;
      const removed = items.splice(index, 1)[0];
      this.saveItems(items);
      this.showUndoToast(removed, index);
    },

    showUndoToast: function (item, index) {
      if (!window.BakerzToasts) return;
      window.BakerzToasts.show(`Removed ${item.name} from basket`, 'info', '🗑️', {
        duration: 6000,
        actionLabel: 'Undo',
        onAction: () => this.restoreItem(item, index)
      });
    },

    restoreItem: function (item, index) {
      if (!item) return;
      const items = this.getItems();
      const at = Math.min(Math.max(0, index), items.length);
      items.splice(at, 0, item);
      this.saveItems(items);
      if (window.BakerzToasts) {
        window.BakerzToasts.show(`${item.name} restored to your basket.`, 'success', '↩️');
      }
    },

    clear: function () {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(PROMO_STORAGE_KEY);
      this.updateBadges();
      this.renderDrawer();
      window.dispatchEvent(new CustomEvent('bakerz:cart-updated'));
    },

    getPromo: function () {
      return localStorage.getItem(PROMO_STORAGE_KEY) || '';
    },

    setPromo: function (code) {
      const normalized = code.trim().toUpperCase();
      if (normalized) {
        localStorage.setItem(PROMO_STORAGE_KEY, normalized);
      } else {
        localStorage.removeItem(PROMO_STORAGE_KEY);
      }
      ['homePromoInput', 'drawerPromoInput', 'cartPagePromoInput'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = normalized;
      });
      this.renderDrawer();
      window.dispatchEvent(new CustomEvent('bakerz:cart-updated'));
    },

    getSummary: function () {
      const items = this.getItems();
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const freeThreshold = 1500;
      const standardFee = 150;
      let deliveryFee = subtotal >= freeThreshold || subtotal === 0 ? 0 : standardFee;
      let discount = 0;
      const promo = this.getPromo();
      const promoDef = PROMO_CATALOG[promo];

      if (promoDef && subtotal > 0 && subtotal >= promoDef.min) {
        if (promoDef.type === 'percent') {
          discount = Math.round(subtotal * promoDef.value / 100);
        } else if (promoDef.type === 'flat') {
          discount = Math.min(promoDef.value, subtotal);
        } else if (promoDef.type === 'shipping') {
          deliveryFee = 0;
        }
      }

      const total = Math.max(0, subtotal - discount + deliveryFee);
      const points = Math.floor(total / 50);

      return {
        subtotal,
        discount,
        deliveryFee,
        total,
        points,
        promo
      };
    },

    updateBadges: function () {
      const items = this.getItems();
      const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
      document.querySelectorAll('.cart-count-badge').forEach(badge => {
        badge.textContent = totalCount;
        badge.style.display = totalCount > 0 ? 'flex' : 'none';
      });
    },

    animateBadge: function () {
      document.querySelectorAll('.cart-count-badge').forEach(badge => {
        badge.classList.remove('badge-pop');
        void badge.offsetWidth; // trigger reflow
        badge.classList.add('badge-pop');
      });
    },

    /* ---------- Premium add-to-bag confirmation ---------- */
    A2B_DURATION: 4000,
    _a2bEl: null,
    _a2bVisible: false,
    _a2bTimer: null,
    _a2bHideTimer: null,
    _a2bLiveTimer: null,
    _a2bDeadline: 0,
    _a2bRemaining: 0,
    _a2bPaused: false,
    _a2bHovered: false,
    _a2bFocused: false,
    _a2bPrevFocus: null,

    ensureAddPopup: function () {
      if (this._a2bEl && this._a2bEl.isConnected) return this._a2bEl;

      const el = document.createElement('aside');
      el.className = 'bb-a2b';
      el.id = 'bbAddPopup';
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', 'Added to your bag');
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `
        <p class="visually-hidden" id="bbA2bStatus" role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="bb-a2b-card">
          <button type="button" class="bb-a2b-close" data-a2b-close aria-label="Dismiss added to bag message">
            <span aria-hidden="true">&times;</span>
          </button>
          <div class="bb-a2b-head">
            <span class="bb-a2b-check" aria-hidden="true">
              <svg viewBox="0 0 52 52" focusable="false">
                <circle cx="26" cy="26" r="23"></circle>
                <path d="M15 28l7.5 7.5L38 19"></path>
              </svg>
            </span>
            <div class="bb-a2b-headtext">
              <p class="bb-a2b-eyebrow">Fresh from the oven</p>
              <h2 class="bb-a2b-title" id="bbA2bTitle">Added to Your Bag</h2>
              <p class="bb-a2b-added" id="bbA2bAdded"></p>
            </div>
          </div>
          <div class="bb-a2b-product" id="bbA2bProduct"></div>
          <div class="bb-a2b-summary" id="bbA2bSummary"></div>
          <div class="bb-a2b-actions">
            <a href="cart.html" class="bb-a2b-btn bb-a2b-btn-primary" data-a2b-view>View My Cart</a>
            <button type="button" class="bb-a2b-btn bb-a2b-btn-ghost" data-a2b-continue>Continue Shopping</button>
          </div>
          <div class="bb-a2b-timer" aria-hidden="true"><span></span></div>
        </div>
      `;
      document.body.appendChild(el);
      this._a2bEl = el;

      el.querySelector('[data-a2b-close]').addEventListener('click', () => this.dismissAddPopup(false, true));
      el.querySelector('[data-a2b-continue]').addEventListener('click', () => this.dismissAddPopup(false, true));

      el.querySelector('[data-a2b-view]').addEventListener('click', (event) => {
        event.preventDefault();
        this.dismissAddPopup(true);
        const drawer = document.getElementById('cartDrawer');
        const overlay = document.getElementById('cartDrawerOverlay');
        if (drawer && overlay) {
          this.openDrawer();
        } else if (/cart\.html$/i.test(window.location.pathname)) {
          const layout = document.getElementById('cartPageLayout');
          const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (layout) layout.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        } else {
          window.location.href = 'cart.html';
        }
      });

      el.addEventListener('pointerenter', () => {
        this._a2bHovered = true;
        this.pauseAddPopup();
      });
      el.addEventListener('pointerleave', () => {
        this._a2bHovered = false;
        this.resumeAddPopup();
      });
      el.addEventListener('pointerdown', () => this.pauseAddPopup());
      el.addEventListener('focusin', () => {
        this._a2bFocused = true;
        this.pauseAddPopup();
      });
      el.addEventListener('focusout', () => {
        window.setTimeout(() => {
          if (!el.contains(document.activeElement)) {
            this._a2bFocused = false;
            this.resumeAddPopup();
          }
        }, 0);
      });
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          this.dismissAddPopup(false, true);
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !this._a2bVisible || event.defaultPrevented) return;
        if (document.querySelector('.modal.show')) return;
        const drawer = document.getElementById('cartDrawer');
        if (drawer && drawer.classList.contains('open')) return;
        this.dismissAddPopup(false, true);
      });

      document.addEventListener('show.bs.modal', () => {
        if (this._a2bVisible) this.dismissAddPopup(true);
      });

      const reposition = () => {
        if (this._a2bVisible) this._a2bPosition();
      };
      window.addEventListener('scroll', reposition, { passive: true });
      window.addEventListener('resize', reposition);

      return el;
    },

    _a2bPosition: function () {
      const el = this._a2bEl;
      if (!el) return;
      if (window.matchMedia('(max-width: 575.98px), (max-height: 480px)').matches) {
        el.style.top = '';
        el.style.removeProperty('--a2b-top');
        return;
      }
      const header = document.querySelector('header.bakerz-navbar') || document.querySelector('header');
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const top = Math.max(22, Math.round(headerBottom) + 12);
      el.style.top = `${top}px`;
      el.style.setProperty('--a2b-top', `${top}px`);
    },

    showAddPopup: function (line, addedQty) {
      if (!line || !(addedQty > 0)) return;

      const items = this.getItems();
      if (!items.some(item => item.id === line.id && item.notes === line.notes)) return;

      const el = this.ensureAddPopup();
      const escape = this.escapeHtml;
      const wasVisible = this._a2bVisible;
      window.clearTimeout(this._a2bHideTimer);

      const qty = line.quantity || 1;
      const unitPrice = Number(line.price) || 0;
      const lineTotal = unitPrice * qty;
      const summary = this.getSummary();
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      if (!wasVisible) {
        const active = document.activeElement;
        this._a2bPrevFocus = active && active !== document.body && !el.contains(active) ? active : null;
        this._a2bHovered = el.matches(':hover');
        this._a2bFocused = el.contains(document.activeElement);
      }

      el.querySelector('#bbA2bAdded').innerHTML = `Added <strong>${addedQty} &times;</strong> ${escape(line.name)}`;
      el.querySelector('#bbA2bProduct').innerHTML = `
        <div class="bb-a2b-thumb ${escape(line.placeholderBg || 'placeholder-bg-cake')}">
          ${line.imageAsset ? `<img src="${escape(line.imageAsset)}" alt="" loading="lazy" decoding="async" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.hidden = false;">` : ''}
          <span class="bb-a2b-thumb-icon" ${line.imageAsset ? 'hidden' : ''} aria-hidden="true">${escape(line.icon || '🧁')}</span>
        </div>
        <div class="bb-a2b-prodmeta">
          <p class="bb-a2b-cat">${escape(line.categoryName || 'Bakery Item')}</p>
          <p class="bb-a2b-name" title="${escape(line.name)}">${escape(line.name)}</p>
          ${line.notes ? `<p class="bb-a2b-notes" title="${escape(line.notes)}">${escape(line.notes)}</p>` : ''}
        </div>
        <div class="bb-a2b-price">
          <span class="bb-a2b-qty">Qty ${qty}</span>
          <span class="bb-a2b-line">Rs. ${lineTotal.toLocaleString()}</span>
          <span class="bb-a2b-unit">Rs. ${unitPrice.toLocaleString()} each</span>
        </div>
      `;

      const shipping = summary.subtotal >= 1500
        ? '<span class="bb-a2b-ship is-free">Free delivery unlocked</span>'
        : `<span class="bb-a2b-ship">Rs. ${(1500 - summary.subtotal).toLocaleString()} away from free delivery</span>`;

      el.querySelector('#bbA2bSummary').innerHTML = `
        <div class="bb-a2b-sumrow">
          <span>Bag subtotal <span class="bb-a2b-count">${itemCount} item${itemCount === 1 ? '' : 's'}</span></span>
          <strong>Rs. ${summary.subtotal.toLocaleString()}</strong>
        </div>
        ${shipping}
      `;

      el.classList.remove('is-leaving');
      el.setAttribute('aria-hidden', 'false');
      this._a2bPosition();
      this._a2bVisible = true;
      this._a2bPaused = this._a2bHovered || this._a2bFocused;
      el.classList.toggle('is-paused', this._a2bPaused);

      if (wasVisible) {
        el.classList.remove('is-refreshing');
        void el.offsetWidth;
        el.classList.add('is-refreshing');
      } else {
        void el.offsetWidth;
        el.classList.add('is-visible');
      }

      this._a2bRestartBar();
      this._a2bRemaining = this.A2B_DURATION;
      this._a2bStartTimer();

      window.clearTimeout(this._a2bLiveTimer);
      const live = el.querySelector('#bbA2bStatus');
      this._a2bLiveTimer = window.setTimeout(() => {
        if (!this._a2bVisible || !live) return;
        live.textContent = `Added ${addedQty} ${line.name} to your bag. ${qty} of this item now in your bag. Bag subtotal Rs. ${summary.subtotal.toLocaleString()}.`;
      }, 80);
    },

    _a2bRestartBar: function () {
      const bar = this._a2bEl && this._a2bEl.querySelector('.bb-a2b-timer span');
      if (!bar) return;
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = `bbA2bCountdown ${this.A2B_DURATION}ms linear forwards`;
    },

    _a2bStartTimer: function () {
      window.clearTimeout(this._a2bTimer);
      this._a2bDeadline = Date.now() + this._a2bRemaining;
      if (this._a2bPaused) return;
      this._a2bTimer = window.setTimeout(() => this.dismissAddPopup(), this._a2bRemaining);
    },

    pauseAddPopup: function () {
      if (!this._a2bVisible || this._a2bPaused) return;
      this._a2bRemaining = Math.max(0, this._a2bDeadline - Date.now());
      this._a2bPaused = true;
      window.clearTimeout(this._a2bTimer);
      if (this._a2bEl) this._a2bEl.classList.add('is-paused');
    },

    resumeAddPopup: function () {
      if (!this._a2bVisible || this._a2bHovered || this._a2bFocused || !this._a2bPaused) return;
      this._a2bPaused = false;
      if (this._a2bEl) this._a2bEl.classList.remove('is-paused');
      if (this._a2bRemaining <= 0) {
        this.dismissAddPopup();
        return;
      }
      this._a2bStartTimer();
    },

    dismissAddPopup: function (immediate, restoreFocus) {
      const el = this._a2bEl;
      if (!el || !this._a2bVisible) return;

      window.clearTimeout(this._a2bTimer);
      window.clearTimeout(this._a2bHideTimer);
      window.clearTimeout(this._a2bLiveTimer);
      this._a2bTimer = null;
      this._a2bVisible = false;
      this._a2bPaused = false;
      this._a2bHovered = false;
      this._a2bFocused = false;

      const active = document.activeElement;
      if (el.contains(active)) {
        const prev = this._a2bPrevFocus;
        if (restoreFocus && prev && prev.isConnected) {
          try { prev.focus({ preventScroll: true }); } catch (e) {}
        } else if (active instanceof HTMLElement) {
          active.blur();
        }
      }
      this._a2bPrevFocus = null;

      el.classList.remove('is-visible', 'is-paused', 'is-refreshing');
      el.setAttribute('aria-hidden', 'true');

      if (immediate) {
        el.classList.add('is-leaving', 'is-instant');
        window.setTimeout(() => el.classList.remove('is-leaving', 'is-instant'), 60);
      } else {
        el.classList.add('is-leaving');
        this._a2bHideTimer = window.setTimeout(() => el.classList.remove('is-leaving'), 320);
      }
    },

    openDrawer: function () {
      this.dismissAddPopup(true);
      const modal = document.querySelector('.modal.show');
      if (modal && window.bootstrap) {
        // A modal's focus trap prevents typing into the basket until it is fully hidden.
        modal.addEventListener('hidden.bs.modal', () => this.openDrawer(), { once: true });
        const instance = bootstrap.Modal.getInstance(modal);
        instance.hide();
        if (modal.classList.contains('show')) {
          modal.addEventListener('shown.bs.modal', () => instance.hide(), { once: true });
        }
        return;
      }
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartDrawerOverlay');
      if (drawer && overlay) {
        drawer.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    },

    closeDrawer: function () {
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartDrawerOverlay');
      if (drawer && overlay) {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    },

    escapeHtml: function (str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    renderDrawer: function () {
      const container = document.getElementById('cartDrawerItems');
      const summaryContainer = document.getElementById('cartDrawerSummary');
      if (!container) return;

      const items = this.getItems();
      const summary = this.getSummary();
      const escape = this.escapeHtml;
      const promoInput = document.getElementById('drawerPromoInput');
      const promoDraft = promoInput ? promoInput.value : summary.promo;
      const promoFocused = promoInput === document.activeElement;
      const selectionStart = promoInput?.selectionStart;
      const selectionEnd = promoInput?.selectionEnd;

      if (items.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5">
            <div style="font-size: 4rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));" class="anim-float">🧁</div>
            <h5 class="mt-3 brand-font">Your basket is empty!</h5>
            <p class="text-muted small">Looks like you haven't picked any freshly baked delights yet.</p>
            <a href="menu.html" class="btn btn-bb btn-bb-pink btn-bb-sm mt-2" onclick="BakerzCart.closeDrawer()">
              Explore Sweet Menu
            </a>
          </div>
        `;
        if (summaryContainer) summaryContainer.innerHTML = '';
        return;
      }

      let html = '';
      items.forEach((item, index) => {
        const safeName = escape(item.name);
        const safeNotes = escape(item.notes);
        html += `
          <div class="cart-item-row align-items-center">
            <div class="cart-item-img position-relative overflow-hidden ${item.placeholderBg || 'placeholder-bg-cake'}" style="width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0; background: var(--bb-cream);">
              <img loading="lazy" decoding="async" src="${item.imageAsset || ''}" alt="${safeName}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
              <span style="display: ${item.imageAsset ? 'none' : 'flex'}; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 1.5rem;">${item.icon || '🧁'}</span>
            </div>
            <div class="flex-grow-1 min-w-0 ps-2">
              <h6 class="mb-0 text-truncate brand-font" title="${safeName}">${safeName}</h6>
              <div class="text-muted small">Rs. ${Number(item.price || 0).toLocaleString()}</div>
              ${item.notes ? `<div class="badge bg-light text-dark border small mt-1 text-wrap text-start font-monospace" style="font-size: 0.72rem;">${safeNotes}</div>` : ''}
            </div>
            <div class="d-flex align-items-center gap-1">
              <button type="button" class="cart-qty-btn" aria-label="Decrease quantity" data-cart-action="dec" data-item-index="${index}">-</button>
              <span class="px-2 fw-bold" style="font-size: 0.95rem;">${item.quantity}</span>
              <button type="button" class="cart-qty-btn" aria-label="Increase quantity" data-cart-action="inc" data-item-index="${index}">+</button>
            </div>
            <button type="button" class="btn btn-link text-danger p-1" aria-label="Remove item" data-cart-action="remove" data-item-index="${index}">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        `;
      });
      container.innerHTML = html;

      // Event delegation for cart actions (completely immune to apostrophes/quotes in custom cake notes)
      if (!container._boundCartDelegation) {
        container.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-cart-action]');
          if (!btn) return;
          const action = btn.getAttribute('data-cart-action');
          const idx = parseInt(btn.getAttribute('data-item-index'), 10);
          const currentItems = BakerzCart.getItems();
          if (isNaN(idx) || !currentItems[idx]) return;

          if (action === 'dec') {
            BakerzCart.updateQuantityByIndex(idx, currentItems[idx].quantity - 1);
          } else if (action === 'inc') {
            BakerzCart.updateQuantityByIndex(idx, currentItems[idx].quantity + 1);
          } else if (action === 'remove') {
            BakerzCart.removeItemByIndex(idx);
          }
        });
        container._boundCartDelegation = true;
      }

      if (summaryContainer) {
        summaryContainer.innerHTML = `
          <div class="d-flex justify-content-between mb-1">
            <span class="text-muted">Subtotal</span>
            <span class="fw-bold">Rs. ${summary.subtotal.toLocaleString()}</span>
          </div>
          ${summary.discount > 0 ? `
            <div class="d-flex justify-content-between mb-1 text-success">
              <span>Discount (${escape(summary.promo)})</span>
              <span>- Rs. ${summary.discount.toLocaleString()}</span>
            </div>
          ` : ''}
          <div class="d-flex justify-content-between mb-2">
            <span class="text-muted">Delivery</span>
            <span>${summary.deliveryFee === 0 ? '<span class="badge bg-success text-white">FREE</span>' : 'Rs. ' + summary.deliveryFee}</span>
          </div>
          <div class="border-top pt-2 d-flex justify-content-between align-items-center mb-3">
            <span class="fw-bold brand-font" style="font-size: 1.15rem;">Total</span>
            <span class="fw-bold brand-font text-danger" style="font-size: 1.35rem;">Rs. ${summary.total.toLocaleString()}</span>
          </div>
          <form class="bb-promo-form mb-2" onsubmit="BakerzCart.applyPromo('drawerPromoInput'); return false;">
            <label for="drawerPromoInput" class="small fw-bold mb-1">Promo code</label>
            <div class="d-flex gap-2">
              <input type="text" id="drawerPromoInput" class="form-control form-control-bb py-1 px-2 small" placeholder="e.g. SWEET10" value="${escape(promoDraft)}" maxlength="32" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="drawerPromoInputFeedback">
              <button type="submit" class="btn btn-bb btn-bb-yellow btn-bb-sm">Apply</button>
            </div>
            <div id="drawerPromoInputFeedback" class="small mt-1" role="status"></div>
            <button type="button" class="btn btn-link text-muted btn-sm p-0 mt-1" onclick="BakerzCart.removePromo('drawerPromoInput')">Remove applied code</button>
          </form>
          <div class="d-grid gap-2">
            <a href="checkout.html" class="btn btn-bb btn-bb-primary" onclick="BakerzCart.closeDrawer()">
              Proceed to Checkout <i class="bi bi-arrow-right"></i>
            </a>
            <a href="cart.html" class="btn btn-bb btn-bb-outline btn-bb-sm" onclick="BakerzCart.closeDrawer()">
              View Full Cart
            </a>
          </div>
        `;
        if (promoFocused) {
          const nextInput = document.getElementById('drawerPromoInput');
          nextInput.focus({ preventScroll: true });
          nextInput.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    },

    applyPromo: function (inputId) {
      const input = document.getElementById(inputId);
      const code = input.value.trim().toUpperCase();
      const promoDef = PROMO_CATALOG[code];
      const summary = this.getSummary();
      let message = code ? 'Unknown code. Check the Offers page for valid coupons.' : 'Please enter a promo code.';
      let messageClass = 'text-danger';
      let applied = false;

      if (promoDef) {
        if (summary.subtotal < promoDef.min) {
          message = `${code} needs a basket of Rs. ${promoDef.min.toLocaleString()}. Spend Rs. ${(promoDef.min - summary.subtotal).toLocaleString()} more to unlock it.`;
        } else {
          this.setPromo(code);
          applied = true;
          message = `Coupon ${code} applied to your basket.`;
          messageClass = 'text-success';
        }
      }

      const currentInput = document.getElementById(inputId);
      currentInput.setAttribute('aria-invalid', String(!applied));
      const feedback = document.getElementById(`${inputId}Feedback`);
      feedback.textContent = message;
      feedback.className = `small mt-1 ${messageClass}`;
      return applied;
    },

    removePromo: function (inputId) {
      this.setPromo('');
      document.getElementById(inputId).setAttribute('aria-invalid', 'false');
      const feedback = document.getElementById(`${inputId}Feedback`);
      feedback.textContent = 'Promo code removed.';
      feedback.className = 'small mt-1 text-success';
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.BakerzCart.updateBadges();
    window.BakerzCart.renderDrawer();
    ['homePromoInput', 'cartPagePromoInput'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = window.BakerzCart.getPromo();
    });

    const openBtns = document.querySelectorAll('.cart-drawer-trigger');
    openBtns.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        window.BakerzCart.openDrawer();
      });
    });

    const closeBtn = document.getElementById('cartDrawerCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        window.BakerzCart.closeDrawer();
      });
    }

    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) {
      overlay.addEventListener('click', function () {
        window.BakerzCart.closeDrawer();
      });
    }
  });
})();
