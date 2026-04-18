(function () {
  'use strict';

  var CAROUSEL_INTERVAL = 4000;
  var CLICK_ANIM_DURATION = 500;
  var CAROUSEL_TRANSITION_MS = 580;
  var SCAN_CLASS_MS = 650;

  /* ----- Carousel: scan-line reveal ----- */
  var carousels = document.querySelectorAll('.card-carousel');
  carousels.forEach(function (wrap) {
    var imgs = wrap.querySelectorAll('img');
    if (imgs.length <= 1) return;
    var index = 0;
    imgs[0].classList.add('active');
    setInterval(function () {
      var prev = index;
      index = (index + 1) % imgs.length;
      wrap.classList.add('scan');
      imgs[prev].classList.add('leaving');
      imgs[prev].classList.remove('active');
      imgs[index].classList.add('active');
      setTimeout(function () {
        imgs[prev].classList.remove('leaving');
      }, CAROUSEL_TRANSITION_MS);
      setTimeout(function () {
        wrap.classList.remove('scan');
      }, SCAN_CLASS_MS);
    }, CAROUSEL_INTERVAL);
  });

  /* ----- Cards: click animation + open modal ----- */
  var cards = document.querySelectorAll('.condition-card');
  var modal = document.getElementById('data-modal');
  var modalBackdrop = modal && modal.querySelector('.modal-backdrop');
  var modalClose = modal && modal.querySelector('.modal-close');

  function openModal() {
    if (!modal) return;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function handleCardClick(e) {
    var card = e.currentTarget;
    if (card.classList.contains('click-animate')) return;
    card.classList.add('click-animate');
    setTimeout(function () {
      card.classList.remove('click-animate');
    }, CLICK_ANIM_DURATION);
    openModal();
  }

  cards.forEach(function (card) {
    card.addEventListener('click', handleCardClick);
  });

  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);

  var headerDownloadBtn = document.getElementById('header-download-btn');
  if (headerDownloadBtn) headerDownloadBtn.addEventListener('click', openModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hasAttribute('hidden')) closeModal();
  });

  /* ----- Video demo: tab + clip switching ----- */
  var demoData = {
    complex:  [
      'video_demo/demo_show/Complex_Traffic_Driving.mp4',
      'video_demo/demo_show/Complex_Traffic_Driving1.mp4',
      'video_demo/demo_show/Complex_Traffic_Driving2.mp4'
    ],
    critical: [
      'video_demo/demo_show/Critical_Driving.mp4',
      'video_demo/demo_show/Critical_Driving1.mp4',
      'video_demo/demo_show/Critical_Driving2.mp4'
    ],
    lowlight: [
      'video_demo/demo_show/lowlight1.mp4',
      'video_demo/demo_show/lowlight2.mp4',
      'video_demo/demo_show/lowlight3.mp4'
    ],
    rain: [
      'video_demo/demo_show/rain.mp4',
      'video_demo/demo_show/rain1.mp4',
      'video_demo/demo_show/rain2.mp4'
    ],
    snow: [
      'video_demo/demo_show/snow.mp4',
      'video_demo/demo_show/snow1.mp4',
      'video_demo/demo_show/snow2.mp4'
    ]
  };

  var activeCategory = 'complex';
  var activeClip = 0;

  var demoVideo = document.getElementById('demo-video');
  var demoTabs = document.querySelectorAll('.demo-tab');
  var demoClips = document.querySelectorAll('.demo-clip');

  function loadDemoVideo() {
    if (!demoVideo) return;
    var src = demoData[activeCategory][activeClip];
    demoVideo.src = src;
    demoVideo.load();
  }

  demoTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var cat = tab.getAttribute('data-category');
      if (cat === activeCategory) return;
      activeCategory = cat;
      activeClip = 0;

      demoTabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      demoClips.forEach(function (c) { c.classList.remove('active'); });
      if (demoClips[0]) demoClips[0].classList.add('active');

      loadDemoVideo();
    });
  });

  demoClips.forEach(function (clip) {
    clip.addEventListener('click', function () {
      var idx = parseInt(clip.getAttribute('data-clip'), 10);
      if (idx === activeClip) return;
      activeClip = idx;

      demoClips.forEach(function (c) { c.classList.remove('active'); });
      clip.classList.add('active');

      loadDemoVideo();
    });
  });

})();
