# Merged spec v1 — Protection Pulse, powered by the Adequacy engine

**PS 03 — Zurich Insurance, "Closing the SME Protection Gap"**
**Date:** 11 August 2026
**Merges:** `session-2.md` (Adequacy: bounded-omission engine, settlement arithmetic, compulsion triggers, evidence plan, regulatory posture) with `chithsukhi-protection-pulse-solution-idea.md` (Protection Pulse: change-event capture, Coverage Review Brief, consent gate, broker workspace, case lifecycle, scope discipline).
**Supporting research:** `sff-2026-zurich-ps03-competitive-map.md`, `sff-2026-zurich-regulatory-singapore.md`.
**Status:** draft for team review. Open decisions in §16.

---

## 0. Naming

**Protection Pulse** is the product. **Adequacy** is the engine inside it.

This is not diplomacy, it is the architecture. Protection Pulse is what the SME and the broker see: a shared workspace, change events, review items, a case that moves through statuses. Adequacy is what an underwriter, a compliance officer or a judge is shown when they ask how it works: a deterministic clause-accounting and settlement-arithmetic engine with published error rates. Two audiences, two registers, one system. The SME never needs to hear the word "average clause." The Zurich technical panel needs to hear nothing else.

---

## 1. The product in one paragraph

Protection Pulse is a shared workspace for an SME and its authorised insurance intermediary. The SME records what changed in its business — or the calendar surfaces a statutory or contractual deadline that is about to bite — and Protection Pulse reads the SME's own policy pack to compute what its documents would actually pay against that changed reality. Every finding carries the exact clause, page and character offset behind it. Every finding the engine could *not* account for is counted and shown. Nothing is asserted without document evidence, and nothing is recommended: the SME reviews the findings in plain language, consents to share a structured **Coverage Review Brief** with its broker or an authorised adviser, and the same pass emits a machine-readable insurability record for the carrier. Zurich's problem statement says gaps go unnoticed until a claim is denied. Protection Pulse rehearses the denial while it is still fixable, and then hands the case to the human who can fix it.

---

## 2. What each source contributed, and why the merge is stronger

Both drafts independently arrived at the same core: read the SME's own documents, compare against declared business reality, cite document and page, put schedule and endorsement above base wording, refuse to assert without evidence, keep the decision with a licensed human, and use deterministic rules rather than trusting model output. Two people reached that separately. Say so in the deck — convergence is evidence the core is right.

| Contribution | From | Why it matters |
|---|---|---|
| Change-event capture as the primary trigger | Protection Pulse | Answers "throughout their business journey," which the Adequacy draft admitted it did not |
| Coverage Review Brief as a shareable artefact | Protection Pulse | Converts detection into action — the hole in the Adequacy draft |
| Broker workspace and case lifecycle | Protection Pulse | Makes the business model a screen rather than an argument |
| Explicit consent gate before any sharing | Protection Pulse | Slots exactly into the PDPA data-intermediary architecture as the controller's affirmative act |
| "What we will not build" discipline | Protection Pulse | Named scope is a credibility move; better articulated than the Adequacy draft |
| Named persona and human narrative | Protection Pulse | A jury remembers a business, not a peril |
| Template fallback when model output is unstable | Protection Pulse | Demo-risk discipline |
| Clause-accounting completeness (bounded omission) | Adequacy | The only falsifiable guarantee either draft had; answers the false-negative problem |
| Settlement arithmetic — what the claim actually pays | Adequacy | Quantified impact is what moves purchase; qualitative flags do not |
| Deterministic precedence and arithmetic outside the model | Adequacy | Answers COMPACT (34–57% on cross-clause reasoning) and the hierarchy-obedience findings |
| Statutory compulsion triggers, WICA flagship | Adequacy | Voluntary information provision moves ~5pp; a $10,000 penalty with a deadline moves more |
| Competitive positioning against Program IQ, Qumis, Newfront, Coverwatch, Chisel AI | Adequacy | Protection Pulse as written takes "this already exists" with no answer available |
| Evidence plan, preregistration, published metrics | Adequacy | The win condition; no 2025 finalist published a measured error rate |
| Regulatory perimeter, PDPA, MAS third-party AI, TPRM | Adequacy | Procurement-ready, which is what turns a win into a pilot |

Deliberately **not** carried over from Protection Pulse: qualitative-only outputs, and a bare "confidence level" field. Both are replaced by the settlement arithmetic and the completeness figure plus abstention gate. Confidence that is self-reported by a model is exactly what the 2026 data-protection benchmark work found offers no protection.

---

## 3. The trigger model

One model, two sources. This is the merge's most useful structural idea: the SME tells us what changed, and the calendar tells us what is about to be asked of them.

### 3.1 Internal change events (SME-reported)

Presented as buttons, not a form. Selecting one opens only the questions that matter to it.

```
+ Started selling online / taking online payments
+ Opened or leased a new location
+ Bought costly equipment or machinery
+ Added a key supplier or a key customer
+ Hired staff / headcount change
+ Moved from a packaged policy to bespoke cover
+ Started handling customer or employee data
+ Won a contract with a larger company
```

The last two rows are additions to Chithsukhi's original list, and both are deliberate. "Won a contract with a larger company" is the certificate-of-insurance trigger, which is one of the strongest forcing events in Singapore commercial practice. "Moved from a packaged policy to bespoke cover" is there because Sedgwick documents that firms making that move frequently end up with a 12-month maximum indemnity period where the packaged product carried 24 or 36 — a *reduction* in cover caused by growth, invisible on a schedule, and the literal instantiation of Zurich's own phrase about gaps quietly compounding as the business grows.

### 3.2 External compulsion events (calendar and statute)

These fire without the SME doing anything, which is the point. Ranked by strength of compulsion.

| Trigger | Basis | Forcing event |
|---|---|---|
| Work injury compensation renewal | WICA 2019 s.24 — compulsory for all employees doing manual work at any salary, and all non-manual employees earning $2,600 or less per month | MOM instructs employers to provide required information to the insurer **at least 21 days before policy commencement**. Annual, dated |
| WICA limit uplift | Limits rose **1 November 2025**: medical cap $45,000 → **$53,000**; permanent incapacity $97,000–$289,000 → **$116,000–$346,000**; death $76,000–$225,000 → **$91,000–$269,000** | Any policy last priced before that date is a live adequacy question |
| Migrant worker medical insurance | Minimum **$60,000 per year per Work Permit holder**, and where the plan carries sub-limits **each sub-limit must meet the minimum**. Cost cannot be passed to the worker | Work Permit issue or renewal; insurer or policy change |
| Migrant worker Stage 2 changes | From **1 July 2025**: standardised allowable exclusions, age-differentiated premiums across two bands (50 and below, above 50), direct insurer-to-hospital payment | Policy start, renewal or extension on or after that date |
| Work pass maximum age raised to 63 | From **1 July 2025** | Interacts directly with the age-banded premium bands above. A firm that took on older Work Permit holders after that date has a live question on two fronts |
| Certificate of insurance under contract | Customer, principal or tender conditions of contract. There is **no** government-wide GeBIZ insurance rule — requirements sit in each tender's conditions | Tender close, contract award, annual COI refresh |
| Lease renewal and reinstatement | Landlord covenants; JTC runs a joint site inspection about **six months before lease expiry** | Lease signing, renewal, pre-expiry inspection |
| Security bond for migrant workers | **$5,000 per non-Malaysian Work Permit holder**, as a banker's or insurer's guarantee, beneficiary MOM | Must be in effect before the worker arrives; MOM will not backdate |
| SSIC 2025 activity code remap | ACRA and SingStat replaced SSIC 2020 with SSIC 2025 on **9 May 2026**, flowing through Bizfile, Myinfo Business and Entity Data Hub | Codes merged, split and renumbered. Also the zero-input onboarding path: an SME's activity code is machine-retrievable from official infrastructure |

Precision note for the deck, because an underwriter will test it: the WICA permanent-incapacity maximum applies only at 100% permanent incapacity and is otherwise prorated; the stated figures exclude the additional 25% paid for total PI; and the calculation is average monthly earnings × age multiplying factor × %PI, with the minimum and maximum acting as a collar rather than as the formula.

Rows marked in the research dossier as unverified — whether insurance is a condition of BCA CRS registration, or of security agency, travel agent, childcare or F&B licences — are **out of this spec** until someone reads the source. Do not put them on a slide.

---

## 4. Architecture

Four layers. Layers 1–3 are the Adequacy engine. Layer 4 is Protection Pulse.

```
                    ┌─────────────────────────────────────────┐
  policy pack ─────▶│ L1  LOCATE           (model)            │
  non-insurance     │     spans typed and anchored to         │
  documents ───────▶│     (doc id, page, char offset)         │
                    ├─────────────────────────────────────────┤
                    │ L2  ACCOUNT          (model + rules)    │
                    │     exhaustive partition into taxonomy  │
                    │     + UNACCOUNTED bucket, counted       │
                    ├─────────────────────────────────────────┤
  change events ───▶│ L3  RESOLVE & COMPUTE   (code only)     │
  compulsion ──────▶│     precedence resolution               │
  calendar          │     settlement arithmetic               │
                    │     abstention gate                     │
                    ├─────────────────────────────────────────┤
                    │ L4  REVIEW & ROUTE      (product)       │
                    │     review items → Brief → consent →    │
                    │     broker workspace → case lifecycle   │
                    └──────────────┬────────────┬─────────────┘
                                   │            │
                          SME workspace   insurability record
                                          (carrier / intermediary)
```

### Layer 1 — Locate

The model's only job is to find and type spans. It never concludes anything.

Every span carries `(document_id, page, char_start, char_end, span_type)`. Original extracted text is immutable. OCR corrections live in a **parallel layer**, never overwriting the source, so a correction can never break citation fidelity. On poor scans, carry multiple OCR hypotheses into extraction rather than committing to one transcription.

Documents in scope: base wording, schedule or declarations, endorsements, proposal form, and the non-insurance documents the SME already holds — CPF or payroll submission, work pass list, lease insurance covenant, customer or tender COI requirement.

That last category is the quiet innovation. Almost every competitor reads only insurance documents. The compulsion checks are only possible because we read the *other* documents too, and those are documents the SME can produce in minutes without asking a carrier for anything.

### Layer 2 — Account

Every operative provision detected in the bundle is classified into a taxonomy slot, or lands in the **unaccounted** bucket where it is quoted, counted and shown.

Taxonomy is anchored to things that already exist rather than invented: ACORD 125/126/140 section structure for the programme shape, the LMA clause library for exclusion vocabulary, SSIC 2025 for activity-to-exposure mapping, the RICS reinstatement cost assessment standard for valuation basis, and the WICA statutory schedule for the work injury limb.

**The output alongside every report:** *N operative provisions detected, M classified, K unaccounted — here they are.*

### Layer 3 — Resolve and compute. Deterministic. No model.

**Precedence resolution.** Endorsement over schedule over base wording over proposal; within a level, specific over general; ambiguity construed against the drafter. The resolver emits its resolution path as evidence. Two caveats to state on stage rather than be caught on: precedence is ultimately a contract-interpretation question under the governing law, and many commercial wordings state their own precedence order expressly — so the engine reads the policy's construction clause first and reports when it cannot establish precedence, rather than assuming a universal rule.

**Settlement arithmetic.** All of it in code:

- average clause — `payout = loss × (sum insured ÷ value at risk)`, applied to partial losses as well as total, with the policy's own tolerance threshold read from the wording rather than assumed
- sub-limit caps, including erosion inside a main limit
- maximum indemnity period truncation
- deductible and excess application
- aggregate versus any-one-claim limit tracking
- claims-made retroactive date and prior-acts gap on insurer switch
- condition precedent and warranty status, reported as *unverified* rather than as breached — the engine can locate the term but cannot know whether the alarm was set

**Abstention gate.** A risk–coverage curve, with an independent verifier re-checking each cited span. Not built on token-level entropy, which the 2026 selective-prediction work found insufficient for safe abstention in high-stakes settings.

Why Layer 3 contains no model, stated for the panel: COMPACT (EACL 2026) measured frontier models at 34–57% base accuracy on cross-clause reasoning over real contracts involving exception hierarchies; arXiv:2510.01228 found conflict-detection signals present internally while consistent resolution did not follow. Telling a model "endorsement beats schedule" is not a mechanism. Precedence and money are code.

### Layer 4 — Review and route

§5 through §7.

---

## 5. Output discipline

This is the spec's safety contract and it should be reproduced verbatim in the written proposal.

**Four permitted output states per review item.**

| State | Meaning | Example |
|---|---|---|
| **Documented** | An affirmative provision was located and quoted | "Contents limit S$100,000 — Schedule, p.2, line 14" |
| **Not confirmed in reviewed documents** | The bundle was searched and no affirmative provision was found | "Cyber cover is not confirmed in the reviewed documents. Searched: base wording, schedule, endorsements 1–3" |
| **Information missing** | A document needed to reach a finding is absent, unreadable or ambiguous | "The endorsement page 2 scan is illegible. Upload a clearer copy or request the wording from your insurer" |
| **Requires authorised review** | A finding exists but its effect is a judgement a licensed human must make | "A condition precedent relating to alarm setting was located. Whether it was satisfied is a factual matter for your adviser" |

**Three things the engine never does.** It never asserts that cover exists. It never asserts that a claim will or will not be paid. It never recommends a product, a carrier or a premium.

**"Not confirmed" is not "not covered."** The distinction is doing real work. Absence of evidence in a bundle we were given is a defensible statement about a document. "You are not covered" is a legal conclusion, and *FCA v Arch* [2021] UKSC 1 — where the Supreme Court construed 21 wordings individually and read trends clauses consistently with rather than in limitation of the insuring clause — is the reason a quoted exclusion is not the same thing as a correct statement of its legal effect. The engine states what the document says. The interpretation is attributed to the human who signs.

**And the honest part, said out loud.** Citation grounding constrains false positives. It does nothing for false negatives, because when the engine finds nothing there is no citation to check. ContractEval (arXiv:2508.03080) measured models reporting no relevant clause when one was present. That is why the completeness figure and the exclusion false-negative rate are headline outputs and not appendix material. We do not claim to be right. We claim to tell you exactly how much of your document we could not account for.

---

## 6. The Coverage Review Brief

The artefact. Short, structured, shareable, built for a human adviser rather than as autonomous advice.

Per item:

```
TRIGGER          Change event or compulsion deadline that raised this
FINDING          One sentence, plain language, no legal wording
STATE            Documented | Not confirmed | Information missing | Requires authorised review
EVIDENCE         Document, page, verbatim quote, char offsets
                 (+ resolution path where precedence was applied)
ARITHMETIC       Where money is computable: believed vs document-implied,
                 with each input traced to its provision
MISSING          What the adviser needs that we do not have
NEXT ACTION      What a licensed human could do about it
```

Per brief, a header the engine always fills:

```
ACCOUNTING       N provisions detected · M classified · K unaccounted
UNACCOUNTED      The K provisions, quoted, for the adviser to read
SEARCHED         Which documents, which sections, which perils
NOT SEARCHED     What was out of scope and why
```

Lead the brief with what we could not explain. It inverts the room's expectation of an AI output and it is the single cheapest way to establish that the rest of the document is honest.

---

## 7. Broker workspace, consent, and the case lifecycle

### 7.1 Consent gate

No brief moves without an affirmative act. Chithsukhi's wording, kept close to original:

> "I authorise Protection Pulse to share this Coverage Review Brief and the selected policy evidence with my chosen authorised adviser for review."

Granular by document, not all-or-nothing. The SME can withhold a document and the brief will say so.

This is also the PDPA mechanism, not just UX. See §9.

### 7.2 Two paths

- **I already have a broker or adviser** — select or invite them, then share.
- **I need an authorised review** — submit into an approved adviser workflow.

The second path only exists where a verified adviser directory exists. Until then it is a waitlist, not a match. Do not claim matching we cannot perform.

### 7.3 Case lifecycle

`Draft → Shared → Information requested → Under review → Resolved` and `Not applicable`.

An adviser question routes back into the SME workspace: *"Please confirm estimated annual online sales and whether you hold a separate cyber policy."* The SME answers in the same case. No email, no re-attaching.

### 7.4 Audit trail as a product surface

Who viewed, who shared, what was flagged, why, what evidence supported it, what the adviser concluded, when it resolved. This is not an engineering detail. It is the intermediary's errors-and-omissions defence, and it is the governance artefact a carrier's compliance function will ask for. Make it visible and exportable.

---

## 8. Target segment, persona and demo

### 8.1 Segment

**Light food manufacturing and food production SMEs on leased industrial premises, Singapore.**

Chithsukhi's draft proposed small e-commerce retailers. Changed deliberately: e-commerce retail is the segment every insurtech targets and it carries almost no compulsion hooks. A small food manufacturer stacks eight triggers on one business — manual workers so WICA bites, likely migrant workers so the $60,000 medical minimum and the $5,000 bond bite, leased industrial premises so landlord covenants and reinstatement bite, machinery so breakdown and BI dependency bite, stock so the average clause bites, online orders so cyber bites, and supermarket or hotel supply contracts so certificate-of-insurance requirements bite. Same demo simplicity, far stronger forcing story, and it matches what Zurich APAC's SME mandate means by micro-SMEs and trades.

Statistical backing: 94.7% of Singapore's SMEs employ fewer than 25 people, which means no risk manager and nobody whose job is reading policy wording.

### 8.2 Persona

**Hock Lee Foods Pte Ltd** — small food manufacturer, Tai Seng, 14 staff of whom 9 do manual work and 4 hold Work Permits, leased industrial unit, supplies two supermarket chains and a hotel group. Over the past year: bought a blast freezer, took on a second unit, started taking online orders, hired three people.

Its policy was priced when it had one unit, eight staff, no online channel and no blast freezer.

### 8.3 Demo run sheet — four minutes

| Beat | Time | What the room sees |
|---|---|---|
| 1. The change | 0:00 | Hock Lee taps four change events. No form. |
| 2. The accounting | 0:30 | Policy pack ingested. **"214 provisions detected · 209 classified · 5 unaccounted."** The five are quoted on screen. Lead with what we cannot explain. |
| 3. The compulsion finding | 1:00 | WIC schedule declares 11 employees. CPF submission shows 14. Two of the three undeclared do manual work. MOM's own warning quoted; $10,000 and 12 months stated; renewal date and the 21-day deadline stated. Checkable, statutory, and it lands with a Singapore jury. |
| 4. The money finding | 1:45 | Blast freezer and stock at S$150,000 against a S$100,000 documented contents limit. Then the part nobody else shows: a S$60,000 partial loss pays roughly **S$40,000**, because the average clause applies proportionally to partial losses too. Business interruption truncated at month 12 against a 14-week freezer replacement lead time plus revenue recovery. Every number links to its provision. |
| 5. The safe behaviour | 2:30 | An illegible endorsement page produces **"Information missing — authorised review required."** Show the system declining to answer. |
| 6. Consent and hand-off | 2:50 | Explicit consent. Brief shared. Switch to broker view: prepared case, not an email with four attachments. Broker requests one fact, sets status. |
| 7. The carrier screen | 3:30 | Same pass, same documents: declared versus derived exposure, adequacy ratio per section, control evidence located, unaccounted provisions flagged. This is the insurability half of Zurich's sentence. |

Beat 4 is the beat that wins the technical panel. Beat 3 is the beat that wins the Singapore panel. Beat 6 is the beat that wins the investors. Do not cut any of the three.

**Cold-company test.** The judges will name a business and ask us to run it live. Beat 3 is the one to run, because MOM's ground truth is public and the arithmetic is deterministic.

### 8.4 Demo documents

MVP uses clearly labelled synthetic documents built from publicly available wordings, plus any real bundle for which we hold written permission. Never a real client bundle on stage. Never a real employee name on screen.

---

## 9. Regulatory posture and PDPA architecture

### 9.1 Licensing — a strength, stated precisely

A tool that reads an SME's own general insurance documents and states findings sits outside the Financial Advisers Act, because the FAA regulates advice on investment products and general insurance is not one. It sits outside the Insurance Act intermediary regime provided it does not arrange or solicit. Brokers acting for policyholders register with MAS under the Insurance Act; general insurance agents acting for insurers register with the General Insurance Association of Singapore. **No sandbox is required — there is no licensing requirement to be relieved of.**

Two design rules hold that position: findings never recommendations, and never touch premium, application or commission. Note also that MAS's Financial Advisory Guidelines were framed with online and software tools explicitly in view, so "we are only a tool" is not a defence on its own.

**Get one thing in writing from counsel:** the FAA statutory definition of "investment product." It is the load-bearing assumption of the whole position.

### 9.2 PDPA — the actual binding constraint

A WIC schedule carries employee names and occupations. A work pass list carries identifiers. A proposal form carries director details. The moment we accept a bundle we are processing personal data of people who are not our customer and have not spoken to us.

Four architectural decisions, all made now:

1. **Redact at ingestion.** If a WICA adequacy check needs headcount, occupational class and wage roll, strip names before anything reaches the model. Do not make full disclosure a condition of a diagnostic that does not need it.
2. **Contract as a data intermediary in writing.** Under the PDPA a data intermediary processing under a written contract is exempt from Parts III–VI except the protection and retention obligations; consent, notification and purpose limitation stay with the controller who already holds the customer relationship. Architect for this deliberately.
3. **We do not train on customer documents.** This is what preserves (2), and it is a headline rather than a footnote. Singapore SME AI-privacy concern went from 10% to 66% in a single year, and security-breach anxiety from 15% to 51%. We are asking exactly those firms to upload exactly those documents.
4. **Singapore data residency**, and a named Data Protection Officer, which is required under PDPA s.11(3) and costs nothing including pre-revenue.

### 9.3 Speak to the current MAS material, not the obvious one

Most teams will cite the December 2024 AI Model Risk Management information paper. The current word is the **MAS AI Risk Management Operationalisation Handbook, 20 March 2026** — Project MindForge phase two, built with 24 banks and insurers, covering traditional, generative and agentic AI — and the **MAS Information Paper on AI agent governance, 3 July 2026**.

### 9.4 Arrive procurement-ready

- **A one-page sub-processor register, handed over unprompted.** MAS consulted from 11 March to 20 April 2026 on Third-Party Risk Management Guidelines that will supersede both Outsourcing Guidelines, extend to all third-party arrangements, and require registers submitted to MAS at least semi-annually including material sub-contractors. A Zurich pilot becomes a registrable arrangement, and our LLM provider, cloud region and OCR vendor become Zurich's regulatory disclosure.
- **Run the IMDA GenAI Starter Kit's five risk tests** — hallucination and inaccuracy, bias, undesirable content, data leakage, adversarial prompt vulnerability — and publish the results. Free, Singaporean, voluntary, and precisely the compensatory testing MAS expects of third-party AI.
- **Adopt the digital advisory safeguards voluntarily and say so.** Documented algorithm rationale, pre-deployment validation, drift monitoring, human review of edge cases, per-customer audit trail, documented escalation when the tool cannot conclude. Meeting a standard we are not caught by is a strong signal from a pre-incorporation team.

One slide: *"How we meet MAS's third-party AI expectations on day one."* It answers the question that otherwise kills a pilot six months after winning.

---

## 10. Evidence plan

The win condition. No 2025 finalist published a measured error rate. And Zurich itself published what made the Sixfold pilot work: start with a use case where the human already knows the answer so errors get caught; build an accuracy harness that reports back to Zurich; name the governance framework; publish a hard number. Mirror all four.

**Test set.** 60–100 bundles, each with base wording, schedule and at least one endorsement, across at least four lines: property, business interruption, public and employers' liability / work injury, cyber. Stratified along the axes that break systems — native PDF versus scanned versus photographed; with and without a conflicting endorsement; with and without an exclusion write-back.

**Provenance, declarable under clause 9.6.** LMA model wordings via the Lloyd's Wordings Repository are the defensible route to real market wordings — the LMA states its model wordings are illustrative, that use is not restricted to members, and that it does not protect its IP rights over them. Add insurers' publicly published Singapore SME wordings and IPIDs. ContractNLI and CUAD are CC BY 4.0 and give a proxy task shape. RISCBAC is a pipeline smoke test, not an evaluation set. **InsuranceQA is research-use-only and unsuitable for a competition entry. LegalBench is per-task licensed and cannot be declared under one label.** Real client bundles stay in a private holdout.

**Annotation.** Two independent annotators per bundle with a documented adjudication step; report inter-annotator agreement. Ground truth per (bundle, peril) is Covered / Excluded / Not addressed, plus character-offset evidence spans, page numbers, and the governing document in the authority hierarchy.

**Metrics, headline first.**

1. **Clause accounting completeness** — provisions detected, classified, unaccounted.
2. **Exclusion false-negative rate** — where an applicable exclusion existed and we surfaced nothing. Headline, not appendix.
3. **Authority-resolution accuracy**, reporting conflict *detection* and conflict *resolution* separately.
4. **Verbatim fidelity** — exact-match at cited offsets plus page accuracy. This is what makes the no-paraphrase promise falsifiable, and it cannot be substituted with OCR character error rate: arXiv:2605.00911 found high OCR accuracy failing to produce good downstream retrieval because structural errors bite at low CER.
5. **Citation precision and recall** (ALCE definitions), reported separately from correctness.
6. **Risk–coverage curve**, plus abstention rate and abstention *correctness*. An abstention that hides a real exclusion is a failure, not a safe default.
7. **AUPR and precision at 80% recall**, so the operating point is visible.

**Ablations.** OCR degradation curve; native versus scanned versus photographed on matched documents; retrieval versus long-context versus none, because the Quebec insurance benchmark found RAG lifting weak models by 35+ points while causing catastrophic regressions in others; and position sensitivity, since the operative exclusion is usually mid-document.

**Error typology**, because different buckets need different fixes: fabricated quote, misgrounded quote, misattributed quote, wrong authority, missed exclusion, unnecessary abstention.

**Human adjudication** on at least 200 assertions with two raters, reporting agreement with the automatic scorer.

**Preregister, and publish the labels.** Then report our measured rate against Stanford's 17–33% finding for purpose-built legal AI research tools. Knowing the failure literature is what an underwriter is assessing when they assess a vendor.

**Also measure the sign-off loop.** How often the adviser overrode the engine, and in which direction. An adviser who never overrides is evidence the control is not working.

---

## 11. Who pays

Not the SME. Three independent lines of evidence converge, and converging evidence is more persuasive than any one of them:

- **The perimeter is safest** when the tool states findings and a registered intermediary recommends.
- **The market buys that way.** 65% of Singapore SMEs prefer buying offline; agent share is rising (27% → 29%) while aggregator share is falling (16% → 13%); reliance on intermediaries increased at every touchpoint in the buying journey **except when asking questions** — which is precisely the gap a self-serve diagnostic fills without displacing anyone.
- **Zurich Singapore distributes through brokers** and created a dedicated broker-focused leadership role in 2025.

**The economics.** ReSource Pro documented in January 2026 that under staffing pressure agencies have not merely deprioritised small-commercial policy reviews, some have eliminated them outright; that roughly 80% of accounts produce about 20% of revenue; and that skipping policy checking transfers risk onto the agency as aggregate E&O exposure. MarshBerry publishes recurring guidance on minimum account thresholds below which producers should decline business. **The task we are automating is the task the industry stopped performing** — and it points at an E&O budget that already exists rather than a new line item.

**Two-sided by mechanism, not by slide.** The diagnosis is only produced in exchange for the record. An SME cannot obtain the settlement simulation without generating the insurability record that reaches the carrier or intermediary — same documents, same pass, same evidence, same moment. Adverse selection is priced rather than absorbed, because the carrier sees what the SME just saw. That is the only kind of answer that survives an underwriter.

**Be unambiguous with the panel.** Three of the nine judges on the 2025 Demo Day panel were venture investors. Protection Pulse is a Zurich distribution and risk-quality asset first, a standalone company second. Saying so beats being caught being vague.

---

## 12. Scope boundaries — what we will not build or claim

Carried from Protection Pulse and extended. Reproduce in the written proposal; naming what you will not do is a credibility move.

We will **not**:

- replace a broker, licensed adviser or underwriter;
- give definitive insurance advice, or state whether a claim will be paid;
- recommend a product or carrier, rank carriers, or calculate a premium;
- connect to live insurer systems, bank accounts, accounting platforms or government registries in the MVP;
- match SMEs to brokers without a verified adviser directory;
- perform **cross-carrier wording comparison** — that needs a wordings corpus we have no right to hold, and we say so unprompted;
- analyse every line, jurisdiction or document format;
- claim hallucination has been eliminated;
- train models on customer documents;
- assert that a condition precedent or warranty has been breached, only that one exists and is unverified.

**Demo-risk rule, from Chithsukhi's draft and worth keeping:** the model may classify, extract and phrase. If model output is unstable, fall back to a well-written template. Nothing consequential depends on generation.

---

## 13. Build plan

### 13.1 MVP cut — what must exist

```
React front end
   ├── SME workspace: change events, dashboard, evidence drawer, consent gate
   └── Adviser workspace: case list, evidence, status, information request
        ↓
FastAPI / Python
   ├── L1 ingestion + span anchoring (immutable source, parallel OCR layer)
   ├── L2 clause accounting + unaccounted bucket
   ├── L3 precedence resolver + settlement arithmetic + abstention  ← pure code
   └── L4 brief assembly, consent, case state machine, audit log
        ↓
SQLite (case, evidence, span, audit) + document store
```

Order of build, because the demo depends on it: L3 arithmetic first with hand-built evidence, then L2 accounting, then L1 ingestion, then L4. The arithmetic is the demo. Building ingestion first is the classic way to arrive at Demo Day with a parser and no product.

### 13.2 Roles

Merged from both drafts. Chithsukhi's allocation and the session-2 allocation agreed on Preran; the rest is reconciled.

| Owner | Scope |
|---|---|
| **Preran** | L3 — precedence resolver, settlement arithmetic, abstention gate. Architecture. Presents the technical case |
| **Shamanth** | Evidence plan end to end — test set, metrics harness, ablations, risk–coverage curve. Plus the exposure question set and impact calculations |
| **Shreya** | L1 and L2 — ingestion, span anchoring, clause accounting, unaccounted bucket, test data validation. Plus the PDPA architecture: redaction at ingestion, DI agreement, sub-processor register |
| **Shashank** | L4 front end — SME and adviser workspaces, evidence drawer, consent flow, case lifecycle UI. Demo video |
| **Chithsukhi** | Product workflow and user journey, the Coverage Review Brief format, consent language, output-state discipline, feature prioritisation, pitch narrative |

The fifth role is not a spare. Nobody in the session-2 allocation owned the journey, the narrative or the output-state discipline, and those are the three things that make the difference between an engine and a product. On the evidence of her document she can do that job. **The roster freezes at registration.**

### 13.3 The binding constraint, stated plainly

Not code. **Labelling.** The engine is buildable in the time available. A correctly labelled test set — governing provision identified, average clause applied on the right basis, warranty distinguished from condition precedent — needs someone who can do insurance. Nobody on the team can yet. Recruiting a domain reviewer, even as a named advisor on the roster, remains the highest-leverage action available.

---

## 14. Red team

Ordered by lethality. The top two go on the page rather than waiting to be asked.

**1. "Zurich already built this — Program IQ."** Open with it. Program IQ launched December 2025, scans sublimits across local and master policies and flags mismatches; Zurich's own rationale is that those differences open coverage gaps. It is internal-facing, built for Zurich underwriters, large-account only, single-peril today, and works on master/local structures on Zurich's own paper. None of that describes a Singapore food manufacturer with three policies from three carriers and no master programme. *Zurich proved the mechanic works for 7,500 multinational customers. We are asking what that capability looks like for the 369,500 Singapore SMEs with no master programme, no risk manager and no underwriter reading their file.* Acknowledging the incumbent tool converts the panel's strongest objection into the strongest framing available.

**2. "Qumis, Newfront and Coverwatch already ship citation-grounded gap analysis."** Correct, and we name them. Qumis launched attorney-certified agents across 16 lines around July 2026. WTW completed the Newfront acquisition on 27 January 2026 and named its Coverage Gap Analysis product on the Q1 2026 earnings call. Coverwatch raised US$4.5m pre-seed on 23 July 2026. We differ on the guarantee (bounded omission, not citation), the user (the SME's own documents via its intermediary), the market (no wording-level analysis found in Singapore or APAC — MSIG Business Plus, Chubb Select+ and AIG SME Package are product portals), the non-insurance documents we read, and the carrier record in the same pass. **Do not claim technical novelty on clause citation.**

**3. "LLMs hallucinate on legal text — 17 to 33%, measured, with retrieval in the loop."** Cannot be argued away, only measured. Answer: the deterministic Layer 3, the abstention gate, our own measured rate reported against theirs, and the honest statement that citation bounds false positives and not false negatives, which is exactly why completeness and exclusion false-negative rate are headlines. Without those numbers by Demo Day this objection lands and we do not recover.

**4. "Detection is not the bottleneck — affordability is."** Cite Allaire (2016) honestly: the one randomised field experiment directly on point found information provision plus social proof raising flood insurance purchase by about five percentage points among 364 Bangkok households. Small, real, causal. Then pivot to the two things that are not persuasion: compulsion events with deadlines and penalties, and the broker hand-off that converts a finding into a bind. And use the cyber data as proof that education fails — Singapore SME cyber take-up fell from 38% to 36% while incidents rose from 25% to 27% and awareness fell from 47% to 40%.

**5. "Adverse selection — you will hand Zurich a worse book."** The mechanism in §11, not a slide.

**6. "Chisel AI did exactly this and went bankrupt."** Raise it ourselves. Chisel's automated policy check compared policy against quote and binder — functionally our diff. Founded 2015, won Gold at the very first Zurich Innovation World Championship in 2019, filed an assignment in bankruptcy on 19 April 2022. Why it is not us: pre-LLM, so it needed supervised extraction per form and the marginal cost of each new wording never fell; and it sold to brokers, who have formal minimum account thresholds for declining exactly these accounts. The category did not fail. That cost structure and that buyer failed.

**7. "This is regulated advice."** §9, precisely, including where our opinion ends and counsel's begins.

**8. "Why wouldn't Zurich build it?"** Answer on data access and distribution neutrality, never on model capability — Zurich opened a Global Capability Center in Hyderabad on 28 April 2026 explicitly for technology and AI. The multi-carrier documents sit with the SME, and a tool that reads a competitor's wording is easier to trust from a neutral party.

**9. "Student team, no entity, no customers."** Claimsio won the 2025 SME problem statement as a two-person team. Every 2024–2025 winner had something running with named deployments or hard numbers, but the bar was deployed-and-evidenced, not Series B. Our answer is the measured error rate and the procurement pack.

---

## 15. Anti-duplication

Clause 12.1(o)(iii) prohibits content substantially duplicating a project entered in any other competition; 12.1(q) makes violation grounds for immediate disqualification. RDTII-AEGIS went to UN ESCAP. Clause 14.2 protects IP created before and during the competition, so the techniques are ours to reuse.

**New repository, new taxonomy, new data model.** The taxonomy rests on ACORD section structure, the LMA clause library, SSIC 2025, RICS reinstatement standards and the WICA statutory schedule — none of which featured in the RegTech work. Present the prior work as background IP we own. Do not port code.

---

## 16. Open decisions

1. **Registration deadline.** Most likely 14 August 2026 2359 SGT; the staging page said 24 July. Verify in a browser and confirm the artefact deadline in writing with gfh@gftn.com.
2. **Fifth seat.** Chithsukhi on the roster or not. Freezes at registration.
3. **Is Zurich Insurance Company Ltd (Singapore Branch) an MOM-designated WICA insurer?** Only designated insurers may issue WICA policies. If not, WICA becomes the credibility hook and property/BI becomes the conversion path. Check MOM's list before the deck is written.
4. **Product name.** Protection Pulse / Adequacy two-tier as proposed, or one name.
5. **Segment.** Food manufacturing as specified, or revert to e-commerce retail. This spec argues food manufacturing on compulsion grounds.
6. **Adviser directory.** Whether any real Singapore intermediary will take a demo case before Demo Day. Even one named adviser changes the pitch materially.
7. **ISO generative-AI exclusion endorsements** (reportedly CG 40 47, CG 40 48, CG 35 08, January 2026). A brand-new, dated, machine-detectable exclusion appearing silently at renewal would be near-perfect demo material, but it is secondary-sourced. Verify against ISO or leave it out.
8. **JTC standard lease insurance covenant.** Unread. Fifteen minutes converts an unverified claim into a verified one.

---

## 17. The three sentences

**Problem.** 94.7% of Singapore's 369,500 SMEs employ fewer than 25 people, so nobody's job is reading policy wording — and Zurich's own risk engineers complete 60,000 assessments a year across 40 countries, roughly 1,500 per country, against 337,700 sub-25-employee firms in Singapore alone.

**Insight.** Every AI coverage tool shipping in 2026 promises its answers are cited. A citation proves what the system said and nothing about what it missed — and a missed exclusion is the error that costs the SME the claim. Meanwhile a finding with nowhere to go is a dead end: the owner still has to find an expert, re-explain the business and forward the same confusing PDFs.

**Product.** Protection Pulse accounts for every provision in the bundle, reports how many it could not explain, computes what a claim would actually pay using code rather than a language model, and hands the SME's authorised adviser a prepared case with the evidence already organised — so the SME learns what its policy does before the loss, the adviser can act in minutes instead of hours, and the carrier learns what it is actually insuring at the same moment.

---

*Numbers safe to use, with citations: `session-2.md` §16. Competitive detail: `sff-2026-zurich-ps03-competitive-map.md`. Zurich, regulatory and Singapore statistics with an appendix of 32 unverified items: `sff-2026-zurich-regulatory-singapore.md`. Content from external sources was rephrased for compliance with licensing restrictions.*
