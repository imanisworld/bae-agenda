# Logo Video Update

Small workbench for updating the existing DJ B.A.E. rotating logo video without rebuilding it in 3D.

## Current pass

1. Remove the stray floating dot below the logo.
2. Recolor the existing render to the live site's palette:
   - burgundy `#8f2d3c`
   - gold `#c4a574`
   - amber `#c4844a`
3. Preserve the original rotation, lighting, reflections, chrome, and text.
4. Review the result before attempting any shape changes or photo compositing.

## Run

```bash
cd tools/logo-video
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python scripts/update_logo.py \
  input/original.mp4 \
  output/logo-brand-pass.mp4
```

FFmpeg must be installed and available on `PATH`.

The input, preview, mask, and output folders are intentionally ignored by Git. Keep the source video local; only the repeatable editing code belongs in the repository.

## Scope

Do not add SAM2, Blender, or other heavy tooling unless this simple pass proves insufficient. The goal is to finish the logo, not build a video-processing platform.
