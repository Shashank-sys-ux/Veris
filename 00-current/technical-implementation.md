# PROVEN — technical implementation

**Read this first, then build.** This document assumes no prior context. It is
written so that someone who has never seen `finalized-idea.md` can build the
system, and so that someone who has can find the exact file to open.

**What PROVEN does.** Reads the insurance and non-insurance documents a small
business already holds, computes what its policy would actually pay, grades every
finding by the strength of the evidence behind it, reports how much of the
document it could not account for, and hands a licensed adviser a prepared case.

**Non-negotiable design rule.** Nothing consequential is decided by a model.

**Stated precisely, because the loose version is falsifiable: THERE IS NO MODEL IN
THIS BUILD AT ALL.** Not in Layer 1, not in Layer 2, not anywhere. Layer 1 is pypdf
text extraction. Layer 2 is deterministic pattern detection plus two data-driven
classifiers. Layers 3 and 4 are ordinary code — string, integer, date and `Decimal`
comparisons a domain reviewer can read against the YAML. An earlier revision of this
document labelled Layers 1 and 2 "(model)" in the architecture diagram. That was
wrong, and it was the wrong thing to want: deterministic and auditable is the design
choice, and a system that decides nothing by generation cannot hallucinate a finding.
Where a model would eventually help — classifying provisions in a wording nobody has
read — is on the roadmap and is stated as absent, not implied to be present.

---

## 0. Status of the three pre-build tasks

All three are now complete. This is what changed.

| Task | Status | Output |
|---|---|---|
| Taxonomy | **Done** | `proven/taxonomy/taxonomy.yaml` — 40+ codes, every clause code traced to a real clause in the Chubb wording |
| Fixtures | **Done** | `proven/fixtures/` — schedule, CPF record, work pass list, accounts, tenancy, ACRA profile, 2 endorsements (one deliberately illegible) |
| Reading gaps | **3 of 4 closed** | See §1. JTC lease covenant still unread — it is a trigger row, not a demo dependency |

### Findings from closing the reading gaps that change the build

Read from `06-evidence/extracted-text/chubb-selectplus-fulltext.txt`, extracted with pypdf from the real PDF.

1. **Premium Payment Warranty consequence — found, and it is cover-defeating.**
   cl 3.20(a): cover is *automatically terminated* immediately after the 60-day
   period. Was an open hedge; now a headline trigger. Pure date arithmetic.

2. **Theft exclusion is cl 5.1(c)(i)**, under "5.1 Damage to Property Exclusion".
   Vacancy is cl 5.1(b)(v). Both now precisely citable. `5.x` is gone.

3. **The average formula is confirmed absent from Chubb.** All 28 pages searched.
   cl 4.2 states the 85% trigger and the words "proportionately reduced" and
   nowhere states the proportion. Verified rather than assumed. **But Liberty
   states it verbatim** — see the cross-carrier section below, which changes this
   from `UNESTABLISHED` to a per-carrier `MARKET_CONVENTION` / `PROVEN` split.

4. **NEW — there is no condition-precedent declaration clause in this wording.**
   Zero hits for "condition precedent" across all 28 pages. This **disproves** a
   generalisation in `finalized-idea.md §7` which said ordinary Singapore SME
   wordings make statutory compliance a condition precedent via a general
   declaration clause. True of EQ Insurance (GC13 in *Grace Electrical*), **false
   of Chubb Select+.** Demo beat 6 must be reworded — see §9.

   This is a better story than the error was. The same statutory-compliance
   obligation carries totally different consequences in two Singapore policies
   depending on a clause nobody reads. The engine detects which. That is
   authority resolution doing visible work.

5. **NEW — cl 3.1 Alteration is self-executing and is the strongest clause in the
   document.** "until Chubb agrees in writing to accept liability for such
   altered risk, Chubb shall have no liability under this Policy for such
   altered risk." It states its own consequence and needs no declaration clause
   to bite. Change of use now works directly on the real wording, with no
   dependency on the *Grace Electrical* analogy.

6. **NEW — cl 4.9 Minimum Security is a genuinely verifiable physical control**
   (doors locked, ground-floor windows closed when unoccupied). Partially
   rehabilitates the physical-verification roadmap that the missing
   fire-suppression warranty had killed.

7. **NEW — order of operations is verified, not assumed.** cl 3.12 states the
   deductible applies "after the application of all other terms... including any
   condition of average." So: **average → sub-limits → deductible.** Hard-code
   that sequence and cite 3.12 for it.

### Cross-carrier scan — three carriers, and it changes the data model

Four topics scanned across Chubb (28pp), MSIG SUMO (41pp) and Liberty SMECare
(49pp). Full page-cited results: `06-evidence/cross-carrier-findings.md`.
Reproduce with `python 06-evidence/scripts/scan_corpus.py all`.

| Behaviour | Chubb | MSIG | Liberty |
|---|---|---|---|
| Average threshold | 85% | **none — any shortfall** | none in GC4; separate 85% relief |
| Average formula in text | No | No | **Yes, verbatim** |
| General condition-precedent declaration | **Absent** | **Present, sweeping** | Arbitration only |
| Premium payment warranty | 60d / auto-terminate / S$25 | identical | identical |
| Unoccupancy day count | **14** | **30** | **30, but 7 in one section** |

**Four consequences for the build. These are not commentary, they are constraints.**

**(a) No clause behaviour may be stored per-policy or per-carrier.** Liberty uses 30
consecutive days in its alteration provision and most peril exclusions but **seven**
in another section. A single insured, one document, two different unoccupancy
tripwires. Therefore unoccupancy, thresholds and day counts live on
`clause_instance` rows keyed to the section they were read from — never as a
`policy.unoccupancy_days` column. If you find yourself adding such a column, that is
the bug.

**(b) The average threshold is not a constant.** Chubb bites below 85%; MSIG bites at
the first dollar of shortfall. A hardcoded 85% would silently **under-report** every
MSIG insured. `threshold_pct` is a nullable field read from the clause; null means
"any shortfall", and null is not the same as absent-and-unknown.

**(c) `MARKET_CONVENTION` becomes a fourth evidence class, not a footnote.** The
average arithmetic is a quoted insurer span on Liberty and an unstated convention on
Chubb and MSIG. Same rule, same engine, different class, decided by reading. Add it
to the derivation table in §6.1 alongside `PROVEN`, `DECLARED`, `UNESTABLISHED`.

**(d) The premium payment warranty is the one rule with no abstention path.**
Identical across three carriers to the dollar, because it is the GIA market-standard
clause. Pure date arithmetic, `PROVEN`, deterministic, consequence is total loss of
cover rather than a reduction. Build it first — it is the highest-confidence and
highest-value computation in the product. One carve-out to respect: MSIG excludes
Section 4 Work Injury Compensation, because WICA cover is compulsory and cannot
lapse for non-payment. The rule needs a `section_scope` exclusion list.

**(e) The declaration-clause finding vindicates §6.5 and must not be softened.**
Chubb has no general declaration clause, MSIG has a sweeping one, Liberty confines it
to arbitration. And on MSIG the label still does not settle the question, because
*Grace Electrical* at [17]–[25] requires clause-by-clause construction. So "does
breach forfeit cover?" is not merely unknown to us — it is **unavailable from the
text**, for all three. Locate, quote, escalate. Never adjudicate. The corpus now
proves this is engineering necessity.

---

## 1. Stack and prerequisites

Already proven working on this machine: Python 3.13.12, pypdf 6.10.2.

```
Python           3.11+       (developed and tested on 3.12.7)
pypdf            6.10.2      PDF text extraction
FastAPI          0.136.3     API layer
uvicorn          0.34.0      ASGI server
pydantic         2.12.4      request schema validation
python-multipart 0.0.22      multipart upload (POST /api/bundle)
PyYAML           6.0.3       taxonomy, classification and rule loading
pytest           9.1.1       tests
hypothesis       6.155.6     property tests for the arithmetic
httpx            0.28.1      test client transport
SQLite           stdlib      via sqlite3, no server
Vanilla HTML/CSS/JS          front end — no framework, no build step
```

**Versions are PINNED, not ranged** (`pyproject.toml` and `requirements.txt` carry the
same pins). An open range means the build that passes today can fail on demo day
because a transitive dependency shipped overnight.

**The front end is vanilla, deliberately.** An earlier revision of this document said
"React + Vite". It never was: `proven/web/` is `index.html`, `app.js` and
`styles.css`, with zero npm dependencies and no build step. That is the better answer
for a four-minute demo — nothing to install, nothing to compile, nothing that can fail
on a borrowed laptop — and the document now says what the code does.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Native PDF only.** No OCR in the demo path. OCR belongs in the evaluation
harness. `arXiv:2605.00911` found good OCR character accuracy failing to produce
good downstream retrieval, and an OCR failure must never be what decides whether
a citation lands on stage.

---

## 2. Repository layout

New repository. Nothing ported from RDTII-AEGIS — T&C clause 12.1(o)(iii) bars
substantial duplication of work entered in any other competition, and 12.1(q)
makes it immediate disqualification. Techniques are reusable as background IP
under clause 14.2; code and taxonomy are not.

```
proven/
  pyproject.toml             pinned deps, package data, pytest config
  requirements.txt           the same pins, for pip install -r
  taxonomy/
    taxonomy.yaml            clause codes, all traced to real clauses
    classification.yaml      L2 step 2 — heading-keyword rules, as DATA
  fixtures/
    README.md                persona and planted defects
    hock-lee-schedule.json
    hock-lee-supporting-documents.json
    hock-lee-conflicting-endorsements.json     produces the precedence tie
  src/proven/
    errors.py               typed intake errors -> actionable HTTP responses
    db.py                   schema creation, connection, indices
    ingest.py               L1 — locate. Validation, extraction, page cache
    detect.py               L1 — carrier and document-kind detection
    account.py              L2 — detect (5 schemes) + classify (2 steps)
    classify.py             L2 step 2 — the heading-keyword matcher
    extract.py              L2b — documents -> named facts (both provenances)
    resolve.py              L3 — precedence; never resolves a tie
    arithmetic.py           L3 — settlement maths, Decimal only
    grading.py              L3 — evidence class derivation
    gates.py                L3 — the four abstention gates
    rules.py                rule loader and deterministic evaluators
    rules/
      property.yaml         arithmetic and conditional-exclusion rules
      compulsion.yaml       WICA, migrant worker, date triggers
      alteration.yaml       cl 3.1 change-of-use rules
      precedence.yaml       conflicting-endorsement rules
    events.py               the nine change events (spec §7)
    brief.py                L4 — Review Brief assembly, `never` enforcement
    pipeline.py             orchestration, case lifecycle, consent, record
    sessions.py             per-session case isolation
    api.py                  FastAPI app
  tests/                    158 tests
    pdfbuild.py             minimal PDF writer, so intake is testable
    conftest.py
    test_api.py             sessions, consent as access control, events
    test_arithmetic.py      property tests via hypothesis
    test_classification.py  the two classifiers and the wall between them
    test_eval_harness.py    the harness's own honesty properties
    test_extract.py         the extraction contract
    test_features.py
    test_frontend.py        selector/route contract + accessibility
    test_gates.py
    test_grading.py
    test_intake.py          upload validation and end-to-end on uploads
    test_invariants.py      schema and end-to-end invariants
  eval/
    harness.py              label scoring, split by how labels were derived
    citation_audit.py       citation fidelity — measurable with no reviewer
    labels/
      example-label.json        derivation ENGINE_OUTPUT (baseline only)
      objective-hock-lee.json   derivation INDEPENDENT_OBJECTIVE (measuring)
      SCHEMA.md
  web/                       vanilla front end: index.html, app.js, styles.css
06-evidence/policy-wordings/  real source documents + extraction scripts
```

---

## 3. Data model

Write this first. Everything else is a function over it. Two stores — the
separation is the entire privacy guarantee.

```sql
-- ── SOURCE (immutable) ──────────────────────────────────────────────────
CREATE TABLE document (
  id            TEXT PRIMARY KEY,
  business_id   TEXT NOT NULL,
  kind          TEXT NOT NULL,   -- BASE_WORDING|SCHEDULE|ENDORSEMENT|PROPOSAL
                                 -- CPF_RECORD|WORK_PASS_LIST|TENANCY|ACCOUNTS
                                 -- SUPPLIER_INVOICE|ACRA_PROFILE|WIC_SCHEDULE
  author_class  TEXT NOT NULL,   -- INSURER|AUTHORITY|THIRD_PARTY|SELF
  filename      TEXT NOT NULL,
  sha256        TEXT NOT NULL,
  page_count    INTEGER,
  is_fixture    INTEGER NOT NULL DEFAULT 0,
  ingested_at   TEXT NOT NULL
);

CREATE TABLE page_text (          -- never updated after insert
  document_id  TEXT NOT NULL REFERENCES document(id),
  page_no      INTEGER NOT NULL,
  text         TEXT NOT NULL,
  method       TEXT NOT NULL,     -- pypdf|ocr
  PRIMARY KEY (document_id, page_no)
);

CREATE TABLE text_fix (           -- parallel layer; source stays pristine
  id TEXT PRIMARY KEY, document_id TEXT, page_no INTEGER,
  char_start INTEGER, char_end INTEGER, corrected TEXT
);

-- ── ACCOUNTING ──────────────────────────────────────────────────────────
CREATE TABLE span (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES document(id),
  page_no INTEGER NOT NULL,
  char_start INTEGER NOT NULL,
  char_end INTEGER NOT NULL,
  quoted_text TEXT NOT NULL,
  sha256 TEXT NOT NULL
);

CREATE TABLE provision (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES document(id),
  span_id TEXT NOT NULL REFERENCES span(id),
  clause_ref TEXT,               -- e.g. "5.1(c)(i)"
  taxonomy_code TEXT,            -- NULL iff status = UNACCOUNTED
  status TEXT NOT NULL,          -- CLASSIFIED | UNACCOUNTED
  authority_rank INTEGER NOT NULL -- ENDORSEMENT 1, SCHEDULE 2, BASE 3, PROPOSAL 4
);

-- ── COMPUTATION ─────────────────────────────────────────────────────────
CREATE TABLE operand (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES "case"(id),
  name TEXT NOT NULL,
  value TEXT,
  unit TEXT,
  span_id TEXT REFERENCES span(id),
  evidence_class TEXT NOT NULL    -- DERIVED, never hand-set. See grading.py
);

CREATE TABLE finding (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES "case"(id),
  rule_id TEXT NOT NULL,
  rule_version INTEGER NOT NULL,
  output_state TEXT NOT NULL,     -- DOCUMENTED | NOT_CONFIRMED
                                  -- INFORMATION_MISSING | REQUIRES_AUTHORISED_REVIEW
  evidence_class TEXT NOT NULL,   -- weakest operand wins
  headline TEXT NOT NULL,
  resolution_path TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE finding_operand (finding_id TEXT, operand_id TEXT);
CREATE TABLE finding_span (finding_id TEXT, span_id TEXT, role TEXT);
                                  -- role: TRIGGER | EVIDENCE | GOVERNING

-- ── CASE (transient, SME-scoped, deletable) ─────────────────────────────
CREATE TABLE "case" (
  id TEXT PRIMARY KEY, business_id TEXT NOT NULL,
  opened_at TEXT NOT NULL, state TEXT NOT NULL, deleted_at TEXT
);

CREATE TABLE disclosure (
  id TEXT PRIMARY KEY, case_id TEXT NOT NULL,
  recipient TEXT NOT NULL, fields TEXT NOT NULL,
  granted_at TEXT, expires_at TEXT, revoked_at TEXT
);

CREATE TABLE audit (
  id TEXT PRIMARY KEY, actor TEXT, action TEXT,
  object_type TEXT, object_id TEXT, at TEXT NOT NULL
);

-- ── RECORD (portable, append-only, established facts only) ──────────────
CREATE TABLE record_fact (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  attribute TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT,
  basis_document_id TEXT NOT NULL REFERENCES document(id),
  basis_span_id TEXT REFERENCES span(id),
  author_class TEXT NOT NULL,
  as_at_date TEXT,
  appended_at TEXT NOT NULL,
  prev_hash TEXT,
  hash TEXT NOT NULL
);
-- There is deliberately NO violation / breach / deficiency / score column
-- anywhere above. That absence IS the privacy guarantee. Do not add one
-- "temporarily". A judge will be invited to look for it.
```

Three properties fall out of the schema rather than out of developer discipline.
`operand.evidence_class` is derived from `document.author_class`, so it cannot be
overstated under time pressure. `finding` exists only under `case`, so deleting a
case removes every negative finding. `record_fact` is hash-chained and has
nowhere to put a black mark.

---

## 4. Layer 1 — Locate

Layer 1's only job is to find, hash and store spans. It concludes nothing, and it
contains no model — it is pypdf text extraction plus validation.

**Because the input is now "whatever documents a small business holds", validation is
the normal case rather than the exceptional one.** `ingest.extract_pdf_pages` refuses,
with a message the owner can act on, on: zero bytes, not a PDF (magic-byte check),
password-protected, over the 20 MB byte cap, over the 400-page cap, unparseable, and
no text layer at all — which is what a photograph looks like to a native extractor.
Caps are enforced BEFORE pypdf sees the bytes, because pypdf on an untrusted file is a
denial-of-service surface. Failures are per file: one corrupt PDF in a bundle of six is
reported against that file and the other five are still reviewed.

Uploaded bytes are never written to disk, and a caller-supplied filename is stripped of
every path component before it is stored or displayed.

Extraction is cached on the **sha256 of the file's own bytes**, so it is
content-addressed and has no invalidation problem: the same bytes always yield the same
pages, and different bytes cannot collide onto a cached entry. Re-parsing the immutable
28-page demo wording on every run cost ~1.2s a time and made the test suite three times
slower than it needed to be.

```python
def ingest(path: Path, kind: str, author_class: str, business_id: str) -> str:
    """Extract, hash, and store. Returns document_id."""
    reader = PdfReader(str(path))
    doc_id = new_id()
    sha = sha256_file(path)
    insert_document(doc_id, business_id, kind, author_class, path.name, sha,
                    len(reader.pages))
    for page_no, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        insert_page_text(doc_id, page_no, text, method="pypdf")
    return doc_id
```

Rules that are not optional:

- `page_text` is written once and never updated. Corrections go to `text_fix`.
- Every `span` records `char_start`, `char_end` and a hash of `quoted_text`.
- Fixtures are ingested through the same path as real PDFs, with
  `is_fixture = 1`, so the demo exercises real code.

---

## 5. Layer 2 — Account

Every operative provision gets exactly one taxonomy code, or lands in
`UNACCOUNTED` where it is quoted and counted.

**The invariant, asserted in code and in tests:**

```python
assert classified_count + unaccounted_count == detected_count
```

Segmentation for this wording is tractable because the document is regularly
numbered. Detect provisions with a clause-number regex, then classify:

```python
CLAUSE_RE = re.compile(
    r'^\s*(\d{1,2}\.\d{1,2}(?:\([a-z]\))?(?:\([ivx]+\))?)\s+(.{0,80})', re.M)
```

**DETECTION IS SCHEME-PLURAL, because clause numbering is not a market standard.**
A single dotted-decimal regex works on Chubb and finds nothing in a wording that uses
`GC12`, `SECTION 3` or no numbers at all. `account.DETECTION_SCHEMES` carries one
detector per convention observed in the corpus — `NUMERIC_DOTTED`, `ALPHA_PREFIXED`,
`NUMERIC_SIMPLE`, `SECTION`, plus `UPPER_HEADING` used only as a fallback for
narrative wordings that number nothing. Every scheme that fired is reported by name
with its yield, so a count is never a number whose provenance the reader has to guess.

Two consequences worth stating:
- `CL` is deliberately absent from the alpha-prefix list. It would match prose such as
  "cl 3.20 provides..." at a line start and invent a provision out of a citation.
- Only clause-level schemes feed the boundary gate and citation checking, because a
  citation is a clause reference. A `SECTION 2` heading sitting between a clause and
  its own body must not be mistaken for the enclosing provision.

Classification order — cheapest first:

1. **Exact clause-ref map, per carrier.** The map is keyed on
   `(carrier, clause_ref)` — never on `clause_ref` alone, because the same code
   sits at different references in different wordings. Deterministic, zero model
   calls, and it covers every demo finding.

   **Chubb Select+** (verified, 28pp):
   `4.2 → ADEQ.AVERAGE_CONDITION`, `5.1(c)(i) → EXCL.THEFT_FORCIBLE_ENTRY`,
   `3.1 → COND.ALTERATION_NOTICE`, `3.20 → COND.PREMIUM_PAYMENT_WARRANTY`,
   `3.12 → LIMIT.DEDUCTIBLE`, `4.9 → COND.MINIMUM_SECURITY`,
   `4.13 → COND.CLAIM_TIME_LIMIT`, `3.13 → COND.DISCLOSURE`,
   `3.21 → COND.STATUTORY_COMPLIANCE_GENERAL`, `5.1(b)(v) → EXCL.VACANCY_WATER`,
   `2.35 → DEFN.VACANT`.

   **MSIG SUMO** (verified on four topics, 41pp):
   `GC12 → ADEQ.UNDERINSURANCE_NO_THRESHOLD`, `GC17 → COND.PRECEDENT_PREMIUM_HISTORY`,
   `preamble p.1 + GC p.36 → COND.DECLARATION_CLAUSE_GENERAL`,
   `PPW p.41 → COND.PREMIUM_PAYMENT_WARRANTY`,
   `GC p.37(b) → COND.UNOCCUPANCY_ALTERATION_30D`.

   **Liberty SMECare** (verified on four topics, 49pp):
   `GC4 → ADEQ.AVERAGE_CONDITION`, `cl 5 Basis of Settlement → ADEQ.AVERAGE_FORMULA`,
   `p.6 Basis of Insurance → ADEQ.AVERAGE_FORMULA`,
   `cl 14 → COND.PREMIUM_PAYMENT_WARRANTY`,
   `p.45(b) → COND.UNOCCUPANCY_ALTERATION_30D`,
   `p.31 → COND.UNOCCUPANCY_EXCLUSION_7D`.

   Note that `COND.UNOCCUPANCY_*` resolves to **two different codes within Liberty**,
   at 30 and 7 days. That is the point of keying on clause instance rather than
   carrier. `ADEQ.AVERAGE_FORMULA` exists as a code precisely because one carrier
   populates it and two leave it null.
2. **Heading keyword match** for the remainder. **IMPLEMENTED**, as data in
   `taxonomy/classification.yaml`, applied by `classify.py`. It classifies a provision
   by what the provision calls itself, which is weaker evidence than a verified
   reference, and it is labelled as such everywhere it surfaces:

   - every provision row records `classifier = EXACT_MAP | HEADING_KEYWORD`;
   - the accounting header reports the two counts **separately**, and
     `verified_classified` — the only number a coverage claim may rest on — counts
     step 1 alone;
   - **a keyword classification may not feed a finding.** Rules check
     `account.mapped_codes(carrier)`, which is the hand-verified table. Asserted end
     to end in `test_classification.py::test_keyword_classification_never_feeds_a_finding`.
   - **ambiguity abstains.** Two candidate codes for one provision leaves it
     `UNACCOUNTED` with both candidates recorded. The engine that refuses to break a
     precedence tie does not get to break a classification tie either.

   Measured effect on the Chubb wording: 97 detected, 13 verified + 45 keyword = 58
   classified, 39 unaccounted and quoted. Previously 9 classified and 83 unaccounted.

3. **Model classification** — **NOT IMPLEMENTED, AND NOT CLAIMED.** There is no model
   anywhere in this codebase: no LLM call, no API key, no embedding, no classifier
   weights. The accounting header says so in the text it renders on screen, so a judge
   reading the UI is told rather than left to assume. If it is ever built it must be
   constrained to emit a taxonomy code or `UNACCOUNTED`, may not invent a code, and
   must not be enabled before there is a measured error rate — it is the only part of
   the system where a model would touch classification.

**Report the real counts.** Do not put an invented number on a slide. Compute
detected/classified/unaccounted from the actual document and show the unaccounted
provisions quoted on screen.

**A wording this build cannot segment reports `detected = 0` and says so.** Reporting
nothing found on a document we could not read would look like a clean bill of health.

---

## 6. Layer 3 — Resolve and compute. No model.

### 6.1 Grading — derived, never set

```python
AUTHOR_TO_CLASS = {
    "INSURER": "PROVEN", "AUTHORITY": "PROVEN", "THIRD_PARTY": "PROVEN",
    "SELF": "DECLARED",
}

def grade_operand(span_id: str | None, author_class: str) -> str:
    if span_id is None:
        return "UNESTABLISHED"          # no span in any document
    return AUTHOR_TO_CLASS[author_class]

def grade_finding(operands: list[Operand], computation_span: str | None) -> str:
    """
    Weakest link wins, over two independent axes:

      1. the OPERANDS  - do we have a span for every input?
      2. the COMPUTATION - does the wording state how to combine them?

    Axis 2 exists because of a measured fact, not a hypothetical. Liberty SMECare
    states the average arithmetic verbatim ("such proportion of the loss or damage
    as the sum insured bears to the value of all property", p.6 and p.46). Chubb
    cl 4.2 and MSIG GC12 say "proportionately reduced" and stop. So a finding can
    have perfect insurer-authored operands and still not have insurer-authored
    arithmetic. Collapsing the two axes would force us to either overstate Chubb
    or understate Liberty.
    """
    if any(o.evidence_class == "UNESTABLISHED" for o in operands):
        return "UNESTABLISHED"          # a required input has no span anywhere

    if computation_span is None:
        return "MARKET_CONVENTION"      # inputs are evidenced, the maths is not

    if any(o.evidence_class == "DECLARED" for o in operands):
        return "DECLARED"

    return "PROVEN"
```

Ordering in that function is deliberate. `UNESTABLISHED` outranks
`MARKET_CONVENTION` because a missing input is a worse defect than unstated
arithmetic — with no value at risk there is nothing to compute either way.
`MARKET_CONVENTION` outranks `DECLARED` because unstated arithmetic taints the
whole computation, whereas a self-declared input taints one operand.

There is no code path that accepts an `evidence_class` argument from a caller.
That is deliberate.

### 6.2 Precedence

```python
RANK = {"ENDORSEMENT": 1, "SCHEDULE": 2, "BASE_WORDING": 3, "PROPOSAL": 4}

def resolve(provisions: list[Provision]) -> Resolution:
    # 1. Look for the policy's own construction clause first.
    if not has_construction_clause():
        note = ("Precedence asserted by market convention. This policy states no "
                "express order of precedence — searched, not found.")
    # 2. Same taxonomy_code at different ranks -> lowest rank governs.
    # 3. If two provisions tie on rank and conflict -> DO NOT PICK.
    #    Emit both, state precedence could not be established, escalate.
```

Never resolve a tie. Escalation is a correct answer; a guess is not.

### 6.3 Arithmetic — order verified from cl 3.12

```python
def settle(loss: Decimal, sum_insured: Decimal, value_at_risk: Decimal,
           threshold_pct: Decimal | None, sub_limit: Decimal | None,
           deductible: Decimal, formula_span: str | None) -> Settlement:
    """
    Order per cl 3.12: average -> sub-limits -> deductible.
    Read from the document, not assumed.

    Two parameters here are nullable for reasons measured across three carriers,
    and neither null may be defaulted:

    threshold_pct is None  -> the clause states NO threshold, so any shortfall
        bites. MSIG GC12 is exactly this. Defaulting it to 0.85 because Chubb
        says 85% would under-report every MSIG insured, which is a wrong answer
        in the direction that costs the business money.

    formula_span is None   -> the wording states the trigger but not the
        arithmetic (Chubb cl 4.2, MSIG GC12). Not None -> the wording states the
        arithmetic and we quote it (Liberty p.6 / cl 5 p.46).
    """
    adequacy = sum_insured / value_at_risk

    if threshold_pct is None:
        triggered = adequacy < Decimal(1)      # any shortfall at all
        threshold_basis = "NO_THRESHOLD_STATED"
    else:
        triggered = adequacy < threshold_pct
        threshold_basis = "THRESHOLD_STATED"

    if triggered:
        reduced = loss * adequacy
        if formula_span is None:
            # The clause states the TRIGGER, not the FORMULA. Illustration only.
            illustration, basis, formula_class = reduced, "MARKET_CONVENTION", "MARKET_CONVENTION"
        else:
            # The insurer wrote the arithmetic down. We are quoting, not inventing.
            illustration, basis, formula_class = reduced, "STATED_IN_WORDING", "PROVEN"
    else:
        illustration, basis, formula_class = loss, "NOT_TRIGGERED", "PROVEN"

    if sub_limit is not None:
        illustration = min(illustration, sub_limit)
    illustration = max(Decimal(0), illustration - deductible)

    return Settlement(adequacy_ratio=adequacy, average_triggered=triggered,
                      illustration=illustration, formula_basis=basis,
                      formula_basis_class=formula_class,
                      order_applied="average -> sub-limit -> deductible (cl 3.12)")
```

Use `Decimal` throughout. Never float for money.

The renderer must print `formula_basis_class` next to every figure and must never
label a `MARKET_CONVENTION` figure "amount payable". The three renderings are
distinct and the distinction is the product:

| `formula_basis` | On screen |
|---|---|
| `STATED_IN_WORDING` | the figure, with the insurer's own arithmetic quoted beside it — Liberty |
| `MARKET_CONVENTION` | the figure, labelled "illustration — this policy states no formula" — Chubb, MSIG |
| `NOT_TRIGGERED` | the full loss, average not engaged |

Also print `threshold_basis`. `NO_THRESHOLD_STATED` must render as "any shortfall
reduces payment" rather than silently showing a percentage the policy never states.

### 6.4 The abstention gate — four deterministic checks

No token probabilities anywhere. Every gate is a string or integer comparison.

```python
def gate(finding: Finding) -> Finding:
    # 1. Span fidelity — quoted text must exist at the recorded offsets.
    for s in finding.spans:
        source = page_text(s.document_id, s.page_no)[s.char_start:s.char_end]
        if norm_ws(source) != norm_ws(s.quoted_text):
            return drop(finding, reason="SPAN_FIDELITY_FAIL")   # logged, counted

    # 2. Boundary — span must sit inside the provision it is attributed to.
    if not within_provision(finding):
        return escalate(finding, "REQUIRES_AUTHORISED_REVIEW")

    # 3. Operand completeness — never substitute a default.
    if any(o.span_id is None for o in finding.required_operands):
        return finding.with_state("INFORMATION_MISSING")

    # 4. Authority — unresolved conflict escalates, never picks.
    if finding.precedence_unresolved:
        return escalate(finding, "REQUIRES_AUTHORISED_REVIEW")

    return finding
```

### 6.5 Conditions precedent — locate, quote, escalate. Never adjudicate.

This is where *Grace Electrical v EQ Insurance* [2016] SGHC 233 binds the design.
The court held at [72] that breach of GC9, a condition precedent requiring
statutory compliance, barred a S$1m indemnity and the action was dismissed. It
also held at [17]–[25] that the *label* is not decisive and that a general
declaration clause must be tested clause by clause.

Chubb Select+ has **no** declaration clause. So:

```python
def classify_condition_consequence(prov: Provision) -> str:
    if prov.taxonomy_code in SELF_EXECUTING:   # 3.1, 3.20, 4.13, 3.13
        return "consequence stated in the clause itself"
    if has_general_declaration_clause(prov.document_id):
        return "REQUIRES_AUTHORISED_REVIEW"    # may be a condition precedent
    return "REQUIRES_AUTHORISED_REVIEW"        # bare condition; effect is legal judgement
```

Both non-self-executing branches escalate. The engine may state that a term
exists and quote it. It may never state that a term has been breached, and never
that a claim will fail.

---

## 7. Rule format

Rules are data, not code, so that a domain reviewer can read them without
reading Python and the evidence harness can version them.

```yaml
- id: THEFT-FORCIBLE-ENTRY-NOT-WRITTEN-BACK
  version: 1
  title: Theft outside cover — Full Theft extension not elected
  requires:
    - operand: theft_exclusion
      from: {document_kind: BASE_WORDING, taxonomy_code: EXCL.THEFT_FORCIBLE_ENTRY}
    - operand: full_theft_elected
      from: {document_kind: SCHEDULE, taxonomy_code: EXT.THEFT_FULL}
  test: full_theft_elected != "applicable"
  output_state: DOCUMENTED
  headline: >
    Theft is covered only where there was violent or forcible entry to a
    Building. Your Schedule does not elect Additional Extension 2.17, so
    shoplifting and employee theft are outside cover.
  cite:
    - clause: "5.1(c)(i)"
      document_kind: BASE_WORDING
    - clause: "Additional Extensions"
      document_kind: SCHEDULE

- id: AVERAGE-ADEQUACY-BELOW-THRESHOLD
  version: 1
  title: Sum insured below the policy's stated average threshold
  requires:
    - operand: sum_insured
      from: {document_kind: SCHEDULE, taxonomy_code: LIMIT.SUM_INSURED_ITEM}
    - operand: value_at_risk
      from: {taxonomy_code: ACCOUNTS.STOCK_VALUE}     # SELF -> DECLARED
    - operand: threshold_pct
      from: {document_kind: BASE_WORDING, taxonomy_code: ADEQ.AVERAGE_CONDITION}
      nullable: true          # MSIG GC12 states no threshold. null != missing.
      on_null: ANY_SHORTFALL_TRIGGERS
    - operand: formula_span
      from: {document_kind: BASE_WORDING, taxonomy_code: ADEQ.AVERAGE_FORMULA}
      nullable: true          # Liberty states it; Chubb cl 4.2 and MSIG GC12 do not
  test: >
    sum_insured < (threshold_pct * value_at_risk)
    if threshold_pct is not null else sum_insured < value_at_risk
  output_state: DOCUMENTED
  compute:
    adequacy_ratio: sum_insured / value_at_risk
    payout_illustration:
      formula: loss * (sum_insured / value_at_risk)
      # basis and class are DERIVED from whether the wording states the arithmetic.
      # Neither may be written into a rule file by hand.
      basis: derive_from(formula_span)
      #   formula_span present -> STATED_IN_WORDING / PROVEN     (Liberty p.6, cl 5 p.46)
      #   formula_span null    -> MARKET_CONVENTION              (Chubb 4.2, MSIG GC12)
      label_on_screen: derive_from(formula_span)
      #   present -> quote the insurer's own arithmetic beside the figure
      #   null    -> "illustration — this policy states no formula"
  cite:
    # Which clause is cited depends on the carrier the bundle actually belongs to.
    - {clause: "4.2",  document_kind: BASE_WORDING, carrier: CHUBB}
    - {clause: "GC12", document_kind: BASE_WORDING, carrier: MSIG}
    - {clause: "GC4",  document_kind: BASE_WORDING, carrier: LIBERTY}
    - {clause: "5",    document_kind: BASE_WORDING, carrier: LIBERTY, note: "Basis of Settlement, states the formula"}

- id: ALTERATION-PREMISES-NOT-ON-SCHEDULE
  version: 1
  title: Premises occupied but not on the Schedule
  requires:
    - operand: scheduled_premises
      from: {document_kind: SCHEDULE, taxonomy_code: DOC.SCHEDULE}
    - operand: demised_premises
      from: {document_kind: TENANCY, taxonomy_code: TENANCY.PERMITTED_USE}
    - operand: alteration_clause
      from: {document_kind: BASE_WORDING, taxonomy_code: COND.ALTERATION_NOTICE}
  test: any(p not in scheduled_premises for p in demised_premises)
  output_state: DOCUMENTED
  escalate: true
  headline: >
    Your tenancy covers a unit that does not appear on the policy Schedule, and
    no endorsement adds it. cl 3.1 provides that until Chubb agrees in writing to
    accept an altered risk, there is no liability under the Policy for that
    altered risk.
  cite: [{clause: "3.1", document_kind: BASE_WORDING}]
  never: [assert_breach, assert_claim_outcome]

- id: WICA-HEADCOUNT-UNDERDECLARED
  version: 1
  title: Work injury declaration understated against the CPF record
  requires:
    - operand: declared
      from: {document_kind: WIC_SCHEDULE, taxonomy_code: WIC.DECLARED_HEADCOUNT}
    - operand: actual
      from: {document_kind: CPF_RECORD, taxonomy_code: CPF.CONTRIBUTOR_COUNT}
  test: actual > declared
  output_state: DOCUMENTED
  cite:
    - authority: MOM
      proposition: >
        Employers must ensure declared headcount and occupational class are
        accurate; wrongful declaration may affect claims.
  consequence_note: >
    WICA non-insurance penalty up to $10,000 and/or 12 months. Compulsory for all
    employees doing manual work at any salary and non-manual employees earning
    $2,600 or less monthly.
  deadline: {basis: policy_inception, offset_days: -21}

- id: PREMIUM-PAYMENT-WARRANTY-BREACHED
  version: 1
  title: Premium received outside the 60-day warranty period
  requires:
    - operand: inception
      from: {document_kind: SCHEDULE, taxonomy_code: DOC.SCHEDULE}
    - operand: received
      from: {document_kind: SCHEDULE, taxonomy_code: DOC.SCHEDULE}
    - operand: ppw
      from: {document_kind: BASE_WORDING, taxonomy_code: COND.PREMIUM_PAYMENT_WARRANTY}
  test: (received - inception).days > 60
  output_state: REQUIRES_AUTHORISED_REVIEW
  escalate: true
  headline: >
    Premium appears to have been received on day {n} of the policy period. cl
    3.20 provides that cover is automatically terminated immediately after the
    60-day period, without prejudice to liability incurred within it.
  cite: [{clause: "3.20", document_kind: BASE_WORDING}]
  never: [assert_breach, assert_claim_outcome]
```

`never: [assert_breach, ...]` is enforced in the renderer, not left to prompt
wording. A rule carrying that flag physically cannot emit a breach conclusion.

---

## 8. Layer 4 — Review Brief and routing

**Layer 4 is an evidence layer, not a portal.** Zurich already runs Edge Assist
across Asia Pacific as a unified intermediary system. Build the adviser view only
as a demo surface and say so; the Brief is designed to be consumed by whatever
system the adviser already uses.

Every Brief carries this header, computed not asserted:

```
ACCOUNTING   N provisions detected · M classified · K unaccounted
UNACCOUNTED  <the K provisions, quoted, for a human to read>
SEARCHED     <documents and sections searched>
NOT SEARCHED <what was out of scope, and why>
```

Per item:

```
TRIGGER      change event or compulsion deadline
FINDING      one sentence, plain language, no legal wording
STATE        DOCUMENTED | NOT_CONFIRMED | INFORMATION_MISSING | REQUIRES_AUTHORISED_REVIEW
CLASS        PROVEN | DECLARED | MARKET_CONVENTION | UNESTABLISHED
EVIDENCE     document, page, verbatim quote, char offsets, resolution path
ARITHMETIC   believed vs document-implied, each input traced, basis labelled
MISSING      what the adviser needs that we do not have
NEXT ACTION  what a licensed human could do
```

Sort order: PROVEN first, then DECLARED, then MARKET_CONVENTION, then UNESTABLISHED.

**Consent gate — an access control, not a checkbox.** Stated precisely, because the
earlier version of this claim was falsifiable in one `curl`: `disclosure.fields` is an
**access control list**, and `pipeline.disclosed_brief()` enforces it.

- `GET /api/brief` is the OWNER's view of their OWN documents and is deliberately not
  gated. Locking a business out of its own analysis would be security theatre.
- `GET /api/disclosure/brief?recipient=` is the adviser view and **is** the gate. It
  returns 403 unless a live disclosure names that recipient, and otherwise returns only
  the findings evidenced by the document kinds actually granted. Findings withheld are
  **counted and their required document kinds named**, so the adviser can ask for what
  they need instead of receiving a silently shortened list.
- `POST /api/consent/revoke` exists. A grant that cannot be withdrawn is not consent,
  it is a transfer.
- Deleting the case revokes every live disclosure, so no grant outlives the data it was
  granted over.
- Every read of a disclosed Brief writes an `audit` row. A pull, logged.

**Sessions.** Each browser session gets its own sqlite connection, its own case and its
own lock, with TTL expiry and a capacity cap. The API previously held one module-level
`_STATE`, so two people using it at once broke each other — one caller's "Delete case"
emptied everyone's findings. That was not only a deployment concern: it meant the demo
could not be shown to two judges at the same time.

**Two deployment modes, and the distinction is load-bearing.** Mode A is
SME-initiated: nothing aggregates, no book-level view exists. Mode B is
carrier-initiated over the carrier's own in-force book on documents it already
holds: aggregation is legitimate. A book view built on Mode A data would silently
break both consent-as-pull and the no-violations-table promise.

---

## 9. Demo — corrected against the verified clauses

Total 3:45, hard stop 4:00. Beats 3, 4 and 5 are the argument and never get cut.

| Beat | Time | Content |
|---|---|---|
| 1. The change | 0:00 | Four change events tapped. No form. |
| 2. The accounting | 0:25 | **Real counts** from the actual 28-page document. Unaccounted provisions quoted on screen. Lead with what we could not read. |
| 3. PROVEN first | 0:50 | Theft — cl 5.1(c)(i) requires violent or forcible entry; Schedule does not elect Extension 2.17. Two insurer-authored documents, no owner input. Then WIC schedule declares 11, CPF record shows 14, two undeclared do manual work. MOM's warning, $10,000 and 12 months, 21-day deadline. |
| 4. The money, honestly | 1:40 | cl 4.2 quoted. Stock sum insured S$100,000; accounts show S$150,000 — DECLARED, because the business authored it. Adequacy 66.7%, under 85%, reduction triggered. Then the discipline beat: **cl 4.2 states no formula.** Show ~S$40,000 labelled as market convention, formula basis MARKET_CONVENTION. Order per cl 3.12: average, then sub-limits, then the S$5,000 deductible. |
| 5. Refusing to compute | 2:15 | Buildings: leasehold, no reinstatement assessment on record. **UNESTABLISHED — no number.** Two refusals in a row establishes that every number shown has a source. |
| 6. Change of use — **REWRITTEN** | 2:35 | Tenancy covers unit 03-12 from 1 June; Schedule lists only 03-11; END-01 exists but adjusts a sum insured, so the insured knows how to endorse and did not. Quote **cl 3.1**: until Chubb agrees in writing, no liability for the altered risk. **Self-executing — no condition-precedent argument needed.** Then mention *Grace Electrical*: statutory non-compliance was a condition precedent there and barred a S$1m indemnity, **and Chubb Select+ has no declaration clause at all** — which is exactly why the engine reads each policy rather than generalising. State our finding as REQUIRES AUTHORISED REVIEW. |
| 7. Consent and hand-off | 2:55 | Granular consent. Brief shared. Adviser view: prepared case, not four attachments. |
| 8. Record and book | 3:20 | Established facts, portable, append-only. Export and re-verify the hash chain. Mode B book screen, labelled synthetic. Invite a judge to find the column where a breach would live. There isn't one. |

**Beat 3b — the unseen carrier, and it belongs in the live demo rather than the test
suite.** Upload a wording the engine has never been taught: the real AIG Homes Advantage
PDF. It detects `carrier: AIG`, reports `carrier_in_clause_map: False`,
`verified_classified: 0`, and states on screen that no finding rests on that wording's
clause references.

Showing the system **fail safely** is more convincing than any success case, because it
is the only way to prove the abstention gates are load-bearing rather than decorative.
Twenty seconds, and it pre-empts the "what about a policy you haven't seen?" question
before a judge asks it. Currently this behaviour is only exercised in tests — put it on
the screen.

Beat 6 is the one that changed. The earlier script claimed statutory breach
forfeits cover; that is true of the policy in *Grace Electrical* and false of the
policy in our hands. The corrected version is stronger, and it is true.

**Cold-company test:** use beat 3. Ground truth is public, arithmetic is
deterministic.

---

## 10. Build order

Not ingestion-first. That is how teams arrive at Demo Day with a parser and no
product.

```
1. Schema           db.py, migrations, invariant tests            (~2h)
2. Arithmetic       arithmetic.py + Decimal + hypothesis tests    (~3h)  <- the demo
3. Grading + gates  grading.py, gates.py, tests                   (~2h)
4. Rules engine     rules.py, the 5 rules in §7                   (~3h)
5. Accounting       account.py, clause regex, exact-ref map       (~3h)
6. Ingestion        ingest.py, spans, hashing                     (~2h)
7. Brief            brief.py, header, sorting, searched/not        (~2h)
8. API + web        api.py, vanilla web/ (no build step)            (~5h)
9. Book view        designed screen, labelled synthetic            (~1h)
```

Steps 1–4 give a working settlement engine on fixture operands, which is beats 3,
4 and 5 — the entire argument — before a single PDF is parsed.

**Cut line if behind:** drop the adviser workspace, build the book view as a
static labelled mock. Keep ingest → accounting → arithmetic → grading → Brief.

---

## 11. Definition of done

Ship only if all nine hold.

1. Chubb wording plus fixtures ingest with spans anchored and hashes recorded.
2. `classified + unaccounted == detected`, and the unaccounted list renders.
3. The five rules in §7 execute end to end and produce findings with spans.
4. `evidence_class` is derived from `author_class` and cannot be hand-set — there
   is a test asserting no code path accepts it as an argument.
5. All four abstention gates fire on deliberately broken input, including
   endorsement 02.
6. Brief renders with accounting header, graded findings sorted PROVEN-first, and
   a searched / not-searched statement.
7. Consent gate blocks disclosure until granted; `audit` row written.
8. Deleting a case removes findings and leaves `record_fact` intact — tested.
9. Accuracy table produced from whatever labelled set exists, with sample size
   printed on the slide.

---

## 12. Tests that matter

```python
def test_average_order_matches_clause_3_12():
    """cl 3.12: deductible applies after average. Order is not a preference."""
    s = settle(loss=D("60000"), sum_insured=D("100000"),
               value_at_risk=D("150000"), threshold_pct=D("0.85"),
               sub_limit=None, deductible=D("5000"), formula_span=None)
    assert s.average_triggered
    assert s.adequacy_ratio == D("100000") / D("150000")
    assert s.illustration == D("35000")     # 60000*2/3 = 40000, less 5000
    assert s.formula_basis_class == "MARKET_CONVENTION"

def test_msig_null_threshold_triggers_on_any_shortfall():
    """MSIG GC12 states no threshold. 99% adequacy must still trigger.
    A default of 0.85 here would silently under-report every MSIG insured."""
    s = settle(loss=D("100000"), sum_insured=D("99000"),
               value_at_risk=D("100000"), threshold_pct=None,
               sub_limit=None, deductible=D("0"), formula_span=None)
    assert s.average_triggered
    assert s.threshold_basis == "NO_THRESHOLD_STATED"

def test_chubb_85_threshold_does_not_trigger_at_90pct():
    s = settle(loss=D("100000"), sum_insured=D("90000"),
               value_at_risk=D("100000"), threshold_pct=D("0.85"),
               sub_limit=None, deductible=D("0"), formula_span=None)
    assert not s.average_triggered

def test_liberty_stated_formula_grades_proven():
    """Liberty p.6 / cl 5 p.46 state the arithmetic. Quoting is not inventing."""
    s = settle(loss=D("60000"), sum_insured=D("100000"),
               value_at_risk=D("150000"), threshold_pct=None,
               sub_limit=None, deductible=D("0"),
               formula_span="span-liberty-p46-cl5")
    assert s.formula_basis_class == "PROVEN"
    assert s.formula_basis == "STATED_IN_WORDING"

def test_unoccupancy_is_never_stored_per_policy():
    """Liberty uses 30 consecutive days in most sections and 7 in another.
    A policy-level column cannot represent that, so it must not exist."""
    cols = all_column_names("policy")
    assert not any("unoccupan" in c.lower() or "vacan" in c.lower() for c in cols)

def test_evidence_class_cannot_be_set_by_caller():
    import inspect
    for fn in (grade_operand, grade_finding):
        assert "evidence_class" not in inspect.signature(fn).parameters

def test_self_authored_stock_grades_declared():
    assert grade_operand("span-1", "SELF") == "DECLARED"

def test_missing_operand_never_defaults():
    assert grade_operand(None, "AUTHORITY") == "UNESTABLISHED"

def test_deleting_case_preserves_record():
    delete_case(case_id)
    assert count_findings(case_id) == 0
    assert count_record_facts(business_id) > 0

def test_no_breach_column_exists():
    cols = all_column_names()
    for banned in ("violation", "breach", "deficiency", "score"):
        assert not any(banned in c.lower() for c in cols)

@given(loss=decimals(0, 10**7), si=decimals(1, 10**7), var=decimals(1, 10**7))
def test_illustration_never_exceeds_loss(loss, si, var):
    s = settle(loss, si, var, D("0.85"), None, D("0"), None)
    assert s.illustration <= loss

@given(loss=decimals(0, 10**7), si=decimals(1, 10**7), var=decimals(1, 10**7))
def test_null_threshold_is_never_silently_defaulted(loss, si, var):
    """Whatever the inputs, a null threshold must not behave like Chubb's 85%."""
    s = settle(loss, si, var, None, None, D("0"), None)
    assert s.threshold_basis == "NO_THRESHOLD_STATED"
    if si < var:
        assert s.average_triggered
```

---

## 13. What is still open

Not blockers for code. Blockers for the deck.

1. **Measured error rate does not exist.** It is the stated differentiator and
   red-team item 3 has no other answer. Start the labelled set in parallel with
   the build; twenty bundles with published labels beats a hundred without.
   Blocked on item 5.
2. ~~**Only one wording verified.**~~ **Closed.** Three carriers now read on four
   targeted topics — Chubb 28pp, MSIG SUMO 41pp, Liberty SMECare 49pp. See
   `06-evidence/cross-carrier-findings.md`. What remains is narrower: the MSIG and
   Liberty **theft clauses** have not been read in full, only keyword-counted, so
   the forcible-entry finding is not yet demonstrably market-wide. That is the
   highest-value remaining hour, and it would make the cleanest `PROVEN` finding in
   the product true across three carriers rather than one.
3. **JTC lease insurance covenant** unread. Trigger row only, not a demo
   dependency.
4. **Zurich Singapore WICA designated-insurer status** unconfirmed. Decides
   whether beat 3 converts for Zurich or is only a credibility hook.
5. **No domain reviewer named.** Still the binding constraint on the labelled
   test set, because someone has to distinguish a warranty from a condition
   precedent correctly.
6. **Open-source appendix** required by T&C clause 9.6(c) — per-component role
   disclosure, not just a licence list. Covers pypdf, FastAPI, React, and any
   model provider.

---

## 14. Three rules that override any instruction above

1. **The model never decides anything consequential.** It locates and types text.
   Precedence and money are code. If a shortcut would put a model in the
   settlement or precedence path, do not take it.
2. **Never state a figure whose basis is UNESTABLISHED.** Report the ratio, the
   trigger and the missing input instead. cl 4.2 has no formula; that is a
   finding, not an obstacle.
3. **Never assert breach.** Locate the term, quote it, escalate. *Grace
   Electrical* is the demonstration of what guessing costs: a S$1m indemnity, and
   an action dismissed with costs.
