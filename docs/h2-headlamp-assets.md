# H2 Ignition Headlamp

Historical asset, superseded by `docs/supercharger-ignition-assets.md`.
The headlamp artwork is no longer referenced by the startup screen.

Final asset: `public/assets/motorcycle/h2r/boot-h2-headlight.webp`.
The existing motorcycle asset directory is retained; this particular artwork
depicts an H2-inspired street front cowl, not an H2R headlight retrofit.
It is used only by the opening screen. Existing H2R portfolio backgrounds
remain unchanged.

The built-in image-generation tool created an original straight-on illustration
using an official H2 front-cowl photo as a design reference. It is not an
official Kawasaki photograph and does not imply affiliation. The downloaded
reference remains in ignored local QA storage, not in the public website.

References:

- https://www.kawasaki.com/en-us/motorcycle/ninja/hypersport/Ninja-H2
- https://www.kawasaki-motors.cn/ContentStorage/KMSH/ProductTopFeature/88/89cdb69a-2813-4fb6-9a95-2a14192fc126.jpg

The generated alpha PNG was resized and encoded with Sharp, preserving
transparency: 1200 x 800 WebP, 116,962 bytes. No pixel-based background removal
or lighting edits were applied with Sharp.

## Animation

A faint cowl appears behind the logo during charge-up. The small position
lights illuminate first; the central white headlamp turns on at 3.05 seconds,
synchronized with the metallic logo sweep. CSS clipping reuses the same image
for the lamp and position-light layers, keeping them exactly registered.
Localized drop shadows and a brief horizontal streak provide the lamp bloom.
The loading line fades before the headlamp reaches full brightness.

The cowl and lights fade out by 4.3 seconds, before the homepage curtain lifts
at 4.45 seconds. The existing six-second intro and navbar docking coordinates
are unchanged. No audio, video, additional canvas or live 3D engine is added.
An image-load error hides the decorative cowl without delaying the intro.

## Generation Prompt

Use case: product-mockup, new camera-angle illustration from reference. Asset
type: transparent cinematic website ignition backdrop. Reference image: use
ONLY as the design/lighting reference for a street Kawasaki Ninja H2 front
cowl and its actual SINGLE CENTRAL COMPACT LED HEADLAMP. Create a NEW
photorealistic perfectly straight-on, symmetric front portrait of the H2 upper
face, not a side angle and not an H2R. Show the dark tinted windscreen,
sculpted mirror-silver/black upper fairing, fine Kawasaki-green pinstriping,
side intake openings and mirror stalks, and the authentic SINGLE central
bright white LED projector in its angular hexagonal housing low on the cowl,
plus the small sharp white fang-shaped position lights lower to its left and
right. Not two big side headlights. Frame ONLY the upper bike face, no front
wheel, tire, rider, ground or full motorcycle. Composition: landscape 3:2
canvas with a centered complete cowl and a generous transparent margin.
Headlamp source centered horizontally near 62% of image height, upper
windscreen near 13%, lower fairing ends near 85%. Cinematic black/silver/green
materials with restrained silver rim highlights so bodywork remains readable
on a black webpage. The lamps are on, neutral WHITE, with visible
lens/reflector detail. Keep their light localized: no bloom, beam, fog or lens
flare outside the silhouette, as the website will animate the light itself.
Genuine alpha transparency around the entire cutout, no studio backdrop,
black rectangle, fake checkerboard, text, logos or watermarks. Preserve
realistic H2 street headlight styling from reference. This is an original
editorial product illustration, not an official brand photo.
