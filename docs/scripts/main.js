import { createSymbiote } from 'symbiotic';

const TEXT = {
  COPY: '[copy]',
  COPIED: '[copied]',
}

const symbiote = createSymbiote(
  {
    'js--navLink': (element) => {
      const click = (e) => {
        e.preventDefault();
        const target = element.getAttribute('href');
        const targetElement = document.querySelector(target);
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
      element.addEventListener('click', click);
      return () => element.removeEventListener('click', click);
    },
    'js--copyCode': (element) => {
      let timeout;
      requestAnimationFrame(() => {
        element.setAttribute('data-copy-text', TEXT.COPY);
      })
      const click = (e) => {
        e.preventDefault();
        if (timeout) {
          clearTimeout(timeout);
        }
        navigator.clipboard.writeText(element.textContent);
        element.setAttribute('data-copy-text', TEXT.COPIED);
        timeout = setTimeout(() => {
          element.setAttribute('data-copy-text', TEXT.COPY);
        }, 2000);
      }
      element.addEventListener('click', click);
      return () => element.removeEventListener('click', click);
    },
    'js--scrollPosition': (element) => {
      const elementsInView = new Set();
      const currentlyActive = new Set();
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            elementsInView.add(entry.target.id);
          } else {
            elementsInView.delete(entry.target.id);
          }
        });
        
        // Log all elements currently in view
        if (elementsInView.size > 0) {
          console.log('elementsInView', elementsInView);
          for (const id of elementsInView) {
            if (currentlyActive.has(id)) {
              continue;
            }
            const element = document.querySelector(`[href="#${id}"]`);
            element.classList.add('is-active');
            currentlyActive.add(id);
          }

          for (const id of currentlyActive) {
            if (elementsInView.has(id)) {
              continue;
            }
            const element = document.querySelector(`[href="#${id}"]`);
            element.classList.remove('is-active');
            currentlyActive.delete(id);
          }
        }
      }, {
        threshold: 0.1 // Trigger when 10% of element is visible
      });
      
      // Observe all elements with IDs
      const elementsWithIds = element.querySelectorAll('[id]');
      elementsWithIds.forEach(el => {
        observer.observe(el);
      });
      
      // Return cleanup function
      return () => observer.disconnect();
    }
  }
);

symbiote.attach();