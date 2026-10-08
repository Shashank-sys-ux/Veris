"""Dump the Grace Electrical judgment in full so the holding can be read, not inferred."""
import re
import sys
from pathlib import Path

from pypdf import PdfReader

HERE = Path(__file__).parent
PATH = HERE / "sghc-grace-electrical-2016.pdf"

reader = PdfReader(str(PATH))
pages = []
for i, page in enumerate(reader.pages, start=1):
    pages.append((i, page.extract_text() or ""))

out = HERE / "grace-electrical-fulltext.txt"
with out.open("w", encoding="utf-8") as fh:
    for i, t in pages:
        fh.write(f"\n\n===== PAGE {i} =====\n")
        fh.write(re.sub(r"[ \t]+", " ", t))
print(f"wrote {out}  pages={len(pages)}")

# Print the parts that carry the holding.
which = sys.argv[1:] if len(sys.argv) > 1 else None
if which:
    for w in which:
        i = int(w)
        print(f"\n\n########## PAGE {i} ##########")
        print(re.sub(r"[ \t]+", " ", pages[i - 1][1]).strip())
