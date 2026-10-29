# Product UI tokens: the Meridian app as the designer built it (meridian-dash,
# app/globals.css + components/dashboard/*). Every mock screen and the dashboard
# render inside `.app`, which pins these tokens so the marketing palette (and its
# `.dark` inversion) never leaks into product imagery. The marketing site's own
# tokens live in web/src/styles/app.css and are NOT used inside screens.

PRODUCT_FONT_LINK = ''  # Inter is embedded as a data: @font-face (see build.py INTER_FACE), no network needed

PRODUCT_CSS = r"""
/* ── product UI scope (meridian-dash tokens: Tailwind stone + #e58849 primary) ── */
.app{
  --p-bg:#ffffff;--p-fg:#0c0a09;--p-card:#ffffff;--p-card-fg:#1c1917;
  --p-muted:#f5f5f4;--p-muted-fg:#78716c;--p-secondary:#f5f5f4;--p-accent:#e7e5e4;
  --p-border:#e7e5e4;--p-ring:#d6d3d1;--p-primary:#e58849;
  --p-success:#059669;--p-success-500:#10b981;--p-warning:#d97706;--p-warning-500:#f59e0b;
  --p-danger:#b91c1c;--p-danger-bg:#fef2f2;
  --p-radius:.625rem;
  font-family:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:.875rem;line-height:1.4;color:var(--p-fg);background:var(--p-bg);
  -webkit-font-smoothing:antialiased;font-feature-settings:"cv11","ss01";
}
.app *{box-sizing:border-box;min-width:0}
.app p,.app h3,.app h4{margin:0}
.app .ico{width:1rem;height:1rem;flex-shrink:0}
.app .mono{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}
.app .lbl{font-size:.625rem;font-weight:500;letter-spacing:.05em;text-transform:uppercase;color:var(--p-muted-fg)}
.app .lbl11{font-size:.6875rem;font-weight:500;color:var(--p-muted-fg)}
.app .h3{font-size:.875rem;font-weight:500;color:var(--p-fg)}
.app .sub{font-size:.6875rem;color:var(--p-muted-fg)}
.app .xs{font-size:.75rem}.app .sm{font-size:.875rem}.app .t11{font-size:.6875rem}
.app .muted{color:var(--p-muted-fg)}.app .fg{color:var(--p-fg)}.app .prim{color:var(--p-primary)}
.app .succ{color:var(--p-success)}.app .warn{color:var(--p-warning)}
/* shared product atoms */
.app .pill{display:inline-flex;align-items:center;gap:.375rem;height:1.75rem;border-radius:.5rem;border:1px solid color-mix(in srgb,var(--p-border) 60%,transparent);background:color-mix(in srgb,var(--p-muted) 40%,transparent);padding-inline:.625rem;font-size:.75rem;color:var(--p-muted-fg);white-space:nowrap}
.app .pill .ico{width:.875rem;height:.875rem}
.app .pill kbd{font-family:ui-monospace,Menlo,monospace;font-size:.625rem;border:1px solid color-mix(in srgb,var(--p-border) 60%,transparent);background:var(--p-bg);border-radius:.25rem;padding:0 .375rem;color:color-mix(in srgb,var(--p-muted-fg) 70%,transparent)}
.app .flag{display:inline-flex;align-items:center;border-radius:9999px;background:var(--p-danger-bg);padding:.125rem .5rem;font-size:.6875rem;font-weight:500;color:var(--p-danger);white-space:nowrap}
.app .tag{display:inline-flex;align-items:center;gap:.25rem;font-size:.6875rem;color:var(--p-muted-fg);white-space:nowrap}
.app .tag .ico{width:.75rem;height:.75rem}
.app .winchip{display:inline-flex;min-width:2.25rem;align-items:center;justify-content:center;border-radius:.25rem;background:color-mix(in srgb,var(--p-primary) 10%,transparent);padding:.125rem .375rem;font-size:.6875rem;font-weight:500;color:var(--p-primary)}
.app .winchip.ok{background:color-mix(in srgb,var(--p-success) 10%,transparent);color:var(--p-success)}
.app .tile{display:flex;width:1.75rem;height:1.75rem;flex-shrink:0;align-items:center;justify-content:center;border-radius:.375rem;background:color-mix(in srgb,var(--p-primary) 8%,transparent);color:var(--p-primary)}
.app .tile .ico{width:.875rem;height:.875rem}
.app .metric{display:flex;flex-direction:column;gap:.5rem}
.app .metric .v{font-size:1.875rem;line-height:1.1;font-weight:400;letter-spacing:-.04em;color:var(--p-fg);font-variant-numeric:tabular-nums}
.app .metric .v.s{font-size:1.5rem}
.app .metric .d{display:flex;flex-wrap:wrap;align-items:center;gap:.125rem .375rem;font-size:.6875rem;color:var(--p-muted-fg)}
.app .metric .d>span{white-space:nowrap}
.app .metric .d b{display:inline-flex;align-items:center;gap:.25rem;font-size:.75rem;font-weight:500;color:var(--p-success-500)}
.app .metric .d .ico{width:.75rem;height:.75rem}
.app .seg{display:flex;gap:.125rem;border-radius:.5rem;background:color-mix(in srgb,var(--p-muted) 60%,transparent);padding:.125rem}
.app .seg span{border-radius:.375rem;padding:.375rem .5rem;font-size:.6875rem;font-weight:500;color:var(--p-muted-fg);white-space:nowrap}
.app .seg span.on{background:var(--p-bg);color:var(--p-fg);box-shadow:0 0 0 1px color-mix(in srgb,var(--p-border) 50%,transparent)}
.app .track{height:.375rem;border-radius:9999px;background:var(--p-muted);overflow:hidden}
.app .track span{display:block;height:100%;border-radius:9999px;background:var(--p-primary)}
.app .track.thin{height:.25rem}
.app .pavatar{display:inline-flex;flex-shrink:0;align-items:center;justify-content:center;border-radius:9999px;background:var(--p-muted);font-size:.75rem;font-weight:500;color:var(--p-fg)}
.app .chart text{font-family:"Inter",system-ui,sans-serif;font-size:10px;fill:rgba(0,0,0,.35)}
.app table{width:100%;border-collapse:collapse}
.app th{padding:0 0 .75rem;text-align:right;font-size:.6875rem;font-weight:500;color:var(--p-muted-fg)}
.app th:first-child,.app td:first-child{text-align:left}
.app td{border-top:1px solid color-mix(in srgb,var(--p-border) 50%,transparent);padding:.75rem 0 .75rem .75rem;text-align:right;font-size:.75rem;font-variant-numeric:tabular-nums}
.app td:first-child{padding-left:0}
.app td.num{font-family:ui-monospace,"SF Mono",Menlo,monospace;color:var(--p-muted-fg)}
.app td.num.fg{color:color-mix(in srgb,var(--p-fg) 80%,transparent)}
.app td.val{font-weight:500;color:var(--p-fg)}
.app .asset{display:flex;align-items:center;gap:.75rem;font-size:.875rem;color:var(--p-fg)}
.app .asset .up{width:.75rem;height:.75rem;color:var(--p-success)}
.app .asset span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
"""
