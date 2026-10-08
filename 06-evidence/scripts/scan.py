"""Scan Singapore SME policy wordings for conditional exclusions and warranties.

Question being answered: do these wordings contain clauses of the shape
"excluded UNLESS <verifiable control> is in place / maintained", or warranties
requiring a control to be serviced or inspected at stated intervals?
"""
import re
import sys
from pathlib import Path

from pypdf import PdfReader

HERE = Path(__file__).parent

# Patterns grouped by what they would prove.
PATTERNS = {
    "CONDITIONAL FORM": [
        r"\bunless\b",
        r"\bprovided that\b",
        r"shall not apply",
        r"does not apply (?:if|where|unless)",
        r"\bsubject to (?:the )?(?:installation|maintenance|provision)\b",
    ],
    "WARRANTY / CP": [
        r"\bwarrant(?:y|ed|ies)\b",
        r"condition precedent",
    ],
    "FIRE PROTECTION CONTROLS": [
        r"extinguish\w*",
        r"sprinkler\w*",
        r"hose reel",
        r"hydrant",
        r"suppression",
        r"fire alarm",
    ],
    "SECURITY CONTROLS": [
        r"burglar\w* alarm",
        r"\balarm\b",
        r"\blocks?\b",
        r"security (?:system|guard|device)",
    ],
    "COOKING EXPOSURE": [
        r"deep fat",
        r"\bfry\w*\b",
        r"\bcooking\b",
        r"\bkitchen\b",
        r"\bhood\b",
        r"\bduct\w*\b",
    ],
    "HOUSEKEEPING / PROCESS": [
        r"hot work",
        r"\bsmoking\b",
        r"stack\w*",
        r"housekeeping",
        r"\bgood repair\b",
    ],
    "OCCUPANCY": [
        r"unoccupi\w*",
        r"\bunattended\b",
        r"\bvacant\b",
        r"consecutive days",
    ],
    "UNDERINSURANCE": [
        r"\baverage\b",
        r"under-?insur\w*",
        r"\bco-?insurance\b",
        r"\bdepreciat\w*",
        r"reinstatement",
    ],
    "BI LIMITS": [
        r"indemnity period",
        r"\bsub-?limit\w*\b",
        r"\baggregate\b",
    ],
    "MAINTENANCE LANGUAGE": [
        r"\bserviced?\b",
        r"\bmaintained\b",
        r"\binspect\w*\b",
        r"\bcertificat\w*\b",
        r"competent (?:person|contractor)",
        r"licensed electrical",
        r"every (?:six|twelve|12|6|three|3)\s*(?:\(\d+\)\s*)?(?:month|year)",
    ],
}

CONTEXT = 260


def load(path: Path):
    reader = PdfReader(str(path))
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        try:
            pages.append((i, page.extract_text() or ""))
        except Exception as exc:  # noqa: BLE001
            pages.append((i, f"<<extract failed: {exc}>>"))
    return pages


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text)


def scan(path: Path):
    pages = load(path)
    full_chars = sum(len(t) for _, t in pages)
    print("=" * 100)
    print(f"FILE: {path.name}   pages={len(pages)}   extracted_chars={full_chars}")
    print("=" * 100)

    if full_chars < 500:
        print("!! Almost no text extracted - likely a scanned/image PDF. OCR needed.\n")
        return

    for group, pats in PATTERNS.items():
        hits = []
        for pat in pats:
            rx = re.compile(pat, re.IGNORECASE)
            for pageno, text in pages:
                flat = norm(text)
                for m in rx.finditer(flat):
                    s = max(0, m.start() - CONTEXT // 2)
                    e = min(len(flat), m.end() + CONTEXT // 2)
                    hits.append((pageno, pat, flat[s:e].strip()))
        if not hits:
            print(f"\n--- {group}: NO MATCHES")
            continue
        # de-duplicate on snippet
        seen = set()
        uniq = []
        for h in hits:
            key = h[2][:120]
            if key in seen:
                continue
            seen.add(key)
            uniq.append(h)
        print(f"\n--- {group}: {len(uniq)} unique snippets (showing up to 14)")
        for pageno, pat, snip in uniq[:14]:
            print(f"  [p{pageno}] ({pat})  ...{snip}...")
    print()


if __name__ == "__main__":
    targets = sys.argv[1:] or [p.name for p in sorted(HERE.glob("*.pdf"))]
    for name in targets:
        p = HERE / name
        if p.exists():
            scan(p)
        else:
            print(f"MISSING: {name}")
