"""Fetch a page and list PDF / document links found in the raw HTML."""
import sys, re, ssl, urllib.request, urllib.parse

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HDRS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/122.0 Safari/537.36"}

KEY = re.compile(r"(?i)\.pdf|policy|wording|terms|document|brochure|download")

for url in sys.argv[1:]:
    print(f"\n########## {url}")
    try:
        req = urllib.request.Request(url, headers=HDRS)
        html = urllib.request.urlopen(req, timeout=60, context=ctx).read().decode("utf-8", "ignore")
    except Exception as e:
        print(f"  FAIL {type(e).__name__}: {e}")
        continue
    seen = set()
    for m in re.finditer(r'''(?:href|src|data-href|data-url)\s*=\s*["']([^"']+)["']''', html):
        u = urllib.parse.urljoin(url, m.group(1))
        if u in seen or not KEY.search(u):
            continue
        seen.add(u)
        print("  " + u)
    # also catch bare pdf urls in JSON blobs
    for m in re.finditer(r'''https?://[^\s"'<>\\]+\.pdf[^\s"'<>\\]*''', html):
        u = m.group(0)
        if u not in seen:
            seen.add(u)
            print("  [raw] " + u)
    print(f"  -- {len(seen)} candidate link(s)")
