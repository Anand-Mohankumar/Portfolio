#!/usr/bin/env python3
"""Render a branded HTML artboard to PNG with a headless Chromium browser (Edge or Chrome).

No Python packages required. Usage:

    python render.py page.html out.png --width 1080 --height 1080 --scale 2
    python render.py board.html out.png --width 1376 --height auto --scale 2 --thumb 400

--height auto   measures the page (the .canvas element, or the whole document) and
                renders exactly that tall, so long infographics are never cut off.
--scale N       device scale factor. 2 gives a crisp 2x export; the CSS pixel sizes stay
                the same, so a 1080px artboard becomes a 2160px PNG.
--thumb W       also write <out>-thumb.png, W CSS pixels wide (used for the site's
                infographics/thumbnails tree, which expects 400px wide images).
--browser PATH  override browser autodetection.

Exit code is non-zero if no browser is found or the PNG was not written.
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

CANDIDATES = [
    # Windows
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    # macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
]
NAMES = ["chrome", "google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "msedge", "microsoft-edge"]

MEASURE_SCRIPT = """
<script>
(function () {
  function measure() {
    var c = document.querySelector('.canvas');
    var h = c ? Math.ceil(c.getBoundingClientRect().height)
              : Math.ceil(document.documentElement.scrollHeight);
    document.title = 'HEIGHT:' + h;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure); else measure();
  window.addEventListener('load', measure);
  measure();
})();
</script>
"""


def find_browser(override=None):
    if override:
        return override
    local = os.environ.get("LOCALAPPDATA", "")
    extra = [os.path.join(local, "Google", "Chrome", "Application", "chrome.exe")] if local else []
    for p in CANDIDATES + extra:
        if os.path.exists(p):
            return p
    for n in NAMES:
        found = shutil.which(n)
        if found:
            return found
    return None


def run(browser, args, timeout=90):
    cmd = [browser, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
           "--no-default-browser-check", "--disable-extensions", "--mute-audio",
           "--virtual-time-budget=4000", "--run-all-compositor-stages-before-draw"] + args
    # The DOM dump is UTF-8 regardless of the console code page; never let a stray byte kill the run.
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)


def measure_height(browser, html_path: Path, width: int) -> int:
    """Copy the page next to the original (so relative links resolve), append the measuring
    script, dump the DOM and read the height the script wrote into <title>."""
    src = html_path.read_text(encoding="utf-8")
    tmp = html_path.with_name(html_path.stem + ".__measure__.html")
    if "</body>" in src:
        tmp.write_text(src.replace("</body>", MEASURE_SCRIPT + "</body>", 1), encoding="utf-8")
    else:
        tmp.write_text(src + MEASURE_SCRIPT, encoding="utf-8")
    try:
        with tempfile.TemporaryDirectory() as profile:
            r = run(browser, [f"--user-data-dir={profile}", f"--window-size={width},20000",
                              "--dump-dom", tmp.as_uri()])
        m = re.search(r"<title>HEIGHT:(\d+)</title>", r.stdout)
        if not m:
            sys.stderr.write(r.stderr[-2000:])
            raise SystemExit("Could not measure page height (no HEIGHT marker in DOM dump).")
        return int(m.group(1))
    finally:
        tmp.unlink(missing_ok=True)


def screenshot(browser, html_path: Path, out: Path, width: int, height: int, scale: float):
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()
    with tempfile.TemporaryDirectory() as profile:
        r = run(browser, [f"--user-data-dir={profile}", f"--window-size={width},{height}",
                          f"--force-device-scale-factor={scale}", f"--screenshot={out}",
                          html_path.as_uri()])
    # Chromium occasionally returns before the file handle is flushed.
    for _ in range(20):
        if out.exists() and out.stat().st_size > 0:
            return
        time.sleep(0.1)
    sys.stderr.write(r.stderr[-2000:])
    raise SystemExit(f"Screenshot was not written: {out}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("html")
    ap.add_argument("out")
    ap.add_argument("--width", type=int, required=True, help="artboard width in CSS px")
    ap.add_argument("--height", default="auto", help="artboard height in CSS px, or 'auto'")
    ap.add_argument("--scale", type=float, default=2.0, help="device scale factor (default 2)")
    ap.add_argument("--thumb", type=int, default=0, help="also write a thumbnail this many px wide")
    ap.add_argument("--browser", default=None)
    a = ap.parse_args()

    browser = find_browser(a.browser)
    if not browser:
        raise SystemExit("No Chromium-based browser found. Install Chrome or Edge, or pass --browser PATH.")

    html_path = Path(a.html).resolve()
    out = Path(a.out).resolve()
    if not html_path.exists():
        raise SystemExit(f"HTML not found: {html_path}")

    height = measure_height(browser, html_path, a.width) if str(a.height).lower() == "auto" else int(a.height)
    screenshot(browser, html_path, out, a.width, height, a.scale)
    print(f"wrote {out}  ({a.width}x{height} css px at {a.scale}x -> {int(a.width*a.scale)}x{int(height*a.scale)} px)")

    if a.thumb:
        thumb = out.with_name(out.stem + "-thumb.png")
        screenshot(browser, html_path, thumb, a.width, height, a.thumb / a.width)
        print(f"wrote {thumb}  ({a.thumb}px wide)")


if __name__ == "__main__":
    main()
