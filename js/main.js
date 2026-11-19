/**
 * Bakerz Bite - Main Application Controller
 * Handles live clock, scroll progress, sticky navbar, search modal, and animations
 */

(function () {
  // 1. Live Dynamic Date & Clock
  function updateLiveClock() {
    const clockEls = document.querySelectorAll('.dynamic-live-clock');
    if (clockEls.length === 0) return;

    const now = new Date();
    const options = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    const timeString = now.toLocaleDateString('en-US', options);

    clockEls.forEach(el => {
      el.textContent = timeString;
    });
  }

  // 2. Scroll Reading Progress Bar & Sticky Header
  function initScrollBehaviors() {
    const progressBar = document.getElementById('readingProgressBar');
    const navbar = document.querySelector('.bakerz-navbar');

    let scrollTicking = false;

    window.addEventListener('scroll', function () {
      if (scrollTicking) return;
      scrollTicking = true;

      requestAnimationFrame(function () {
        scrollTicking = false;
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = height > 0 ? (winScroll / height) * 100 : 0;

        if (progressBar) {
          progressBar.style.width = scrolled + '%';
        }

        if (navbar) {
          if (winScroll > 40) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
        }
      });
    }, { passive: true });
  }

  // 4. Scroll Reveal Observer
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal-on-scroll');
    if (reveals.length === 0) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      reveals.forEach(r => observer.observe(r));
    } else {
      reveals.forEach(r => r.classList.add('is-visible'));
    }
  }

  // 5. Configurable Bakery Location Injection
  function injectConfig() {
    const config = window.BakerzConfig || {};
    document.querySelectorAll('.bakery-location-display').forEach(el => {
      el.textContent = config.location || 'Main Boulevard, North Nazimabad, Karachi';
    });
    document.querySelectorAll('.bakery-phone-display').forEach(el => {
      el.textContent = config.phone || '0302 2669408';
    });
    document.querySelectorAll('.bakery-hours-display').forEach(el => {
      el.textContent = config.openingHours || '8:00 AM – 11:30 PM';
    });
  }

  // 6. Global Quick Search Modal (Auto-provisions modal if missing on any page)
  window.BakerzSearch = {
    ensureModal: function () {
      if (document.getElementById('globalSearchModal')) return;
      const modalDiv = document.createElement('div');
      modalDiv.className = 'modal fade';
      modalDiv.id = 'globalSearchModal';
      modalDiv.tabIndex = -1;
      modalDiv.setAttribute('aria-labelledby', 'globalSearchModalTitle');
      modalDiv.setAttribute('aria-hidden', 'true');
      modalDiv.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content bb-modal-content">
            <div class="modal-header bb-modal-header">
              <h5 class="modal-title brand-font" id="globalSearchModalTitle">Search Bakerz Bite</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body bb-modal-body">
              <div class="bb-search-row mb-3">
                <button type="button" class="bb-search-icon" aria-label="Search" onclick="document.getElementById('globalSearchInput').focus()">
                  <i class="bi bi-search"></i>
                </button>
                <input type="text" id="globalSearchInput" class="form-control form-control-bb" placeholder="Search menu by name or category..." oninput="BakerzSearch.handleSearchInput(this.value)">
              </div>
              <div id="globalSearchResults"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalDiv);
    },

    open: function () {
      this.ensureModal();
      this.bindInput();
      const modalEl = document.getElementById('globalSearchModal');
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
        const input = document.getElementById('globalSearchInput');
        if (input && !input.value.trim()) this.renderRecommendations();
        setTimeout(() => {
          if (input) input.focus();
        }, 200);
      }
    },

    escapeHtml: function (str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    getRecommendations: function () {
      const products = window.BakerzProducts || [];
      const categories = ['cakes', 'cookies', 'pastries', 'pies', 'breads', 'savory'];
      return categories
        .map(cat => products.find(p => p.category === cat && p.featured) || products.find(p => p.category === cat))
        .filter(Boolean);
    },

    renderRecommendations: function () {
      const container = document.getElementById('globalSearchResults');
      if (!container) return;

      const chips = this.getRecommendations().map(p => `
        <button type="button" class="bb-search-chip" data-query="${this.escapeHtml(p.name)}" onclick="BakerzSearch.applySuggestion(this.dataset.query)">
          <span class="bb-search-chip-icon">${p.icon || '🧁'}</span>
          <span>${this.escapeHtml(p.name)}</span>
          <span class="bb-search-chip-price">Rs. ${Number(p.price || 0).toLocaleString()}</span>
        </button>
      `).join('');

      container.innerHTML = `
        <div class="bb-search-recs">
          <div class="bb-search-recs-head">
            <span class="bb-search-recs-title">Popular picks</span>
            <span class="bb-search-recs-note">Tap a treat to search</span>
          </div>
          <div class="bb-search-chips">${chips}</div>
        </div>
      `;
    },

    applySuggestion: function (query) {
      const input = document.getElementById('globalSearchInput');
      if (!input) return;
      input.value = query;
      input.focus();
      this.handleSearchInput(query);
    },

    bindInput: function () {
      const input = document.getElementById('globalSearchInput');
      if (!input || input.dataset.recBound === '1') return;
      input.dataset.recBound = '1';
      input.addEventListener('focus', () => {
        if (!input.value.trim()) this.renderRecommendations();
      });
    },

    handleSearchInput: function (val) {
      const query = val.trim().toLowerCase();
      const resultsContainer = document.getElementById('globalSearchResults');
      if (!resultsContainer) return;

      if (!query) {
        this.renderRecommendations();
        return;
      }

      const products = (window.BakerzProducts || []).filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );

      if (products.length === 0) {
        resultsContainer.innerHTML = `
          <div class="text-center text-muted py-4">
            <span style="font-size: 2rem;">🧁</span>
            <div class="mt-2 small">No delights found for "${val}".</div>
          </div>
        `;
        return;
      }

      let html = '<div class="list-group list-group-flush">';
      products.slice(0, 6).forEach(p => {
        const safeId = (p.id || '').replace(/['"]/g, '');
        const safeName = (p.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `
          <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3">
            <div class="d-flex align-items-center gap-3">
              <div style="width: 44px; height: 44px; border-radius: 8px; overflow: hidden; background: var(--bb-cream); flex-shrink: 0;" class="position-relative">
                <img loading="lazy" decoding="async" src="${p.imageAsset || ''}" alt="${safeName}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
                <span style="display: ${p.imageAsset ? 'none' : 'flex'}; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 1.3rem;">${p.icon || '🧁'}</span>
              </div>
              <div>
                <h6 class="mb-0 brand-font">${safeName}</h6>
                <div class="small text-muted">${p.categoryName} · Rs. ${Number(p.price || 0).toLocaleString()}</div>
              </div>
            </div>
            <button class="btn btn-bb btn-bb-primary btn-bb-sm" onclick="
              BakerzCart.addItem('${safeId}', 1);
              bootstrap.Modal.getInstance(document.getElementById('globalSearchModal')).hide();
            ">
              Add
            </button>
          </div>
        `;
      });
      html += '</div>';
      resultsContainer.innerHTML = html;
    }
  };

  // 7. Build-Your-Own Gift Box Customizer Modal
  window.BakerzGiftBox = {
    selectedItems: [],
    candidates: [],

    init: function () {
      const container = document.getElementById('giftBoxTreatSelection');
      if (!container) return;

      const categories = ['pastries', 'cookies', 'savory', 'essentials'];
      this.candidates = window.BakerzProducts.filter(p => categories.includes(p.category) && !p.id.includes('showcase'));
      const escape = BakerzCart.escapeHtml;
      let html = '';
      categories.forEach(category => {
        const products = this.candidates.filter(p => p.category === category);
        html += `<h6 class="brand-font mt-3 mb-2">${escape(products[0].categoryName)}</h6><div class="row g-2 mb-3">`;
        products.forEach(p => {
          html += `
            <div class="col-6 col-md-4">
              <button type="button" class="gift-box-pick-card p-2 text-center h-100 w-100" data-gift-product="${escape(p.id)}" aria-pressed="false">
                <img src="${escape(p.imageAsset)}" alt="" class="bb-gift-pick-image mb-2" loading="lazy" decoding="async">
                <span class="d-block small fw-bold">${escape(p.name)}</span>
                <span class="d-block text-danger small">Rs. ${p.price.toLocaleString()}</span>
              </button>
            </div>
          `;
        });
        html += '</div>';
      });
      container.innerHTML = html;
      container.addEventListener('click', e => {
        const button = e.target.closest('[data-gift-product]');
        if (button) this.toggleItem(button.dataset.giftProduct);
      });
      this.updateSelection();
    },

    toggleItem: function (id) {
      const index = this.selectedItems.indexOf(id);
      if (index > -1) {
        this.selectedItems.splice(index, 1);
      } else {
        if (this.selectedItems.length >= 4) {
          BakerzToasts.show('Your box is full. Deselect a treat to swap it for another.', 'info');
          return;
        }
        this.selectedItems.push(id);
      }
      this.updateSelection();
    },

    updateSelection: function () {
      document.querySelectorAll('[data-gift-product]').forEach(button => {
        button.setAttribute('aria-pressed', String(this.selectedItems.includes(button.dataset.giftProduct)));
      });
      const chosen = this.selectedItems
        .map(id => this.candidates.find(p => p.id === id))
        .filter(Boolean);
      const total = chosen.reduce((sum, p) => sum + p.price, 0);
      const countEl = document.getElementById('giftBoxCountDisplay');
      if (countEl) countEl.textContent = `${this.selectedItems.length} / 4 items chosen`;
      const priceEl = document.getElementById('giftBoxPriceDisplay');
      if (priceEl) priceEl.textContent = `Box Price: Rs. ${total.toLocaleString()}`;
      const addBtn = document.getElementById('giftBoxAddBtn');
      if (addBtn) {
        addBtn.disabled = this.selectedItems.length !== 4;
        addBtn.textContent = this.selectedItems.length === 4
          ? `Add Gift Box · Rs. ${total.toLocaleString()}`
          : 'Add Gift Box to Basket';
      }
      const summaryEl = document.getElementById('giftBoxSelectionSummary');
      if (summaryEl) summaryEl.textContent = chosen.map(p => p.name).join(' + ') || 'Your selected treats will appear here.';
    },

    addGiftBoxToCart: function () {
      if (this.selectedItems.length !== 4) {
        BakerzToasts.show('Choose 4 treats to complete your gift box.', 'info');
        return;
      }

      const chosen = this.selectedItems
        .map(id => this.candidates.find(p => p.id === id))
        .filter(Boolean);
      const names = chosen.map(p => p.name);
      const total = chosen.reduce((sum, p) => sum + p.price, 0);
      const giftItem = {
        id: 'giftbox-' + Date.now(),
        name: 'Custom Artisan Gift Box',
        price: total,
        categoryName: 'Gift Boxes',
        placeholderBg: 'placeholder-bg-cake',
        notes: `4 treats: ${names.join(' + ')}`,
        imageAsset: 'assets/images/products/gift-box.webp',
        giftItems: chosen.map(p => ({ id: p.id, name: p.name, price: p.price }))
      };
      BakerzCart.addItem(giftItem, 1, giftItem.notes);
      this.selectedItems = [];
      this.updateSelection();

      const modalEl = document.getElementById('giftBoxModal');
      const modalInstance = modalEl && window.bootstrap ? bootstrap.Modal.getInstance(modalEl) : null;
      if (modalInstance) modalInstance.hide();
    }
  };

  // 8. Pointer-only 3D tilt for product cards
  function initCardTilt() {
    if (!window.matchMedia) return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reducedMotion.matches) return;

    const MAX_TILT = 6;
    document.addEventListener('pointermove', function (e) {
      const card = e.target.closest('.product-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.classList.add('bb-tilting');
      card.style.setProperty('--tilt-x', (-py * MAX_TILT).toFixed(2) + 'deg');
      card.style.setProperty('--tilt-y', (px * MAX_TILT * 1.3).toFixed(2) + 'deg');
    }, { passive: true });

    document.addEventListener('pointerout', function (e) {
      const card = e.target.closest('.product-card');
      if (!card || card.contains(e.relatedTarget)) return;
      card.classList.remove('bb-tilting');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    }, { passive: true });
  }

  // DOM Content Loaded Initializer
  document.addEventListener('DOMContentLoaded', function () {
    updateLiveClock();
    setInterval(updateLiveClock, 1000);

    initScrollBehaviors();
    initScrollReveal();
    initCardTilt();
    injectConfig();

    // Keep mega-menu catalog copy in sync with the live product list
    document.querySelectorAll('[data-product-count]').forEach(function (el) {
      if (window.BakerzProducts) {
        el.textContent = 'All ' + window.BakerzProducts.length + ' Baked Delights';
      }
    });

    // Gift box modal check
    if (document.getElementById('giftBoxModal')) {
      window.BakerzGiftBox.init();
    }
  });
})();
