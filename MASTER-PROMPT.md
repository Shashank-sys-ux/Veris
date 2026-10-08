# Master prompt — paste this into a fresh AI session to resume work

Any of the five of us can paste the block below into a new chat with an agentic
coding assistant, with the `E:\SFF` folder open as the workspace. It carries enough
context to continue without re-deriving decisions we already made and without
re-verifying clauses we already read.

Keep it current. When a decision changes, edit this file — not just the chat.

> This file was lost once when the workspace was replaced by an unpacked archive.
> If it goes missing again, it can be rebuilt from `README.md`,
> `00-current/technical-implementation.md` and `06-evidence/cross-carrier-findings.md`.

---

```
You are joining an in-progress hackathon submission. Read this brief fully before
acting, then read the documents named in it. Do not restate the brief back to me;
start work.

## The competition

SFF 2026 Global FinTech Hackcelerator, Problem Statement 03 — Zurich Insurance,
"Closing the SME Protection Gap".

- Registration closes 14 August 2026, 2359 SGT. Verified from the T&C PDF, cl 7.3.
- No amendments accepted after the Closing Date (cl 7.5).
- Team of 5 students. No incorporated entity. Max 10 members permitted (cl 5.2).
- Governing document: 01-competition/tnc-fulltext.txt. Cite clause numbers from it,
  never from a summary.
- Clause 12.1(o)(iii) bars substantially duplicating work entered in ANY other
  competition. One member's prior project (RDTII-AEGIS) went to UN ESCAP. Port no
  code. New repository, new taxonomy. Violations = disqualification (cl 12.1(q)).
- Clause 12.1(p)(i) prohibits scraping the GFTN Portal/Website. Third-party sources
  are unaffected; the wording scraping already done is fine.
- Clause 9.6(c) requires disclosing each open-source component AND its role.
  DONE — proven/OPEN-SOURCE.md.

## The product: PROVEN

Reads the documents a small business already holds, computes what its insurance
would actually pay, grades every finding by the strength of the evidence behind it,
reports how much of the document it could not account for, and hands a licensed
adviser a prepared case.

Four layers. No machine-learning model makes a consequential decision.
  L1 Locate     ingest, anchor spans, hash documents
  L2 Account    classify every operative provision or mark it UNACCOUNTED
                + align mechanisms structurally: propose (may be a model) →
                  verify (deterministic slots) → bind. The proposer gets no vote.
  L3 Resolve    deterministic arithmetic and precedence. NO MODEL IN THIS LAYER.
  L4 Brief      Review Brief + consent-gated hand-off to a licensed adviser

## IMPLEMENTATION STATUS: BUILT AND PASSING. Verify before you change anything.

The code lives in `proven/` (src, tests, eval, web). Audited 11 Aug 2026, re-audited
after the v2 coverage-semantics layer:

- **325/325 tests pass.**
- **v2 adds a coverage-semantics layer.** A mechanism is identified by the STRUCTURE
  of its text, not by clause number or heading, because carriers name the same
  mechanism differently — "Average" at Chubb, "UNDERINSURANCE" at MSIG, and both
  "Average" and "Average Relief" at Liberty with different thresholds on different
  bases of settlement. Four new modules and endpoints: `align.py`
  (`GET /api/alignment`), `marketmap.py` (`/api/marketmap`), `voi.py`
  (`/api/information-value`), `drift.py` (`/api/drift`).
- **The strongest number in the submission, and it needs no reviewer:** clause
  identification scores **precision 1.0, recall 1.0** on 20 mechanism instances
  across 7 real published wordings, rejecting 238 of 294 proposals. Singapore recall
  12/12 (hand-read); **Malaysia recall 8/8 on four wordings nobody hand-mapped** —
  that row is the claim, because no clause map exists for those carriers, so anything
  found there was found from structure alone. It is a measurement of clause
  IDENTIFICATION, not of findings, and must never be compared with an accuracy rate.
- **A user can upload their own PDFs.** `POST /api/bundle` accepts multipart PDFs,
  detects carrier and document kind, derives author_class from the detected kind
  (never caller-supplied), and returns real accounting. Rejects non-PDF, empty,
  corrupt, oversized and text-layerless files BEFORE parsing, with a per-file reason.
- On the demo bundle: 97 detected / 58 classified / 39 unaccounted, invariant holds.
  The 58 is reported as **13 hand-verified + 45 keyword**, counted separately, and
  keyword classifications feed NO finding.
- On an unseen carrier it degrades honestly. Uploading the real AIG Homes Advantage
  wording gives `carrier: AIG`, `carrier_in_clause_map: False`,
  `verified_classified: 0`, and the accounting note states that no finding rests on
  that wording's clause references.
- 15 findings across all four output states, sorted PROVEN first.
- Consent GENUINELY gates: `/api/disclosure/brief` returns 403 CONSENT_REQUIRED until
  granted, withholds per consented field, and 403s again after
  `POST /api/consent/revoke`. Sessions are isolated — consent in one does not leak.
- The record is portable: `/api/record/export` + `/api/record/verify` →
  `chain_valid: True`, and a test proves tampering is detected.
- Change events implemented: `/api/events`, 9 codes, each returning `relevant_rules`
  and `requested_documents`.
- THREE evaluation harnesses. `eval/alignment_metrics.py` is the new one and the only
  one that yields a real precision/recall pair. `eval/harness.py` separates
  ENGINE_OUTPUT (baseline only) from INDEPENDENT_OBJECTIVE (measured), prints the exact
  claim the evidence supports, and blocks anything stronger. `eval/citation_audit.py`
  measures citation fidelity with no reviewer needed: 25/25 spans verbatim at cited
  offsets.
- Every one of the 24 routes has a test, enforced by a route-coverage guard that fails
  the build if a route is added without one.
- Deletion reaches every view derived from the case, not just the Brief. This was a
  real defect: `/api/information-value` and `/api/drift` kept serving analysis of
  deleted findings. Fixed and tested both server-side and in the page.
- The front end is a light theme, vanilla HTML/JS/CSS, no build step. It was verified
  by booting it in a real DOM (jsdom, installed transiently and removed) against the
  live API: 44 render and interaction checks, zero JS errors.

Run it:
  cd proven
  python -m pytest -q                                  # 325 tests
  python -m uvicorn proven.api:app --app-dir src --port 8077
  python -m eval.alignment_metrics                     # precision 1.0 / recall 1.0
  python -m eval.harness
  python -m eval.citation_audit

uvicorn here does NOT reload on change. Restart it after editing src/.

NOTE: the bundled proven/.venv is hardcoded to another machine's Python path and
will not run here. Create your own venv from proven/requirements.txt, or use a
system Python that already has fastapi, uvicorn, pydantic, pyyaml, pypdf, pytest
and hypothesis.

## Read these, in this order

1. 00-current/finalized-idea.md            the authoritative idea, 20 sections
2. 00-current/technical-implementation.md  the build spec, incl. definition of done
3. 06-evidence/cross-carrier-findings.md   what we actually verified, page-cited
4. proven/README.md                        what the demo shows, beat by beat

Then: README.md for the folder map, proven/taxonomy/taxonomy.yaml for clause codes,
proven/fixtures/ for test data, proven/OPEN-SOURCE.md for the cl 9.6(c) appendix.

## What is verified — three carriers, 118 pages

Do not soften these and do not re-verify them. All page-cited in
06-evidence/cross-carrier-findings.md, reproducible with
`python 06-evidence/scripts/scan_corpus.py all`.

CHUBB Select+ (SG, 07/2020, 28pp) — read in full
MSIG SUMO (SG, form SMO022401, 2024-01, 41pp) — read on 4 topics
LIBERTY SMECare (SG, May 2025, 49pp) — read on 4 topics

Every one of four scanned behaviours DIVERGES across carriers. One diverges within
a single wording. This is the empirical core of the pitch:

| Behaviour                          | Chubb  | MSIG               | Liberty            |
|------------------------------------|--------|--------------------|--------------------|
| Average threshold                  | 85%    | none, any shortfall| none in GC4        |
| Average formula stated in text     | No     | No                 | YES, verbatim      |
| Cond-precedent declaration clause  | Absent | Present, sweeping  | Arbitration only   |
| Premium payment warranty           | 60d    | identical          | identical          |
| Unoccupancy day count              | 14     | 30                 | 30, but 7 in one section |

Specific clauses, safe to print:
- Chubb cl 4.2 Average — 85% threshold, "proportionately reduced", NO FORMULA (all
  28pp searched). cl 5.1(c)(i) theft — excluded unless from a Building AND
  violent/forcible entry, OR Schedule elects Additional Extension 2.17 Full Theft.
  cl 5.1(b)(v) water escape excluded when Vacant >14 days, "Vacant" defined cl 2.35
  (3 limbs). cl 3.20 Premium Payment Warranty — 60 days, cover AUTOMATICALLY
  TERMINATED, pro-rata min SGD25. cl 3.1 Alteration — SELF-EXECUTING, "until Chubb
  agrees in writing... Chubb shall have no liability for such altered risk".
  cl 3.12 — order verified: average -> sub-limits -> deductible. cl 4.9 Minimum
  Security. cl 4.13 Time Limit 12 months. NO condition-precedent declaration clause
  anywhere in Chubb — zero hits across 28 pages.
- MSIG GC12 UNDERINSURANCE p.38 — "proportionately reduced", no formula, NO
  THRESHOLD. MSIG preamble p.1 + GC p.36 — sweeping declaration clause making
  compliance and truth of proposal "conditions precedent to any liability".
  MSIG GC17 p.39 — condition precedent on prior premium-payment history.
  MSIG PPW p.41 — carves out Section 4 Work Injury Compensation.
- LIBERTY GC4 Average p.46 — states the arithmetic. Liberty p.6 and cl 5 p.46:
  "Payment shall not exceed such proportion of the loss or damage as the sum insured
  bears to the value of all property at the time of loss or damage."
  Liberty p.31 — unoccupancy SEVEN consecutive days, vs 30 elsewhere in the same
  document.

Case law: Grace Electrical Engineering Pte Ltd v EQ Insurance Co Ltd [2016] SGHC 233
(Belinda Ang Saw Ean J, 19 Oct 2016), public liability, S$1m limit. Grace Electrical
LOST — action dismissed with costs at [73]. At [72](a) FSA non-compliance WAS a
breach of GC9, a condition precedent, so the insurer was NOT liable. [72](b) GC4 not
breached. [72](c) GC12 time bar inapplicable. At [17]-[25] the label "condition
precedent" is NOT decisive; a general declaration clause must be tested clause by
clause. Full text: 06-evidence/case-law/grace-electrical-fulltext.txt. An earlier
draft of our own document got this holding backwards. Do not reintroduce that error.

## Decisions already made. Do not re-litigate these.

- Name is PROVEN. Rejected: Protection Pulse alone, Adequacy alone, Indemnis,
  Preclaim.
- Wedge is BOUNDED OMISSION + EVIDENCE GRADING, not verbatim citation. Citation as a
  wedge is taken: Qumis, Newfront/WTW, Coverwatch, Advocate Technologies, Nomad Data.
- Evidence classes graded by AUTHORSHIP, not format:
  PROVEN (insurer/authority/third-party) > DECLARED (self-authored) >
  MARKET_CONVENTION (operands evidenced, arithmetic not stated) > UNESTABLISHED
  (no span at all). evidence_class is DERIVED from document.author_class and can
  NEVER be passed in by a caller. A test asserts no function signature accepts it.
- GST F5 does NOT report closing stock. Stock comes from balance sheet or management
  accounts, therefore DECLARED. Do not source stock from F5.
- Two stores: `case` (transient, deletable, may hold negative findings) and
  `record_fact` (append-only, established facts only, hash-chained, and NO
  violation/breach/deficiency/score column anywhere in the schema).
- Two deployment modes: Mode A SME-initiated (no aggregation) and Mode B
  carrier-initiated (book view legitimate, labelled synthetic). Never run a book
  view on Mode A data.
- Layer 4 is an evidence layer feeding Zurich Edge Assist. NOT a competing broker
  portal.
- Segment: light food manufacturing on leased industrial premises. Demo persona is
  Hock Lee Foods; fixtures carry planted defects and are labelled synthetic on
  screen every time.
- Native PDF only in the demo. No OCR. OCR belongs in the eval harness.
- Documents already filed, not API connectors. Rejected Shopify/Xero/POS OAuth.
- Pricing S$18/policy/year, defended against commission not software comparables.
- Build order: taxonomy -> fixtures -> L3 arithmetic -> L2 accounting -> L1
  ingestion -> L4 UI. NOT ingestion-first.
- Rejected: chasing "real-time"; the formulation "exposure = declared value -
  documented limit" (insurance-wrong).

## Hard engineering constraints, each forced by a measured finding

1. No clause behaviour may be stored per-policy or per-carrier. Liberty uses 30
   unoccupancy days in most sections and 7 in another. Day counts and thresholds
   live on clause_instance rows keyed to the section they were read from. There is a
   test asserting no policy-level unoccupancy column exists.
2. threshold_pct is nullable. null means "any shortfall triggers" (MSIG GC12).
   Defaulting it to Chubb's 0.85 silently under-reports every MSIG insured.
3. formula_span is nullable. Present -> quote the insurer's arithmetic, class
   PROVEN. Null -> show the conventional computation labelled an illustration, class
   MARKET_CONVENTION. Never label a MARKET_CONVENTION figure "amount payable".
4. The premium payment warranty is the ONLY market-uniform clause (GIA standard,
   identical across all three carriers to the dollar). Respect MSIG's Section 4 WICA
   carve-out.
5. Never adjudicate whether breach forfeits cover — not even for MSIG. Locate,
   quote, escalate to REQUIRES_AUTHORISED_REVIEW.
6. Four output states only: DOCUMENTED, NOT_CONFIRMED, INFORMATION_MISSING,
   REQUIRES_AUTHORISED_REVIEW. Never assert cover exists, never assert a claim will
   or will not be paid, never recommend a product/carrier/premium.
7. classified + unaccounted == detected, always. Quote the unaccounted provisions on
   screen. Never put an invented number on a slide.
8. Decimal for money, never float.

## Standing rule that overrides everything above

Re-verify every clause and case citation against the primary document before it goes
in a deck. Three errors have already been caught internally this way: the Grace
Electrical holding was stated backwards; we claimed MSIG published no wording PDF
when a 41-page policy is public; and two corpus files were described as policy
wordings when they are a proposal form and a benefits schedule. All came from
trusting a snippet instead of reading the source. Treat any citation not read in full
as unverified. That standard IS the product's differentiator, so failing it privately
is the one error we cannot afford publicly.

## Readiness: usable product, demo-ready, NOT production-deployable

Two audits, both current, both read before changing code:
`00-current/product-readiness.md` (state of the build) and `projectproblems.md`
(22 adversarial problems with resolution status — 17 resolved, 3 partly, 2 open).

The blocker that made this a demo rather than a product — no document intake — is
closed. What remains is deployment hardening and coverage breadth.

Earlier defects, all fixed and verified: a shared sqlite connection crossing
threadpool threads that made endpoints return HTTP 500 permanently (20 of 50 requests
failed; now 0); a deleted case still serving findings from cache; three XSS sinks
where verbatim document text reached the DOM as markup; consent granting on an empty
field list; and the book view failing open on an unknown mode.

**Do not deploy to a public host.** There is still no authentication. `/api/health`
declares its absence and a test asserts it does. Sessions are isolated from each
other, but nothing proves a session belongs to a particular business.

## Next actions, highest value first

1. **Deck, written proposal, video.** None exist. Registration closes 14 Aug 2026
   2359 SGT. This is now the single most likely cause of failure, ahead of every
   technical item.
2. **Name an insurance-qualified reviewer** and get 20 bundles labelled. The harness
   is built and waiting — labels carry a `derivation` field, and it will not report a
   general accuracy rate until one is `REVIEWED_BY_EXPERT`. It needs judgments, not
   code. Until then the only claim available is the scoped one the harness prints:
   10/10 on objective assertions, n=1, plus 25/25 citation fidelity. Do NOT compare
   that to Stanford's 17–33%.
3. **Authentication in front of session creation**, then bind `business_id` to the
   authenticated principal instead of accepting it as a parameter.
4. Read the MSIG and Liberty THEFT clauses in full. Currently keyword-counted only,
   so the forcible-entry finding is not yet demonstrably market-wide. Would make the
   cleanest PROVEN finding true across three carriers instead of one.
   Use: python 06-evidence/scripts/dump_clause.py <file-substring> <anchor-regex>
3. Add a loader for real document bundles in eval/harness.py (see RUNNABLE_BUNDLES).
   Only the hock-lee-foods fixture bundle runs today.
4. Add inline source references to finalized-idea.md section 12 — the FAA and
   Insurance Act claims are stated without citation to a provision.
5. Read the JTC standard lease insurance covenant. Fifteen minutes, trigger row only.
6. Rehearse the demo against the beat table in technical-implementation.md section 9.
   Beats 3, 4 and 5 are the argument and never get cut.

## Blocked, needs a human decision

- No insurance-qualified reviewer named (see next action 1).
- Zurich Singapore's MOM-designated WICA insurer status is unconfirmed.
- Roster: four names or five. Freezes at registration.

## How to work

Verify before claiming. Run the code. If you assert a clause says something, quote it
with its page number and name the file you read it from. If you cannot verify
something, say so plainly rather than hedging or padding. Prefer editing the existing
documents in 00-current/ over creating new ones.
```

---

## Maintaining this file

- Update the verified-clause list when a new clause is read in full.
- Move items from "Next actions" to the verified section as they close.
- If a decision in "do not re-litigate" is genuinely reversed, say so explicitly and
  record why, so the next person does not reverse it back.
