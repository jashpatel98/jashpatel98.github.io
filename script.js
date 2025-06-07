document.addEventListener('DOMContentLoaded', () => {

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
                observer.unobserve(entry.target); // Optional: stop observing once it's visible
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

});