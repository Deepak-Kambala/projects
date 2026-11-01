const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = themeToggle ? themeToggle.querySelector('.theme-icon') : null;
const savedTheme = localStorage.getItem('deepak-theme');

const setToggleState = (isDark) => {
  if (themeIcon) {
    themeIcon.textContent = isDark ? '☀' : '☾';
  } else if (themeToggle) {
    themeToggle.textContent = isDark ? '☀' : '☾';
  }
  if (themeToggle) {
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
};

if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  setToggleState(true);
}

const triggerToggleWave = () => {
  if (!themeToggle) return;
  themeToggle.classList.remove('wavy');
  void themeToggle.offsetWidth;
  themeToggle.classList.add('wavy');
};

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    const nextTheme = !isDark;

    triggerToggleWave();

    const applyTheme = () => {
      document.body.classList.toggle('dark', nextTheme);
      localStorage.setItem('deepak-theme', nextTheme ? 'dark' : 'light');
      setToggleState(nextTheme);
    };

    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyTheme();
      return;
    }

    const rect = themeToggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    try {
      const transition = document.startViewTransition(() => {
        applyTheme();
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 550,
            easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      }).catch(() => {});
    } catch {
      applyTheme();
    }
  });
}

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

  galleryPrevBtn.addEventListener('click', goToPrev);
  galleryNextBtn.addEventListener('click', goToNext);

  // Initialize track position without animation
  setPosition(currentIndex, false);
  updateIndicator();

  // Touch swipe support for mobile
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  galleryViewport.addEventListener('touchstart', (e) => {
    if (isAnimating) return;
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    isSwiping = true;
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
  }, { passive: true });

  // Arrow key navigation when gallery viewport has focus
  galleryViewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      goToNext();
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
