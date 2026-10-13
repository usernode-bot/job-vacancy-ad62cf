# App icon

A flat white briefcase with a small blue globe (`#1E5EFF`, white meridian,
equator and axis lines) in its centre, on a diagonal gradient from dark blue
`#0A2A6B` (top left) to light blue `#4DB4FF` (bottom right). No text.

- `brand/icon.svg` / `brand/icon.png`: square, full bleed, 512 x 512. The
  Homeroom home-screen tile (`dapp.json` `icon`), which rounds it itself.
- `public/logo.svg`: the same artwork as a rounded square (corner radius 112),
  used for the favicon, the manifest and the header logo (inline in
  `public/index.html` as `LOGO_PATHS`).
- `public/icons/*.png`: PNG exports of `public/logo.svg` at 512, 192, 180
  (apple-touch-icon), 32 and 16 px. Re-render all of them after editing it.
