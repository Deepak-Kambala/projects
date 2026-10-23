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
