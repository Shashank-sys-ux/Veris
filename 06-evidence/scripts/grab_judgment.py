"""Extract a downloaded Singapore judgment PDF to text and report what it contains.

Court judgments are the one place where REAL, completed policy terms and real claim
figures are lawfully public. A private SME's schedule, accounts and CPF record are
confidential and are not findable on the open internet — nor should they be used
without consent. A judgment gives the same evidentiary value with none of that
problem, and it is citable on stage.

Usage: python grab_judgment.py <pdf-path> <out-txt-path>
"""
import re
import sys
from pathlib import Path

from pypdf import PdfReader

sys.stdout.reconfigure(encoding="utf-8")

src = Path(sys.argv[1])
dst = Path(sys.argv[2])

reader = PdfReader(str(src))
text = "".join((p.extract_text() or "") for p in reader.pages)
dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text(text, encoding="utf-8")

print(f"{src.name}: {len(reader.pages)} pages, {len(text):,} chars -> {dst}")
print()
print("--- first 900 chars ---")
print(re.sub(r"\s+", " ", text[:900]))
print()

# What makes a judgment useful to us: real money figures, real clause references,
# and the doctrinal hooks our findings escalate on.
PROBES = {
    "sum insured": r"sum insured",
    "average / underinsurance": r"\baverage\b|under-?insur",
    "condition precedent": r"condition[s]?\s+precedent",
    "premium payment warranty": r"premium\s+(?:payment\s+)?warranty",
    "non-disclosure": r"non-?disclosure|misrepresent",
    "material alteration": r"material\s+(?:alteration|change)",
    "SGD figures": r"S\$[\d,]{4,}",
    "policy schedule": r"policy\s+schedule|the\s+Schedule",
}
print("--- what this judgment contains ---")
for label, pat in PROBES.items():
    hits = re.findall(pat, text, re.I)
    print(f"  {label:<26} {len(hits):>4} hits")
    if label == "SGD figures" and hits:
        uniq = sorted(set(hits))[:8]
        print(f"      e.g. {', '.join(uniq)}")
