#!/usr/bin/env python3
"""Cut a clean gold-disc medallion from the source mark (no white fringe)."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = Path("/workspace/attachments/Logo_avec_cercle_doré_202608241747.jpeg")
OUT = Path("/workspace/.grok/brand/medallion.png")
GOLD = np.array([201, 169, 110], dtype=np.float32)  # #C9A96E


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    arr = np.array(im).astype(np.float32)
    h, w, _ = arr.shape

    # Non-white = the disc (source sits on a white field).
    lum = arr.mean(axis=2)
    disc = lum < 242
    ys, xs = np.where(disc)
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    cx = (x0 + x1) / 2.0
    cy = (y0 + y1) / 2.0
    radius = min(x1 - x0, y1 - y0) / 2.0 - 1.5

    yy, xx = np.mgrid[0:h, 0:w]
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    # Anti-aliased circular alpha; shrink a hair so white JPEG fringe dies.
    aa = 1.6
    alpha = np.clip((radius - dist) / aa, 0, 1)

    rgb = arr.copy()
    # Push pale rim toward champagne so the disc reads gold on black, not white.
    pale = (rgb.max(axis=2) > 210) & (alpha > 0)
    t = np.clip((rgb.max(axis=2) - 180) / 75.0, 0, 1)
    for c in range(3):
        rgb[:, :, c] = np.where(pale, rgb[:, :, c] * (1 - 0.55 * t) + GOLD[c] * 0.55 * t, rgb[:, :, c])

    # Lift the botanical K slightly toward forest green so it doesn't read brown-black.
    dark = (lum < 90) & (alpha > 0.5)
    forest = np.array([30, 58, 42], dtype=np.float32)
    for c in range(3):
        rgb[:, :, c] = np.where(dark, rgb[:, :, c] * 0.55 + forest[c] * 0.45, rgb[:, :, c])

    rgba = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)])
    out = Image.fromarray(rgba, "RGBA")

    pad = int(np.ceil(radius)) + 4
    canvas_s = pad * 2
    square = Image.new("RGBA", (canvas_s, canvas_s), (0, 0, 0, 0))
    # Gold backing disc so residual fringe can't go white.
    backing = Image.new("RGBA", (canvas_s, canvas_s), (0, 0, 0, 0))
    d = ImageDraw.Draw(backing)
    m = 3
    d.ellipse((m, m, canvas_s - 1 - m, canvas_s - 1 - m), fill=(201, 169, 110, 255))
    square = Image.alpha_composite(square, backing)

    pasted = Image.new("RGBA", (canvas_s, canvas_s), (0, 0, 0, 0))
    px = int(round(pad - cx))
    py = int(round(pad - cy))
    pasted.paste(out, (px, py))
    square = Image.alpha_composite(square, pasted)

    # Re-apply a crisp circular mask.
    mask = Image.new("L", (canvas_s, canvas_s), 0)
    ImageDraw.Draw(mask).ellipse((m, m, canvas_s - 1 - m, canvas_s - 1 - m), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(0.6))
    r, g, b, a = square.split()
    a = ImageChops_multiply(a, mask)
    square.putalpha(a)

    square.save(OUT)
    print("saved", OUT, square.size, "radius", radius, "center", cx, cy)


def ImageChops_multiply(a: Image.Image, b: Image.Image) -> Image.Image:
    from PIL import ImageChops

    return ImageChops.multiply(a, b)


if __name__ == "__main__":
    main()
