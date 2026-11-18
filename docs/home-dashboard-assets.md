# Home Dashboard

The homepage uses two original H2R-inspired image frames created with the
built-in image-generation tool. Kawasaki's [H2R technical highlights video](https://www.dailymotion.com/video/x3tny2w)
and [instrument-panel overview](https://kawasakikorea.com/ninjah2r) informed the
direction. No third-party footage or video frames are shipped.

- Dark: `public/assets/motorcycle/h2r/home-dashboard-off.webp` (164,974 bytes).
- Lit: `public/assets/motorcycle/h2r/home-dashboard-on.webp` (143,630 bytes).

Both are 1440 x 900 WebP assets encoded with Sharp from the generated alpha
PNGs. The original About cockpit image was a materials reference for the dark
frame. The dark frame was the edit target for the lit frame.

The dark frame is the static fallback. The CSS loop starts after a 900 ms
delay once startup is over and the lit image has decoded. Every five seconds,
the instruments glitch on, hold fully lit for two seconds, and glitch off.
The loop only runs on Home. Reduced motion, missing art, and no JavaScript
leave the dark frame in place. The startup overlay and other section views are
unchanged.

## Generation Prompts

**Dark frame:**

Create a cinematic photorealistic raster cutout for the right side of a dark racing portfolio homepage. Subject: a tight rider's-eye cockpit close-up of a Kawasaki Ninja H2R-inspired motorcycle, with the actual-looking instrument cluster as the primary subject. Use the reference image ONLY for the black carbon-fiber race bike materials; make a completely different and much tighter macro crop, from just behind the triple clamp with a shallow three-quarter tilt. Show the angular black dashboard housing with a prominent round analog tachometer on the right and polygonal digital LCD on the left, under a tinted windscreen. The LCD must be POWERED OFF, blank smoky charcoal glass with faint reflections, no lit characters, and the analog dial unlit with subdued etched markings and its needle resting at zero. Place the cluster around the center of the composition, approximately 50% of image width and 42% of image height, occupying most of the upper-middle half. Show only enough carbon-fiber fairing, top yoke hardware and handlebar base beneath it to identify the cockpit. No tank filling the frame, no full motorcycle, no rider, no hands, no floor or scenery. Low-key night studio lighting, beautiful sculpted black carbon weave, brushed silver chamfers, a narrow muted Kawasaki-lime rim light. Clear enough to read the shape on an already dark green-black website; do not crush all shadows. No cyan, color fringing, bloom, mist, typography overlays, added logos, watermark, lens flare or exaggerated sci-fi UI. The photo should feel like a held frame from a moody motorcycle edit. Wide landscape 8:5 framing, enough room around the instrument panel so it survives both a desktop and a mobile crop. Preserve genuine alpha transparency around the exterior contours so it can blend with the existing shader; no studio background or baked checkerboard.

**Lit frame:**

Precisely edit the supplied original dark H2R-inspired cockpit raster to create the exact same frame with the instruments briefly powered on. This is an animation frame swap and pixel registration is crucial. Same canvas, exact same crop, camera angle, position of all objects, outer silhouette, alpha transparency, windscreen, carbon fiber, reservoirs, screws, trim and shadows. Do not redraw, move or brighten the rest of the bike. Change ONLY inside the LCD glass on the left and inside the round analog dial on the right. The existing blank left instrument panel turns on with crisp soft off-white segmented 0, small km/h, muted lime green neutral N, and a few discreet horizontal marks fitted to the same angled glass. Black LCD substrate stays dark. The existing right tachometer numbers and tick marks pick up a soft pale-green-white backlight, a subtle lime indicator at the edge and the needle picks up a restrained red highlight, retaining its original position. High-end realistic motorcycle electronics rather than sci-fi HUD. Bright enough to register during a brief glitch but not glaring. No glow beyond the original glass, no new objects, no graphics, no logos, no off-frame flare. Preserve genuine original transparency. Keep all other image pixels as close to the original as possible.
