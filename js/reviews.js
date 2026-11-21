/**
 * Bakerz Bite — Guest review submission
 * Stores reviews in localStorage for this browser only. All user content is
 * rendered with textContent; malformed storage data is ignored safely.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'bakerz_bite_reviews';
  var LAST_SUBMIT_KEY = 'bakerz_bite_review_last_submit';
  var MAX_REVIEWS = 100;
  var COOLDOWN_MS = 15000;
  var MAX_NAME = 40;
  var MAX_TITLE = 60;
  var MAX_MESSAGE = 500;
  var MIN_MESSAGE = 10;

  var reviews = [];

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

  function cleanLine(value, max) {
    return String(value == null ? '' : value)
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }

  function cleanMessage(value) {
    return String(value == null ? '' : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, MAX_MESSAGE);
  }

  function isIsoDate(value) {
    if (typeof value !== 'string') return false;
    var date = new Date(value);
    return !isNaN(date.getTime());
  }

  function readStoredReviews() {
    var raw = lsGet(STORAGE_KEY);
    if (!raw) return [];
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return [];
    }
    if (!Array.isArray(parsed)) return [];

    var seen = Object.create(null);
    var out = [];
    parsed.forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      var id = typeof item.id === 'string' ? item.id.slice(0, 80) : '';
      if (!id || seen[id]) return;
      var name = cleanLine(item.name, MAX_NAME);
      var title = cleanLine(item.title, MAX_TITLE);
      var message = cleanMessage(item.message);
      var rating = parseInt(item.rating, 10);
      if (!name || !title || message.length < MIN_MESSAGE) return;
      if (!(rating >= 1 && rating <= 5)) return;
      if (!isIsoDate(item.date)) return;
      var category = cleanLine(item.category, 60);
      seen[id] = true;
      out.push({
        id: id,
        name: name,
        rating: rating,
        title: title,
        message: message,
        category: category,
        date: new Date(item.date).toISOString(),
        source: 'local-submission'
      });
    });

    out.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    return out.slice(0, MAX_REVIEWS);
  }

  function persistReviews(list) {
    return lsSet(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_REVIEWS)));
  }

  function starString(rating) {
    var filled = Math.max(0, Math.min(5, Math.round(rating)));
    return '★★★★★'.slice(0, filled) + '☆☆☆☆☆'.slice(0, 5 - filled);
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }

  function makeId(existing) {
    var ids = existing.map(function (r) { return r.id; });
    var id = '';
    do {
      id = 'rev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    } while (ids.indexOf(id) !== -1);
    return id;
  }

  function populateCategories(select) {
    if (!select || !window.BakerzProducts) return;
    var names = [];
    window.BakerzProducts.forEach(function (product) {
      if (product && product.categoryName && names.indexOf(product.categoryName) === -1) {
        names.push(product.categoryName);
      }
    });
    names.sort();
    names.forEach(function (name) {
      var option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  }

  function showError(input, errorEl, message) {
    if (input) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('d-block');
    }
  }

  function clearError(input, errorEl) {
    if (input) {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    }
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('d-block');
    }
  }

  function setStatus(message, type) {
    var status = document.getElementById('reviewFormStatus');
    if (!status) return;
    status.textContent = message || '';
    status.className = 'bb-form-status' + (type ? ' is-' + type : '');
  }

  function updateCharCount(messageEl, countEl) {
    var length = messageEl.value.length;
    countEl.textContent = length + ' / ' + MAX_MESSAGE;
    countEl.classList.toggle('is-near-limit', length > MAX_MESSAGE - 40);
  }

  /* ---------------------------------------------------------------
     Rendering
     --------------------------------------------------------------- */
  function renderSummary() {
    var count = reviews.length;
    var total = reviews.reduce(function (sum, review) { return sum + review.rating; }, 0);
    var average = count ? total / count : 0;

    var averageEl = document.getElementById('reviewAverage');
    var averageStars = document.getElementById('reviewAverageStars');
    var countBadge = document.getElementById('reviewCountBadge');
    var summaryNote = document.getElementById('reviewSummaryNote');

    if (averageEl) averageEl.textContent = count ? average.toFixed(1) : '—';
    if (averageStars) {
      averageStars.textContent = count ? starString(average) : '☆☆☆☆☆';
      averageStars.setAttribute('aria-label', count
        ? 'Average rating ' + average.toFixed(1) + ' out of 5 stars'
        : 'No ratings yet');
    }
    if (countBadge) countBadge.textContent = count + (count === 1 ? ' review' : ' reviews');
    if (summaryNote) {
      summaryNote.textContent = count
        ? 'Average from ' + count + ' submitted review' + (count === 1 ? '' : 's') + ' in this browser.'
        : 'No reviews submitted in this browser yet.';
    }

    var bars = document.getElementById('reviewBars');
    if (!bars) return;
    bars.textContent = '';
    [5, 4, 3, 2, 1].forEach(function (stars) {
      var starCount = reviews.filter(function (review) { return review.rating === stars; }).length;
      var percent = count ? Math.round((starCount / count) * 100) : 0;

      var row = document.createElement('div');
      row.className = 'bb-review-bar-row';

      var label = document.createElement('span');
      label.className = 'bb-review-bar-label';
      label.textContent = stars + ' ★';

      var track = document.createElement('span');
      track.className = 'bb-review-bar-track';
      var fill = document.createElement('span');
      fill.className = 'bb-review-bar-fill';
      fill.style.width = percent + '%';
      track.appendChild(fill);

      var countEl = document.createElement('span');
      countEl.className = 'bb-review-bar-count';
      countEl.textContent = starCount;

      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(countEl);
      bars.appendChild(row);
    });
  }

  function buildReviewCard(review, isNew) {
    var card = document.createElement('article');
    card.className = 'clay-card bb-review-card';
    card.setAttribute('aria-label', 'Review by ' + review.name);

    var head = document.createElement('div');
    head.className = 'bb-review-card-head';

    var avatar = document.createElement('span');
    avatar.className = 'bb-review-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = review.name.charAt(0).toUpperCase();

    var identity = document.createElement('div');
    identity.className = 'flex-grow-1';

    var name = document.createElement('h4');
    name.className = 'bb-review-name';
    name.textContent = review.name;

    var date = document.createElement('time');
    date.className = 'bb-review-date';
    date.dateTime = review.date;
    date.textContent = formatDate(review.date);

    identity.appendChild(name);
    identity.appendChild(date);

    var stars = document.createElement('span');
    stars.className = 'bb-review-stars';
    stars.textContent = starString(review.rating);
    stars.setAttribute('aria-label', review.rating + ' out of 5 stars');

    head.appendChild(avatar);
    head.appendChild(identity);
    head.appendChild(stars);

    var title = document.createElement('h3');
    title.className = 'bb-review-title';
    title.textContent = review.title;

    var message = document.createElement('p');
    message.className = 'bb-review-message';
    message.textContent = review.message;

    var meta = document.createElement('div');
    meta.className = 'bb-review-meta';

    if (review.category) {
      var tag = document.createElement('span');
      tag.className = 'bb-review-tag';
      tag.textContent = 'About: ' + review.category;
      meta.appendChild(tag);
    }

    var source = document.createElement('span');
    source.className = 'bb-review-source';
    source.textContent = 'Guest submission · stored in this browser';
    meta.appendChild(source);

    card.appendChild(head);
    card.appendChild(title);
    card.appendChild(message);
    card.appendChild(meta);

    if (isNew) {
      card.tabIndex = -1;
      card.setAttribute('data-new-review', 'true');
    }

    return card;
  }

  function buildEmptyState() {
    var empty = document.createElement('div');
    empty.className = 'bb-reviews-empty';

    var icon = document.createElement('span');
    icon.className = 'bb-reviews-empty-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<i class="bi bi-chat-heart"></i>';

    var heading = document.createElement('h4');
    heading.className = 'brand-font';
    heading.textContent = 'Be the first to share the sweetness';

    var copy = document.createElement('p');
    copy.className = 'mb-3';
    copy.textContent = 'No reviews have been submitted in this browser yet. Your feedback helps us keep every batch worth coming back for.';

    var link = document.createElement('a');
    link.className = 'btn btn-bb btn-bb-outline btn-bb-sm';
    link.href = '#reviewForm';
    link.textContent = 'Write the first review';

    empty.appendChild(icon);
    empty.appendChild(heading);
    empty.appendChild(copy);
    empty.appendChild(link);
    return empty;
  }

  function renderList(newReviewId) {
    var list = document.getElementById('reviewList');
    if (!list) return;
    list.textContent = '';

    if (!reviews.length) {
      list.appendChild(buildEmptyState());
      renderSummary();
      return;
    }

    reviews.forEach(function (review) {
      list.appendChild(buildReviewCard(review, review.id === newReviewId));
    });
    renderSummary();

    if (newReviewId) {
      var fresh = list.querySelector('[data-new-review="true"]');
      if (fresh) {
        fresh.focus({ preventScroll: true });
        fresh.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  /* ---------------------------------------------------------------
     Validation + submission
     --------------------------------------------------------------- */
  function validate(form) {
    var errors = [];
    var nameEl = document.getElementById('reviewName');
    var nameError = document.getElementById('reviewNameError');
    var titleEl = document.getElementById('reviewTitle');
    var titleError = document.getElementById('reviewTitleError');
    var messageEl = document.getElementById('reviewMessage');
    var messageError = document.getElementById('reviewMessageError');
    var ratingField = document.getElementById('reviewRatingField');
    var ratingError = document.getElementById('reviewRatingError');
    var rating = form.querySelector('input[name="rating"]:checked');

    var name = cleanLine(nameEl.value, MAX_NAME);
    if (name.length < 2) {
      showError(nameEl, nameError, 'Please enter your name (at least 2 characters).');
      errors.push(nameEl);
    } else {
      clearError(nameEl, nameError);
    }

    if (!rating) {
      ratingField.classList.add('is-invalid');
      ratingError.classList.add('d-block');
      errors.push(ratingField.querySelector('input[name="rating"]'));
    } else {
      ratingField.classList.remove('is-invalid');
      ratingError.classList.remove('d-block');
    }

    var title = cleanLine(titleEl.value, MAX_TITLE);
    if (title.length < 3) {
      showError(titleEl, titleError, 'Please add a short review title (at least 3 characters).');
      errors.push(titleEl);
    } else {
      clearError(titleEl, titleError);
    }

    var message = cleanMessage(messageEl.value);
    if (message.length < MIN_MESSAGE) {
      showError(messageEl, messageError, 'Please write at least ' + MIN_MESSAGE + ' characters about your experience.');
      errors.push(messageEl);
    } else if (messageEl.value.length > MAX_MESSAGE) {
      showError(messageEl, messageError, 'Please keep your review under ' + MAX_MESSAGE + ' characters.');
      errors.push(messageEl);
    } else {
      clearError(messageEl, messageError);
    }

    if (errors.length) {
      setStatus('Please fix the highlighted fields before submitting.', 'error');
      var first = errors[0];
      if (first && typeof first.focus === 'function') first.focus();
      return null;
    }

    return {
      name: name,
      rating: parseInt(rating.value, 10),
      title: title,
      message: message,
      category: cleanLine(document.getElementById('reviewCategory').value, 60)
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var data = validate(form);
    if (!data) return;

    var lastSubmit = parseInt(ssGet(LAST_SUBMIT_KEY), 10) || 0;
    if (Date.now() - lastSubmit < COOLDOWN_MS) {
      setStatus('Please wait a few seconds before submitting another review.', 'error');
      return;
    }

    var review = {
      id: makeId(reviews),
      name: data.name,
      rating: data.rating,
      title: data.title,
      message: data.message,
      category: data.category,
      date: new Date().toISOString(),
      source: 'local-submission'
    };

    reviews.unshift(review);
    reviews = reviews.slice(0, MAX_REVIEWS);
    var saved = persistReviews(reviews);
    ssSet(LAST_SUBMIT_KEY, String(Date.now()));

    form.reset();
    document.getElementById('reviewRatingField').classList.remove('is-invalid');
    document.getElementById('reviewRatingError').classList.remove('d-block');
    [
      ['reviewName', 'reviewNameError'],
      ['reviewTitle', 'reviewTitleError'],
      ['reviewMessage', 'reviewMessageError']
    ].forEach(function (pair) {
      clearError(document.getElementById(pair[0]), document.getElementById(pair[1]));
    });
    var messageEl = document.getElementById('reviewMessage');
    var countEl = document.getElementById('reviewMessageCount');
    if (messageEl && countEl) updateCharCount(messageEl, countEl);

    renderList(review.id);

    setStatus(
      saved
        ? 'Thank you, ' + data.name + '! Your review is saved in this browser.'
        : 'Thank you, ' + data.name + '! Browser storage is unavailable, so this review will disappear when you leave the page.',
      'success'
    );

    if (window.BakerzToasts) {
      window.BakerzToasts.show(
        saved ? 'Your review has been added below.' : 'Review added for this visit only.',
        'success',
        '💬'
      );
    }
  }

  function init() {
    var form = document.getElementById('reviewForm');
    if (!form) return;

    reviews = readStoredReviews();

    var categorySelect = document.getElementById('reviewCategory');
    populateCategories(categorySelect);

    var messageEl = document.getElementById('reviewMessage');
    var countEl = document.getElementById('reviewMessageCount');
    if (messageEl && countEl) {
      updateCharCount(messageEl, countEl);
      messageEl.addEventListener('input', function () {
        updateCharCount(messageEl, countEl);
      });
    }

    ['reviewName', 'reviewTitle', 'reviewMessage'].forEach(function (id) {
      var input = document.getElementById(id);
      var error = document.getElementById(id + 'Error');
      if (!input) return;
      input.addEventListener('input', function () {
        clearError(input, error);
      });
    });

    form.querySelectorAll('input[name="rating"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        document.getElementById('reviewRatingField').classList.remove('is-invalid');
        document.getElementById('reviewRatingError').classList.remove('d-block');
      });
    });

    form.addEventListener('submit', handleSubmit);
    renderList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
