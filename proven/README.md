# PROVEN — the build

Reads the documents a small business already holds, computes what its insurance
would actually pay, grades every finding by the strength of the evidence behind it,
reports how much of the document it could not account for, and hands a licensed
adviser a prepared case.

**Non-negotiable design rule: no machine-learning model makes a consequential
decision.** Every decision is a string, integer, date or Decimal comparison in code a
reviewer can read. A model may now *propose* a clause span to look at — that is the
one place statistics are allowed — but binding it requires a deterministic structural
verifier, and the proposer gets no vote. A system that decides nothing by generation
cannot hallucinate a finding.

> Earlier revisions of this file said "there is no model in this pipeline". That
> stopped being exactly true when `align.py` gained an optional TF-IDF proposer, so
> the claim is now stated as what the architecture actually enforces. See
> `OPEN-SOURCE.md` for the precise version and the test that keeps it honest.

## Run it

```powershell
# from proven/
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# tests (324, incl. property-based arithmetic, intake validation, accessibility
# contract, session isolation, consent-as-access-control, structural alignment,
# a route-coverage guard and the eval harnesses)
python -m pytest

# the three measurements
python -m eval.alignment_metrics   # clause identification: precision/recall
python -m eval.citation_audit      # are the quotations real
python -m eval.harness             # findings, scoped and refusing to overclaim

# the demo API + front end
python -m uvicorn proven.api:app --app-dir src --port 8077
# open http://127.0.0.1:8077
```

Note: `uvicorn` here does not reload on change. Restart it after editing `src/`.

If `pytest` cannot import `proven`, run it as `python -m pytest` from this folder —
`tests/conftest.py` puts `src/` on the path.

## What this build does that the previous one did not

| Gap (from projectproblems.md) | Status |
|---|---|
| **A2.** No upload, no intake, not a product | `POST /api/bundle` accepts PDFs. Carrier and document kind detected. Per-file intake report. |
| **A3.** Only 9 of 92 provisions classified | 13 verified + 45 keyword = 58/97 classified. The two are separated everywhere. |
| **A5.** Spec claims a "model" that does not exist | Nothing below Layer 2 contains a model, and the docs no longer overstate it either: a model may propose a span to read, and a deterministic verifier decides. |
| **B1.** Regex only on one numbering scheme | Five detection schemes, fallback for narrative wordings. |
| **B2.** Rules hardcoded to fixture JSON shapes | `extract.py` normalises both provenances. Upload works end-to-end. |
| **B3.** Record is not portable | `GET /api/record/export` + `POST /api/record/verify`. Hash chain with explicit sequence counter. |
| **B4.** Consent is cosmetic | `GET /api/disclosure/brief` is a real access control. `/api/consent/revoke` exists. |
| **B5.** No error handling on ingestion | Six named failure modes, all validated before pypdf touches the bytes. |
| **B6.** Single-tenant global state | Per-session isolation, TTL, capacity cap. Concurrent sessions tested. |
| **C5.** Change events don't exist | Nine events, rendered as toggle buttons, with `POST /api/events`. |
| **D1.** Rule id "BREACHED" | Renamed `PREMIUM-PAYMENT-WARRANTY-TIMING`. Build fails if any rule id adjudicates. |
| **D2.** Regulatory claims unsourced | §12 now carries provenance chain back to Baker McKenzie. |
| **D4.** No accessibility | ARIA, skip nav, landmarks, focus-visible, live regions, responsive grid, data-label tables, reduced-motion, touch targets. Contract-tested in `test_frontend.py`. |
| **E.** React + Vite claimed | Vanilla HTML/JS/CSS. Docs corrected. |
| **E.** "(model)" in L1/L2 | Removed. The claim is now the precise one: no ML model makes a consequential decision. |
| **H5.** No pyproject.toml, unpinned deps | `pyproject.toml` with exact version pins. |

Two further defects were found during the v2 verification sweep and are worth naming
because both were the same failure — a guarantee that held in the place a reader looks
and not in the places they don't:

| Defect | Fix |
|---|---|
| **Case deletion was cosmetic for three endpoints.** After `DELETE /api/case`, `/api/brief` correctly returned nothing while `/api/information-value` kept ranking the deleted findings' gaps, naming this business's missing documents, and `/api/drift` still returned a crossing date. The cached brief was cleared; the in-memory findings list never was. | Deletion now clears `findings` and every case-scoped view returns `available: false`. `/api/marketmap` is deliberately exempt: it holds no case. Tested server-side, and statically pinned in `test_frontend.py` so the page cannot forget to re-ask. |
| **The alignment counts did not add up.** MSIG offered 23 proposals, rejected 13, displayed 4 — six verified duplicates vanished between the count and the list, so the displayed rejection rate could not be checked by arithmetic. | `collapsed` is now a counted bucket with an `assert_invariant()` that refuses to serialise a result whose arithmetic does not close. |

## What v2 added: a coverage-semantics layer

The exact `(carrier, clause_ref)` map is precise and does not scale — a human has to
read a wording before the engine can say anything about it, and three carriers took a
week. The reason a map is needed at all is that carriers name the same mechanism
differently: proportionate reduction for under-insurance is "Average" at Chubb,
"UNDERINSURANCE" at MSIG, and both "Average" *and* "Average Relief" at Liberty, with
different thresholds on different bases of settlement.

So v2 identifies a mechanism by the **structure of its text** instead.

| Module | Endpoint | What it does |
|---|---|---|
| `align.py` + `taxonomy/mechanisms.yaml` | `GET /api/alignment` | Propose → Verify → Bind. A candidate span is proposed and may be wrong; it binds only if every mandatory structural slot matches and no negative slot does. Rejections are returned, counted and displayed. |
| `marketmap.py` | `GET /api/marketmap` | The same alignment run across every published wording in the corpus. Clause semantics, not premiums — every cell carries a page and a verbatim quote. |
| `voi.py` | `GET /api/information-value` | Ranks the missing documents by how much of the payout each one would pin down. Turns UNESTABLISHED from a dead end into an ordered action list without inventing the missing figure. |
| `drift.py` | `GET /api/drift` | Adequacy decaying while the policy does not change: hold the sum insured still, move a cost index, report the date the carrier's own threshold was crossed. |

Four defects were found by building the measurement rather than by reading the code:
a CONTRIBUTION clause verifying as an average (they share "rateable proportion"); a
settlement basis read out of the neighbouring clause; a premium warranty missed
because the clause spans a page break; and an unbounded building exposure sorting
*last* because its interval width was zero. Each one is now a named regression test.

## Architecture (four layers, `src/proven/`)

```
errors.py      Typed intake errors → actionable HTTP responses
ingest.py      L1  Locate     validate → pypdf + page cache → immutable spans
detect.py      L1  Detect     carrier + document kind, evidence-bearing
account.py     L2  Account    5 detection schemes + 2-step classification
classify.py    L2  Classify   heading-keyword rules as data (taxonomy/classification.yaml)
align.py       L2  Align      structural mechanism alignment — propose/verify/bind
extract.py     L2b Extract    documents → named facts (both provenances)
resolve.py     L3  Resolve    precedence; never resolves a tie
arithmetic.py  L3  Compute    Decimal settlement; order from cl 3.12
grading.py     L3  Grade      evidence class DERIVED from author_class, never set
gates.py       L3  Abstain    four deterministic checks, no token probabilities
rules.py       L3  Rules      data (rules/*.yaml) + deterministic evaluators
events.py      L3  Triggers   nine change events, closed vocabulary
voi.py         L3  Rank       value of information — what to obtain next, and why
drift.py       L3  Project    adequacy over time against a declared cost series
marketmap.py   L3  Compare    clause-level market position from published wordings
brief.py       L4  Brief      accounting header, PROVEN-first, never:[assert_breach]
pipeline.py        Orchestrate + run_bundle + consent gate + record export
sessions.py        Per-session case isolation
api.py         L4  FastAPI — 24 routes, every one covered by a test
web/           L4  Vanilla HTML/JS/CSS front end — no build step
eval/          Three harnesses: alignment metrics, citation audit, findings
```

## Measurements available today

| Measurement | Value | Needs a reviewer? |
|---|---|---|
| **Clause identification** — precision / recall over 20 mechanism instances in 7 published wordings | **1.0 / 1.0**, rejecting 238 of 294 proposals | No |
| ↳ Singapore, read by hand | recall 1.0 (12/12) | No |
| ↳ Malaysia, **never hand-mapped** | recall 1.0 (8/8) | No |
| Citation fidelity (spans verbatim at cited offsets) | 25/25 = 1.0 | No |
| Boundary (span inside its cited provision) | 8/8 = 1.0 | No |
| Agreement on 10 objective assertions | 10/10 | No |
| Accounting invariants (`classified + unaccounted == detected`; `proposals == bound + rejected + collapsed`) | Both hold | No |
| General accuracy rate | **Not available** | Yes — blocked on a named reviewer |

The Malaysian row is the one that matters: no clause map exists for those carriers, so
anything found there was found from structure alone. It is a measurement of clause
**identification**, not of findings, and must not be compared with a general accuracy
rate. The harness refuses to permit an unqualified accuracy claim — run
`python -m eval.harness --require-expert` to confirm.

## Where the numbers come from

Every clause is verifiable in `../06-evidence/`. Open-source roles per T&C cl 9.6(c)
are in `OPEN-SOURCE.md`. Full build spec: `../00-current/technical-implementation.md`.
