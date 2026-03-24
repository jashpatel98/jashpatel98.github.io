
const WEB3FORMS_ACCESS_KEY = '234ae068-65a6-4f3a-8232-2c62472de8d2';

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const navToggle = document.querySelector('.fixed-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            body.classList.toggle('nav-open');
            body.classList.toggle('no-scroll');
        });
    }

    document.querySelectorAll('.nav-links a').forEach((link) => {
        link.addEventListener('click', () => {
            if (body.classList.contains('nav-open')) {
                body.classList.remove('nav-open', 'no-scroll');
            }
        });
    });

    /* Stagger delays for reveal elements inside each section */
    document.querySelectorAll('.section-reveal').forEach((section) => {
        section.querySelectorAll('[data-reveal]').forEach((el, i) => {
            el.style.setProperty('--stagger', `${i * 0.055}s`);
        });
    });

    /* Scroll reveal — toggle on enter/leave so animations replay when scrolling back */
    const revealEls = document.querySelectorAll('[data-reveal]');
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle('is-visible', entry.isIntersecting);
            });
        },
        { root: null, rootMargin: '0px', threshold: 0 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    /* Stat count-up — replays when the row leaves view and enters again */
    const countFrames = new WeakMap();
    const countRunning = new WeakMap();
    document.querySelectorAll('.stat-count').forEach((span) => {
        const target = parseInt(span.getAttribute('data-target'), 10);
        const suffix = span.getAttribute('data-suffix') || '';
        if (Number.isNaN(target)) return;
        if (prefersReducedMotion) {
            span.textContent = String(target) + suffix;
            return;
        }
        const countObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        const raf = countFrames.get(span);
                        if (raf) cancelAnimationFrame(raf);
                        countFrames.delete(span);
                        span.textContent = '0';
                        countRunning.delete(span);
                        return;
                    }

                    if (countRunning.get(span)) return;
                    countRunning.set(span, true);

                    const duration = 1400;
                    const start = performance.now();
                    const tick = (now) => {
                        const t = Math.min(1, (now - start) / duration);
                        const eased = 1 - Math.pow(1 - t, 3);
                        const val = Math.round(eased * target);
                        span.textContent = val + (t >= 1 ? suffix : '');
                        if (t < 1) {
                            countFrames.set(span, requestAnimationFrame(tick));
                        } else {
                            countFrames.delete(span);
                        }
                    };
                    countFrames.set(span, requestAnimationFrame(tick));
                });
            },
            { threshold: 0.2, rootMargin: '0px' }
        );
        countObserver.observe(span);
    });

    /* Hero entrance */
    if (!prefersReducedMotion) {
        requestAnimationFrame(() => {
            body.classList.add('hero-ready');
        });
    } else {
        body.classList.add('hero-ready');
    }

    /* Header shadow on scroll */
    const header = document.getElementById('siteHeader');
    const onScrollHeader = () => {
        if (window.scrollY > 24) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();

    /* Tilt cards — subtle 3D tilt toward cursor */
    if (!prefersReducedMotion) {
        document.querySelectorAll('.tilt-card').forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const r = card.getBoundingClientRect();
                const x = e.clientX - r.left;
                const y = e.clientY - r.top;
                const midX = r.width / 2;
                const midY = r.height / 2;
                const rx = ((y - midY) / midY) * -4;
                const ry = ((x - midX) / midX) * 4;
                card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    const backToTopBtn = document.getElementById('backToTopBtn');
    window.addEventListener(
        'scroll',
        () => {
            backToTopBtn.style.display = window.pageYOffset > 300 ? 'block' : 'none';
        },
        { passive: true }
    );
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    const darkModeToggle = document.getElementById('darkModeToggle');
    function updateTooltip() {
        darkModeToggle.setAttribute(
            'data-tooltip',
            body.classList.contains('dark-mode') ? 'Switch to light mode' : 'Switch to dark mode'
        );
    }
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
    } else if (currentTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.classList.add('dark-mode');
    }
    updateTooltip();
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
        updateTooltip();
    });

    /* CV request modal */
    const cvModal = document.getElementById('cvRequestModal');
    const cvModalOpen = document.getElementById('cvModalOpen');
    const cvModalClose = document.getElementById('cvModalClose');
    const cvModalBackdrop = document.getElementById('cvModalBackdrop');
    const cvRequestForm = document.getElementById('cvRequestForm');
    const cvFormStatus = document.getElementById('cvFormStatus');
    const cvFormSubmit = document.getElementById('cvFormSubmit');
    let cvModalLastFocus = null;

    function openCvModal() {
        if (!cvModal) return;
        cvModalLastFocus = document.activeElement;
        cvModal.removeAttribute('hidden');
        cvModal.setAttribute('aria-hidden', 'false');
        body.classList.add('modal-open');
        const nameInput = document.getElementById('cvReqName');
        if (nameInput) nameInput.focus();
    }

    function closeCvModal() {
        if (!cvModal) return;
        cvModal.setAttribute('hidden', '');
        cvModal.setAttribute('aria-hidden', 'true');
        body.classList.remove('modal-open');
        if (cvFormStatus) {
            cvFormStatus.textContent = '';
            cvFormStatus.classList.remove('is-error');
        }
        if (cvRequestForm) cvRequestForm.reset();
        if (cvModalLastFocus && typeof cvModalLastFocus.focus === 'function') {
            cvModalLastFocus.focus();
        }
    }

    if (cvModalOpen) cvModalOpen.addEventListener('click', openCvModal);
    if (cvModalClose) cvModalClose.addEventListener('click', closeCvModal);
    if (cvModalBackdrop) cvModalBackdrop.addEventListener('click', closeCvModal);

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !cvModal || cvModal.hasAttribute('hidden')) return;
        closeCvModal();
    });

    if (cvRequestForm) {
        cvRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!cvFormStatus || !cvFormSubmit) return;

            const nameEl = document.getElementById('cvReqName');
            const emailEl = document.getElementById('cvReqEmail');
            const name = nameEl ? nameEl.value.trim() : '';
            const email = emailEl ? emailEl.value.trim() : '';

            if (!name || !email) {
                cvFormStatus.textContent = 'Please enter your name and email.';
                cvFormStatus.classList.add('is-error');
                return;
            }

            if (!WEB3FORMS_ACCESS_KEY) {
                cvFormStatus.textContent =
                    'Form not configured yet: add your Web3Forms access key in script.js (see comment at top). Or email jash.ravariya98@gmail.com directly.';
                cvFormStatus.classList.add('is-error');
                return;
            }

            cvFormStatus.classList.remove('is-error');
            cvFormStatus.textContent = 'Sending…';
            cvFormSubmit.disabled = true;

            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        access_key: WEB3FORMS_ACCESS_KEY,
                        subject: 'CV request — jashpatel98.github.io',
                        name,
                        email,
                        message:
                            `Someone requested your CV from your portfolio.\n\n` +
                            `Name: ${name}\n` +
                            `Email: ${email}\n\n` +
                            `Reply to this address with your PDF.`
                    })
                });
                const data = await res.json();
                if (data.success) {
                    cvFormStatus.textContent = 'Thanks! I’ll send the PDF to your email shortly.';
                    cvRequestForm.reset();
                    setTimeout(() => closeCvModal(), 2200);
                } else {
                    cvFormStatus.textContent = data.message || 'Something went wrong. Please email me directly.';
                    cvFormStatus.classList.add('is-error');
                }
            } catch {
                cvFormStatus.textContent = 'Network error. Please email jash.ravariya98@gmail.com directly.';
                cvFormStatus.classList.add('is-error');
            } finally {
                cvFormSubmit.disabled = false;
            }
        });
    }

    /**
     * Marquee: (1) clone enough identical strips so total width >= viewport + one strip (fixes 21:9 / ultra-wide gaps).
     * (2) animate by exact px width of one strip (seamless loop).
     */
    (function initMarquee() {
        const viewport = document.querySelector('.marquee-viewport');
        const track = document.querySelector('.marquee-track');
        if (!viewport || !track) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const apply = () => {
            const first = track.querySelector('.marquee-set');
            if (!first) return;

            const viewportW = viewport.getBoundingClientRect().width;
            const w = first.getBoundingClientRect().width;
            if (w < 1 || viewportW < 1) return;

            const needed = Math.max(2, Math.ceil((viewportW + w) / w));
            let count = track.querySelectorAll('.marquee-set').length;

            while (count < needed) {
                track.appendChild(first.cloneNode(true));
                count++;
            }
            while (count > needed) {
                track.removeChild(track.lastElementChild);
                count--;
            }

            track.style.setProperty('--marquee-end', `${-w}px`);
        };

        apply();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                requestAnimationFrame(() => requestAnimationFrame(apply));
            });
        } else {
            requestAnimationFrame(() => requestAnimationFrame(apply));
        }

        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => requestAnimationFrame(apply));
            ro.observe(viewport);
            const first = track.querySelector('.marquee-set');
            if (first) ro.observe(first);
        }
        window.addEventListener('resize', () => requestAnimationFrame(apply), { passive: true });
    })();
});
