/**
 * Bakerz Bite - Product Rendering & Interactive Filtering System
 * Handles search, category tabs, price slider, sorting, and quick view modal
 */

(function () {
  let activeCategory = 'all';
  let searchQuery = '';
  let maxPrice = 0;
  let priceCeiling = 4000;
  let sortBy = 'featured';

  window.BakerzFilters = {
    init: function (containerId, options = {}) {
      this.containerId = containerId || 'productCatalogGrid';
      this.options = options;

      // Read URL parameters if any (e.g. ?category=cakes)
      const params = new URLSearchParams(window.location.search);
      if (params.get('category')) {
        activeCategory = params.get('category');
      }
      if (params.get('search')) {
        searchQuery = params.get('search');
        const sInput = document.getElementById('catalogSearchInput');
        if (sInput) sInput.value = searchQuery;
      }

      // Synchronize category button active states from URL/initial state
      document.querySelectorAll('[data-category-filter]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-category-filter') === activeCategory);
      });

      // Derive the price ceiling from the catalog so new high-priced items are never filtered out by default
      const prices = (window.BakerzProducts || []).map(p => Number(p.price)).filter(Number.isFinite);
      priceCeiling = prices.length ? Math.ceil(Math.max(...prices) / 50) * 50 : 4000;
      maxPrice = priceCeiling;

      const priceSlider = document.getElementById('catalogPriceSlider');
      const priceDisplay = document.getElementById('catalogPriceDisplay');
      if (priceSlider) {
        priceSlider.max = priceCeiling;
        priceSlider.value = priceCeiling;
      }
      if (priceDisplay) {
        priceDisplay.textContent = `Rs. ${priceCeiling.toLocaleString()}`;
      }

      this.bindControls();
      this.render();
    },

    bindControls: function () {
      const self = this;

      // Category buttons / pills
      document.querySelectorAll('[data-category-filter]').forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          document.querySelectorAll('[data-category-filter]').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          activeCategory = this.getAttribute('data-category-filter');
          self.render();
        });
      });

      // Search input
      const searchInput = document.getElementById('catalogSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', function () {
          searchQuery = this.value.trim().toLowerCase();
          self.render();
        });
      }

      // Price slider
      const priceSlider = document.getElementById('catalogPriceSlider');
      const priceDisplay = document.getElementById('catalogPriceDisplay');
      if (priceSlider) {
        priceSlider.addEventListener('input', function () {
          maxPrice = parseInt(this.value, 10);
          if (priceDisplay) priceDisplay.textContent = `Rs. ${maxPrice.toLocaleString()}`;
          self.render();
        });
      }

      // Sort selector
      const sortSelect = document.getElementById('catalogSortSelect');
      if (sortSelect) {
        sortSelect.addEventListener('change', function () {
          sortBy = this.value;
          self.render();
        });
      }

      // Reset filters button
      const resetBtn = document.getElementById('catalogResetFiltersBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          activeCategory = 'all';
          searchQuery = '';
          maxPrice = priceCeiling;
          sortBy = 'featured';

          if (searchInput) searchInput.value = '';
          if (priceSlider) priceSlider.value = priceCeiling;
          if (priceDisplay) priceDisplay.textContent = `Rs. ${priceCeiling.toLocaleString()}`;
          if (sortSelect) sortSelect.value = 'featured';

          document.querySelectorAll('[data-category-filter]').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-category-filter') === 'all');
          });

          self.render();
        });
      }
    },

    getFilteredProducts: function () {
      let list = [...(window.BakerzProducts || [])];

      // Category filter
      if (activeCategory && activeCategory !== 'all') {
        list = list.filter(p => p.category === activeCategory);
      }

      // Search filter
      if (searchQuery) {
        list = list.filter(p => 
          p.name.toLowerCase().includes(searchQuery) ||
          p.description.toLowerCase().includes(searchQuery) ||
          p.categoryName.toLowerCase().includes(searchQuery) ||
          (p.ingredients && p.ingredients.toLowerCase().includes(searchQuery))
        );
      }

      // Price filter
      list = list.filter(p => p.price <= maxPrice);

      // Sorting
      if (sortBy === 'price-asc') {
        list.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-desc') {
        list.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'alpha-asc') {
        list.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === 'rating-desc') {
        list.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'featured') {
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }

      return list;
    },

    render: function () {
      const container = document.getElementById(this.containerId);
      if (!container) return;

      const countEl = document.getElementById('catalogProductCount');
      const products = this.getFilteredProducts();

      if (countEl) {
        countEl.textContent = `Showing ${products.length} of ${window.BakerzProducts ? window.BakerzProducts.length : 0} treats`;
      }

      if (products.length === 0) {
        container.innerHTML = `
          <div class="col-12 text-center py-5">
            <div style="font-size: 4rem;" class="anim-float">🔍</div>
            <h4 class="mt-3 brand-font">No sweet treats match your filter</h4>
            <p class="text-muted">Try adjusting your price range, clearing the search query, or picking another category.</p>
            <button class="btn btn-bb btn-bb-pink btn-bb-sm mt-2" onclick="document.getElementById('catalogResetFiltersBtn')?.click()">
              Reset All Filters
            </button>
          </div>
        `;
        return;
      }

      let html = '';
      products.forEach(p => {
        html += this.renderProductCard(p);
      });
      container.innerHTML = html;

      // Sync wishlist heart states
      if (window.BakerzWishlist) {
        window.BakerzWishlist.syncHeartButtons();
      }
    },

    renderProductCard: function (p) {
      const safeId = (p.id || '').replace(/['"]/g, '');
      const safeName = (p.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeDesc = (p.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      return `
        <div class="col-12 col-md-6 col-lg-4 mb-4">
          <div class="product-card h-100 d-flex flex-column">
            <span class="product-badge-category">${p.badge || p.categoryName}</span>
            <button class="product-wishlist-btn" data-product-id="${safeId}" aria-label="Save ${safeName} to Wishlist" aria-pressed="false" onclick="BakerzWishlist.toggle('${safeId}')">
              <i class="bi bi-heart"></i>
            </button>

            <!-- Product Real Image with Branded Fallback -->
            <div class="product-img-wrapper position-relative overflow-hidden" role="button" tabindex="0" aria-label="Quick view ${safeName}" onclick="BakerzFilters.openQuickView('${safeId}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();BakerzFilters.openQuickView('${safeId}')}" style="cursor: pointer; height: 210px; border-radius: var(--radius-md) var(--radius-md) 0 0; background: var(--bb-cream);">
              <img src="${p.imageAsset || ''}" 
                   alt="${safeName}" 
                   class="product-real-img w-100 h-100" 
                   style="object-fit: cover; transition: transform 0.4s ease;" 
                   loading="lazy" 
                   decoding="async" 
                   onerror="this.onerror=null; this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
              <div class="product-placeholder-img ${p.placeholderBg || 'placeholder-bg-cake'} w-100 h-100" style="display: ${p.imageAsset ? 'none' : 'flex'}; align-items: center; justify-content: center; flex-direction: column;">
                <span class="placeholder-icon">${p.icon || '🧁'}</span>
                <span class="placeholder-tag">${p.categoryName || 'Bakery Item'}</span>
              </div>
            </div>

            <div class="product-card-body d-flex flex-column flex-grow-1">
              <div class="product-rating">
                <span>★ ${Number(p.rating || 5.0).toFixed(1)}</span>
                <span class="review-count">(${p.reviewsCount || 40} demo reviews)</span>
              </div>
              <h5 class="product-title">${safeName}</h5>
              <p class="product-desc flex-grow-1">${safeDesc}</p>
              
              <div class="product-footer pt-2 mt-auto">
                <div class="product-price">Rs. ${Number(p.price || 0).toLocaleString()}</div>
                <div class="product-card-actions">
                  <button class="btn btn-bb btn-bb-outline btn-bb-sm" title="Quick View" aria-label="Quick view ${safeName}" onclick="BakerzFilters.openQuickView('${safeId}')">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-bb btn-bb-primary btn-bb-sm" aria-label="Add ${safeName} to basket" onclick="BakerzCart.addItem('${safeId}', 1)">
                    <i class="bi bi-basket3-fill"></i> Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    openQuickView: function (productId) {
      const p = (window.BakerzProducts || []).find(item => item.id === productId);
      if (!p) return;

      const modalContent = document.getElementById('quickViewModalBody');
      if (!modalContent) return;

      const safeId = (p.id || '').replace(/['"]/g, '');
      const safeName = (p.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeDesc = (p.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeIngredients = (p.ingredients || 'Flour, butter, sugar, water, natural leavening.').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeAllergens = (p.allergens || 'None reported.').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const related = (window.BakerzProducts || [])
        .filter(item => item.category === p.category && item.id !== p.id && !item.id.includes('showcase'))
        .slice(0, 3);
      let relatedHtml = '';
      if (related.length) {
        relatedHtml = `
            <div class="mt-4 pt-3 border-top">
              <div class="small fw-bold mb-2"><i class="bi bi-stars text-warning me-1"></i>You might also like</div>
              <div class="row g-2">
                ${related.map(item => `
                  <div class="col-4">
                    <button type="button" class="bb-related-tile w-100 text-center p-2" onclick="BakerzFilters.openQuickView('${(item.id || '').replace(/['"]/g, '')}')">
                      <img src="${item.imageAsset || ''}" alt="" loading="lazy" decoding="async" onerror="this.style.display='none'">
                      <span class="d-block small fw-bold text-truncate">${(item.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                      <span class="d-block text-danger small">Rs. ${Number(item.price || 0).toLocaleString()}</span>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>`;
      }

      modalContent.innerHTML = `
        <div class="row g-4 align-items-center">
          <div class="col-md-6">
            <!-- Product Real Image with Fallback -->
            <div class="quick-view-img-wrapper position-relative overflow-hidden rounded-4 border" style="height: 320px; background: var(--bb-cream);">
              <img src="${p.imageAsset || ''}" 
                   alt="${safeName}" 
                   class="w-100 h-100" 
                   style="object-fit: cover;" 
                   decoding="async"
                   onerror="this.onerror=null; this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
              <div class="quick-view-img ${p.placeholderBg || 'placeholder-bg-cake'} w-100 h-100" style="display: ${p.imageAsset ? 'none' : 'flex'}; align-items: center; justify-content: center; flex-direction: column;">
                <div style="font-size: 5rem;" class="anim-float">${p.icon || '🧁'}</div>
                <div class="badge bg-white text-dark border mt-2">${p.categoryName || 'Bakery Treat'}</div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <span class="badge bg-pink text-dark px-3 py-1 rounded-pill mb-2">${p.categoryName}</span>
            <h3 class="brand-font mb-2">${safeName}</h3>
            <div class="d-flex flex-wrap align-items-center gap-2 mb-2 text-warning">
              <span>★ ${Number(p.rating || 5.0).toFixed(1)}</span>
              <span class="text-muted small">(${p.reviewsCount || 40} demo tasting reviews)</span>
            </div>
            <h4 class="text-danger brand-font mb-2">Rs. ${Number(p.price || 0).toLocaleString()}</h4>
            <div class="small text-success fw-bold mb-3"><i class="bi bi-check-circle-fill"></i> Available for demo ordering · Baked fresh in small batches</div>
            <p class="text-muted mb-3">${safeDesc}</p>

            <div class="mb-3 p-3 bg-light rounded-3 border">
              <div class="small fw-bold text-dark mb-1"><i class="bi bi-info-circle"></i> Key Ingredients:</div>
              <div class="small text-muted">${safeIngredients}</div>
              <div class="small text-danger fw-bold mt-2"><i class="bi bi-exclamation-triangle"></i> Allergen Alert: ${safeAllergens}</div>
            </div>

            <div class="d-flex flex-wrap align-items-center gap-3 mb-4">
              <div class="d-flex align-items-center border rounded-pill bg-white px-2 py-1">
                <button class="btn btn-link text-dark text-decoration-none fw-bold" aria-label="Decrease quantity" onclick="let q = document.getElementById('modalQty'); q.value = Math.max(1, parseInt(q.value, 10)-1 || 1)">-</button>
                <input type="number" id="modalQty" value="1" min="1" max="50" aria-label="Quantity" class="form-control text-center border-0 p-0" style="width: 44px; font-weight: 700;" onchange="this.value = Math.min(50, Math.max(1, parseInt(this.value, 10) || 1))">
                <button class="btn btn-link text-dark text-decoration-none fw-bold" aria-label="Increase quantity" onclick="let q = document.getElementById('modalQty'); q.value = Math.min(50, (parseInt(q.value, 10) || 1)+1)">+</button>
              </div>
              <button class="btn btn-bb btn-bb-primary flex-grow-1" onclick="
                const qty = Math.min(50, Math.max(1, parseInt(document.getElementById('modalQty').value, 10) || 1));
                BakerzCart.addItem('${safeId}', qty);
                bootstrap.Modal.getInstance(document.getElementById('quickViewModal')).hide();
              ">
                <i class="bi bi-basket3-fill"></i> Add to Basket
              </button>
            </div>
          </div>
        </div>
        ${relatedHtml}
      `;

      const modalEl = document.getElementById('quickViewModal');
      if (modalEl && window.bootstrap) {
        if (!modalEl.classList.contains('show')) {
          this._returnFocus = document.activeElement;
        }
        modalEl.addEventListener('hidden.bs.modal', () => {
          const target = this._returnFocus;
          this._returnFocus = null;
          if (target && typeof target.focus === 'function') {
            target.focus({ preventScroll: true });
          }
        }, { once: true });
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    }
  };
})();
