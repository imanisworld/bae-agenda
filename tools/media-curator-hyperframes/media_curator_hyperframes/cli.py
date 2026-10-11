import argparse
import json
import subprocess
import sys
from pathlib import Path

from .bridge import list_candidates, scaffold


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Isolated experiment: scaffold HyperFrames promos from approved curator highlights."
    )
    commands = parser.add_subparsers(dest="command", required=True)

    candidates = commands.add_parser("candidates", help="List videos with approved highlight ranges.")
    candidates.add_argument("manifest", type=Path)
    candidates.add_argument("--workspace", type=Path)

    command = commands.add_parser(
        "scaffold",
        help="Create a fresh HyperFrames project from one approved highlight (does not modify originals).",
    )
    command.add_argument("manifest", type=Path)
    command.add_argument("--output", type=Path, required=True)
    command.add_argument("--workspace", type=Path)
    command.add_argument("--content-id", help="64-char SHA-256; default picks the best promo candidate.")
    command.add_argument("--highlight-index", type=int, default=0)
    command.add_argument("--aspect", choices=("9:16", "16:9"), default="9:16")
    command.add_argument(
        "--render",
        action="store_true",
        help="After scaffolding, run local HyperFrames check+render (requires Node 22+ and ffmpeg).",
    )

    args = parser.parse_args(argv)
    try:
        if args.command == "candidates":
            rows = list_candidates(args.manifest, args.workspace)
            print(json.dumps(rows, indent=2))
            return 0
        provenance = scaffold(
            manifest_path=args.manifest,
            output=args.output,
            workspace=args.workspace,
            content_id=args.content_id,
            highlight_index=args.highlight_index,
            aspect=args.aspect,
        )
        print(json.dumps(provenance, indent=2))
        if args.render:
            output = args.output.expanduser().resolve()
            for step in ("check", "render"):
                subprocess.run(
                    ["npx", "--yes", "hyperframes@0.8.147", step]
                    + (["--output", "renders/promo.mp4"] if step == "render" else []),
                    cwd=output,
                    check=True,
                )
            print(f"Rendered: {output / 'renders' / 'promo.mp4'}", file=sys.stderr)
    except (ValueError, OSError, subprocess.CalledProcessError) as exc:
        print(f"media-curator-hyperframes: {exc}", file=sys.stderr)
        return 1
    return 0
