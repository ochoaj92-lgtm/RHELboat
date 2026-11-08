#!/usr/bin/env python3
"""Export RHELboat's SVG sources using system librsvg and Pillow; no network access."""

from io import BytesIO
from pathlib import Path
from shutil import copyfile, which
from subprocess import run

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SIZES = (16, 24, 32, 48, 64, 128, 256, 512, 1024)
ICON = ROOT / "icons/rhelboat.svg"
PUBLIC = ROOT / "src/renderer/public"


def render(source: Path, width: int, height: int) -> Image.Image:
    result = run(
        ["rsvg-convert", "--width", str(width), "--height", str(height), str(source)],
        check=True,
        capture_output=True,
    )
    return Image.open(BytesIO(result.stdout)).convert("RGBA")


def verify(path: Path, size: tuple[int, int], expected_format: str) -> None:
    with Image.open(path) as image:
        assert image.size == size, f"Wrong dimensions: {path}"
        assert image.format == expected_format, f"Wrong format: {path}"
        image.load()


def main() -> None:
    assert which("rsvg-convert"), "Install librsvg's rsvg-convert before exporting brand assets."
    (ROOT / "icons/png").mkdir(parents=True, exist_ok=True)
    (PUBLIC / "img").mkdir(parents=True, exist_ok=True)
    icon = render(ICON, 1024, 1024)
    for size in SIZES:
        target = ROOT / f"icons/png/{size}.png"
        icon.resize((size, size), Image.Resampling.LANCZOS).save(target, optimize=True)
        verify(target, (size, size), "PNG")

    copyfile(ICON, PUBLIC / "img/rhelboat.svg")
    copyfile(ROOT / "icons/png/512.png", PUBLIC / "img/rhelboat.png")
    icon.save(ROOT / "icons/rhelboat.ico", sizes=[(size, size) for size in SIZES if size <= 256])
    icon.save(ROOT / "icons/rhelboat.icns", sizes=[(size, size) for size in SIZES if size >= 32])
    copyfile(ROOT / "icons/rhelboat.ico", PUBLIC / "favicon.ico")
    verify(ROOT / "icons/rhelboat.ico", (256, 256), "ICO")
    verify(ROOT / "icons/rhelboat.icns", (1024, 1024), "ICNS")
    with Image.open(ROOT / "icons/rhelboat.ico") as ico:
        assert ico.ico.sizes() == {(size, size) for size in SIZES if size <= 256}
    assert icon.getpixel((0, 0))[3] == 0, "The icon's rounded corners must stay transparent."

    for name, dimensions in (("header", (150, 57)), ("sidebar", (164, 314))):
        target = ROOT / f"icons/installer-{name}.bmp"
        render(ROOT / f"icons/installer-{name}.svg", *dimensions).convert("RGB").save(target)
        verify(target, dimensions, "BMP")

    banner = render(ROOT / "docs/assets/rhelboat-banner.svg", 1280, 400)
    banner.save(ROOT / "docs/assets/rhelboat-banner.png", optimize=True)
    social = Image.new("RGB", (1280, 640), "#101820")
    social.paste(banner, (0, 120), banner)
    social.save(ROOT / "docs/assets/social-preview.png", optimize=True)
    verify(ROOT / "docs/assets/rhelboat-banner.png", (1280, 400), "PNG")
    verify(ROOT / "docs/assets/social-preview.png", (1280, 640), "PNG")
    print("Exported and verified RHELboat icons, installer artwork, banner, and social preview.")


if __name__ == "__main__":
    main()
