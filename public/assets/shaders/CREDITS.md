# React Bits Effects

Adapted from React Bits / Threads by David Haz, copyright 2026.

- Demo: https://reactbits.dev/backgrounds/threads
- Source: https://github.com/DavidHDev/react-bits/tree/main/src/ts-default/Backgrounds/Threads
- License: MIT + Commons Clause, reproduced in `react-bits-LICENSE.txt`.
- Source retrieved: November 12, 2026.

The original line-noise shader is the basis of this adaptation. The vertex
shader adds smoothly blended orbital paths and the screen pass adds a subtle
blueprint grid. Section presets interpolate angle, spacing, wave shape, speed,
offset and color inside a single WebGL canvas. The renderer was adapted for
Astro without React or graphics-library dependencies, with portfolio colors,
30 fps rendering, resolution limits, lazy loading, footer/tab suspension,
reduced-motion support, and a static fallback captured from the shader.

This background is part of the ACE portfolio, not a standalone component pack.

Section-heading motion also adapts React Bits / Scroll Float by David Haz.

- Demo: https://reactbits.dev/text-animations/scroll-float
- Source: https://github.com/DavidHDev/react-bits/tree/main/src/ts-default/TextAnimations/ScrollFloat
- License: the same MIT + Commons Clause notice in `react-bits-LICENSE.txt`.

The float tween and character grouping were adapted to the existing Astro
heading elements, preserving their emphasis and accessible labels. The stretch,
distance and timing are restrained for portfolio text readability. Entrances
run once per page load rather than reversing on every scroll.

Interactive light sweeps adapt React Bits / Glare Hover by David Haz.

- Demo: https://reactbits.dev/animations/glare-hover
- Source: https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/GlareHover/GlareHover.css
- License: the same MIT + Commons Clause notice in `react-bits-LICENSE.txt`.

The contained CSS gradient sweep is adapted to the portfolio's existing
buttons, project images and contact links. No additional render loop is used.

## Section Motion

Additional React Bits effects by David Haz, retrieved November 13, 2026:

- Split Text: https://github.com/DavidHDev/react-bits/blob/main/src/content/TextAnimations/SplitText/SplitText.jsx
- Animated Content: https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/AnimatedContent/AnimatedContent.jsx
- Decrypted Text: https://github.com/DavidHDev/react-bits/blob/main/src/content/TextAnimations/DecryptedText/DecryptedText.jsx
- Blur Text: https://github.com/DavidHDev/react-bits/blob/main/src/content/TextAnimations/BlurText/BlurText.jsx
- Shiny Text: https://github.com/DavidHDev/react-bits/blob/main/src/content/TextAnimations/ShinyText/ShinyText.jsx
- Click Spark: https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/ClickSpark/ClickSpark.jsx

License: the same MIT + Commons Clause notice in `react-bits-LICENSE.txt`.
These are scoped Astro/GSAP adaptations of the source treatments rather than
React component mounts. GSAP SplitText retains nested emphasis and accessible
heading labels. Decrypted glyphs use hidden originals for stable text width.
Content entrance presets and a short text-only focus effect play once per load.
Skills selections replay a bounded title decode and row stagger. The shiny
contact text sweeps once, with no permanent animation loop. Click Spark's
radial dash geometry uses short Web Animations instead of a second canvas.
Reduced motion disables the effects; the server-rendered content stays visible.
