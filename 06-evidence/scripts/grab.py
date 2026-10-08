"""Download a PDF (or HTML) and dump extracted text to a .txt file for grepping."""
import sys, os, re, hashlib, urllib.request, ssl

OUT = os.path.dirname(os.path.abspath(__file__))
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HDRS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/122.0 Safari/537.36",
    "Accept": "*/*",
}


def slug(url):
    base = re.sub(r"[^A-Za-z0-9]+", "-", url.split("/")[-1])[:70].strip("-")
    if not base:
        base = "doc"
    return base + "-" + hashlib.md5(url.encode()).hexdigest()[:6]


def grab(url):
    name = slug(url)
    raw = os.path.join(OUT, name + ".bin")
    txt = os.path.join(OUT, name + ".txt")
    try:
        req = urllib.request.Request(url, headers=HDRS)
        with urllib.request.urlopen(req, timeout=60, context=ctx) as r:
            data = r.read()
            ctype = r.headers.get("Content-Type", "")
    except Exception as e:
        print(f"FAIL\t{url}\t{type(e).__name__}: {e}")
        return
    with open(raw, "wb") as f:
        f.write(data)

    text = None
    if data[:5] == b"%PDF-":
        try:
            import fitz
            doc = fitz.open(raw)
            text = "\n".join(f"\n=== PAGE {i+1} ===\n" + p.get_text() for i, p in enumerate(doc))
            doc.close()
        except Exception as e:
            print(f"PDFFAIL\t{url}\t{e}")
            return
    else:
        try:
            html = data.decode("utf-8", "ignore")
            html = re.sub(r"(?is)<(script|style|svg)[^>]*>.*?</\1>", " ", html)
            html = re.sub(r"(?s)<[^>]+>", " ", html)
            import html as H
            text = re.sub(r"[ \t]{2,}", " ", H.unescape(html))
        except Exception as e:
            print(f"HTMLFAIL\t{url}\t{e}")
            return

    with open(txt, "w", encoding="utf-8") as f:
        f.write(f"SOURCE_URL: {url}\nCONTENT_TYPE: {ctype}\nBYTES: {len(data)}\n\n")
        f.write(text)
    os.remove(raw)
    print(f"OK\t{len(data)}b\t{len(text)}chars\t{txt}")


if __name__ == "__main__":
    for u in sys.argv[1:]:
        grab(u)
