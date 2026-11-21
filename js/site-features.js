/**
 * Bakerz Bite — Shared live site features
 * Browser-local visitor counter, live bottom ticker, and user-initiated
 * location detection with a manual fallback. No automatic permission prompts.
 */

(function () {
  'use strict';

  if (window.__bbSiteFeaturesLoaded) return;
  window.__bbSiteFeaturesLoaded = true;

  var KEYS = {
    visits: 'bakerz_bite_visits',
    session: 'bakerz_bite_session_counted',
    location: 'bakerz_bite_location'
  };

  var MAX_CITY = 60;
  var REVERSE_GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

  function lsGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function lsSet(key, value) {
    try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function ssGet(key) {
    try { return window.sessionStorage.getItem(key); } catch (e) { return null; }
  }

  function ssSet(key, value) {
    try { window.sessionStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  window.BakerzSite = {
    _tickerTimer: 0,

    init: function () {
      this.initVisitorCounter();
      this.initTicker();
    },

    /* ---------------------------------------------------------------
       Visitor counter — once per tab session, persisted in localStorage
       --------------------------------------------------------------- */
    initVisitorCounter: function () {
      var anchor = document.querySelector('.navbar-brand-logo');
      if (!anchor || document.querySelector('.bb-visit-counter')) return;

      var count = this.readVisits();
      if (ssGet(KEYS.session) !== '1') {
        count = count + 1;
        lsSet(KEYS.visits, String(count));
        ssSet(KEYS.session, '1');
      }

      var badge = document.createElement('span');
      badge.className = 'bb-visit-counter';
      badge.title = 'Visits on this browser';
      badge.setAttribute('aria-label', 'Visits on this browser: ' + count.toLocaleString('en-US'));
      badge.innerHTML =
        '<i class="bi bi-eye" aria-hidden="true"></i>' +
        '<span class="bb-visit-count"></span>' +
        '<em>visits</em>';
      badge.querySelector('.bb-visit-count').textContent = count.toLocaleString('en-US');
      anchor.appendChild(badge);
    },

    readVisits: function () {
      var raw = lsGet(KEYS.visits);
      var n = parseInt(raw, 10);
      if (!isFinite(n) || n < 0) return 0;
      return Math.min(n, 99999999);
    },

    /* ---------------------------------------------------------------
       Bottom ticker — date, time, city and brand message
       --------------------------------------------------------------- */
    initTicker: function () {
      if (document.getElementById('bbLiveTicker')) return;

      var ticker = document.createElement('div');
      ticker.id = 'bbLiveTicker';
      ticker.className = 'bb-live-ticker';
      ticker.setAttribute('aria-label', 'Live bakery information ticker');

      var group =
        '<div class="bb-ticker-group">' +
          '<span class="bb-ticker-item"><i class="bi bi-calendar3" aria-hidden="true"></i><span data-ticker-date></span></span>' +
          '<span class="bb-ticker-dot" aria-hidden="true">•</span>' +
          '<span class="bb-ticker-item"><i class="bi bi-clock" aria-hidden="true"></i><span data-ticker-time></span></span>' +
          '<span class="bb-ticker-dot" aria-hidden="true">•</span>' +
          '<span class="bb-ticker-item"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i><span data-ticker-city>Location not set</span></span>' +
          '<span class="bb-ticker-dot" aria-hidden="true">•</span>' +
          '<span class="bb-ticker-item bb-ticker-brand">Freshly Baked, Made with Love — Bakerz Bite</span>' +
        '</div>';

      ticker.innerHTML =
        '<div class="bb-ticker-viewport">' +
          '<div class="bb-ticker-track">' +
            group +
            group.replace('<div class="bb-ticker-group">', '<div class="bb-ticker-group" aria-hidden="true">') +
          '</div>' +
        '</div>' +
        '<button type="button" class="bb-ticker-locate" aria-label="Set your city for the live ticker">' +
          '<i class="bi bi-crosshair" aria-hidden="true"></i>' +
          '<span class="bb-ticker-locate-text">Set location</span>' +
        '</button>';

      document.body.appendChild(ticker);
      document.body.classList.add('bb-has-ticker');
      if (document.querySelector('.bakerz-footer')) {
        document.body.classList.add('bb-ticker-footer');
      }

      var locateBtn = ticker.querySelector('.bb-ticker-locate');
      locateBtn.addEventListener('click', function () {
        window.BakerzSite.openLocationModal();
      });

      this.applyLocation();
      this.updateTickerClock();

      if (this._tickerTimer) clearInterval(this._tickerTimer);
      this._tickerTimer = setInterval(function () {
        window.BakerzSite.updateTickerClock();
      }, 1000);

      var self = this;
      window.addEventListener('storage', function (event) {
        if (event.key === KEYS.location) self.applyLocation();
      });
    },

    updateTickerClock: function () {
      var now = new Date();
      var dateText = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      var timeText = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      document.querySelectorAll('[data-ticker-date]').forEach(function (el) {
        if (el.textContent !== dateText) el.textContent = dateText;
      });
      document.querySelectorAll('[data-ticker-time]').forEach(function (el) {
        if (el.textContent !== timeText) el.textContent = timeText;
      });
    },

    /* ---------------------------------------------------------------
       Location state — city name only, never coordinates
       --------------------------------------------------------------- */
    getLocation: function () {
      var raw = lsGet(KEYS.location);
      if (!raw) return null;
      try {
        var data = JSON.parse(raw);
        if (!data || typeof data.city !== 'string') return null;
        var city = data.city.trim().slice(0, MAX_CITY);
        if (!city) return null;
        return { city: city, source: data.source === 'manual' ? 'manual' : 'detected' };
      } catch (e) {
        return null;
      }
    },

    setLocation: function (city, source) {
      var clean = String(city || '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().replace(/\s+/g, ' ').slice(0, MAX_CITY);
      if (!clean) return false;
      lsSet(KEYS.location, JSON.stringify({
        city: clean,
        source: source === 'manual' ? 'manual' : 'detected',
        updatedAt: new Date().toISOString()
      }));
      this.applyLocation();
      return true;
    },

    applyLocation: function () {
      var loc = this.getLocation();
      var city = loc ? loc.city : '';

      document.querySelectorAll('[data-ticker-city]').forEach(function (el) {
        el.textContent = city || 'Location not set';
      });

      var button = document.querySelector('.bb-ticker-locate');
      if (button) {
        var label = button.querySelector('.bb-ticker-locate-text');
        if (label) label.textContent = city || 'Set location';
        button.setAttribute('aria-label', city
          ? 'Change your ticker location (currently ' + city + ')'
          : 'Set your city for the live ticker');
        button.title = city ? 'Change location' : 'Set your city';
      }

      var input = document.getElementById('bbManualCityInput');
      if (input && city) input.value = city;
    },

    /* ---------------------------------------------------------------
       Location modal — opened only by a user click
       --------------------------------------------------------------- */
    ensureLocationModal: function () {
      if (document.getElementById('bbLocationModal')) return;

      var modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'bbLocationModal';
      modal.tabIndex = -1;
      modal.setAttribute('aria-labelledby', 'bbLocationModalTitle');
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML =
        '<div class="modal-dialog modal-dialog-centered">' +
          '<div class="modal-content bb-loc-modal">' +
            '<div class="modal-header">' +
              '<h5 class="modal-title brand-font" id="bbLocationModalTitle"><i class="bi bi-geo-alt-fill text-danger me-2"></i>Set your ticker city</h5>' +
              '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
            '</div>' +
            '<div class="modal-body p-4">' +
              '<p class="small text-muted mb-3">Your city appears in the live ticker at the bottom of the site. We only ask when you click below — the site never requests your location on page load.</p>' +
              '<div class="bb-loc-status mb-3" id="bbLocationStatus" role="status" aria-live="polite"></div>' +
              '<button type="button" class="btn btn-bb btn-bb-primary w-100 bb-loc-detect" id="bbDetectLocationBtn">' +
                '<i class="bi bi-crosshair me-2" aria-hidden="true"></i>Use my approximate location' +
              '</button>' +
              '<p class="small text-muted mt-3 mb-2"><i class="bi bi-shield-lock me-1"></i>Your coordinates are not stored. They are only sent once to a free reverse-geocoding service to find your city name.</p>' +
              '<hr class="my-3">' +
              '<label class="form-label small fw-bold" for="bbManualCityInput">Or enter your city manually</label>' +
              '<div class="d-flex gap-2">' +
                '<input type="text" class="form-control form-control-bb" id="bbManualCityInput" maxlength="' + MAX_CITY + '" placeholder="e.g. Karachi" autocomplete="address-level2">' +
                '<button type="button" class="btn btn-bb btn-bb-outline flex-shrink-0" id="bbSaveCityBtn">Save</button>' +
              '</div>' +
              '<div class="small text-muted mt-2">Manual cities are remembered in this browser only.</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      document.body.appendChild(modal);

      var self = this;
      var detectBtn = modal.querySelector('#bbDetectLocationBtn');
      var saveBtn = modal.querySelector('#bbSaveCityBtn');
      var input = modal.querySelector('#bbManualCityInput');

      detectBtn.addEventListener('click', function () { self.detectLocation(); });
      saveBtn.addEventListener('click', function () { self.saveManualCity(); });
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          self.saveManualCity();
        }
      });
      input.addEventListener('input', function () {
        input.classList.remove('is-invalid');
      });
    },

    openLocationModal: function () {
      this.ensureLocationModal();
      var modalEl = document.getElementById('bbLocationModal');
      if (!modalEl) return;

      var input = document.getElementById('bbManualCityInput');
      var loc = this.getLocation();
      if (input) {
        input.value = loc ? loc.city : '';
        input.classList.remove('is-invalid');
      }
      this.setLocationStatus('', '');

      if (window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
        setTimeout(function () {
          if (input) input.focus();
        }, 350);
      }
    },

    setLocationStatus: function (message, type) {
      var status = document.getElementById('bbLocationStatus');
      if (!status) return;
      status.textContent = message || '';
      status.className = 'bb-loc-status mb-3' + (type ? ' is-' + type : '');
    },

    detectLocation: function () {
      var self = this;
      var btn = document.getElementById('bbDetectLocationBtn');
      var input = document.getElementById('bbManualCityInput');

      if (!('geolocation' in navigator)) {
        this.setLocationStatus('This browser does not support location detection. Enter your city manually below.', 'error');
        if (input) input.focus();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.classList.add('is-loading');
      }
      this.setLocationStatus('Detecting your approximate city…', 'info');

      navigator.geolocation.getCurrentPosition(
        function (position) {
          self.reverseGeocode(position.coords.latitude, position.coords.longitude)
            .then(function (city) {
              self.setLocation(city, 'detected');
              self.setLocationStatus('Location set to ' + city + '. You can still type a different city below.', 'success');
              self._toast('Ticker location updated to ' + city + '.', 'success', '📍');
              setTimeout(function () { self.hideLocationModal(); }, 900);
            })
            .catch(function () {
              self.setLocationStatus('We found your position but could not name the city. Enter your city manually below.', 'error');
              if (input) input.focus();
            })
            .then(function () { self.resetDetectButton(); });
        },
        function (error) {
          var message = 'We could not detect your location. Enter your city manually below.';
          if (error && error.code === 1) {
            message = 'Location permission was denied. You can enter your city manually below — everything else works normally.';
          } else if (error && error.code === 2) {
            message = 'Your location is currently unavailable. Enter your city manually below.';
          } else if (error && error.code === 3) {
            message = 'The location request timed out. Try again or enter your city manually below.';
          }
          self.setLocationStatus(message, 'error');
          self.resetDetectButton();
          if (input) input.focus();
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    },

    resetDetectButton: function () {
      var btn = document.getElementById('bbDetectLocationBtn');
      if (!btn) return;
      btn.disabled = false;
      btn.classList.remove('is-loading');
    },

    hideLocationModal: function () {
      var modalEl = document.getElementById('bbLocationModal');
      if (!modalEl || !window.bootstrap) return;
      var modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    },

    reverseGeocode: function (latitude, longitude) {
      if (typeof fetch !== 'function' || typeof AbortController !== 'function') {
        return Promise.reject(new Error('Reverse geocoding unsupported'));
      }
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 8000);
      var url = REVERSE_GEOCODE_URL +
        '?latitude=' + encodeURIComponent(latitude) +
        '&longitude=' + encodeURIComponent(longitude) +
        '&localityLanguage=en';

      return fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
        .then(function (response) {
          if (!response.ok) throw new Error('Reverse geocoding failed');
          return response.json();
        })
        .then(function (data) {
          var city = data.city || data.locality || data.principalSubdivision || data.countryName;
          if (!city) throw new Error('No city returned');
          return String(city).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, MAX_CITY);
        })
        .then(function (city) {
          clearTimeout(timer);
          return city;
        }, function (error) {
          clearTimeout(timer);
          throw error;
        });
    },

    saveManualCity: function () {
      var input = document.getElementById('bbManualCityInput');
      if (!input) return;
      var city = input.value.trim().replace(/\s+/g, ' ');
      if (city.length < 2) {
        input.classList.add('is-invalid');
        this.setLocationStatus('Please enter a city name with at least 2 characters.', 'error');
        input.focus();
        return;
      }
      if (city.length > MAX_CITY) city = city.slice(0, MAX_CITY);
      input.classList.remove('is-invalid');
      this.setLocation(city, 'manual');
      input.value = city;
      this.setLocationStatus('Location set to ' + city + '.', 'success');
      if (window.BakerzToasts) {
        window.BakerzToasts.show('Ticker location updated to ' + city + '.', 'success', '📍');
      }
      var self = this;
      setTimeout(function () { self.hideLocationModal(); }, 800);
    },

    _toast: function (message, type, icon) {
      if (window.BakerzToasts) window.BakerzToasts.show(message, type, icon);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.BakerzSite.init();
  });
})();
