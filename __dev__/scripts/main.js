// Main JavaScript file
console.log('Hello from Clovie dev environment!');

// Simple interactivity
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    // Add click handlers to navigation
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            console.log(`Navigating to: ${e.target.href}`);
        });
    });
});
