"""GET /api/source/... — the cited page, rendered with the quotation highlighted.

The drawer used to answer "show me why" with a quotation, a page number and two character
offsets: all true, none checkable without leaving the product. These tests pin the three
properties that make showing the page an improvement rather than a decoration:

  1. the page shown is the page cited, and the highlight is FOUND rather than assumed
  2. the quotation highlighted is the STORED span, never a string the caller passed in
  3. the consent gate and case deletion both reach the page image, which is the most
     complete disclosure of a document this product can make
"""
from __future__ import annotations

import base64

import pytest
from fastapi.testclient import TestClient

from proven import sourceview
from proven.api import EXAMPLE_DIR, app

WORDING = "01-policy-wording.pdf"
SCHEDULE = "02-policy-schedule.pdf"
ADVISER = {"email": "adviser@lionbrokers.demo", "password": "Demo@123"}
CARRIER = {"email": "underwriter@carrier.demo", "password": "Demo@123"}


def _part(name: str):
    return ("files", (name, (EXAMPLE_DIR / name).read_bytes(), "application/pdf"))


@pytest.fixture()
def client() -> TestClient:
    c = TestClient(app)
    r = c.post("/api/bundle", files=[_part(WORDING), _part(SCHEDULE)],
               data={"business_name": "Hock Lee Foods Pte Ltd"})
    assert r.status_code == 200, r.text
    # The intake report is the only place document_id is published per file, and the
    # per-kind consent test needs the id of a document no finding happens to cite.
    c.intake = r.json()["intake"]["files"]
    return c


def _document_id(client: TestClient, kind: str) -> str:
    for row in client.intake:
        if row.get("accepted") and row.get("kind") == kind:
            return row["document_id"]
    pytest.skip(f"no {kind} in the uploaded bundle")


def _first_span(client: TestClient) -> dict:
    for f in client.get("/api/brief").json()["findings"]:
        for s in f.get("spans") or []:
            if s.get("document_id"):
                return s
    pytest.skip("no finding in the demo bundle carries a document-backed span")


# ── the citation resolves to a real page ─────────────────────────────────────

def test_the_brief_span_carries_enough_to_locate_the_page():
    """`quote` is the key the Brief actually publishes.

    Pinned because the drawer read `quoted_text` — the DB column name — and therefore
    rendered an empty quotation for every finding while looking entirely correct.
    """
    c = TestClient(app)
    c.post("/api/bundle", files=[_part(WORDING), _part(SCHEDULE)])
    span = _first_span(c)
    assert span["quote"], "the Brief must publish the quoted text under `quote`"
    assert "quoted_text" not in span
    for key in ("span_id", "document_id", "page_no", "char_start", "char_end"):
        assert key in span


def test_the_source_document_metadata_names_the_file(client):
    span = _first_span(client)
    d = client.get(f"/api/source/{span['document_id']}").json()
    assert d["filename"] == WORDING
    assert d["kind"] == "BASE_WORDING"
    assert d["page_count"] > 1
    assert d["pages_viewable"] is sourceview.available()


@pytest.mark.skipif(not sourceview.available(), reason="PyMuPDF not installed")
def test_the_page_is_rendered_and_the_quotation_is_actually_found(client):
    span = _first_span(client)
    r = client.get(f"/api/source/{span['document_id']}/page/{span['page_no']}",
                   params={"span_id": span["span_id"]})
    assert r.status_code == 200
    d = r.json()
    assert d["available"] is True
    assert d["page_no"] == span["page_no"], "a citation must show the page it cites"
    assert d["width"] > 400 and d["height"] > 400
    assert d["image"].startswith("data:image/png;base64,")
    png = base64.b64decode(d["image"].split(",", 1)[1])
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    # The point of the whole feature: the quotation was located on the page, so the
    # highlight marks the real text rather than a plausible position.
    assert d["highlight"]["found"] is True
    assert d["highlight"]["method"] == sourceview.EXACT
    assert d["highlight"]["rect_count"] >= 1
    assert d["highlight"]["note"]


@pytest.mark.skipif(not sourceview.available(), reason="PyMuPDF not installed")
def test_a_page_with_no_span_named_is_rendered_unhighlighted_and_says_so(client):
    span = _first_span(client)
    d = client.get(
        f"/api/source/{span['document_id']}/page/{span['page_no']}").json()
    assert d["available"] is True
    assert d["highlight"]["found"] is False
    assert d["highlight"]["method"] == sourceview.NOT_FOUND
    assert "nothing is highlighted" in d["highlight"]["note"].lower()


def test_the_highlight_quotation_comes_from_the_stored_span_not_the_caller(client):
    """There is no parameter for the text to highlight, and that is the design.

    A client that could pass its own string could have this endpoint draw a box around a
    phrase the engine never cited — a fabricated citation rendered by the product's own
    evidence viewer.
    """
    span = _first_span(client)
    d = client.get(f"/api/source/{span['document_id']}/page/{span['page_no']}",
                   params={"span_id": span["span_id"],
                           "quote": "THIS TEXT WAS NEVER CITED"}).json()
    assert d["quote"] == span["quote"]
    assert "NEVER CITED" not in d["quote"]


def test_an_unknown_document_is_refused(client):
    span = _first_span(client)
    r = client.get("/api/source/not-a-real-document-id/page/1",
                   params={"span_id": span["span_id"]})
    assert r.status_code == 404


def test_a_span_belonging_to_a_different_document_is_refused(client):
    """The span and the document must agree, or the page shown is not the page cited."""
    span = _first_span(client)                       # cites the wording
    other = _document_id(client, "SCHEDULE")
    r = client.get(f"/api/source/{other}/page/1",
                   params={"span_id": span["span_id"]})
    assert r.status_code == 400
    assert "different document" in r.json()["detail"]


def test_a_page_outside_the_document_is_refused_by_name(client):
    span = _first_span(client)
    d = client.get(f"/api/source/{span['document_id']}/page/9999").json()
    assert d["available"] is False
    assert "outside this document" in d["reason"]


# ── the access model is the same one ─────────────────────────────────────────

def test_a_carrier_cannot_render_a_page_of_one_business_document(client):
    span = _first_span(client)
    client.post("/api/auth/login", json=CARRIER)
    for path in (f"/api/source/{span['document_id']}",
                 f"/api/source/{span['document_id']}/page/{span['page_no']}"):
        assert client.get(path).status_code == 403, path


def test_an_adviser_with_no_disclosure_cannot_render_a_page(client):
    span = _first_span(client)
    client.post("/api/auth/login", json=ADVISER)
    r = client.get(f"/api/source/{span['document_id']}/page/{span['page_no']}")
    assert r.status_code == 403
    assert "disclose" in r.json()["detail"].lower()


def test_an_adviser_may_render_only_a_disclosed_document_kind(client):
    """A page image is a fuller disclosure than a finding derived from it, so it goes
    through the same gate — per document kind, not per case."""
    wording = _document_id(client, "BASE_WORDING")
    schedule = _document_id(client, "SCHEDULE")
    client.post("/api/consent", json={"recipient": "Licensed adviser",
                                      "fields": ["BASE_WORDING"]})
    client.post("/api/auth/login", json=ADVISER)
    granted = client.get(f"/api/source/{wording}")
    assert granted.status_code == 200, granted.text
    withheld = client.get(f"/api/source/{schedule}")
    assert withheld.status_code == 403
    assert "SCHEDULE" in withheld.json()["detail"]


def test_deleting_the_case_makes_the_source_page_unreadable(client):
    """The strongest promise in the product has to reach the retained bytes too.

    Uploaded bytes are held in memory so the page can be shown. If deletion left them
    renderable, "delete the case" would be cosmetic in the one place it matters most —
    the original document.
    """
    span = _first_span(client)
    assert client.get(f"/api/source/{span['document_id']}").status_code == 200
    client.delete("/api/case")
    for path in (f"/api/source/{span['document_id']}",
                 f"/api/source/{span['document_id']}/page/{span['page_no']}"):
        assert client.get(path).status_code == 404, path


def test_a_new_upload_drops_the_previous_bundle_bytes(client):
    """`reset_case` must reach the byte store, or a session accumulates every PDF it has
    ever been shown."""
    span = _first_span(client)
    client.post("/api/bundle", files=[_part(SCHEDULE)])
    assert client.get(f"/api/source/{span['document_id']}").status_code == 404


# ── the module's own contract ────────────────────────────────────────────────

# ── the DEFAULT case, which is what a first-time visitor sees ────────────────

def test_the_demo_case_wording_pdf_is_viewable():
    """The screen a visitor lands on must be able to show a page.

    MEASURED. The default case is assembled from JSON fixtures, but its wording is the
    genuine published Chubb SelectPlus PDF in `06-evidence/`. Nothing mapped the stored
    filename to that path, so every citation in the default case reported "no page" —
    including the four that quote a real, on-disk, 28-page PDF. The feature was invisible
    exactly where it was first looked for.
    """
    if not sourceview.available():
        pytest.skip("PyMuPDF not installed")
    c = TestClient(app)
    c.post("/api/reset")
    brief = c.get("/api/brief").json()
    assert brief["source"] == "DEMO_BUNDLE"

    rendered = 0
    for f in brief["findings"]:
        for s in f.get("spans") or []:
            if not s.get("document_id"):
                continue
            meta = c.get(f"/api/source/{s['document_id']}").json()
            if not meta["filename"].lower().endswith(".pdf"):
                continue
            page = c.get(
                f"/api/source/{s['document_id']}/page/{s['page_no']}",
                params={"span_id": s["span_id"]}).json()
            assert page["available"] is True, page.get("reason")
            assert page["highlight"]["found"] is True, \
                f"{f['rule_id']} cites {meta['filename']} p{s['page_no']} unhighlighted"
            rendered += 1
    assert rendered >= 4, f"only {rendered} demo-case citations rendered a page"


def test_a_structured_fixture_document_says_it_has_no_pages(client):
    """Not a failure, and it must not read as one.

    The demo schedule and supporting documents are JSON. There IS no page, and the honest
    answer is to say that and point at the path that has one — never to substitute a
    different document's page under the citation.
    """
    c = TestClient(app)
    c.post("/api/reset")
    brief = c.get("/api/brief").json()
    json_span = None
    for f in brief["findings"]:
        for s in f.get("spans") or []:
            if not s.get("document_id"):
                continue
            meta = c.get(f"/api/source/{s['document_id']}").json()
            if meta["filename"].lower().endswith(".json"):
                json_span = (s, meta)
                break
        if json_span:
            break
    if json_span is None:
        pytest.skip("no JSON-backed fixture document in the demo case")
    span, meta = json_span
    assert meta["pages_viewable"] is False
    assert "structured demo data" in meta["reason"]
    page = c.get(f"/api/source/{span['document_id']}/page/{span['page_no']}",
                 params={"span_id": span["span_id"]}).json()
    assert page["available"] is False
    assert "structured demo data" in page["reason"]
    # And the quotation is still served, because it is read from the stored text.
    assert page["quote"]


def test_the_example_business_renders_a_page_for_every_single_citation():
    """The example path uploads the real PDFs, so EVERY span must resolve to a page.

    Deliberately checks every span of every finding rather than the first of each. Doing
    only the first passed while one citation silently could not be highlighted at all —
    see `test_a_citation_drawn_outside_its_page_is_found_and_labelled`.
    """
    if not sourceview.available():
        pytest.skip("PyMuPDF not installed")
    c = TestClient(app)
    manifest = c.get("/api/example/manifest").json()
    files = [_part(d["name"]) for d in manifest["documents"]]
    assert c.post("/api/bundle", files=files,
                  data={"business_name": manifest["business_name"]}).status_code == 200
    unviewable = []
    checked = 0
    for f in c.get("/api/brief").json()["findings"]:
        for s in f.get("spans") or []:
            if not s.get("document_id"):
                continue
            checked += 1
            page = c.get(f"/api/source/{s['document_id']}/page/{s['page_no']}",
                         params={"span_id": s["span_id"]}).json()
            if not page["available"] or not page["highlight"]["found"]:
                unviewable.append((f["rule_id"], page.get("reason"),
                                   page.get("highlight", {}).get("method")))
    assert checked > 20, f"only {checked} citations checked"
    assert not unviewable, f"citations with no highlighted page: {unviewable}"


def test_a_citation_drawn_outside_its_page_is_found_and_labelled():
    """MEASURED, in this project's own demo schedule.

    `02-policy-schedule.pdf` draws part of its content at y=832 on a 792pt page — below
    the page edge. pypdf reads the content stream and returns it, so the engine stored
    that line and cited it correctly. PyMuPDF clips to the page rectangle and does not,
    because the text is genuinely not visible. So the citation was real and the highlight
    was unfindable, and the drawer said "Not highlighted" about a perfectly good quote.

    The renderer now searches past the boundary and extends the rendered area to include
    the text, reporting OFF_PAGE_CONTENT — which says the view was extended and that the
    source document is at fault. The alternative, silently cropping the evidence out of
    the picture, is the worse failure.
    """
    if not sourceview.available():
        pytest.skip("PyMuPDF not installed")
    import pymupdf

    data = (EXAMPLE_DIR / "02-policy-schedule.pdf").read_bytes()
    quote = "2.17 Theft Endorsement (Full Theft): NOT APPLICABLE"

    # The premise: visible on the page? No. Present in the file? Yes.
    doc = pymupdf.open(stream=data, filetype="pdf")
    page = doc.load_page(0)
    assert not page.search_for(quote), "premise gone: the text is now inside the page"
    assert page.search_for(quote, clip=pymupdf.INFINITE_RECT()), \
        "premise gone: the text is no longer in the file at all"
    page_height = page.rect.height
    doc.close()

    out = sourceview.render_page(data, 1, quote)
    assert out.available is True
    assert out.highlight.found is True
    assert out.highlight.method == sourceview.OFF_PAGE
    note = out.highlight.as_dict()["note"]
    assert "beyond its own page boundary" in note.lower()
    assert "extended" in note.lower(), "the note must say the view was extended"
    # The render is TALLER than the page, because the page was grown to include the line.
    # `get_pixmap(clip=...)` cannot do this — it intersects the clip with the page rect —
    # so this assertion is what distinguishes a working fix from a silently clamped one.
    unextended = page_height * (sourceview.DISPLAY_DPI / 72.0)
    assert out.height > unextended, (
        f"render is {out.height}px, the same as the unextended page ({unextended}px) — "
        f"the off-page line was cropped out of the picture")


def test_an_exact_match_is_not_reported_as_off_page(client):
    """The extended search only runs when the ordinary one fails, so a normal citation
    must still come back EXACT and be rendered at the page's own size."""
    if not sourceview.available():
        pytest.skip("PyMuPDF not installed")
    span = _first_span(client)
    d = client.get(f"/api/source/{span['document_id']}/page/{span['page_no']}",
                   params={"span_id": span["span_id"]}).json()
    assert d["highlight"]["method"] == sourceview.EXACT


# ── the module's own contract ────────────────────────────────────────────────

def test_the_renderer_reports_availability_by_detection():
    st = sourceview.status()
    assert st["available"] is sourceview.available()
    assert st["renderer"] == ("pymupdf" if sourceview.available() else None)
    methods = {m["method"] for m in st["highlight_methods"]}
    assert methods == {sourceview.EXACT, sourceview.NORMALISED, sourceview.LEADING,
                       sourceview.OFF_PAGE, sourceview.NOT_FOUND}
    assert all(m["note"] for m in st["highlight_methods"])
    assert "offsets" in st["notice"]


def test_render_page_refuses_missing_bytes_rather_than_raising():
    out = sourceview.render_page(b"", 1, "anything")
    assert out.available is False
    assert "not held in this session" in out.reason
    assert out.as_dict()["highlight"]["found"] is False


def test_page_numbering_is_one_based_at_the_boundary():
    """`span.page_no` is 1-based and PyMuPDF is 0-based. An off-by-one here shows the
    wrong page under a quotation, which reads as a fabricated citation."""
    if not sourceview.available():
        pytest.skip("PyMuPDF not installed")
    data = (EXAMPLE_DIR / WORDING).read_bytes()
    assert sourceview.render_page(data, 0).available is False
    first = sourceview.render_page(data, 1)
    assert first.available is True and first.page_no == 1
    last = sourceview.render_page(data, first.page_count)
    assert last.available is True
    assert sourceview.render_page(data, first.page_count + 1).available is False
