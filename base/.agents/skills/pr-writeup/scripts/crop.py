#!/usr/bin/env python3
"""Cut the region region.js measured out of a full-page screenshot.

Usage: python3 crop.py <full-page.png> <region.json> <out.png>

<region.json> holds region.js output. A driver that prints the result as a
quoted JSON string (agent-browser eval does) is handled too. Needs Pillow;
without it, prints the equivalent ImageMagick command and exits 2.
"""

import json
import sys


def read_region(path):
    with open(path) as handle:
        region = json.load(handle)
    # agent-browser prints eval results as JSON, so a returned JSON string
    # arrives encoded twice.
    if isinstance(region, str):
        region = json.loads(region)
    scale = float(region.get("dpr", 1))
    return tuple(round(region[key] * scale) for key in ("left", "top", "right", "bottom"))


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)

    source, region_path, target = sys.argv[1:]
    left, top, right, bottom = read_region(region_path)

    try:
        from PIL import Image
    except ImportError:
        print(
            "Pillow is missing (pip install pillow). ImageMagick equivalent:\n"
            f"  magick {source} -crop {right - left}x{bottom - top}+{left}+{top} +repage {target}",
            file=sys.stderr,
        )
        sys.exit(2)

    with Image.open(source) as image:
        box = (left, top, min(right, image.width), min(bottom, image.height))
        image.crop(box).save(target)
        print(f"{target}: {box[2] - box[0]}x{box[3] - box[1]}")


if __name__ == "__main__":
    main()
