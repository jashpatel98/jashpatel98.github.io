document.addEventListener('DOMContentLoaded', () => {

    const navToggle = document.querySelector('.fixed-toggle');
    const header = document.querySelector('header');
    const body = document.body; // Get the body element

    navToggle.addEventListener('click', () => {
        // Use a class on the header to scope the "open" state
        body.classList.toggle('nav-open');
        body.classList.toggle('no-scroll'); // Toggle no-scroll class on body
    });

    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (body.classList.contains('nav-open')) {
                body.classList.remove('nav-open');
                body.classList.remove('no-scroll');
            }
        });
    });

    // Intersection Observer for fade-in animations
    const sections = document.querySelectorAll('section');

    const observerOptions = {
        root: null, // observes intersections relative to the viewport
        rootMargin: '0px',
        threshold: 0.1 // trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Stop observing once it's visible
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Back to Top Button functionality
    const backToTopBtn = document.getElementById('backToTopBtn');

    // Show/hide the button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) { // Show button after scrolling 300px
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });

    // Smooth scroll to top when button is clicked
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Smooth scrolling effect
        });
    });

    // Dark Mode Toggle functionality
    const darkModeToggle = document.getElementById('darkModeToggle');
    const iconMoon = darkModeToggle.querySelector('.fa-moon'); // Get specific icons
    const iconSun = darkModeToggle.querySelector('.fa-sun'); // Get specific icons

    // Function to update tooltip text
    function updateTooltip() {
        if (body.classList.contains('dark-mode')) {
            darkModeToggle.setAttribute('data-tooltip', 'Toggle for light mode');
        } else {
            darkModeToggle.setAttribute('data-tooltip', 'Toggle for dark mode');
        }
    }

    // Check for user's preferred theme in local storage or system preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        // No need to toggle display directly here, CSS handles it
    } else if (currentTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // If no preference in local storage, check system preference
        body.classList.add('dark-mode');
        // No need to toggle display directly here, CSS handles it
    }
    // Initial tooltip setup
    updateTooltip();

    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');

        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
        // Update tooltip after theme change
        updateTooltip();
    });
});
