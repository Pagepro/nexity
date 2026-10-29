#!/usr/bin/env python3
"""Put a before and an after screenshot side by side in one labelled image.

Usage: python3 compose.py <before.png> <after.png> <out.png>
           [--before-label "BEFORE (main)"] [--after-label "AFTER (preview)"]

Each shot sits on a light grey board under its label: before in red on the
left, after in green on the right. Put the source and the measured values in
the label, e.g. "BEFORE (main) · pretitle 3.69:1 (fail)". The after shot is
scaled to the before shot's width if they differ, and the shorter one is
top-aligned. Needs Pillow; without it, prints an ImageMagick command (no
labels) and exits 2.
"""

import argparse
import sys

BOARD = (230, 230, 230)
RED = (205, 38, 38)
GREEN = (22, 140, 60)
FONTS = (
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "C:/Windows/Fonts/arial.ttf",
)


def load_font(size):
    from PIL import ImageFont

    for path in FONTS:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size)  # Pillow 10.1+
    except TypeError:
        return ImageFont.load_default()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("before")
    parser.add_argument("after")
    parser.add_argument("out")
    parser.add_argument("--before-label", default="BEFORE")
    parser.add_argument("--after-label", default="AFTER")
    args = parser.parse_args()

    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print(
            "Pillow is missing (pip install pillow). ImageMagick equivalent, without labels:\n"
            f"  magick {args.before} {args.after} -background '#e6e6e6' -splice 24x24 +append "
            f"-gravity southeast -splice 24x24 {args.out}",
            file=sys.stderr,
        )
        sys.exit(2)

    before = Image.open(args.before).convert("RGB")
    after = Image.open(args.after).convert("RGB")
    if after.width != before.width:
        height = round(after.height * before.width / after.width)
        after = after.resize((before.width, height), Image.LANCZOS)

    # Sizes follow the shot width, so labels read the same at 1x and 2x once
    # GitHub scales the board down to the column width.
    width = before.width
    pad = max(12, width // 50)
    font = load_font(max(12, width // 40))
    ascent, descent = font.getmetrics()
    label_height = ascent + descent + pad // 2

    shot_top = pad + label_height
    board = Image.new(
        "RGB",
        (2 * width + 3 * pad, shot_top + max(before.height, after.height) + pad),
        BOARD,
    )
    draw = ImageDraw.Draw(board)
    for index, (shot, label, color) in enumerate(
        ((before, args.before_label, RED), (after, args.after_label, GREEN))
    ):
        left = pad + index * (width + pad)
        draw.text((left, pad), label, font=font, fill=color)
        board.paste(shot, (left, shot_top))

    board.save(args.out)
    print(f"{args.out}: {board.width}x{board.height}")


if __name__ == "__main__":
    main()
