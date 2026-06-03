# Generates build\icon.ico and build\icon.png for the auto-clicker app.
# Design: dark rounded square + cyan/violet/rose glowing orb + cursor arrow.
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$buildDir = Join-Path $PSScriptRoot '..\build'
$buildDir = [System.IO.Path]::GetFullPath($buildDir)
if (-not (Test-Path $buildDir)) { New-Item -ItemType Directory -Path $buildDir | Out-Null }

# Render the icon at $size and return a Bitmap.
function New-IconBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear([System.Drawing.Color]::Transparent)

    $s = [double]$size

    # ---- 1) Rounded square background ----
    $pad = [int]([Math]::Round($s * 0.04))
    $radius = [int]([Math]::Round($s * 0.22))
    $bgRect = [System.Drawing.Rectangle]::new($pad, $pad, $size - 2*$pad, $size - 2*$pad)
    $bgPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $bgPath.AddArc($bgRect.X, $bgRect.Y, $d, $d, 180, 90)
    $bgPath.AddArc($bgRect.Right - $d, $bgRect.Y, $d, $d, 270, 90)
    $bgPath.AddArc($bgRect.Right - $d, $bgRect.Bottom - $d, $d, $d, 0, 90)
    $bgPath.AddArc($bgRect.X, $bgRect.Bottom - $d, $d, $d, 90, 90)
    $bgPath.CloseFigure()

    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $bgRect,
        [System.Drawing.Color]::FromArgb(255, 9, 9, 27),
        [System.Drawing.Color]::FromArgb(255, 26, 15, 46),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
    $g.FillPath($bgBrush, $bgPath)

    # Clip subsequent drawing to rounded shape.
    $g.SetClip($bgPath)

    # ---- 2) Soft cyan halo (top-left) ----
    $haloRect1 = [System.Drawing.RectangleF]::new(-$s*0.20, -$s*0.20, $s*1.0, $s*1.0)
    $haloPath1 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $haloPath1.AddEllipse($haloRect1)
    $halo1 = New-Object System.Drawing.Drawing2D.PathGradientBrush($haloPath1)
    $halo1.CenterColor = [System.Drawing.Color]::FromArgb(170, 34, 211, 238)
    $halo1.SurroundColors = ,[System.Drawing.Color]::FromArgb(0, 34, 211, 238)
    $g.FillPath($halo1, $haloPath1)

    # ---- 3) Soft violet halo (bottom-right) ----
    $haloRect2 = [System.Drawing.RectangleF]::new($s*0.20, $s*0.20, $s*1.0, $s*1.0)
    $haloPath2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $haloPath2.AddEllipse($haloRect2)
    $halo2 = New-Object System.Drawing.Drawing2D.PathGradientBrush($haloPath2)
    $halo2.CenterColor = [System.Drawing.Color]::FromArgb(180, 167, 139, 250)
    $halo2.SurroundColors = ,[System.Drawing.Color]::FromArgb(0, 167, 139, 250)
    $g.FillPath($halo2, $haloPath2)

    # ---- 4) Soft rose halo (bottom-left, subtle) ----
    $haloRect3 = [System.Drawing.RectangleF]::new(-$s*0.10, $s*0.35, $s*0.85, $s*0.85)
    $haloPath3 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $haloPath3.AddEllipse($haloRect3)
    $halo3 = New-Object System.Drawing.Drawing2D.PathGradientBrush($haloPath3)
    $halo3.CenterColor = [System.Drawing.Color]::FromArgb(120, 244, 114, 182)
    $halo3.SurroundColors = ,[System.Drawing.Color]::FromArgb(0, 244, 114, 182)
    $g.FillPath($halo3, $haloPath3)

    # ---- 5) Central orb (filled circle with radial gradient) ----
    $orbDiameter = [Math]::Round($s * 0.50)
    $orbX = ($s - $orbDiameter) / 2.0
    $orbY = ($s - $orbDiameter) / 2.0
    $orbRect = [System.Drawing.RectangleF]::new($orbX, $orbY, $orbDiameter, $orbDiameter)
    $orbPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $orbPath.AddEllipse($orbRect)
    $orbBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($orbPath)
    $orbBrush.CenterPoint = New-Object System.Drawing.PointF(($orbX + $orbDiameter * 0.36), ($orbY + $orbDiameter * 0.34))
    $orbBrush.CenterColor = [System.Drawing.Color]::FromArgb(255, 240, 248, 255)
    $orbBrush.SurroundColors = ,[System.Drawing.Color]::FromArgb(255, 34, 211, 238)
    $g.FillPath($orbBrush, $orbPath)

    # ---- 6) Gradient ring around orb ----
    $ringInset = $s * 0.025
    $ringRect = [System.Drawing.RectangleF]::new($orbX - $ringInset, $orbY - $ringInset, $orbDiameter + 2*$ringInset, $orbDiameter + 2*$ringInset)
    $ringWidth = [Math]::Max(2.0, $s * 0.022)
    $ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $ringWidth)
    $ringPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $ringGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF($ringRect.X, $ringRect.Y)),
        (New-Object System.Drawing.PointF($ringRect.Right, $ringRect.Bottom)),
        [System.Drawing.Color]::FromArgb(255, 34, 211, 238),
        [System.Drawing.Color]::FromArgb(255, 244, 114, 182))
    $blend = New-Object System.Drawing.Drawing2D.ColorBlend
    $blend.Colors = @(
        [System.Drawing.Color]::FromArgb(255, 34, 211, 238),
        [System.Drawing.Color]::FromArgb(255, 167, 139, 250),
        [System.Drawing.Color]::FromArgb(255, 244, 114, 182)
    )
    $blend.Positions = @([float]0.0, [float]0.5, [float]1.0)
    $ringGrad.InterpolationColors = $blend
    $ringPen.Brush = $ringGrad
    $g.DrawEllipse($ringPen, $ringRect)

    # ---- 7) Cursor pointer overlay (only on sizes >= 32, simpler at small) ----
    if ($size -ge 32) {
        # Classic arrow cursor pointing up-left, slightly offset from center
        $cx = $orbX + $orbDiameter * 0.40
        $cy = $orbY + $orbDiameter * 0.36
        $cs = $orbDiameter * 0.35   # cursor scale

        # Build cursor polygon
        $pts = New-Object 'System.Drawing.PointF[]' 7
        $pts[0] = New-Object System.Drawing.PointF(($cx),               ($cy))
        $pts[1] = New-Object System.Drawing.PointF(($cx),               ($cy + $cs))
        $pts[2] = New-Object System.Drawing.PointF(($cx + $cs * 0.27),  ($cy + $cs * 0.75))
        $pts[3] = New-Object System.Drawing.PointF(($cx + $cs * 0.46),  ($cy + $cs * 1.14))
        $pts[4] = New-Object System.Drawing.PointF(($cx + $cs * 0.62),  ($cy + $cs * 1.06))
        $pts[5] = New-Object System.Drawing.PointF(($cx + $cs * 0.43),  ($cy + $cs * 0.68))
        $pts[6] = New-Object System.Drawing.PointF(($cx + $cs * 0.72),  ($cy + $cs * 0.68))
        $cursorPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $cursorPath.AddPolygon($pts)
        $cursorPath.CloseFigure()

        # Dark fill so it stays visible over light orb
        $cursorFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 11, 11, 30))
        $g.FillPath($cursorFill, $cursorPath)
        $cursorOutline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 245, 245, 250), [float]([Math]::Max(1.0, $s * 0.008)))
        $cursorOutline.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        $g.DrawPath($cursorOutline, $cursorPath)
    }

    $g.ResetClip()

    # ---- 8) Subtle outer rim highlight ----
    $rimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 255, 255), [float]([Math]::Max(1.0, $s * 0.006)))
    $g.DrawPath($rimPen, $bgPath)

    $g.Dispose()
    return $bmp
}

# Generate sizes for crisp scaling everywhere
$sizes = @(256, 128, 64, 48, 32, 16)
$pngStreams = @{}
foreach ($sz in $sizes) {
    Write-Host "Rendering $sz x $sz..."
    $bmp = New-IconBitmap $sz
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngStreams[$sz] = $ms.ToArray()
    $bmp.Dispose()
}

# Save preview PNG (256)
$pngOut = Join-Path $buildDir 'icon.png'
[System.IO.File]::WriteAllBytes($pngOut, $pngStreams[256])
Write-Host "Saved $pngOut ($($pngStreams[256].Length) bytes)"

# Pack into multi-image ICO
$icoOut = Join-Path $buildDir 'icon.ico'
$ms = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ms)

# ICONDIR
$bw.Write([UInt16]0)              # reserved
$bw.Write([UInt16]1)              # type = ICO
$bw.Write([UInt16]$sizes.Count)   # number of images

$headerSize = 6
$entrySize = 16
$dataOffset = $headerSize + ($entrySize * $sizes.Count)

# ICONDIRENTRY x N
foreach ($sz in $sizes) {
    $bytes = $pngStreams[$sz]
    $dim = if ($sz -ge 256) { 0 } else { $sz }
    $bw.Write([Byte]$dim)         # width  (0 means 256)
    $bw.Write([Byte]$dim)         # height (0 means 256)
    $bw.Write([Byte]0)            # palette
    $bw.Write([Byte]0)            # reserved
    $bw.Write([UInt16]1)          # color planes
    $bw.Write([UInt16]32)         # bpp
    $bw.Write([UInt32]$bytes.Length)
    $bw.Write([UInt32]$dataOffset)
    $dataOffset += $bytes.Length
}

# Image data blocks
foreach ($sz in $sizes) {
    $bw.Write($pngStreams[$sz])
}

$bw.Flush()
[System.IO.File]::WriteAllBytes($icoOut, $ms.ToArray())
Write-Host "Saved $icoOut ($($ms.Length) bytes, $($sizes.Count) sizes)"
