import { createSymbiote } from 'symbiotic';

const TEXT = {
  COPY: '[copy]',
  COPIED: '[copied]',
}

const symbiote = createSymbiote({
  '.js--navLink': (element) => {
    const click = (e) => {
      e.preventDefault();
      const target = element.getAttribute('href');
      const targetElement = document.querySelector(target);
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
    element.addEventListener('click', click);
    return () => element.removeEventListener('click', click);
  },
  '.js--copyCode': (element) => {
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
  '.js--scrollPosition': (element) => {
    // Get all elements with IDs in document order
    const elementsWithIds = element.querySelectorAll('[id]');
    const elementsArray = Array.from(elementsWithIds);
    const totalSections = elementsArray.length;
    
    // Store initial bounding rects for each element
    const elementRects = elementsArray.map(el => ({
      id: el.id,
      top: el.getBoundingClientRect().top + window.scrollY,
      height: el.getBoundingClientRect().height
    }));
    
    let animationFrameId;
    let isAnimating = false;
    
    const updateNavigation = () => {
      if (isAnimating) return; // Don't start new animation if one is running
      
      isAnimating = true;
      
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      // Clear all styles first
      document.querySelectorAll('.link-pageContents').forEach(link => {
        link.style.color = '';
        link.style.transform = '';
        link.classList.remove('is-key');
      });
      
      // Find the element closest to the top of the viewport
      let keyElementIndex = 0;
      let closestDistance = Infinity;
      
      for (let i = 0; i < elementsArray.length; i++) {
        const rect = elementRects[i];
        const distanceFromTop = Math.abs(rect.top - scrollY);
        
        if (distanceFromTop < closestDistance) {
          closestDistance = distanceFromTop;
          keyElementIndex = i;
        }
      }
      
      // Key element always gets maximum intensity
      const keyElementIntensity = 1;
      
      // Calculate effects for each section based on proximity to key element
      elementsArray.forEach((el, i) => {
        const navLink = document.querySelector(`[href="#${el.id}"]`);
        if (!navLink) return;
        
        // Add is-key class to the key element
        if (i === keyElementIndex) {
          navLink.classList.add('is-key');
        }
        
        // Calculate distance from key element
        const distanceFromKey = Math.abs(i - keyElementIndex);
        
        // Calculate spectrum position (0 = red, 1 = violet)
        const spectrumPosition = i / (totalSections - 1);
        const hue = spectrumPosition * 300; // 300 degrees covers red to violet
        
        // Calculate intensity based on distance from key element
        // Closer to key = higher intensity
        const maxDistance = 4; // Fade out over 4 positions
        const proximityIntensity = Math.max(0, 1 - (distanceFromKey / maxDistance));
        
        // Combine key element intensity with proximity intensity
        const finalIntensity = keyElementIntensity * proximityIntensity;
        
        // Apply color and transform based on combined intensity
        const maxShift = 1; // 1rem max shift
        const maxScale = 0.2; // 20% max scale increase
        const maxSaturation = 100; // 100% max saturation
        
        // Calculate continuous values based on final intensity
        const shift = finalIntensity * maxShift;
        const scale = 1 + (finalIntensity * maxScale);
        const saturation = finalIntensity * maxSaturation;
        
        // Apply the calculated values
        // navLink.style.color = `hsl(${hue}, ${saturation}%, 50%)`;
        // navLink.style.transform = `scale(${scale}) translateX(${shift}rem)`;
      });
      
      // Mark animation as complete after a short delay
      setTimeout(() => {
        isAnimating = false;
      }, 16); // ~1 frame at 60fps
    };
    
    // Debounced scroll handler
    let scrollTimeout;
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        updateNavigation();
      }, 16); // ~1 frame at 60fps
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial update
    updateNavigation();
    
    // Return cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }
});

symbiote.attach();