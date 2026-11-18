import { gsap } from 'gsap';

export function initProjectGallery() {
  const root = document.querySelector<HTMLElement>('.projects-section');
  const rail = root?.querySelector<HTMLElement>('.project-rail');
  if (!root || !rail || root.dataset.galleryReady === 'true') return;
  root.dataset.galleryReady = 'true';
  root.classList.add('gallery-enhanced');
  const slides = [...root.querySelectorAll<HTMLElement>('.project-slide')];
  const selectors = [
    ...root.querySelectorAll<HTMLButtonElement>('[data-project-select]'),
  ];
  const previous = root.querySelector<HTMLButtonElement>('.gallery-prev')!;
  const next = root.querySelector<HTMLButtonElement>('.gallery-next')!;
  const status = root.querySelector<HTMLElement>('[data-gallery-status]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0;
  let inView = false;
  let transitioning = false;
  let timer = 0;
  let idle = 0;
  let held:
    | { id: number; time: number; x: number; left: number; mouse: boolean }
    | undefined;
  let dragged = false;
  let suppressClick = false;
  let transition: gsap.core.Animation | undefined;
  // SECTION: Project autoplay timing and pause conditions
  const stop = () => {
    clearTimeout(timer);
    root.dataset.autoplay = 'paused';
  };
  const schedule = () => {
    stop();
    const journey = document.querySelector<HTMLElement>(
      '[data-stage-flow-ready]',
    );
    const keyboardFocus =
      document.activeElement !== root &&
      root.contains(document.activeElement) &&
      document.activeElement?.matches(':focus-visible');
    if (
      !inView ||
      held ||
      transitioning ||
      keyboardFocus ||
      reduced.matches ||
      document.hidden ||
      (journey &&
        (journey.dataset.activeStage !== 'projects' ||
          journey.dataset.transitioning === 'true'))
    )
      return;
    root.dataset.autoplay = 'running';
    timer = window.setTimeout(
      () => goTo((selected + 1) % slides.length, true),
      3000,
    );
  };
  // SECTION: Selected project and slide transition
  const setSelected = (index: number, manual = false) => {
    selected = index;
    root.dataset.selectedProject = String(index);
    selectors.forEach((button, i) => {
      button.classList.toggle('selected', i === index);
      button.setAttribute('aria-pressed', String(i === index));
    });
    slides.forEach((slide, i) => {
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    if (manual)
      status.textContent = slides[index].querySelector('h3')?.textContent ?? '';
  };
  const finish = () => {
    transitioning = false;
    rail.style.removeProperty('scroll-snap-type');
    rail.classList.remove('is-sliding');
    schedule();
  };
  const goTo = (index: number, automatic = false) => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    stop();
    transition?.kill();
    gsap.killTweensOf(rail);
    const from = selected;
    setSelected(target, !automatic);
    transitioning = true;
    rail.style.scrollSnapType = 'none';
    rail.classList.add('is-sliding');
    const left = slides[target].offsetLeft;
    if (reduced.matches) {
      rail.scrollLeft = left;
      finish();
      return;
    }
    if (automatic && from === slides.length - 1 && target === 0) {
      transition = gsap
        .timeline({ onComplete: finish })
        .to(rail, { opacity: 0, duration: 0.18 })
        .call(() => {
          rail.scrollLeft = left;
        })
        .to(rail, { opacity: 1, duration: 0.28 });
    } else {
      gsap.set(rail, { opacity: 1 });
      transition = gsap.to(rail, {
        scrollLeft: left,
        duration: 0.7,
        ease: 'power3.inOut',
        onComplete: finish,
      });
    }
  };
  const nearest = () =>
    slides.reduce(
      (best, slide, i) =>
        Math.abs(slide.offsetLeft - rail.scrollLeft) <
        Math.abs(slides[best].offsetLeft - rail.scrollLeft)
          ? i
          : best,
      0,
    );
  // SECTION: Project buttons and keyboard controls
  selectors.forEach((button, index) =>
    button.addEventListener('click', () => goTo(index)),
  );
  previous.addEventListener('click', () => goTo(selected - 1));
  next.addEventListener('click', () => goTo(selected + 1));
  rail.addEventListener('keydown', (event) => {
    if (event.target !== rail) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(selected + (event.key === 'ArrowRight' ? 1 : -1));
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      goTo(event.key === 'Home' ? 0 : slides.length - 1);
    }
  });
  root.addEventListener('focusin', schedule);
  root.addEventListener('focusout', () => setTimeout(schedule, 0));
  // SECTION: Hold to pause, drag, and swipe
  rail.addEventListener('dragstart', (event) => event.preventDefault());
  rail.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || held) return;
    stop();
    held = {
      id: event.pointerId,
      time: performance.now(),
      x: event.clientX,
      left: rail.scrollLeft,
      mouse: event.pointerType === 'mouse',
    };
    dragged = false;
    suppressClick = false;
  });
  rail.addEventListener('pointermove', (event) => {
    if (!held || held.id !== event.pointerId || !held.mouse) return;
    const distance = event.clientX - held.x;
    if (Math.abs(distance) > 8 && !dragged) {
      transition?.kill();
      transitioning = false;
      dragged = true;
      rail.classList.add('is-dragging');
      rail.setPointerCapture(event.pointerId);
    }
    if (dragged) {
      event.preventDefault();
      rail.scrollLeft = held.left - distance;
    }
  });
  const release = (event: PointerEvent) => {
    if (!held || held.id !== event.pointerId) return;
    suppressClick = dragged || performance.now() - held.time > 180;
    held = undefined;
    rail.classList.remove('is-dragging');
    if (rail.hasPointerCapture(event.pointerId))
      rail.releasePointerCapture(event.pointerId);
    if (dragged) goTo(nearest());
    else schedule();
    dragged = false;
    setTimeout(() => {
      suppressClick = false;
    }, 0);
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  rail.addEventListener(
    'click',
    (event) => {
      if (suppressClick || dragged) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );
  rail.addEventListener('contextmenu', (event) => {
    if (held) event.preventDefault();
  });
  rail.addEventListener(
    'scroll',
    () => {
      if (transitioning || held) return;
      stop();
      clearTimeout(idle);
      idle = window.setTimeout(() => {
        setSelected(nearest());
        schedule();
      }, 140);
    },
    { passive: true },
  );
  // SECTION: Visibility, resize, and section changes
  const visibility = new IntersectionObserver(
    (entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      schedule();
    },
    { threshold: 0.1 },
  );
  visibility.observe(rail);
  const resize = new ResizeObserver(() => {
    // Hidden stage panels have no measurable width.
    if (!rail.clientWidth) return;
    transition?.kill();
    transitioning = false;
    rail.scrollLeft = slides[selected].offsetLeft;
    rail.style.removeProperty('scroll-snap-type');
    rail.classList.remove('is-sliding');
    gsap.set(rail, { opacity: 1 });
    schedule();
  });
  resize.observe(rail);
  const onStage = () => {
    stop();
    if (held) held = undefined;
  };
  const onEntered = () => {
    if (rail.clientWidth) rail.scrollLeft = slides[selected].offsetLeft;
    schedule();
  };
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', schedule);
  window.addEventListener('stage:change', onStage);
  window.addEventListener('stage:entered', onEntered);
  window.addEventListener('pageshow', schedule);
  const onBlur = () => {
    held = undefined;
    dragged = false;
    rail.classList.remove('is-dragging');
    stop();
  };
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', schedule);
  window.addEventListener('pagehide', (event) => {
    stop();
    clearTimeout(idle);
    if (event.persisted) return;
    transition?.kill();
    visibility.disconnect();
    resize.disconnect();
    document.removeEventListener('visibilitychange', schedule);
    reduced.removeEventListener('change', schedule);
    window.removeEventListener('pointerup', release);
    window.removeEventListener('pointercancel', release);
    window.removeEventListener('stage:change', onStage);
    window.removeEventListener('stage:entered', onEntered);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', schedule);
  });
  setSelected(0);
  schedule();
}
