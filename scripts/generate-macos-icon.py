from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "resources" / "app-logo-source.png"
OUTPUT = ROOT / "resources" / "app-icon-1024.png"

CANVAS_SIZE = 1024
ARTWORK_SIZE = 824
INSET = (CANVAS_SIZE - ARTWORK_SIZE) // 2


source = Image.open(SOURCE).convert("RGBA")
artwork = source.resize((ARTWORK_SIZE, ARTWORK_SIZE), Image.Resampling.LANCZOS)
canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
canvas.alpha_composite(artwork, (INSET, INSET))
canvas.save(OUTPUT, optimize=True)

print(f"Generated {OUTPUT} with {INSET}px transparent safe area")
