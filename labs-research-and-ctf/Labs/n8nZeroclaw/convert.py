import sys
import os

html_head = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>n8n on Google Cloud Free Tier & Installing ZeroClaw | Anand Mohankumar</title>
    <link rel="stylesheet" href="../../../styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        /* ── CRITICAL: override styles.css desktop-UI rules that kill scrolling ── */
        html {
            height: auto !important;
            overflow-y: auto !important;
        }
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
            box-shadow: 0 4px 6px rgba(0,0,0,.18), 0 20px 60px rgba(0,0,0,.45),
                        inset 0 1px 0 rgba(255,255,255,.06);
        }

        /* Traffic-light header */
        .lecture-card-header {
            display: flex; align-items: center; gap: .75rem;
            padding: 1rem 1.5rem;
            background: rgba(255,255,255,.03);
            border-bottom: 1px solid rgba(255,255,255,.07);
            border-radius: 16px 16px 0 0;
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
        .lecture-body .para, .lecture-body p { margin: .4rem 0; color: rgba(232,239,245,.82); }

        /* HR */
        .lecture-body hr { border: none; border-top: 1px solid rgba(255,255,255,.08); margin: 2rem 0; }

        /* Images */
        .lecture-body img {
            max-width: 100%; height: auto; border-radius: 8px;
            margin: .75rem 0; border: 1px solid rgba(255,255,255,.07);
            background: rgba(0,0,0,.2);
        }

        /* Tables */
        .lecture-body en-table, .lecture-body .container, .lecture-body .table-wrapper {
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
        .lecture-body th {
            padding: .6rem .85rem;
            border: 1px solid rgba(255,255,255,.1);
            vertical-align: top;
            color: var(--text-color-darkmode, rgba(232,239,245,.88));
            background: rgba(255,255,255,.07) !important; font-weight: 500;
        }
        .lecture-body td[data-background-luminance-darkmode="dark"] {
            background: rgba(255,255,255,.07) !important; font-weight: 500;
        }

        /* Lists */
        .lecture-body ul,.lecture-body ol { padding-left: 1.5rem; margin: .5rem 0; color: rgba(232,239,245,.82); }
        .lecture-body li { margin: .25rem 0; }

        /* Links */
        .lecture-body a { color: #7EC8C8; text-decoration: none; }
        .lecture-body a:hover { text-decoration: underline; }

        /* Bold */
        .lecture-body b, .lecture-body strong { color: #E8EFF5; }

        /* Code and Pre */
        .lecture-body code {
            font-family: 'JetBrains Mono', monospace;
            font-size: .875em;
            background: rgba(87, 231, 128, .08);
            color: rgb(87, 231, 128);
            padding: .1em .35em; border-radius: 4px;
        }
        .lecture-body pre {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.08);
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            color: #E8EFF5;
            font-family: 'JetBrains Mono', monospace;
            font-size: .875em;
        }
        .lecture-body pre code {
            background: none;
            padding: 0;
            color: inherit;
        }

        @media (max-width: 640px) {
            body { padding: 1rem .5rem 3rem; }
            .lecture-body { padding: 1.5rem 1.25rem 2rem; }
            .lecture-page-title { font-size: 1.4rem; }
        }
    </style>
</head>
<body>
    <nav class="lecture-breadcrumb"><a href="../../index.html">&#8592; Back to Portfolio</a></nav>
    <article class="lecture-card">
        <div class="lecture-card-header">
            <div class="lecture-card-dots"><span class="dot-red"></span><span class="dot-yellow"></span><span class="dot-green"></span></div>
            <span class="lecture-card-title">n8n on Google Cloud Free Tier & Installing ZeroClaw</span>
        </div>
        <div class="lecture-body">
            <h1 class="lecture-page-title">n8n on Google Cloud Free Tier & Installing ZeroClaw</h1>
            <p class="lecture-page-subtitle">A Complete Self-Hosting Setup Guide</p>
"""

html_tail = """
        </div>
    </article>
</body>
</html>
"""

def md_to_html(md_path, html_path):
    try:
        import markdown
    except ImportError:
        print("Markdown library not installed.")
        sys.exit(1)
        
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()
    
    # Process the markdown
    # The markdown has standard tables, which are supported by markdown.extensions.tables
    md = markdown.Markdown(extensions=['tables', 'fenced_code'])
    body_html = md.convert(md_text)
    
    # Wrap tables in a div wrapper for styling
    body_html = body_html.replace("<table>", '<div class="table-wrapper"><table>')
    body_html = body_html.replace("</table>", "</table></div>")
    
    full_html = html_head + body_html + html_tail
    
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(full_html)
    print("Done")

if __name__ == "__main__":
    md_file = r"e:\Antigravity\Portfolio\labs-research-and-ctf\Labs\n8nZeroclaw\n8n-gcp-setup-guide + Zeroclaw.docx.md"
    html_file = r"e:\Antigravity\Portfolio\labs-research-and-ctf\Labs\n8nZeroclaw\index.html"
    md_to_html(md_file, html_file)
