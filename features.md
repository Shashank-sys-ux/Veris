# VERIS — Feature Register

**Zurich PS03 · Submission 21 Aug 2026 · Last verified 15 Aug 2026**

**617 tests passing. 42 modules. ~62 API routes.** Everything below is built and was verified by running it, not by reading the code.

```
cd "proven"
$env:PROVEN_LIVE_SOURCES="1"          # REQUIRED for the demo — see note below
python -m uvicorn proven.api:app --port 8000
python -m pytest -q                   # 617 passed
```

> **The one thing that will break your demo.** Live sources are OFF by default. `conftest.py` forces them off so the test suite stays deterministic and offline. If you forget `PROVEN_LIVE_SOURCES=1`, every badge on screen reads DEMO_FIXTURE and the product looks like a mock-up. Set it before you present.

---

## Verified live APIs — every one called and confirmed 15 Aug 2026

Free, no key, no signup.

| What | URL | Returns |
|---|---|---|
| **Rainfall** | `https://api-open.data.gov.sg/v2/real-time/api/rainfall` | Every station with lat/long + mm reading |
| **24h forecast** | `https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast` | Forecast by region |
| **2h forecast** | `https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast` | Near-term by area |
| **PSI** | `https://api-open.data.gov.sg/v2/real-time/api/psi` | Regional readings with lat/long |
| **Construction prices** | `https://tablebuilder.singstat.gov.sg/api/table/tabledata/M211251` | Cement, steel bars, granite, sand — monthly, real, through Jun 2026 |
| **ACRA company register** | `https://data.gov.sg/api/action/datastore_search?resource_id=d_3f960c10fed6145404ca7b821f263b87&q=FOODS&limit=5` | UEN, entity_name, uen_status_desc, entity_type_desc, reg_street_name |
| **OneMap geocoding** | `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=Tai+Seng+Street&returnGeom=Y&getAddrDetails=Y&pageNum=1` | Real lat/long — returned `1.33620537, 103.88944406` |

**Gotchas that cost an hour each:**
- SingStat needs a browser-like `User-Agent` or it returns 403.
- SingStat search needs `&searchOption=all` or it returns 400.
- ACRA is split across 27 resources by first letter. Search works; exact-UEN lookup only hits if the UEN is in that partition.
- OneMap returns an `"error": "Authentication token missing"` string **and still returns full results including geometry**. Use it, handle the day it stops.
- Live figures pulled 15 Aug: steel reinforcement bars 701.9 (Apr) → 703.9 (May) → 708 (Jun), **+2.8% year on year**. Sanity-check your parsing against these.

---

## PRIORITY 1 — Agents call real government APIs ✅

### 1.1 Sentinel live weather ✅
- [x] `_fetch_weather()` in `sentinel.py`, rainfall + 24h forecast, 15s timeout, User-Agent set
- [x] `RiskSignal` built from the actual response
- [x] `MET_SERVICE.mode = "LIVE"` only on success
- [x] Falls back to labelled fixture on failure — the demo survives no wifi

**Verified:** `/api/sentinel` returns a signal with `"mode": "LIVE"`, `"is_live": true`, `"simulated": false`.

### 1.2 Sentinel live construction index ✅
- [x] `_fetch_cost_index()` hitting SingStat `M211251`
- [x] Parses `Data.row[]` → `rowText` + `columns[]` of `{key, value}`
- [x] Real percent change into `magnitude_pct`

**Verified:** cost signal reports **Steel Reinforcement Bars +2.8% year on year**, `magnitude_pct: 2.8`.

### 1.3 Drift driven by the real index ✅
- [x] `drift.py` uses the live figure, not a hardcoded rate
- [x] Arithmetic unchanged — only the input changed
- [x] Source and month range on screen

**Verified:** `is_live: true`, series `1999 Jan–2026 Jun`, full movement 46.3%, YoY 2.8%, presentation string names SingStat M211251.

### 1.4 Discovery live ACRA lookup ✅
- [x] `ACRA_DATASTORE_URL` in `discovery.py`
- [x] Reads `uen`, `entity_name`, `uen_status_desc`, `entity_type_desc`, `reg_street_name`
- [x] Grounding gate intact — every fact re-located in fetched bytes or discarded
- [x] Graded `DISCOVERY_VERIFIED`, structurally barred from `CONFIRMED_EVIDENCE`

**Verified:** `demo_mode: false`, real fetch `ok: true`, and it produced a genuine finding — *"ACRA-registered street not matched on the policy schedule."*

### 1.5 Scheduler records honest modes ✅
- [x] Mode derived from `config.live_sources_enabled()` and actual fetch success, not hardcoded

### 1.6 Live vs demo visible per source ✅
- [x] `liveBadge()` renders green LIVE or grey DEMO_FIXTURE
- [x] Table of the actual URL called, per source, with status
- [x] `fetched_at` timestamp on screen

---

## PRIORITY 2 — Renewal comparison ✅

The feature nobody else has: noticing that a policy renewed on the same price with less cover.

- [x] **2.1** `renewal.py` — `compare_terms(prior, current)` → `TermChange` list, quotes from both documents
- [x] **2.2** `classify_materiality()` → MATERIAL | ADMINISTRATIVE | UNKNOWN, with UNKNOWN escalating
- [x] **2.3** `GET /api/renewal/compare`, material changes fed to the orchestrator via `renewal.material_signals()`
- [x] **2.4** Two demo PDFs: `renewal-prior-policy.pdf`, `renewal-current-policy.pdf`
- [x] **2.5** `sme-renewal` screen, material changes first
- [x] **2.6** `tests/test_renewal.py`

**Verified:** detects exactly 1 MATERIAL change — a **Communicable Disease Exclusion** added as Endorsement 3. Prior quote correctly `None` because it did not exist.

---

## PRIORITY 2B — The claim simulator ✅

- [x] **2B.1** `scenario.py` — `simulate()` applying sum insured cap → sub-limit → **average clause** → deductible, in that order, every line sourced
- [x] **2B.3** `tests/test_scenario.py` including abstention when the sum insured is unestablished
- [x] **2B.4** OneMap geocoding + `_haversine_km` + `_nearest_station` with its latest reading

**Verified arithmetic:**
```
Loss 300,000 → capped at sum insured   100,000
Average clause × 0.667 (100k / 150k)    66,700
Less deductible 5,000                   61,700
─────────────────────────────────────────────
Insurer pays          61,700
YOU ABSORB           238,300
```
Every step carries `document_kind`, `document_id`, `page`, `quote`, `author_class`. A case with no sum insured returns `abstained: true`.

### 2B.2 — corrected: the premium line was a mistake in my checklist ❌ withdrawn

My original checklist asked for *"Fixing this costs S$X in extra premium"* on the scenario screen. **That was wrong and it must not be built.**

`actions.py` refuses to state any premium, and the refusal is structural, not stylistic:
- `premium_basis` is permanently `NOT_QUOTED` and raises `ValueError` if anything changes it
- there is no premium, price, rate or quoted-amount column in the schema, by design
- `test_actions.py` **fails the build if any premium-shaped field acquires a number**

The module's own reasoning: pricing a risk requires a rating engine, underwriting appetite and a licensed intermediary, and inventing an indicative premium would be the fastest way to destroy the product's credibility. An estimate on that screen would contradict the principle the rest of the system is built on.

**What is shown instead:** the additional sum insured required, which is a documentary figure. The price is not ours to state.

---

## PRIORITY 2C — Dormant capabilities switched on ✅

- [x] **2C.1 OCR.** Installed `pytesseract` 0.3.13 + UB Mannheim **tesseract 5.4.0**, added to persistent User PATH (winget had not — this would have silently broken after a reboot). `/api/health` reports `available: true`. Verified it reads a rendered schedule image: *"Sum Insured (Stock): SGD 100,000"*, *"Deductible: SGD 5,000 each and every loss"*, *"Average Clause applies to this Section"* — numbers intact.
- [x] **2C.2 AI layer.** `/api/ai/status` reports `mode: LLM_ASSISTED`. The grounding gate re-locates every model claim in source bytes or discards it.

---

## PRIORITY 3 — Agents made legible ✅

- [x] **3.1** `GET /api/agents/activity` — per run: agent, `planned_check`, `calls` with status, `facts_extracted`, `facts_grounded`, **`facts_rejected`**, decision. Sourced from the scheduler's existing history, not a second store.
- [x] **3.2** `sme-agents` screen, newest first, real timestamps, rejection count surfaced
- [x] **3.3** Reasoning chain on findings — `precedence_reason` plus the URL-called table per run

---

## PRIORITY 4 — Demo reliability ✅

- [x] Every external call has a timeout and a labelled fixture fallback
- [x] `/api/health` reports `live_enabled` and every source's URL
- [x] `DEMO-SCRIPT.md` updated
- [x] `python -m pytest -q` green at 617

---

## PRIORITY 5 — The two capabilities that make this matter ✅

Added after the checklist was complete, because the research turned up two gaps the industry itself names and nobody has productised.

### 5.1 Business interruption adequacy — `bi.py` ✅

**Why:** this is the gap Zurich has publicly named. Zurich, citing CILA, warned that **up to 43% of business interruption policies were underinsured by an average of 53%** ([Insurance Business](https://www.insurancebusinessmag.com/uk/news/sme/zurich-smes-could-end-up-underinsured-due-to-common-mistake-71917.aspx)). The ABI's *Small Business, Big Risk* (Jan 2026, Public First, 1,002 SME owners) found **48% of SMEs had a physical premises and only 23% of those carried BI cover** ([ABI](https://www.abi.org.uk/media-hub/news-post/new-guide-to-help-smes-navigate-insurance-needs)). Sedgwick, reporting UK government research, notes **one in five businesses suffer a major disruption yearly and around 80% of those affected close within 18 months** ([Sedgwick](https://www.sedgwick.com/blog/the-sme-underinsurance-crisis/)).

- [x] Absence detection from the schedule's operative sections — provable from one document, no arithmetic
- [x] Matches the whole family of section names (consequential loss, loss of profits, business income, time element), which **fixes a real bug**: the existing rule matches only the literal "INTERRUPTION", so a policy calling it Consequential Loss would be wrongly reported as having no cover
- [x] `required_sum_insured()` — gross profit × (indemnity months ÷ 12) × forward growth
- [x] Indemnity-period check against a **declared** sector recovery benchmark
- [x] Abstains on the sum insured when gross profit is absent, naming the P&L that would resolve it
- [x] `as_external_signals()` withholds the absence finding because the rule engine already reports it — counting one document twice would inflate priority on false corroboration
- [x] `GET /api/bi`, `sme-bi` screen ("If You Cannot Trade")
- [x] `tests/test_bi.py` — 24 tests

**Verified on the demo case:** `cover_present: false`, HIGH severity, `basis: PROVEN_FROM_DOCUMENT`, three cited operands from the schedule, 18-month recovery estimate. **Correctly abstains** on adequacy — the ACCOUNTS document is a balance sheet with no gross profit, and the engine will not derive one from stock, receivables or cash.

**Verified arithmetic:** 310,000 gross profit over 18 months = **465,000** required; with 8% growth = **502,200**. A 180,000 sum insured over 12 months against 310,000 gross profit = **58.1% adequate, 130,000 short**.

> The recovery benchmarks are a **declared planning assumption**, not a measured Singapore statistic — none exists. They question an indemnity period and are never used to size a sum insured. The label travels with every output that leans on them.

### 5.2 Warranty and condition-precedent compliance — `warranty.py` ✅

**Why:** every other product in this space answers *what does my policy say*. This answers *will it pay*. Where a condition precedent is not satisfied, insurers may be entitled to decline a claim entirely — and depending on the wording, **regardless of whether the breach had any causal connection to the loss** ([Pinsent Masons](https://www.pinsentmasons.com/out-law/analysis/insurance-act-2015-changes-to-conditions-precedent)). A lapsed alarm certificate can defeat a fire claim.

I searched the market for a product that tracks this for an in-force SME policy. There are law-firm explainers of the principle and **no product**. That is the gap.

- [x] Catalogue of 10 obligations that actually defeat SME claims, each searched in the customer's **own** wording
- [x] **Obligation guard** — a located phrase only counts if duty language (`shall`, `must`, `condition precedent`, `warranted`) sits near it
- [x] Phrases found in definition or exclusion text are **set aside with the excerpt and the reason**, so a reader can overrule the judgement
- [x] `_clause_context()` quotes the real surrounding sentence from the stored page, not an echo of the search phrase
- [x] Deterministic checkers for premium payment and premises declaration
- [x] **UNVERIFIED is the default.** COMPLIANT requires evidence of compliance; silence is not compliance. BREACHED requires evidence and is never inferred from absence.
- [x] `GET /api/warranty`, `sme-willitpay` screen ("Will It Actually Pay?")
- [x] `tests/test_warranty.py` — 31 tests

**Verified against the real Chubb Select+ wording:**

| Outcome | Detail |
|---|---|
| **2 BREACHED** | Premium received **day 71** against a 60-day condition (page 9). Unit 03-12 occupied per the tenancy but absent from the schedule (page 6, *"The Insured **shall** give notice… of any material alteration"*) |
| **2 UNVERIFIED** conditions precedent | Claim notification (page 7, *"the Insured **must**: (a) notify Chubb in writing… no later than 30 days"*), reasonable precautions (page 24) |
| **3 set aside with reasons** | `electrical` p17 matched an **exclusion list**; `sprinkler` p13 matched a **cover extension**; `waste` p5 matched the **Pollutants definition**. None is an obligation |
| **3 genuinely absent** | Hot works permit, security protections, unoccupancy — reported as searched-and-not-found |

Signals are capped at `RISK_SIGNAL`. A failed date arithmetic is documented fact, but *"cover is void"* is a legal determination this engine is not entitled to make.

---

## Already built before this cycle — do not rebuild

| Area | Where |
|---|---|
| Document reading, OCR fallback that returns empty rather than inventing text | `ingest.py`, `extract.py`, `ocr.py` |
| Policy engine — limits, sub-limits, deductibles, average clause, warranties, exclusions, endorsement precedence | `rules.py`, `arithmetic.py`, `taxonomy.py` |
| Evidence grading with ceilings enforced as type errors | `grading.py`, `gates.py` |
| Grounding gate — every model claim re-located verbatim or discarded | `ai.py`, `discovery.py` |
| Three sensing agents | `connectors.py`, `sentinel.py`, `discovery.py` |
| Orchestrator — four VERIS conflict rules, six decision states, overlap escalation | `orchestrator.py` |
| Abstention, ranked by what each missing document would resolve | `voi.py`, `gates.py` |
| Autonomy — background scheduler, bounded history, survives agent failure | `scheduler.py` |
| Three roles, session-scoped | `auth.py`, `web/app.js` |
| Adviser queue, brief, request-information loop | `brief.py`, `actions.py` |
| Carrier attention matrix, premium-at-risk, Mode A/B boundary | `premium_at_risk.py` |
| Portable hash-chained record, independently verifiable | `db.py` |
| Cross-carrier divergence across three real wordings | `marketmap.py`, `align.py` |

---

## Out of scope — after the 21st

| Item | Blocker |
|---|---|
| Xero / QuickBooks connectors | Xero requires prior written approval for insurance use cases **and** prohibits training AI/ML on Xero data |
| ACRA paid Business Profile API | Corppass subscription, pricing not public |
| Myinfo business | GovTech relying-party onboarding, historically 4–12 weeks |
| Peppol / InvoiceNow Access Point | Signed Transport Infrastructure Agreement with IMDA. Highest long-term value, months of lead time |
| Temporal durable execution | Real re-architecture; the thread scheduler is fine for a demo |
| Commercial doc-AI (Reducto, Azure, AWS) | Paid accounts |
| On-premise agent for AutoCount / ABSS | Weeks, needs a customer to test against |

Detail in `05-research/`. Reference it if asked how this scales; don't build from it.

---

## Honest limits — say these plainly if asked

- **No insurance professional has reviewed the rules.** Everything asserted about average clauses, warranties and sub-limit precedence is a careful reading of the wordings, cited to page and quote, and it could be wrong in ways only an underwriter or loss adjuster would catch. One hour with someone who adjusts commercial claims is worth more than any remaining feature.
- **Connect signals are simulated.** Real accounting integration needs Xero's written approval.
- **Cannot verify headcount or revenue independently.** No Singapore API exists for either, at any price.
- **No accuracy guarantee.** No upstream vendor offers one, which is exactly why a licensed adviser stays in the loop.
- **No Singapore-specific SME underinsurance statistic exists.** Every percentage quoted here is UK or US and attributed as such.

