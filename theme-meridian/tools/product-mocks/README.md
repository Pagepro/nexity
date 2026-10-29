# Product mocks generator

HTML mocks of the Meridian product, rendered in the browser and saved as the PNGs the
marketing site shows in the hero, the split sections and the CTA. How to use it,
the rules, and how to add a screen: [`docs/guides/product-mocks.md`](../../docs/guides/product-mocks.md).

```bash
pnpm mocks:build                       # → tools/product-mocks/out/index.html (git-ignored)
node tools/product-mocks/extract-icons.mjs <lucide-name>   # add an icon to icons.json
```

| File | What |
|---|---|
| `build.py` | Assembles the gallery page (fonts, tokens, screens, Save PNG export). Python 3 standard library only. |
| `product.py` | Product UI tokens and atoms (the designer's dashboard build: Inter, Stone, `#e58849`). Used inside screens. |
| `mocks.py` | The screens, the tinted dune panel (`stage`), the annotation pins, the `GALLERY` list. |
| `dashboard.py` | The full product dashboard (hero, CTA) with the optional in-app notification. |
| `icons.json` | Lucide icon bodies used by the screens, extracted from `web/node_modules/lucide-react`. |
| `assets/` | Dune backdrop, Meridian mark, three integration logos (invented vendors), avatar, Inter variable font. Mona Sans comes from `web/src/styles/fonts/`. |
