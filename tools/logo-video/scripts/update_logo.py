#!/usr/bin/env python3
"""Update the existing DJ B.A.E. rotating logo video.

Current pass:
- removes the isolated floating dot below the logo
- remaps the green center to Bae Agenda burgundy
- remaps blue/purple iridescent areas toward gold/amber
- preserves original motion, brightness, reflections, chrome, and text

Requires OpenCV, NumPy, and the ffmpeg executable on PATH.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np


BRAND = {
    "burgundy": "#8f2d3c",
    "gold": "#c4a574",
    "amber": "#c4844a",
}


def _hex_to_hsv(value: str) -> np.ndarray:
    value = value.lstrip("#")
    rgb = tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))
    bgr = np.uint8([[[rgb[2], rgb[1], rgb[0]]]])
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)[0, 0]


BURGUNDY_HSV = _hex_to_hsv(BRAND["burgundy"])
GOLD_HSV = _hex_to_hsv(BRAND["gold"])
AMBER_HSV = _hex_to_hsv(BRAND["amber"])


def remove_stray_dot(frame: np.ndarray) -> np.ndarray:
    """Remove small disconnected foreground components below the main logo."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    binary = (gray > 8).astype(np.uint8)

    count, labels, stats, centroids = cv2.connectedComponentsWithStats(
        binary, connectivity=8
    )
    if count <= 1:
        return frame

    main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    main_bottom = (
        int(stats[main, cv2.CC_STAT_TOP])
        + int(stats[main, cv2.CC_STAT_HEIGHT])
    )

    cleaned = frame.copy()
    for label in range(1, count):
        if label == main:
            continue
        area = int(stats[label, cv2.CC_STAT_AREA])
        cy = float(centroids[label][1])

        # The unwanted period is a small isolated component below the logo.
        if area < 5000 and cy > main_bottom:
            cleaned[labels == label] = 0

    return cleaned


def recolor(frame: np.ndarray) -> np.ndarray:
    """Recolor only the strongly saturated brand regions."""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    hue, sat, val = cv2.split(hsv)
    mapped = hsv.copy()

    # Existing vivid green center.
    green = (hue >= 35) & (hue <= 90) & (sat >= 70) & (val >= 25)

    # Existing cyan/blue/purple iridescent shell.
    outer = (hue >= 91) & (hue <= 179) & (sat >= 70) & (val >= 25)

    mapped[:, :, 0][green] = BURGUNDY_HSV[0]
    mapped[:, :, 1][green] = np.clip(
        0.55 * sat[green] + 0.45 * BURGUNDY_HSV[1], 80, 220
    )

    # Preserve some variation: blue/cyan -> gold, magenta/purple -> amber.
    mapped[:, :, 0][outer] = np.where(
        hue[outer] >= 140, AMBER_HSV[0], GOLD_HSV[0]
    )
    mapped[:, :, 1][outer] = np.clip(
        0.50 * sat[outer]
        + 0.50 * np.where(hue[outer] >= 140, AMBER_HSV[1], GOLD_HSV[1]),
        70,
        210,
    )

    recolored = cv2.cvtColor(mapped, cv2.COLOR_HSV2BGR)

    # Mostly use the brand recolor while retaining original specular detail.
    alpha = np.zeros(hue.shape, dtype=np.float32)
    alpha[green | outer] = 0.88

    return (
        frame * (1.0 - alpha[:, :, None])
        + recolored * alpha[:, :, None]
    ).astype(np.uint8)


def process_frame(frame: np.ndarray) -> np.ndarray:
    return recolor(remove_stray_dot(frame))


def render(source: Path, destination: Path) -> None:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg is required but was not found on PATH")

    capture = cv2.VideoCapture(str(source))
    if not capture.isOpened():
        raise RuntimeError(f"Could not open input video: {source}")

    fps = capture.get(cv2.CAP_PROP_FPS)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if not fps or width <= 0 or height <= 0:
        capture.release()
        raise RuntimeError("Could not read video dimensions/FPS")

    destination.parent.mkdir(parents=True, exist_ok=True)

    command = [
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "bgr24",
        "-s",
        f"{width}x{height}",
        "-r",
        f"{fps:.8f}",
        "-i",
        "pipe:0",
        "-i",
        str(source),
        "-map",
        "0:v:0",
        "-map",
        "1:a?",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "16",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        "-shortest",
        str(destination),
    ]

    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert encoder.stdin is not None

    frames = 0
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            encoder.stdin.write(process_frame(frame).tobytes())
            frames += 1
    finally:
        capture.release()
        encoder.stdin.close()

    status = encoder.wait()
    if status != 0:
        raise RuntimeError(f"ffmpeg exited with status {status}")

    print(
        f"Wrote {frames} frames at {width}x{height} / {fps:.3f} fps -> {destination}"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Input does not exist: {args.input}", file=sys.stderr)
        return 2

    try:
        render(args.input, args.output)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
