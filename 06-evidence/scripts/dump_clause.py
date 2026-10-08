"""
Dump an exact, contiguous span of a corpus file so a clause can be quoted verbatim.

We never paraphrase a clause into the product. If PROVEN is going to show a span
to a user, the span has to be read in full first, in its own context, with its
page number. This prints exactly that.

Usage: python dump_clause.py <file-substring> <anchor-regex> [chars_before] [chars_after]
"""
import re
import sys
import pathlib

sys.stdout.reconfigure(encoding="utf-8")
CORPUS = pathlib.Path(__file__).resolve().parent.parent / "wording-corpus"


def main():
    key, anchor = sys.argv[1], sys.argv[2]
    before = int(sys.argv[3]) if len(sys.argv) > 3 else 100
    after = int(sys.argv[4]) if len(sys.argv) > 4 else 1400

    matches = [p for p in CORPUS.glob("*.txt") if key.lower() in p.name.lower()]
    if not matches:
        sys.exit(f"no corpus file matching {key!r}")

    for path in matches:
        text = path.read_text(encoding="utf-8", errors="replace")
        pages = [(m.start(), int(m.group(1)))
                 for m in re.finditer(r"=== PAGE (\d+) ===", text)]

        # PDF extraction leaves hard newlines mid-sentence, so a literal space in
        # the anchor must match any run of whitespace or the anchor never fires.
        flexible = re.sub(r"\ +", r"\\s+", anchor)
        found = list(re.finditer(flexible, text, re.I))
        if not found and flexible != anchor:
            found = list(re.finditer(anchor, text, re.I))
        print("=" * 78)
        print(f"{path.name}   ({len(found)} match(es) for /{anchor}/)")
        print("=" * 78)
        for m in found:
            pg = "?"
            for start, num in pages:
                if start <= m.start():
                    pg = num
                else:
                    break
            a = max(0, m.start() - before)
            b = min(len(text), m.start() + after)
            span = re.sub(r"[ \t]+", " ", text[a:b])
            print(f"\n----- page {pg} -----")
            print(span)
            print("-" * 40)


if __name__ == "__main__":
    main()
