"""Generates PausePoint's toolbar/store icons: a blue circle with a pause glyph.
Run with: python icons/generate_icons.py
"""
from PIL import Image, ImageDraw

SIZES = [16, 32, 48, 128]
BG = (47, 95, 143, 255)     # #2f5f8f, matches the panel accent color
BAR = (232, 232, 232, 255)  # #e8e8e8, matches the panel text color

for size in SIZES:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((0, 0, size - 1, size - 1), fill=BG)

    bar_w = max(1, round(size * 0.14))
    bar_h = round(size * 0.42)
    gap = max(1, round(size * 0.12))
    cx, cy = size / 2, size / 2
    x1 = cx - gap / 2 - bar_w
    x2 = cx + gap / 2
    y = cy - bar_h / 2
    radius = max(1, round(bar_w * 0.3))

    draw.rounded_rectangle((x1, y, x1 + bar_w, y + bar_h), radius=radius, fill=BAR)
    draw.rounded_rectangle((x2, y, x2 + bar_w, y + bar_h), radius=radius, fill=BAR)

    img.save(f'icons/icon{size}.png')
    print(f'wrote icons/icon{size}.png')
