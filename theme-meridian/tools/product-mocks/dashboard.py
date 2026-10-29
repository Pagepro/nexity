# The Meridian product dashboard exactly as the designer built it in meridian-dash
# (sidebar, top bar, metrics strip, performance trend, content attribution,
# at-risk deals, intelligence feed), as a static mock on the product tokens from
# product.py. Laid out at a fixed 1024px design width and scaled into its frame.
G = {}


def setup(**kw):
    G.update(kw)


def ico(n, c="ico"):
    return G["ico"](n, c)


def esc(t):
    return G["esc"](t)


DASH_CSS = r"""
/* dashboard mock — fixed 1200px canvas scaled into its frame */
.dash-frame{position:relative;aspect-ratio:2880/1605;width:100%;overflow:hidden;border-radius:var(--radius-lg);background:#fff}
.dash-frame::after{content:"";position:absolute;inset:0;z-index:10;pointer-events:none;border-radius:var(--radius-lg);box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}
.app.dash{position:absolute;top:0;left:0;width:1200px;min-height:100%;display:grid;grid-template-columns:220px 1fr;transform-origin:top left;font-size:.75rem}
.dash .d-side{display:flex;flex-direction:column;gap:1.25rem;border-right:1px solid var(--p-border);background:color-mix(in srgb,var(--p-muted) 80%,transparent);padding:1.25rem .75rem}
.dash .d-logo{display:flex;align-items:center;gap:.5rem;margin-inline:.5rem;font-size:1rem;font-weight:500;letter-spacing:-.01em;color:var(--p-fg)}
.dash .d-logo svg{width:1.375rem;height:1.375rem;color:var(--p-primary)}
.dash .d-nav{display:flex;flex:1;flex-direction:column;gap:.125rem}
.dash .d-nav a,.dash .d-foot a{display:flex;align-items:center;gap:.5rem;border-radius:.5rem;padding:.625rem .75rem;font-size:.75rem;font-weight:500;color:var(--p-muted-fg)}
.dash .d-nav a.on{background:color-mix(in srgb,var(--p-accent) 50%,transparent);color:var(--p-fg)}
.dash .d-nav .ico,.dash .d-foot .ico{width:1rem;height:1rem}
.dash .d-foot{display:flex;flex-direction:column;gap:.125rem}
.dash .d-main{display:flex;flex-direction:column;min-width:0}
.dash .d-top{display:flex;height:3.75rem;align-items:center;justify-content:space-between;border-bottom:1px solid var(--p-border);padding-inline:1.5rem}
.dash .d-crumb{display:flex;align-items:center;gap:.5rem;font-size:.875rem;font-weight:500}
.dash .d-crumb .sep{color:color-mix(in srgb,var(--p-muted-fg) 30%,transparent)}
.dash .d-crumb .sub{font-size:.75rem;font-weight:400;color:var(--p-muted-fg)}
.dash .d-actions{display:flex;align-items:center;gap:.25rem}
.dash .d-ib{position:relative;display:flex;width:2rem;height:2rem;align-items:center;justify-content:center;border-radius:.5rem;color:var(--p-muted-fg)}
.dash .d-ib .ico{width:.875rem;height:.875rem}
.dash .d-ib .dot{position:absolute;top:.375rem;right:.375rem;width:.3125rem;height:.3125rem;border-radius:9999px;background:var(--p-primary);box-shadow:0 0 0 1.5px var(--p-bg)}
.dash .d-div{width:1px;height:1rem;background:var(--p-border);margin-inline:.5rem}
.dash .d-avatar{width:2rem;height:2rem;border-radius:.375rem;overflow:hidden;background:var(--p-muted)}
.dash .d-avatar img{width:100%;height:100%;object-fit:cover}
.dash .d-metrics{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--p-border)}
.dash .d-metric{display:flex;flex-direction:column;gap:.5rem;padding:1.25rem 1.5rem;border-left:1px solid var(--p-border)}
.dash .d-metric:first-child{border-left:0}
.dash .d-metric .v{font-size:1.875rem;line-height:1.1;font-weight:400;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.dash .d-metric .d{display:flex;align-items:center;gap:.375rem;font-size:.6875rem;color:var(--p-muted-fg)}
.dash .d-metric .d b{display:inline-flex;align-items:center;gap:.25rem;font-size:.75rem;font-weight:500;color:var(--p-success-500)}
.dash .d-metric .d .ico{width:.75rem;height:.75rem}
.dash .d-trend{display:flex;flex-direction:column;gap:1.25rem;border-bottom:1px solid var(--p-border);padding:1.25rem 1.5rem}
.dash .d-trend-head{display:flex;align-items:flex-start;justify-content:space-between}
.dash .chart{display:block;width:100%;height:11.5rem}
.dash .d-grid{display:grid;grid-template-columns:2fr 1fr}
.dash td{padding-left:1.5rem}
.dash td:first-child{padding-left:0}
.dash .d-col-r{border-left:1px solid var(--p-border)}
.dash .d-block{display:flex;flex-direction:column;gap:1.25rem;padding:1.25rem 1.5rem}
.dash .d-block.bt{border-top:1px solid var(--p-border)}
.dash .d-head-row{display:flex;align-items:center;justify-content:space-between}
.dash .d-list{display:flex;flex-direction:column;gap:.125rem;margin-inline:-.75rem}
.dash .d-deal{display:flex;align-items:center;gap:.75rem;border-radius:.5rem;padding:.625rem .75rem}
.dash .d-deal .co{flex:1;min-width:0;display:flex;flex-direction:column;gap:.125rem}
.dash .d-deal .co .n{display:flex;align-items:center;gap:.5rem;font-size:.875rem;color:var(--p-fg)}
.dash .d-deal .co .n span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dash .d-deal .co .n b{flex-shrink:0;font-size:.75rem;font-weight:500;color:var(--p-primary);font-variant-numeric:tabular-nums}
.dash .d-deal .co .rep{font-size:.6875rem;color:var(--p-muted-fg)}
.dash .d-feed{display:flex;gap:.75rem;border-radius:.5rem;padding:.75rem}
.dash .d-feed .ico{margin-top:.125rem;width:1rem;height:1rem}
.dash .d-feed .m{font-size:.875rem;line-height:1.35;color:color-mix(in srgb,var(--p-fg) 90%,transparent)}
.dash .d-feed .meta{display:flex;gap:.5rem;margin-top:.25rem;font-size:.6875rem;color:var(--p-muted-fg)}
/* in-app notification (toast) pinned to the visible bottom-right corner of the dashboard */
.dash-frame .toast-layer{position:absolute;top:0;left:0;z-index:5;width:1200px;transform-origin:top left;pointer-events:none;background:transparent}
.toast-layer .toast{position:absolute;right:1.25rem;bottom:1.25rem;pointer-events:auto;display:flex;width:22rem;align-items:flex-start;gap:.6875rem;border-radius:.75rem;border:1px solid var(--p-border);background:var(--p-card);padding:.75rem 2.25rem .75rem .875rem;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.toast .col{display:flex;min-width:0;flex-direction:column;gap:.125rem}
.toast .ttl{font-size:.8125rem;font-weight:500;color:var(--p-fg)}
.toast .close{position:absolute;top:.5rem;right:.5rem;display:flex;width:1.5rem;height:1.5rem;align-items:center;justify-content:center;border-radius:.375rem;color:var(--p-muted-fg)}
.toast .close .ico{width:.875rem;height:.875rem}
"""

DASH_JS = r"""
(function(){
  function fit(){document.querySelectorAll('.dash-frame').forEach(function(f){var d=f.querySelector('.dash');if(!d)return;var s=f.clientWidth/1200;d.style.transform='scale('+s+')';d.style.minHeight=(f.clientHeight/s)+'px';var t=f.querySelector('.toast-layer');if(t){t.style.transform='scale('+s+')';t.style.height=(f.clientHeight/s)+'px'}})}
  fit();window.addEventListener('resize',fit);if(window.ResizeObserver){document.querySelectorAll('.dash-frame').forEach(function(f){new ResizeObserver(fit).observe(f)})}
})();
"""

TREND = [28, 30, 27, 31, 33, 29, 32, 35, 31, 34, 36, 34]
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def chart():
    w, h = 760, 184
    pl, pr, pt, pb = 34, 8, 8, 20
    lo, hi = 0, 36
    x = lambda i: pl + i * (w - pl - pr) / (len(TREND) - 1)
    y = lambda v: pt + (hi - v) / (hi - lo) * (h - pt - pb)
    d = f"M {x(0):.1f} {y(TREND[0]):.1f}"
    for i in range(1, len(TREND)):
        xc = (x(i - 1) + x(i)) / 2
        d += f" C {xc:.1f} {y(TREND[i-1]):.1f} {xc:.1f} {y(TREND[i]):.1f} {x(i):.1f} {y(TREND[i]):.1f}"
    area = d + f" L {x(len(TREND)-1):.1f} {y(lo):.1f} L {x(0):.1f} {y(lo):.1f} Z"
    grid = "".join(f'<line x1="{pl}" x2="{w-pr}" y1="{y(v):.1f}" y2="{y(v):.1f}" stroke="rgba(0,0,0,.06)"/><text x="{pl-6}" y="{y(v)+3:.1f}" text-anchor="end">{v}%</text>' for v in (0, 9, 18, 27, 36))
    ticks = "".join(f'<text x="{x(i):.1f}" y="{h-4}" text-anchor="middle">{m}</text>' for i, m in enumerate(MONTHS))
    return (f'<svg class="chart" viewBox="0 0 {w} {h}" preserveAspectRatio="none" aria-hidden="true">'
            f'<defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(202,138,3)" stop-opacity=".12"/><stop offset="1" stop-color="rgb(202,138,3)" stop-opacity="0"/></linearGradient></defs>'
            f'{grid}<path d="{area}" fill="url(#dg)"/><path d="{d}" fill="none" stroke="#e58849" stroke-width="1.5" stroke-linejoin="round"/>{ticks}</svg>')


METRICS = [("Win Rate", "34.2%", "+5.1%"), ("Total Pipeline", "$4.2M", "+12.3%"), ("Avg Deal Cycle", "32 days", "-3 days"), ("Content Revenue", "$1.8M", "+18.7%")]
ASSETS = [("calculator", "Enterprise ROI Calculator", "1,240", "28", "$680K", "42%", True),
          ("file-text", "Customer Success Case Study", "892", "22", "$520K", "38%", True),
          ("video", "Product Demo Video", "756", "19", "$410K", "35%", False),
          ("book-open", "Industry Whitepaper", "534", "14", "$280K", "31%", False),
          ("file-text", "Competitive Comparison", "421", "11", "$195K", "29%", False)]
DEALS = [("Acme Corp Enterprise", "$125K", "Sarah Chen", "ghost", "Champion dark"),
         ("TechStart Series B", "$89K", "Marcus Johnson", "swords", "Competitor"),
         ("Global Finance Ltd", "$210K", "Emily Rodriguez", "clock", "No activity 21d"),
         ("HealthTech Pro", "$67K", "David Kim", "user-x", "Champion left"),
         ("RetailMax Solutions", "$145K", "Sarah Chen", "circle-alert", "Budget concerns")]
FEED = [("calculator", "succ", "3 deals used the ROI Calculator this week", "2 are now in final stage", "2h ago"),
        ("swords", "warn", "Competitor X mentioned in 4 calls", "Up 40% from last month", "5h ago"),
        ("file-text", "prim", "Case study shared with TechStart", "Deal moved to Negotiation", "1d ago"),
        ("trending-up", "succ", "Win rate up 5.1% this quarter", "Best Q4 performance in 2 years", "1d ago"),
        ("video", "prim", "Demo video viewed 89 times", "12 new prospects engaged", "2d ago"),
        ("users", "succ", "Sarah C. closed 3 deals this week", "Highest performer this month", "2d ago"),
        ("zap", "succ", "Acme Corp renewed", "$45K ARR expansion", "3d ago")]


TOAST = None


def dashboard(toast=False):
    global TOAST
    TOAST = f'<div class="toast" role="status"><span class="tile">{ico("ghost")}</span><span class="col"><span class="lbl mono">Pipeline signal</span><span class="ttl">Champion went dark — Acme Corp</span><span class="sub">$125K · flagged 21 days before renewal</span></span><span class="close" aria-label="Dismiss">{ico("x")}</span></div>'
    nav = "".join(f'<a href="#" class="{"on" if on else ""}">{ico(i)}{l}</a>' for i, l, on in
                  (("layout-dashboard", "Dashboard", True), ("briefcase", "Deals", False), ("file-text", "Content", False), ("chart-column", "Reports", False)))
    metrics = "".join(f'<div class="d-metric"><span class="lbl">{l}</span><span class="v">{v}</span><span class="d"><b>{ico("trending-up")}{c}</b>vs last quarter</span></div>' for l, v, c in METRICS)
    rows = "".join(f'<tr><td><span class="asset"><span class="tile">{ico(i)}</span><span>{esc(n)}</span>{ico("arrow-up-right", "ico up") if up else ""}</span></td><td class="num">{v}</td><td class="num fg">{d}</td><td class="val">{p}</td><td><span class="winchip">{w}</span></td></tr>'
                   for i, n, v, d, p, w, up in ASSETS)
    deals = "".join(f'<div class="d-deal"><div class="co"><span class="n"><span>{esc(n)}</span><b>{v}</b></span><span class="rep">{r}</span></div><span class="tag">{ico(i)}{s}</span></div>' for n, v, r, i, s in DEALS)
    feed = "".join(f'<div class="d-feed">{ico(i, "ico " + k)}<div><p class="m">{esc(m)}</p><p class="meta"><span>{esc(d)}</span><span>{t}</span></p></div></div>' for i, k, m, d, t in FEED)
    mark = f'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="{G["MARK_PATH"]}"/></svg>'
    return f"""
<div class="dash-frame"><div class="app dash" aria-label="Meridian dashboard, Q4 2025">
  <aside class="d-side"><span class="d-logo">{mark}Meridian</span>
    <nav class="d-nav">{nav}</nav>
    <div class="d-foot"><a href="#">{ico("settings")}Settings</a><a href="#">{ico("log-out")}Log out</a></div>
  </aside>
  <div class="d-main">
    <div class="d-top">
      <div class="d-crumb"><span>Dashboard</span><span class="sep">/</span><span class="sub">Q4 2025</span></div>
      <div class="d-actions">
        <span class="pill" style="height:2rem;margin-right:.25rem">{ico("search")}<span>Search</span><kbd>/</kbd></span>
        <span class="d-ib">{ico("bell")}<span class="dot"></span></span>
        <span class="d-ib">{ico("moon")}</span>
        <span class="d-div"></span>
        <span class="d-avatar"><img src="{G["AVATAR"]}" alt=""></span>
      </div>
    </div>
    <div class="d-metrics">{metrics}</div>
    <div class="d-trend">
      <div class="d-trend-head"><div><p class="h3">Performance Trend</p><p class="sub" style="margin-top:.125rem">12-month rolling view</p></div><div class="seg"><span class="on">Win Rate</span><span>Pipeline</span><span>Closed Revenue</span></div></div>
      {chart()}
    </div>
    <div class="d-grid">
      <div class="d-block"><p class="h3">Content Attribution</p>
        <table><thead><tr><th>Asset</th><th>Views</th><th>Deals</th><th>Pipeline</th><th>Win %</th></tr></thead><tbody>{rows}</tbody></table>
      </div>
      <div class="d-col-r">
        <div class="d-block"><div class="d-head-row"><p class="h3">At-Risk Deals</p><span class="flag">5 flagged</span></div><div class="d-list">{deals}</div></div>
        <div class="d-block bt"><p class="h3">Intelligence Feed</p><div class="d-list">{feed}</div></div>
      </div>
    </div>
  </div>
</div>{('<div class="app toast-layer">' + TOAST + '</div>') if toast else ""}</div>"""
