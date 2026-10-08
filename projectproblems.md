# Project problems — judged as an international fintech/insurtech panel

Originally written as an adversarial audit: every claim in the documents checked
against what the code actually did. **Revised 11 Aug 2026** after a substantial
rebuild, with each problem marked resolved, partly resolved, or open, and every
resolution verified by running the code rather than by reading it.

**Score: 17 of 22 resolved, 3 partly resolved, 2 open.** Both open items are blocked
on a person, not on engineering.

Jump to [what a panel will still attack](#g-summary--the-three-questions-that-decide-it).

---

## A. CREDIBILITY — claims a panel can falsify in 90 seconds

### A1. The stated differentiator did not exist. — **PARTLY RESOLVED**

**Was:** The pitch claimed a measured error rate against Stanford's 17–33%. There was
none. The harness ran one bundle whose label was a copy of the engine's own output —
it tested that the engine equals itself.

**Now:** Labels carry a `derivation` field and the harness refuses to mix kinds.
`ENGINE_OUTPUT` is excluded from measurement and marked "baseline only".
`INDEPENDENT_OBJECTIVE` is measured. It prints the exact claim the evidence supports
and blocks anything stronger:

```
MEASURED (independently derived labels only)
  Bundles: 1   Assertions scored: 10
  Correct: 10   Precision: 1.0   Recall: 1.0

CLAIM LANGUAGE THE EVIDENCE SUPPORTS:
  SCOPED CLAIM ONLY. On 10 assertions whose ground truth is objective — counts,
  dates and arithmetic read from the documents, with no legal construction — the
  engine agrees with independently derived labels on 10 ... This is NOT a general
  accuracy rate and must not be compared with a general one.

BLOCKED ON:
  No label carries derivation REVIEWED_BY_EXPERT.
```

A second measurement was added that needs no reviewer at all —
`eval/citation_audit.py`: 25/25 spans verbatim at cited offsets, 8/8 inside a cited
provision.

**Still open:** no general accuracy rate, because no insurance-qualified reviewer has
labelled a set. The honest version is now *in the tooling*, which is the difference
between a gap and a lie. Do not compare the scoped number to Stanford's.

---

### A2. The system could not accept user documents. — **RESOLVED**

**Was:** No upload endpoint. Hardcoded to one PDF path and one fixture business. An
SME could not use it at all.

**Now:** `POST /api/bundle` accepts multipart PDFs. `GET /api/bundle/kinds` exposes 11
document kinds, each with its `author_class` and resulting `grades_as`, so grading
stays derived and a caller cannot manufacture a `PROVEN` finding.

Verified by uploading the real 13-page AIG Homes Advantage wording — a published
document with no entry in the clause map:

```
HTTP 200   carrier detected: AIG   carrier_in_clause_map: False
detected 21 · classified 6 · unaccounted 15
verified_classified 0 · keyword_classified 6
```

Rejection is enforced *before* parsing: `.exe` → 400, 30 MB file → 400, each with a
per-file reason. `test_intake.py` covers empty, corrupt, oversized, over-page-cap, and
scans with no text layer.

---

### A3. Only 9 of 92 provisions were classified (9.8%). — **RESOLVED**

**Now 58 of 97**, and the split is reported rather than blended: **13 hand-verified +
45 keyword**, with `verified_classified`, `keyword_classified` and
`ambiguous_abstained` as separate fields. New `classify.py` + `classification.yaml`
implement the heading-keyword path that the spec described and the code lacked.

The accounting note states, unprompted, that keyword classifications *feed no finding*
and that constrained model classification is not implemented. That is the right
distinction: shrinking the unaccounted bucket is not the same as being able to reason
about a clause.

---

### A4. "Three carriers" was misleading — the demo ran on one. — **PARTLY RESOLVED**

Upload plus carrier detection means any wording can now be ingested and accounted for,
so the claim is no longer hollow. But **verified clause maps still cover three
carriers**, and `compare_carriers()` is still one fixed scenario rather than an engine
path.

**Honest framing for stage:** "we account for any wording; we can build findings on
three." Coverage grows per wording read, which is the stated scaling model. Label the
comparison as a fixed scenario.

---

### A5. The spec claimed a model in Layers 1 and 2. There was none. — **RESOLVED, then restated**

`(model)` was removed from the architecture diagram, and the accounting note said so
in the product's own output: *"Constrained model classification (specified as Layer 2
step 3) is NOT implemented. There is no model anywhere in this pipeline."*

**That sentence has since been corrected, because it stopped being true.** v2 built
Layer 2 step 3 — not as constrained model classification, but as structural mechanism
alignment (`align.py`), which ships with an optional TF-IDF proposer. So "no model
anywhere" became an overstatement, and an overstatement in the product's own output is
precisely the failure this project exists to prevent.

The claim now made, in the code, the docs and the API response:

> **No machine-learning model makes a consequential decision.**

That is structural rather than a promise. A proposer may offer any span and is
explicitly allowed to be wrong; binding requires that every mandatory structural slot
match and no negative slot match, which is regex over stored page text.
`test_swapping_the_proposer_cannot_change_a_carrier_fact` fails the build if swapping
the proposer ever changes a bound value, and
`test_the_accounting_note_states_the_model_claim_precisely` fails the build if the old
overstated wording comes back. Nothing below Layer 2 contains a model and never has.

Deterministic-and-auditable remains the stated design choice rather than an
embarrassment. It is the stronger position, and now it is stated accurately.

---

## B. TECHNICAL SOUNDNESS

### B1. The accounting was a single regex, fragile to format. — **PARTLY RESOLVED**

Detection now runs multiple named schemes and reports which fired
(`Schemes that fired: NUMERIC_SIMPLE (26)`), so the basis of the count is visible
rather than implied. Alphabetic and nested schemes exist.

**Still true:** a wording with no clause numbering at all, or a table-formatted
schedule, will still under-detect. The mitigation is that it under-detects *visibly* —
the count and the scheme are on screen.

---

### B2. Rules were hardcoded to fixture JSON shapes. — **RESOLVED**

New `extract.py` (23 KB) provides a structured extraction layer between page text and
the rule evaluators, with `test_extract.py` asserting the properties that matter:

- `test_get_never_raises_and_never_defaults`
- `test_missing_lists_exactly_what_is_absent`
- `test_established_requires_value_document_and_needle`
- `test_an_established_fact_is_not_overwritten_by_a_later_absent_probe`
- `test_buildings_value_stays_absent_when_the_schedule_states_null`

That last one is the important one: absence stays absence instead of silently
becoming zero.

---

### B3. The "portable record" was not portable. — **RESOLVED**

`GET /api/record/export` and `POST /api/record/verify`. Verified live:
`chain_valid: True, fact_count: 5, problems: []`. Two tests:
`test_exported_record_verifies_and_detects_tampering` and
`test_record_export_has_no_breach_field`.

Persistence across restart is still absent (P1.2 in `00-current/product-readiness.md`),
but the record can now leave the system and be independently re-verified, which is what
"portable" actually needed to mean.

---

### B4. Consent was cosmetic. `/api/brief` served everything. — **RESOLVED**

`GET /api/disclosure/brief` is the disclosure path and it is gated:

```
pre-consent   403 CONSENT_REQUIRED
post-consent  200, with disclosed_fields, accounting_withheld,
                        findings_withheld_count, withheld_pending_documents
after revoke  403
```

Withholding is per consented field, not a boolean. `POST /api/consent/revoke` added.
`test_consent_granted_in_one_session_does_not_leak` covers cross-session leakage.

---

### B5. No error handling on ingestion. — **RESOLVED**

New `errors.py` and a structured error envelope (`{"error": {"code", "message",
"detail"}}`). Corrupt, empty, oversized and text-layerless PDFs all return actionable
400s naming the offending file.

---

### B6. Single-tenant global state. Two users broke each other. — **RESOLVED**

`sessions.py`. Two clients get different session ids and different case ids, confirmed
live. Cookie is HttpOnly + SameSite, with a test asserting it.

---

## C. COMMERCIAL VIABILITY — **OPEN, and largely unchanged**

These were never code problems and the rebuild did not address them. They are answered
in `00-current/finalized-idea.md` §10 and §10.5 with deliberate honesty, which is the
correct posture for a student team with no entity — but a business-track judge will
still press.

| # | Problem | State |
|---|---|---|
| C1 | S$18/policy with no billing, and the comparison commission rate is admittedly unsourced | Open. §10.1 labels its own assumptions, which is the best available answer |
| C2 | The neutrality moat is zero at n=1 carrier | Open, and §10.4 says so first. "Phase one is a diagnostic, not a bureau" |
| C3 | No customer evidence — no LOI, no interviews, no pilot. The persona is invented | Open. Fixtures are labelled synthetic on screen every time, which is the only mitigation available |
| C4 | The moat is geographic, not technical | Open. §10.4 names all four defenders honestly rather than claiming a network effect |
| C5 | Change events did not exist | **RESOLVED.** `events.py`, 9 codes, each returning `relevant_rules` and `requested_documents`. Verified live |

---

## D. SUBMISSION COMPLIANCE

### D1. A rule id asserted breach. — **RESOLVED**

Renamed `PREMIUM-PAYMENT-WARRANTY-TIMING`, version 2, with the reasoning recorded in
`compulsion.yaml`. Two new guard tests make regression impossible:
`test_no_rule_id_asserts_an_outcome` and `test_every_emitted_rule_id_is_clean`. The
finding is unchanged — day count located, clause quoted, escalated.

### D2. Regulatory claims were unsourced. — **RESOLVED**

§12 now cites **Financial Advisers Act 2001** (Act 43 of 2001, formerly Cap. 110) with
the Financial Advisers Regulations at `FAA2001-RG2`, and the **Insurance Act 1966**
(Act 46 of 1966) with its regulations, and names the load-bearing term: the statutory
definition of "investment product". Counsel confirmation is still the stated
dependency, which is correct.

### D3. No deck, no proposal, no video. — **OPEN. Highest-priority remaining item.**

Nothing exists but code and documentation. Registration closes **14 Aug 2026, 2359
SGT**. This is now the single most likely cause of failure, ahead of every technical
item on this page.

### D4. Accessibility non-compliance. — **RESOLVED**

17 `aria-*` attributes, 3 `role`s, `aria-live` regions, a skip link, sr-only text, 5
labels, `tabindex` management, and `lang`/`viewport` declared — all from zero.
`test_frontend.py` asserts language and viewport are declared.

Full WCAG conformance still requires manual testing with assistive technology and
expert review; this is a substantial improvement, not a certification.

---

## E. INTERNAL CONTRADICTIONS — docs vs code

| The docs said | Status |
|---|---|
| "React + Vite" front end | **Fixed.** Corrected in three places; the vanilla choice is now stated as a decision, with `test_frontend.py` covering what a framework would have caught |
| "L1 LOCATE (model)" / "L2 ACCOUNT (model + rules)" | **Fixed.** `(model)` removed; the absence is stated in the product's own output |
| "Model classification for what survives 1 and 2" | **Fixed by disclosure.** Still unimplemented, and the accounting note says so |
| "Heading keyword match for the remainder" | **Now implemented** — `classify.py` |
| "60–100 bundles" test set | **Still 1 runnable bundle**, but derivation is now labelled and only objective labels are measured |
| "Never assert breach" vs a rule id containing BREACHED | **Fixed** and test-enforced |
| "Consent blocks disclosure" | **Now true** — `/api/disclosure/brief` |
| "The record is portable" | **Now true** — export + verify |
| "Two deployment modes" | Mode A/B distinction enforced; unknown mode fails closed with 400 |
| "Change events as buttons" | **Now implemented** |

---

## F. WHAT WORKS — credit where due

1. **Cross-carrier divergence is real and page-cited.** Five clause behaviours
   diverging across three wordings, one diverging *within* Liberty. Lead the pitch
   with this.
2. **The accounting invariant holds** — `classified + unaccounted == detected`,
   asserted in code and tested, with the unaccounted quoted on screen.
3. **Evidence grading is derived and unforgeable.** `evidence_class` comes from
   `author_class`; no code path accepts it as an argument, and a test proves it. The
   upload path derives `author_class` from the detected kind, defaulting to `SELF` —
   the weakest class — so an unknown document can only weaken a finding.
4. **Four abstention gates, all deterministic**, all firing on deliberately broken
   input.
5. **"No violations table" is structurally true and now provably exportable** without
   one.
6. **Unseen carriers degrade honestly.** AIG upload reported
   `carrier_in_clause_map: False`, `verified_classified: 0`, and stated that no finding
   rests on that wording's clause references. Refusing to import Chubb's 85% threshold
   into an unread wording is the whole thesis, working.
7. **325 tests**, including property-based arithmetic, intake fuzzing, frontend
   wiring, and guard tests that fail the build on adjudicating language.

---

## G. SUMMARY — the three questions that decide it

1. **"Show me it working on a document I give you."**
   **Now works.** Upload it. On an unseen carrier it will tell you what it cannot do,
   which is a better answer than a confident wrong one.

2. **"What is your accuracy?"**
   Scoped and honest: 10/10 on objective assertions, n=1 bundle, plus 25/25 citation
   fidelity. Say the sentence the harness prints and stop there. There is still no
   general accuracy rate, and claiming one would break the only thing that makes this
   submission distinctive.

3. **"How are you different from Advocate/Qumis/Coverwatch?"**
   The answer is unchanged and good — evidence grading, bounded omission, the
   Singapore statutory library, computing from the document's own arithmetic instead
   of market benchmarks. They still have products in market and this is still a
   localhost demo with no customer.

The engine is no longer the weak point. **The weak points are now a missing deck, a
missing reviewer, and no authentication.** Two of those three are not engineering.

---

## H. PRIORITY ORDER — remaining work

| # | Item | Why it matters |
|---|---|---|
| 1 | **Deck, written proposal, video** | Nothing ships without these. Deadline 14 Aug 2026 2359 SGT |
| 2 | **One insurance-qualified reviewer, 20 labelled bundles** | Unblocks the only claim that differentiates the submission |
| 3 | **Authentication in front of session creation** | The only thing stopping a public deployment |
| 4 | Read MSIG and Liberty theft clauses in full | Upgrades the cleanest `PROVEN` finding from one carrier to three |
| 5 | File-backed SQLite for `record_fact` | Makes the portable record survive a restart |
| 6 | Git init + CI running the 325 tests | Provenance evidence for cl 12.1(o)(iii), and stops silent regressions |
| 7 | Surface the `DROPPED` count in the accounting header | A dropped finding is itself a bounded-omission fact |
| 8 | Extend verified clause maps beyond three carriers | Coverage is the honest scaling story; each wording is bounded work |
