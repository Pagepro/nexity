#!/usr/bin/env python3
"""Build the product-mock gallery: tools/product-mocks/out/index.html.

Every screen is plain HTML rendered on the Meridian *product* tokens
(product.py, mirrored from the designer's dashboard build), placed on the
tinted dune panel the marketing site uses behind product imagery (mocks.py),
with the full dashboard as one more screen (dashboard.py). The gallery page
carries a "Save PNG" button per panel that renders it at the size the Sanity
assets use. See docs/guides/product-mocks.md.

Run:  python3 tools/product-mocks/build.py   (or `pnpm mocks:build`)
Needs only the Python standard library.
"""
import base64
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(ROOT, "..", ".."))
ASSETS = os.path.join(ROOT, "assets")
FONTS = os.path.join(REPO, "web", "src", "styles", "fonts", "MonaSans")
OUT = os.path.join(ROOT, "out")

sys.path.insert(0, ROOT)
import dashboard  # noqa: E402
import mocks  # noqa: E402
import product  # noqa: E402

ICONS = json.load(open(os.path.join(ROOT, "icons.json")))


def data_uri(path, mime):
    with open(path, "rb") as fh:
        return f"data:{mime};base64," + base64.b64encode(fh.read()).decode()


def ico(name, cls="ico"):
    if name not in ICONS:
        raise SystemExit(f"icon {name!r} is not in icons.json; add it with: node tools/product-mocks/extract-icons.mjs {name}")
    return (
        f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>'
    )


def esc(text):
    return html.escape(text, quote=False)


A = lambda name: os.path.join(ASSETS, name)

# ── assets ───────────────────────────────────────────────────────────────────
MARK_PATH = re.search(r'd="([^"]+)"', open(A("meridian-mark.svg"), encoding="utf-8").read()).group(1)
# Invented vendors (BRAND.md): never a real brand or its logo here.
INTEGRATION_LOGOS = {"Cumulo": "logo-cumulo.svg", "Relay": "logo-relay.svg", "Frostbase": "logo-frostbase.svg"}
AVATAR = data_uri(A("avatar.jpg"), "image/jpeg")
BG_STAGE = data_uri(A("bg-dunes.jpg"), "image/jpeg")
INTER_FACE = (
    '@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;src:url('
    + data_uri(A("inter-variable.woff2"), "font/woff2")
    + ') format("woff2")}'
)
MONA_FACES = "".join(
    f'@font-face{{font-family:"Mona Sans SemiExpanded";font-weight:{weight};font-style:normal;font-display:swap;'
    f'src:url({data_uri(os.path.join(FONTS, f"MonaSans_SemiExpanded-{name}.ttf"), "font/ttf")}) format("truetype")}}'
    for weight, name in ((400, "Regular"), (500, "Medium"), (700, "Bold"))
)

dashboard.setup(ico=ico, esc=esc, MARK_PATH=MARK_PATH, AVATAR=AVATAR)
DASH_HTML = dashboard.dashboard()
DASH_TOAST_HTML = dashboard.dashboard(toast=True)
mocks.setup(ico=ico, esc=esc, MARK_PATH=MARK_PATH, data_uri=data_uri, A=A, INTEGRATION_LOGOS=INTEGRATION_LOGOS,
            DASH=DASH_HTML, DASH_TOAST=DASH_TOAST_HTML)

# ── page chrome: the marketing tokens the gallery and the stage/pins need ────
PAGE_CSS = MONA_FACES + INTER_FACE + ":root{--bg-stage:url(" + BG_STAGE + ")}" + r"""
:root{color-scheme:light;
  --background:oklch(1 0 0);--foreground:oklch(0.147 0.004 49.25);--card-muted:oklch(0.985 0.001 106.423);
  --muted:oklch(0.97 0.001 106.424);--muted-foreground:oklch(0.54 0.013 58.071);--border:oklch(0.923 0.003 48.717);
  --primary:oklch(0.216 0.006 56.043);--primary-foreground:oklch(0.985 0.001 106.423);
  --accent-peach:#ecd3c7;--accent-sage:#b9c9c6;--accent-rose:#daa2a2;
  --font-sans:"Mona Sans SemiExpanded","Mona Sans",ui-sans-serif,system-ui,sans-serif;
  --radius-md:.5rem;--radius-lg:.625rem;--radius-xl:1rem;--shadow-card:0 0 0 1px var(--border)}
*,*::before,*::after{box-sizing:border-box;min-width:0}
body{margin:0;background:var(--background);color:var(--foreground);font-family:var(--font-sans);font-size:1rem;line-height:1.5;-webkit-font-smoothing:antialiased}
img,svg{display:block;max-width:100%}
p,h1,h2{margin:0}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
[hidden]{display:none!important}
.ico{width:1rem;height:1rem;flex-shrink:0}
.section{width:100%;max-width:80rem;margin-inline:auto;padding-inline:1.25rem}
@media(min-width:64rem){.section{padding-inline:3.75rem}}
.pretitle{font-size:.625rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:color-mix(in oklab,var(--foreground) 50%,transparent)}
.h-lg{font-size:1.875rem;font-weight:500;line-height:1;letter-spacing:-.025em;text-wrap:balance}
@media(min-width:48rem){.h-lg{font-size:2.25rem}}
.richtext{display:flex;flex-direction:column;gap:1rem;color:var(--muted-foreground)}
.richtext h1{color:var(--foreground)}
.richtext p{font-size:1rem}
.t16m{font-size:1rem;font-weight:500;color:var(--foreground)}
.t14{font-size:.875rem}.muted{color:var(--muted-foreground)}.tnum{font-variant-numeric:tabular-nums}
.label10{font-size:.625rem;font-weight:500;letter-spacing:.05em;text-transform:uppercase;color:var(--muted-foreground)}
.btn{display:inline-flex;height:2rem;align-items:center;justify-content:center;gap:.5rem;border-radius:9999px;border:1px solid color-mix(in oklab,var(--foreground) 20%,transparent);padding-inline:.75rem;font-size:.875rem;font-weight:500;white-space:nowrap;transition:background-color .25s,color .25s}
.btn:hover{background:var(--foreground);color:var(--background)}
.btn[disabled]{opacity:.5;pointer-events:none}
.g-wrap{display:flex;flex-direction:column;gap:4rem;padding-block:4rem}
.g-group{display:flex;flex-direction:column;gap:1.5rem}
.g-item{display:flex;flex-direction:column;gap:1rem}
.g-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:1rem}
.g-head-text{display:flex;flex-direction:column;gap:.25rem}
.g-save .g-ico{transform:rotate(90deg)}
.g-stage{width:100%;max-width:40rem}
.g-stage.wide{max-width:56rem;padding:2.5rem 2rem;border-radius:var(--radius-lg);background:var(--muted);box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}
.g-out{display:flex;flex-direction:column;gap:.75rem;border-radius:var(--radius-lg);border:1px solid var(--border);background:var(--card-muted);padding:1rem;font-size:.875rem;color:var(--muted-foreground)}
.g-out img{width:100%;max-width:32rem;height:auto;border-radius:var(--radius-md);box-shadow:var(--shadow-card)}
.g-out b{font-weight:500;color:var(--foreground)}
/* export mode: the site draws the outer hairline and the rounded corners in code (hero: border
   foreground/10 + rounded-lg; split rows: the card-frame inset hairline), so the PNG ships without them */
.exporting .stage,.exporting .dash-frame,.exporting .composite .dash-frame{border-radius:0}
.exporting .stage::after,.exporting .dash-frame::after{display:none}
"""

EXPORT_JS = r"""
(function(){
  async function saveBlob(dataUrl, name){
    var downloads=null;try{if(window.claude&&window.claude.use){downloads=await window.claude.use('downloads')}}catch(e){downloads=null}
    if(downloads){var bin=atob(dataUrl.split(',')[1]),arr=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);var blob=new Blob([arr],{type:'image/png'});try{await downloads.save({filename:name,data:blob});return 'saved'}catch(e){return e&&e.code==='declined'?'declined':'failed'}}
    var a=document.createElement('a');a.href=dataUrl;a.download=name;document.body.appendChild(a);a.click();a.remove();return 'browser'}
  document.querySelectorAll('.g-save').forEach(function(btn){btn.addEventListener('click',async function(){
    var item=btn.closest('.g-item'),stage=item.querySelector('.g-stage').firstElementChild,out=item.querySelector('.g-out');
    var W=+item.dataset.w,H=+item.dataset.h,name='meridian-'+item.dataset.slug+'-'+W+'x'+H+'.png';
    btn.disabled=true;out.hidden=false;out.innerHTML='Rendering '+W+'×'+H+'…';
    try{
      if(!window.htmlToImage)throw new Error('html-to-image did not load (offline?)');
      await document.fonts.ready;
      // Fonts come from the page's own stylesheet (all data: URIs), so nothing is fetched.
      var fontCss='';for(const sheet of document.styleSheets){try{for(const rule of sheet.cssRules){if(rule instanceof CSSFontFaceRule)fontCss+=rule.cssText+'\n'}}catch(e){}}
      // Render at a fixed design width so the panel is exactly 4:3 (or the hero ratio) whatever the window size.
      var frame=item.querySelector('.g-stage'),prevW=frame.style.width,prevMax=frame.style.maxWidth,designW=W/2;
      frame.style.width=designW+'px';frame.style.maxWidth='none';frame.classList.add('exporting');await new Promise(function(r){setTimeout(r,80)});
      var box=stage.getBoundingClientRect(),ratioOff=Math.abs(box.width/box.height-W/H)>0.01;
      var opts={pixelRatio:2,cacheBust:false,fontEmbedCSS:fontCss};
      if(!ratioOff){opts.pixelRatio=1;opts.canvasWidth=W;opts.canvasHeight=H}
      var dataUrl;try{dataUrl=await htmlToImage.toPng(stage,opts)}finally{frame.style.width=prevW;frame.style.maxWidth=prevMax;frame.classList.remove('exporting')}
      out.innerHTML='';var img=new Image();img.src=dataUrl;img.alt=name;
      await new Promise(function(r){img.onload=r;img.onerror=r});
      var p=document.createElement('p');out.appendChild(p);out.appendChild(img);var how=await saveBlob(dataUrl,name);
      p.innerHTML='<b>'+name+'</b> · '+img.naturalWidth+'×'+img.naturalHeight+' px. '+(ratioOff?'The panel is taller than '+W+'×'+H+' at this size, so the file keeps its real proportions. ':'')+(how==='saved'?'Saved. ':how==='declined'?'Save cancelled. ':'')+'You can also right-click the preview and choose “Save image as…”.';
    }catch(e){out.innerHTML='Could not render: '+(e&&e.message?e.message:e)}
    btn.disabled=false;
  })});
})();
"""

LIB = '<script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js"></script>'


def gallery_item(title, sub, fn):
    wide = title in mocks.WIDE
    sixteen = title in mocks.SIXTEEN_NINE
    target_w, target_h = (2880, 1605) if sixteen else (1360, 1020)
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    # 4:3 panels come in two alignments, one per side of the split row (the page alternates).
    if sixteen:
        variants = [("", "", fn())]
    else:
        variants = [("right", "Screen flush right (image on the right of the row)", fn(align="right")),
                    ("left", "Screen flush left (image on the left of the row)", fn(align="left"))]
    blocks = ""
    for key, label, markup in variants:
        slug = f"{base}-{key}" if key else base
        blocks += f"""<div class="g-item" data-slug="{slug}" data-w="{target_w}" data-h="{target_h}">
      <div class="g-head"><div class="g-head-text">{f'<p class="t14 muted">{esc(label)}</p>' if label else ''}</div>
        <button type="button" class="btn g-save">{ico("arrow-right", "ico g-ico")}Save PNG <span class="muted tnum">{target_w}×{target_h}</span></button></div>
      <div class="g-stage{" wide" if wide else ""}" id="stage-{slug}">{markup}</div>
      <output class="g-out" hidden></output>
    </div>"""
    return f'<section class="g-group"><div class="g-head-text"><p class="t16m">{esc(title)}</p><p class="t14 muted">{esc(sub)}</p></div>{blocks}</section>'


def main():
    os.makedirs(OUT, exist_ok=True)
    items = "".join(gallery_item(title, sub, fn) for title, sub, fn in mocks.GALLERY)
    body = (
        '<main class="section g-wrap"><div class="richtext" style="max-width:36rem"><p class="pretitle">Meridian design system</p>'
        '<h1 class="h-lg">Product mocks</h1><p>Product screens for the marketing site, rendered on the product tokens and placed on '
        'the tinted dune panel from the Figma split sections. Save PNG renders a panel at the size the Sanity assets use, without '
        'the outer hairline or rounded corners: the site adds those in code, so the PNG must not carry its own. '
        'How to add a screen: docs/guides/product-mocks.md.</p></div>'
        f"{items}</main>"
    )
    css = PAGE_CSS + product.PRODUCT_CSS + mocks.MOCK_CSS + dashboard.DASH_CSS
    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Meridian Product Mocks</title>
<style>{css}</style>
</head>
<body>
{body}
{LIB}
<script>{dashboard.DASH_JS}{EXPORT_JS}</script>
</body>
</html>"""
    path = os.path.join(OUT, "index.html")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(page)
    print(f"wrote {os.path.relpath(path, REPO)} ({len(page) // 1024} KB, {sum(2 if t not in mocks.SIXTEEN_NINE else 1 for t, _, _ in mocks.GALLERY)} panels)")


if __name__ == "__main__":
    main()
