import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

from .catalog import load
from .pipeline import scan
from .server import serve


def main(argv=None):
    parser = argparse.ArgumentParser(description="Local-only media review; never alters originals.")
    commands = parser.add_subparsers(dest="command", required=True)
    command = commands.add_parser("scan", help="Incremental read-only media analysis into a new report.")
    command.add_argument("source", type=Path)
    command.add_argument("--output", type=Path, help="Fresh report directory outside source.")
    command.add_argument(
        "--workspace",
        type=Path,
        default=Path(".media-curator"),
        help="Persistent local state/cache root (default: .media-curator).",
    )
    catalog = command.add_mutually_exclusive_group()
    catalog.add_argument("--events", type=Path, help="Local JSON array of existing event records.")
    catalog.add_argument("--supabase", action="store_true", help="Explicit read-only public event lookup.")
    command.add_argument("--window-hours", type=float, default=6)
    review = commands.add_parser("review", help="Foreground local review UI; saves only human decisions.")
    review.add_argument("manifest", type=Path)
    review.add_argument("--workspace", type=Path, help="State/cache root; defaults to manifest workspace.")
    review.add_argument("--port", type=int, default=0, help="Loopback port; 0 chooses a free port.")
    args = parser.parse_args(argv)
    try:
        if args.command == "review":
            if not 0 <= args.port <= 65535:
                parser.error("--port must be between 0 and 65535.")
            serve(args.manifest, args.workspace, args.port)
            return 0
        if not 0.1 <= args.window_hours <= 48:
            parser.error("--window-hours must be between 0.1 and 48.")
        output = args.output or args.workspace / "runs" / datetime.now(timezone.utc).strftime(
            "run-%Y%m%dT%H%M%S%fZ"
        )
        events = load(args.events, args.supabase)
        if not events:
            print(
                "No events loaded: automatic matches will be UNMATCHED. Supply --events or --supabase.",
                file=sys.stderr,
            )
        result = scan(args.source, output, events, args.window_hours, args.workspace)
    except (ValueError, OSError) as exc:
        print(f"media-curator: {exc}", file=sys.stderr)
        return 1
    counts = result["counts"]
    print(
        f"Scanned {counts['discovered']} files: {counts['newly_analyzed']} newly analyzed, "
        f"{counts['reused']} reused, {counts['changed']} changed at a known path, "
        f"{counts['ignored']} ignored, {counts['needing_review']} need review.\n"
        f"Report: {output.resolve() / 'index.html'}\n"
        f'Review: media-curator review "{output.resolve() / "manifest.json"}"'
    )
    return 0
