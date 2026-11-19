/**
 * Bakerz Bite - Wishlist State Controller
 * Manages wishlist items in localStorage and live UI badge counters
 */

(function () {
  const WISHLIST_STORAGE_KEY = 'bakerz_bite_wishlist';

  window.BakerzWishlist = {
    getItems: function () {
      try {
        const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error("Error reading wishlist", e);
        return [];
      }
    },

    saveItems: function (items) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      this.updateBadges();
      this.syncHeartButtons();
    },

    toggle: function (productId) {
      const product = (window.BakerzProducts || []).find(p => p.id === productId);
      if (!product) return;

      let items = this.getItems();
      const index = items.findIndex(id => id === productId);

      if (index > -1) {
        items.splice(index, 1);
        if (window.BakerzToasts) {
          window.BakerzToasts.show(`Removed ${product.name} from your Wishlist`, 'info', '🤍');
        }
      } else {
        items.push(productId);
        if (window.BakerzToasts) {
          window.BakerzToasts.show(`Added ${product.name} to your Wishlist!`, 'success', '💖');
        }
      }

      this.saveItems(items);
    },

    isInWishlist: function (productId) {
      return this.getItems().includes(productId);
    },

    updateBadges: function () {
      const items = this.getItems();
      document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
        badge.textContent = items.length;
        badge.style.display = items.length > 0 ? 'flex' : 'none';
      });
    },

    syncHeartButtons: function () {
      const items = this.getItems();
      document.querySelectorAll('.product-wishlist-btn').forEach(btn => {
        const id = btn.getAttribute('data-product-id');
        const label = btn.getAttribute('aria-label') || '';
        if (id && items.includes(id)) {
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          if (label) btn.setAttribute('aria-label', label.replace('Save ', 'Remove '));
          btn.innerHTML = '<i class="bi bi-heart-fill"></i>';
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
          if (label) btn.setAttribute('aria-label', label.replace('Remove ', 'Save '));
          btn.innerHTML = '<i class="bi bi-heart"></i>';
        }
      });
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.BakerzWishlist.updateBadges();
    window.BakerzWishlist.syncHeartButtons();
  });
})();
