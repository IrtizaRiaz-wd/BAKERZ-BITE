/**
 * Bakerz Bite - The Bakerz Bite Collection page
 * Filters, searches and sorts merchandise using the shared product catalog,
 * and renders cards through the existing BakerzFilters renderer.
 */
(function () {
  'use strict';

  var state = {
    filter: 'all',
    query: '',
    sort: 'featured'
  };

  function merchandise() {
    return (window.BakerzProducts || []).filter(function (p) {
      return p.category === 'merchandise';
    });
  }

  function getFiltered() {
    var list = merchandise();

    if (state.filter !== 'all') {
      list = list.filter(function (p) {
        return p.merchCategory === state.filter;
      });
    }

    if (state.query) {
      var q = state.query;
      list = list.filter(function (p) {
        return (p.name || '').toLowerCase().indexOf(q) !== -1 ||
          (p.description || '').toLowerCase().indexOf(q) !== -1 ||
          (p.merchCategoryName || '').toLowerCase().indexOf(q) !== -1 ||
          (p.ingredients || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    if (state.sort === 'price-asc') {
      list.sort(function (a, b) { return a.price - b.price; });
    } else if (state.sort === 'price-desc') {
      list.sort(function (a, b) { return b.price - a.price; });
    } else if (state.sort === 'alpha-asc') {
      list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    } else if (state.sort === 'rating-desc') {
      list.sort(function (a, b) { return b.rating - a.rating; });
    } else {
      list.sort(function (a, b) {
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.name.localeCompare(b.name);
      });
    }

    return list;
  }

  function updatePills() {
    var all = merchandise();
    document.querySelectorAll('[data-merch-total]').forEach(function (el) {
      el.textContent = all.length;
    });
    document.querySelectorAll('[data-merch-count]').forEach(function (el) {
      var key = el.getAttribute('data-merch-count');
      el.textContent = key === 'all'
        ? all.length
        : all.filter(function (p) { return p.merchCategory === key; }).length;
    });
  }

  function render() {
    var grid = document.getElementById('merchGrid');
    if (!grid || !window.BakerzFilters) return;

    var total = merchandise().length;
    var products = getFiltered();
    var countEl = document.getElementById('merchProductCount');

    updatePills();

    document.querySelectorAll('[data-merch-filter]').forEach(function (btn) {
      var on = btn.getAttribute('data-merch-filter') === state.filter;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    if (countEl) {
      countEl.textContent = 'Showing ' + products.length + ' of ' + total + ' pieces';
    }

    if (!products.length) {
      grid.innerHTML = '' +
        '<div class="col-12 bb-merch-empty">' +
          '<div class="bb-merch-empty-icon anim-float">🧁</div>' +
          '<h4 class="mt-3 brand-font">Nothing in this corner just yet</h4>' +
          '<p class="text-muted mb-3">Try another collection, clear the search, or reset the filters.</p>' +
          '<button type="button" class="btn btn-bb btn-bb-pink btn-bb-sm" data-merch-reset>Reset the Collection</button>' +
        '</div>';
      return;
    }

    grid.innerHTML = products.map(function (p) {
      return window.BakerzFilters.renderProductCard(p);
    }).join('');

    if (window.BakerzWishlist) {
      window.BakerzWishlist.syncHeartButtons();
    }
  }

  function reset() {
    state.filter = 'all';
    state.query = '';
    state.sort = 'featured';

    var search = document.getElementById('merchSearchInput');
    var sort = document.getElementById('merchSortSelect');
    if (search) search.value = '';
    if (sort) sort.value = 'featured';

    render();
  }

  function bind() {
    document.querySelectorAll('[data-merch-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.filter = this.getAttribute('data-merch-filter');
        render();
      });
    });

    var search = document.getElementById('merchSearchInput');
    if (search) {
      search.addEventListener('input', function () {
        state.query = this.value.trim().toLowerCase();
        render();
      });
    }

    var sort = document.getElementById('merchSortSelect');
    if (sort) {
      sort.addEventListener('change', function () {
        state.sort = this.value;
        render();
      });
    }

    var resetBtn = document.getElementById('merchResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', reset);

    var grid = document.getElementById('merchGrid');
    if (grid) {
      grid.addEventListener('click', function (e) {
        if (e.target.closest('[data-merch-reset]')) reset();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var sub = params.get('sub');
    var allowed = ['drinkware', 'bags', 'serving', 'aprons'];
    if (allowed.indexOf(sub) !== -1) {
      state.filter = sub;
    }
    bind();
    render();
  });
})();
