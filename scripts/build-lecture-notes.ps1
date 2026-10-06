
# build-lecture-notes.ps1
# Extracts body content from Evernote-exported HTML and wraps it in the
# portfolio's dark glassmorphism template.

$BasePath = "e:\Antigravity\Portfolio"

function Extract-Body {
    param([string]$FilePath)
    $raw = Get-Content $FilePath -Encoding UTF8 -Raw
    $m   = [regex]::Match($raw, '(?s)<en-note[^>]*>(.*?)</en-note>')
    if ($m.Success) { return $m.Groups[1].Value.Trim() }
    Write-Error "Could not find <en-note> in $FilePath"; return ""
}

function Build-Page {
    param(
        [string]$Title,
        [string]$Subtitle,
        [string]$BodyContent,
        [string]$OutPath,
        [string]$CssRelPath
    )

    # Split into three literal strings so PowerShell never expands $BodyContent
    $head = @'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
'@

    $headDynamic = "    <meta name=`"description`" content=`"$Subtitle`">
    <title>$Title | Anand Mohankumar</title>
    <link rel=`"stylesheet`" href=`"$CssRelPath`">
    <link rel=`"preconnect`" href=`"https://fonts.googleapis.com`">
    <link rel=`"preconnect`" href=`"https://fonts.gstatic.com`" crossorigin>
    <link href=`"https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700`&family=JetBrains+Mono:wght@400;500`&display=swap`" rel=`"stylesheet`">"

    $styles = @'
    <style>
        /* Override styles.css desktop-UI rules that kill scrolling */
        html, body {
            margin: 0; padding: 0;
            height: auto !important;
            overflow: visible !important;
            min-height: 100vh;
            background: #12181A;
            font-family: 'Outfit', system-ui, sans-serif;
            color: #E8EFF5;
        }
        body { padding: 2rem 1rem 4rem; }

        /* Back nav */
        .lecture-breadcrumb { max-width: 900px; margin: 0 auto 1.5rem; }
        .lecture-breadcrumb a {
            display: inline-flex; align-items: center; gap: 0.4rem;
            color: #7EC8C8; text-decoration: none;
            font-size: 0.9rem; font-weight: 500;
            opacity: 0.75; transition: opacity 0.2s;
        }
        .lecture-breadcrumb a:hover { opacity: 1; }

        /* Card */
        .lecture-card {
            max-width: 900px; margin: 0 auto;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,.18), 0 20px 60px rgba(0,0,0,.45),
                        inset 0 1px 0 rgba(255,255,255,.06);
        }

        /* Traffic-light header */
        .lecture-card-header {
            display: flex; align-items: center; gap: .75rem;
            padding: 1rem 1.5rem;
            background: rgba(255,255,255,.03);
            border-bottom: 1px solid rgba(255,255,255,.07);
        }
        .lecture-card-dots { display: flex; gap: 6px; }
        .lecture-card-dots span { width: 12px; height: 12px; border-radius: 50%; }
        .dot-red    { background: #FF5F57; }
        .dot-yellow { background: #FFBD2E; }
        .dot-green  { background: #28CA41; }
        .lecture-card-title { font-size: .85rem; font-weight: 500; color: rgba(255,255,255,.5); }

        /* Body */
        .lecture-body { padding: 2.5rem 2.5rem 3rem; line-height: 1.75; }

        .lecture-page-title {
            margin: 0 0 .5rem; font-size: 2rem; font-weight: 700;
            background: linear-gradient(135deg, #E8EFF5 0%, #7EC8C8 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .lecture-page-subtitle {
            margin: 0 0 2.5rem; font-size: .925rem;
            color: rgba(255,255,255,.4);
            border-bottom: 1px solid rgba(255,255,255,.07);
            padding-bottom: 1.5rem;
        }

        /* Headings */
        .lecture-body h1,.lecture-body h2,.lecture-body h3,.lecture-body h4 {
            color: #E8EFF5; font-family: 'Outfit', sans-serif;
            font-weight: 600; margin: 2rem 0 .75rem;
        }
        .lecture-body h1 { font-size: 1.6rem; }
        .lecture-body h2 { font-size: 1.2rem; padding-bottom: .4rem; border-bottom: 1px solid rgba(255,255,255,.08); }
        .lecture-body h3 { font-size: 1.05rem; color: rgba(232,239,245,.85); }

        /* Paragraphs */
        .lecture-body .para { margin: .4rem 0; color: rgba(232,239,245,.82); }

        /* HR */
        .lecture-body hr { border: none; border-top: 1px solid rgba(255,255,255,.08); margin: 2rem 0; }

        /* Images */
        .lecture-body img {
            max-width: 100%; height: auto; border-radius: 8px;
            margin: .75rem 0; border: 1px solid rgba(255,255,255,.07);
            background: rgba(0,0,0,.2);
        }

        /* Tables */
        .lecture-body en-table, .lecture-body .container {
            width: 100%; overflow-x: auto; display: block; margin: 1rem 0;
        }
        .lecture-body table {
            width: 100% !important; border-collapse: collapse;
            font-size: .875rem;
        }
        .lecture-body td {
            padding: .6rem .85rem;
            border: 1px solid rgba(255,255,255,.1);
            vertical-align: top;
            color: var(--text-color-darkmode, rgba(232,239,245,.88));
            background: var(--background-color-darkmode, transparent);
        }
        .lecture-body td[data-background-luminance-darkmode="dark"] {
            background: rgba(255,255,255,.07) !important; font-weight: 500;
        }

        /* Lists */
        .lecture-body ul,.lecture-body ol { padding-left: 1.5rem; margin: .5rem 0; }
        .lecture-body li { margin: .25rem 0; }

        /* Hide Evernote interactive chrome */
        input[type="checkbox"].list-bullet-todo { display: none; }
        .list-counter { display: none; }

        /* Links */
        .lecture-body a { color: #7EC8C8; text-decoration: none; }
        .lecture-body a:hover { text-decoration: underline; }

        /* Evernote colour spans — use darkmode CSS variable */
        .UrtAp { color: var(--darkmode-color, inherit); }
        .lecture-body b { color: #E8EFF5; }

        /* Code-style for green command spans */
        .lecture-body span[style*="rgb(87, 231, 128)"],
        .lecture-body span[style*="rgb(24, 168, 65)"] {
            font-family: 'JetBrains Mono', monospace;
            font-size: .875em;
            background: rgba(87, 231, 128, .08);
            padding: .1em .35em; border-radius: 4px;
        }

        @media (max-width: 640px) {
            body { padding: 1rem .5rem 3rem; }
            .lecture-body { padding: 1.5rem 1.25rem 2rem; }
            .lecture-page-title { font-size: 1.4rem; }
        }
    </style>
</head>
<body>
'@

    $cardOpen = "    <nav class=`"lecture-breadcrumb`"><a href=`"../../index.html`">&#8592; Back to Portfolio</a></nav>
    <article class=`"lecture-card`">
        <div class=`"lecture-card-header`">
            <div class=`"lecture-card-dots`"><span class=`"dot-red`"></span><span class=`"dot-yellow`"></span><span class=`"dot-green`"></span></div>
            <span class=`"lecture-card-title`">$Title</span>
        </div>
        <div class=`"lecture-body`">
            <h1 class=`"lecture-page-title`">$Title</h1>
            <p class=`"lecture-page-subtitle`">$Subtitle</p>"

    $cardClose = @'

        </div>
    </article>
</body>
</html>
'@

    $full = $head + $headDynamic + $styles + $cardOpen + "`n" + $BodyContent + $cardClose
    [System.IO.File]::WriteAllText($OutPath, $full, [System.Text.Encoding]::UTF8)
    Write-Host "Written: $OutPath  ($([math]::Round($full.Length/1024))KB)"
}

# ── Linux Fundamentals ────────────────────────────────────────────────────────
$linuxPath = Join-Path $BasePath "labs-research-and-ctf\lecture-notes\linux-fundamentals\index.html"
Write-Host "Extracting Linux content from: $linuxPath"
$linuxBody = Extract-Body -FilePath $linuxPath
Write-Host "  Extracted $($linuxBody.Length) chars"

Build-Page `
    -Title       "Linux Fundamentals (HTB)" `
    -Subtitle    "Personal notes from the HackTheBox Linux Fundamentals module covering core concepts, terminal commands, file system structure, user management, and advanced administration." `
    -BodyContent $linuxBody `
    -OutPath     $linuxPath `
    -CssRelPath  "../../../styles.css"

# ── Networking Fundamentals ───────────────────────────────────────────────────
$netPath = Join-Path $BasePath "labs-research-and-ctf\lecture-notes\networking-fundamentals\index.html"
Write-Host "Extracting Networking content from: $netPath"
$netBody = Extract-Body -FilePath $netPath
Write-Host "  Extracted $($netBody.Length) chars"

Build-Page `
    -Title       "Networking Fundamentals" `
    -Subtitle    "Personal notes from NetworkChuck and other sources covering the Internet, LAN/WAN, data transmission, network devices, IP addressing, and network cabling." `
    -BodyContent $netBody `
    -OutPath     $netPath `
    -CssRelPath  "../../../styles.css"

Write-Host ""
Write-Host "All done."
