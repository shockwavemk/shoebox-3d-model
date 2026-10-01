#!/usr/bin/env python3
"""Generates laser-printable placeholder PNGs for every box panel (outside + inside).

Run: python3 scripts/generate-demo-textures.py [dpi]
Output: src/textures/<panel>-outside.png / <panel>-inside.png

Defaults to 600 dpi (standard laser printer resolution); pass e.g. 1200 for
higher-end laser printers. Each PNG carries the correct DPI metadata so it
prints at its exact real-world panel size (see README.md for the cm sizes).
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(SCRIPT_DIR, "..", "src", "textures")
CM_PER_INCH = 2.54
DPI = int(sys.argv[1]) if len(sys.argv) > 1 else 600  # laser printer resolution
PX_PER_CM = DPI / CM_PER_INCH

# name -> (width_cm, height_cm, outside_color, inside_color)
PANELS = {
    "bottom": (25, 22, "#8a5a3b", "#e8d9c3"),
    "front": (25, 12, "#3b7a8a", "#cfe9ef"),
    "back": (25, 12, "#3b5a8a", "#cfd9ef"),
    "left": (22, 12, "#7a8a3b", "#e2e9cf"),
    "right": (22, 12, "#8a3b6a", "#efcfe1"),
    "lid-top": (25, 22, "#c98a2e", "#f6e3c3"),
    "lid-front-flap": (11, 22, "#2e8a5a", "#cdeedb"),
    "lid-left-flap": (25, 9, "#8a2e2e", "#f0d0d0"),
    "lid-right-flap": (25, 9, "#2e5a8a", "#d0e0f0"),
}


def font(size):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", size)
    except OSError:
        return ImageFont.load_default()


def draw_panel(path, width_px, height_px, color, label_lines):
    img = Image.new("RGB", (width_px, height_px), color)
    draw = ImageDraw.Draw(img)

    border = max(2, width_px // 100)
    draw.rectangle([0, 0, width_px - 1, height_px - 1], outline="#00000055", width=border)

    text_color = "#ffffff" if _is_dark(color) else "#000000"
    size = max(12, min(width_px, height_px) // 10)
    f = font(size)

    total_h = sum(f.getbbox(line)[3] - f.getbbox(line)[1] for line in label_lines) + (len(label_lines) - 1) * 6
    y = (height_px - total_h) / 2
    for line in label_lines:
        bbox = f.getbbox(line)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = (width_px - w) / 2
        draw.text((x, y), line, fill=text_color, font=f)
        y += h + 6

    img.save(path, dpi=(DPI, DPI))


def _is_dark(hex_color):
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return luminance < 140


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Rendering at {DPI} dpi ({PX_PER_CM:.2f} px/cm)")
    for name, (w_cm, h_cm, outside_color, inside_color) in PANELS.items():
        w_px, h_px = round(w_cm * PX_PER_CM), round(h_cm * PX_PER_CM)

        draw_panel(
            os.path.join(OUT_DIR, f"{name}-outside.png"),
            w_px, h_px, outside_color,
            [name.upper(), "OUTSIDE", f"{w_cm} x {h_cm} cm"],
        )
        draw_panel(
            os.path.join(OUT_DIR, f"{name}-inside.png"),
            w_px, h_px, inside_color,
            [name.upper(), "INSIDE", f"{w_cm} x {h_cm} cm"],
        )
        print(f"wrote {name}-outside.png / {name}-inside.png ({w_px}x{h_px})")


if __name__ == "__main__":
    main()
