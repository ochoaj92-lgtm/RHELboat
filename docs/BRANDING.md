# RHELboat visual identity

RHELboat uses a geometric sailboat with a terminal prompt in its hull. The mark connects the project's name with hands-on Linux practice. It contains no Red Hat logo, official hat, or Linux mascot.

| Color           | Value     | Use                                   |
| --------------- | --------- | ------------------------------------- |
| Charcoal        | `#101820` | Canvas and application surfaces       |
| Warm ivory      | `#f6f3ed` | Sails, primary text, lesson panels    |
| Signal red      | `#e53635` | Hull, secondary sail, primary actions |
| Restrained teal | `#7ed4bb` | Terminal cursor and verified state    |

## Sources and exports

- [Canonical application icon](../icons/rhelboat.svg): vector source for all square icon exports.
- [Repository banner](assets/rhelboat-banner.svg): wordmark, tagline, and illustrative lesson/shell split.
- [Installer header](../icons/installer-header.svg) and [sidebar](../icons/installer-sidebar.svg): original vector artwork for installer exports.
- `icons/png/`: Linux icons from 16 to 1024 pixels.
- `icons/rhelboat.ico`: Windows and favicon sizes, 16 to 256 pixels.
- `icons/rhelboat.icns`: macOS icon container.
- `src/renderer/public/img/rhelboat.svg` and `rhelboat.png`: app and browser assets.
- `docs/assets/social-preview.png`: 1280 × 640 repository social image.
- `icons/installer-header.bmp` and `installer-sidebar.bmp`: 150 × 57 and 164 × 314 installer artwork.

The banner and installer compositions embed their mark paths so the SVGs remain standalone. When changing the mark, update those compositions too. Keep the SVG sources and exported files together in a change.

## Regenerate

Install system `rsvg-convert` (librsvg) and Python Pillow, then run:

```sh
python3 scripts/brand-assets.py
```

The script exports from the checked-in SVG sources and verifies output formats, dimensions, icon sizes, and transparent corners. It uses local tools and makes no network requests. Installers and app bundles consume these checked-in exports; asset generation is not required for a normal build.

Use the full mark on an uncluttered background. Keep its colors and proportions intact. The wordmark is **RHELboat**, with uppercase RHEL and lowercase boat. Describe the project as an **independent Enterprise Linux training lab**, and retain the Red Hat non-affiliation notice in project materials.
