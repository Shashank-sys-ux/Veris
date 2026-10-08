"""
Targeted clause scans across the Singapore SME wording corpus.

Purpose: resolve four open items that currently force hedges in the PROVEN demo.
  1. average / underinsurance  - is a FORMULA actually stated?
  2. condition precedent       - is there a declaration clause?
  3. premium payment warranty  - what is the stated consequence?
  4. vacancy / unoccupancy     - is it defined, and on what day count?

Every hit is printed with its page number and surrounding context so the raw
text can be read and judged, not just counted. Nothing here infers anything.

Usage:  python scan_corpus.py <topic>
        python scan_corpus.py all
"""
import re
import sys
import pathlib

sys.stdout.reconfigure(encoding="utf-8")

CORPUS = pathlib.Path(__file__).resolve().parent.parent / "wording-corpus"

# Only full policy wordings. Brochures/schedules/proposal forms are not authority
# for what a policy says, and Malaysian wordings are a different jurisdiction.
WORDINGS = {
    "CHUBB Select+ (SG, 28pp)": "sg-chubb-selectplus-lite-wording-DUPLICATE.txt",
    "MSIG SUMO (SG, 41pp)": "sg-msig-sumo-sme-policy-wording.txt",
    "LIBERTY SMECare (SG, 49pp)": "sg-liberty-smecare-policy-wording.txt",
}

TOPICS = {
    # A stated formula is what we need. Mere use of the word "average" is not a formula.
    "average": [
        r"rate-?able\s+proportion",
        r"proportion\s+(?:which|that|as)\s+.{0,60}?sum\s+insured",
        r"sum\s+insured\s+(?:bears|shall\s+bear|divided\s+by)",
        r"bear\s+(?:a\s+|his\s+|its\s+)?(?:rate-?able\s+)?(?:share|proportion)",
        r"average\s+clause",
        r"condition\s+of\s+average",
        r"under-?insurance",
        r"\b8[05]\s*%|\b8[05]\s*per\s*cent",
    ],
    "condition_precedent": [
        r"condition[s]?\s+precedent",
        r"warrant(?:y|ies|ed)",
        r"basis\s+of\s+(?:this\s+)?(?:the\s+)?contract",
        r"true\s+and\s+complete",
    ],
    "premium_warranty": [
        r"premium\s+(?:payment\s+)?warranty",
        r"60\s*(?:days|\(sixty\))|sixty\s*\(?60\)?\s*days",
        r"automatically\s+terminat",
        r"deemed\s+to\s+be\s+cancelled",
    ],
    "vacancy": [
        r"\bvacan(?:t|cy)\b",
        r"unoccupied|un-?occupancy",
        r"\b(?:7|14|30|thirty|fourteen|seven)\s*(?:consecutive\s*)?days\b",
    ],
}


def load(fname):
    text = (CORPUS / fname).read_text(encoding="utf-8", errors="replace")
    # Build a page index so every hit can be cited to a page.
    pages = []
    for m in re.finditer(r"=== PAGE (\d+) ===", text):
        pages.append((m.start(), int(m.group(1))))
    return text, pages


def page_of(pages, pos):
    p = "?"
    for start, num in pages:
        if start <= pos:
            p = num
        else:
            break
    return p


def clean(s):
    s = s.replace("\n", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def scan(topic, width=340):
    pats = TOPICS[topic]
    print("#" * 78)
    print(f"# TOPIC: {topic}")
    print("#" * 78)
    for label, fname in WORDINGS.items():
        text, pages = load(fname)
        print(f"\n{'='*78}\n{label}\n{'='*78}")
        seen = []
        total = 0
        for pat in pats:
            for m in re.finditer(pat, text, re.I):
                total += 1
                # de-duplicate overlapping windows so output stays readable
                if any(abs(m.start() - s) < 200 for s in seen):
                    continue
                seen.append(m.start())
                a = max(0, m.start() - width // 2)
                b = min(len(text), m.end() + width // 2)
                snippet = clean(text[a:b])
                hit = clean(m.group(0))
                print(f"\n  p.{page_of(pages, m.start())}  <<{hit}>>")
                print(f"    ...{snippet}...")
        print(f"\n  -- {total} raw hits, {len(seen)} shown after de-dup")


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    for t in (TOPICS if which == "all" else [which]):
        scan(t)
        print("\n")
