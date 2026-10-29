# Product mock screens: each one is a screen of the real Meridian app rendered
# on the product tokens from product.py (Inter, stone, #e58849 primary, emerald
# deltas), placed on the tinted dune panel the marketing site shows behind
# product imagery. The panel (`stage`) and the numbered annotation pins stay on
# the marketing design system. Imported by build.py, which injects the helpers
# through `setup()`. To add a screen, see docs/guides/product-mocks.md.

G = {}


def setup(**kw):
    G.update(kw)


def ico(n, c="ico"):
    return G["ico"](n, c)


def esc(t):
    return G["esc"](t)


MOCK_CSS = r"""
/* ── marketing-side chrome around product imagery: stage + annotation pins ── */
.stage{position:relative;isolation:isolate;display:grid;width:100%;overflow:hidden;border-radius:var(--radius-lg);background:var(--stage-tint);padding:0 0 0 2.5rem;--stage-tint:var(--accent-peach)}
.stage.tint-sage{--stage-tint:var(--accent-sage)}.stage.tint-rose{--stage-tint:var(--accent-rose)}
.stage::before{content:"";position:absolute;inset:0;z-index:-2;background:var(--bg-stage) center 70%/cover no-repeat;opacity:.45;filter:saturate(.35) contrast(.8)}
.stage .tint{position:absolute;inset:0;z-index:-1;background:var(--stage-tint);mix-blend-mode:hard-light}
.stage::after{content:"";position:absolute;inset:0;z-index:10;pointer-events:none;border-radius:var(--radius-lg);box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}
.stage-ratio{grid-area:1/1;width:calc(100% + 2.5rem);aspect-ratio:4/3;pointer-events:none;margin-left:-2.5rem}
.stage .mock-wrap{grid-area:1/1;align-self:center;padding-block:2.5rem}
.mock-wrap{position:relative;width:100%}
.mock-wrap .app.screen{border-top-right-radius:0;border-bottom-right-radius:0;border-right:0;box-shadow:0 20px 25px -5px rgba(0,0,0,.12),0 8px 10px -6px rgba(0,0,0,.12)}
.stage.bleed{display:block;aspect-ratio:4/3;padding:0}
.stage.bleed .mock-wrap{position:absolute;top:2.5rem;left:2.5rem;width:calc(100% + 4rem);padding:0}
.stage.bleed .dash-frame{aspect-ratio:16/9;border-radius:var(--radius-md) 0 0 0;box-shadow:0 20px 25px -5px rgba(0,0,0,.12),0 8px 10px -6px rgba(0,0,0,.12)}
.stage.bleed .dash-frame::after{border-radius:var(--radius-md) 0 0 0}
.stage.left{padding:0 2.5rem 0 0}
.stage.left .stage-ratio{margin-left:0;margin-right:-2.5rem}
.stage.left .mock-wrap .app.screen{border-radius:0 calc(var(--p-radius) + 4px) calc(var(--p-radius) + 4px) 0;border-right:1px solid var(--p-border);border-left:0}
.stage.bleed.left .mock-wrap{left:auto;right:2.5rem}
.stage.bleed.left .dash-frame,.stage.bleed.left .dash-frame::after{border-radius:0 var(--radius-md) 0 0}
.stage.tall .stage-ratio{display:none}
.pin{position:absolute;z-index:3;display:inline-flex;align-items:center;gap:.5rem;border-radius:9999px;background:var(--foreground);color:var(--background);padding:.1875rem .75rem .1875rem .1875rem;font-size:.75rem;font-weight:500;white-space:nowrap;box-shadow:0 0 0 2px var(--background),0 10px 15px -3px rgba(0,0,0,.18),0 4px 6px -4px rgba(0,0,0,.18)}
.pin.flip{flex-direction:row-reverse;padding:.1875rem .1875rem .1875rem .75rem}
.pin-n{display:inline-flex;width:1.25rem;height:1.25rem;flex-shrink:0;align-items:center;justify-content:center;border-radius:9999px;background:var(--background);color:var(--foreground);font-size:.6875rem;font-weight:500;font-variant-numeric:tabular-nums}
.pin-l{color:var(--background)}
/* ── product screen frame (an app panel: white card, stone border, soft shadow) ── */
.app.screen{display:flex;flex-direction:column;border-radius:calc(var(--p-radius) + 4px);border:1px solid var(--p-border);background:var(--p-card);box-shadow:0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.04);overflow:hidden}
.app .s-head{display:flex;height:3rem;align-items:center;justify-content:space-between;gap:1rem;border-bottom:1px solid var(--p-border);padding-inline:1.25rem}
.app .s-title{display:flex;align-items:center;gap:.5rem;font-size:.875rem;font-weight:500;color:var(--p-fg);white-space:nowrap}
.app .s-title svg{width:.875rem;height:.875rem;color:var(--p-primary)}
.app .s-body{display:flex;flex-direction:column;gap:1rem;padding:1.125rem 1.25rem 1.25rem}
.app .row{display:flex;align-items:center;gap:.75rem}
.app .row .grow{flex:1;min-width:0}
.app .ell{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.app .vstack{display:flex;flex-direction:column;gap:.5rem}
.app .rule{border-top:1px solid color-mix(in srgb,var(--p-border) 50%,transparent);padding-top:.75rem}
.app .metrics{display:flex;flex-wrap:wrap;gap:1rem 1.25rem}
.app .metrics .metric{flex:1 1 7.5rem}
.app .vsep{width:1px;align-self:stretch;background:var(--p-border)}
.app .area{display:block;width:100%;height:6.5rem}
.app .hbar{display:flex;align-items:center;gap:.625rem;font-size:.75rem}
.app .hbar .lab{width:7.5rem;flex-shrink:0;color:var(--p-muted-fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.app .hbar .track{flex:1}
.app .hbar .val{width:2.75rem;text-align:right;color:var(--p-fg)}
.app .ratio{display:flex;height:.375rem;gap:.125rem;overflow:hidden;border-radius:9999px}
.app .ratio span:first-child{background:var(--p-primary);border-radius:9999px}
.app .ratio span:last-child{flex:1;background:var(--p-muted);border-radius:9999px}
.app .speaker{display:flex;align-items:flex-start;gap:.625rem;font-size:.8125rem;line-height:1.45;color:var(--p-fg)}
.app .speaker .lbl{width:4rem;flex-shrink:0;padding-top:.125rem;font-family:ui-monospace,Menlo,monospace;letter-spacing:.06em}
.app .coach{display:flex;gap:.625rem;align-items:flex-start;border-radius:.625rem;border:1px solid color-mix(in srgb,var(--p-primary) 25%,transparent);background:color-mix(in srgb,var(--p-primary) 8%,transparent);padding:.5625rem .75rem}
.app .coach .ico{margin-top:.125rem;width:.8125rem;height:.8125rem;color:var(--p-primary)}
.app .coach .lbl{color:var(--p-primary);font-family:ui-monospace,Menlo,monospace;font-weight:600;letter-spacing:.06em}
.app .coach p{font-size:.8125rem;line-height:1.45;color:var(--p-fg)}
.app .sig{display:flex;align-items:center;gap:.75rem;border-radius:.625rem;border:1px solid transparent;padding:.5625rem .625rem}
.app .sig.hot{border-color:color-mix(in srgb,var(--p-primary) 30%,transparent);background:color-mix(in srgb,var(--p-primary) 6%,transparent)}
.app .sig .co{display:flex;flex:1;min-width:0;flex-direction:column;gap:.125rem}
.app .sig .co .name{font-size:.8125rem;font-weight:500;color:var(--p-fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.app .sig .co .amt{font-size:.75rem;font-weight:500;color:var(--p-primary);font-family:ui-monospace,Menlo,monospace}
.app .health{display:flex;width:4.5rem;flex-shrink:0;flex-direction:column;gap:.25rem}
.app .health .lbl{font-family:ui-monospace,Menlo,monospace;letter-spacing:.06em}
.app .conn{display:flex;align-items:center;gap:.75rem}
.app .logo-box{display:flex;width:2rem;height:2rem;flex-shrink:0;align-items:center;justify-content:center;overflow:hidden;border-radius:.5rem;border:1px solid var(--p-border);background:var(--p-muted);font-size:.75rem;font-weight:500;color:var(--p-fg)}
.app .logo-box img{width:100%;height:100%;object-fit:contain;padding:.375rem}
.app .status{display:inline-flex;align-items:center;gap:.375rem;font-size:.6875rem;font-weight:500;color:var(--p-success)}
.app .status::before{content:"";width:.375rem;height:.375rem;border-radius:9999px;background:currentColor}
.app .nudge{display:flex;align-items:flex-start;gap:.4375rem;font-size:.75rem;line-height:1.5;color:var(--p-muted-fg)}
.app .nudge .ico{margin-top:.125rem;width:.8125rem;height:.8125rem}
.app .risk{display:inline-flex;align-items:center;border-radius:.375rem;background:var(--p-muted);padding:.1875rem .5rem;font-family:ui-monospace,Menlo,monospace;font-size:.6875rem;font-weight:600;color:var(--p-primary)}
.app .risk.ok{color:var(--p-success)}
/* marketing integrations grid logo box */
.logo-box{position:relative;display:flex;width:2.5rem;height:2.5rem;flex-shrink:0;align-items:center;justify-content:center;overflow:hidden;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--background);font-size:.875rem;font-weight:500;color:var(--foreground)}
.logo-box img{width:100%;height:100%;object-fit:contain;padding:.5rem}
/* hero composite (marketing chrome) */
.composite{position:relative;aspect-ratio:2880/1605;width:100%;max-width:64rem}
.composite .dash-frame{position:absolute;inset:0}

@media(max-width:40rem){.pin{font-size:.6875rem}.stage{padding:0 0 0 1.25rem}.stage-ratio{width:calc(100% + 1.25rem);margin-left:-1.25rem}.stage .mock-wrap{padding-block:1.5rem}.stage.bleed{padding:0}.stage.bleed .mock-wrap{top:1.5rem;left:1.25rem;padding:0}.stage.left{padding:0 1.25rem 0 0}.stage.left .stage-ratio{margin-right:-1.25rem}.stage.bleed.left .mock-wrap{left:auto;right:1.25rem}}
"""


def mark():
    return f'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="{G["MARK_PATH"]}"/></svg>'


def frame(title, badge, body, badge_kind="pill"):
    if badge:
        b = f'<span class="flag">{esc(badge)}</span>' if badge_kind == "flag" else f'<span class="pill">{esc(badge)}</span>'
    else:
        b = ""
    return f'<div class="app screen"><div class="s-head"><span class="s-title">{mark()}{esc(title)}</span>{b}</div><div class="s-body">{body}</div></div>'


def pin(n, label, style, flip=False):
    return f'<span class="pin{" flip" if flip else ""}" style="{style}"><span class="pin-n">{n}</span><span class="pin-l">{esc(label)}</span></span>'


def mirror_pin(p):
    """Swap the pin to the other side: left<->right offsets and the flip class."""
    p = p.replace("left:", "\0").replace("right:", "left:").replace("\0", "right:")
    return p.replace('class="pin flip"', '\0').replace('class="pin"', 'class="pin flip"').replace('\0', 'class="pin"')


def stage(mock_html, pins=(), tall=False, tint="peach", bleed=False, align="right"):
    if align == "left":
        pins = [mirror_pin(p) for p in pins]
    cls = "stage" + (" tall" if tall else "") + (" bleed" if bleed else "") + (" left" if align == "left" else "") + (f" tint-{tint}" if tint != "peach" else "")
    return f'<div class="{cls}"><span class="tint" aria-hidden="true"></span><span class="stage-ratio" aria-hidden="true"></span><div class="mock-wrap">{mock_html}{"".join(pins)}</div></div>'


def metric(label, value, delta, small=True):
    return (f'<div class="metric"><span class="lbl">{esc(label)}</span><span class="v{" s" if small else ""}">{esc(value)}</span>'
            f'<span class="d"><b>{ico("trending-up")}{esc(delta)}</b><span>vs last quarter</span></span></div>')


def area(data, height=110):
    w, h, pad = 1000, height, 6
    mx = max(data) * 1.15
    x = lambda i: (i / (len(data) - 1)) * (w - pad * 2) + pad
    y = lambda v: h - (v / mx) * (h - 16) - 8
    d = f"M {x(0):.1f} {y(data[0]):.1f}"
    for i in range(1, len(data)):
        xc = (x(i - 1) + x(i)) / 2
        d += f" C {xc:.1f} {y(data[i-1]):.1f} {xc:.1f} {y(data[i]):.1f} {x(i):.1f} {y(data[i]):.1f}"
    ar = d + f" L {x(len(data)-1):.1f} {h} L {x(0):.1f} {h} Z"
    return (f'<svg class="area" viewBox="0 0 {w} {h}" preserveAspectRatio="none" aria-hidden="true">'
            f'<defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e58849" stop-opacity=".18"/><stop offset="1" stop-color="#e58849" stop-opacity="0"/></linearGradient></defs>'
            f'<path d="{ar}" fill="url(#mg)"/><path d="{d}" fill="none" stroke="#e58849" stroke-width="2.5" stroke-linecap="round"/></svg>')


def hbar(label, pct, value):
    return f'<div class="hbar"><span class="lab">{esc(label)}</span><span class="track"><span style="width:{pct}%"></span></span><span class="val mono">{esc(value)}</span></div>'


def tag(icon, label):
    return f'<span class="pill" style="height:1.5rem;padding-inline:.5625rem;font-size:.6875rem;font-weight:500;color:var(--p-muted-fg)">{ico(icon)}{esc(label)}</span>'


# ───────── individual screens ─────────
def conversation(pins=True, align="right"):
    body = f"""
      <div class="row"><span class="pavatar" style="width:2.125rem;height:2.125rem">SC</span><span class="grow vstack" style="gap:.0625rem"><span class="sm" style="font-weight:500">Discovery call · 32 min</span><span class="sub">Sarah Chen with Acme Corp</span></span>{tag("file-text", "Transcribed")}</div>
      <div class="vstack" style="gap:.4375rem"><div class="row" style="justify-content:space-between"><span class="lbl mono">Talk ratio</span><span class="lbl mono">Rep 43% · Prospect 57%</span></div><div class="ratio"><span style="width:43%"></span><span></span></div></div>
      <div class="vstack">
        <div class="speaker"><span class="lbl">Rep</span><span>Walk me through how the team measures pipeline today.</span></div>
        <div class="speaker"><span class="lbl">Prospect</span><span>Honestly? Spreadsheets. Nobody trusts the CRM report.</span></div>
        <div class="coach">{ico("flag")}<div class="vstack" style="gap:.1875rem"><span class="lbl">Coaching moment · 14:22</span><p>“What would the security review timeline look like on your side?”</p></div></div>
      </div>"""
    p = [pin(1, "Talk-pattern scoring", "top:6.75rem;right:.75rem", True), pin(2, "Coaching moments flagged", "bottom:1.625rem;left:-.875rem")] if pins else []
    return stage(frame("Call review — Acme Corp", "Score 82", body), p, align=align)


def dashboards(pins=True, align="right"):
    body = f"""
      <div class="metrics">{metric("Win rate", "34.2%", "+5.1%")}<span class="vsep"></span>{metric("Total pipeline", "$3.6M", "+12.3%")}<span class="vsep"></span>{metric("Avg deal cycle", "32 days", "-3 days")}</div>
      <div class="vstack rule"><div class="row" style="justify-content:space-between"><span class="xs" style="font-weight:500">Performance trend</span><span class="lbl mono">12-month rolling</span></div>{area([27,28,26,29,33,31,28,34,30,33,36,35])}</div>
      <div class="vstack rule"><span class="xs" style="font-weight:500">Top content by pipeline</span>{hbar("ROI Calculator", 92, "$680K")}{hbar("Case Study", 70, "$520K")}{hbar("Demo Video", 55, "$410K")}</div>"""
    p = [pin(1, "Prebuilt board pack", "top:5.5rem;left:-.875rem"), pin(2, "Scheduled reports", "top:1.625rem;right:.75rem", True)] if pins else []
    return stage(frame("Board pack — Q2 2026", "Scheduled weekly", body), p, tint="sage", align=align)


def signals(pins=True, align="right"):
    rows = [("Acme Corp Enterprise", "$125K", "ghost", "Champion dark", 42, True),
            ("TechStart Series B", "$89K", "swords", "Competitor mention", 55, False),
            ("Global Finance Ltd", "$210K", "clock", "No activity 21d", 38, False),
            ("HealthTech Pro", "$67K", "user-minus", "Champion left", 47, False)]
    body = "".join(f"""
      <div class="sig{' hot' if hot else ''}"><div class="co"><span class="name">{esc(co)}</span><span class="amt">{amt}</span></div>{tag(icon, flag)}<div class="health"><span class="lbl">Health {h}</span><span class="track thin"><span style="width:{h}%"></span></span></div></div>"""
                   for co, amt, icon, flag, h, hot in rows)
    body = f'<div class="vstack" style="gap:.25rem;margin:-.25rem">{body}</div>'
    p = [pin(1, "Churn signal", "top:3.75rem;right:.75rem", True), pin(2, "Account health scoring", "bottom:2.5rem;left:-.875rem")] if pins else []
    return stage(frame("Pipeline signals", "5 flagged", body, "flag"), p, tint="rose", align=align)


def winloss(pins=True, align="right"):
    body = f"""
      <div class="metrics">{metric("Surveys completed", "86%", "+11%")}<span class="vsep"></span>{metric("Calls analyzed", "1,204", "+18%")}</div>
      <div class="vstack rule"><span class="xs" style="font-weight:500">Top loss reasons</span>{hbar("Pricing fit", 80, "34%")}{hbar("Champion left", 52, "22%")}{hbar("Security review", 42, "18%")}{hbar("Feature gap", 28, "12%")}</div>"""
    p = [pin(1, "AI call analysis", "top:5.5rem;right:.75rem", True), pin(2, "Loss-reason taxonomy", "bottom:2.125rem;left:-.875rem")] if pins else []
    return stage(frame("Win/loss review — Q2 2026", "128 deals analyzed", body), p, align=align)


def attribution(pins=True, align="right"):
    rows = [("calculator", "Enterprise ROI Calculator", "1,240", "28", "$680K", "42%", True),
            ("file-text", "Customer Success Case Study", "892", "22", "$520K", "38%", True),
            ("video", "Product Demo Video", "756", "19", "$410K", "35%", False),
            ("book-open", "Industry Whitepaper", "534", "14", "$280K", "31%", False)]
    body = "".join(f'<tr><td><span class="asset"><span class="tile">{ico(icon)}</span><span>{esc(name)}</span>{ico("arrow-up-right", "ico up") if up else ""}</span></td><td class="num">{v}</td><td class="num fg">{d}</td><td class="val">{p}</td><td><span class="winchip">{w}</span></td></tr>'
                   for icon, name, v, d, p, w, up in rows)
    body = f'<table><thead><tr><th>Asset</th><th>Views</th><th>Deals</th><th>Pipeline</th><th>Win %</th></tr></thead><tbody>{body}</tbody></table>'
    p = [pin(1, "Content-to-pipeline mapping", "top:6.25rem;left:-.875rem"), pin(2, "Win-rate lift per asset", "bottom:1.875rem;right:.75rem", True)] if pins else []
    return stage(frame("Content attribution — Q2 2026", "Multi-touch", body), p, tint="sage", align=align)


def sync(pins=True, align="right"):
    rows = [("Cumulo", "Two-way sync · 2m ago", "Synced"), ("Callwell", "Call import · 12m ago", "Synced"),
            ("Frostbase", "Warehouse export · 1h ago", "Synced"), ("Relay", "Deal alerts · live", "Live")]
    body = ""
    logos = G["INTEGRATION_LOGOS"]
    for i, (name, note, state) in enumerate(rows):
        logo = f'<img src="{G["data_uri"](G["A"](logos[name]), "image/svg+xml")}" alt="">' if name in logos else f'<span aria-hidden="true">{name[0]}</span>'
        body += f'<div class="conn{" rule" if i else ""}"><span class="logo-box">{logo}</span><span class="grow vstack" style="gap:.0625rem"><span class="xs" style="font-weight:500;font-size:.8125rem">{esc(name)}</span><span class="sub">{esc(note)}</span></span><span class="status">{state}</span></div>'
    body = f'<div class="vstack" style="gap:.6875rem">{body}</div>'
    p = [pin(1, "Two-way CRM sync", "top:3.875rem;left:-.875rem"), pin(2, "No engineering required", "bottom:2.125rem;right:.75rem", True)] if pins else []
    return stage(frame("Connections", "12 active", body), p, tint="rose", align=align)


def sales(pins=False, align="right"):
    rows = [("Northwind Cloud", "Proposal", 78, "Send the ROI calculator — 3 similar deals closed after it."),
            ("Brightline Media", "Discovery", 34, "Champion hasn't opened the deck in 9 days."),
            ("Coreline Systems", "Negotiation", 61, "Loop in security early — review stalled 2 similar deals.")]
    body = "".join(f"""
      <div class="vstack{' rule' if i else ''}" style="gap:.4375rem"><div class="row"><span class="grow sm ell" style="font-weight:500;font-size:.8125rem">{esc(co)}</span>{tag("layers", stage_)}<span class="risk{' ok' if risk > 55 else ''}">{risk}</span></div><p class="nudge">{ico("corner-down-right")}{esc(nudge)}</p></div>"""
                   for i, (co, stage_, risk, nudge) in enumerate(rows))
    body = f'<div class="vstack" style="gap:.6875rem">{body}</div>'
    return stage(frame("My pipeline — this week", "Risk-scored", body), [], align=align)


def hero_composite():
    return f"""
    <div class="composite">
      {G["DASH_TOAST"]}
      {pin(1, "Win/loss intelligence", "top:13%;left:1.625rem")}
      {pin(2, "Content attribution", "bottom:17%;left:38%")}
      {pin(3, "Pipeline signals", "top:38%;right:1.625rem", True)}
    </div>"""


DIVES = {"conversation": conversation, "dashboards": dashboards, "signals": signals,
         "winloss": winloss, "attribution": attribution, "integrations": sync}
TABS = {"sales": lambda: sales(), "marketing": lambda: attribution(pins=False), "revops": lambda: sync(pins=False)}

# Gallery items rendered wide (56rem) and the ones exported at the hero size (2880×1605).
WIDE = ("Dashboard", "Dashboard on the Figma panel", "Hero composite")
SIXTEEN_NINE = ("Dashboard", "Hero composite")

GALLERY = [
    ("Dashboard", "The product dashboard, Q4 2025 — sidebar, metrics strip, performance trend, content attribution, at-risk deals and the intelligence feed.", lambda: G["DASH"]),
    ("Dashboard on the Figma panel", "The dashboard composed the way the split sections place it: offset from the corner, bleeding off the far edge and the bottom, on the tinted dune backdrop.", lambda align="right": stage(G["DASH"], bleed=True, tint="sage", align=align)),
    ("Hero composite", "Annotated dashboard with three callouts and an in-app pipeline-signal notification.", hero_composite),
    ("Conversation Intelligence", "Call review — Acme Corp", conversation),
    ("Revenue Dashboards", "Board pack — Q2 2026", dashboards),
    ("Pipeline Signals", "Pipeline signals list with health scores", signals),
    ("Win/Loss Intelligence", "Win/loss review — Q2 2026", winloss),
    ("Content Attribution", "Content attribution table", attribution),
    ("Integrations", "Connections / sync status", sync),
    ("For Sales (tab)", "My pipeline — this week, risk-scored with nudges", sales),
]
