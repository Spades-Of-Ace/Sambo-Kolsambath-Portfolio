# ACE / RACING

The racing redesign uses the existing Astro routes and professional content.
The homepage contains all six sections. Individual routes remain available.
Legacy space images/styles are not loaded by the homepage. The borrowed
motorcycle model and its Three.js runtime have been removed. Transparent
motorcycle images transition above a section-aware Threads-derived shader.

## Editing

- Design tokens and responsive rules: `src/styles/racing.css`.
- Homepage glass panels, backdrop and interaction polish: `src/styles/journey.css`.
- Native-scroll section projection and fade-through: `src/scripts/section-flow.ts`.
- Active-section entrance observers: `src/scripts/section-visibility.ts`.
- Full-height document layout: `src/styles/section-flow.css`.
- Supporting-copy sizes and logo presentation: `src/styles/readability.css`.
- Once-only scroll reveals: `src/components/Motion.astro`.
- Hero composition and copy: `src/sections/Hero.astro`.
- Logo boot screen: `src/components/BootIntro.astro` and `src/styles/ignition.css`.
- One-shot homepage power-on sequence: `src/scripts/hero-ignition.ts`.
- Section neon light planes and heading accents: `src/styles/neon.css`.
- Persistent background layers: `src/components/RacingBackdrop.astro`.
- Section camera poses and closing ride-away: `src/scripts/bike-journey.ts`.
- Closing sequence content: `src/sections/BikeDeparture.astro`.
- React Bits heading animation: `src/scripts/scroll-float.ts`.
- Section text, content and click effects: `src/scripts/react-bits-motion.ts`.
- Shared effect styling: `src/styles/section-motion.css`.
- Hero shader loading and fallback: `src/components/HeroShader.astro`.
- Shader uniforms, render lifecycle: `src/scripts/threads-shader.ts`.
- Section shader shapes, colors and speeds: `src/scripts/shader-presets.ts`.
- Project content: `src/sections/Projects.astro`.
- Project sliding, autoplay and pause behavior: `src/scripts/project-gallery.ts`.
- Skill content and keyboard-accessible tabs: `src/sections/Skills.astro`.
- Career, education, contacts: their corresponding section components.

The homepage uses browser-native document scrolling through measured section
slots. Only the current section's content is projected onto the viewport.
At a boundary, outgoing content fades/lifts away before incoming content
appears. The bike and shader remain visible through the handoff, so two
section layouts never share the screen.

Transition progress comes directly from scroll position, not a timed slide.
There are no wheel/touch/key handlers, thresholds, gesture locks, snapping or
forced scroll-back. Stopping or reversing immediately stops or reverses the
handoff. Long sections translate through their measured content height; their
last screen remains readable before the next handoff. Resizing remeasures
slots while preserving reading position. Reduced motion uses an immediate
single-section handoff without fade or lift.

Inactive content is hidden and inert without collapsing its scroll slot.
Entrance observers watch only the current section, preventing hidden fixed
panels from consuming their once-only animations on initial load. Keyboard
focus is kept on the visible section, and focused controls below the viewport
scroll into view. Same-page links and history use native scrolling to the
corresponding slot. Without JavaScript, the original document remains available
in normal flow.

Each content section has a different transparent motorcycle image. A seventh
side-profile image returns the whole bike before it drives left as the footer
slides in. The shader pauses at the footer and resumes when reversing.
This is an image-based camera treatment, not a live 3D model. The reference
video is not included in the website.

Full-width section panels use 50% background alpha, not element opacity:
text, logos and project screenshots stay opaque. No backdrop blur is added.
Titles retain their previous scale. Supporting descriptions are 18px on desktop
and 16px on mobile, with larger labels, controls, metadata and footer copy.
The numbered section-status bands and hero scroll prompt have been removed.

Projects slide horizontally on desktop and mobile, using arrows beside the
project selector rather than in the section heading. Keyboard arrows/Home/End,
touch scrolling and mouse dragging also work. Each slide dwells for three
seconds before advancing; the last wraps to the first with a short fade.
Pressing and holding the showcase pauses autoplay; releasing resumes it.
A held click does not accidentally open a project. Keyboard focus within the
gallery controls, offscreen sections and hidden browser tabs also pause autoplay.
There is no pause button, timer, total count or progress strip. Reduced motion
disables autoplay and entrance effects.

Content is server-rendered. Without JavaScript, every section remains in normal
document flow, all projects appear in a vertical list, and the shader still is
visible behind the motorcycle. Standalone routes remain available with their
original section styling.

## Ignition

The homepage opens with a roughly six-second cinematic ignition. The user's
ACE logo slowly appears on black while the green charge line fills. Once
charged, a restrained push-in, rim highlight and metallic light sweep give
the logo a brief finishing beat. It then glides into the real navbar logo's
measured rectangle over 1.7 seconds while the black curtain fades and the
navigation, bike, headline and supporting content reveal behind it.

An H2R-inspired rear wheel emerges behind the logo during charge-up. The tire,
green-edged rim and spokes progressively accelerate, then catch a single
silver-green light sweep with the logo. The sweep is masked to the wheel and
rotates with it, keeping the open spaces between spokes transparent. The wheel
fades out by 4.3 seconds, before the homepage reveal. This replaces the previous
supercharger and H2 headlight visuals; the H2R section backgrounds are unchanged.
It uses one transparent bitmap and a finite transform animation, not another
renderer or an ongoing spin loop. Skipping or finishing releases every startup
transform. Asset provenance and the generation prompt are in
`docs/rear-wheel-ignition-assets.md`.

The moving logo and navbar logo use the same image. Their visibility swaps
only once their rectangles align, so there is no doubled logo or position jump.
The destination is measured for each viewport; resizing finishes the intro
safely instead of docking at stale coordinates. The effect is a metallic gloss,
not ice/frost. There is no speedometer, instrument panel, replay control or
reserved dashboard space in the hero.

An inline opt-in arms the visual before the main application scripts load,
preventing a homepage flash ahead of the logo. A 2.8-second guard restores the
server-rendered page if application scripts fail to load. Once the application
claims the intro, a separate eight-second bound restores content if animation
frames stall. The green charge line is a visual startup flourish, not a claim
of asset-download progress. Nothing waits for a synthetic loading percentage.

It runs once per page load. Scrolling, Escape, Tab, a same-page navigation link,
resizing or hiding the tab immediately finish the intro. Direct section links,
reduced motion and no JavaScript bypass the boot screen. The overlay does not
capture input, lock scrolling, move the document or replay on scrolling home.

Reloading the homepage from any section now clears the section fragment,
disables the browser's saved-scroll restoration for that reload, and returns
to the top before the startup script runs. Query parameters are preserved.
Normal history restoration is reinstated after the initial pageshow window.
First-time shared deep links and standalone pages retain their existing
behavior. Reduced-motion users still start at the top on reload, but bypass
the animated intro.

The sequence uses the shared optimized ACE logo and the existing GSAP runtime.
No audio, extra canvas or animation dependency is added for startup. The logo
also appears in the navbar and footer; the supplied icon is used as the favicon.
Original uploads are preserved. Transparent copies and their editing prompts
are documented in `docs/ace-logo-assets.md`.

## Section Lighting

Broad linear light planes behind the motorcycle interpolate their two colors
with the current shader profile. They add edge illumination without gradient
orbs, background blur, or a new rendering loop. Foreground title accents use
related readable gradients and low-opacity halos: ignition green, career
yellow-green, project silver-green, skills lime, personal ivory-green and contact coral.
The cyan/teal title accents and cool shader hues have been removed. Section
shader geometry still changes, retaining the continuous scroll transition.
Body copy stays sharp and untinted. The original 50% section-panel alpha and
background transparency are unchanged.

## React Bits Shader

The persistent backdrop adapts the actual GLSL from React Bits' Threads background by David
Haz, using direct WebGL2 so it requires neither Three.js nor a React island.
The original flowing-line geometry is extended with orbital paths and a
subtle blueprint grid. A single canvas interpolates its uniforms between
profiles instead of mounting a different renderer for every section:

| Section    | Bike View                   | Shader Profile                        |
| ---------- | --------------------------- | ------------------------------------- |
| Intro      | Front three-quarter         | Green ignition ribbons                |
| Experience | Rear three-quarter          | Long racing trajectories              |
| Projects   | Engine and frame detail     | Silver-green blueprint lines and grid |
| Skills     | Head-on precision view      | Lime/off-white telemetry arcs         |
| About      | Cockpit and controls        | Soft rider-perspective sweep          |
| Contact    | Illuminated red rear signal | Converging red/green signal arcs      |
| Closing    | Complete side profile       | Clear-road ribbons                    |

Source: https://github.com/DavidHDev/react-bits/tree/main/src/ts-default/Backgrounds/Threads

License and adaptation notes are in `public/assets/shaders/`. The original
MIT + Commons Clause notice is retained. A source credit is in the footer.

The module loads when the background enters the viewport. Rendering is capped
at 30 fps, pixel ratio at 1.25, and the longest render dimension at 1600px.
The animation stops at the footer and in hidden tabs. Mouse movement gently
changes the flow; it does not capture touch gestures or page scrolling.

Reduced-motion visitors and browsers without WebGL2 see a captured still of
the same shader. Context loss also returns to that image. No JavaScript is
required to display the still or use the portfolio content.
The fallback still changes orientation and hue with section selection, without
introducing another animated canvas or background blur.

## Section Effects

The homepage adapts different React Bits treatments to its existing markup:

- Intro: Split Text character/skew reveal.
- Experience: Animated Content lateral entrances for the career entries.
- Projects: Decrypted Text heading and a content wipe.
- Skills: Scroll Float heading, staggered workbench entrance, then title decoding
  and sequential rows when selecting a different category.
- About: Brief Blur Text word focus and a shallow perspective entrance.
- Contact: Shiny Text sweep and vertical content reveals.

GSAP SplitText preserves nested emphasis and accessible heading labels.
Decrypted characters retain invisible original glyphs so the layout does not
jitter. Blur affects text briefly on entry, never the motorcycle background.
Scroll Float restores the original heading DOM after its entrance. Temporary
solid glyph fill prevents clipped gradients from disappearing while characters
are transformed; the complete gradient returns once the animation settles.
This keeps the Skills heading's WORK accent visible instead of leaving only glow.

Headings and content entrance animations play only once per page load; they
do not hide again or replay when scrolling back. Click-driven category effects
can replay. Reduced motion disables these effects, including if switched while
a skill-panel entrance is running.

Source: https://github.com/DavidHDev/react-bits/tree/main/src/ts-default/TextAnimations/ScrollFloat

Buttons, project images and contact links use a contained CSS light sweep
adapted from React Bits' Glare Hover. Other interactive rows and controls use
restrained translation and color feedback. These do not add a render loop.
React Bits Click Spark adds a short radial dash burst to clickable controls.
It uses bounded Web Animations rather than a second full-screen canvas. The
effect layer ignores pointer input and does not delay navigation or downloads.

Source: https://reactbits.dev/animations/glare-hover
Full source links and adaptation details: `public/assets/shaders/CREDITS.md`.

## Interface Icons

Interface symbols use the existing Lucide Astro library with a consistent
1.75px stroke: search/focus/collaboration/target for About traits, code/location/
processor/route for personal details, and briefcase/send/messages for contact
groups. Documents and email use FileText/Mail. Social, company, university and
ACE brand logos are retained. No extra icon package or live 3D runtime is added.

ContentCore is a possible authoring tool for future project mockups and metallic
logo exports, not a runtime dependency. No ContentCore assets were downloaded,
embedded or purchased. Review its licensing before publishing generated exports:
https://contentcore.xyz/

## Bike Layers

The built-in image-generation tool produced seven transparent H2R-inspired
illustrations from the existing synthesized motorcycle image. They are not
official Kawasaki photography or a live 3D model. No affiliation is claimed.

Final project assets:

- `public/assets/motorcycle/h2r/bike-front.webp`
- `public/assets/motorcycle/h2r/bike-side.webp`
- `public/assets/motorcycle/h2r/bike-head-on.webp`
- `public/assets/motorcycle/h2r/bike-detail.webp`
- `public/assets/motorcycle/h2r/bike-rear-quarter.webp`
- `public/assets/motorcycle/h2r/bike-cockpit.webp`
- `public/assets/motorcycle/h2r/bike-rear-signal.webp`

All preserve real alpha transparency so the shader is visible around the bike
and through the open frame/spoke gaps. `scripts/prepare-bike-images.mjs` trims,
normalizes their canvas size, and encodes them as WebP while preserving alpha.
The three new section views use `scripts/prepare-section-bikes.mjs` instead,
keeping their original composition and alpha at 1600 x 1000. Their complete
prompt set and provenance are in `docs/bike-section-assets.md`. The illuminated
tail is a cinematic interpretation rather than an official H2R specification.

Front-image prompt:

> Use case: background-extraction. Edit target: the provided motorcycle image.
> Make a clean, high-resolution product cutout of ONLY the entire motorcycle on
> a genuinely transparent alpha background. Keep the motorcycle exactly unchanged:
> same front-left three-quarter view facing left, black carbon-fiber and silver
> fairings, green tubular frame, both wheels, windshield, proportions, lighting
> and all mechanical details. Remove the entire studio background, overhead light
> fixtures, floor and reflections. Preserve the dark opaque motorcycle body; do
> NOT make black surfaces transparent. Preserve transparency through gaps between
> the frame, spokes and tires where the background was visible. Fit the COMPLETE
> motorcycle with all wheels and tail fully inside a tightly framed landscape
> canvas with a little transparent padding. No extra objects, floor shadow, text
> or watermark. This cutout will be layered above an animated line shader on a
> web portfolio.

Side-image prompt:

> Use case: product-mockup camera-angle variation. Reference image: the provided
> transparent motorcycle cutout. Create a matching second image of THE SAME
> motorcycle, photographed from an almost pure left-side profile, with the front
> wheel toward the LEFT and rear wheel toward the RIGHT. Maintain the same exact
> H2R-inspired carbon-fiber bodywork, polished silver side fairings, bright green
> trellis frame and green wheel trim, racing slick tires, winglets, mechanical
> details, lighting and material quality. Genuine transparent alpha background,
> no studio, floor, reflection or cast shadow. Whole motorcycle visible, no clipped
> wheels, tail or windshield. Match the previous image's landscape canvas size
> and subject center/scale so the two images can crossfade in a website hero.
> Photorealistic high-end product photo, not a low-poly model. Do not add logos,
> text, a rider, mirrors, scenery, smoke, or a border. Keep dark bodywork opaque
> and cut out background gaps cleanly.

## Cinematic Frames

Additional built-in image-generation prompts for the cinematic sequence:

Head-on frame:

> Create a camera-angle variation of this exact H2R-inspired motorcycle for a
> cinematic website scroll sequence. Show the SAME motorcycle directly from the
> FRONT, perfectly centered and symmetrical, as if the camera has swung around
> from the provided front-left three-quarter view. Entire motorcycle visible
> including windshield, green frame accents, carbon and silver winglets and
> front tire; centered on a landscape transparent-alpha canvas with safe padding.
> Preserve the sharp photorealistic product photography, dark carbon-fiber,
> polished silver fairings, bright green frame, black slick tires and white
> studio reflections. No floor, cast shadow, backdrop, rider, logos, text or
> watermark. Dark surfaces must stay opaque, with real transparency around and
> through the motorcycle. It should look like another photograph of the same
> bike, NOT a game model or illustration.

Detail frame:

> Use case: background-extraction. Edit target: the supplied close-up of a
> carbon-fiber, polished silver and green H2R-inspired motorcycle. Remove ONLY
> the dark studio backdrop from behind the bike, including the area at the left
> of the rear wheel. Return a genuinely transparent alpha image. Preserve the
> existing extreme close-up composition, camera angle, cropped bodywork at right,
> carbon weave, polished fairings, green tubular frame, wheel, cables, handlebar
> and mechanical details. Preserve all opaque dark motorcycle surfaces; cut
> transparency through the open frame and around the visible bike silhouette.
> Do not zoom out or redraw a complete bike. This will be a full-bleed detail
> frame in a cinematic scroll sequence over a moving shader. No floor, background,
> shadows, text, labels, logos or watermark.

## Verification

- `npm run capture:shader`: regenerate the WebP still from the live shader.
- `npm run verify:journey` (also `verify:shader`): live canvas pixel variation,
  context-loss fallback, unique bike/shader profiles, panel alpha, once-only
  effects, skill selection and shader pause/resume at the footer.
- `npm run verify:stages` (also `verify:racing`): single-section fade-through,
  gradient-text pixel checks, immediate wheel response,
  reversing without snap-back, long-section scrolling, touch gestures, navigation/history,
  three-second autoplay and hold/release, keyboard access, ride-away/reverse,
  responsive screenshots at 320/390/768/1024/1920px, image decoding,
  standalone routes and no-JavaScript fallback.
- `npm run verify:ignition`: logo-first boot, full-homepage reveal, absence of
  the old gauge, scroll/keyboard cancellation, section lighting, responsive
  layouts, failed-script fail-safe and accessibility fallbacks.
- `npm run check` and `npm run build`: Astro diagnostics and production output.

Browser scripts default to `http://localhost:4321`; set `PREVIEW_URL` to test
another running local preview.
