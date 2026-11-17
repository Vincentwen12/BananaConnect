Add-Type -AssemblyName System.Drawing

$size = 1024
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

$radius = 210
$d = $radius * 2
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(0, 0, $d, $d, 180, 90)
$path.AddArc($size - $d, 0, $d, $d, 270, 90)
$path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
$path.AddArc(0, $size - $d, $d, $d, 90, 90)
$path.CloseFigure()

$rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(255, 255, 240, 168), [System.Drawing.Color]::FromArgb(255, 255, 197, 24), 90)
$g.FillPath($grad, $path)

$top = [System.Drawing.Point[]]@(
  [System.Drawing.Point]::new(512, 232),
  [System.Drawing.Point]::new(816, 400),
  [System.Drawing.Point]::new(512, 568),
  [System.Drawing.Point]::new(208, 400)
)
$left = [System.Drawing.Point[]]@(
  [System.Drawing.Point]::new(208, 400),
  [System.Drawing.Point]::new(512, 568),
  [System.Drawing.Point]::new(512, 912),
  [System.Drawing.Point]::new(208, 744)
)
$right = [System.Drawing.Point[]]@(
  [System.Drawing.Point]::new(816, 400),
  [System.Drawing.Point]::new(512, 568),
  [System.Drawing.Point]::new(512, 912),
  [System.Drawing.Point]::new(816, 744)
)

$topBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 110, 85, 0))
$leftBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 62, 48, 0))
$rightBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 43, 34, 0))

$g.FillPolygon($topBrush, $top)
$g.FillPolygon($leftBrush, $left)
$g.FillPolygon($rightBrush, $right)

$out = Join-Path $PSScriptRoot "..\.cache\icon-source.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$topBrush.Dispose()
$leftBrush.Dispose()
$rightBrush.Dispose()
$grad.Dispose()

Write-Output $out
