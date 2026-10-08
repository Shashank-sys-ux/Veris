# SUBMISSION PACK — copy-paste ready

Deadline: **14 Aug 2026, 2359 SGT** (T&C cl 7.3). No amendments after (cl 7.5).
Portal: `forms.gftn.co/gfh2026` · Problem Statement **03**, Zurich Insurance.

Everything below is written to be pasted. Nothing here needs new work.
**No claim in this pack goes beyond what the code actually does.**

---

## 1. TEAM BIOGRAPHY — 470 characters

```
Five final-year CS/AI-ML students from Mysuru, India. We have built this shape of system before: a RegTech pipeline extracting clauses from 25 statutes with verbatim-locked citations, authority gating and human sign-off (593 tests), and a symbolic layer cutting LLM hallucination 25%. Grand finalists at Meta PyTorch OpenEnv (52,000+ entrants) and Infosys Global Hackathon; TiE U runners-up; IEEE Ideathon winners. PROVEN already parses a real 28-page Singapore wording.
```

---

## 2. SOLUTION NAME

```
PROVEN — evidence-backed insurance adequacy infrastructure for SMEs
```

---

## 3. ONE-LINE DESCRIPTION

```
PROVEN reads the insurance and business documents an SME already holds, computes what its policy would actually pay, grades every finding by the strength of the evidence behind it, and refuses to put a number on anything it cannot establish.
```

---

## 4. THE PROBLEM (short version)

```
94.7% of Singapore's 369,500 SMEs employ fewer than 25 people, which makes dedicated insurance expertise economically rare. Their policy was priced for the business they used to be; nobody re-reads it.

On the other side, where risk cannot be efficiently verified on a S$1,200 premium, cover gets restricted, sub-limited or conditioned. Zurich Resilience Solutions performs roughly 60,000 engineer-led assessments a year across 40 countries — about 1,500 per country — against 337,700 Singapore firms under 25 employees.

The common cause: nothing about a small business is ever established. Every figure is either self-declared, which is worthless to an underwriter, or unverified, which is unpriceable. Zurich's problem statement asks for resilience AND insurability. Insurability is the supply side, and it is the side almost nobody addresses.
```

---

## 5. THE SOLUTION (long version)

```
PROVEN is four layers, and no machine-learning model makes any consequential decision.

LOCATE — native PDF ingestion. Every quotation is anchored to (document, page, character offset) and hashed, so any claim can be re-checked at source.

ACCOUNT — every operative provision gets one taxonomy code or is marked UNACCOUNTED and quoted verbatim. The invariant classified + unaccounted = detected is asserted in code and tested. On the demo bundle: 97 detected, 58 classified, 39 unaccounted. The 58 is reported as 13 hand-verified plus 45 by keyword, counted separately, and keyword classifications feed no finding.

RESOLVE — deterministic settlement arithmetic and precedence. Order of operations is read from the wording (Chubb cl 3.12: average, then sub-limits, then deductible), not assumed. Four abstention gates: span fidelity, boundary, operand completeness, unresolved precedence. Where precedence cannot be established the engine escalates rather than choosing.

BRIEF — graded findings assembled into a Review Brief, released only under granular, revocable consent, and handed to a licensed adviser. We feed the intermediary rails Zurich already operates rather than rebuilding them.

Every finding carries an evidence class, derived from who authored the source document and impossible for a caller to override:
  PROVEN — every input is a span in an insurer, authority or third-party document
  DECLARED — at least one input comes from a document the business wrote itself
  MARKET_CONVENTION — inputs are evidenced but the wording does not state the arithmetic
  UNESTABLISHED — a required input has no document behind it; we show no number
```

---

## 6. WHAT MAKES IT DIFFERENT — the evidence, not the architecture

This is the section that wins or loses. Lead with the measurement.

```
We read three real, published Singapore SME policy wordings — Chubb Select+ (28pp), MSIG SUMO (41pp), Liberty SMECare (49pp), 118 pages — and scanned the same four clause behaviours across all three.

Every one diverged. One diverged inside a single document.

                        CHUBB        MSIG                     LIBERTY
Average threshold       85%          none - any shortfall     TWO provisions: none on a
                                                              value basis, 85% on a
                                                              reinstatement basis
Formula stated in text  No           No                       Yes, verbatim
Condition-precedent
  declaration clause    Absent       Present, sweeping        Arbitration only
Premium payment
  warranty              60d/auto-terminate/S$25   identical   identical
Unoccupancy day count   14           30                       30, but 7 in one section

Why this matters more than any feature: a single hardcoded threshold is wrong in BOTH
directions on real documents. Assume Chubb's 85% and you under-report every MSIG
insured, whose shortfall bites from the first dollar. Read only Liberty's General
Condition 4 and you over-report every Liberty insured on a reinstatement claim, because
you have removed an 85% cushion its "Average Relief" clause actually grants.

So thresholds are stored per clause instance keyed to the basis of settlement, never per
carrier. Where the documents do not establish which basis governs, the engine reports
both candidate provisions and declines to choose.

We did not assume the market is heterogeneous. We measured it, and we can show the page
for every cell.
```

**Note for the team:** the Liberty second-provision finding was **our own error**, caught in external review, corrected, and covered by five regression tests. If a judge asks how you handle being wrong, that is the answer — and it is a better answer than never having been wrong.

---

## 7. WHAT WE MEASURED — say exactly this and no more

```
Citation fidelity, which needs no domain reviewer:
  25 of 25 quoted spans verbatim at the cited character offsets
  8 of 8 spans inside the clause they are attributed to
  classified + unaccounted = detected: true

Scoped accuracy, on assertions whose ground truth is objective — counts, dates and
arithmetic read from documents, with no legal construction:
  10 of 10, precision 1.0, recall 1.0, n = 1 bundle

This is NOT a general accuracy rate and we will not compare it to one. Our evaluation
harness physically refuses to print a broader claim until a named insurance-qualified
reviewer has labelled a set. That reviewer is our first hire.

163 automated tests, including property-based tests on the settlement arithmetic and
guard tests that fail the build if any rule identifier contains adjudicating language.
```

---

## 8. WHAT EXISTS AND WHAT DOES NOT — state it plainly

T&C cl 4.1 asks for market-ready; cl 12.1(j) makes misrepresentation a disqualification
risk. So do not dress this up.

```
EXISTS AND RUNS TODAY
  Document upload accepting multipart PDFs, with carrier and document-kind detection
  Rejection of non-PDF, empty, corrupt, oversized and text-layerless files before parsing
  13 findings across all four output states on a full bundle
  Honest degradation on an unseen carrier: uploading a real AIG wording returns
    carrier AIG, carrier_in_clause_map false, verified_classified 0, and states that no
    finding rests on that wording's clause references
  Consent gate returning 403 until granted, withholding per named document, and 403
    again after revocation
  Hash-chained portable record with export and independent verification; a test proves
    tampering is detected
  Deleting a case removes every finding; the record survives. There is no violation,
    breach, deficiency or score column anywhere in the schema, and a test asserts it
  163 tests passing

DOES NOT EXIST
  An incorporated entity, a customer, revenue, a pilot, or a book
  Authentication — the service declares its own absence of it and must not be exposed
  Verified clause maps beyond three carriers
  An expert-reviewed accuracy rate
```

---

## 9. COMPETITIVE POSITION — name them first, unprompted

```
Zurich Program IQ (Dec 2025) already reads policy wording and flags sublimit mismatches
— internal-facing, large-account, master/local structures on Zurich paper. Zurich Edge
Assist (Nov 2025) already moves the intermediary transaction across Asia Pacific. We are
the evidence layer that feeds those rails, not a portal beside them.

Advocate Technologies ($18M seed, Aug 2026), Qumis, Coverwatch ($4.5M, Jul 2026),
Newfront/WTW (acquired Jan 2026) and Kayna all ship coverage analysis. Marsh Singapore
publishes a free protection-gap self-assessment and states it has helped 15,000+ Asian
SMEs.

The difference is what the answer rests on. They benchmark a policy against market data
they own. We compute from the document's own arithmetic and from Singapore statute — the
verified average clause, the schedule election, the premium warranty date, the WICA
threshold. "Your limit is below market" needs their dataset. "This clause reduces your
payout on a S$60,000 stock fire, and here is the clause" needs only the documents in
front of us, and a judge can check it on stage.

Chisel AI built automated policy checking, won Gold at Zurich's first Innovation World
Championship in 2019, and filed for bankruptcy in April 2022. It was pre-LLM, so the
marginal cost of each new wording never fell, and it sold to brokers who decline exactly
these accounts. Our cost falls per wording, not per policy.
```

---

## 10. BUSINESS MODEL — hedge the price, it is a hypothesis

```
Carriers pay per reviewed policy. Illustrative pricing ~S$18 per policy per year,
subject to pilot validation — a hypothesis, not a finding. A Singapore SME commercial
policy at roughly S$1,200 premium generates about S$120-240 of gross commission at
practitioner-cited small-commercial rates of 10-20%, and we could find no authoritative
published Singapore commission schedule, so treat that range as indicative.

Under our own grading scheme the price is MARKET_CONVENTION, not PROVEN. We apply our
vocabulary to our own business model rather than exempting ourselves from it.

Three budgets, strongest last: growth (one converted endorsement pays for many reviews),
claims cost (proof of state at date of loss shortens disputes), and E&O — ReSource Pro
documented in Jan 2026 that agencies under staffing pressure have eliminated small-
commercial policy reviews, transferring aggregate exposure onto themselves. That is an
existing budget line.

Marginal cost falls with WORDINGS, not policies. Singapore SME package wordings cluster
across a handful of carriers, so every wording parsed makes its whole installed base
nearly free. Fully penetrated Singapore SME is roughly S$10m ARR — small enough to be
credible.
```

---

## 11. REGULATORY POSTURE

```
A tool that reads a business's own general insurance documents and states findings sits
outside the Financial Advisers Act 2001 (Act 43 of 2001; regulations at FAA2001-RG2),
which regulates advice on investment products — general insurance is not one. It sits
outside the Insurance Act 1966 intermediary regime provided it does not arrange or
solicit. We have flagged confirmation of the statutory definition of "investment
product" by counsel as a load-bearing dependency.

Two rules hold the line: findings never recommendations, and we never touch premium,
application or commission.

PDPA is the actual constraint, and four decisions are already made: redact at ingestion,
contract as a data intermediary, do not train on customer documents, Singapore data
residency with a named DPO under s.11(3).

We will arrive procurement-ready against the MAS AI Risk Management Operationalisation
Handbook (20 Mar 2026) and the MAS Information Paper on AI agent governance (3 Jul 2026),
with a sub-processor register anticipating the Third-Party Risk Management Guidelines
consulted on Mar-Apr 2026.
```

---

## 12. ASK — be specific

```
1. One wording and one book segment: a single Singapore SME product line, carrier-
   initiated, on documents Zurich already holds.
2. Ninety minutes of an underwriter's time to review the rule library and settle whether
   third-party verification could support a coverage decision.
3. Claims denial data. There is no published Singapore general insurance denial rate;
   Zurich has it. It would let us target the diagnostic at the gaps that actually convert
   into denied claims.
4. A named pilot sponsor.
```

---

## 13. OPEN-SOURCE DECLARATION — T&C cl 9.6(c)

Requires the ROLE of each component, not a licence list. Full version already written at
`proven/OPEN-SOURCE.md` — paste that file. Summary:

```
pypdf (BSD-3)        Layer 1 native PDF text extraction. No OCR in the demo path.
FastAPI (MIT)        Layer 4 API: Review Brief, consent gate, case lifecycle, intake
uvicorn (BSD-3)      ASGI server
pydantic v2 (MIT)    Request validation on the API boundary
PyYAML (MIT)         Loads the clause taxonomy and rule files, so rules stay reviewable
pytest (MIT)         Test runner, 163 tests
hypothesis (MPL-2.0) Property-based tests on the settlement arithmetic
SQLite (public dom.) The two-store data model. No server
Vanilla HTML/CSS/JS  Front end. Zero npm dependencies, no build step

Data: Chubb Select+, MSIG SUMO and Liberty SMECare wordings, all publicly downloadable.
Grace Electrical v EQ Insurance [2016] SGHC 233, a public judgment. All business
documents in the demo are SYNTHETIC and labelled as such on screen every time.
```

---

## 14. ANTI-DUPLICATION — T&C cl 12.1(o)(iii)

```
New repository, new taxonomy, no code ported from any prior competition entry. A team
member's earlier RegTech project was entered at a UN ESCAP hackathon; it is declared here
as background experience and background IP under cl 14.2. Techniques are reusable; code
and taxonomy in this submission are original to it.
```

---

## 15. VIDEO SCRIPT — 3 minutes, read it as written

Screen-record the running app. No slides in the video.

```
[0:00 — talking head or voiceover, no screen action]
Insurance decisions are made from documents. A small business has no system that tells
them what their documents actually establish. That is what PROVEN does.

[0:15 — drag ONE pdf in: the policy wording. Click Analyse.]
I am giving it only the policy wording. Watch what it does.

[0:25 — findings appear: 8, all Information missing]
It refuses. Eight findings, every one saying which document it still needs — the schedule
to check theft, the accounts to check stock, the CPF record to check staff. A policy
alone is enough to sound confident. Most tools would produce a full report from this.

[0:40 — click Reload demo bundle. Scroll to Accounting.]
Now the full bundle. Ninety-seven provisions detected, fifty-eight classified, thirty-
nine unaccounted — and we lead with the thirty-nine, quoted, so you can read them
yourself. A citation proves what a system said. It proves nothing about what it missed.

[1:00 — Findings, filter PROVEN. Point at premium finding.]
Premium was received on day seventy-one. The policy terminates cover automatically after
day sixty. This business is paying, holds a certificate, and may have no insurance at
all. Two dates subtracted.

[1:20 — the conflicting endorsements finding]
Two endorsements set the same sub-limit to five thousand and twenty-five thousand.
Neither says which governs. We had a coin flip available and refused it — it routes to a
licensed adviser instead. Guessing is how you create a twenty-thousand-dollar mistake
with a paper trail.

[1:40 — the average finding, point at the label]
Stock insured for a hundred thousand; the accounts say a hundred and fifty. Sixty-six
point seven percent adequacy, so a sixty-thousand-dollar fire pays about thirty-five
thousand. Now read the label: market convention. Clause 4.2 states the eighty-five
percent trigger and never states the formula. We searched all twenty-eight pages. So we
show the figure and refuse to call it the amount payable.

[2:05 — scroll to UNESTABLISHED]
Buildings: no reinstatement assessment exists, so no number at all. The counter says
eight abstained rather than asserted. That counter is the product.

[2:20 — drag in the AIG wording]
This is a real AIG policy we have never taught the engine. It identifies the carrier,
tells you it has no verified clause map for AIG, classifies zero provisions as verified,
and states that no finding rests on this wording's clause references. Showing you the
system fail safely is the only way to prove the refusals are not decoration.

[2:40 — the three-wordings table]
Three real published Singapore wordings, a hundred and eighteen pages. Chubb bites below
eighty-five percent. MSIG from the first dollar. Liberty has two provisions with
different thresholds depending on the basis of settlement. One hardcoded number is wrong
in both directions.

[2:52 — Delete case]
Delete the case and the findings are gone. The record of established facts survives.
Search that schema for a breach column. There is not one.
```

---

## 16. DECK — 10 slides, content written out

| # | Title | Content |
|---|---|---|
| 1 | **PROVEN** | *Insurance decisions are made from documents. SMEs have no system that tells them what theirs establish.* Team, PS03, Zurich |
| 2 | **The gap has two sides** | Demand: 94.7% under 25 staff, expertise economically rare. Supply: ~1,500 engineer assessments per country vs 337,700 firms. Zurich asks for resilience **and insurability** |
| 3 | **We read three real wordings** | The divergence table. **This is your hero slide.** 118 pages, page-cited |
| 4 | **Wrong in both directions** | 85% under-reports MSIG · no-threshold over-reports Liberty. Therefore per-clause-instance, never per-carrier |
| 5 | **Four evidence classes** | PROVEN / DECLARED / MARKET_CONVENTION / UNESTABLISHED. Derived from authorship, not settable by a caller |
| 6 | **Lead with what we could not read** | 97 · 58 · 39 with the 39 quoted. Bounded omission vs citation |
| 7 | **It fails safely** | The AIG screenshot: `carrier_in_clause_map: false`, `verified_classified: 0` |
| 8 | **What we measured** | 25/25 citation fidelity · 10/10 objective, n=1 · **and the sentence about what it is not** |
| 9 | **Model, market, ask** | ~S$18 illustrative · cost falls per wording · the four-item ask |
| 10 | **What does not exist** | No entity, no customer, no auth, 3 carriers, no expert-reviewed rate. *Then:* here is what does — 163 tests, running now |

Slide 10 is not weakness. **Ending on your own limits is the strongest possible proof
that the four classes are real and not marketing.**

---

## 17. FINAL CHECKS BEFORE YOU HIT SUBMIT

- [ ] Roster frozen — 4 or 5 names. Cl 5.2 permits up to 10, no amendments after close
- [ ] `proven/OPEN-SOURCE.md` pasted into the open-source field (cl 9.6(c))
- [ ] Video under the published length limit, English (cl 8.2)
- [ ] Every synthetic document labelled synthetic on screen
- [ ] No real person's name anywhere in the video or deck
- [ ] Nowhere does the pack say a claim will or will not be paid
- [ ] Nowhere does it say a term has been breached
- [ ] The accuracy sentence is copied **verbatim** from §7 — do not paraphrase it upward
- [ ] `python -m pytest -q` → 163 passed, recorded the night before
