# Product readiness — audit of the built system

Re-audited 11 Aug 2026 against the consolidated tree in `proven/` by running the code:
**325 tests**, the pipeline, the live API over real HTTP, real document uploads, the
front end in a real DOM, and **three** evaluation harnesses. Supersedes the previous
revision of this file.

**Verdict: usable product, demo-ready, not production-deployable.**

The gap that previously made this a demonstration rather than a product is closed. A
user can upload their own PDFs and get graded findings back. What remains is deployment
hardening (authentication above all) — not a missing input path, and no longer a
coverage-breadth problem either, which is what v2 changed.

---

## v2: the coverage-semantics layer, and the number it produced

The exact `(carrier, clause_ref)` map was precise and did not scale: a human had to
read a wording before the engine could say anything about it, and three carriers took a
week. Forty would have taken a year. That was the honest ceiling on the whole product.

v2 removes it by identifying a mechanism from the **structure of its text** rather than
its clause number or heading — which is necessary because carriers name the same
mechanism differently. Proportionate reduction for under-insurance is "Average" at
Chubb cl 4.2, "UNDERINSURANCE" at MSIG GC12, and at Liberty it is *both* "Average"
(GC4, value basis, no threshold) and "Average Relief" (85%, reinstatement basis). A
clause-number map cannot find those. Neither can a heading keyword list, because
"Average Relief" is named as a relief and behaves as an average.

**The measurement this produced is the strongest evidence in the submission, and it
needs no domain reviewer.** `python -m eval.alignment_metrics`:

```
Documents scored      7
Proposals offered     294
Bound (verified)      26
Rejected by verifier  238   rejection rate 0.81

Correct alignments    20
Missed / wrong value  0
False positives       0
PRECISION             1.0
RECALL                1.0

GENERALISATION — the claim that matters
  Singapore, read by hand      recall 1.0  (12/12)
  Malaysia, NEVER hand-mapped  recall 1.0  (8/8)
```

The Malaysian row is the point. No clause map exists for AIG Malaysia or QBE Malaysia,
so anything found in those four wordings was found from structure alone. This is why
the scaling story is now demonstrated rather than asserted.

**What it is not.** It measures clause *identification*: whether a bound span contains
the structural elements the mechanism requires. A second reader can check that against
the cited page in seconds with no insurance qualification, which is exactly why the
number exists. It is **not** an accuracy rate for findings, it must not be compared
with one, and the harness prints that restriction itself.

Four defects were found by building the measurement rather than by reading the code —
which is the argument for having built it:

| Defect | Why it mattered | Fix |
|---|---|---|
| A CONTRIBUTION clause verified as an average | Both use "rateable proportion". Contribution apportions between *insurers*; average apportions against a *value at risk*. Same vocabulary, different comparison | `negative_slots` in `mechanisms.yaml`, tested before mandatory slots |
| Settlement basis read from the neighbouring clause | Chubb cl 4.2 reported as REINSTATEMENT when its own text says "the actual value" | `scope: clause` slot scoping — a value from an adjacent provision is a wrong answer even when the alignment is right |
| Premium warranty missed entirely | Chubb cl 3.20 spans a page break: "within 60 days" ends p8, "automatically terminated" opens p9. No single-page candidate held both slots | `PAGE_BLEED` for *verification only*; bound offsets stay clamped to the anchor page and a `continues_next_page` flag is set, so no citation points at an offset that does not exist |
| An unbounded exposure sorted **last** | The building had no sum insured, so no interval could be computed, so it scored 0% of total uncertainty and ranked beneath gaps worth tens of thousands. That inverts the truth | `UNBOUNDED_BY_DOCUMENTS` ranks first and shows no percentage — a share of a total that excludes it is arithmetic on an incomplete denominator |

Three more surfaced during the verification sweep and are recorded below under
"Defects found by verifying, not by reading".

New modules: `align.py`, `marketmap.py`, `voi.py`, `drift.py`,
`taxonomy/mechanisms.yaml`, `eval/alignment_labels.yaml`, `eval/alignment_metrics.py`.
New endpoints: `/api/alignment`, `/api/marketmap`, `/api/information-value`,
`/api/drift`. New test files: `test_align.py`, `test_marketmap.py`, `test_voi.py`,
`test_drift.py`, `test_api_v2.py`.

---

## What changed since the last audit

The previous revision recorded one decisive blocker and four fixed defects. The
blocker is gone.

| Then | Now |
|---|---|
| No upload endpoint. One hardcoded PDF, one fixture business | `POST /api/bundle` accepts multipart PDFs, detects carrier and document kind, and returns real accounting |
| 9 of 92 provisions classified (9.8%) | **58 of 97**, reported as 13 hand-verified + 45 keyword, counted separately |
| Consent was a boolean; `/api/brief` served everything regardless | `GET /api/disclosure/brief` returns **403 CONSENT_REQUIRED** until granted, withholds per consented field, and 403s again after revoke |
| No revocation despite a `revoked_at` column | `POST /api/consent/revoke` |
| Record was in-memory only, unexportable | `GET /api/record/export` + `POST /api/record/verify` — chain verified, tampering detected |
| Single global `_STATE`; two users shared one case | `sessions.py` — per-session case, cookie-scoped |
| Change events specified but absent | `events.py`, 9 event codes, each returning `relevant_rules` and `requested_documents` |
| No accessibility attributes at all | 17 `aria-*`, 3 `role`, `aria-live` regions, skip link, sr-only text, 5 labels |
| Rule id asserted `...BREACHED` | Renamed `PREMIUM-PAYMENT-WARRANTY-TIMING` v2, with two tests failing the build if adjudicating language reappears |
| 44 tests | **325 tests** |
| No dependency pinning, no packaging | `requirements.txt` pinned, `pyproject.toml` added |

New modules: `extract.py`, `detect.py`, `classify.py`, `events.py`, `sessions.py`,
`errors.py`, `eval/citation_audit.py`, `taxonomy/classification.yaml`.
New test files: `test_intake.py`, `test_extract.py`, `test_classification.py`,
`test_api.py`, `test_frontend.py`, plus `tests/pdfbuild.py` for synthetic PDFs.

---

## Verified by execution, not by reading

**Upload accepts and rejects correctly.** Uploaded the real 13-page AIG Homes
Advantage wording — a published document with no entry in the per-carrier clause map:

```
HTTP 200   carrier detected: AIG
detected 21 · classified 6 · unaccounted 15
verified_classified 0 · keyword_classified 6 · ambiguous_abstained 0
carrier_in_clause_map: False
```

The accounting note said, unprompted, that no finding rests on this wording's clause
references and that constrained model classification is not implemented. That is the
correct behaviour on an unseen carrier: degrade, disclose, and refuse to import
Chubb's 85% threshold into a wording nobody has read.

Rejections are enforced before parsing: a `.exe` and a 30 MB file both returned 400
with a per-file reason. Tests cover empty, corrupt, oversized, over-page-cap, and
scans with no text layer.

**Consent genuinely gates.** Pre-consent 403, post-consent 200 with
`disclosed_fields`, `accounting_withheld` and `findings_withheld_count`, then 403
after revoke. A test asserts consent granted in one session does not leak to another.

**Portability is real.** Export returns the hash-chained record; verify returns
`chain_valid: True, fact_count: 5, problems: []`, and a test proves tampering is
detected.

**Citation fidelity is measured.** `python -m eval.citation_audit`:

```
Spans verbatim at cited offsets: 25/25  (rate 1.0)
Spans inside a cited provision:  8/8   (rate 1.0)
invariant classified + unaccounted == detected: True
```

That measurement needs no domain reviewer, which is why it is the strongest number
currently available.

---

## P1 — blocks deployment, not the demo

### P1.1 No authentication. Still the top deployment blocker.

`GET /api/health` now *declares* the absence of authentication, and there is a test
asserting it does (`test_health_declares_the_absence_of_authentication`). Security
headers are present and the session cookie is HttpOnly + SameSite, both tested. But
there is still no login: anyone who can reach the port gets a session and can upload,
grant consent and delete a case.

Honest framing for judges: the consent model is enforced *within* a session, and
sessions are isolated from each other. What is missing is proof that a session belongs
to a particular business. Do not deploy to a public host before that exists, not even
for judging.

**Fix.** Authentication in front of session creation, then bind `business_id` to the
authenticated principal rather than accepting it as a parameter.

### P1.2 Nothing persists across a restart.

Still `:memory:`. The `case` table is *meant* to be transient, so that half is by
design — but `record_fact` is described as a portable append-only asset and it does
not survive a process restart. Export mitigates this: the record can now be taken out
and re-verified, which is a real answer, just not persistence.

**Fix.** File-backed SQLite for the record store.

### P1.3 Pipeline re-runs per cold request.

`/api/brief` after a reset re-parses the wording. `document.sha256` is recorded, so
caching by content hash is the available fix.

---

## P2 — coverage and quality

| Item | State | Note |
|---|---|---|
| Verified clause maps cover 3 carriers | **Largely addressed by v2** | Findings still rest only on hand-verified clause references, so that ceiling is unchanged for *findings*. But mechanism identification no longer needs a map at all: recall 8/8 on four never-hand-mapped Malaysian wordings. The scaling story is now measured rather than asserted |
| Layer 2 step 3 | **Implemented, but not as specified** | The spec called for constrained model classification. It ships as structural mechanism alignment instead: `align.py` proposes candidates (optionally with TF-IDF) and binds only what a deterministic slot verifier accepts. That split is why enabling a model here did not trade an auditable system for an unmeasured one — and why the claim is now the precise "no ML model makes a consequential decision" rather than the older, briefly-untrue "no model anywhere" |
| The drift clock runs on sample data | Labelled `DECLARED_SAMPLE_SERIES` on every response that touches it | Wiring a published series (BCA tender price index, SingStat) is an integration, not a redesign. The interface is already the one a real series would populate, and a test fails if the label is dropped |
| `compare_carriers()` runs one fixed scenario | Demonstration, not an engine path | Fine for the pitch; label it as a fixed scenario on stage |
| `DROPPED` is an internal fifth state | Verified it does not leak into the brief | Consider surfacing the dropped count in the accounting header — a dropped finding is itself a bounded-omission fact |
| No CI | 325 tests nobody runs automatically | A GitHub Action on push. Shreya has done this with pre-commit hooks and Actions before |
| No git history | `.gitignore` exists, no `.git` | For a submission that must show no code ported from a prior competition (cl 12.1(o)(iii)), commit history is the evidence |

---

## Blocked on a person, not on code

**No insurance-qualified reviewer.** This is unchanged and it is the largest remaining
gap in the submission. The evaluation harness now handles it correctly rather than
papering over it: labels carry a `derivation` field, and the harness separates
`ENGINE_OUTPUT` (baseline only, excluded from measurement) from
`INDEPENDENT_OBJECTIVE` (measured). It prints the exact claim the evidence supports
and refuses to print more:

```
MEASURED (independently derived labels only)
  Bundles: 1   Assertions scored: 10
  Precision: 1.0   Recall: 1.0

CLAIM LANGUAGE THE EVIDENCE SUPPORTS:
  SCOPED CLAIM ONLY. ... This is NOT a general accuracy rate and must not be
  compared with a general one.

BLOCKED ON:
  No label carries derivation REVIEWED_BY_EXPERT.
```

So the position on stage is defensible: a narrow, real, measured number plus an
explicit statement of what it is not. What it still is not is a general accuracy rate
comparable to Stanford's 17–33%, and the pitch must not imply otherwise until a named
reviewer has labelled a set.

**Also outstanding and not code:** deck, written proposal, video. Registration closes
14 August 2026, 2359 SGT.

---

## Defects found by verifying, not by reading

Three defects surfaced during the v2 sweep that no amount of code review had caught.
All three are recorded because the pattern is the same in each: **a guarantee that held
in the place a reader looks and not in the places they don't.**

### 1. Case deletion was cosmetic for three endpoints — FIXED

After `DELETE /api/case`, `/api/brief` correctly returned zero findings. Meanwhile
`/api/information-value` kept ranking the *deleted* findings' information gaps —
naming this business's missing documents — and `/api/drift` still returned a crossing
date of 2027-03-01. The cached brief was being cleared; the in-memory findings list
never was.

This is the one promise the product cannot afford to fake, and it was faked in exactly
the places a demo would not re-check. Deletion now clears `findings`, and every
case-scoped view returns `available: false` with a stated reason. `/api/marketmap` is
deliberately exempt because it holds no case — it is computed from published wordings,
and silencing it would imply the comparison was built from the caller's documents.
Tested server-side, and statically pinned in `test_frontend.py` so the page cannot
forget to re-ask.

### 2. The alignment counts did not add up — FIXED

MSIG offered 23 proposals, rejected 13, and displayed 4. Six verified duplicates
vanished between the count and the list, so the displayed rejection rate could not be
checked by arithmetic. Every other number this product puts on screen reconciles.
`collapsed` is now a counted bucket, and `assert_invariant()` refuses to serialise a
result whose arithmetic does not close: `proposals == verified + rejected + collapsed`.

### 3. `.ghost` had no CSS rule at all — FIXED

Every secondary control — reload, retry, dismiss, show record, export, book view, and
each per-file remove button — fell back to the base button style. The page had two
visible button ranks where the markup declared three, which is a large part of why the
interface read as flat and undifferentiated.

---

## Verification performed this sweep

| Check | Result |
|---|---|
| Full test suite | **325 passed** |
| Every one of the 24 product routes | Tested, and enforced by a route-coverage guard that fails the build if a route ships without one |
| Live HTTP sweep through uvicorn (not just the in-process test client) | 58/58 checks |
| Concurrency on a single shared session | 72 concurrent reads + 48 concurrent writes, zero non-200, state intact, invariants still hold |
| Front end in a real DOM (jsdom against the live API) | 44/44 render and interaction checks, zero JS errors, no stuck `aria-busy` |
| Deletion reaching the rendered page | Verified separately: all four case-scoped views go quiet, market map correctly does not |
| `eval.alignment_metrics` | precision 1.0, recall 1.0 |
| `eval.citation_audit` | 25/25 spans verbatim, accounting invariant holds |
| `eval.harness` | P=1.0 R=1.0 on objective assertions, still refusing an unqualified accuracy claim |

jsdom was installed transiently with `--no-save` and removed afterwards. The front end
still has no build step and the repository has no `package.json`.

---

## Audit environment

Python 3.13.12. 325 tests pass in the consolidated tree at `E:\SFF\proven`.
Pre-consolidation source is preserved at `E:\SFF\_backup-proven-pre-v1` (42 files).
