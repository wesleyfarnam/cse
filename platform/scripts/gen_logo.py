import os
from PIL import Image, ImageDraw

OUT = "/home/frappe/cse-scripts"
SRC = f"{OUT}/cse-logo.png"  # real brand logo, copied from repo assets/ by provision-vps.sh

if os.path.exists(SRC):
    # Use the real USA Kickboxing / CSE logo: downscale for web, derive favicon.
    src = Image.open(SRC).convert("RGBA")
    for size, name in [(512, "brand_logo.png"), (64, "brand_favicon.png")]:
        img = src.copy()
        img.thumbnail((size, size), Image.LANCZOS)
        img.save(f"{OUT}/{name}")
    print("logos written (CSE brand)")
else:
    # Fallback placeholder brand: red roundel + DKF monogram
    for size, name in [(512, "brand_logo.png"), (64, "brand_favicon.png")]:
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        m = size // 16
        d.ellipse([m, m, size - m, size - m], fill=(196, 30, 58, 255))  # crimson
        d.ellipse([m * 3, m * 3, size - m * 3, size - m * 3], outline=(255, 255, 255, 255), width=max(2, size // 32))
        try:
            from PIL import ImageFont
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size // 3)
        except Exception:
            font = None
        text = "DKF"
        bbox = d.textbbox((0, 0), text, font=font)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]), text, fill=(255, 255, 255, 255), font=font)
        img.save(f"{OUT}/{name}")
    print("logos written (placeholder)")
