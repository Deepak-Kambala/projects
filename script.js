const themeToggle = document.querySelector('.theme-toggle');
const savedTheme = localStorage.getItem('deepak-theme');

if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  themeToggle.textContent = '☀';
  themeToggle.setAttribute('aria-label', 'Switch to light mode');
}

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('deepak-theme', isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '☀' : '☾';
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
});

const navLinks = [...document.querySelectorAll('.nav a')];
const sections = [...document.querySelectorAll('.content .section, .page-intro, #hacktoberfest')];
const observer = new IntersectionObserver((entries) => {
  const visibleEntries = entries.filter((entry) => entry.isIntersecting);
  const mostVisible = visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!mostVisible) return;

  navLinks.forEach((link) => {
    const active = link.hash === `#${mostVisible.target.id}`;
    const wasActive = link.classList.contains('active');
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
    if (active && !wasActive && window.matchMedia('(max-width: 800px)').matches) {
      link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
}, { rootMargin: '-25% 0px -65% 0px' });

sections.forEach((section) => observer.observe(section));

// Gallery Carousel (Infinite Circular Loop)
const galleryTrack = document.getElementById('gallery-track');
const galleryPrevBtn = document.getElementById('gallery-prev');
const galleryNextBtn = document.getElementById('gallery-next');
const galleryIndicator = document.getElementById('gallery-indicator');
const galleryViewport = document.getElementById('gallery-viewport');

if (galleryTrack && galleryPrevBtn && galleryNextBtn) {
  const cards = Array.from(galleryTrack.querySelectorAll('.gallery-card'));
  const ITEMS_PER_PAGE = 6;
  const pageCount = Math.ceil(cards.length / ITEMS_PER_PAGE) || 1;

  // Build logical pages
  const pages = [];
  for (let i = 0; i < pageCount; i++) {
    const page = document.createElement('div');
    page.className = 'gallery-page';
    page.setAttribute('role', 'group');
    page.setAttribute('aria-label', `Page ${i + 1} of ${pageCount}`);
    cards.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE).forEach((card) => {
      page.appendChild(card);
    });
    pages.push(page);
  }

  galleryTrack.innerHTML = '';

  let currentIndex = 0;
  let isAnimating = false;
  let animationTimeout = null;

  if (pageCount > 1) {
    // Clone last page to prepend and first page to append for seamless infinite looping
    const firstClone = pages[0].cloneNode(true);
    const lastClone = pages[pageCount - 1].cloneNode(true);

    firstClone.classList.add('gallery-page-clone');
    lastClone.classList.add('gallery-page-clone');
    firstClone.setAttribute('aria-hidden', 'true');
    lastClone.setAttribute('aria-hidden', 'true');

    // Remove tabindex from clones so keyboard tab navigation only focuses real cards
    [firstClone, lastClone].forEach((clone) => {
      clone.querySelectorAll('[tabindex]').forEach((el) => {
        el.setAttribute('tabindex', '-1');
      });
    });

    galleryTrack.appendChild(lastClone);
    pages.forEach((page) => galleryTrack.appendChild(page));
    galleryTrack.appendChild(firstClone);

    // Initial position is index 1 (the first real page)
    currentIndex = 1;
    galleryPrevBtn.disabled = false;
    galleryNextBtn.disabled = false;
  } else {
    pages.forEach((page) => galleryTrack.appendChild(page));
    currentIndex = 0;
    galleryPrevBtn.disabled = true;
    galleryNextBtn.disabled = true;
  }

  const getDisplayPage = (index) => {
    if (pageCount <= 1) return 1;
    if (index === 0) return pageCount;
    if (index === pageCount + 1) return 1;
    return index;
  };

  const updateIndicator = () => {
    if (galleryIndicator) {
      galleryIndicator.textContent = `${getDisplayPage(currentIndex)} / ${pageCount}`;
    }
  };

  const setPosition = (index, animate = true) => {
    if (animate) {
      galleryTrack.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
    } else {
      galleryTrack.style.transition = 'none';
    }
    galleryTrack.style.transform = `translateX(-${index * 100}%)`;
    if (!animate) {
      void galleryTrack.offsetHeight; // Force reflow
    }
  };

  const resetAfterAnimation = () => {
    if (pageCount > 1) {
      if (currentIndex >= pageCount + 1) {
        currentIndex = 1;
        setPosition(currentIndex, false);
      } else if (currentIndex <= 0) {
        currentIndex = pageCount;
        setPosition(currentIndex, false);
      }
    }
    isAnimating = false;
  };

  galleryTrack.addEventListener('transitionend', (e) => {
    if (e.target !== galleryTrack || e.propertyName !== 'transform') return;
    clearTimeout(animationTimeout);
    resetAfterAnimation();
  });

  const goToNext = () => {
    if (pageCount <= 1 || isAnimating) return;
    isAnimating = true;
    currentIndex++;
    updateIndicator();
    setPosition(currentIndex, true);
    clearTimeout(animationTimeout);
    animationTimeout = setTimeout(resetAfterAnimation, 500);
  };

  const goToPrev = () => {
    if (pageCount <= 1 || isAnimating) return;
    isAnimating = true;
    currentIndex--;
    updateIndicator();
    setPosition(currentIndex, true);
    clearTimeout(animationTimeout);
    animationTimeout = setTimeout(resetAfterAnimation, 500);
  };

  galleryPrevBtn.addEventListener('click', () => {
    goToPrev();
    restartAutoMove();
  });

  galleryNextBtn.addEventListener('click', () => {
    goToNext();
    restartAutoMove();
  });

  // Initialize track position without animation
  setPosition(currentIndex, false);
  updateIndicator();

  // Auto-move every 10 seconds
  const AUTO_MOVE_DELAY = 10000;
  let autoMoveTimer = null;
  let isHovered = false;

  const isLightboxActive = () => {
    const lb = document.getElementById('gallery-lightbox');
    return lb && lb.classList.contains('active');
  };

  const startAutoMove = () => {
    stopAutoMove();
    if (pageCount <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.hidden || isHovered || isLightboxActive()) return;

    autoMoveTimer = setTimeout(() => {
      goToNext();
      startAutoMove();
    }, AUTO_MOVE_DELAY);
  };

  const stopAutoMove = () => {
    if (autoMoveTimer) {
      clearTimeout(autoMoveTimer);
      autoMoveTimer = null;
    }
  };

  const restartAutoMove = () => {
    stopAutoMove();
    startAutoMove();
  };

  const galleryCarousel = document.querySelector('.gallery-carousel');
  if (galleryCarousel) {
    galleryCarousel.addEventListener('mouseenter', () => {
      isHovered = true;
      stopAutoMove();
    });

    galleryCarousel.addEventListener('mouseleave', () => {
      isHovered = false;
      startAutoMove();
    });

    galleryCarousel.addEventListener('focusin', () => {
      isHovered = true;
      stopAutoMove();
    });

    galleryCarousel.addEventListener('focusout', (e) => {
      if (!galleryCarousel.contains(e.relatedTarget)) {
        isHovered = false;
        startAutoMove();
      }
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoMove();
    } else {
      startAutoMove();
    }
  });

  // Start auto-move
  startAutoMove();

  // Expose hooks for lightbox to pause/resume auto-move
  window._galleryAutoMove = { start: startAutoMove, stop: stopAutoMove };

  // Touch swipe support for mobile
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  galleryViewport.addEventListener('touchstart', (e) => {
    if (isAnimating) return;
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    isSwiping = true;
    stopAutoMove();
  }, { passive: true });

  galleryViewport.addEventListener('touchend', (e) => {
    if (!isSwiping || isAnimating) return;
    isSwiping = false;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    restartAutoMove();
  }, { passive: true });

  // Arrow key navigation when gallery viewport has focus
  galleryViewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      goToPrev();
      restartAutoMove();
    } else if (e.key === 'ArrowRight') {
      goToNext();
      restartAutoMove();
    }
  });
}

// Gallery Lightbox
const lightbox = document.getElementById('gallery-lightbox');

if (lightbox && galleryViewport) {
  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const lightboxTag = lightbox.querySelector('.lightbox-tag');
  const lightboxTitle = lightbox.querySelector('.lightbox-title');
  const lightboxClose = lightbox.querySelector('.lightbox-close');
  const lightboxBackdrop = lightbox.querySelector('.lightbox-backdrop');
  let lastFocusedElement = null;

  const openLightbox = (card) => {
    const img = card.querySelector('img');
    if (!img) return;
    if (window._galleryAutoMove) window._galleryAutoMove.stop();
    lastFocusedElement = card;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
    const tagEl = card.querySelector('.gallery-tag');
    const titleEl = card.querySelector('.gallery-title');
    lightboxTag.textContent = tagEl ? tagEl.textContent : '';
    lightboxTitle.textContent = titleEl ? titleEl.textContent : '';
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  };

  const closeLightbox = () => {
    if (!lightbox.classList.contains('active')) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    document.body.style.overflow = '';
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
    if (window._galleryAutoMove) window._galleryAutoMove.start();
  };

  galleryViewport.addEventListener('click', (e) => {
    const card = e.target.closest('.gallery-card');
    if (card) openLightbox(card);
  });

  galleryViewport.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.gallery-card');
      if (card) {
        e.preventDefault();
        openLightbox(card);
      }
    }
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxBackdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}
