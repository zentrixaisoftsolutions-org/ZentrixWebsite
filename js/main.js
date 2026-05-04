// ─── Navbar scroll effect ─────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ─── Mobile menu ──────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const isOpen = navLinks.classList.contains('open');
  hamburger.setAttribute('aria-expanded', isOpen);
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ─── Scroll-reveal ────────────────────────────
const revealElements = document.querySelectorAll(
  '.service-card, .why-card, .about-grid, .vision-inner, .contact-grid, .section-title, .section-subtitle, .section-tag, .about-stats, .vision-pillars, .contact-info'
);

revealElements.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealElements.forEach(el => observer.observe(el));

// ─── Staggered card animations ────────────────
document.querySelectorAll('.services-grid .service-card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 80}ms`;
});

document.querySelectorAll('.why-grid .why-card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 60}ms`;
});

// ─── Products dropdown ────────────────────────
const productsMenu  = document.getElementById('productsMenu');
const dropdownToggle = productsMenu.querySelector('.dropdown-toggle');

dropdownToggle.addEventListener('click', e => {
  e.preventDefault();
  const isOpen = productsMenu.classList.toggle('open');
  dropdownToggle.setAttribute('aria-expanded', isOpen);
});

document.addEventListener('click', e => {
  if (!productsMenu.contains(e.target)) {
    productsMenu.classList.remove('open');
    dropdownToggle.setAttribute('aria-expanded', false);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    productsMenu.classList.remove('open');
    dropdownToggle.setAttribute('aria-expanded', false);
  }
});

// ─── Contact form ─────────────────────────────
const contactForm   = document.getElementById('contactForm');
const formSuccess   = document.getElementById('formSuccess');

contactForm.addEventListener('submit', e => {
  e.preventDefault();
  const btn = contactForm.querySelector('button[type="submit"]');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  // Simulate submission (replace with real backend / EmailJS / Formspree)
  setTimeout(() => {
    formSuccess.classList.add('visible');
    contactForm.reset();
    btn.textContent = 'Send Message';
    btn.disabled = false;
    setTimeout(() => formSuccess.classList.remove('visible'), 5000);
  }, 1200);
});

// ─── Active nav link on scroll ────────────────
const sections = document.querySelectorAll('section[id]');
const navAnchorLinks = document.querySelectorAll('.nav-links a[href^="#"]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navAnchorLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(section => sectionObserver.observe(section));
