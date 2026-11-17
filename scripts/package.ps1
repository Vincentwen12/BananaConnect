$root = "D:\BananaConect"
$out = Join-Path $root "dist-portable\BananaConnect"
$zip = Join-Path $root "dist-portable\BananaConnect-0.1.0-win-x64.zip"

Remove-Item (Join-Path $root "dist-portable") -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $out | Out-Null

Copy-Item (Join-Path $root "src-tauri\target\release\banana-connect.exe") (Join-Path $out "BananaConnect.exe")
New-Item -ItemType Directory -Force (Join-Path $out "resources\easytier") | Out-Null
Copy-Item (Join-Path $root "src-tauri\resources\easytier\*") (Join-Path $out "resources\easytier") -Recurse -Force

$readme = @"
BananaConnect 0.1.0 (portable)

1. Right click BananaConnect.exe -> Run as administrator (needed for the virtual NIC).
2. Create a room, share the 12-character invite code.
3. A friend joins with the same code.

Data stays in this folder (data/). No installer required.
"@
Set-Content -Path (Join-Path $out "README.txt") -Value $readme -Encoding UTF8

Compress-Archive -Path (Join-Path $out "*") -DestinationPath $zip -Force
Write-Output $zip
