/**
 * Bakerz Bite - Forms Validation, Toast Notifications, and Demo Authentication
 */

(function () {
  function isValidPhone(value) {
    const raw = String(value || '').trim();
    if (!raw || raw.length > 24) return false;
    if (!/^\+?[0-9()\s.-]+$/.test(raw)) return false;
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return false;
    if (/^0+$/.test(digits)) return false;
    return true;
  }

  // Toast System
  window.BakerzToasts = {
    show: function (message, type = 'info', icon = '✨', options = {}) {
      let container = document.getElementById('bakerzToastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'bakerzToastContainer';
        container.className = 'toast-container-bb';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast-bb toast-${type}`;
      const actionLabel = options.actionLabel || '';
      toast.innerHTML = `
        <span style="font-size: 1.4rem;">${icon}</span>
        <div class="flex-grow-1 small fw-bold text-dark"></div>
        ${actionLabel ? `<button type="button" class="btn btn-link p-0 fw-bold text-decoration-none toast-action-bb">${actionLabel}</button>` : ''}
        <button type="button" class="btn-close btn-close-sm" aria-label="Close"></button>
      `;
      toast.querySelector('.flex-grow-1').textContent = message;

      let timeoutId = 0;
      const dismiss = () => {
        clearTimeout(timeoutId);
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      };

      toast.querySelector('.btn-close').addEventListener('click', dismiss);
      const actionBtn = toast.querySelector('.toast-action-bb');
      if (actionBtn) {
        actionBtn.addEventListener('click', () => {
          dismiss();
          if (typeof options.onAction === 'function') options.onAction();
        });
      }

      container.appendChild(toast);
      timeoutId = setTimeout(dismiss, options.duration || 4000);
    }
  };

  // Forms Handler
  window.BakerzForms = {
    init: function () {
      this.bindPasswordToggles();
      this.bindNewsletter();
      this.bindContactForm();
      this.bindCheckoutForm();
      this.bindAuthForms();
    },

    bindPasswordToggles: function () {
      document.querySelectorAll('.password-toggle-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          const input = this.parentElement.querySelector('input');
          if (!input) return;
          if (input.type === 'password') {
            input.type = 'text';
            this.innerHTML = '<i class="bi bi-eye-slash"></i>';
          } else {
            input.type = 'password';
            this.innerHTML = '<i class="bi bi-eye"></i>';
          }
        });
      });
    },

    bindNewsletter: function () {
      document.querySelectorAll('.newsletter-form').forEach(form => {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          const emailInput = this.querySelector('input[type="email"]');
          if (!emailInput || !emailInput.value.trim()) return;

          const email = emailInput.value.trim();
          try {
            const raw = localStorage.getItem('bakerz_newsletter_subscribers');
            const list = raw ? JSON.parse(raw) : [];
            if (!list.includes(email)) {
              list.push(email);
              localStorage.setItem('bakerz_newsletter_subscribers', JSON.stringify(list));
            }
          } catch (err) {}

          emailInput.value = '';
          window.BakerzToasts.show('Welcome to our sweet family! 10% voucher sent to your demo inbox.', 'success', '💌');
        });
      });
    },

    bindContactForm: function () {
      const form = document.getElementById('contactUsForm');
      if (!form) return;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = form.querySelector('[name="name"]')?.value.trim();
        const email = form.querySelector('[name="email"]')?.value.trim();
        const message = form.querySelector('[name="message"]')?.value.trim();

        if (!name || !email || !message) {
          window.BakerzToasts.show('Please fill in all required contact fields.', 'info', '⚠️');
          return;
        }

        try {
          const raw = localStorage.getItem('bakerz_contact_inquiries');
          const list = raw ? JSON.parse(raw) : [];
          list.push({
            name, email, message,
            date: new Date().toLocaleString()
          });
          localStorage.setItem('bakerz_contact_inquiries', JSON.stringify(list));
        } catch (err) {}

        form.reset();
        window.BakerzToasts.show(`Thank you, ${name}! Our master baker will reply shortly.`, 'success', '🧁');
      });
    },

    bindCheckoutForm: function () {
      const form = document.getElementById('checkoutOrderForm');
      if (!form) return;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const items = window.BakerzCart ? window.BakerzCart.getItems() : [];

        if (items.length === 0) {
          window.BakerzToasts.show('Your basket is empty! Add products before checking out.', 'info', '🛒');
          return;
        }

        const name = form.querySelector('[name="fullname"]')?.value.trim();
        const phone = form.querySelector('[name="phone"]')?.value.trim();
        const email = form.querySelector('[name="email"]')?.value.trim() || '';
        const address = form.querySelector('[name="address"]')?.value.trim();
        const city = form.querySelector('[name="city"]')?.value.trim() || '';
        const timeslot = form.querySelector('[name="timeslot"]')?.value.trim() || '';
        const orderNotes = form.querySelector('[name="orderNotes"]')?.value.trim() || '';
        const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked')?.value || 'Cash on Delivery';

        if (!name || !phone || !address) {
          window.BakerzToasts.show('Please enter complete delivery details.', 'info', '📍');
          return;
        }

        if (!isValidPhone(phone)) {
          window.BakerzToasts.show('Please enter a valid phone number (10–15 digits; use digits, spaces, +, -, or parentheses).', 'info', '📞');
          const phoneInput = form.querySelector('[name="phone"]');
          if (phoneInput) phoneInput.focus();
          return;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          window.BakerzToasts.show('That email address looks incomplete. Fix it or leave the field blank.', 'info', '✉️');
          return;
        }

        const summary = window.BakerzCart ? window.BakerzCart.getSummary() : { total: 0 };
        const orderId = 'BB-' + Math.floor(100000 + Math.random() * 900000);

        const newOrder = {
          orderId,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          items: [...items],
          total: summary.total,
          customerName: name,
          phone,
          email,
          address,
          city,
          deliverySlot: timeslot,
          orderNotes,
          paymentMethod,
          status: 'Freshly Baking'
        };

        // Save order to demo order list in localStorage
        try {
          const raw = localStorage.getItem('bakerz_demo_orders');
          const orders = raw ? JSON.parse(raw) : [];
          orders.unshift(newOrder);
          localStorage.setItem('bakerz_demo_orders', JSON.stringify(orders));
        } catch (err) {}

        // Clear cart
        if (window.BakerzCart) {
          window.BakerzCart.clear();
        }

        // Show confirmation modal
        const modalEl = document.getElementById('orderConfirmationModal');
        const orderIdEl = document.getElementById('confirmationOrderId');
        const orderTotalEl = document.getElementById('confirmationOrderTotal');
        const deliverySlotEl = document.getElementById('confirmationDeliverySlot');

        if (orderIdEl) orderIdEl.textContent = orderId;
        if (orderTotalEl) orderTotalEl.textContent = `Rs. ${summary.total.toLocaleString()}`;
        if (deliverySlotEl) deliverySlotEl.textContent = timeslot || '35–45 Minutes';

        if (modalEl && window.bootstrap) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
        } else {
          window.location.href = `dashboard.html?orderSuccess=${orderId}`;
        }
      });
    },

    bindAuthForms: function () {
      const loginForm = document.getElementById('demoLoginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const email = loginForm.querySelector('[name="email"]')?.value.trim();
          const emailUser = (email.split('@')[0] || 'Sweet Guest').replace(/[._-]+/g, ' ').trim();
          const name = emailUser.replace(/\b\w/g, c => c.toUpperCase()) || 'Sweet Guest';

          localStorage.setItem('bakerz_demo_user', JSON.stringify({
            name: name,
            email: email,
            points: 380,
            tier: 'Silver'
          }));

          window.BakerzToasts.show(`Welcome back, ${name}! Redirecting to dashboard...`, 'success', '👋');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        });
      }

      const signupForm = document.getElementById('demoSignupForm');
      if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const name = signupForm.querySelector('[name="fullname"]')?.value.trim() || 'New Baker';
          const email = signupForm.querySelector('[name="email"]')?.value.trim();

          localStorage.setItem('bakerz_demo_user', JSON.stringify({
            name: name,
            email: email,
            points: 100, // Welcome bonus points!
            tier: 'Bronze'
          }));

          window.BakerzToasts.show(`Account created! 100 bonus loyalty points added.`, 'success', '🎉');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        });
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.BakerzForms.init();
  });
})();
