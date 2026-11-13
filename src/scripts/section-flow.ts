import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Scene = {
  panel: HTMLElement;
  slot: HTMLDivElement;
  top: number;
  height: number;
  y: (value: number) => void;
};

export function initSectionFlow() {
  const root = document.querySelector<HTMLElement>('.portfolio-journey');
  if (!root) return () => {};
  const panels = [...root.children].filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el.matches('section, footer'),
  );
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const initialScroll = scrollY;
  const previousAttributes = panels.map((panel) => ({
    hidden: panel.getAttribute('aria-hidden'),
    tabindex: panel.getAttribute('tabindex'),
    inert: panel.inert,
  }));
  const scenes: Scene[] = panels.map((panel) => {
    const slot = document.createElement('div');
    slot.className = 'journey-slot';
    slot.dataset.sectionSlot = panel.id;
    panel.before(slot);
    slot.append(panel);
    panel.classList.add('stage-panel');
    panel.tabIndex = -1;
    return {
      panel,
      slot,
      top: 0,
      height: 0,
      y: gsap.quickSetter(panel, 'y', 'px') as (value: number) => void,
    };
  });
  let selected = -1;
  let frame = 0;
  let viewport = innerHeight;
  let pendingFocus = -1;
  let trigger: ScrollTrigger | undefined;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));
  const smooth = (value: number) => {
    const p = clamp(value, 0, 1);
    return p * p * (3 - 2 * p);
  };
  const find = (hash: string) => {
    try {
      return Math.max(
        0,
        scenes.findIndex(
          ({ panel }) =>
            panel.id === decodeURIComponent(hash.replace(/^#/, '')),
        ),
      );
    } catch {
      return 0;
    }
  };
  const activate = (index: number) => {
    if (selected === index) return;
    const outgoing = scenes[selected]?.panel;
    const incoming = scenes[index].panel;
    const from = outgoing?.id ?? '';
    scenes.forEach(({ panel }, i) => {
      panel.classList.toggle('is-current', i === index);
      panel.inert = i !== index;
      panel.setAttribute('aria-hidden', String(i !== index));
    });
    selected = index;
    root.dataset.activeStage = incoming.id;
    document
      .querySelectorAll<HTMLElement>('[data-nav-section]')
      .forEach((link) => {
        const active = link.dataset.navSection === incoming.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    if (outgoing?.contains(document.activeElement))
      incoming.focus({ preventScroll: true });
    window.dispatchEvent(
      new CustomEvent('stage:change', { detail: { from, to: incoming.id } }),
    );
    window.dispatchEvent(
      new CustomEvent('stage:entered', { detail: { to: incoming.id } }),
    );
  };
  const render = () => {
    if (!scenes.length) return;
    const position = scrollY;
    let index = scenes.findIndex(
      (_, i) =>
        i === scenes.length - 1 ||
        position < scenes[i + 1].top - viewport * 0.5,
    );
    if (index < 0) index = scenes.length - 1;
    const scene = scenes[index];
    const local = position - scene.top;
    const reading = scene.panel.hasAttribute('data-bike-departure')
      ? 0
      : clamp(local, 0, scene.height - viewport);
    let opacity = 1;
    let lift = 0;
    // A fade-through keeps the two content layers mutually exclusive, while native scroll remains continuous.
    if (local < 0 && index > 0) {
      const progress = clamp(1 + local / viewport, 0.5, 1);
      opacity = smooth((progress - 0.5) / 0.32);
      lift = (1 - progress) * viewport * 0.16;
    } else if (index < scenes.length - 1 && local > scene.height - viewport) {
      const progress = clamp(
        (local - scene.height + viewport) / viewport,
        0,
        0.5,
      );
      opacity = 1 - smooth((progress - 0.12) / 0.38);
      lift = -progress * viewport * 0.16;
    }
    scene.y(-reading + (reduced.matches ? 0 : lift));
    scene.panel.style.opacity = String(reduced.matches ? 1 : opacity);
    root.dataset.transitioning = String(!reduced.matches && opacity < 0.99);
    activate(index);
    scene.panel.dataset.sceneOpacity = opacity.toFixed(3);
  };
  const measure = () => {
    frame = 0;
    const oldScene = scenes[selected];
    const local = oldScene ? scrollY - oldScene.top : 0;
    let top = root.getBoundingClientRect().top + scrollY;
    const nextViewport = innerHeight;
    let changed = viewport !== nextViewport;
    viewport = nextViewport;
    scenes.forEach((scene) => {
      const height = Math.ceil(
        Math.max(
          viewport,
          scene.panel.offsetHeight,
          scene.panel.hasAttribute('data-bike-departure') && !reduced.matches
            ? viewport * 1.9
            : 0,
        ),
      );
      changed ||= scene.height !== height || scene.top !== top;
      scene.height = height;
      scene.top = top;
      scene.slot.style.height = height + 'px';
      top += height;
    });
    if (trigger && changed && oldScene)
      window.scrollTo({
        top: Math.max(0, oldScene.top + local),
        behavior: 'instant',
      });
    render();
    if (trigger && changed) ScrollTrigger.refresh();
  };
  const queueMeasure = () => {
    if (!frame) frame = requestAnimationFrame(measure);
  };
  root.classList.add('journey-scroll', 'journey-projected');
  root.dataset.stageFlowReady = 'true';
  root.dataset.scrollMode = 'native';
  root.dataset.transitionMode = 'fade-through';
  measure();
  window.scrollTo({
    top: location.hash ? scenes[find(location.hash)].top : initialScroll,
    behavior: 'instant',
  });
  render();
  // The browser owns scrolling. This observer only projects the current section onto the viewport.
  trigger = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: render,
    onRefresh: render,
  });
  const resize = new ResizeObserver(queueMeasure);
  scenes.forEach(({ panel }) => resize.observe(panel));
  const scrollToScene = (index: number, behavior: ScrollBehavior) =>
    window.scrollTo({ top: scenes[index].top, behavior });
  const onClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href]')
        : null;
    if (!link || link.target === '_blank') return;
    const url = new URL(link.href);
    if (
      url.origin !== location.origin ||
      url.pathname !== location.pathname ||
      !url.hash
    )
      return;
    let id: string;
    try {
      id = decodeURIComponent(url.hash.slice(1));
    } catch {
      return;
    }
    const index =
      id === 'main-content'
        ? 0
        : scenes.findIndex(({ panel }) => panel.id === id);
    if (index < 0) return;
    event.preventDefault();
    if (location.hash !== url.hash) history.pushState(null, '', url);
    pendingFocus = event.detail === 0 ? index : -1;
    scrollToScene(index, reduced.matches ? 'instant' : 'smooth');
    if (reduced.matches && pendingFocus === index) {
      scenes[index].panel.focus({ preventScroll: true });
      pendingFocus = -1;
    }
  };
  const onHistory = () => scrollToScene(find(location.hash), 'instant');
  const onScrollEnd = () => {
    if (pendingFocus >= 0 && selected === pendingFocus)
      scenes[selected].panel.focus({ preventScroll: true });
    pendingFocus = -1;
  };
  const onFocus = (event: FocusEvent) => {
    const target = event.target;
    const scene = scenes[selected];
    if (
      !(target instanceof HTMLElement) ||
      target === scene?.panel ||
      !scene?.panel.contains(target)
    )
      return;
    const box = target.getBoundingClientRect();
    const delta =
      box.bottom > viewport - 24
        ? box.bottom - viewport + 32
        : box.top < 104
          ? box.top - 120
          : 0;
    if (delta)
      window.scrollTo({
        top: clamp(
          scrollY + delta,
          scene.top,
          scene.top + Math.max(0, scene.height - viewport),
        ),
        behavior: reduced.matches ? 'instant' : 'smooth',
      });
  };
  const onMotion = () => {
    measure();
    render();
  };
  document.addEventListener('click', onClick);
  document.addEventListener('focusin', onFocus);
  window.addEventListener('popstate', onHistory);
  window.addEventListener('hashchange', onHistory);
  window.addEventListener('resize', queueMeasure);
  window.addEventListener('scrollend', onScrollEnd);
  reduced.addEventListener('change', onMotion);
  return () => {
    cancelAnimationFrame(frame);
    trigger?.kill();
    resize.disconnect();
    document.removeEventListener('click', onClick);
    document.removeEventListener('focusin', onFocus);
    window.removeEventListener('popstate', onHistory);
    window.removeEventListener('hashchange', onHistory);
    window.removeEventListener('resize', queueMeasure);
    window.removeEventListener('scrollend', onScrollEnd);
    reduced.removeEventListener('change', onMotion);
    root.classList.remove('journey-scroll', 'journey-projected');
    delete root.dataset.stageFlowReady;
    delete root.dataset.scrollMode;
    delete root.dataset.transitionMode;
    scenes.forEach(({ panel, slot }, index) => {
      slot.replaceWith(panel);
      panel.classList.remove('stage-panel', 'is-current');
      panel.inert = previousAttributes[index].inert;
      for (const [name, value] of [
        ['aria-hidden', previousAttributes[index].hidden],
        ['tabindex', previousAttributes[index].tabindex],
      ]) {
        if (value === null) panel.removeAttribute(name!);
        else panel.setAttribute(name!, value!);
      }
      gsap.set(panel, { clearProps: 'transform,opacity' });
    });
  };
}
