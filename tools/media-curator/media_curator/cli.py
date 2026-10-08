import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

from .catalog import load
from .pipeline import scan


def main(argv=None):
    parser = argparse.ArgumentParser(description="Local-only media review; never alters originals.")
    commands = parser.add_subparsers(dest="command", required=True)
    command = commands.add_parser("scan", help="Recursively inspect a stable media inbox.")
    command.add_argument("source", type=Path)
    command.add_argument("--output", type=Path, help="Fresh directory outside source (must not exist).")
    catalog = command.add_mutually_exclusive_group()
    catalog.add_argument("--events", type=Path, help="Local JSON array of current event records.")
    catalog.add_argument("--supabase", action="store_true", help="Explicit read-only public event lookup.")
    command.add_argument("--window-hours", type=float, default=6, help="Assumed event length (default: 6).")
    args = parser.parse_args(argv)
    if not 0.1 <= args.window_hours <= 48:
        parser.error("--window-hours must be between 0.1 and 48.")
    output = args.output or Path(".media-curator") / datetime.now(timezone.utc).strftime(
        "run-%Y%m%dT%H%M%S%fZ"
    )
    try:
        events = load(args.events, args.supabase)
        if not events:
            print(
                "No events loaded: media will be UNMATCHED. Supply --events or --supabase.", file=sys.stderr
            )
        result = scan(args.source, output, events, args.window_hours)
    except (ValueError, OSError) as exc:
        print(f"media-curator: {exc}", file=sys.stderr)
        return 1
    print(
        f"Reviewed {len(result['files'])} files; ignored {len(result['ignored'])}. "
        f"Report: {output.resolve() / 'index.html'}"
    )
    return 0
