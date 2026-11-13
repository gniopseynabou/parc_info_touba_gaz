Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path "public/logo.jpg").Path
$original = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($img, $w, $h) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($img, 0, 0, $w, $h)
    $g.Dispose()
    return $bmp
}

# 1. Generate PNG icons
$png256 = Resize-Image $original 256 256
$png256.Save((Resolve-Path ".").Path + "/src/app/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$png256.Save((Resolve-Path ".").Path + "/public/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$png180 = Resize-Image $original 180 180
$png180.Save((Resolve-Path ".").Path + "/src/app/apple-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Generate ICO files with 32x32
$bmp32 = Resize-Image $original 32 32
$hicon = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hicon)

$icoPath1 = (Resolve-Path ".").Path + "/src/app/favicon.ico"
$fs1 = New-Object System.IO.FileStream -ArgumentList $icoPath1, ([System.IO.FileMode]::Create)
$icon.Save($fs1)
$fs1.Close()

$icoPath2 = (Resolve-Path ".").Path + "/public/favicon.ico"
$fs2 = New-Object System.IO.FileStream -ArgumentList $icoPath2, ([System.IO.FileMode]::Create)
$icon.Save($fs2)
$fs2.Close()

$original.Dispose()
Write-Output "Icons generated successfully!"
