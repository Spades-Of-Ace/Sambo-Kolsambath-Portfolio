// React Bits Scroll Float / David Haz (2026), adapted for Astro's existing headings.
// Source: https://reactbits.dev/text-animations/scroll-float
// License: /assets/shaders/react-bits-LICENSE.txt
import { gsap } from 'gsap';
import { observeSectionContent } from './section-visibility';

export function initScrollFloat() {
  const restore: (() => void)[] = [];
  const stop = observeSectionContent(
    '[data-heading-effect="float"]',
    (heading) => {
      if (heading.dataset.floatRevealed === 'true') return;
      const original = [...heading.childNodes].map((node) =>
        node.cloneNode(true),
      );
      const label = heading.getAttribute('aria-label');
      heading.setAttribute(
        'aria-label',
        heading.innerText.replace(/\s+/g, ' ').trim(),
      );
      const restoreHeading = () => {
        heading.replaceChildren(...original);
        if (label === null) heading.removeAttribute('aria-label');
        else heading.setAttribute('aria-label', label);
      };
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      const characters: HTMLElement[] = [];
      nodes.forEach((node) => {
        const fragment = document.createDocumentFragment();
        node.data.split(/(\s+)/).forEach((word) => {
          if (!word.trim()) {
            fragment.append(document.createTextNode(word));
            return;
          }
          const group = document.createElement('span');
          group.className = 'scroll-float-word';
          group.setAttribute('aria-hidden', 'true');
          Array.from(word).forEach((character) => {
            const span = document.createElement('span');
            span.className = 'scroll-float-char';
            span.textContent = character;
            characters.push(span);
            group.append(span);
          });
          fragment.append(group);
        });
        node.replaceWith(fragment);
      });
      heading.dataset.floatRevealed = 'true';
      const tween = gsap.fromTo(
        characters,
        { opacity: 0, yPercent: 60, scaleY: 1.3, transformOrigin: '50% 0%' },
        {
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          duration: 0.65,
          stagger: 0.014,
          ease: 'power3.out',
          onComplete: restoreHeading,
        },
      );
      restore.push(() => {
        tween.kill();
        restoreHeading();
      });
    },
    { threshold: 0.1 },
  );
  return () => {
    stop();
    restore.forEach((reset) => reset());
  };
}
