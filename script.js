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

// Gallery Carousel
const galleryTrack = document.getElementById('gallery-track');
const galleryPrevBtn = document.getElementById('gallery-prev');
const galleryNextBtn = document.getElementById('gallery-next');
const galleryIndicator = document.getElementById('gallery-indicator');
const galleryViewport = document.getElementById('gallery-viewport');

if (galleryTrack && galleryPrevBtn && galleryNextBtn) {
  const cards = Array.from(galleryTrack.querySelectorAll('.gallery-card'));
  const ITEMS_PER_PAGE = 6;
  const pageCount = Math.ceil(cards.length / ITEMS_PER_PAGE) || 1;
  let currentPage = 0;

  // Organize cards into pages of exactly 6 items
  galleryTrack.innerHTML = '';
  for (let i = 0; i < pageCount; i++) {
    const page = document.createElement('div');
    page.className = 'gallery-page';
    cards.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE).forEach((card) => {
      page.appendChild(card);
    });
    galleryTrack.appendChild(page);
  }

  const updateCarousel = () => {
    galleryTrack.style.transform = `translateX(-${currentPage * 100}%)`;
    if (galleryIndicator) {
      galleryIndicator.textContent = `${currentPage + 1} / ${pageCount}`;
    }
    galleryPrevBtn.disabled = currentPage === 0;
    galleryNextBtn.disabled = currentPage >= pageCount - 1;
  };

  galleryPrevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      updateCarousel();
    }
  });

  galleryNextBtn.addEventListener('click', () => {
    if (currentPage < pageCount - 1) {
      currentPage++;
      updateCarousel();
    }
  });

  // Touch swipe support for mobile
  let touchStartX = 0;
  galleryTrack.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  galleryTrack.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && currentPage < pageCount - 1) {
        currentPage++;
        updateCarousel();
      } else if (diff < 0 && currentPage > 0) {
        currentPage--;
        updateCarousel();
      }
    }
  }, { passive: true });

  updateCarousel();
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
