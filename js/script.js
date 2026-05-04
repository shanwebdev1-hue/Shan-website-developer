(() => {
  'use strict';

  const REVIEW_STORAGE_KEY = 'shan_reviews_v1';
  const REVIEW_SECRET = 'SHANRONITWEBDEVELOPER@914';
  const REVIEW_MAX_LENGTH = 300;
  const REVIEW_VISIBLE_LIMIT = 5;
  const REVIEW_SUBMIT_COOLDOWN_MS = 12000;

  let selectedRating = 0;
  let reviewExpanded = false;
  let adminDeleteEnabled = false;
  let lastReviewSubmitAt = 0;

  const byId = (id) => document.getElementById(id);

  document.addEventListener('DOMContentLoaded', () => {
    setCurrentYear();
    initMobileMenu();
    initThemeToggle();
    initStickyNavbarAndActiveLinks();
    initFadeObserver();
    initContactForm();
    initReviewSystem();
    optimizeImages();
  });

  function setCurrentYear() {
    const yearNode = byId('year');
    if (yearNode) yearNode.textContent = String(new Date().getFullYear());
  }

  function initMobileMenu() {
    const hamburger = byId('hamburger');
    const mobileMenu = byId('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    if (!hamburger || !mobileMenu) return;

    const bars = hamburger.querySelectorAll('.bar');

    const closeMenu = () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      if (bars.length === 3) {
        bars[0].style.transform = 'none';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'none';
      }
    };

    hamburger.addEventListener('click', () => {
      const isActive = hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active', isActive);
      if (bars.length === 3) {
        bars[0].style.transform = isActive ? 'translateY(7px) rotate(45deg)' : 'none';
        bars[1].style.opacity = isActive ? '0' : '1';
        bars[2].style.transform = isActive ? 'translateY(-7px) rotate(-45deg)' : 'none';
      }
    });

    mobileLinks.forEach((link) => link.addEventListener('click', closeMenu));
  }

  function initThemeToggle() {
    const themeToggle = byId('theme-toggle');
    if (!themeToggle) return;

    const htmlElement = document.documentElement;
    const themeIcon = themeToggle.querySelector('i');

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      htmlElement.setAttribute('data-theme', 'light');
      if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
    }

    themeToggle.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      htmlElement.setAttribute('data-theme', newTheme);

      if (themeIcon) {
        if (newTheme === 'light') {
          themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
          themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
      }

      localStorage.setItem('theme', newTheme);
    });
  }

  function initStickyNavbarAndActiveLinks() {
    const navbar = byId('navbar');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!navbar || !sections.length || !navLinks.length) return;

    let ticking = false;

    const updateOnScroll = () => {
      const scrollPosition = window.scrollY;

      navbar.style.boxShadow = scrollPosition > 50 ? '0 4px 20px rgba(0, 0, 0, 0.1)' : 'none';

      let currentId = '';
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (scrollPosition >= sectionTop - 220) {
          currentId = section.getAttribute('id') || '';
        }
      });

      navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${currentId}`;
        link.classList.toggle('active', isActive);
      });

      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateOnScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateOnScroll();
  }

  function initFadeObserver() {
    const fadeElements = document.querySelectorAll('.fade-in');
    if (!fadeElements.length) return;

    if (!('IntersectionObserver' in window)) {
      fadeElements.forEach((element) => element.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    fadeElements.forEach((element) => observer.observe(element));
  }

  function initContactForm() {
    const contactForm = byId('contactForm');
    if (!contactForm) return;

    const formStatus = byId('form-status');
    const submitBtn = contactForm.querySelector('.submit-btn');
    if (!submitBtn) return;

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
      submitBtn.disabled = true;

      try {
        const formData = new FormData(contactForm);
        const response = await fetch('https://formsubmit.co/ajax/shan.webdev1@gmail.com', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          if (formStatus) {
            formStatus.textContent = "Message sent successfully! I'll get back to you soon.";
            formStatus.className = 'form-status success';
          }
          contactForm.reset();
        } else {
          if (formStatus) {
            formStatus.textContent = 'Oops! There was a problem submitting your form.';
            formStatus.className = 'form-status';
            formStatus.style.color = 'red';
          }
        }
      } catch (_error) {
        if (formStatus) {
          formStatus.textContent = 'Oops! There was a problem submitting your form.';
          formStatus.className = 'form-status';
          formStatus.style.color = 'red';
        }
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        if (formStatus) {
          window.setTimeout(() => {
            formStatus.textContent = '';
            formStatus.className = 'form-status';
            formStatus.style.color = '';
          }, 5000);
        }
      }
    });
  }

  function initReviewSystem() {
    const reviewForm = byId('reviewForm');
    const reviewName = byId('reviewName');
    const reviewText = byId('reviewText');
    const reviewTextWrap = byId('reviewTextWrap');
    const reviewStatus = byId('reviewStatus');
    const reviewsList = byId('reviewsList');
    const reviewsToggleBtn = byId('reviewsToggleBtn');
    const stars = Array.from(document.querySelectorAll('#reviewStars .star-btn'));

    if (!reviewForm || !reviewName || !reviewText || !reviewTextWrap || !reviewStatus || !reviewsList || !reviewsToggleBtn || !stars.length) {
      return;
    }

    const setStatus = (message, type = '') => {
      reviewStatus.textContent = message;
      reviewStatus.className = type ? `form-status ${type}` : 'form-status';
      reviewStatus.style.color = type === 'error' ? '#ff6b6b' : '';
    };

    const setStars = (rating) => {
      selectedRating = rating;
      stars.forEach((star) => {
        const value = Number(star.dataset.value || 0);
        const isActive = value <= selectedRating;
        star.classList.toggle('active', isActive);
        star.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      reviewTextWrap.hidden = selectedRating === 0;
    };

    const getStoredReviews = () => {
      try {
        const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
          .filter((item) => item && typeof item === 'object')
          .map((item) => ({
            id: String(item.id || `${item.createdAt || Date.now()}`),
            name: String(item.name || 'Anonymous').trim().slice(0, 60),
            rating: Math.max(1, Math.min(5, Number(item.rating || 0))),
            text: String(item.text || '').trim().slice(0, REVIEW_MAX_LENGTH),
            createdAt: Number(item.createdAt || Date.now())
          }))
          .filter((item) => item.text && item.rating >= 1 && item.rating <= 5);
      } catch (_error) {
        return [];
      }
    };

    const saveStoredReviews = (reviews) => {
      try {
        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
      } catch (_error) {
        setStatus('Storage is full. Please delete older reviews and try again.', 'error');
      }
    };

    const buildStars = (rating) => `${'&#9733;'.repeat(rating)}${'&#9734;'.repeat(5 - rating)}`;

    const renderReviews = () => {
      const reviews = getStoredReviews().sort((a, b) => b.createdAt - a.createdAt);
      reviewsList.innerHTML = '';

      if (!reviews.length) {
        reviewsList.innerHTML = '<p class="review-text">No reviews yet. Be the first to share feedback.</p>';
        reviewsToggleBtn.style.display = 'none';
        return;
      }

      const visibleReviews = reviewExpanded ? reviews : reviews.slice(0, REVIEW_VISIBLE_LIMIT);
      const fragment = document.createDocumentFragment();

      visibleReviews.forEach((review) => {
        const item = document.createElement('article');
        item.className = 'review-item';
        item.innerHTML = `
          <div class="review-head">
            <span class="review-name">${escapeHtml(review.name)}</span>
            <span class="review-rating" aria-label="${review.rating} star rating">${buildStars(review.rating)}</span>
          </div>
          <p class="review-text">${escapeHtml(review.text)}</p>
          <button type="button" class="review-delete-btn" data-review-id="${review.id}">Delete Review</button>
        `;
        fragment.appendChild(item);
      });

      reviewsList.appendChild(fragment);

      if (reviews.length > REVIEW_VISIBLE_LIMIT) {
        reviewsToggleBtn.style.display = 'inline-flex';
        reviewsToggleBtn.textContent = reviewExpanded ? 'Show Less' : 'See More';
      } else {
        reviewsToggleBtn.style.display = 'none';
      }

      document.body.classList.toggle('review-admin', adminDeleteEnabled);
    };

    const reviewsAreDuplicate = (reviews, name, rating, text) => {
      const normalizedCurrent = `${name}|${rating}|${text}`.toLowerCase();
      return reviews.some((review) => {
        const normalizedExisting = `${review.name}|${review.rating}|${review.text}`.toLowerCase();
        return normalizedExisting === normalizedCurrent;
      });
    };

    stars.forEach((star) => {
      star.addEventListener('click', () => {
        const rating = Number(star.dataset.value || 0);
        if (rating < 1 || rating > 5) return;
        setStars(rating);
        setStatus('');
      });
    });

    // Auto-fill name for logged-in users.
    try {
      const sessionRaw = localStorage.getItem('session');
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session && typeof session.name === 'string' && session.name.trim()) {
          reviewName.value = session.name.trim().slice(0, 60);
        }
      }
    } catch (_error) {
      // Ignore malformed session data.
    }

    reviewForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const now = Date.now();
      if (now - lastReviewSubmitAt < REVIEW_SUBMIT_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((REVIEW_SUBMIT_COOLDOWN_MS - (now - lastReviewSubmitAt)) / 1000);
        setStatus(`Please wait ${waitSeconds}s before submitting another review.`, 'error');
        return;
      }

      const name = reviewName.value.trim();
      const text = reviewText.value.trim();

      if (!name) {
        setStatus('Please enter your name.', 'error');
        return;
      }

      if (selectedRating < 1 || selectedRating > 5) {
        setStatus('Please select a star rating first.', 'error');
        return;
      }

      if (!text) {
        setStatus('Please write your review.', 'error');
        return;
      }

      if (text.length > REVIEW_MAX_LENGTH) {
        setStatus(`Review cannot exceed ${REVIEW_MAX_LENGTH} characters.`, 'error');
        return;
      }

      const reviews = getStoredReviews();
      if (reviewsAreDuplicate(reviews, name, selectedRating, text)) {
        setStatus('Duplicate review detected. Please submit a different review.', 'error');
        return;
      }

      const newReview = {
        id: `${now}-${Math.random().toString(16).slice(2, 8)}`,
        name: name.slice(0, 60),
        rating: selectedRating,
        text,
        createdAt: now
      };

      const updatedReviews = [newReview, ...reviews];
      saveStoredReviews(updatedReviews);
      lastReviewSubmitAt = now;

      reviewForm.reset();
      setStars(0);
      reviewTextWrap.hidden = true;
      setStatus('Thanks! Your review has been submitted.', 'success');
      renderReviews();
    });

    reviewsToggleBtn.addEventListener('click', () => {
      reviewExpanded = !reviewExpanded;
      renderReviews();
    });

    reviewsList.addEventListener('click', (event) => {
      const button = event.target.closest('.review-delete-btn');
      if (!button || !adminDeleteEnabled) return;

      const reviewId = String(button.dataset.reviewId || '');
      if (!reviewId) return;

      const secret = window.prompt('Enter secret code to delete this review:');
      if (secret !== REVIEW_SECRET) {
        setStatus('Invalid secret code. Review not deleted.', 'error');
        return;
      }

      const reviews = getStoredReviews();
      const nextReviews = reviews.filter((review) => review.id !== reviewId);
      saveStoredReviews(nextReviews);
      setStatus('Review deleted successfully.', 'success');
      renderReviews();
    });

    window.enableReviewAdminDelete = () => {
      adminDeleteEnabled = true;
      document.body.classList.add('review-admin');
      renderReviews();
      return 'Delete controls enabled. Click delete and enter the secret code.';
    };

    window.disableReviewAdminDelete = () => {
      adminDeleteEnabled = false;
      document.body.classList.remove('review-admin');
      renderReviews();
      return 'Delete controls hidden.';
    };

    window.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
        adminDeleteEnabled = !adminDeleteEnabled;
        document.body.classList.toggle('review-admin', adminDeleteEnabled);
        renderReviews();
      }
    });

    renderReviews();
  }

  function optimizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (index > 0 && !img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }

      const src = img.getAttribute('src');
      if (!src || !src.includes('images.unsplash.com')) return;

      try {
        const url = new URL(src);
        if (!url.searchParams.has('auto')) url.searchParams.set('auto', 'format');
        if (!url.searchParams.has('fit')) url.searchParams.set('fit', 'crop');
        const quality = Number(url.searchParams.get('q') || '80');
        if (!Number.isNaN(quality) && quality > 80) {
          url.searchParams.set('q', '80');
        }
        const updatedSrc = url.toString();
        if (updatedSrc !== src) img.src = updatedSrc;
      } catch (_error) {
        // Ignore malformed URLs.
      }
    });
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
