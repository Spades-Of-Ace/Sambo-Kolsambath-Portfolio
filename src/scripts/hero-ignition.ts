import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

export function initHeroIgnition() {
  const hero = document.querySelector<HTMLElement>('#home');
  const boot = document.querySelector<HTMLElement>('[data-ignition-boot]');
  const copy = hero?.querySelector<HTMLElement>('.hero-copy');
  const heading = hero?.querySelector<HTMLElement>('[data-ignition-heading]');
  if (!hero || !boot || !copy || !heading) return () => {};
  boot.dispatchEvent(new Event('ignition:claim'));
  const mark = boot.querySelector<HTMLElement>('[data-boot-mark]')!;
  const charge = boot.querySelector<HTMLElement>('[data-boot-charge]')!;
  const curtain = boot.querySelector<HTMLElement>('[data-boot-curtain]')!;
  const details = boot.querySelector<HTMLElement>('[data-boot-details]')!;
  const glint = boot.querySelector<HTMLElement>('[data-boot-glint]')!;
  const halo = boot.querySelector<HTMLElement>('[data-boot-halo]')!;
  const wheel = boot.querySelector<HTMLElement>('[data-boot-wheel]')!;
  const assembly = boot.querySelector<HTMLElement>(
    '[data-boot-wheel-assembly]',
  )!;
  const wheelSpin = boot.querySelector<HTMLElement>('[data-boot-wheel-spin]')!;
  const wheelImage = boot.querySelector<HTMLImageElement>(
    '[data-boot-wheel-image]',
  )!;
  const wheelSweep = boot.querySelector<HTMLElement>(
    '[data-boot-wheel-sweep]',
  )!;
  const logo = mark.querySelector<HTMLImageElement>('.boot-logo')!;
  const navLogo = document.querySelector<HTMLImageElement>(
    '.site-header .brand-logo',
  );
  const header = document.querySelector<HTMLElement>('.site-header');
  const top = hero.querySelector<HTMLElement>('.hero-topline');
  const strip = hero.querySelector<HTMLElement>('.discipline-strip');
  const chrome = [header, top, strip].filter(
    (element): element is HTMLElement => Boolean(element),
  );
  const bike = document.querySelector<HTMLElement>('.backdrop-ignition');
  const wake = document.querySelector<HTMLElement>('.backdrop-wake');
  const children = [...copy.children].filter((element) => element !== heading);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const initialHash = location.hash;
  const deepLink =
    initialHash && initialHash !== '#home' && initialHash !== '#main-content';
  let timeline: gsap.core.Timeline | undefined;
  let split: SplitText | undefined;
  let active = false;
  let deadline = 0;
  let anchorCancelled = false;
  let disposed = false;
  let anchorFrame = 0;
  // SECTION: Restore the homepage after completion or skip
  const settle = () => {
    clearTimeout(deadline);
    timeline?.kill();
    timeline = undefined;
    split?.revert();
    split = undefined;
    if (active) {
      gsap.set([heading, ...children, ...chrome], {
        clearProps: 'transform,opacity,visibility',
      });
      if (bike) gsap.set(bike, { clearProps: 'opacity,transform' });
      if (wake) gsap.set(wake, { clearProps: 'opacity,transform' });
    }
    active = false;
    boot.hidden = true;
    gsap.set(
      [
        boot,
        mark,
        charge,
        curtain,
        details,
        glint,
        halo,
        logo,
        wheel,
        assembly,
        wheelSpin,
        wheelSweep,
      ],
      {
        clearProps: 'all',
      },
    );
    if (navLogo) gsap.set(navLogo, { clearProps: 'opacity,visibility' });
    hero.dataset.ignitionState = 'ready';
    hero.dataset.ignitionPhase = 'complete';
    hero.dataset.ignitionPlayed = 'true';
    copy.dataset.revealed = 'true';
    heading.dataset.bitsRevealed = 'true';
  };
  // SECTION: Startup animation timeline
  const play = () => {
    active = true;
    hero.dataset.ignitionState = 'running';
    hero.dataset.ignitionPhase = 'logo';
    hero.dataset.ignitionPlayed = 'true';
    copy.dataset.revealed = 'true';
    heading.dataset.bitsRevealed = 'true';
    split = SplitText.create(heading, {
      type: 'words,chars',
      charsClass: 'bits-char',
      wordsClass: 'bits-word',
    });
    const source = mark.getBoundingClientRect();
    const destination = navLogo?.getBoundingClientRect();
    // The GSAP timeline uses seconds; these are the navbar handoff times.
    const dockStart = 4;
    const dockEnd = 5.7;
    if (navLogo) gsap.set(navLogo, { autoAlpha: 0 });
    const sequence = gsap.timeline({ onComplete: settle });
    timeline = sequence;
    sequence
      .fromTo(
        mark,
        { autoAlpha: 0, y: 18, x: 0, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.85, ease: 'power3.out' },
        0.15,
      )
      .fromTo(
        logo,
        { filter: 'brightness(0.6)' },
        { filter: 'brightness(1)', duration: 1.1, ease: 'power2.out' },
        0.2,
      )
      .fromTo(
        charge,
        { scaleX: 0 },
        { scaleX: 1, duration: 2.25, ease: 'power2.inOut' },
        0.65,
      )
      .call(
        () => {
          hero.dataset.ignitionPhase = 'charged';
        },
        [],
        2.9,
      )
      .to(halo, { opacity: 0.5, duration: 0.35, ease: 'power2.out' }, 2.9)
      .to(mark, { scale: 1.035, duration: 0.35, ease: 'power2.out' }, 2.9)
      .to(mark, { scale: 1, duration: 0.55, ease: 'power2.inOut' }, 3.4)
      .to(logo, { filter: 'brightness(1.22)', duration: 0.3 }, 2.95)
      .fromTo(
        glint,
        { backgroundPosition: '150% 0' },
        {
          backgroundPosition: '-50% 0',
          duration: 0.9,
          ease: 'power2.inOut',
        },
        3.05,
      )
      .to(glint, { opacity: 1, duration: 0.15, ease: 'power1.out' }, 3.05)
      .to(glint, { opacity: 0, duration: 0.25 }, 3.8)
      .to(halo, { opacity: 0, duration: 0.6 }, 3.45)
      .to(logo, { filter: 'brightness(1)', duration: 0.55 }, 3.45)
      .to(
        details,
        { autoAlpha: 0, y: 8, duration: 0.22, ease: 'power2.out' },
        2.9,
      )
      .call(
        () => {
          hero.dataset.ignitionPhase = 'dock';
        },
        [],
        dockStart,
      );
    // SECTION: Rear wheel spin and light sweep
    sequence
      .to(wheel, { opacity: 0.38, duration: 1.1, ease: 'power2.out' }, 0.9)
      .fromTo(
        assembly,
        { scale: 0.95 },
        { scale: 1, duration: 1.5, ease: 'power2.out' },
        0.9,
      )
      .fromTo(
        wheelSpin,
        { rotation: 0 },
        { rotation: -900, duration: 3.3, ease: 'power2.in' },
        0.9,
      )
      .to(wheel, { opacity: 0.58, duration: 0.4, ease: 'power2.out' }, 2.9)
      .fromTo(
        wheelSweep,
        { backgroundPosition: '150% 0' },
        { backgroundPosition: '-50% 0', duration: 0.9, ease: 'power2.inOut' },
        3.05,
      )
      .to(wheelSweep, { opacity: 1, duration: 0.15 }, 3.05)
      .to(wheelSweep, { opacity: 0, duration: 0.25 }, 3.8)
      .to(wheel, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 3.8);
    // SECTION: Dock the visible logo into the measured navbar rectangle
    if (destination && source.width && destination.width) {
      sequence.to(
        mark,
        {
          x: destination.left - source.left,
          y: destination.top - source.top,
          scale: destination.width / source.width,
          duration: dockEnd - dockStart,
          ease: 'power3.inOut',
        },
        dockStart,
      );
    } else {
      sequence.to(
        mark,
        { y: -30, autoAlpha: 0, duration: 1.2, ease: 'power2.inOut' },
        dockStart,
      );
    }
    // SECTION: Reveal the homepage and swap to the real navbar logo
    sequence
      .call(
        () => {
          hero.dataset.ignitionPhase = 'reveal';
        },
        [],
        4.45,
      )
      .to(curtain, { opacity: 0, duration: 1.35, ease: 'power2.inOut' }, 4.45)
      .fromTo(
        chrome,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.7, stagger: 0.06, ease: 'power2.out' },
        4.55,
      )
      .fromTo(
        split.chars,
        { opacity: 0, yPercent: 65, skewX: -10 },
        {
          opacity: 1,
          yPercent: 0,
          skewX: 0,
          duration: 0.85,
          stagger: 0.018,
          ease: 'power3.out',
        },
        4.8,
      )
      .fromTo(
        children,
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.09,
          ease: 'power3.out',
        },
        4.95,
      );
    if (navLogo) sequence.set(navLogo, { autoAlpha: 1 }, dockEnd);
    sequence.set(mark, { autoAlpha: 0 }, dockEnd);
    if (bike)
      sequence.fromTo(
        bike,
        { opacity: 0.03, scale: 1.045 },
        { opacity: 1, scale: 1, duration: 1.3, ease: 'power2.out' },
        4.45,
      );
    if (wake)
      sequence
        .fromTo(
          wake,
          { xPercent: -110, opacity: 0 },
          { xPercent: 110, opacity: 0.35, duration: 1.1, ease: 'power2.inOut' },
          4.5,
        )
        .to(wake, { opacity: 0, duration: 0.35 }, 5.35);
    boot.hidden = false;
    // The short inline guard covers missing scripts; this separate bound covers a stalled cinematic timeline.
    deadline = window.setTimeout(settle, 8000);
  };
  // SECTION: Skip triggers and initial deep-link handling
  const onScroll = () => {
    if (active && scrollY > 24) settle();
  };
  const onNavigate = (event: MouseEvent) => {
    anchorCancelled = true;
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      'a[href]',
    );
    if (
      active &&
      link?.hash &&
      link.origin === location.origin &&
      link.pathname === location.pathname
    )
      settle();
  };
  const onKey = (event: KeyboardEvent) => {
    anchorCancelled = true;
    if (active && (event.key === 'Escape' || event.key === 'Tab')) settle();
  };
  const onMotion = () => {
    if (motion.matches) settle();
  };
  const onVisibility = () => {
    if (document.hidden && active) settle();
  };
  const onResize = () => {
    if (active) settle();
  };
  const onUserIntent = () => {
    anchorCancelled = true;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('click', onNavigate, true);
  document.addEventListener('keydown', onKey, true);
  motion.addEventListener('change', onMotion);
  document.addEventListener('visibilitychange', onVisibility);
  const onStage = () => {
    if (active) settle();
  };
  const onWheelError = () => {
    wheel.hidden = true;
  };
  wheelImage.addEventListener('error', onWheelError, { once: true });
  if (wheelImage.complete && !wheelImage.naturalWidth) onWheelError();
  window.addEventListener('stage:change', onStage);
  if (deepLink) {
    window.addEventListener('wheel', onUserIntent, { passive: true });
    window.addEventListener('touchstart', onUserIntent, { passive: true });
    void document.fonts.ready.then(() => {
      if (disposed) return;
      anchorFrame = requestAnimationFrame(() => {
        anchorFrame = requestAnimationFrame(() => {
          // Restore only an untouched initial fragment after layout refresh.
          if (!disposed && !anchorCancelled && location.hash === initialHash) {
            const target = document.getElementById(initialHash.slice(1));
            const slot = target?.closest<HTMLElement>('[data-section-slot]');
            if (slot)
              window.scrollTo({ top: slot.offsetTop, behavior: 'instant' });
            else
              target?.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        });
      });
    });
  }
  if (
    motion.matches ||
    scrollY > 24 ||
    deepLink ||
    boot.dataset.expired === 'true' ||
    hero.dataset.ignitionPlayed === 'true'
  )
    settle();
  else {
    try {
      play();
    } catch (error) {
      settle();
      console.warn('Opening animation skipped.', error);
    }
  }
  return () => {
    disposed = true;
    cancelAnimationFrame(anchorFrame);
    settle();
    window.removeEventListener('scroll', onScroll);
    wheelImage.removeEventListener('error', onWheelError);
    window.removeEventListener('stage:change', onStage);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('wheel', onUserIntent);
    window.removeEventListener('touchstart', onUserIntent);
    document.removeEventListener('click', onNavigate, true);
    document.removeEventListener('keydown', onKey, true);
    motion.removeEventListener('change', onMotion);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
