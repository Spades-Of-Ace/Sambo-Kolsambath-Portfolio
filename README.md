# ACE Racing Portfolio

Start with [index.astro](src/pages/index.astro) to see the homepage in scroll
order. Search for `SECTION:` in VS Code to jump between labeled blocks. The
routes in `src/pages/` reuse the same section components, so edits in
`src/sections/` also apply to the corresponding standalone pages.

## Where to Edit

| What you want to change | Start here |
| --- | --- |
| Homepage name, titles, or description | [Hero.astro](src/sections/Hero.astro) |
| Homepage buttons, resume, or CV links | [HeroActions.astro](src/components/HeroActions.astro); PDFs live in [public/cv/](public/cv/) |
| Dashboard images or other bike views | [RacingBackdrop.astro](src/components/RacingBackdrop.astro); artwork lives in [public/assets/motorcycle/h2r/](public/assets/motorcycle/h2r/) |
| Seconds between dashboard flashes | [journey.css](src/styles/journey.css), `Home dashboard artwork and glitch timing`; edit the first time value in `animation: dashboard-pulse ...` |
| Startup logo, rear wheel, or handoff timing | [BootIntro.astro](src/components/BootIntro.astro) for artwork, [ignition.css](src/styles/ignition.css) for styling, [hero-ignition.ts](src/scripts/hero-ignition.ts) for timing |
| Experience roles, dates, and bullets | [Experience.astro](src/sections/Experience.astro) |
| Experience overlay darkness | [journey.css](src/styles/journey.css), `Home layout and per-section background opacity` |
| Projects, screenshots, or links | [Projects.astro](src/sections/Projects.astro); screenshots live in [public/images/](public/images/) |
| Project autoplay, arrows, or swipe behavior | [project-gallery.ts](src/scripts/project-gallery.ts) |
| Skill categories or descriptions | [Skills.astro](src/sections/Skills.astro) |
| Bio or education | [About.astro](src/sections/About.astro) |
| Email, social links, or contact downloads | [Contact.astro](src/sections/Contact.astro) |
| Navigation or footer links | [Navbar.astro](src/components/Navbar.astro) or [Footer.astro](src/components/Footer.astro) |
| Closing message or the bike driving away | [BikeDeparture.astro](src/sections/BikeDeparture.astro) for copy, [bike-journey.ts](src/scripts/bike-journey.ts) for motion |

## Layout and Motion

- [racing.css](src/styles/racing.css) defines the base layout, section styles,
  and responsive rules. [readability.css](src/styles/readability.css) overrides
  text and control sizes. The older `hero.css` and `scene.css` files are not
  imported by the current pages.
- [neon.css](src/styles/neon.css) defines accent colors and text glows.
  [shader-presets.ts](src/scripts/shader-presets.ts) defines the moving
  background pattern for each section.
- [bike-journey.ts](src/scripts/bike-journey.ts) controls bike framing and
  crossfades. [section-flow.ts](src/scripts/section-flow.ts) and
  [section-flow.css](src/styles/section-flow.css) control the scrolling layout.
- [Motion.astro](src/components/Motion.astro) starts the effects.
  [react-bits-motion.ts](src/scripts/react-bits-motion.ts) handles most section
  entrances and click effects, and [scroll-float.ts](src/scripts/scroll-float.ts)
  handles the Skills headline.
- [BaseLayout.astro](src/layouts/BaseLayout.astro) contains shared metadata,
  fonts, global style imports, and homepage reload behavior.

## Local Commands

```sh
npm install
npm run dev
npm run check
npm run build
```

See [ACE Racing implementation notes](docs/ace-racing.md) for asset details,
animation behavior, and browser verification commands.
