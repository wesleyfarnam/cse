from PIL import Image, ImageDraw

# Demo Kickboxing Federation placeholder brand: red roundel + DKF monogram
for size, name in [(512, "dkf_logo.png"), (64, "dkf_favicon.png")]:
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
    img.save(f"/home/frappe/cse-scripts/{name}")
print("logos written")
