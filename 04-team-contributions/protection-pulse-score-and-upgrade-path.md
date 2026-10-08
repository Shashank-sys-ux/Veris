# Protection Pulse — Idea Goodness Score & Path to Finalist

**Idea author:** Chithsukhi CV
**Scored against:** Zurich Insurance, Problem Statement 03 — Closing the SME Protection Gap
**Reviewed from:** Zurich Challenge Champion / corporate innovation evaluator perspective
**Reference documents:** `chithsukhi-protection-pulse-solution-idea.md`, `session-1.md`, `2026 Hackcelerate TnC (2025 05 25).pdf`

---

## Verdict

# 6.5 / 10

**Category:** Good idea, correctly reasoned, competently scoped — but currently sitting in a crowded, well-funded category with a weak data story and an unclear reason why Zurich cannot build it internally.

This is a *strong shortlist-adjacent* idea. It is not yet a finalist idea. The gap between 6.5 and finalist is not more features. It is **three specific structural changes**, listed in the upgrade path below.

---

## Scorecard

| Dimension | Weight | Score | Weighted |
|---|---:|---:|---:|
| Problem understanding | 15% | 9.0 | 1.35 |
| Fit to the published Zurich brief | 15% | 7.0 | 1.05 |
| Differentiation vs funded competitors | 20% | 4.0 | 0.80 |
| Data / "real-time" credibility | 15% | 4.5 | 0.68 |
| Commercial value to Zurich | 15% | 5.5 | 0.83 |
| Trust, safety, compliance design | 10% | 9.0 | 0.90 |
| Two-day build feasibility | 10% | 9.0 | 0.90 |
| **Total** | **100%** | | **6.51** |

**Rounded: 6.5 / 10**

---

## Where the idea genuinely scores high

These are real strengths and should survive every revision.

### Problem understanding — 9.0

The document correctly identifies that the SME protection gap is a **staleness problem, not an ignorance problem**. Most SMEs have *a* policy; the policy was priced against a business that no longer exists. Framing the trigger as a business *change* rather than an annual review is the right insight and matches the published brief's phrasing about gaps compounding as businesses grow.

### Trust and safety design — 9.0

Three design decisions are better than what most competing hackathon submissions will show:

1. **Abstention as a first-class output.** "Information missing — authorised review required" is a stronger trust signal to an insurer than a confident wrong answer. Most teams will demo a chatbot that asserts coverage.
2. **Evidence with document and page citation.** Every flag traces to source text. A carrier's compliance function can audit this.
3. **Explicit SME consent before broker hand-off.** This is a genuine product decision, not a legal footnote, and it will read as maturity.

### Two-day feasibility — 9.0

Deterministic rules over a small extracted fact set, three fixed scenarios, synthetic documents, one segment. This will actually work on demo day. A team attempting universal policy parsing will not.

---

## Why it is 6.5 and not higher

Five deductions. The first two are the expensive ones.

### Deduction 1 — Differentiation is weak: this category is already funded (scored 4.0)

"AI reads commercial policies and surfaces coverage gaps" is not an open field. It is an active, capitalised segment as of 2026:

| Company | Funding / status | What they already do |
|---|---|---|
| [Qumis](https://www.brokertechventures.com/post/qumis-raises-4-3m-to-bring-attorney-grade-coverage-intelligence-to-commercial-insurance) | $4.3M seed; American Family Ventures, MTech Capital | Attorney-trained AI for coverage intelligence; identifies coverage gaps, compares endorsements across markets, secure document vault |
| [Coverwatch](https://beinsure.com/news/insurtech-coverwatch-raised-4-5-mn-pre-seed/) | $4.5M pre-seed | AI-native commercial platform: assesses business risk, identifies coverage gaps, targets premium reduction |
| [Kayna](https://fintech.global/2026/03/11/embedded-insurance-startup-kayna-raises-1-7m/) | $1.7M; WTW/Willis partnership; Guidewire Vanguards | AI policy analysis to identify coverage gaps, connecting SME software platforms to multiple insurers **and brokers** |
| [Advocate Technologies](https://www.tipranks.com/news/private-companies/advocate-technologies-launches-data-driven-benchmarks-for-commercial-insurance-pricing-and-coverage) | Launched 2026 | Replaces manual review with automated analysis in minutes; surfaces material coverage gaps and premium outliers for brokers and lenders |
| [Fulcrum](https://www.businesswire.com/news/home/20260127194044/en/Fulcrum-Raises-$25-Million-to-Bridge-the-Gap-Between-Legacy-Systems-and-AI-in-Insurance) | $25M seed + Series A, CRV | AI platform for insurance brokerages |

The uncomfortable specific: **Kayna already ships the broker hand-off**. The "connect the SME's gap report to a broker" element — the part added most recently to this idea — is the thing a funded competitor with a WTW partnership already does. It is a good instinct, but it is not novel, and an evaluator who follows insurtech funding will know that within ten seconds.

**What this costs:** the idea currently reads as a competent student implementation of a category that has real companies in it. That caps the score.

### Deduction 2 — The data story is not "real-time" (scored 4.5)

The published brief asks for a **real-time** picture of exposure. The current design gets exposure from:

- a 6–10 question form, and
- the SME pressing a button that says "I opened a new location."

That is self-declared, point-in-time data. It is not real-time, and it inherits three problems:

1. **It requires the SME to already know what changed and that it matters.** If they knew that, the protection gap would be much smaller than it is.
2. **Nobody fills the form twice.** Engagement decays after onboarding, so the "continuous pulse" premise quietly collapses into an annual questionnaire.
3. **A competitor solved this differently and better.** Kayna's approach is to sit inside the vertical software the SME *already uses every day* — restaurant, construction, field-service platforms — and read operational data to drive insurance workflows ([reported here](https://www.circuit-magazine.com/p/your-operational-platform-just-became-your-insurance-broker)). WTW's stated attraction was pulling underwriting-relevant data out of those systems automatically ([WTW on the partnership](https://www.wtwco.com/en-us/insights/2025/03/wtw-and-kayna-transforming-insurance-for-the-sme-market)).

The honest read: a form is the intake method available in two days, which is fine for a prototype, but presenting a form as the answer to "real-time" invites the strongest objection in the room.

### Deduction 3 — Zurich has already built adjacent pieces (scored into commercial value, 5.5)

This is the question the champion will ask, and the document does not currently answer it.

- **Zurich Edge Assist** launched as a unified digital platform for intermediaries across Asia Pacific, covering sales, servicing and claims ([InsurTech Digital](https://insurtechdigital.com/news/apac-brokers-reap-benefits-of-zurichs-platform-expansion)). Your broker dashboard is proposing to build, from scratch, a thin version of rails Zurich already operates in the exact region.
- **Zurich already runs an SME needs-check.** [SME-Check in Switzerland](https://www.zurich.ch/en/services/corporate-customers/sme-check) is positioned around exactly the question "what insurance does my company need?"
- **Zurich Edge Platform** is their embedded-insurance route to market ([Zurich Exchange](https://exchange.zurich.com/en/edge-platform)).

So the pitch "we will give brokers a dashboard" competes with Zurich's own investment. That is the wrong side of the table to be on. The winning position is to be the **exposure and evidence layer that feeds Edge Assist**, not a parallel broker portal.

### Deduction 4 — No answer on affordability or adverse selection

Two objections `session-1.md` already flagged as lethal are absent from the solution document:

- **Detection does not move premium.** You can perfectly diagnose an SME's cyber gap and they still will not buy, because cost and bandwidth were the barrier, not diagnosis. A gap report with no priced, low-friction next step ends as an unread PDF.
- **Adverse selection.** SMEs who act fastest on a gap alert skew towards those who already sense a loss coming. Left unaddressed, the product hands Zurich a worse book and a smart underwriter will say so.

### Deduction 5 — The output stops one step short of an action

"Share brief with broker → broker marks *In review*" is a workflow, not an outcome. Nothing in the current design shows protection actually improving. There is no endorsement top-up, no limit increase request, no micro-cover, no quantified exposure in currency, no measured resolution. The case can close as `Reviewed` with the SME no better protected.

---

## What the finalist version looks like

Six moves. The first three are the ones that change the score.

### Move 1 — Replace form-first intake with one consented data connector

Keep the form as fallback. But make the headline capability: **the SME connects a system it already uses, and exposure updates itself.**

Realistic candidates, in order of demo achievability:

| Connector | Signal it produces | Coverage question it triggers |
|---|---|---|
| E-commerce platform (Shopify/WooCommerce) | New online sales channel, order volume, card payments live, customer PII stored | Cyber, fraud, product liability |
| Accounting (Xero/QuickBooks) | Fixed-asset additions, stock value, revenue growth, new supplier concentration | Asset limits, business interruption |
| POS / delivery platform | New outlet, trading hours, delivery dependency | Location schedule, BI, liability |
| Payroll / HR | Headcount crossing a statutory or policy threshold | Employer liability, work injury |

**For the demo, one is enough.** Even a mocked read-only connector that visibly derives "asset value rose to S$150,000 on 14 March" from a ledger — rather than the user typing it — transforms the story from *questionnaire* to *monitoring*. That single change is the difference between answering the brief's "real-time" requirement and dodging it.

Say plainly in the deck which connectors are live, which are mocked. Do not imply integrations you do not have — the T&C penalises misrepresentation (Clause 12.1(j)).

### Move 2 — Quantify the gap in currency, then attach a priced action

Stop shipping "cyber protection not confirmed." Ship:

```text
Uninsured exposure identified: S$50,000

Declared stock and equipment:      S$150,000
Documented contents limit:         S$100,000
Amount above documented limit:      S$50,000

Fastest route to close:
  → Limit increase endorsement on existing policy
  → Estimated additional premium band: [X]
  → One-click: request endorsement quote via broker
```

Two reasons this matters. First, a number creates urgency that a status label never will. Second, it moves you from *diagnosis* to *conversion*, which is the only thing that answers the affordability objection. Where you cannot price, say so and route to the broker — but show that the product is built to end in a bound change, not a report.

Attach alerts to **forced-attention moments** rather than arbitrary ones: renewal date, loan drawdown, new tenancy or lease, tender or contract requiring proof of cover, headcount threshold. These are the moments an SME will actually act.

### Move 3 — Reposition from broker portal to Zurich's exposure layer

Change the one-line pitch from "shared workspace for SME and broker" to:

> **The exposure-change layer that tells Zurich and its intermediaries which SME in the book needs a protection conversation this week — and why, with the policy evidence attached.**

Then add a **portfolio view for the carrier** — the feature none of the funded competitors above is selling to insurers:

```text
Zurich SME Book — Exposure Drift, Q3

  312 SMEs added an online sales channel     → cyber not confirmed on 218
   94 SMEs raised declared assets >25%       → 61 above documented limit
   47 SMEs added a second location           → 39 not on schedule

  Highest-value review queue: 61 accounts, S$3.1M aggregate exposure above limit
  Product signal: contents limits in the retail package are systematically low
```

This is genuinely new. It reframes you from a broker tool competing with Edge Assist into intelligence that makes Zurich's existing APAC intermediary platform more valuable — a book-level view of where the carrier's own portfolio has drifted out of adequacy. It also gives Zurich a reason to pilot rather than build: you are producing a signal they do not currently have, on rails they already own.

### Move 4 — Make the engine two-sided to defuse adverse selection

For every gap flagged to the SME, emit a **risk-quality signal** to the carrier side:

- controls confirmed (MFA, backups, sprinkler, cold-chain monitoring, supplier redundancy);
- time between change and disclosure (fast disclosure = good faith);
- whether the SME acted on prior recommendations;
- prevention resources consumed.

Then state the position out loud in the pitch: *this does not just surface demand, it grades it.* An SME that discloses a change promptly and has controls in place is a better risk than the book average — and you can prove which is which. That turns your biggest underwriting objection into a selling point.

### Move 5 — Publish measured accuracy on a labelled set

Build a small labelled corpus — 20 to 40 synthetic-but-realistic policy packs with known answers — and report a real table:

| Metric | Result |
|---|---|
| Field extraction precision (limits, locations, dates) | e.g. 94% (n=40) |
| Citation precision (cited clause is the correct one) | e.g. 91% |
| False-negative rate on seeded gaps | e.g. 6% |
| Abstention rate on degraded/incomplete documents | e.g. 22% |
| Human-reviewer override rate | e.g. 11% |

Include the failure cases in the deck. Almost no hackathon team does this; every insurer respects it. State sample size and that documents are synthetic. This is the single cheapest credibility purchase available to you in two days.

### Move 6 — Name the market, the segment and a domain reviewer

- **One market:** Singapore or one APAC market where Zurich has an SME line and intermediaries on Edge Assist.
- **One segment:** small e-commerce retail, or F&B with delivery dependence. Not "SMEs."
- **One named domain reviewer:** a broker, underwriter, or SME-association contact who reviewed the taxonomy and is credited by name and role. `session-1.md` already flags this as the highest-leverage action available, and it remains unclosed.

Distinguish clearly between *adviser*, *design partner* and *customer*. Do not upgrade one into another in the deck.


---

## Re-scored after the upgrade path

| Dimension | Weight | Now | After moves 1–6 | Why it moves |
|---|---:|---:|---:|---|
| Problem understanding | 15% | 9.0 | 9.0 | Already strong. |
| Fit to the published brief | 15% | 7.0 | 9.0 | A connector answers "real-time"; a priced action answers "guide them to the right protection." |
| Differentiation | 20% | 4.0 | 7.5 | Carrier-side portfolio exposure-drift view is not what the funded cohort sells. |
| Data credibility | 15% | 4.5 | 7.5 | Derived signals from systems in daily use beat a self-declared form. |
| Commercial value to Zurich | 15% | 5.5 | 8.5 | Feeds Edge Assist instead of competing with it; produces a book-level signal Zurich lacks. |
| Trust and safety | 10% | 9.0 | 9.0 | Already the strongest element. |
| Two-day feasibility | 10% | 9.0 | 7.5 | Deliberate cost: one connector and an accuracy table consume build time. |
| **Total** | | **6.5** | **8.3** | |

**8.3 is finalist territory.** It is not automatically a winner — winners in recent editions were operating companies with customers — but 8.3 clears the bar where a panel argues *for* a student team on technical and commercial merit rather than filing it as a promising prototype.

---

## Revised two-day build, given the above

The upgrade path costs build time. Something has to be cut. Priority order:

### Build (non-negotiable)

1. **One derived-signal connector.** Mocked read-only ledger or store feed → derives asset value / new channel / new location *without the user typing it*. Show the derivation on screen.
2. **Three evidence-backed mismatches** with document + page citation, as already designed.
3. **Currency quantification** on at least one item (declared value − documented limit = exposure).
4. **One abstention case** on a degraded document.
5. **Consent-gated hand-off** to the broker view.
6. **Broker case view** with one action that changes state, and one "request endorsement quote" action that demonstrates the route to a bound outcome.
7. **Accuracy table** on your labelled synthetic set — even n=20 is worth having.

### Build only if ahead of schedule

8. Carrier portfolio exposure-drift view. *Even a static, clearly-labelled mock of this screen is worth more in the deck than three more working SME features.* Consider building it as a designed slide rather than live code.
9. Risk-quality signal displayed alongside each gap.
10. Renewal / forced-attention trigger timeline.

### Cut

- multiple connectors;
- real OAuth to any third party;
- real email delivery;
- broker directory or matching;
- login and role management (use a `View as SME | View as Broker` toggle and say it is a demo environment);
- OCR for scans unless it already works reliably;
- graph or vector databases unless already stable and genuinely load-bearing;
- any premium calculation you cannot defend.

---

## Objections to rehearse, with the answers the upgrades give you

| Objection | Answer after upgrades |
|---|---|
| "Qumis and Coverwatch already do coverage-gap AI." | They analyse documents for insurance professionals. We detect the *business change* that makes a document stale, and we report drift at book level to the carrier. Different trigger, different buyer. |
| "Kayna already connects SME gaps to brokers." | Agreed, via vertical SaaS distribution. We are not competing for that distribution; we produce the exposure-drift signal into a carrier's existing intermediary platform. |
| "Zurich has Edge Assist and SME-Check already." | Correct, and that is why we integrate rather than rebuild. Edge Assist moves the transaction; SME-Check answers a first-purchase question. Neither tells you which existing SME drifted out of adequacy last month. |
| "Your data is self-declared and thin." | Primary intake is derived from systems the SME already operates. The form is fallback, and every field carries provenance and timestamp. |
| "Detection does not sell insurance." | Each flag carries a quantified exposure and a one-click route to an endorsement or limit change at a forced-attention moment. We measure bind, not opens. |
| "You will select adversely against us." | The engine is two-sided. Every flag ships with a risk-quality signal: controls confirmed, disclosure latency, prior remediation. |
| "Is this financial advice?" | No. The system presents policy facts with citations and abstains on ambiguity. Suitability and recommendation stay with the licensed intermediary, with a logged sign-off. |
| "How accurate is it really?" | Here is the table, the sample size, and the failure cases. |

---

## Honest limits of this score

- The score is judged against the **published problem statement wording only**. The governing T&C in this workspace does not publish evaluation criteria or weights; the panel decides at its sole discretion (Clause 8.4). These weights are my reconstruction of what a corporate champion optimises for, not official criteria.
- Competitor positioning is drawn from public funding and partnership announcements, which describe intent and marketing claims rather than verified shipped capability.
- Scores assume synthetic demo data, no live pilot, and no named domain reviewer. Securing a reviewer or a design partner would move commercial value further than any additional feature.
- The eligibility bar in the T&C references a **market-ready solution** (Clause 4.1) and demonstrable track record of building scalable solutions (Clause 5.1). A two-day prototype is defensible only if presented honestly as a prototype. Do not close the credibility gap with overstatement — Clause 12.1(j) makes that a disqualification risk.
- The anti-duplication provision (Clause 12.1(o)(iii)) still applies. The connector layer, exposure-drift model, insurance taxonomy and carrier portfolio view are all new work, which helps; do not present the prior RegTech competition entry as this submission.

---

## One-line summary for the team

> The idea is sound and safely designed, but it currently competes with four funded startups on document analysis and with Zurich's own Edge Assist on broker workflow. Move the centre of gravity from *reading policies* to *detecting exposure drift from systems SMEs already use*, quantify the gap in dollars, and sell the book-level drift view to the carrier. That is the version worth flying to Singapore with.

---

## Sources

Competitor and market positioning: [Qumis seed round](https://www.brokertechventures.com/post/qumis-raises-4-3m-to-bring-attorney-grade-coverage-intelligence-to-commercial-insurance), [Coverwatch pre-seed](https://beinsure.com/news/insurtech-coverwatch-raised-4-5-mn-pre-seed/), [Kayna funding](https://fintech.global/2026/03/11/embedded-insurance-startup-kayna-raises-1-7m/), [Kayna and Willis on subcontractor gaps](https://fintech.global/2026/07/15/kayna-and-willis-target-subcontractor-insurance-gaps/), [WTW on the Kayna partnership](https://www.wtwco.com/en-us/insights/2025/03/wtw-and-kayna-transforming-insurance-for-the-sme-market), [operational-platform-as-broker analysis](https://www.circuit-magazine.com/p/your-operational-platform-just-became-your-insurance-broker), [Advocate Technologies launch](https://www.tipranks.com/news/private-companies/advocate-technologies-launches-data-driven-benchmarks-for-commercial-insurance-pricing-and-coverage), [Fulcrum funding](https://www.businesswire.com/news/home/20260127194044/en/Fulcrum-Raises-$25-Million-to-Bridge-the-Gap-Between-Legacy-Systems-and-AI-in-Insurance).

Zurich existing capability: [Zurich Edge Assist in Asia Pacific](https://insurtechdigital.com/news/apac-brokers-reap-benefits-of-zurichs-platform-expansion), [Zurich Edge Platform](https://exchange.zurich.com/en/edge-platform), [Zurich SME-Check](https://www.zurich.ch/en/services/corporate-customers/sme-check), [Zurich UK SME eTrade](https://www.zurich.co.uk/business/our-expertise/sme).

Problem statement: [Global FinTech Hackcelerator 2026](https://www.fintechfestival.sg/global-fintech-hackcelerator). Programme rules: `2026 Hackcelerate TnC (2025 05 25).pdf` in this workspace.

Content from external sources was rephrased for compliance with licensing restrictions.
