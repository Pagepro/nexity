#!/usr/bin/env python3
"""brand-kit build: turn one data file into every output of a run.

    python3 build.py <run_dir>            # reads <run_dir>/kit.json and <run_dir>/BRAND.md
    python3 build.py <run_dir> --check    # checks only, writes nothing

Writes evidence.md, claims.md, gap-questionnaire.md and brand-kit.html into <run_dir>, from
html-template.html next to this script. Evidence ids, counts and links come from the data,
so they cannot drift between files. Exits 1 and writes nothing when a check fails.

Text fields in kit.json may carry three marks:
    {key|words}   a fact link to the evidence row with that key
    {v3|words}    a link to voice sample 3 (strong samples are 1..10, weak ones follow)
    [i]words[/i]  a sentence that is the author's reading, not a sourced fact
The format of kit.json is in SKILL.md, "The data file". Standard library only."""
import html
import json
import os
import re
import sys


def plugin_version(start):
    """The version of the plugin this skill ships in, from the plugin's own manifest: the
    installed copy's .claude-plugin/plugin.json, or the repository's
    .claude-plugin/marketplace.json entry that lists this skill. None when neither is
    found (a loose copy of the skill), so a report never shows a number nobody released."""
    skill = os.path.basename(start)
    folder = start
    for _ in range(5):
        folder = os.path.dirname(folder)
        base = os.path.join(folder, ".claude-plugin")
        try:
            v = json.load(open(os.path.join(base, "plugin.json"), encoding="utf8")).get("version")
            if v:
                return str(v)
        except (OSError, ValueError):
            pass
        try:
            market = json.load(open(os.path.join(base, "marketplace.json"), encoding="utf8"))
            for plugin in market.get("plugins", []):
                if any(s.rstrip("/").endswith("/" + skill) or s == skill for s in plugin.get("skills", [])):
                    return str(plugin["version"]) if plugin.get("version") else None
        except (OSError, ValueError):
            pass
    return None


STATUSES = ["unverified", "tension", "single source", "third-party", "corroborated"]
CHECK_FIRST = STATUSES[:2]
MARK = re.compile(r"\{([A-Za-z0-9_]+)\|([^{}]*)\}")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check_only = "--check" in sys.argv
    if len(args) != 1:
        sys.exit(__doc__)
    run = args[0]
    here = os.path.dirname(os.path.abspath(__file__))
    version = plugin_version(here)
    kit = json.load(open(os.path.join(run, "kit.json"), encoding="utf8"))
    brand_path = os.path.join(run, "BRAND.md")
    brand = open(brand_path, encoding="utf8").read() if os.path.exists(brand_path) else ""
    template = open(os.path.join(here, "html-template.html"), encoding="utf8").read()

    errors, warnings = [], []
    ev = kit["evidence"]
    keys = [e["key"] for e in ev]
    for k in set(keys):
        if keys.count(k) > 1:
            errors.append("evidence key used twice: %s" % k)
        if re.fullmatch(r"v\d+", k):
            errors.append("evidence key %s looks like a voice sample id; rename it" % k)
    eid = {k: "e%d" % (i + 1) for i, k in enumerate(keys)}
    strong, weak = kit.get("voice_strong", []), kit.get("voice_weak", [])
    if len(strong) > 10:
        errors.append("more than 10 strong voice samples; weak ids start at 11")
    voice = {i + 1: s for i, s in enumerate(strong)}
    voice.update({i + 11: s for i, s in enumerate(weak)})

    def target(key, where):
        m = re.fullmatch(r"v(\d+)", key)
        if m:
            if int(m.group(1)) not in voice:
                errors.append("%s: no voice sample %s" % (where, key))
            return "e-" + key
        if key not in eid:
            errors.append("%s: no evidence row with key '%s'" % (where, key))
            return "e0"
        return eid[key]

    def plain(text):
        return re.sub(r"\[/?i\]", "", MARK.sub(lambda m: m.group(2), text))

    def to_md(text, where):
        return re.sub(r"\[/?i\]", "", MARK.sub(lambda m: "%s (%s)" % (m.group(2), target(m.group(1), where)), text))

    def to_html(text, where):
        t = html.escape(text, quote=False)
        t = MARK.sub(lambda m: '<a class="fact" href="#%s">%s</a>' % (target(m.group(1), where), m.group(2)), t)
        return re.sub(r"\[i\](.*?)\[/i\]", r'<span class="inferred">\1</span>', t)

    def refs_in(text):
        return [k for k, _ in MARK.findall(text) if not re.fullmatch(r"v\d+", k)]

    esc = lambda s: html.escape(s, quote=False)
    short = lambda url: re.sub(r"^https?://(www\.)?", "", url).rstrip("/") or url

    # ---------------- claims and statuses
    claims = sorted(kit.get("claims", []), key=lambda c: STATUSES.index(c["status"]) if c["status"] in STATUSES else 99)
    for c in claims:
        if c["status"] not in STATUSES:
            errors.append("claim '%s': status must be one of %s" % (c["claim"], ", ".join(STATUSES)))
        for k in c.get("refs", []):
            target(k, "claim '%s'" % c["claim"])
    check_n = sum(c["status"] in CHECK_FIRST for c in claims)
    usable_n = len(claims) - check_n
    conflicts = kit.get("conflicts", [])
    status = {}
    for e in ev:
        if e.get("conflict"):
            status[e["key"]] = "conflict"
    for c in claims:
        if c["status"] in CHECK_FIRST:
            for k in c.get("refs", []):
                status.setdefault(k, c["status"])
    for i, c in enumerate(conflicts, 1):
        for k in refs_in(c["statement"]):
            status[k] = "conflict"
            if k in eid and not next(e for e in ev if e["key"] == k).get("conflict"):
                warnings.append("C%d cites '%s', which is not marked conflict in evidence" % (i, k))
        if not c.get("owner") or not c.get("action"):
            errors.append("C%d needs an owner ('Fix now' or 'Ask <role>') and an action" % i)
        elif not c["owner"].startswith(("Fix now", "Ask ")):
            errors.append("C%d owner must be 'Fix now' or start with 'Ask '" % i)
        elif c["owner"].startswith("Ask") and c["action"].count("?") != 1:
            errors.append("C%d: an 'Ask' action is one question with one question mark" % i)
        if c["owner"].startswith("Ask") and not c.get("until"):
            errors.append("C%d: say what a writer uses until it is settled ('until')" % i)

    # ---------------- top half checks
    for p in kit.get("proof", []):
        for k in refs_in(p):
            if k in status:
                errors.append("proof line cites '%s', which is %s: not usable as proof" % (k, status[k]))
    if not 3 <= len(kit.get("proof", [])) <= 6:
        warnings.append("proof list should have 3 to 6 lines, has %d" % len(kit.get("proof", [])))
    if len(plain(kit["one_liner"]).split()) > 30:
        errors.append("one_liner is over 30 words")
    for f in kit.get("fields", []):
        if len(re.findall(r"[.!?](?:\s|\"|”|$)", plain(f["text"]))) > 3:
            warnings.append("field '%s' runs past two sentences" % f["label"])
    auds = kit.get("audiences", [])
    if not 2 <= len(auds) <= 4:
        warnings.append("2 to 4 audiences expected, found %d" % len(auds))
    for a in auds:
        if a["situation"].count("[i]") > 1:
            errors.append("audience '%s': one inferred sentence at most" % a["name"])
        if not refs_in(a["situation"]):
            errors.append("audience '%s': the situation cites no evidence" % a["name"])
    offer = kit.get("offer", [])
    lines_n = sum(1 for o in offer if not o.get("shared"))
    if not 3 <= lines_n <= 8:
        warnings.append("3 to 8 offer rows expected, found %d" % lines_n)
    questions = kit.get("questions", [])
    if len(questions) > 8:
        errors.append("more than 8 questions: move the rest to 'later'")
    for i, q in enumerate(questions, 1):
        if q["question"].count("?") != 1:
            errors.append("question %d must hold exactly one question mark" % i)
        if not q.get("owner"):
            errors.append("question %d has no owner role" % i)
    for a, b in kit.get("pairs", []):
        if a not in voice or b not in voice:
            errors.append("voice pair (%s, %s) points at a missing sample" % (a, b))
        elif a > 10 or b <= 10:
            errors.append("voice pair (%s, %s): first a strong sample (1..10), then a weak one (11..)" % (a, b))
    counts = {}
    for e in ev:
        counts[e["url"].rstrip("/")] = counts.get(e["url"].rstrip("/"), 0) + 1
    listed = {s["url"].rstrip("/") for s in kit.get("sources", [])}
    for u in sorted(set(counts) - listed):
        warnings.append("evidence cites a URL that is not under sources: %s" % u)
    top_words = len(plain(" ".join(
        [kit["one_liner"], kit.get("voice_line", "")] + [f["text"] for f in kit.get("fields", [])] + kit.get("proof", [])
        + [a["situation"] + a.get("needs", "") + ((a.get("quote") or {}).get("text", "")) for a in auds]
        + kit.get("rules", []) + kit.get("words", []) + [o["what"] + o["best_for"] + o["proof"] for o in offer])).split())
    if top_words > 1500:
        warnings.append("the top half runs to %d words; aim for under 1,500" % top_words)

    # ---------------- BRAND.md checks
    if not brand:
        errors.append("BRAND.md is missing from the run directory")
    else:
        opened = re.search(r"\*\*Open decisions\*\*.*?(?=\n## |\Z)", brand, re.S)
        od = opened.group(0).count("\n") if opened else 0
        total = brand.count("\n") + 1
        if total - od > 200:
            errors.append("BRAND.md has %d lines without Open decisions (limit 200)" % (total - od))
        if re.search(r"<[A-Za-z…][^>\n]{0,80}>", brand):
            errors.append("BRAND.md still holds a <...> placeholder")
        if not brand.startswith("# Brand"):
            errors.append("BRAND.md must start with '# Brand'")
        for n in sorted(set(re.findall(r"questions? (\d+)", brand)), key=int):
            if int(n) > len(questions):
                errors.append("BRAND.md points at question %s, which does not exist" % n)
        for n in sorted(set(re.findall(r"\bC(\d+)\b", brand)), key=int):
            if int(n) > len(conflicts):
                errors.append("BRAND.md points at C%s, which does not exist" % n)
        missing = [i for i in range(1, len(conflicts) + 1) if not re.search(r"\bC%d\b" % i, brand)]
        if missing:
            errors.append("BRAND.md Open decisions leave out conflict(s): %s" % ", ".join("C%d" % i for i in missing))
        for needle in ("Not decided yet", "not answered yet", "Not read in this run"):
            if needle in brand:
                errors.append("BRAND.md holds a note about a gap (%r): leave the field out and list it under To fill in" % needle)

    # ---------------- markdown outputs
    name, date = kit["name"], kit["date"]
    t = kit.get("type", {})
    e_md = ["# Evidence — " + name, "", "Run date %s%s. Public sources only. Row ids (e1, e2, …) follow file order and are the ids used in claims.md and brand-kit.html." % (date, ", Nexity Marketing Skills v%s" % version if version else ""), ""]
    e_md += ["- **%s:** %s" % (lab, t[k]) for k, lab in (("sells", "Sells"), ("to", "To"), ("how", "How"), ("type", "Type")) if t.get(k)]
    e_md += ["", "| Fact | Source URL | Verbatim quote or number |", "|---|---|---|"]
    e_md += ["| %s · %s%s | %s | %s |" % (eid[e["key"]], e["fact"], " (conflict)" if e.get("conflict") else "", e["url"], e["quote"].replace("|", "\\|")) for e in ev]
    srcs = []
    for s in kit.get("sources", []):
        n = counts.get(s["url"].rstrip("/"), 0)
        y = "%d fact%s" % (n, "" if n == 1 else "s") if n else (s.get("yield") or "no facts")
        srcs.append((n, s.get("label") or short(s["url"]), s["url"], y))
    srcs.sort(key=lambda r: -r[0])
    e_md += ["", "## Sources checked", ""] + ["- %s : %s" % (u, y) for n, lab, u, y in srcs]
    if kit.get("sources_note"):
        e_md += ["", kit["sources_note"]]
    e_md += ["", "## Voice samples", "", "Strong, newer surfaces:", ""] + ["- %s (%s)" % (s["quote"], s["url"]) for s in strong]
    e_md += ["", "Weaker, older surfaces:", ""] + ["- %s (%s)" % (s["quote"], s["url"]) for s in weak]
    e_md += ["", "## Customer language", ""] + ["- %s: %s (%s)" % (re.sub(r"^Customer quote[^:]*: ", "", e["fact"]), e["quote"], e["url"]) for e in ev if e.get("customer")]
    if kit.get("customer_note"):
        e_md += ["", kit["customer_note"]]
    e_md += ["", "## Not fetched / not found", ""] + ["- " + x for x in kit.get("not_found", [])]
    e_md += ["", "## Voice analysis", ""]
    for para in kit.get("voice_analysis", []):
        e_md += [para, ""]

    c_md = ["# Claims register — " + name, "", "Run date %s. %d conflicts and %d claims on record (%d usable, %d to check first). Evidence refs point to rows in evidence.md." % (date, len(conflicts), len(claims), usable_n, check_n), "", "## Conflicts to resolve", ""]
    for i, c in enumerate(conflicts, 1):
        c_md += ["**C%d. %s** %s" % (i, c["title"], to_md(c["statement"], "C%d" % i)), "", "Action: **%s.** %s" % (c.get("owner", ""), c.get("action", ""))]
        c_md += (["", c["until"]] if c.get("until") else []) + [""]
    c_md += ["## Claims on record", "", "| claim | on record / note | status | evidence refs |", "|---|---|---|---|"]
    c_md += ["| %s | %s | %s | %s |" % (c["claim"], c.get("note", ""), c["status"], " · ".join(eid.get(k, "?") for k in c.get("refs", []))) for c in claims]

    q_md = ["# Questions for the team — " + name, "", "Run date %s. What the public site does not say and content needs. Each conflict carries its own question in claims.md and is not repeated here." % date, ""]
    for i, q in enumerate(questions, 1):
        q_md += ["%d. **%s:** %s" % (i, q["owner"], q["question"]), "   %s" % q.get("why", ""), ""]
    if kit.get("later"):
        q_md += ["## Later", ""] + ["- **%s:** %s" % (q["owner"], q["question"]) for q in kit["later"]]

    # ---------------- html slots
    S = {}
    brief = kit.get("brief") or list(range(1, min(len(conflicts), 5) + 1))
    if conflicts:
        S["BRIEF"] = "\n".join('<li><a class="xref" href="#c%d">C%d</a><span>%s</span></li>' % (i, i, esc(plain(conflicts[i - 1]["title"].rstrip(".") + ": " + conflicts[i - 1]["statement"][:1].lower() + conflicts[i - 1]["statement"][1:]))) for i in brief)
    else:
        weakest = [c for c in claims if c["status"] == "unverified"][:5]
        S["BRIEF"] = "\n".join('<li><a class="xref fact" href="#%s">%s</a><span>%s. %s</span></li>' % (eid.get(c["refs"][0], "e1"), eid.get(c["refs"][0], ""), esc(c["claim"]), esc(c.get("note", ""))) for c in weakest if c.get("refs"))
        lede = "These figures disagree across the site. Do not reuse them until the person who owns the fact confirms which one is right."
        if lede in template:
            template = template.replace(lede, "No figure on this site contradicts another. These claims have no source a reader can check: do not repeat them as fact.")
    S["ONE_LINER"] = '<div class="field"><div class="k">In one sentence</div><p class="v">%s</p></div>' % to_html(kit["one_liner"], "one_liner")
    S["BRAND_FIELDS"] = "\n".join('<div class="sub"><div class="k">%s</div><p>%s</p></div>' % (esc(f["label"]), to_html(f["text"], "field " + f["label"])) for f in kit.get("fields", []))
    S["PROOF"] = "\n".join("<li>%s</li>" % to_html(p, "proof") for p in kit.get("proof", []))
    blocks = []
    for a in auds:
        b = '<div class="aud"><div class="k">%s</div><p>%s</p>' % (esc(a["name"]), to_html(a["situation"], "audience " + a["name"]))
        q = a.get("quote")
        if q:
            b += '<blockquote>%s<span class="cite">%s &middot; <a href="%s" target="_blank" rel="noopener">%s</a></span></blockquote>' % (to_html(q["text"], "audience quote"), esc(q["by"]), q["url"], esc(q.get("where", "source")))
        needs = a.get("needs", "")
        if needs:
            body = to_html(needs, "audience needs")
            if not refs_in(needs) and "[i]" not in needs:
                body = '<span class="inferred">%s</span>' % body
            b += "<p><strong>Needs to see:</strong> %s</p>" % body
        b += '<p class="maps">Buys: %s</p></div>' % esc(a.get("buys", "")).replace(" · ", " &middot; ")
        blocks.append(b)
    S["AUDIENCES"] = "\n".join(blocks)
    S["VOICE_LINE"] = '<div class="field"><div class="k">Sounds like</div><p class="v">%s</p></div>' % esc(kit.get("voice_line", ""))
    S["VOICE_PAIRS"] = "\n".join('<tr><td class="pair"><a class="fact" href="#e-v%d">%s</a></td><td class="pair not"><a class="fact" href="#e-v%d">%s</a></td></tr>' % (a, esc(voice[a]["quote"]), b, esc(voice[b]["quote"])) for a, b in kit.get("pairs", []) if a in voice and b in voice)
    S["VOICE_RULES"] = "\n".join("<li>%s</li>" % to_html(r, "rule") for r in kit.get("rules", []))
    S["VOICE_WORDS"] = "\n".join("<li>%s</li>" % to_html(r, "words") for r in kit.get("words", []))
    S["VOICE_PAGES"] = "\n".join('<div class="sub"><div class="k">%s</div><p>%s</p></div>' % (esc(p["label"]), esc(p["text"])) for p in kit.get("pages", []))
    S["OFFER_HEAD"] = "".join("<th>%s</th>" % esc(h) for h in kit.get("offer_head", ["Service line", "What it is", "Best for", "Proof and price"]))
    S["OFFER_ROWS"] = "\n".join('<tr><td class="fact">%s</td><td class="quote">%s</td><td class="quote">%s</td><td class="quote">%s</td></tr>' % (esc(o["name"]), to_html(o["what"], "offer"), to_html(o["best_for"], "offer"), to_html(o["proof"], "offer")) for o in offer)
    S["BRAND_MD"] = esc(brand.rstrip("\n"))
    rows = []
    for i, c in enumerate(conflicts, 1):
        r = '<div class="gap"><div class="no">C%d</div><div class="q"><strong>%s</strong> %s</div><p class="act"><span class="owner">%s</span>%s</p>' % (i, esc(c["title"]), to_html(c["statement"], "C%d" % i), esc(c.get("owner", "")), esc(c.get("action", "")))
        rows.append(r + ('<p class="why">%s</p>' % esc(c["until"]) if c.get("until") else "") + "</div>")
    S["FIXES"] = "\n".join(rows)
    S["QUESTIONS"] = "\n".join('<div class="gap"><div class="no">%d</div><div class="q"><span class="owner">%s</span>%s</div><p class="why">%s</p></div>' % (i, esc(q["owner"]), esc(q["question"]), esc(q.get("why", ""))) for i, q in enumerate(questions, 1))
    S["CLAIMS_ROWS"] = "\n".join('<tr><td class="fact">%s</td><td class="quote">%s</td><td class="src">%s</td><td class="src">%s</td></tr>' % (esc(c["claim"]), esc(c.get("note", "")), ('<span class="tag">%s</span>' % c["status"]) if c["status"] in CHECK_FIRST else c["status"], " &middot; ".join('<a class="fact" href="#%s">%s</a>' % (eid.get(k, "e0"), eid.get(k, "?")) for k in c.get("refs", []))) for c in claims)
    S["SOURCES"] = "\n".join('<span class="srcchip"><a href="%s" target="_blank" rel="noopener">%s</a><span class="ct">%s</span></span>' % (u, esc(lab), y) for n, lab, u, y in srcs)
    S["EVIDENCE_ROWS"] = "\n".join('<tr id="%s"><td class="idx">%d</td><td class="fact">%s%s</td><td class="src"><a href="%s" target="_blank" rel="noopener">%s</a></td><td class="quote">%s</td></tr>' % (eid[e["key"]], i + 1, esc(e["fact"]), '<span class="tag">conflict</span>' if e.get("conflict") else "", e["url"], esc(short(e["url"])), esc(e["quote"])) for i, e in enumerate(ev))
    S["NOT_FOUND"] = "\n".join("<li>%s</li>" % esc(x) for x in kit.get("not_found", []))
    S["VOICE_STRONG"] = "\n".join('<blockquote id="e-v%d">%s<span class="cite"><a href="%s" target="_blank" rel="noopener">%s</a></span></blockquote>' % (i, esc(s["quote"]), s["url"], esc(short(s["url"]))) for i, s in enumerate(strong, 1))
    S["VOICE_WEAK"] = "\n".join('<blockquote class="weak" id="e-v%d">%s<span class="cite"><a href="%s" target="_blank" rel="noopener">%s</a></span></blockquote>' % (i, esc(s["quote"]), s["url"], esc(short(s["url"]))) for i, s in enumerate(weak, 11))

    out = template
    for slot, content in S.items():
        pat = re.compile(r"<!-- SLOT:%s\b.*?-->" % slot, re.S)
        if len(pat.findall(out)) != 1:
            errors.append("template slot %s not found exactly once" % slot)
        out = pat.sub(lambda m: content, out)
    tokens = {"COMPANY_NAME": name, "COMPANY_DOMAIN": kit["domain"], "COMPANY_SLUG": kit["slug"], "RUN_DATE": date,
              "SOURCE_COUNT": len(srcs), "FACT_COUNT": len(ev), "AUDIENCE_COUNT": len(auds), "PRODUCT_COUNT": lines_n,
              "CONFLICT_COUNT": len(conflicts), "CLAIM_ROW_COUNT": len(claims), "USABLE_COUNT": usable_n, "CHECK_COUNT": check_n, "GAP_COUNT": len(questions)}
    out = out.replace("{{VERSION_PILL}}", '<span class="ver">v%s</span>' % esc(version) if version else "")
    out = out.replace("{{VERSION_TEXT}}", " v%s" % esc(version) if version else "")
    for k, v in tokens.items():
        out = out.replace("{{%s}}" % k, esc(str(v)))
    if "{{" in out or "SLOT:" in out:
        errors.append("a token or a slot is left unfilled in the report")
    head = re.sub(r"<[^>]+>", " ", out.split('<section id="evidence">')[0].split('<div class="masthead">')[-1])
    if re.search(r'[^.]\.\.[^.]|""', head):
        warnings.append("doubled punctuation in the top half of the report")

    for wmsg in warnings:
        print("warning:", wmsg)
    if errors:
        for emsg in dict.fromkeys(errors):
            print("ERROR:", emsg)
        sys.exit(1)
    flagged = sorted({"%s (%s)" % (k, status[k]) for part in [kit["one_liner"]] + [f["text"] for f in kit.get("fields", [])] + [o["what"] + o["best_for"] + o["proof"] for o in offer] for k in refs_in(part) if k in status})
    print("plugin version: %s" % (version or "not found (no .claude-plugin manifest with a version above this skill); the report shows none"))
    print("%s: %d sources, %d facts, %d conflicts, %d claims (%d usable, %d to check), %d questions, top half %d words"
          % (name, len(srcs), len(ev), len(conflicts), len(claims), usable_n, check_n, len(questions), top_words))
    if flagged:
        print("shown as check-first in the top half:", ", ".join(flagged))
    if check_only:
        print("checks passed; nothing written (--check)")
        return
    for fname, text in (("evidence.md", "\n".join(e_md)), ("claims.md", "\n".join(c_md) + "\n"), ("gap-questionnaire.md", "\n".join(q_md) + "\n"), ("brand-kit.html", out)):
        open(os.path.join(run, fname), "w", encoding="utf8").write(text)
    print("wrote evidence.md, claims.md, gap-questionnaire.md, brand-kit.html")


if __name__ == "__main__":
    main()
