import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { shaderProfile } from './shader-presets';

type View =
  | 'quarter'
  | 'detail'
  | 'head'
  | 'side'
  | 'rear'
  | 'cockpit'
  | 'signal';
type Pose = {
  view: View;
  width: number;
  cx: number;
  cy: number;
  rotation: number;
  tone: string;
  focus: string;
};

export function initBikeJourney(wide: boolean, reduced: boolean) {
  const scene = document.querySelector<HTMLElement>('[data-racing-backdrop]');
  const journey = document.querySelector<HTMLElement>('.portfolio-journey');
  if (!scene || !journey) return () => {};
  const camera = scene.querySelector<HTMLElement>('[data-background-bike]')!;
  const motion = scene.querySelector<HTMLElement>('.backdrop-bike-motion')!;
  const tone = scene.querySelector<HTMLElement>('.backdrop-tone')!;
  const lighting = scene.querySelector<HTMLElement>('[data-section-lighting]');
  const shader = scene.querySelector<HTMLElement>('[data-hero-shader]')!;
  const views = [
    ...scene.querySelectorAll<HTMLImageElement>('[data-bike-view]'),
  ];
  let current = 'home';
  const pose = (section: string): Pose => {
    const w = innerWidth;
    const h = innerHeight;
    const compact = !wide;
    const poses: Record<string, Pose> = {
      home: {
        view: 'quarter',
        width: Math.min(w * (compact ? 1.45 : 0.64), 1180),
        cx: compact ? 0.64 : 0.71,
        cy: compact ? 0.69 : 0.53,
        rotation: 0,
        tone: '#080d0b',
        focus: 'three-quarter',
      },
      experience: {
        view: 'rear',
        width: Math.min(w * (compact ? 1.9 : 1.05), 1800),
        cx: compact ? 0.69 : 0.76,
        cy: 0.56,
        rotation: -2,
        tone: '#142019',
        focus: 'career-trajectory',
      },
      projects: {
        view: 'detail',
        width: Math.min(w * (compact ? 2.1 : 1.25), 2200),
        cx: compact ? 0.6 : 0.72,
        cy: 0.6,
        rotation: 0,
        tone: '#131b20',
        focus: 'built-engine',
      },
      skills: {
        view: 'head',
        width: Math.min(w * (compact ? 1.9 : 1.15), 1800),
        cx: compact ? 0.68 : 0.72,
        cy: 0.58,
        rotation: 3,
        tone: '#1b1822',
        focus: 'headlight',
      },
      about: {
        view: 'cockpit',
        width: Math.min(w * (compact ? 2 : 1.12), 1900),
        cx: compact ? 0.73 : 0.76,
        cy: 0.64,
        rotation: -4,
        tone: '#22231a',
        focus: 'behind-the-controls',
      },
      contact: {
        view: 'signal',
        width: Math.min(w * (compact ? 2.1 : 1.18), 2000),
        cx: compact ? 0.76 : 0.81,
        cy: 0.57,
        rotation: 0,
        tone: '#21151a',
        focus: 'illuminated-signal',
      },
      departure: {
        view: 'side',
        width: Math.min(
          w * (compact ? 0.92 : 0.78),
          (h - (compact ? 220 : 240)) * 1.6,
        ),
        cx: compact ? 0.5 : 0.57,
        cy: 0.56,
        rotation: 0,
        tone: '#090e0b',
        focus: 'whole-bike',
      },
    };
    return poses[section] ?? poses.home;
  };
  const apply = (section: string, instant = false) => {
    current = section;
    const next = pose(section);
    const profile = shaderProfile(section);
    const duration = reduced || instant ? 0 : 0.6;
    scene.dataset.phase = section;
    scene.dataset.focus = next.focus;
    scene.dataset.bikeView = next.view;
    scene.dataset.shaderProfile = shaderProfile(section).name;
    shader.dataset.section = section;
    shader.dispatchEvent(
      new CustomEvent('shader:section', { detail: { section, instant } }),
    );
    gsap.set(shader, {
      '--still-turn': shaderProfile(section).angle + 18 + 'deg',
      '--still-hue': section === 'contact' ? '285deg' : '0deg',
    });
    gsap.to(camera, {
      left: 0,
      top: 0,
      width: next.width,
      x: innerWidth * next.cx - next.width / 2,
      y: innerHeight * next.cy - (next.width * 0.625) / 2,
      rotation: next.rotation,
      duration,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    gsap.to(tone, { backgroundColor: next.tone, duration, overwrite: 'auto' });
    if (lighting)
      gsap.to(lighting, {
        '--light-a': `rgb(${Math.round(profile.r * 255)}, ${Math.round(profile.g * 255)}, ${Math.round(profile.b * 255)})`,
        '--light-b': `rgb(${Math.round(profile.ar * 255)}, ${Math.round(profile.ag * 255)}, ${Math.round(profile.ab * 255)})`,
        duration,
        overwrite: 'auto',
      });
    views.forEach((image) =>
      gsap.to(image, {
        opacity: image.dataset.bikeView === next.view ? 1 : 0,
        duration: reduced || instant ? 0 : 0.45,
        ease: 'power2.inOut',
        overwrite: 'auto',
      }),
    );
  };
  const pauseShader = (paused: boolean) => {
    shader.dataset.paused = String(paused);
    shader.dispatchEvent(new Event('shader:visibility'));
    scene.dataset.hidden = String(paused);
  };
  journey.classList.add('journey-ready');
  const change = (section: string, instant = false) => {
    if (section === 'footer') {
      current = section;
      pauseShader(true);
      return;
    }
    pauseShader(false);
    apply(section, instant);
  };
  const onStage = (event: Event) =>
    change((event as CustomEvent<{ to: string }>).detail.to);
  change(journey.dataset.activeStage ?? 'home', true);
  window.addEventListener('stage:change', onStage);
  const departure = journey.querySelector<HTMLElement>('[data-bike-departure]');
  if (departure && !reduced) {
    gsap
      .timeline({
        scrollTrigger: {
          trigger:
            departure.closest<HTMLElement>('[data-section-slot]') ?? departure,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            scene.dataset.departureProgress = self.progress.toFixed(3);
          },
        },
      })
      .fromTo(
        motion,
        { xPercent: 0, autoAlpha: 1 },
        { xPercent: -250, duration: 0.64, ease: 'power2.in' },
        0.26,
      )
      .to(motion, { autoAlpha: 0, duration: 0.06 }, 0.9)
      .to('.departure-copy', { autoAlpha: 0, y: -20, duration: 0.15 }, 0.3)
      .to('.departure-signoff', { autoAlpha: 0, duration: 0.15 }, 0.73);
  }
  const onRefresh = () => change(journey.dataset.activeStage ?? current, true);
  ScrollTrigger.addEventListener('refresh', onRefresh);
  return () => {
    ScrollTrigger.removeEventListener('refresh', onRefresh);
    window.removeEventListener('stage:change', onStage);
    journey.classList.remove('journey-ready');
    pauseShader(false);
  };
}
