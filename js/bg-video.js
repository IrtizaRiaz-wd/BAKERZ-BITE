/* Responsive background video: one clip at a time, battery-friendly pausing. */
(function () {
  'use strict';

  var wrap = document.querySelector('.bb-bg-video');
  if (!wrap) return;

  var desktop = wrap.querySelector('.bb-bg-video__media--desktop');
  var mobile = wrap.querySelector('.bb-bg-video__media--mobile');
  var media = [desktop, mobile].filter(Boolean);
  if (!media.length) return;

  var desktopQuery = window.matchMedia('(min-width: 992px)');
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var inView = true;

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      sync();
    }, { threshold: 0 }).observe(wrap);
  }

  function safePlay(video) {
    if (!video || video.classList.contains('is-broken')) return;
    try {
      var result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function () {});
      }
    } catch (err) {
      /* autoplay blocked: poster/veil still renders */
    }
  }

  function sync() {
    var active = desktopQuery.matches ? desktop : mobile;
    media.forEach(function (video) {
      if (video !== active || motionQuery.matches || document.hidden || !inView) {
        video.pause();
      } else {
        if (video.preload !== 'auto') video.preload = 'auto';
        safePlay(video);
      }
    });
  }

  media.forEach(function (video) {
    video.addEventListener('error', function () {
      video.classList.add('is-broken');
    });
    video.addEventListener('loadeddata', sync);
    video.addEventListener('canplay', sync);
  });

  if (typeof desktopQuery.addEventListener === 'function') {
    desktopQuery.addEventListener('change', sync);
    motionQuery.addEventListener('change', sync);
  } else if (typeof desktopQuery.addListener === 'function') {
    desktopQuery.addListener(sync);
    motionQuery.addListener(sync);
  }

  document.addEventListener('visibilitychange', sync);
  sync();
})();
