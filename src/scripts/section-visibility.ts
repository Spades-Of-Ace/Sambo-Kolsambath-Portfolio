export function observeSectionContent(
  selector: string,
  reveal: (element: HTMLElement) => void,
  options: IntersectionObserverInit = {},
) {
  const seen = new WeakSet<Element>();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting || seen.has(entry.target)) continue;
      const element = entry.target as HTMLElement;
      const panel = element.closest<HTMLElement>('.stage-panel');
      const journey = element.closest<HTMLElement>('.journey-projected');
      if (journey && panel?.id !== journey.dataset.activeStage) continue;
      seen.add(element);
      observer.unobserve(element);
      reveal(element);
    }
  }, options);
  const observe = () => {
    observer.disconnect();
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      if (seen.has(element)) return;
      const panel = element.closest<HTMLElement>('.stage-panel');
      const journey = element.closest<HTMLElement>('.journey-projected');
      if (!journey || panel?.id === journey.dataset.activeStage)
        observer.observe(element);
    });
  };
  observe();
  window.addEventListener('stage:change', observe);
  return () => {
    observer.disconnect();
    window.removeEventListener('stage:change', observe);
  };
}
