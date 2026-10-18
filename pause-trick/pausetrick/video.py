"""Export der Frames nach MP4 via ffmpeg."""

from __future__ import annotations

import os
import shutil
import subprocess


def ffmpeg_available():
    """Pfad zu ffmpeg oder None."""
    return shutil.which("ffmpeg")


def encode(cfg, frames_dir, out_path, frame_count):
    """PNG-Sequenz zu Instagram-taugliches MP4 kodieren.

    - H.264 (libx264), yuv420p, konstante fps
    - optional eine Audiospur, auf die Videolaenge gekuerzt
    """
    ffmpeg = ffmpeg_available()
    if not ffmpeg:
        raise RuntimeError(
            "ffmpeg nicht gefunden. Bitte installieren (siehe README) "
            "oder mit --no-encode nur Frames rendern."
        )

    fps = float(cfg["video"]["fps"])
    duration = frame_count / fps
    audio = cfg["video"].get("audio")

    cmd = [
        ffmpeg, "-y",
        "-framerate", f"{fps}",
        "-i", os.path.join(frames_dir, "frame_%06d.png"),
    ]
    if audio:
        cmd += ["-i", audio]

    cmd += [
        "-c:v", "libx264",
        "-preset", str(cfg["video"]["preset"]),
        "-crf", str(cfg["video"]["crf"]),
        "-pix_fmt", "yuv420p",
        "-r", f"{fps}",
        # Instagram mag geraden Pixelmasse und einen schnell startbaren Container.
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-movflags", "+faststart",
    ]
    if audio:
        cmd += [
            "-map", "0:v:0", "-map", "1:a:0",
            "-c:a", "aac", "-b:a", str(cfg["video"]["audio_bitrate"]),
            # Ton wird hart auf die Videolaenge geschnitten.
            "-t", f"{duration:.3f}",
        ]
    cmd += [out_path]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        tail = "\n".join(result.stderr.strip().splitlines()[-20:])
        raise RuntimeError(f"ffmpeg ist fehlgeschlagen:\n{tail}")
    return out_path
