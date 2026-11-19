/**
 * Bakerz Bite - Gallery & Lightbox Controller
 * Supports category filters, asymmetric grid cards, full modal lightbox, and keyboard navigation
 */

(function () {
  const galleryItems = [
    {
      id: 1,
      title: "Fresh Strawberry Shortcake",
      category: "cakes",
      desc: "Delicate vanilla genoise sponge layered with fresh chantilly diplomat cream and ripe hand-picked strawberries.",
      icon: "🍓",
      bgClass: "placeholder-bg-cake",
      asset: "assets/images/gallery/strawberry-shortcake.webp"
    },
    {
      id: 2,
      title: "Belgian Chocolate Fudge Gateau",
      category: "cakes",
      desc: "Velvety 70% dark Belgian chocolate fudge cake finished with rich cocoa ganache and delicate chocolate shavings.",
      icon: "🍫",
      bgClass: "placeholder-bg-cake",
      asset: "assets/images/gallery/chocolate-fudge-cake.webp"
    },
    {
      id: 3,
      title: "New York Blueberry Cheesecake",
      category: "cakes",
      desc: "Dense, creamy slow-baked cheesecake atop a golden butter crust, smothered in warm wild blueberry compote.",
      icon: "🫐",
      bgClass: "placeholder-bg-cake",
      asset: "assets/images/gallery/blueberry-cheesecake.webp"
    },
    {
      id: 4,
      title: "Vanilla Bean Mille-Feuille",
      category: "pastries",
      desc: "Three layers of caramelized inverted puff pastry paired with silky Tahitian vanilla bean pastry cream.",
      icon: "🍰",
      bgClass: "placeholder-bg-pastry",
      asset: "assets/images/gallery/vanilla-mille-feuille.webp"
    },
    {
      id: 5,
      title: "Pistachio Craquelin Choux",
      category: "pastries",
      desc: "Crisp craquelin sphere piped with airy Sicilian pistachio diplomat cream and finished with roasted nut crunch.",
      icon: "🧁",
      bgClass: "placeholder-bg-pastry",
      asset: "assets/images/gallery/pistachio-choux.webp"
    },
    {
      id: 6,
      title: "Golden Cinnamon Cruffin",
      category: "pastries",
      desc: "Tall laminated brioche spiral rolled in fragrant Korintje cinnamon sugar, filled with vanilla pastry custard.",
      icon: "🌀",
      bgClass: "placeholder-bg-pastry",
      asset: "assets/images/gallery/cinnamon-cruffin.webp"
    },
    {
      id: 7,
      title: "Raspberry Almond Frangipane Tart",
      category: "pies",
      desc: "Crisp sweet almond sable shell baked with rich almond frangipane cream and fresh ruby raspberries.",
      icon: "🥧",
      bgClass: "placeholder-bg-pie",
      asset: "assets/images/gallery/raspberry-almond-tart.webp"
    },
    {
      id: 8,
      title: "Torched Lemon Meringue Pie",
      category: "pies",
      desc: "Zesty fresh lemon curd in a crisp shortcrust shell, heaped high with billowing golden-torched Italian meringue.",
      icon: "🍋",
      bgClass: "placeholder-bg-pie",
      asset: "assets/images/gallery/lemon-meringue-pie.webp"
    },
    {
      id: 9,
      title: "Double Dark Chocolate Cookie",
      category: "cookies",
      desc: "Ultra-fudgy Dutch process cocoa cookie studded with gooey milk and white chocolate chunks straight from the oven.",
      icon: "🍪",
      bgClass: "placeholder-bg-cookie",
      asset: "assets/images/gallery/double-chocolate-cookie.webp"
    },
    {
      id: 10,
      title: "Salted Caramel Toffee Cookie",
      category: "cookies",
      desc: "Chewy golden brown butter cookie folded with handmade crunchy toffee bits and flaked Maldon sea salt crystals.",
      icon: "🍮",
      bgClass: "placeholder-bg-cookie",
      asset: "assets/images/gallery/salted-caramel-cookie.webp"
    },
    {
      id: 11,
      title: "Artisan Sourdough Scoring",
      category: "bread",
      desc: "Naturally fermented sourdough scored with intricate wheat leaf patterns prior to stone hearth baking.",
      icon: "🥨",
      bgClass: "placeholder-bg-bread",
      asset: "assets/images/gallery/sourdough-scoring.webp"
    },
    {
      id: 12,
      title: "French Butter Lamination",
      category: "behind",
      desc: "27 whisper-thin flaky pastry layers hand-rolled with 84% butter at our morning bench.",
      icon: "🥐",
      bgClass: "placeholder-bg-pastry",
      asset: "assets/images/gallery/croissant-lamination.webp"
    },
    {
      id: 13,
      title: "Stone Deck Hearth Oven",
      category: "behind",
      desc: "Morning crusty artisan loaves sliding off the wooden baker's peel into our 260°C stone deck hearth.",
      icon: "🔥",
      bgClass: "placeholder-bg-bread",
      asset: "assets/images/gallery/stone-deck-oven.webp"
    },
    {
      id: 14,
      title: "Fresh Brioche Honeycomb Pull",
      category: "bread",
      desc: "Golden-brown brioche crumb enriched with raw wildflower honey and pure sweet churned farm butter.",
      icon: "🍞",
      bgClass: "placeholder-bg-bread",
      asset: "assets/images/gallery/brioche-pull.webp"
    }
  ];

  let currentIndex = 0;
  let activeFilter = 'all';

  window.BakerzGallery = {
    init: function (containerId) {
      this.containerId = containerId || 'galleryGrid';
      this.bindEvents();
      this.render();
    },

    bindEvents: function () {
      const self = this;

      // Filter buttons
      document.querySelectorAll('[data-gallery-filter]').forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          document.querySelectorAll('[data-gallery-filter]').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          activeFilter = this.getAttribute('data-gallery-filter');
          self.render();
        });
      });

      // Keyboard navigation for lightbox
      document.addEventListener('keydown', function (e) {
        const modal = document.getElementById('galleryLightboxModal');
        if (!modal || !modal.classList.contains('active')) return;

        if (e.key === 'Escape') self.closeLightbox();
        if (e.key === 'ArrowLeft') self.prev();
        if (e.key === 'ArrowRight') self.next();
      });
    },

    getFiltered: function () {
      if (activeFilter === 'all') return galleryItems;
      return galleryItems.filter(item => item.category === activeFilter);
    },

    render: function () {
      const container = document.getElementById(this.containerId);
      if (!container) return;

      const items = this.getFiltered();
      let html = '';

      items.forEach((item, index) => {
        html += `
          <div class="gallery-card" role="button" tabindex="0" aria-label="View ${item.title} in lightbox" onclick="BakerzGallery.openLightbox(${index})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();BakerzGallery.openLightbox(${index})}">
            <div class="gallery-img-container ${item.bgClass} position-relative overflow-hidden" style="min-height: 260px;">
              <img loading="lazy" decoding="async" src="${item.asset}" alt="${item.title}" class="w-100 h-100" style="object-fit: cover; transition: transform 0.4s ease;" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
              <div style="font-size: 3.5rem; display: none; align-items: center; justify-content: center; width: 100%; height: 100%;" class="anim-float">${item.icon}</div>
              <div class="gallery-overlay">
                <span class="badge bg-white text-dark align-self-start mb-1 text-uppercase small">${item.category}</span>
                <h5 class="mb-1 text-white brand-font">${item.title}</h5>
                <p class="small mb-0 text-white-50">${item.desc}</p>
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    openLightbox: function (index) {
      const items = this.getFiltered();
      if (!items[index]) return;

      currentIndex = index;
      const modal = document.getElementById('galleryLightboxModal');
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.updateLightboxContent();
      }
    },

    closeLightbox: function () {
      const modal = document.getElementById('galleryLightboxModal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    },

    prev: function () {
      const items = this.getFiltered();
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      this.updateLightboxContent();
    },

    next: function () {
      const items = this.getFiltered();
      currentIndex = (currentIndex + 1) % items.length;
      this.updateLightboxContent();
    },

    updateLightboxContent: function () {
      const items = this.getFiltered();
      const item = items[currentIndex];
      if (!item) return;

      const titleEl = document.getElementById('lightboxTitle');
      const descEl = document.getElementById('lightboxDesc');
      const imgContainer = document.getElementById('lightboxImageArea');
      const countEl = document.getElementById('lightboxCounter');

      if (titleEl) titleEl.textContent = item.title;
      if (descEl) descEl.textContent = item.desc;
      if (countEl) countEl.textContent = `${currentIndex + 1} / ${items.length}`;

      if (imgContainer) {
        imgContainer.className = `lightbox-img-box position-relative overflow-hidden rounded-4 ${item.bgClass}`;
        imgContainer.innerHTML = `
          <img decoding="async" src="${item.asset}" alt="${item.title}" class="w-100" style="max-height: 480px; object-fit: contain; border-radius: 12px;" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
          <div style="font-size: 6rem; display: none; align-items: center; justify-content: center; height: 300px;" class="anim-float">${item.icon}</div>
        `;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('galleryGrid')) {
      window.BakerzGallery.init();
    }
  });
})();
