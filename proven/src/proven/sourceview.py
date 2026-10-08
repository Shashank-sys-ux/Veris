"""Render the cited page of a source PDF, with the quotation highlighted.

WHY THIS EXISTS. The evidence drawer could show a verbatim quote, a page number and a
pair of character offsets — and a reader who wanted to check it had to go and open the
document themselves. Showing the page next to the quote is the difference between
asserting the citation is real and demonstrating it.

WHAT IT REFUSES TO DO. The highlight is located by SEARCHING the rendered page for the
quoted string. It is never inferred from the stored character offsets, and the reason is
concrete: `char_start`/`char_end` index into `page_text.text`, which is pypdf's
extraction, while the rectangles come from PyMuPDF's own text layer. The two disagree on
whitespace, on ligatures and on reading order, so mapping one onto the other would
produce a box that is confidently in the wrong place. A highlight nobody can trust is
worse than none, so when the string cannot be found this module says so — see
`Highlight.found` — and the caller renders the page unmarked and admits it rather than
drawing a rectangle it guessed at.

The match is reported with the METHOD that found it, so "we highlighted this" is always
qualified by how. EXACT means the full quotation was found on the page as one string.
The narrowed methods mean less than the whole quote was located, which is a weaker claim
and is labelled as one.
"""
from __future__ import annotations

import base64
import importlib.util
import re
from dataclasses import dataclass, field
from typing import Optional

# Display resolution. Lower than the 200 dpi `ocr.rasterise_pdf_pages` uses, because that
# figure is chosen for Tesseract's accuracy curve and this image is for a human eye in a
# 440px drawer. 144 dpi is exactly 2x CSS pixel density, so the page is crisp on a
# retina display without shipping a 2 MB PNG for a page nobody zoomed into.
DISPLAY_DPI = 144
FULLSCREEN_DPI = 200

# How the quotation was located, weakest last. Reported verbatim to the interface.
EXACT = "EXACT"
NORMALISED = "NORMALISED_WHITESPACE"
LEADING = "LEADING_FRAGMENT"
OFF_PAGE = "OFF_PAGE_CONTENT"
NOT_FOUND = "NOT_FOUND"

METHOD_NOTES: dict[str, str] = {
    EXACT: "The whole quotation was found on this page as a single run of text.",
    NORMALISED: ("The quotation was found after collapsing runs of whitespace. PDF "
                 "extraction disagrees with itself about spacing inside a line; the "
                 "words and their order are unchanged."),
    LEADING: ("Only the opening of the quotation could be located, so the highlight "
              "marks where it starts and not its full extent. The quoted text above is "
              "still the complete verbatim span."),
    OFF_PAGE: ("This document draws the quoted line BEYOND its own page boundary, so the "
               "text is in the file but a printer would clip it. The view below has been "
               "extended past the page edge to show it, and the area outside the page is "
               "marked. This is a defect in the source document, not in the citation — "
               "the quotation is exactly what the document contains."),
    NOT_FOUND: ("The quotation could not be located on the rendered page, so nothing is "
                "highlighted. The page is shown unmarked rather than with a rectangle "
                "drawn somewhere plausible. This is usually a page whose text is drawn "
                "as vectors or images, which the two extractors read differently."),
}

# Long quotations are the ones least likely to match as one string, because any single
# extraction difference anywhere in them defeats the search. This is how much of the
# opening is tried as a fallback.
_FRAGMENT_CHARS = 60
_MIN_FRAGMENT_CHARS = 12


def available() -> bool:
    """Whether a page can be rendered at all. Detected, never asserted."""
    return importlib.util.find_spec("pymupdf") is not None


@dataclass
class Highlight:
    found: bool
    method: str
    rect_count: int = 0
    note: str = ""

    def as_dict(self) -> dict:
        return {"found": self.found, "method": self.method,
                "rect_count": self.rect_count,
                "note": self.note or METHOD_NOTES.get(self.method, "")}


@dataclass
class RenderedPage:
    available: bool
    page_no: int = 0
    page_count: int = 0
    width: int = 0
    height: int = 0
    image_png: bytes = b""
    highlight: Highlight = field(
        default_factory=lambda: Highlight(False, NOT_FOUND))
    reason: str = ""

    def as_dict(self, *, include_image: bool = True) -> dict:
        out = {
            "available": self.available,
            "page_no": self.page_no,
            "page_count": self.page_count,
            "width": self.width,
            "height": self.height,
            "highlight": self.highlight.as_dict(),
            "reason": self.reason,
        }
        if include_image and self.image_png:
            out["image"] = ("data:image/png;base64,"
                            + base64.b64encode(self.image_png).decode("ascii"))
        return out


def _collapse(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _search(page, quote: str, clip=None) -> tuple[list, str]:
    """Locate `quote` on `page`. Returns (rects, method).

    Three attempts, weakest last, and each one is reported by name so the interface can
    say how much of the quotation the rectangles actually cover. `clip` is passed straight
    to PyMuPDF: the caller uses it to re-search beyond the page boundary once the ordinary
    search has failed — see `render_page`.
    """
    cleaned = _collapse(quote)
    if not cleaned:
        return [], NOT_FOUND

    def find(needle: str):
        try:
            return page.search_for(needle, clip=clip) if clip is not None \
                else page.search_for(needle)
        except Exception:
            return None

    rects = find(cleaned)
    if rects:
        return list(rects), EXACT

    # PyMuPDF matches within a line; a quotation spanning a line break will not be found
    # whole. Searching the collapsed form against the page's own collapsed text is not
    # possible through `search_for`, so fall back to the opening fragment, which is
    # usually within one line and is enough to put the reader in the right place.
    fragment = cleaned[:_FRAGMENT_CHARS]
    # Do not cut mid-word: a partial token is both less likely to match and misleading
    # about what was searched for.
    if len(cleaned) > _FRAGMENT_CHARS and " " in fragment:
        fragment = fragment.rsplit(" ", 1)[0]
    if len(fragment) >= _MIN_FRAGMENT_CHARS:
        rects = find(fragment)
        if rects:
            return list(rects), (EXACT if fragment == cleaned else LEADING)

    # Last attempt: the first line of the quotation as the document itself broke it.
    first_line = (quote or "").strip().splitlines()[0].strip() if (quote or "").strip() else ""
    if len(first_line) >= _MIN_FRAGMENT_CHARS and first_line != fragment:
        rects = find(first_line)
        if rects:
            return list(rects), NORMALISED

    return [], NOT_FOUND


def _grow_mediabox(page, rects) -> bool:
    """Enlarge the page so `rects` fall inside it. True when the page was changed.

    The two coordinate systems have to be reconciled and getting it wrong renders a blank
    strip. `page.rect` measures y DOWNWARD from the top of the page; the MediaBox is PDF
    space, measuring y UPWARD from the bottom. So content overflowing the BOTTOM of
    `page.rect` is below the MediaBox's `y0`, and the box has to grow in the negative
    direction there.
    """
    try:
        import pymupdf

        rect = page.rect
        overflow = pymupdf.Rect(rect)
        for r in rects:
            overflow |= r
        below = max(0.0, overflow.y1 - rect.y1)       # past the bottom edge
        above = max(0.0, rect.y0 - overflow.y0)       # past the top edge
        right = max(0.0, overflow.x1 - rect.x1)
        left = max(0.0, rect.x0 - overflow.x0)
        if not (below or above or right or left):
            return False
        pad = 12.0                                    # so the line is not flush to the cut
        box = page.mediabox
        page.set_mediabox(pymupdf.Rect(
            box.x0 - (left + pad if left else 0.0),
            box.y0 - (below + pad if below else 0.0),
            box.x1 + (right + pad if right else 0.0),
            box.y1 + (above + pad if above else 0.0)))
        return True
    except Exception:
        # A page whose MediaBox cannot be rewritten is reported, never guessed at.
        return False


def render_page(pdf_bytes: bytes, page_no: int, quote: str = "",
                dpi: int = DISPLAY_DPI) -> RenderedPage:
    """Render one 1-BASED page to PNG, highlighting `quote` where it can be found.

    `page_no` is 1-based to match `span.page_no` as stored by `ingest.ingest_pdf_bytes`,
    while PyMuPDF indexes from 0. The conversion happens here, once, rather than at every
    call site — an off-by-one on this boundary shows the wrong page under a quotation,
    which reads as a fabricated citation.
    """
    # ORDER MATTERS, AND IT WAS WRONG.
    #
    # The PyMuPDF check used to come first, so a citation whose source bytes are simply
    # not in the session was reported as "install pymupdf" — advice that would not have
    # helped, about a dependency that was not the problem. Absence of the file is a fact
    # about the INPUT and is knowable without any renderer at all, so it is answered
    # first and the optional-dependency notice is reserved for the case it describes.
    if not pdf_bytes:
        return RenderedPage(
            available=False,
            reason=("The source file for this citation is not held in this session. "
                    "Uploaded bytes live in memory for the life of the case and are "
                    "dropped when the case is replaced or deleted."))
    if not available():
        return RenderedPage(
            available=False,
            reason=("Page images need PyMuPDF, which is not installed here. The "
                    "quotation, its page number and its offsets are unaffected — only "
                    "the picture of the page is missing. Install pymupdf to enable it."))
    try:
        import pymupdf
    except Exception as exc:                        # pragma: no cover - guarded above
        return RenderedPage(available=False, reason=f"PyMuPDF failed to load: {exc}")

    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        return RenderedPage(
            available=False,
            reason=f"This document could not be opened for display: {exc}")

    try:
        count = doc.page_count
        index = int(page_no) - 1
        if index < 0 or index >= count:
            return RenderedPage(
                available=False, page_count=count,
                reason=(f"Page {page_no} is outside this document, which has "
                        f"{count} page{'s' if count != 1 else ''}."))
        page = doc.load_page(index)

        rects, method = _search(page, quote) if quote else ([], NOT_FOUND)

        # MEASURED, on this project's own demo schedule. `02-policy-schedule.pdf` draws
        # part of its content at y=832 on a 792pt page — below the page edge. pypdf reads
        # the content stream and returns it, so the engine stored the line and cited it
        # correctly; PyMuPDF clips to the page rectangle and does not, because the text is
        # genuinely not visible. The citation was real and the highlight was unfindable, so
        # the drawer said "Not highlighted" about a perfectly good quote.
        #
        # Rather than leave a reader unable to see their own evidence, search past the
        # boundary and, if the text is out there, GROW THE PAGE so it comes into view.
        # `get_pixmap(clip=...)` cannot do this — it intersects the clip with the page
        # rectangle, so a larger clip is silently clamped and renders the same crop.
        # Enlarging the MediaBox is what actually works.
        #
        # OFF_PAGE says plainly that the view was extended and that the source document is
        # at fault, so an extended render is never passed off as an ordinary page.
        off_page_note = ""
        if quote and not rects:
            beyond, _ = _search(page, quote, clip=pymupdf.INFINITE_RECT())
            if beyond:
                if _grow_mediabox(page, beyond):
                    page = doc.reload_page(page)
                    rects, _ = _search(page, quote)
                    method = OFF_PAGE
                if not rects:
                    # The text is in the file but could not be brought into view. Say
                    # exactly that instead of blaming extractor disagreement.
                    off_page_note = (
                        "The quoted line is present in this document's text but is drawn "
                        "outside the printable page area, and the page could not be "
                        "enlarged to bring it into view. Nothing is highlighted rather "
                        "than a rectangle drawn somewhere plausible.")
                    method = NOT_FOUND

        for rect in rects:
            try:
                annot = page.add_highlight_annot(rect)
                # Amber rather than the product's blue: the blue is used for interactive
                # affordances everywhere else, and a highlight is not clickable.
                annot.set_colors(stroke=(1.0, 0.85, 0.2))
                annot.update()
            except Exception:
                continue

        zoom = max(0.5, float(dpi) / 72.0)
        pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom))
        highlight = Highlight(
            found=bool(rects),
            method=method if rects else NOT_FOUND,
            rect_count=len(rects),
            note=off_page_note)
        if not quote:
            highlight = Highlight(
                found=False, method=NOT_FOUND, rect_count=0,
                note=("No quotation was named for this page, so nothing is "
                      "highlighted."))
        return RenderedPage(
            available=True, page_no=int(page_no), page_count=count,
            width=pix.width, height=pix.height, image_png=pix.tobytes("png"),
            highlight=highlight)
    finally:
        try:
            doc.close()
        except Exception:
            pass


def status() -> dict:
    return {
        "renderer": "pymupdf" if available() else None,
        "available": available(),
        "display_dpi": DISPLAY_DPI,
        "fullscreen_dpi": FULLSCREEN_DPI,
        "highlight_methods": [
            {"method": m, "note": METHOD_NOTES[m]}
            for m in (EXACT, NORMALISED, LEADING, OFF_PAGE, NOT_FOUND)
        ],
        "notice": ("The highlight is found by searching the rendered page for the "
                   "quoted string, never by mapping the stored character offsets onto "
                   "PDF coordinates — the two extractors disagree, and a confident box "
                   "in the wrong place is worse than no box. A quotation that cannot be "
                   "located is reported as NOT_FOUND and the page is shown unmarked."),
    }
