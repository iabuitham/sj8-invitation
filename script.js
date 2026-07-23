/* =========================================================================
   SUMMER JAM 8 — "THE WARRIOR"
   Vanilla JS invitation logic
   ========================================================================= */
(function () {
  'use strict';

  /* ------------------------------------------------------------------- *
   * 1. Invitee "database" (demo). In production this would be replaced
   *    by a real lookup (serverless function, API, etc).
   * ------------------------------------------------------------------- */
  const invitees = {
    '8F3K92': { name: 'John Smith' },
    'A7L91P': { name: 'Sarah Wilson' }
  };

  /* ------------------------------------------------------------------- *
   * 2. DOM references
   * ------------------------------------------------------------------- */
  const els = {
    heroInvitee: document.getElementById('heroInvitee'),
    heroBg: document.getElementById('heroBg'),
    inviteeName: document.getElementById('inviteeName'),

    panelLoading: document.getElementById('panelLoading'),
    panelInvalid: document.getElementById('panelInvalid'),
    panelWelcome: document.getElementById('panelWelcome'),
    panelDecline: document.getElementById('panelDecline'),
    panelForm: document.getElementById('panelForm'),
    panelSuccess: document.getElementById('panelSuccess'),

    btnAccept: document.getElementById('btnAccept'),
    btnDecline: document.getElementById('btnDecline'),
    btnBackToWelcome: document.getElementById('btnBackToWelcome'),

    form: document.getElementById('inviteForm'),
    fieldName: document.getElementById('fieldName'),
    fieldEmail: document.getElementById('fieldEmail'),
    fieldLocation: document.getElementById('fieldLocation'),
    groupEmail: document.getElementById('groupEmail'),
    groupLocation: document.getElementById('groupLocation'),
    errorEmail: document.getElementById('errorEmail'),
    errorLocation: document.getElementById('errorLocation'),
    inviteId: document.getElementById('inviteId'),

    btnSubmit: document.getElementById('btnSubmit'),
    btnSubmitLabel: document.getElementById('btnSubmitLabel'),
    formStatus: document.getElementById('formStatus'),

    year: document.getElementById('year'),
    emberCanvas: document.getElementById('ember-canvas'),
    confettiCanvas: document.getElementById('confetti-canvas')
  };

  const ALL_PANELS = [
    els.panelLoading, els.panelInvalid, els.panelWelcome,
    els.panelDecline, els.panelForm, els.panelSuccess
  ];

  let isSubmitting = false;
  let currentInvitee = null;

  /* ------------------------------------------------------------------- *
   * 3. Panel switching
   * ------------------------------------------------------------------- */
  function showPanel(panel) {
    ALL_PANELS.forEach((p) => p.classList.remove('is-active'));
    panel.classList.add('is-active');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ------------------------------------------------------------------- *
   * 4. Read + sanitize the invite id from the URL
   * ------------------------------------------------------------------- */
  function getInviteID() {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('id');
      if (!raw) return null;
      // Sanitize: keep only alphanumeric characters, cap length to guard
      // against injection or oversized query values.
      const clean = raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
      return clean.length ? clean.toUpperCase() : null;
    } catch (err) {
      console.error('getInviteID failed:', err);
      return null;
    }
  }

  /* ------------------------------------------------------------------- *
   * 5. Look up the invitee and render the right state
   * ------------------------------------------------------------------- */
  function loadInvitee() {
    const id = getInviteID();

    if (!id) {
      renderInvalid();
      return;
    }

    const invitee = invitees[id];

    if (!invitee) {
      renderInvalid();
      return;
    }

    currentInvitee = { id, ...invitee };
    renderWelcome(currentInvitee);
  }

  function renderInvalid() {
    document.title = 'Invitation not found — Summer Jam 8';
    els.heroInvitee.textContent = '';
    showPanel(els.panelInvalid);
  }

  function renderWelcome(invitee) {
    els.inviteeName.textContent = invitee.name;
    els.heroInvitee.innerHTML = `You've been invited, <strong>${escapeHTML(invitee.name)}</strong>.`;
    els.fieldName.value = invitee.name;
    els.inviteId.value = invitee.id;
    showPanel(els.panelWelcome);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------- *
   * 6. Decline flow
   * ------------------------------------------------------------------- */
  function showDecline() {
    showPanel(els.panelDecline);
  }

  /* ------------------------------------------------------------------- *
   * 7. Accept flow
   * ------------------------------------------------------------------- */
  function showAcceptForm() {
    showPanel(els.panelForm);
    window.setTimeout(() => els.fieldEmail.focus(), 350);
  }

  /* ------------------------------------------------------------------- *
   * 8. Validation
   * ------------------------------------------------------------------- */
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function setFieldError(group, errorEl, message) {
    group.classList.add('has-error');
    errorEl.textContent = message;
    errorEl.classList.add('is-visible');
  }

  function clearFieldError(group, errorEl) {
    group.classList.remove('has-error');
    errorEl.classList.remove('is-visible');
  }

  function validateForm() {
    let valid = true;

    if (!isValidEmail(els.fieldEmail.value)) {
      setFieldError(els.groupEmail, els.errorEmail, 'Enter a valid email address.');
      valid = false;
    } else {
      clearFieldError(els.groupEmail, els.errorEmail);
    }

    if (!els.fieldLocation.value.trim()) {
      setFieldError(els.groupLocation, els.errorLocation, "Tell us where you're traveling from.");
      valid = false;
    } else {
      clearFieldError(els.groupLocation, els.errorLocation);
    }

    return valid;
  }

  /* ------------------------------------------------------------------- *
   * 9. Submit form to Netlify (AJAX, per Netlify Forms docs)
   * ------------------------------------------------------------------- */
  function encodeFormData(form) {
    const data = new FormData(form);
    return Array.from(data.entries())
      .map((pair) => pair.map(encodeURIComponent).join('='))
      .join('&');
  }

  function setSubmitting(state) {
    isSubmitting = state;
    els.btnSubmit.disabled = state;
    els.btnSubmitLabel.textContent = state ? 'Submitting' : 'Confirm Invitation';

    const existingSpinner = els.btnSubmit.querySelector('.btn__spinner');
    if (state && !existingSpinner) {
      const spinner = document.createElement('span');
      spinner.className = 'btn__spinner';
      spinner.setAttribute('aria-hidden', 'true');
      els.btnSubmit.appendChild(spinner);
    } else if (!state && existingSpinner) {
      existingSpinner.remove();
    }
  }

  function setStatus(message, state) {
    els.formStatus.textContent = message;
    if (state) {
      els.formStatus.setAttribute('data-state', state);
    } else {
      els.formStatus.removeAttribute('data-state');
    }
  }

  async function submitForm(event) {
    event.preventDefault();

    if (isSubmitting) return; // guard against duplicate submissions

    if (!navigator.onLine) {
      setStatus("You're offline. Reconnect and try again — nothing was sent yet.", 'offline');
      return;
    }

    if (!validateForm()) {
      setStatus('Please fix the highlighted fields.', 'error');
      return;
    }

    setSubmitting(true);
    setStatus('Sending your confirmation…', null);

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeFormData(els.form)
      });

      if (!response.ok) {
        throw new Error('Server responded with ' + response.status);
      }

      showSuccess();
    } catch (err) {
      console.error('Form submission failed:', err);
      setStatus('Something went wrong sending your confirmation. Please try again.', 'error');
      setSubmitting(false);
    }
  }

  /* ------------------------------------------------------------------- *
   * 10. Success state
   * ------------------------------------------------------------------- */
  function showSuccess() {
    showPanel(els.panelSuccess);
    launchConfetti();
  }

  /* ------------------------------------------------------------------- *
   * 11. Button ripple micro-interaction
   * ------------------------------------------------------------------- */
  function attachRipple(button) {
    button.addEventListener('click', (e) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'btn__ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      button.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 700);
    });
  }

  /* ------------------------------------------------------------------- *
   * 12. Hero parallax
   * ------------------------------------------------------------------- */
  function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const offset = window.scrollY * 0.35;
        els.heroBg.style.transform = `scale(1.08) translateY(${offset}px)`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------- *
   * 13. Ambient ember particles (background canvas)
   * ------------------------------------------------------------------- */
  function initEmberParticles() {
    const canvas = els.emberCanvas;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let width, height;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * width,
        y: height + Math.random() * 100,
        r: Math.random() * 2 + 0.6,
        speed: Math.random() * 0.6 + 0.2,
        drift: (Math.random() - 0.5) * 0.4,
        life: Math.random() * 0.6 + 0.4,
        hue: Math.random() > 0.5 ? '212,175,55' : '255,106,26'
      };
    }

    function init() {
      resize();
      const count = Math.min(60, Math.floor((width * height) / 22000));
      particles = Array.from({ length: count }, createParticle);
    }

    function step() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += p.drift;
        p.life -= 0.0015;

        if (p.y < -20 || p.life <= 0) {
          Object.assign(p, createParticle(), { y: height + 10 });
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue}, ${Math.max(p.life, 0)})`;
        ctx.fill();
      });
      requestAnimationFrame(step);
    }

    window.addEventListener('resize', resize, { passive: true });
    init();
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------- *
   * 14. Confetti burst on success (gold + orange, on brand)
   * ------------------------------------------------------------------- */
  function launchConfetti() {
    const canvas = els.confettiCanvas;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);
    const colors = ['#d4af37', '#f3dfa0', '#ff6a1a', '#b8420a'];

    const pieces = Array.from({ length: 90 }, () => ({
      x: width / 2 + (Math.random() - 0.5) * 120,
      y: height * 0.35,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * -8 - 4,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 10,
      gravity: 0.25
    }));

    let frame = 0;
    const maxFrames = 140;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      pieces.forEach((p) => {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    requestAnimationFrame(draw);
  }

  /* ------------------------------------------------------------------- *
   * 15. Connectivity feedback
   * ------------------------------------------------------------------- */
  function initConnectivityWatch() {
    window.addEventListener('offline', () => {
      if (els.panelForm.classList.contains('is-active')) {
        setStatus("You're offline. We'll wait here until you're back.", 'offline');
      }
    });
    window.addEventListener('online', () => {
      if (els.panelForm.classList.contains('is-active') &&
          els.formStatus.getAttribute('data-state') === 'offline') {
        setStatus("Back online. You're good to submit.", null);
      }
    });
  }

  /* ------------------------------------------------------------------- *
   * 16. Wire up events
   * ------------------------------------------------------------------- */
  function bindEvents() {
    els.btnAccept.addEventListener('click', showAcceptForm);
    els.btnDecline.addEventListener('click', showDecline);
    els.btnBackToWelcome.addEventListener('click', () => showPanel(els.panelWelcome));
    els.form.addEventListener('submit', submitForm);

    [els.btnAccept, els.btnDecline, els.btnSubmit, els.btnBackToWelcome]
      .forEach(attachRipple);

    els.fieldEmail.addEventListener('blur', () => {
      if (els.fieldEmail.value) {
        isValidEmail(els.fieldEmail.value)
          ? clearFieldError(els.groupEmail, els.errorEmail)
          : setFieldError(els.groupEmail, els.errorEmail, 'Enter a valid email address.');
      }
    });

    els.fieldLocation.addEventListener('blur', () => {
      if (els.fieldLocation.value.trim()) {
        clearFieldError(els.groupLocation, els.errorLocation);
      }
    });
  }

  /* ------------------------------------------------------------------- *
   * 17. Init
   * ------------------------------------------------------------------- */
  function init() {
    els.year.textContent = new Date().getFullYear();
    bindEvents();
    initParallax();
    initEmberParticles();
    initConnectivityWatch();

    try {
      loadInvitee();
    } catch (err) {
      console.error('Failed to load invitee:', err);
      renderInvalid();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
