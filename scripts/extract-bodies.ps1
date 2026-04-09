$BasePath = "e:\Antigravity\Portfolio"

function Extract-Body {
    param([string]$FilePath)
    $raw = Get-Content $FilePath -Encoding UTF8 -Raw
    $m = [regex]::Match($raw, '(?s)<en-note[^>]*>(.*?)</en-note>')
    if ($m.Success) { return $m.Groups[1].Value.Trim() }
    Write-Error "Not found in $FilePath"; return ""
}

$linuxPath = Join-Path $BasePath "labs-research-and-ctf\lecture-notes\linux-fundamentals\index.html"
$netPath   = Join-Path $BasePath "labs-research-and-ctf\lecture-notes\networking-fundamentals\index.html"

$lb = Extract-Body -FilePath $linuxPath
$nb = Extract-Body -FilePath $netPath

Write-Host "Linux body: $($lb.Length) chars"
Write-Host "Net body:   $($nb.Length) chars"

[System.IO.File]::WriteAllText((Join-Path $BasePath "scripts\linux-body.tmp"), $lb, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText((Join-Path $BasePath "scripts\net-body.tmp"),   $nb, [System.Text.Encoding]::UTF8)

Write-Host "Saved to scripts\linux-body.tmp and scripts\net-body.tmp"
