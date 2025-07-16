document.addEventListener('DOMContentLoaded', () => {

    const navToggle = document.querySelector('.nav-toggle');
    const header = document.querySelector('header');
    const body = document.body; // Get the body element

    navToggle.addEventListener('click', () => {
        // Use a class on the header to scope the "open" state
        header.classList.toggle('nav-open');
        body.classList.toggle('no-scroll'); // Toggle no-scroll class on body
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

});
