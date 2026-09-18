<#
.SYNOPSIS
  Crop illustrations, charts or icons out of a source image so they can be re-used inside a
  branded board, optionally knocking out the paper background so they float on glass.
  Windows only (System.Drawing plus a small inline C# routine); no modules needed.

.EXAMPLE
  pwsh crop.ps1 -Source "infographics/AI/Claude/7 Hacks.png" -OutDir work/crops -Transparent `
      -Crops "robot:20,300,200,220;gauge:590,140,200,130|600,250,80,20"

  Each crop is  name:x,y,width,height  in source pixels, separated by semicolons. A crop may
  carry erase boxes after a pipe, |x,y,w,h (source pixels, repeatable), for stray caption
  text that sits inside the box; those pixels become transparent. A crop may also override
  the thresholds with @tolerance,minLum anywhere in its spec (for example
  brain:55,285,255,175@8,225  keeps a pastel-filled drawing intact by only removing
  near-white paper).

  -Transparent  removes the background: every pixel reachable from the crop's border through
                light, smoothly varying colour (paper, pastel gradients, soft shadows) becomes
                transparent, with anti-aliased edges. Outlined artwork and interior whites
                survive because the fill cannot cross a dark outline.
  -Tolerance    how much neighbouring colours may differ and still be background (default 16).
  -MinLum       minimum luminance (0-255) for a pixel to count as background (default 150).
                Lower it for darker paper, raise it if pale artwork is being eaten.
#>
param(
  [Parameter(Mandatory)] [string] $Source,
  [Parameter(Mandatory)] [string] $OutDir,
  [Parameter(Mandatory)] [string] $Crops,
  [switch] $Transparent,
  [int] $Tolerance = 16,
  [int] $MinLum = 150
)
Add-Type -AssemblyName System.Drawing
if (-not ('CyberAmo.Cutout' -as [type])) {
# Pure array processing (no System.Drawing types in the C#), so it compiles on any .NET.
Add-Type -TypeDefinition @'
using System;
namespace CyberAmo {
public static class Cutout {
  static int Lum(byte[] p, int i) { return (p[i*4+2]*299 + p[i*4+1]*587 + p[i*4]*114) / 1000; }
  static int Dist(byte[] p, int a, int b) {
    return (Math.Abs(p[a*4]-p[b*4]) + Math.Abs(p[a*4+1]-p[b*4+1]) + Math.Abs(p[a*4+2]-p[b*4+2])) / 3;
  }
  // p is BGRA, w*h*4 bytes (stride == w*4). Sets the alpha channel in place.
  public static void Apply(byte[] p, int w, int h, int tol, int minLum, int[] erase) {
    bool[] bg = new bool[w * h];
    int[] stack = new int[w * h]; int sp = 0;
    Action<int> seed = i => { if (!bg[i] && Lum(p, i) >= minLum) { bg[i] = true; stack[sp++] = i; } };
    for (int x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
    for (int y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
    int[] dx = { 1, -1, 0, 0 }, dy = { 0, 0, 1, -1 };
    while (sp > 0) {
      int i = stack[--sp]; int x = i % w, y = i / w;
      for (int k = 0; k < 4; k++) {
        int nx = x + dx[k], ny = y + dy[k];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        int j = ny * w + nx;
        if (bg[j] || Lum(p, j) < minLum) continue;
        if (Dist(p, i, j) <= tol) { bg[j] = true; stack[sp++] = j; }
      }
    }
    if (erase != null) for (int r = 0; r + 3 < erase.Length; r += 4)
      for (int y = Math.Max(0, erase[r+1]); y < Math.Min(h, erase[r+1] + erase[r+3]); y++)
        for (int x = Math.Max(0, erase[r]); x < Math.Min(w, erase[r] + erase[r+2]); x++) bg[y * w + x] = true;
    // Edge pass: pixels touching the background get an alpha from how far their colour is
    // from the background beside them, which anti-aliases outlines and dissolves halos.
    byte[] alpha = new byte[w * h];
    for (int i = 0; i < w * h; i++) {
      if (bg[i]) { alpha[i] = 0; continue; }
      int x = i % w, y = i / w; int best = -1;
      for (int k = 0; k < 4; k++) {
        int nx = x + dx[k], ny = y + dy[k];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        int j = ny * w + nx;
        if (bg[j]) { int d = Dist(p, i, j); if (best < 0 || d < best) best = d; }
      }
      if (best < 0) { alpha[i] = 255; continue; }
      int a = Math.Min(255, best * 255 / Math.Max(1, tol * 5));
      if (Lum(p, i) >= 235) a = Math.Min(a, 40);
      alpha[i] = (byte)a;
    }
    for (int i = 0; i < w * h; i++) p[i * 4 + 3] = alpha[i];
  }
}}
'@
}
$img = [System.Drawing.Image]::FromFile((Resolve-Path $Source))
New-Item -ItemType Directory -Force $OutDir | Out-Null
foreach ($spec in $Crops -split ';') {
  if (-not $spec.Trim()) { continue }
  $name, $rest = $spec.Trim() -split ':', 2
  $tol = $Tolerance; $lum = $MinLum
  if ($rest -match '@(\d+),(\d+)') { $tol = [int]$Matches[1]; $lum = [int]$Matches[2]; $rest = $rest -replace '@\d+,\d+', '' }
  $parts = $rest -split '\|'
  $x, $y, $w, $h = ($parts[0] -split ',') | ForEach-Object { [int]$_ }
  $x = [Math]::Max(0, $x); $y = [Math]::Max(0, $y)
  $w = [Math]::Min($w, $img.Width - $x); $h = [Math]::Min($h, $img.Height - $y)
  $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), (New-Object System.Drawing.Rectangle $x, $y, $w, $h), [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $erase = [int[]]@()
  for ($k = 1; $k -lt $parts.Count; $k++) {
    $ex, $ey, $ew, $eh = ($parts[$k] -split ',') | ForEach-Object { [int]$_ }
    $erase += @(($ex - $x), ($ey - $y), $ew, $eh)   # to crop-local coordinates (comma binds tighter than minus)
  }
  if ($Transparent) {
    $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
    $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bytes = New-Object byte[] ($w * $h * 4)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
    [CyberAmo.Cutout]::Apply($bytes, $w, $h, $tol, $lum, [int[]]$erase)
    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
    $bmp.UnlockBits($data)
  }
  $path = Join-Path $OutDir "$name.png"
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  "wrote $path ($($w)x$($h))"
}
$img.Dispose()
