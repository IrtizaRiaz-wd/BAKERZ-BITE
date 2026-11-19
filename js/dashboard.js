/**
 * Bakerz Bite - Dashboard & Admin Demo Controller
 */

(function () {
  window.BakerzDashboard = {
    initCustomer: function () {
      this.loadUserProfile();
      this.loadOrderHistory();
      this.loadSavedCakes();
      this.loadWishlistPreview();
    },

    loadUserProfile: function () {
      let user = { name: "Ayesha Khan", email: "ayesha.khan@example.com", points: 380, tier: "Silver" };
      try {
        const raw = localStorage.getItem('bakerz_demo_user');
        if (raw) user = JSON.parse(raw);
      } catch (e) {}

      document.querySelectorAll('.profile-name-display').forEach(el => el.textContent = user.name);
      document.querySelectorAll('.profile-email-display').forEach(el => el.textContent = user.email);
      document.querySelectorAll('.profile-points-display').forEach(el => el.textContent = user.points);
      document.querySelectorAll('.profile-tier-display').forEach(el => el.textContent = user.tier);

      // Compute loyalty progress
      const percent = Math.min(100, Math.round((user.points / 500) * 100));
      const fillEl = document.getElementById('loyaltyProgressBar');
      if (fillEl) fillEl.style.width = `${percent}%`;

      const ptsToNext = document.getElementById('pointsToNextTier');
      if (ptsToNext) ptsToNext.textContent = Math.max(0, 500 - user.points);
    },

    loadOrderHistory: function () {
      const container = document.getElementById('dashboardOrdersList');
      if (!container) return;

      let orders = [];
      try {
        const raw = localStorage.getItem('bakerz_demo_orders');
        orders = raw ? JSON.parse(raw) : [];
      } catch (e) {}

      // Seed initial demo order if none exist
      if (orders.length === 0) {
        orders = [
          {
            orderId: "BB-924810",
            date: "Yesterday at 4:15 PM",
            status: "Delivered",
            total: 2470,
            items: [
              { name: "Fresh Cream Cake", quantity: 1, price: 1850 },
              { name: "Butter Croissant", quantity: 2, price: 310 }
            ]
          }
        ];
      }

      let html = '';
      orders.forEach(order => {
        html += `
          <div class="p-3 mb-3 bg-white rounded-3 border d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-sm">
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="fw-bold brand-font text-dark">Order #${order.orderId}</span>
                <span class="badge ${order.status === 'Delivered' ? 'bg-success' : 'bg-warning text-dark'} small">${order.status}</span>
              </div>
              <div class="small text-muted">${order.date} · ${order.items ? order.items.length : 1} delights</div>
            </div>
            <div class="text-end">
              <div class="fw-bold brand-font text-danger" style="font-size: 1.15rem;">Rs. ${order.total.toLocaleString()}</div>
              <span class="small text-muted">Paid via ${order.paymentMethod || 'Cash on Delivery'}</span>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    loadSavedCakes: function () {
      const container = document.getElementById('dashboardSavedCakes');
      if (!container) return;

      let saved = [];
      try {
        const raw = localStorage.getItem('bakerz_bite_saved_cakes');
        saved = raw ? JSON.parse(raw) : [];
      } catch (e) {}

      if (saved.length === 0) {
        container.innerHTML = `
          <div class="text-center py-4 text-muted">
            <div style="font-size: 3rem;">🎂</div>
            <p class="small mb-1 mt-2">No custom cakes saved yet.</p>
            <a href="cake-studio.html" class="btn btn-bb btn-bb-yellow btn-bb-sm">Design in Cake Studio</a>
          </div>
        `;
        return;
      }

      let html = '';
      saved.forEach(item => {
        html += `
          <div class="p-3 mb-2 bg-white rounded-3 border d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-1 brand-font">Custom ${item.state.size} (${item.state.flavor})</h6>
              <div class="small text-muted">Msg: "${item.state.customMessage || 'None'}" · Rs. ${item.price.toLocaleString()}</div>
            </div>
            <button class="btn btn-bb btn-bb-pink btn-bb-sm" onclick="BakerzCart.addItem({ id: '${item.id}', name: 'Custom ${item.state.size} Cake', price: ${item.price}, icon: '🎂', placeholderBg: 'placeholder-bg-cake' }, 1, '${item.state.flavor} - ${item.state.customMessage}')">
              Add to Basket
            </button>
          </div>
        `;
      });
      container.innerHTML = html;
    },

    loadWishlistPreview: function () {
      const container = document.getElementById('dashboardWishlistList');
      if (!container) return;

      const wishlistIds = window.BakerzWishlist ? window.BakerzWishlist.getItems() : [];
      const items = (window.BakerzProducts || []).filter(p => wishlistIds.includes(p.id));

      if (items.length === 0) {
        container.innerHTML = `
          <div class="text-center py-4 text-muted">
            <div style="font-size: 3rem;">💖</div>
            <p class="small mb-1 mt-2">Your wishlist is currently empty.</p>
            <a href="menu.html" class="btn btn-bb btn-bb-pink btn-bb-sm">Browse Sweet Menu</a>
          </div>
        `;
        return;
      }

      let html = '';
      items.forEach(p => {
        html += `
          <div class="p-3 mb-2 bg-white rounded-3 border d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-3">
              <span style="font-size: 1.8rem;">${p.icon}</span>
              <div>
                <h6 class="mb-0 brand-font">${p.name}</h6>
                <div class="small text-danger fw-bold">Rs. ${p.price.toLocaleString()}</div>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-bb btn-bb-primary btn-bb-sm" onclick="BakerzCart.addItem('${p.id}', 1)">Add</button>
              <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="BakerzWishlist.toggle('${p.id}'); BakerzDashboard.loadWishlistPreview();">Remove</button>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    },

    // Admin Demonstration
    initAdmin: function () {
      this.renderAdminStats();
      this.renderAdminOrders();
      this.renderAdminInventory();
    },

    renderAdminStats: function () {
      const orders = JSON.parse(localStorage.getItem('bakerz_demo_orders') || '[]');
      const rev = orders.reduce((sum, o) => sum + (o.total || 0), 48520);
      const ordersCount = 18 + orders.length;

      const revEl = document.getElementById('adminTotalRevenue');
      const countEl = document.getElementById('adminTotalOrders');
      const activeProdEl = document.getElementById('adminActiveProductsCount');

      if (revEl) revEl.textContent = `Rs. ${rev.toLocaleString()}`;
      if (countEl) countEl.textContent = ordersCount;
      if (activeProdEl) {
        activeProdEl.textContent = `${window.BakerzProducts ? window.BakerzProducts.length : 51} items`;
      }
    },

    toggleOrderStatus: function (orderId) {
      let orders = JSON.parse(localStorage.getItem('bakerz_demo_orders') || '[]');
      if (orders.length === 0) {
        orders = [
          { orderId: "BB-881290", customerName: "Hamza Tariq", total: 3200, status: "Baking", date: "Today 11:30 AM" },
          { orderId: "BB-881289", customerName: "Sara Bilal", total: 1850, status: "Out for Delivery", date: "Today 10:15 AM" },
          { orderId: "BB-881288", customerName: "Zainab Malik", total: 5400, status: "Delivered", date: "Today 09:00 AM" }
        ];
      }
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        const next = {
          'Baking': 'Out for Delivery',
          'Out for Delivery': 'Delivered',
          'Delivered': 'Baking'
        };
        order.status = next[order.status] || 'Baking';
        localStorage.setItem('bakerz_demo_orders', JSON.stringify(orders));
        this.renderAdminOrders();
        if (window.BakerzToasts) {
          window.BakerzToasts.show(`Order #${orderId} status changed to "${order.status}"`, 'success', '📋');
        }
      }
    },

    renderAdminOrders: function () {
      const tableBody = document.getElementById('adminOrdersTableBody');
      if (!tableBody) return;

      let orders = JSON.parse(localStorage.getItem('bakerz_demo_orders') || '[]');
      if (orders.length === 0) {
        orders = [
          { orderId: "BB-881290", customerName: "Hamza Tariq", total: 3200, status: "Baking", date: "Today 11:30 AM" },
          { orderId: "BB-881289", customerName: "Sara Bilal", total: 1850, status: "Out for Delivery", date: "Today 10:15 AM" },
          { orderId: "BB-881288", customerName: "Zainab Malik", total: 5400, status: "Delivered", date: "Today 09:00 AM" }
        ];
        localStorage.setItem('bakerz_demo_orders', JSON.stringify(orders));
      }

      let html = '';
      orders.forEach(o => {
        let badgeClass = 'bg-warning text-dark';
        if (o.status === 'Delivered') badgeClass = 'bg-success text-white';
        if (o.status === 'Out for Delivery') badgeClass = 'bg-info text-dark';

        html += `
          <tr>
            <td class="fw-bold font-monospace">#${o.orderId}</td>
            <td>${o.customerName || 'Demo Guest'}</td>
            <td class="text-muted small">${o.date}</td>
            <td class="fw-bold text-danger">Rs. ${Number(o.total || 0).toLocaleString()}</td>
            <td><span class="badge ${badgeClass}">${o.status}</span></td>
            <td>
              <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="BakerzDashboard.toggleOrderStatus('${o.orderId}')" title="Click to advance status">
                <i class="bi bi-arrow-repeat"></i> Toggle Status
              </button>
            </td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;
    },

    openEditProductModal: function (productId) {
      const p = (window.BakerzProducts || []).find(item => item.id === productId);
      if (!p) return;

      let modalEl = document.getElementById('adminEditProductModal');
      if (!modalEl) {
        const div = document.createElement('div');
        div.className = 'modal fade';
        div.id = 'adminEditProductModal';
        div.tabIndex = -1;
        div.innerHTML = `
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bb-modal-content">
              <div class="modal-header bb-modal-header">
                <h5 class="modal-title brand-font">Edit Product Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body bb-modal-body">
                <input type="hidden" id="editProdId">
                <div class="mb-3">
                  <label class="form-label small fw-bold">Product Name</label>
                  <input type="text" id="editProdName" class="form-control form-control-bb" readonly>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold">Price (PKR)</label>
                  <input type="number" id="editProdPrice" class="form-control form-control-bb" min="10">
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold">Availability Status</label>
                  <select id="editProdStatus" class="form-select form-select-bb">
                    <option value="In Stock (Daily Fresh)">In Stock (Daily Fresh)</option>
                    <option value="Low Stock (Batch Baking)">Low Stock (Batch Baking)</option>
                    <option value="Sold Out for Today">Sold Out for Today</option>
                  </select>
                </div>
                <button type="button" class="btn btn-bb btn-bb-primary w-100" onclick="BakerzDashboard.saveProductEdit()">Save Changes</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(div);
        modalEl = div;
      }

      document.getElementById('editProdId').value = p.id;
      document.getElementById('editProdName').value = p.name;
      document.getElementById('editProdPrice').value = p.price;
      if (p.customStatus) {
        document.getElementById('editProdStatus').value = p.customStatus;
      }

      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    },

    saveProductEdit: function () {
      const id = document.getElementById('editProdId').value;
      const price = parseInt(document.getElementById('editProdPrice').value, 10);
      const status = document.getElementById('editProdStatus').value;
      const p = (window.BakerzProducts || []).find(item => item.id === id);
      if (p && !isNaN(price)) {
        p.price = price;
        p.customStatus = status;
        this.renderAdminInventory();
        if (window.BakerzFilters) {
          window.BakerzFilters.render();
        }
        if (window.BakerzToasts) {
          window.BakerzToasts.show(`Updated ${p.name}: Rs. ${price.toLocaleString()} (${status})`, 'success', '✏️');
        }
        bootstrap.Modal.getInstance(document.getElementById('adminEditProductModal'))?.hide();
      }
    },

    renderAdminInventory: function () {
      const tableBody = document.getElementById('adminInventoryTableBody');
      if (!tableBody) return;

      const products = window.BakerzProducts || [];
      let html = '';
      products.forEach(p => {
        const safeId = (p.id || '').replace(/['"]/g, '');
        const currentStatus = p.customStatus || 'In Stock (Daily Fresh)';
        let statusBadge = 'bg-success';
        if (currentStatus.includes('Low')) statusBadge = 'bg-warning text-dark';
        if (currentStatus.includes('Sold Out')) statusBadge = 'bg-danger text-white';

        html += `
          <tr>
            <td>
              <div class="d-flex align-items-center gap-2">
                <div style="width: 38px; height: 38px; border-radius: 8px; overflow: hidden; background: var(--bb-cream); flex-shrink: 0;" class="position-relative">
                  <img loading="lazy" decoding="async" src="${p.imageAsset || ''}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
                  <span style="display: ${p.imageAsset ? 'none' : 'flex'}; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 1.2rem;">${p.icon || '🧁'}</span>
                </div>
                <span class="fw-bold">${p.name}</span>
              </div>
            </td>
            <td><span class="badge bg-light text-dark border">${p.categoryName}</span></td>
            <td class="fw-bold">Rs. ${Number(p.price || 0).toLocaleString()}</td>
            <td><span class="badge ${statusBadge}">${currentStatus}</span></td>
            <td>
              <button class="btn btn-sm btn-outline-primary rounded-pill py-0 px-2" onclick="BakerzDashboard.openEditProductModal('${safeId}')" title="Edit price or status">
                <i class="bi bi-pencil-square"></i> Edit
              </button>
            </td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('dashboardOrdersList')) {
      window.BakerzDashboard.initCustomer();
    }
    if (document.getElementById('adminOrdersTableBody')) {
      window.BakerzDashboard.initAdmin();
    }
  });
})();
