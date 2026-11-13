# ACE Logo Assets

Original uploads are preserved in `public/logos/Ace Logo.png` and
`public/logos/Ace Icon.png`. They have an opaque white/gray checkerboard, not
an alpha channel. The built-in image-generation editor extracted transparent
versions for use on the dark site. These are edited copies, not new branding.

Final assets:

- `public/logos/ace-logo-transparent.webp`: shared navbar, boot and footer logo,
  resized to 640 x 320 and encoded as WebP with alpha.
- `public/logos/ace-icon-transparent.png`: browser icon, resized to 128 x 128
  with alpha.

Only resizing and encoding used Sharp. Background extraction used the built-in
image-generation tool, with genuine transparency requested. Originals were
not overwritten.

## Logo Prompt

Use case: background-extraction. Edit target: the supplied ACE logo. Remove ONLY
the baked white/gray checkerboard around the logo and from negative spaces.
Keep the exact metallic carbon-fiber black/silver spade-A symbol, neon green
accents, and exact ACE wordmark with original geometry, bevels, proportions,
colors, and textures. Do not redesign or add anything. Output the full wide
lockup centered with a small transparent margin, genuine alpha transparency,
no checkerboard, no background.

## Icon Prompt

Use case: background-extraction. Edit target supplied ACE icon. Remove ONLY the
baked white/gray checkerboard background including negative spaces. Preserve
exact carbon-fiber black/silver spade A symbol, metallic bevels, silver blade
and neon green accents, original geometry and identity. Do not redesign. Output
the isolated full icon centered on genuine alpha transparency, small transparent
margin, no checkerboard or background.
