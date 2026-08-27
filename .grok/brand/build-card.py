#!/usr/bin/env python3
"""Compose the KREIA Studio 1200×630 share card from the cinematic plate + exact mark."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path("/workspace")
ATMOS = ROOT / "artifacts/imagine_images/3c2ac613-d989-4c06-aad2-e9c45752dbbd.jpg"
MEDALLION = ROOT / ".grok/brand/medallion.png"
CORMORANT = ROOT / ".grok/brand/fonts/CormorantGaramond-Medium.ttf"
OUTFIT = ROOT / ".grok/brand/fonts/Outfit-Variable.ttf"
OUT_2X = ROOT / ".grok/brand/og-2x.png"
OUT_PREVIEW = ROOT / ".grok/brand/og-preview.png"

W, H = 1200, 630
SCALE = 2
CW, CH = W * SCALE, H * SCALE

OFFWHITE = (245, 245, 242, 255)
COBALT = (24, 35, 61, 255)
CHAMPAGNE = (201, 169, 110, 255)
MUTED = (245, 245, 242, 176)
BLACK = (11, 13, 16, 255)


def cover_crop(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    tw, th = size
    scale = max(tw / im.width, th / im.height)
    nw, nh = int(round(im.width * scale)), int(round(im.height * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))


def font(path: Path, size: int, variation: str) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(path), size)
    f.set_variation_by_name(variation)
    return f


def draw_tracked(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[float, float],
    fnt: ImageFont.FreeTypeFont,
    fill,
    tracking: float,
) -> None:
    x, y = xy
    for i, ch in enumerate(text):
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += fnt.getlength(ch) + (tracking if i < len(text) - 1 else 0)


def tracked_width(text: str, fnt: ImageFont.FreeTypeFont, tracking: float) -> float:
    if not text:
        return 0.0
    return sum(fnt.getlength(ch) for ch in text) + tracking * (len(text) - 1)


def main() -> None:
    bg = cover_crop(Image.open(ATMOS).convert("RGBA"), (CW, CH))

    # Deepen toward brand black; keep the graphite panel visible.
    wash = Image.new("RGBA", (CW, CH), (11, 13, 16, 64))
    canvas = Image.alpha_composite(bg, wash)

    # Replace the generated warm outer margin with brand black + a cobalt hairline.
    inset = 56  # 28px at 1x — comfortable, survives the 3% 16:9 crop
    margin = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    md = ImageDraw.Draw(margin)
    md.rectangle((0, 0, CW, CH), outline=BLACK, width=inset)
    canvas = Image.alpha_composite(canvas, margin)
    fd = ImageDraw.Draw(canvas)
    fd.rectangle((inset, inset, CW - inset - 1, CH - inset - 1), outline=COBALT, width=3)

    medal = Image.open(MEDALLION).convert("RGBA")
    medal_d = 600
    medal = medal.resize((medal_d, medal_d), Image.Resampling.LANCZOS)

    kreia_f = font(CORMORANT, 210, "Medium")
    studio_f = font(OUTFIT, 34, "Medium")
    tag_f = font(OUTFIT, 28, "Regular")

    kreia = "KREIA"
    studio = "STUDIO"
    tag = "Studio créatif audiovisuel"
    studio_tracking = 16

    kreia_w = kreia_f.getlength(kreia)
    studio_w = tracked_width(studio, studio_f, studio_tracking)
    tag_w = tag_f.getlength(tag)
    text_w = max(kreia_w, studio_w, tag_w)

    gap = 80
    group_w = medal_d + gap + text_w
    gx = int((CW - group_w) / 2)
    gy = int((CH - medal_d) / 2) - 6

    shadow = Image.new("RGBA", (medal_d + 48, medal_d + 48), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((10, 16, medal_d + 22, medal_d + 32), fill=(0, 0, 0, 160))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    canvas.alpha_composite(shadow, (gx - 14, gy - 6))
    canvas.alpha_composite(medal, (gx, gy))

    tx = gx + medal_d + gap
    kreia_bbox = kreia_f.getbbox(kreia)
    kreia_h = kreia_bbox[3] - kreia_bbox[1]
    studio_h = studio_f.getbbox(studio)[3] - studio_f.getbbox(studio)[1]
    tag_h = tag_f.getbbox(tag)[3] - tag_f.getbbox(tag)[1]
    stack_h = kreia_h + 20 + studio_h + 26 + tag_h
    ty = gy + int((medal_d - stack_h) / 2) - kreia_bbox[1]

    overlay = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.text((tx, ty), kreia, font=kreia_f, fill=OFFWHITE)

    studio_y = ty + kreia_h + 24
    rule_y = studio_y - 10
    d.rectangle((tx, rule_y, tx + min(kreia_w, 280), rule_y + 2), fill=(*CHAMPAGNE[:3], 170))

    draw_tracked(d, studio, (tx, studio_y), studio_f, CHAMPAGNE, studio_tracking)

    tag_y = studio_y + studio_h + 26
    d.text((tx, tag_y), tag, font=tag_f, fill=MUTED)

    canvas = Image.alpha_composite(canvas, overlay)
    canvas.save(OUT_2X, "PNG")
    one_x = canvas.resize((W, H), Image.Resampling.LANCZOS).convert("RGB")
    one_x.save(OUT_PREVIEW, "PNG")
    print("wrote", OUT_PREVIEW, one_x.size, "group_w", round(group_w), "gx,gy", gx, gy)
    # margin check
    print("left margin", gx, "right", CW - (gx + group_w), "top", gy, "bottom", CH - (gy + medal_d))


if __name__ == "__main__":
    main()
