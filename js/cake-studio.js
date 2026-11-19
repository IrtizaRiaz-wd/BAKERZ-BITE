/**
 * Bakerz Bite - Interactive 3D Clay Cake Studio Controller
 * Handles visual layer customizer, dynamic CSS frosting, real-time pricing and design saving
 */

(function () {
  const SAVED_DESIGNS_KEY = 'bakerz_bite_saved_cakes';

  window.BakerzCakeStudio = {
    state: {
      size: '1kg',
      flavor: 'chocolate',
      frosting: 'buttercream',
      frostingColor: '#FFF8EC',
      toppings: ['strawberries', 'macarons'],
      customMessage: 'Happy Birthday!'
    },

    init: function () {
      this.bindInputs();
      this.updateActiveUI();
      this.updatePreview();
      this.updatePricing();
    },

    bindInputs: function () {
      const self = this;

      // 1. Choose Cake Size Pills
      document.querySelectorAll('.cake-size-pill').forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          const size = this.getAttribute('data-size');
          if (!size) return;
          self.state.size = size;
          
          // Update active class on all size buttons
          document.querySelectorAll('.cake-size-pill').forEach(b => b.classList.remove('active'));
          this.classList.add('active');

          // Update size badge
          const sizeLabels = {
            '0.5kg': '0.5 kg · Serves 4',
            '1kg': '1 kg · Serves 8',
            '1.5kg': '1.5 kg · Serves 12',
            '2kg': '2 kg · Serves 16',
            '3kg': '3 kg · Serves 24',
            'tier': '4-Tier · Serves 35+'
          };
          const badge = document.getElementById('cakeActiveSizeBadge');
          if (badge) {
            badge.textContent = sizeLabels[size] || size;
          }

          self.updatePreview();
          self.updatePricing();
        });
      });

      // 2. Select Sponge Flavor
      const flavorSelect = document.getElementById('cakeFlavorSelect');
      if (flavorSelect) {
        flavorSelect.addEventListener('change', function () {
          self.state.flavor = this.value;
          self.updatePreview();
          self.updatePricing();
        });
      }

      // 3. Frosting Type
      const frostingSelect = document.getElementById('cakeFrostingSelect');
      if (frostingSelect) {
        frostingSelect.addEventListener('change', function () {
          self.state.frosting = this.value;
          
          // Update frosting text badge
          const fBadge = document.getElementById('cakeActiveFrostingBadge');
          if (fBadge) {
            const selectedText = this.options[this.selectedIndex]?.text || this.value;
            fBadge.textContent = selectedText.replace(/^[^\w\s]+/, '').replace(/\(\+Rs\..*\)/, '').trim();
          }

          // Auto-adjust default frosting color for chocolate ganache if using pale cream
          if (this.value === 'chocolate-ganache' && (self.state.frostingColor === '#FFF8EC' || self.state.frostingColor === '#FFFFFF')) {
            self.state.frostingColor = '#553A36';
            document.querySelectorAll('.cake-color-pill').forEach(b => {
              b.classList.toggle('active', b.getAttribute('data-color') === '#553A36');
            });
            const cName = document.getElementById('cakeActiveColorName');
            if (cName) cName.textContent = 'Dark Cocoa';
          }

          self.updatePreview();
          self.updatePricing();
        });
      }

      // 4. Frosting Color Palette Pills
      document.querySelectorAll('.cake-color-pill').forEach(btn => {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.cake-color-pill').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          const color = this.getAttribute('data-color') || '#FFF8EC';
          const name = this.getAttribute('data-name') || 'Custom Pastel';
          self.state.frostingColor = color;

          const cName = document.getElementById('cakeActiveColorName');
          if (cName) cName.textContent = name;

          self.updatePreview();
        });
      });

      // 5. Toppings Checkboxes
      document.querySelectorAll('input[name="cakeToppings"]').forEach(chk => {
        chk.addEventListener('change', function () {
          const selected = [];
          document.querySelectorAll('input[name="cakeToppings"]:checked').forEach(c => {
            selected.push(c.value);
          });
          self.state.toppings = selected;

          // Update count badge
          const countBadge = document.getElementById('cakeToppingCountBadge');
          if (countBadge) {
            countBadge.textContent = `${selected.length} Selected`;
          }

          self.updatePreview();
          self.updatePricing();
        });
      });

      // 6. Custom Message Input
      const msgInput = document.getElementById('cakeMessageInput');
      if (msgInput) {
        msgInput.addEventListener('input', function () {
          self.state.customMessage = this.value.trim();
          self.updatePreview();
        });
      }

      // Save Design button
      const saveBtn = document.getElementById('saveCakeDesignBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          self.saveDesign();
        });
      }

      // Add to Basket button
      const addToCartBtn = document.getElementById('addCustomCakeToCartBtn');
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function () {
          self.addToCart();
        });
      }
    },

    updateActiveUI: function () {
      // Sync size pills active state
      document.querySelectorAll('.cake-size-pill').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-size') === this.state.size);
      });

      // Sync color pills active state
      document.querySelectorAll('.cake-color-pill').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-color') === this.state.frostingColor);
      });

      // Sync toppings count badge
      const countBadge = document.getElementById('cakeToppingCountBadge');
      if (countBadge) {
        countBadge.textContent = `${this.state.toppings.length} Selected`;
      }
    },

    updatePreview: function () {
      const container = document.getElementById('cakeVisualPreview');
      const messageEl = document.getElementById('cakePipedMessage');
      const topperEl = document.getElementById('cakeTopperArea');
      if (!container) return;

      const flavorClass = `flavor-${this.state.flavor}`;
      const frostingClass = `frosting-${this.state.frosting}`;
      const hasSprinkles = this.state.toppings.includes('sprinkles');
      const hasGlitter = this.state.toppings.includes('edible-glitter');
      const fColor = this.state.frostingColor;

      // Helper function to create a tier HTML
      const createTier = (tierClass, isTopTier = false) => {
        return `
          <div class="cake-tier ${tierClass} ${flavorClass}">
            <div class="frosting-drip ${frostingClass}" style="background-color: ${fColor}; color: ${fColor};">
              <div class="frosting-scallop-border" style="color: ${fColor};"></div>
            </div>
            ${isTopTier && hasSprinkles ? '<div class="sprinkles-overlay"></div>' : ''}
            ${hasGlitter ? '<div class="glitter-overlay"></div>' : ''}
          </div>
        `;
      };

      // Determine tiers to display based on size
      let tiersHtml = '';
      if (this.state.size === '0.5kg') {
        // Bento 1-tier
        tiersHtml = createTier('tier-bento', true);
      } else if (this.state.size === '1kg') {
        // Classic 1-tier
        tiersHtml = createTier('tier-single-1kg', true);
      } else if (this.state.size === '1.5kg') {
        // 2-tier (medium top, base bottom)
        tiersHtml = `
          ${createTier('tier-middle', true)}
          ${createTier('tier-base', false)}
        `;
      } else if (this.state.size === '2kg') {
        // Grand 2-tier
        tiersHtml = `
          ${createTier('tier-middle', true)}
          ${createTier('tier-grand-base', false)}
        `;
      } else if (this.state.size === '3kg') {
        // Deluxe 3-tier
        tiersHtml = `
          ${createTier('tier-top', true)}
          ${createTier('tier-middle', false)}
          ${createTier('tier-grand-base', false)}
        `;
      } else {
        // 4-tier Showstopper
        tiersHtml = `
          ${createTier('tier-crown', true)}
          ${createTier('tier-top', false)}
          ${createTier('tier-middle', false)}
          ${createTier('tier-grand-base', false)}
        `;
      }

      container.innerHTML = tiersHtml;

      // Update Topper Area:
      // FIX: If NO toppings are selected, clear topperEl completely! Zero items rendered!
      if (topperEl) {
        if (!this.state.toppings || this.state.toppings.length === 0) {
          topperEl.innerHTML = '';
          topperEl.style.display = 'none';
        } else {
          topperEl.style.display = 'flex';
          let itemsHtml = '';
          
          if (this.state.toppings.includes('strawberries')) {
            itemsHtml += '<span class="cake-topper-item" title="Fresh Strawberries">🍓</span>';
          }
          if (this.state.toppings.includes('macarons')) {
            itemsHtml += '<span class="cake-topper-item" title="Macarons">🟢</span>';
          }
          if (this.state.toppings.includes('cherries')) {
            itemsHtml += '<span class="cake-topper-item" title="Glazed Cherries">🍒</span>';
          }
          if (this.state.toppings.includes('blueberries')) {
            itemsHtml += '<span class="cake-topper-item" title="Wild Blueberries">🫐</span>';
          }
          if (this.state.toppings.includes('chocolate-curls')) {
            itemsHtml += '<span class="cake-topper-item" title="Chocolate Curls">🍫</span>';
          }
          if (this.state.toppings.includes('sugar-flowers')) {
            itemsHtml += '<span class="cake-topper-item" title="Sugar Roses">🌸</span>';
          }
          if (this.state.toppings.includes('crushed-pistachios')) {
            itemsHtml += '<span class="cake-topper-item" title="Bronte Pistachios">🥜</span>';
          }
          if (this.state.toppings.includes('toffee-crunch')) {
            itemsHtml += '<span class="cake-topper-item" title="Toffee Crunch">🍯</span>';
          }
          
          topperEl.innerHTML = itemsHtml;
        }
      }

      // Update Custom Piped Message Overlay
      if (messageEl) {
        if (this.state.customMessage) {
          messageEl.textContent = this.state.customMessage;
          messageEl.style.display = 'block';
        } else {
          messageEl.textContent = '';
          messageEl.style.display = 'none';
        }
      }
    },

    calculatePrice: function () {
      const basePrices = {
        '0.5kg': 950,
        '1kg': 1750,
        '1.5kg': 2450,
        '2kg': 3200,
        '3kg': 4500,
        'tier': 5800
      };

      const flavorAddons = {
        'vanilla': 0,
        'chocolate': 150,
        'red-velvet': 250,
        'pistachio-rose': 300,
        'strawberry-shortcake': 250,
        'salted-caramel': 200,
        'blueberry-cheesecake': 250,
        'black-forest': 250,
        'lotus-biscoff': 280,
        'tiramisu-espresso': 260,
        'hazelnut-praline': 320,
        'lemon-raspberry': 220
      };

      const frostingAddons = {
        'buttercream': 0,
        'whipped-cream': 100,
        'cream-cheese': 250,
        'chocolate-ganache': 300,
        'fondant-clay': 450,
        'naked-rustic': 150
      };

      const toppingPrices = {
        'strawberries': 200,
        'macarons': 350,
        'cherries': 180,
        'blueberries': 180,
        'chocolate-curls': 150,
        'sugar-flowers': 250,
        'sprinkles': 50,
        'edible-glitter': 120,
        'crushed-pistachios': 160,
        'toffee-crunch': 140
      };

      let total = basePrices[this.state.size] || 1750;
      total += flavorAddons[this.state.flavor] || 0;
      total += frostingAddons[this.state.frosting] || 0;

      (this.state.toppings || []).forEach(t => {
        total += toppingPrices[t] || 0;
      });

      return total;
    },

    updatePricing: function () {
      const price = this.calculatePrice();
      const display = document.getElementById('cakePriceTotalDisplay');
      if (display) {
        display.textContent = `Rs. ${price.toLocaleString()}`;
      }
    },

    saveDesign: function () {
      try {
        const raw = localStorage.getItem(SAVED_DESIGNS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const newDesign = {
          id: 'cake-' + Date.now(),
          timestamp: new Date().toLocaleDateString(),
          state: { ...this.state },
          price: this.calculatePrice()
        };
        list.unshift(newDesign);
        localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(list));

        if (window.BakerzToasts) {
          window.BakerzToasts.show('Custom cake design saved to your profile vault!', 'success', '🎂');
        }
      } catch (e) {
        console.error("Error saving cake design", e);
      }
    },

    addToCart: function () {
      const price = this.calculatePrice();
      const toppingsList = this.state.toppings.length > 0 ? this.state.toppings.join(', ') : 'None';
      const note = `${this.state.size} | Flavor: ${this.state.flavor} | Frosting: ${this.state.frosting} | Toppings: ${toppingsList} | Msg: "${this.state.customMessage || 'None'}"`;

      const sizeLabels = {
        '0.5kg': '0.5 kg Bento Cake',
        '1kg': '1 kg Classic Celebration Cake',
        '1.5kg': '1.5 kg Family Celebration Cake',
        '2kg': '2 kg Grand 2-Tier Cake',
        '3kg': '3 kg Deluxe 3-Tier Cake',
        'tier': '4-Tier Royal Showstopper Cake'
      };

      const customItem = {
        id: 'custom-cake-' + Date.now(),
        name: sizeLabels[this.state.size] || `Custom ${this.state.size} Dream Cake`,
        categoryName: 'Custom Cake Studio',
        price: price,
        icon: '🎂',
        placeholderBg: 'placeholder-bg-cake',
        imageAsset: 'assets/images/products/celebration-cake.webp'
      };

      if (window.BakerzCart) {
        window.BakerzCart.addItem(customItem, 1, note);
      }
    }
  };

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('cake-studio')) {
      window.BakerzCakeStudio.init();
    }
  });
})();
