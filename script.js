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

// Gallery Lightbox
const lightbox = document.getElementById('gallery-lightbox');
const galleryGrid = document.querySelector('.gallery-grid');

if (lightbox && galleryGrid) {
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

  galleryGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.gallery-card');
    if (card) openLightbox(card);
  });

  galleryGrid.addEventListener('keydown', (e) => {
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
