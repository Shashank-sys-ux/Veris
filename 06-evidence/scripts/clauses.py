"""Dump the specific clauses that matter, in full, so they can be quoted accurately."""
import re
from pathlib import Path

from pypdf import PdfReader

HERE = Path(__file__).parent

WANT = {
    "chubb-selectplus-wording.pdf": [8, 15, 17],
}

ANCHORS = [
    "Average",
    "Premium Payment Warranty",
    "theft",
    "Vacant",
    "Time Limit",
    "Deductible",
]


def dump(name: str, pages: list[int]) -> None:
    reader = PdfReader(str(HERE / name))
    for p in pages:
        text = reader.pages[p - 1].extract_text() or ""
        flat = re.sub(r"[ \t]+", " ", text)
        print("=" * 100)
        print(f"{name}  PAGE {p}")
        print("=" * 100)
        print(flat.strip())
        print()


if __name__ == "__main__":
    for name, pages in WANT.items():
        dump(name, pages)
