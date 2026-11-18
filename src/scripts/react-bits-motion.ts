// Astro adaptations of React Bits: SplitText, AnimatedContent, DecryptedText,
// BlurText, ShinyText and ClickSpark. Sources/license: /assets/shaders/CREDITS.md.
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { observeSectionContent } from './section-visibility';

gsap.registerPlugin(SplitText);
const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;
const decryptors = new WeakMap<HTMLElement, () => void>();
const panelAnimations = new WeakMap<HTMLElement, () => void>();

// SECTION: Scrambled text reveal
export function decryptText(element: HTMLElement) {
  decryptors.get(element)?.();
  if (reducedMotion()) return () => {};
  const split = SplitText.create(element, {
    type: 'words,chars',
    charsClass: 'bits-char',
    wordsClass: 'bits-word',
  });
  const cells = split.chars as HTMLElement[];
  const originals = cells.map((cell) => cell.textContent ?? '');
  const glyphs = cells.map((cell, index) => {
    const ghost = document.createElement('span');
    ghost.className = 'bits-ghost';
    ghost.textContent = originals[index];
    const glyph = document.createElement('span');
    glyph.className = 'bits-code';
    glyph.textContent = originals[index];
    cell.replaceChildren(ghost, glyph);
    return glyph;
  });
  const state = { progress: 0 };
  let frame = -1;
  let alive = true;
  let tween: gsap.core.Tween | undefined;
  const restore = () => {
    if (!alive) return;
    alive = false;
    tween?.kill();
    split.revert();
    decryptors.delete(element);
    element.dataset.decodeState = 'settled';
  };
  element.dataset.decodeState = 'running';
  tween = gsap.to(state, {
    progress: 1,
    duration: 0.85,
    ease: 'none',
    onUpdate: () => {
      const next = Math.floor(state.progress * 22);
      if (next === frame) return;
      frame = next;
      glyphs.forEach((glyph, index) => {
        const settled = index / Math.max(1, glyphs.length) < state.progress;
        glyph.textContent = settled
          ? originals[index]
          : '01/+_-'[(index * 3 + frame) % 6];
        glyph.classList.toggle('is-decoding', !settled);
      });
    },
    onComplete: restore,
  });
  decryptors.set(element, restore);
  return restore;
}

// SECTION: Entrance effects by section
export function animateSectionContent(element: HTMLElement) {
  const section =
    element.closest<HTMLElement>('[data-nav-target]')?.dataset.navTarget;
  element.dataset.revealStyle = section ?? 'rise';
  const to = {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotationY: 0,
    rotationX: 0,
    clipPath: 'inset(0% 0% 0% 0%)',
    duration: 0.75,
    ease: 'power3.out',
    clearProps: 'transform,opacity,clipPath',
  };
  if (section === 'skills' && element.classList.contains('skills-workbench')) {
    const targets = element.querySelectorAll(
      '.skill-tabs > button, .skill-panel:not([hidden]) > *',
    );
    gsap.fromTo(
      targets,
      { opacity: 0, x: 24, y: 0 },
      {
        ...to,
        stagger: 0.055,
        duration: 0.55,
      },
    );
  } else if (section === 'experience') {
    gsap.fromTo(
      element,
      { opacity: 0, x: element.matches('.career-item') ? 48 : -32 },
      to,
    );
  } else if (section === 'projects') {
    gsap.fromTo(
      element,
      { opacity: 0.5, x: 0, clipPath: 'inset(0% 100% 0% 0%)' },
      { ...to, duration: 0.85 },
    );
  } else if (section === 'about') {
    gsap.fromTo(
      element,
      { opacity: 0, y: 26, rotationX: 5, transformPerspective: 900 },
      { ...to, duration: 0.9 },
    );
  } else if (section === 'contact') {
    gsap.fromTo(
      element,
      { opacity: 0.25, y: 12, clipPath: 'inset(0% 0% 100% 0%)' },
      { ...to, duration: 0.9 },
    );
  } else {
    gsap.fromTo(element, { opacity: 0, y: 28 }, to);
  }
}

// SECTION: Heading effects and cleanup
export function initTextEffects() {
  const cleanups: (() => void)[] = [];
  const context = gsap.context(() => {});
  let alive = true;
  const play = (element: HTMLElement) => {
    if (element.dataset.bitsRevealed === 'true') return;
    element.dataset.bitsRevealed = 'true';
    const effect = element.dataset.headingEffect;
    if (effect === 'decrypt') {
      cleanups.push(decryptText(element));
      return;
    }
    if (effect === 'shine') {
      gsap.fromTo(
        element,
        { '--shine-position': '160%' },
        {
          '--shine-position': '-70%',
          duration: 1.5,
          ease: 'power2.inOut',
          onStart: () => element.classList.add('bits-shining'),
          onComplete: () => element.classList.remove('bits-shining'),
        },
      );
      cleanups.push(() => element.classList.remove('bits-shining'));
      return;
    }
    const split = SplitText.create(element, {
      type: effect === 'blur' ? 'words' : 'words,chars',
      charsClass: 'bits-char',
      wordsClass: 'bits-word',
    });
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      split.revert();
    };
    cleanups.push(restore);
    if (effect === 'blur') {
      gsap.fromTo(
        split.words,
        { filter: 'blur(5px)', opacity: 0, y: 16 },
        {
          filter: 'blur(0px)',
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.11,
          ease: 'power2.out',
          onComplete: restore,
        },
      );
    } else {
      gsap.fromTo(
        split.chars,
        { opacity: 0, yPercent: 65, skewX: -18 },
        {
          opacity: 1,
          yPercent: 0,
          skewX: 0,
          duration: 0.75,
          stagger: 0.028,
          ease: 'expo.out',
          onComplete: restore,
        },
      );
    }
  };
  let stopObserving = () => {};
  void document.fonts.ready.then(() => {
    if (!alive) return;
    stopObserving = observeSectionContent(
      '[data-heading-effect]:not([data-heading-effect="float"]):not([data-ignition-heading])',
      (element) => context.add(() => play(element)),
      { threshold: 0.15 },
    );
  });
  return () => {
    alive = false;
    stopObserving();
    context.revert();
    cleanups.forEach((cleanup) => cleanup());
  };
}

// SECTION: Skills tab panel transitions
export function resetSkillPanel(panel: HTMLElement) {
  panelAnimations.get(panel)?.();
  panelAnimations.delete(panel);
}

export function animateSkillPanel(panel: HTMLElement) {
  resetSkillPanel(panel);
  if (reducedMotion()) return;
  const heading = panel.querySelector<HTMLElement>('h3')!;
  const restoreText = decryptText(heading);
  const context = gsap.context(() => {
    gsap.fromTo(
      panel.querySelectorAll(
        '.skill-panel-top, h3, p, .skill-items > li, .skill-panel-note',
      ),
      { opacity: 0, x: 22, y: 8 },
      {
        opacity: 1,
        x: 0,
        y: 0,
        stagger: 0.055,
        duration: 0.5,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      },
    );
  });
  panel.dataset.activationEffect = 'decode-list';
  panelAnimations.set(panel, () => {
    context.revert();
    restoreText();
  });
}

// SECTION: Click sparks
export function initClickSparks() {
  const layer = document.createElement('div');
  layer.className = 'bits-click-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  const click = (event: MouseEvent) => {
    const control = (event.target as Element).closest<HTMLElement>(
      'a, button, summary',
    );
    if (
      !control ||
      control.matches(':disabled, [aria-disabled="true"]') ||
      reducedMotion()
    )
      return;
    const rect = control.getBoundingClientRect();
    const x = event.detail ? event.clientX : rect.x + rect.width / 2;
    const y = event.detail ? event.clientY : rect.y + rect.height / 2;
    const burst = document.createElement('span');
    burst.style.left = x + 'px';
    burst.style.top = y + 'px';
    layer.append(burst);
    while (layer.children.length > 3) layer.firstElementChild?.remove();
    for (let i = 0; i < 8; i++) {
      const spark = document.createElement('i');
      const angle = (i * Math.PI) / 4;
      burst.append(spark);
      const animation = spark.animate(
        [
          {
            transform: `translate(0, 0) rotate(${angle}rad) scaleX(1)`,
            opacity: 0.9,
          },
          {
            transform: `translate(${Math.cos(angle) * 30}px, ${Math.sin(angle) * 30}px) rotate(${angle}rad) scaleX(0.1)`,
            opacity: 0,
          },
        ],
        {
          duration: 420,
          easing: 'cubic-bezier(0.22,1,0.36,1)',
          fill: 'forwards',
        },
      );
      animation.onfinish = () => {
        spark.remove();
        if (!burst.childElementCount) burst.remove();
      };
    }
  };
  document.addEventListener('click', click, { passive: true });
  return () => {
    document.removeEventListener('click', click);
    layer.remove();
  };
}
