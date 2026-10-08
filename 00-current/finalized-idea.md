# PROVEN — finalized idea

**Global FinTech Hackcelerator 2026 · Problem Statement 03 · Zurich Insurance, "Closing the SME Protection Gap"**
**Date:** 11 August 2026
**Team:** Preran S Gowda, Shreya Belavatha Jayaram, Shamanth M S, Shashank S, Chithsukhi C V

Supersedes and consolidates: `03-sessions/session-1.md`, `03-sessions/session-2.md`, `merged-spec-v1.md`, `chithsukhi-protection-pulse-solution-idea.md`, Shashank's Proven note, and the wording check in `06-evidence/policy-wordings/`.

---

## 1. The decision

**Product: Proven.** Inside it, two named parts: the **Adequacy engine** (clause accounting and settlement arithmetic) and the **Review Brief** (the artefact an adviser acts on).

The name is the mechanism. After the verification work below, the thing that makes this product different is that it separates what is **proven** from what is merely **declared** from what is **unestablished** — and it never lets the second or third masquerade as the first. That is the product, the trust model and the pitch in one word.

**One sentence.** Proven reads the documents a small business already holds, computes what its insurance would actually pay, grades every finding by the strength of the evidence behind it, and hands a licensed adviser a prepared case — building, over time, a portable record of what has actually been established about that business.

---

## 2. What each of us contributed

This is one idea assembled from four, and each person owns the layer they invented.

| Contribution | Origin | Role in the final design |
|---|---|---|
| Supply-side reframe: exclusions are priced ignorance; verification cost, not risk appetite, limits what SMEs can buy | Shashank | The pitch narrative and the reason Zurich cares |
| Portable record, neutrality moat, "there is no violations table" | Shashank | The moat and the trust architecture |
| Deterministic settlement arithmetic; bounded omission; compulsion triggers; evidence plan; regulatory posture | Preran | The engine and the defence |
| Change-event capture, Review Brief, consent gate, adviser workspace, case lifecycle, output-state discipline, scope boundaries | Chithsukhi | The product and the path to action |
| Evidence-class grading | Response to the Kayna critique | The fix for the weakest point in every earlier version |
| Real-document verification of every clause the demo depends on | This session | The reason the numbers on stage are not assumptions |

Two things were deliberately dropped. Continuous premises telemetry — a hardware business in software clothing, and the wording evidence below shows it would have no clause to attach to. Peer risk-pooling — needs capital, a licence and a decade.

---

## 3. The thesis

SME cover fails for two reasons that look unrelated and share one cause.

**On the demand side, the business drifts away from its documents.** It opens a second unit, buys equipment, takes on staff, starts selling online. The policy was priced for the business it used to be, and nobody re-reads it. **94.7% of Singapore's 369,500 SMEs employ fewer than 25 people, which makes dedicated insurance expertise economically rare** — at that headcount a full-time person who reads policy wording is not a role anyone can justify. Note the limit of what the statistic proves: it establishes firm size, and the inference about who reads the wording is ours. State it that way rather than as a measured fact.

**On the supply side, verification cost shapes what can be offered.** An underwriter cannot send a risk engineer to a bakery on a S$1,200 premium. Zurich Resilience Solutions completes about 60,000 engineer-led risk assessments a year across 40 countries — roughly 1,500 per country — against 337,700 Singapore firms under 25 employees. **Where risk cannot be efficiently verified, carriers may restrict, sub-limit or condition cover.**

Say it that way and not more strongly, because an underwriter on the panel will otherwise correct us. Restrictions also exist for accumulation, catastrophe exposure, moral hazard, adverse selection, underwriting appetite, regulatory requirement, product design and claims experience. Verification cost is one mechanism among several — it happens to be the one software can move, which is why it is our entry point, not because it is the only one that operates.

**One cause.** Nothing about a small business is ever established. Everything is either self-declared, which is worthless to an underwriter, or unverified, which is unpriceable. There is no trusted, portable record of what is actually true. SME insurance is pre-bureau, and every carrier starts from zero on every SME, forever.

Zurich's own problem statement asks for tools that help SMEs take actions improving their resilience **and insurability**. Insurability is the supply side. Proven is the only version of this idea that attacks it.

---

## 4. What we verified in real documents

This section is why the rest of the document is not speculation. Every clause below was read from a public Singapore policy wording downloaded into `06-evidence/` and machine-scanned. Nothing here is inferred from general market practice.

### Sources — three carriers, 118 pages

| Wording | Pages | File |
|---|---|---|
| **Chubb Select+ Insurance Policy**, Singapore, published 07/2020 | 28 | `06-evidence/extracted-text/chubb-selectplus-fulltext.txt` |
| **MSIG SUMO Insurance Policy**, form SMO022401, dated 2024-01 | 41 | `06-evidence/wording-corpus/sg-msig-sumo-sme-policy-wording.txt` |
| **Liberty SMECare**, May 2025 | 49 | `06-evidence/wording-corpus/sg-liberty-smecare-policy-wording.txt` |

Chubb was read first and in most depth. MSIG and Liberty were then scanned on four
targeted topics — average formula, condition-precedent declaration clause, premium
payment warranty, unoccupancy day count. Scripts: `06-evidence/scripts/scan_corpus.py`
and `dump_clause.py`. Full results with page-cited quotations:
**`06-evidence/cross-carrier-findings.md`**.

A further 15 documents — brochures, benefits schedules, an AIG proposal form, and
four Malaysian wordings retained for regional comparison only — are catalogued and
classified in `06-evidence/wording-corpus/MANIFEST.md`. Malaysian wordings carry an
`MY-` prefix and are never cited for a Singapore claim.

### The cross-carrier result, and why it is the strongest evidence we have

Every one of the four scans found **carrier-level divergence**. Not one of the four
clause behaviours is uniform across three wordings, and one is not uniform *within* a
single wording. The one clause that is identical across all three is identical
because a market body standardised it.

| Behaviour | Chubb | MSIG | Liberty |
|---|---|---|---|
| Average threshold | 85% | **none — any shortfall bites** | **two provisions**: none on a value basis (GC4), **85% on a reinstatement basis** ("Average Relief") |
| Average formula stated in text | No | No | **Yes, verbatim** |
| General condition-precedent declaration clause | **Absent** | **Present, sweeping** | Arbitration only |
| Premium payment warranty | 60d, auto-terminate, S$25 min | identical | identical |
| Unoccupancy day count | **14** | **30** | **30 in most sections, 7 in another** |

This table is the pitch. A tool that read one wording and generalised would be wrong
about three of these five rows. We did not assert that the market is heterogeneous —
we measured it, across three carriers, and can show the page for every cell.

### Present, and consequential

**Average, clause 4.2 (p15).** If at the time of damage the total sum insured represents **less than 85% of the actual value** of the property insured under that section, the amount payable **shall be proportionately reduced**. Explicit, numeric, and almost no SME knows it exists.

One discipline point, and it is the best demonstration of our own method: **Chubb states the trigger and does not state the formula.** "Proportionately reduced" is conventionally read as loss × (sum insured ÷ actual value), but that arithmetic is market convention, not text we have read in this wording. So on a Chubb policy the engine reports the adequacy ratio and the fact that proportionate reduction is triggered, presents the conventional computation as a clearly-labelled illustration, and records the formula basis as **MARKET_CONVENTION**. Applying our own grading to our own arithmetic is a stronger move on stage than a confident number.

**And the cross-carrier scan turned this hedge into a feature.** Liberty SMECare
*does* state the arithmetic, in its own words, twice:

> Payment shall not exceed **such proportion of the loss or damage as the sum insured
> bears to the value of all property** at the time of loss or damage.
> — Liberty SMECare, "Basis of Insurance" p.6, repeated as cl 5 "Basis of Settlement" p.46

Liberty General Condition 4 "Average" (p.46) states the complementary form: the
insured "shall bear a rateable proportion of such loss which the said difference
bears to the total value of the property insured."

**And Liberty carries a second average provision, which we initially missed.**
"Average Relief" at p.7 cl 7 and p.26 cl 6:

> If at the time of reinstatement, the sum representing **85%** of the total
> reinstatement cost which would have been incurred, if the whole of the Insured
> Property had been destroyed, exceeds the sum insured thereon at the time of loss,
> then the Insured shall be considered as being his own insurer for the difference
> and shall bear a rateable proportion of the loss accordingly.

Read the trigger, not the heading. It fires when the sum insured is **below 85% of
reinstatement cost** — functionally the same test as Chubb cl 4.2, on a different
valuation basis. Despite being named a *relief*, it is an average condition.

So Liberty has **two** average provisions with **different thresholds on different
bases**: none on a value basis, 85% on a reinstatement basis.

> **Correction on the record.** An earlier revision of this document, and of the
> taxonomy, recorded Liberty as having no average threshold at all — reading GC4 and
> stopping. That would have **over-reported every Liberty insured on a reinstatement
> claim**, by removing an 85% cushion the policy actually grants. It is the exact
> mirror of the MSIG under-reporting error this design was built to prevent, and it
> was caught by external review rather than by us. Fixed in
> `proven/taxonomy/taxonomy.yaml`, with five regression tests in
> `tests/test_arithmetic.py`.

**This makes the argument stronger, not weaker, and it is worth saying so on stage.**
A single hardcoded threshold is wrong in *both* directions: 85% under-reports MSIG,
and no-threshold over-reports Liberty on reinstatement. The engine therefore stores
thresholds per clause instance keyed to the basis of settlement, and where the
documents do not establish which basis governs, it **declines to choose** — the
finding escalates to `REQUIRES_AUTHORISED_REVIEW` and both candidate provisions are
reported. The illustration shown applies the harsher threshold, so it understates
rather than overstates what the policy would pay.

MSIG General Condition 12 "UNDERINSURANCE" (p.38) states neither a formula nor a
threshold — **any** shortfall proportionately reduces:

> If any property insured shall at the time of the occurrence be collectively of
> greater value than the sum insured, the amount payable by the Company in respect of
> the loss or damage shall be proportionately reduced.

So the same engine produces a `PROVEN` quoted formula on a Liberty policy and a
`MARKET_CONVENTION` illustration on a Chubb or MSIG policy, decided entirely by what
the document says. Note also the direction of the MSIG divergence: a tool hardcoding
Chubb's 85% would **under-report** every MSIG insured, whose exposure starts at the
first dollar of shortfall. That is not a rounding difference, it is a wrong answer.

**Theft exclusion, clause 5.1(c)(i) (p17).** Theft is excluded **unless** (1) it is from a Building **and** (2) there is violent or forcible entry to or exit from that Building — **or** (3) "applicable" is selected in the Schedule for Additional Extension 2.17, Theft Endorsement (Full Theft). A schedule-driven write-back. Shoplifting and employee theft are uninsured by default, and whether they are covered depends on an election in the Schedule the owner has never examined. Resolving it requires reading base wording against schedule. **This is the cleanest PROVEN finding in the whole document** — two documents, no owner input, no formula, no interpretation.

**Vacancy, clause 5.1(b)(v) (p17).** Escape of water is excluded where the premises are Vacant for more than **14 days**, with a formal definition of Vacant at 2.35 (three limbs).

**And the day count does not survive contact with other carriers.** MSIG's general
condition (p.37) uses **30 days**, and reaches further than an exclusion — it is an
alteration/avoidance provision. Liberty (p.45) uses **30 consecutive days** in its
alteration provision and in most peril exclusions (p.13, p.30) — but **seven
consecutive days and nights** in another section (p.31). One insured, one document,
two different unoccupancy tripwires.

That is the clearest justification in the corpus for resolving triggers at
`clause_instance` level, per section, rather than storing "unoccupancy_days" as a
per-policy attribute. It also disposes of any temptation to generalise Chubb's 14 days
into a market rule.

**Premium Payment Warranty, clause 3.20 (p8) — read in full, and it is the strongest rule in the product.** Where premium is not paid and received in full within **60 days** of inception: (a) cover is **automatically terminated immediately after** expiry of that period; (b) termination is without prejudice to liability incurred within the period; (c) the insurer is entitled to pro-rata time-on-risk premium subject to a minimum of **S$25.00**.

**Identical, to the dollar, in all three wordings** — MSIG p.41, Liberty cl 14 p.40 and p.48, same three limbs and the same sub-60-day variant. The uniformity is not coincidence: this is the General Insurance Association of Singapore market-standard warranty, reproduced near-verbatim.

Which makes it the highest-confidence computation we have: identical across three carriers, pure date arithmetic, no legal judgement required, `PROVEN` class, no abstention path — and the consequence is not a reduced payout but **no policy at all**. A missed instalment on day 61 leaves the business uninsured, and nothing in its own records would say so. MSIG's version carves out Section 4 Work Injury Compensation, which the engine must respect: WICA cover is compulsory and cannot simply evaporate for non-payment.

**Time Limit, clause 4.13 (p15).** No payment for damage **twelve months** after it happened, unless the claim is the subject of pending action or arbitration. A business that takes thirteen months to resolve a dispute loses the claim.

**Limits structure.** Aggregate versus any-one-occurrence drawn explicitly at clause 4.6. Sub-limits confirmed at S$1,000 for a theft extension, S$10,000 in the aggregate for food and drink liability, and 10% of total sum insured for professional fees. Reinstatement basis defined at 3.3 and 4.11, with "not better than" language.

### Absent — and this killed a plan

Zero matches across all 28 pages for: fire extinguisher servicing warranty, sprinkler maintenance warranty, burglar alarm warranty, **deep fat frying or any cooking condition**, hot work permit, smoking prohibition, stacking or storage warranty, electrical installation inspection warranty. No indemnity period either, though that is likely because this is the Lite variant with business interruption not operative.

**Consequence.** The original Proven centrepiece — photograph the suppression system, watch the exclusion stop biting — has no clause to attach to in the one real Singapore SME package wording we could obtain. The physical-safety-control conditional exclusion Shashank's demo assumed does not appear. We found this before building it, which is the whole point of checking.

### The case that replaces it

**Grace Electrical Engineering Pte Ltd v EQ Insurance Co Ltd [2016] SGHC 233.** High Court of Singapore, Belinda Ang Saw Ean J, judgment 19 October 2016. A **public liability** policy — not a fire policy — on an industrial unit at Kallang Way. Fire on 6 September 2012 spread to the adjacent unit, whose occupier sued. The insured sought indemnity up to the S$1 million policy limit. Unit 141 had been used as workers' quarters with electrical cooking appliances in the backyard; SCDF laid eight charges, five under s 30(1) of the Fire Safety Act for unauthorised changes of use to accommodation, pantry and storage, and three under s 24(1) for fire safety works without plan approval.

**The outcome: Grace Electrical lost. The action was dismissed with costs.**

The court's own conclusions at [72]: non-compliance with the Fire Safety Act was a **breach of GC9, a condition precedent**, so the insurer was **not liable to indemnify**; failure to obtain written consent before pleading guilty was **not** a breach of GC4, itself also a condition precedent; and the GC12 contractual time bar did not apply.

> **Correction on the record.** An earlier draft of this document stated that the court held GC4 and GC9 *not* to be conditions precedent. That was wrong. It came from misreading a truncated keyword-scan hit at [4], which was in fact EQ Insurance's hypothetical framing of its own litigation position, not the ruling. The judgment is public and any insurance-literate judge can pull it up in ninety seconds. Caught before submission; corrected here.

**Two findings, and the corrected version is far stronger than the error was.**

**A statutory-compliance condition precedent destroyed the entire indemnity.** GC9 required the insured to exercise reasonable care that buildings, plant, machinery and fittings were sound and fit for their purpose, **and that all statutory requirements, bye-laws and regulations imposed by any public authority were duly observed and complied with.** GC13, the general declaration clause, made due observance of the policy's terms a condition precedent to any liability. Breach of a fire-safety statute — through an unauthorised change of use, detectable from documents — forfeited a S$1 million third-party liability claim.

That is our compulsion-trigger thesis with judicial authority behind it, and it is a bigger claim than we previously made. Every statutory obligation in §7 is now not merely a compliance question but a potential route to forfeiting *unrelated* cover. An SME under-declaring headcount to its work injury insurer, or operating outside its permitted use, is not only exposed on that obligation — it may have voided its liability policy.

**And the court constrained how any engine may classify conditions.** At [17]–[25]: the effect of a general declaration clause must be examined against each specified clause; the label "condition" or "condition precedent" is a relevant factor but **not decisive**, particularly where applied generally to terms of differing nature; a clause that cannot be a condition precedent will not become one by declaration; and part of a clause may be a condition precedent while another part is not — citing *The Directors of the London Guarantee Co v Benjamin Lister Fearnley* (1880) 5 App Cas 911 and *Aspen Insurance UK Ltd v Pectel Ltd* [2008] EWHC 2804 (Comm). *Contra proferentem* was rejected here because GC13's words were unambiguous.

So the design rule survives, on better grounds. Not "the classification is contested, therefore don't assert." Rather: **the consequence of breach is total forfeiture, and whether a given clause is a condition precedent requires judicial construction rather than reading a label.** Software must locate the term, quote it, and escalate. Concluding is not ours to do — and this case is the demonstration of what the error costs.

### And the cross-carrier scan found the clause Chubb was missing

The awkwardness in the argument above was that *Grace Electrical* turned on GC13, a
general declaration clause, while Chubb Select+ contains **no such clause at all** —
zero hits for "condition precedent" across 28 pages. The case was authority for a
risk our one verified wording did not carry.

**MSIG SUMO carries it.** In the preamble at p.1, and repeated as a general condition
at p.36:

> ...the due observance and fulfilment of the terms and conditions of the Policy, in so
> far as they relate to anything to be done or complied with by the Insured and the
> truth of the statements and answers in the said Proposal **shall be conditions
> precedent to any liability of the Company** to make any payment under this Policy.

That is GC13's structure, in a current Singapore SME wording, from a top-five domestic
insurer. MSIG additionally carries a discrete General Condition 17 "CONDITION
PRECEDENT" (p.39) going to premium-payment history with another insurer over the prior
twelve months. Liberty, by contrast, uses "condition precedent" **only** as the
arbitration precondition (p.39, p.46) — no general compliance declaration.

| | General declaration clause | Effect if an obligation is breached |
|---|---|---|
| Chubb | **Absent** | Not automatically fatal to the claim |
| MSIG | **Present, sweeping** — every obligation, plus truth of proposal | Arguably every obligation is a condition precedent |
| Liberty | Absent as a general clause; arbitration only | Confined |

**This is now the core of the pitch, and it is empirical rather than rhetorical.** A
system that answered "does breach of this obligation forfeit cover?" with a hardcoded
rule would be wrong for Chubb, wrong for Liberty, and *unsafe* for MSIG. And on MSIG
the label still does not settle it, because *Grace Electrical* at [17]–[25] holds that
a general declaration clause must be tested against each specified clause and its
label is not decisive. So the honest answer to that question is not merely unknown to
us — it is **not available from the text at all**, for any of the three, without
construction by a qualified human.

PROVEN therefore never answers it. It locates the obligation, quotes the clause,
records that the classification is contested, and routes to a licensed adviser. That
abstention is engineering necessity, demonstrated across three real wordings, not
legal timidity.

Note the direction of the asymmetry, because it matters for design. A tool that wrongly says "you are fine" costs the business its claim. A tool that wrongly says "you are in breach" costs it an unnecessary adviser conversation. Neither is acceptable, but they are not equal, and the engine is tuned accordingly: locate, quote, escalate, and never resolve.

### Limits of what we checked

Three wordings, 118 pages, from three carriers. Chubb's is the Lite variant distributed through a bank channel and the full Select+ may carry more.

**Correcting an earlier statement in this document:** a previous draft said MSIG SUMO published a marketing page only, with no wording PDF. That was wrong — the full 41-page policy is published at `msig.com.sg` and is now in the repo. Income's business package remains marketing-page only. AIG Singapore publishes an SME Restaurant & Food Stall document, but it is a **proposal form**, not a wording; the OCBC-distributed BizProtect Plus Restaurant document is a **benefits schedule** underwritten by Great Eastern, not OCBC. Neither is authority for policy language. Both are catalogued as such in `06-evidence/wording-corpus/MANIFEST.md`.

**What the three-carrier read does and does not establish.** MSIG and Liberty were scanned on four targeted topics, not read clause-by-clause. The findings on those four topics are page-cited and sound. The remaining ~110 pages are unmapped. Specifically, the theft/forcible-entry corroboration noted in the manifest is a keyword count only — the MSIG and Liberty theft clauses have **not** been read in full and must not be presented as equivalent to Chubb cl 5.1(c)(i) until they are.

Traditional tariff-style warranties — electrical installation inspection, fire appliances maintained — may survive in standalone Singapore fire policies rather than modern package products. Still unresolved, and worth an hour if the physical-verification roadmap matters. AIG Singapore's Homes Advantage personal-lines wording does use the conditional form, with cover applicable only where the building is not left unoccupied beyond 60 consecutive days — a fourth distinct unoccupancy count, though personal lines and so not directly citable for SME.

No insurance-qualified person has reviewed any of this. Every clause is quoted from the extraction and page-cited precisely so a reviewer can check it quickly, which is the design — but the review has not happened.

---

## 5. The wedge: three layers of honesty

Every competitor promises accuracy. We promise something falsifiable instead, in three ways. This is the whole differentiation and it should be the spine of the deck.

### 5.1 Evidence classes — every finding is graded

This is the answer to the sharpest criticism the design has received: that the exposure side rests on self-declaration, so the SME who does not understand insurance also does not know what to declare, and a wrong declaration produces a wrong report with a paper trail.

Correct, and it applies to exactly one input — actual value at risk, which appears in no document the SME holds and which the 85% average clause depends on. So we grade:

**The grading rule is authorship, not format.** A document is not evidence because it is a PDF. It is evidence according to who wrote it and whether they had an independent reason to get it right.

| Class | Test | Example |
|---|---|---|
| **PROVEN** | Every operand is a span in a document authored by a **third party or an authority** — insurer, government, supplier, landlord | Theft requires forcible entry and the Schedule does not elect Full Theft (both insurer-authored). WIC schedule declares 11 employees; the CPF contribution record shows 14. Equipment value from a supplier invoice. |
| **DECLARED** | At least one operand comes from a document the **business authored itself**, even a real one | Stock value from the business's own balance sheet or management accounts. Occupancy description from its own proposal form. |
| **MARKET_CONVENTION** | Every operand is a span, but the **computation combining them is not stated in the wording**. The arithmetic is standard market practice, not text | Chubb cl 4.2 and MSIG GC12 both say "proportionately reduced" without stating the formula. The conventional loss × (SI ÷ value) is shown as a labelled illustration, never as the policy's own arithmetic |
| **UNESTABLISHED** | A required operand has **no span in any document** | Stock sum insured unchanged since inception; clause 4.2 reduces payment below 85% adequacy; we have no evidence of actual value at risk |

`MARKET_CONVENTION` earns its place in the table because of a measured result, not a
theoretical worry: **Liberty states the average arithmetic verbatim and Chubb and MSIG
do not.** So the same finding is `PROVEN` on one carrier and `MARKET_CONVENTION` on
another, and the class is decided by reading the document rather than by our
assumption. A three-class scheme would have forced us to either overstate Chubb or
understate Liberty.

**Lead every report with PROVEN findings.** They need nothing from the business and cannot be wrong about a number someone typed.

**Never ask for a figure. Ask for the document that already contains it — and then say who wrote that document.** We already do this for work injury: we do not ask headcount, we read the CPF contribution record, which is a third-party record and therefore PROVEN.

**A correction worth making explicitly, because it was wrong in an earlier draft.** The GST F5 return does **not** report closing stock. Its boxes cover standard-rated, zero-rated and exempt supplies, taxable purchases, and output and input tax. There is no inventory figure on it. An accountant or an underwriter would catch that instantly, and the demo's money beat was resting on it. Corrected source hierarchy:

| Value needed | Best available source | Class |
|---|---|---|
| Stock / inventory | Balance sheet or management accounts; stock-take report | **DECLARED** — the business authored it |
| Equipment and plant | Supplier invoices, fixed asset register | **PROVEN** where the invoice is third-party |
| Buildings | RICS-basis reinstatement cost assessment | **PROVEN** if assessed; **UNESTABLISHED** if never assessed |
| Revenue / turnover | GST F5 return (this it does report), filed tax computation | **PROVEN** as to declared supplies |
| Headcount, occupational class | CPF contribution record, work pass list | **PROVEN** |
| Occupancy and permitted use | Tenancy agreement, SSIC code from ACRA | **PROVEN** |

That the stock figure lands in DECLARED rather than PROVEN is not a weakness to hide. It is the grading scheme doing its job, and saying so on stage is the point.

**And UNESTABLISHED inverts the liability problem.** We are not creating a paper trail of a wrong number. We are creating a record showing the number was never established — which is true, is itself the finding, and is precisely what will bite this business at claim time.

### 5.2 Bounded omission — we report what we could not read

A citation proves what a system said. It proves nothing about what it missed. ContractEval (arXiv:2508.03080) measured models reporting that no relevant clause exists when one was present. When an engine finds nothing there is no citation to check, so every competitor's "all answers are cited" safety story covers only the less harmful error.

So every report carries a header: *N operative provisions detected · M classified · K unaccounted*, with the K quoted for a human to read. We do not claim to be right. We claim to state exactly how much of the document we could not account for. That converts an unfalsifiable accuracy claim into a falsifiable coverage claim, and it is the honest response to Stanford's preregistered finding that purpose-built legal AI research tools hallucinated between 17% and 33% of the time *with* retrieval in the loop.

### 5.3 Four output states, and three things we never do

| State | Meaning |
|---|---|
| **Documented** | An affirmative provision was located and quoted |
| **Not confirmed in reviewed documents** | The bundle was searched; no affirmative provision found. Searched sections listed |
| **Information missing** | A needed document is absent, illegible or ambiguous |
| **Requires authorised review** | A finding exists but its legal effect is a judgement for a licensed human |

Never assert that cover exists. Never assert a claim will or will not be paid. Never recommend a product, carrier or premium.

"Not confirmed" is not "not covered." *FCA v Arch* [2021] UKSC 1 — where the Supreme Court construed 21 wordings individually — is why a quoted exclusion is not the same thing as a correct statement of its legal effect. We state what the document says. Interpretation is attributed to the human who signs.

---

## 6. Architecture

Four layers, and the claim to make about them is precise:

> **No machine-learning model makes a consequential decision.** No model determines
> coverage, liability, precedence or settlement arithmetic.

That is the load-bearing statement, and it stays true however the system evolves.

As built today it goes further — there is no model in the pipeline at all. No LLM call,
no API key, no embedding, no classifier weights anywhere in `proven/`. Layer 1 is pypdf.
Layer 2 is deterministic pattern detection plus two data-driven classifiers. Layers 3
and 4 are ordinary code. An earlier revision labelled L1 and L2 "(model)"; that was a
claim about a component that did not exist.

**But do not compress this into "PROVEN is not AI."** It is a document-intelligence
system entered in a fintech competition, and the roadmap explicitly includes OCR,
LLM-assisted extraction and retrieval for the locating and typing work — arXiv:2605.00911
is in §16 precisely because OCR is planned in the harness. The architectural commitment
is about *where* a model may sit, not about refusing one: a model may help find and
label text, and may never decide what the contract pays. A system that decides nothing
by generation cannot hallucinate a finding, and that property survives adding extraction
models later.

```
  policy pack ──────────▶ L1  LOCATE          (pypdf + validation, no model)
  filed documents ──────▶     spans typed and anchored to
  (GST F5, CPF, work         (doc_id, page, char_start, char_end)
   passes, lease, COI)       source immutable; OCR fixes in a parallel layer
                             │
                             ▼
                        L2  ACCOUNT           (deterministic, no model)
                            5 detection schemes -> provisions
                            step 1 verified (carrier, clause_ref) map
                            step 2 heading keywords, as data, labelled weaker
                            step 3 model classification: NOT BUILT
                            exhaustive partition into taxonomy
                            + UNACCOUNTED bucket, counted and quoted
                             │
                             ▼
                        L2b EXTRACT            (deterministic, no model)
                            documents -> named facts, each with its source
                            and author class; absent means UNESTABLISHED,
                            never a default
                             │
  change events ────────▶    ▼
  compulsion calendar ──▶ L3  RESOLVE & COMPUTE   (code only, no model)
                            precedence resolution, emits resolution path
                            settlement arithmetic
                            evidence-class assignment
                            abstention gate
                             │
                             ▼
                        L4  REVIEW & ROUTE       (product)
                            graded findings → Review Brief → consent
                            → case lifecycle → record → book-level roll-up
                             │
                    ┌────────┴────────┐
              SME workspace      Review Brief out to the
                                 intermediary platform in use
                                 (Zurich Edge Assist in APAC)
```

**Layer 4 is an evidence layer, not a portal.** Zurich already runs Edge Assist across Asia Pacific as a unified intermediary system for sales, servicing and claims (§11). We produce the Review Brief and the book-level roll-up; whatever the adviser already lives in consumes them. We build our own adviser view only as a demo surface, and we say so.

**Layer 3 contains no model, and here is why on the record.** COMPACT (EACL 2026) measured frontier models at 34–57% base accuracy on cross-clause reasoning over real contracts with exception hierarchies. arXiv:2510.01228 found conflict-detection signals present internally while consistent resolution did not follow. Telling a model "endorsement beats schedule" is not a mechanism. Precedence and money are code.

Precedence: endorsement over schedule over base wording over proposal; specific over general. The engine reads the policy's own construction clause first and reports when precedence cannot be established, because precedence is ultimately a matter of contract interpretation under the governing law.

Arithmetic, all deterministic: the 85% average proportion, sub-limit caps and erosion, indemnity period truncation, deductibles, aggregate versus any-one-occurrence tracking, claims-made retroactive dates, and the two date warranties we verified. Conditions precedent and warranties are located, quoted and **escalated** — never adjudicated. Per *Grace Electrical* (§4), whether a term is a condition precedent is a matter of construction that survives the label attached to it, and breach can forfeit the entire claim. The engine reports the term and the stake; a human decides.

Abstention is a first-class output with a risk–coverage curve, gated by an independent verifier over the cited span rather than by token entropy.

---

## 7. Triggers

Two sources. The business tells us what changed; the calendar tells us what is about to be asked of it.

**Internal change events**, as buttons rather than a form, each opening only the questions it needs: started selling online · opened or leased a location · bought costly equipment · added a key supplier or customer · headcount change · moved from a packaged policy to bespoke cover · started handling customer data · **won a contract with a larger company** · **changed what the premises are used for**.

**Built.** All nine are in `src/proven/events.py` and rendered as toggle buttons in the
front end. Each event names the rules it makes relevant and the document kinds worth
adding, so tapping one tells the owner what to upload rather than opening a
questionnaire. `POST /api/events` records them and writes an audit row.

**What an event may not do, enforced rather than intended.** An event is a statement by
the owner, so it is SELF-authored. It selects which findings are foregrounded and nothing
else: it cannot establish a value, and it cannot raise a finding's state or evidence
class. If it could, "the business told us" would launder into `PROVEN`, which is the exact
failure the grading scheme exists to prevent. Asserted in
`test_api.py::test_events_never_change_a_findings_state_or_class`. The event vocabulary is
closed — an unrecognised code is discarded rather than stored.

The last two are additions. "Won a contract" is the certificate-of-insurance trigger. "Changed what the premises are used for" is *Grace Electrical*, and it is now the most important event in the list.

**External compulsion events**, which fire without anyone logging in:

| Trigger | Basis | Forcing event |
|---|---|---|
| Work injury compensation renewal | Compulsory for all employees doing manual work at any salary, and non-manual employees earning $2,600 or less monthly | MOM requires information to the insurer at least **21 days before** policy commencement |
| WICA limit uplift | From **1 November 2025**: medical cap $45,000→**$53,000**; permanent incapacity $97,000–$289,000→**$116,000–$346,000**; death $76,000–$225,000→**$91,000–$269,000** | Any policy priced before that date |
| Migrant worker medical insurance | Minimum **$60,000** per year per Work Permit holder, each sub-limit meeting the minimum | Work Permit issue or renewal |
| Migrant worker Stage 2 | From **1 July 2025**: standardised exclusions, two age bands, direct insurer-to-hospital payment | Policy start, renewal or extension after that date |
| Work pass age to 63 | From **1 July 2025** | Interacts with the age-banded premiums above |
| Certificate of insurance | Customer, principal or tender conditions. No government-wide rule — it sits in each tender's conditions | Tender close, award, annual refresh |
| Lease renewal and reinstatement | Landlord covenants; JTC inspects jointly about **six months** before expiry | Signing, renewal, pre-expiry inspection |
| Premium payment | Verified clause 3.20 — **60 days** from inception | Date arithmetic, automatic |
| Claim time limit | Verified clause 4.13 — **12 months** from damage | Date arithmetic, automatic |

Note the last two: they came out of the wording, they need no SME input at all, and no competitor is watching them.

**And note what *Grace Electrical* adds to every row above.** Ordinary Singapore SME liability wordings carry a general condition requiring all statutory requirements and regulations imposed by any public authority to be observed, made a condition precedent by a general declaration clause. Breaching a statute is therefore not only a regulatory exposure — it can forfeit cover on an unrelated claim. That turns the compulsion calendar from a compliance reminder into a coverage-preservation function, which is a materially stronger reason for a carrier to fund it.

WICA precision, because an underwriter will test it: the permanent-incapacity maximum applies only at 100% PI and is otherwise prorated; the figures exclude the additional 25% for total PI; and the calculation is average monthly earnings × age multiplying factor × %PI, with the minimum and maximum acting as a collar.

---

## 8. The demo

**Segment: light food manufacturing on leased industrial premises, Singapore.** It stacks manual workers, migrant workers, a leased industrial unit, machinery, stock, online orders and supermarket supply contracts on one relatable business — and it is the shape of business in *Grace Electrical*.

**Persona: Hock Lee Foods Pte Ltd**, Tai Seng. 14 staff, 9 doing manual work, 4 on Work Permits. Leased industrial unit. Supplies two supermarket chains and a hotel group. This year: bought a blast freezer, took a second unit, started online orders, hired three people. The policy was priced for one unit, eight staff, no freezer and no online channel.

| Beat | Time | What the room sees |
|---|---|---|
| 1. The change | 0:00 | Four change events tapped. No form. |
| 2. The accounting | 0:25 | Bundle ingested. *[real counts from the actual document — count them, do not invent]* provisions detected, classified, unaccounted. The unaccounted ones quoted on screen. We lead with what we could not read. |
| 3. PROVEN findings first | 0:50 | Theft requires violent or forcible entry; the Schedule does not elect Additional Extension 2.17. Shoplifting and employee theft uninsured — two insurer-authored documents, no owner input. Then WIC schedule declares 11, CPF contribution record shows 14, two of the three undeclared do manual work. MOM's own warning; $10,000 and 12 months; the 21-day deadline. |
| 4. The money, honestly | 1:40 | Clause 4.2 quoted from the real wording. Stock sum insured S$100,000; the balance sheet puts stock at S$150,000. Adequacy **67%**, below the 85% threshold, so proportionate reduction is triggered — that much is PROVEN from the schedule and DECLARED from the accounts. Then the discipline beat: *the clause does not state the formula.* Show the conventional S$40,000 illustration labelled as convention, and the formula basis marked UNESTABLISHED pending the full section text. **Being the only team on stage that declines to over-state its own arithmetic is worth more than the number.** |
| 5. Refusing to compute | 2:15 | Buildings sum insured: no reinstatement assessment on record, value unchanged since inception. **UNESTABLISHED — we will not put a number on this.** Two refusals in a row is deliberate: it establishes that every number we *do* show has a source. |
| 6. Change of use | 2:35 | Schedule occupancy description against the tenancy permitted use and the SSIC code. Mismatch flagged. Name *Grace Electrical* and what it cost: a statutory-compliance condition precedent, breached by an unauthorised change of use, forfeited a S$1 million liability indemnity and the action was dismissed. Then state our finding as **Requires authorised review** — we locate and quote the term; whether it is a condition precedent is judicial construction, and the downside of guessing is the whole claim. |
| 7. Consent and hand-off | 2:55 | Explicit granular consent. Review Brief shared. Adviser view: a prepared case, not an email with four attachments. Adviser requests one document, sets status. |
| 8. The record and the book | 3:20 | What is now proven about Hock Lee, portable and append-only. Then zoom out to the Mode B book-level screen — 61 accounts across the WICA threshold, 38 below the 85% adequacy line — clearly labelled as synthetic. Close by inviting a judge to search the database for Hock Lee's breach. **There is no table for it.** |

**Total 3:45, hard stop 4:00.** Beats 1, 7 and 8 are the compressible ones. If the video limit is three minutes, cut beat 1 to a single tap and merge beats 7 and 8. Never cut 3, 4 or 5 — they are the argument.

Beat 4 wins the technical panel. Beat 3 wins the Singapore panel. Beat 5 wins the compliance officer. Beat 7 wins the investors. Beat 8 is the close.

**Cold-company test.** They will name a business and ask us to run it. Use beat 3 — the ground truth is public and the arithmetic is deterministic.

**Documents on stage:** public wordings and clearly labelled synthetic schedules, or a real bundle with written permission. Never a real employee name on screen.

---

## 9. The record, correctly scoped

Shashank's moat survives, with its content changed by the evidence.

It is **not** a register of verified safety controls, because the wording we read conditions nothing on them. It is a portable, append-only record of **what has been established about this business from documents**: sums insured and the basis and date they were set, stock and revenue as evidenced by filed returns, headcount as evidenced by CPF, occupancy and permitted use, schedule elections taken and declined, and the dates that matter.

Four properties, and the second is the one that goes on the slide.

**Consent is a pull, not a share.** The SME issues a specific disclosure — named recipient, named fields, fixed window, logged, revocable. Like a credit report pull.

**The schema cannot store a black mark — stated precisely, because the loose version is falsifiable.** Two stores, and the separation is the whole guarantee.

The **case** is transient and belongs to the business: findings, including negative findings, evidence spans, the adviser conversation. It is SME-scoped, SME-deletable, and it is never the subject of a disclosure unless the business issues one. Of course it contains "theft not covered" — that is the product.

The **record** is the portable asset, and it is append-only. It holds **established facts only**: a value, its basis, its source document, its date, who authored that document. There is no `violation`, `breach`, `deficiency` or `score` column, and there is no schema path by which a negative finding becomes a persistent attribute of the business. A defect found and fixed produces a fact entry showing the fixed state. A defect found and not fixed produces nothing.

So the correct invitation to a technical judge is precise rather than sweeping: *ask us to show you the record schema, and find the column where a breach would live. There isn't one. Then delete the case and watch the record survive with only what was established.* Claiming "we do not store it" without that distinction is a claim a judge can break in one query, and we should not make it.

**Value lands before any disclosure.** The settlement number, the graded findings, the fix list — all of it exists for the SME before a byte reaches a carrier.

**Portability is the enforcement mechanism.** The record is the SME's. A carrier that misuses a disclosure loses access. Protection is market structure, not goodwill — and it is why a carrier structurally cannot build this: a Zurich-issued credential has no credibility with Allianz, so it has no value to the SME. Portability requires neutrality, and neutrality is not a feature Zurich can ship.

### 9.1 Two deployment modes — and why the distinction is load-bearing

The record and the consent model only hold together if we are explicit about who initiated the review. There are two modes and they have different privacy surfaces.

**Mode A — SME-initiated.** The business uploads its own bundle, gets graded findings, and issues a specific disclosure to its own adviser. Nothing aggregates. No book-level view exists, because we hold documents from businesses that have not consented to being counted alongside anyone else.

**Mode B — carrier-initiated.** Zurich runs the engine across its own in-force book, on documents Zurich already holds, for its own policyholders. Nothing is disclosed that the carrier does not already have; we are computing over its existing file. This is the mode in which a book-level view is legitimate.

Stating this distinction is not a formality. A portfolio view built on Mode A data would silently break both consent-as-pull and the no-violations-table promise. Getting it right is the difference between a trust architecture and a slogan.

### 9.2 The book-level view (Mode B only)

The same findings, aggregated over a carrier's own book. Mechanically it is a `GROUP BY` over output we already produce, so the marginal cost is near zero.

```text
Zurich SME book — compulsion and adequacy drift, this quarter

   61 accounts   crossed the WICA manual-worker threshold since last renewal
                 → work injury declaration now understated on 44
   38 accounts   stock adequacy fell below the 85% average threshold
                 → aggregate exposure above documented limit: S$2.4M
   29 accounts   schedule occupancy no longer matches SSIC or tenancy use
   17 accounts   migrated packaged → bespoke; indemnity period shortened
    9 accounts   premium payment warranty date at risk within 30 days

   Review queue, ranked by exposure × conversion likelihood
   Product signal: contents limits in the retail package are systematically low
```

Why this is worth building even as a designed screen. It converts per-account diagnostics into the thing a carrier can actually action — *which accounts need a conversation this week, and why, with the evidence attached.* It is the growth line in concrete form. And it answers "why pilot rather than build" better than any argument about model capability: we produce a signal Zurich does not currently have, on rails Zurich already owns.

**Two honesty constraints.** At hackathon stage we have no book, so this is necessarily synthetic — label it as a designed screen on synthetic accounts, on screen, every time. Claiming a dataset with zero rows is the fastest way to lose a panel with an actuary on it. And do **not** claim this is unclaimed ground: Advocate Technologies does portfolio-level coverage quality across commercial real estate books (§11). What is unclaimed is *carrier-side drift against Singapore statutory and contractual compulsion events* — which is narrower, and true.

---

## 10. Who pays

Not the SME.

**Carriers pay per reviewed policy**, justified by three lines. Growth first, because growth clears internal approval that cost savings do not: findings on existing policyholders convert into additional premium on the same customer at near-zero acquisition cost. Then loss ratio and claims cost, since proof of state at date of loss collapses the disputes that consume adjuster hours. Then retention on a book that churns on price, and continuous in-force risk signal where today there is none.

**Advisers pay for the prepared case** and for a defensible reason to be paid on a small account. ReSource Pro documented in January 2026 that under staffing pressure agencies have not merely deprioritised small-commercial policy reviews — some have eliminated them outright; that roughly 80% of accounts produce about 20% of revenue; and that skipping policy checking transfers risk onto the agency as aggregate errors-and-omissions exposure. **The task we automate is the task the industry stopped performing**, and it points at an E&O budget that already exists.

**The channel is intermediary-led, and three independent lines of evidence agree.** The advice perimeter is safest when we state findings and a registered intermediary recommends. The market buys that way — 65% of Singapore SMEs prefer offline, agent share is rising from 27% to 29% while aggregator share falls from 16% to 13%, and reliance on intermediaries increased at every touchpoint **except when asking questions**, which is exactly the gap a diagnostic fills without displacing anyone. And Zurich Singapore distributes through brokers, having created a dedicated broker leadership role in 2025.

**Two-sided by mechanism, not by slide.** The diagnosis is only produced in exchange for the record. An SME cannot get the settlement simulation without generating the disclosure that reaches the carrier — same documents, same pass, same moment. Adverse selection is priced rather than absorbed, because the carrier sees what the SME just saw.

Three of the nine judges on the 2025 Demo Day panel were venture investors. Be unambiguous: Proven is a Zurich distribution and risk-quality asset first, a standalone bureau second.

### 10.1 Unit economics — a number, not a posture

"Carriers pay per reviewed policy" is not a business model until it has a price. Working figures, all labelled as our assumptions rather than as findings:

| Line | Assumption | Basis |
|---|---|---|
| Price per policy reviewed, per year | **~S$18, illustrative — subject to pilot validation** | A hypothesis, not a finding. Set against commission rather than software comparables — see below. Nothing has been tested with a buyer, and the commission range it is anchored to is itself practitioner-cited rather than published |
| Marginal cost per review | **under S$0.05 today** | Native PDF parse plus rule execution. There is no model in the pipeline, so there is no inference cost at all. If constrained model classification is added later this becomes a real line item and should be re-stated then. |
| Gross margin at scale | **>90%** | The cost that matters is the wording, not the policy |
| Cost to onboard a new wording | **2–4 engineer-hours**, once | Then free across that wording's entire installed base |

**What the price is, and what it is not.** S$18 is a **proposed** price, defended by
reference to commission economics. Two things must be said in the same breath or the
number is an overstatement:

1. **There is no mechanism to collect it.** No billing, no payment integration, no
   subscription logic, no contract template, no trial flow. None of that is built, and
   none of it is claimed to be. For a carrier-paid B2B pilot at n=1 that is the correct
   build order — the first contract is a document, not a checkout page — but "we have a
   price" must not be allowed to sound like "we have revenue infrastructure".
2. **The comparator is itself unsourced.** The commission range below is
   practitioner-cited, and our research could find no authoritative published Singapore
   commission schedule. So the price is anchored to a range we cannot source. Under the
   product's own grading scheme that makes the price `MARKET_CONVENTION`, not `PROVEN` —
   and the right move is to apply our own vocabulary to our own business model rather
   than exempt ourselves from it.

Why S$18 survives an underwriting conversation. A Singapore SME commercial policy at roughly S$1,200 premium generates something like S$120–240 of gross commission at practitioner-cited small-commercial rates of 10–20% — and note our research could find **no authoritative published Singapore commission schedule**, so treat that range as indicative and say so. S$18 is under 10% of the thin end of that commission and roughly 1.5% of premium. It has to be defended on one of three budgets, and the strongest is the third:

- **Growth.** One converted endorsement or limit increase on an existing policyholder pays for many reviews. This is the line that clears internal approval.
- **Claims cost.** Proof of state at date of loss shortens disputes; adjuster hours are the saving.
- **E&O.** ReSource Pro's point is that skipping small-commercial policy checking transfers risk onto the intermediary as aggregate exposure. That is an existing budget line, not a new one, and it is the easiest yes.

**The scaling insight, and it is the one a VC will care about.** Marginal cost falls with *wordings*, not with *policies*. Singapore SME package wordings cluster tightly across a handful of carriers and product lines. Every wording parsed makes its whole installed base nearly free. That is why the cost curve collapses while accuracy climbs — and it is precisely the economics Chisel AI never had, because pre-LLM it needed supervised extraction per form.

### 10.2 Market, sized honestly

369,500 Singapore SMEs, of which 337,700 employ fewer than 25 people. At S$18 per reviewed policy and, say, 1.6 policies per business, a fully-penetrated Singapore SME book is roughly **S$10m of annual recurring revenue** — small enough to be credible and large enough to matter, and we should present it that way rather than inflating it.

The serviceable entry is much narrower and that is the point: **Zurich's own Singapore SME book.** We do not know its size and should not guess. The honest framing is that phase one revenue is a function of one carrier's book in one market, expansion is by *wording* rather than by geography, and each new wording opens an installed base rather than a single account.

Do not cite the 2014 BCG figure on SMEs as a third of global commercial premium. It is twelve years old and a panel will say so.

### 10.3 Go-to-market — one account, named

"Intermediary-led" is a channel, not a plan. The sequence:

1. **Zurich Singapore SME book, one product line, one wording.** Mode B. Zurich already holds the documents, so there is no consent problem and no cold start. Success metric agreed up front.
2. **The intermediaries on Edge Assist**, with the Review Brief delivered into rails they already use.
3. **Mode A direct-to-SME**, which only makes sense once the compulsion calendar can pull them in and an adviser network exists to route to.
4. **A second carrier**, which is when the record becomes portable and the bureau thesis starts being true rather than prospective.

Design partner target: **Theo Pitsikas**, Head of SME APAC, Singapore-based since June 2025, whose stated mandate includes modular products for micro-SMEs and trades plus digital platform enhancement. He is the person for whom this is a growth line.

### 10.4 The bureau thesis, and the hole in it

Stated plainly because a sharp investor will find it. **With one carrier, a portable record is not portable.** It is a Zurich record, and it therefore has exactly the credibility problem we accuse a carrier-built credential of having. Network effects are zero at n=1.

So: **phase one is not a bureau. It is a diagnostic with a clean data model that can become a bureau.** The neutrality moat is prospective, not present. What is defensible in the first twelve months is narrower and real:

- the **Singapore statutory and compulsion rule library** — WICA thresholds and the 1 November 2025 limits, migrant worker minimums, permitted-use and SSIC mapping, lease and COI triggers. Jurisdiction-specific, unglamorous, and not something a US-funded competitor will build for a market they are not in.
- the **wording library**, which compounds per wording rather than per customer.
- the **measured accuracy record**, preregistered and published, which nobody in this category has.
- **being in Singapore**, where none of Advocate, Qumis, Coverwatch, Newfront or Kayna operates.

Say all four. "Our moat is a network effect" from a team with zero users is the least credible sentence available.

### 10.5 What exists, what does not — the market-ready question

Clause 4.1 asks for a market-ready solution and clause 12.1(j) makes misrepresentation a disqualification risk. So state the position rather than dress it up.

**Exists:** verified clause-level findings from real public Singapore wordings; a deterministic settlement and compulsion engine specification with a data model and a rule format; a documented regulatory posture; a preregistered evaluation design.

**Does not exist:** an incorporated entity, a customer, revenue, a pilot, a live integration, or a book. The record has zero rows and the book-level view is a designed screen.

**The substitute for traction is measurement — and here is exactly what we can and
cannot measure.** Every 2024 and 2025 winner had something running with named
deployments or hard numbers, and Claimsio won as a two-person team, so the bar is
deployed-and-evidenced rather than funded. This section previously claimed "an error rate
on a labelled set of real wordings, reported against Stanford's 17–33%". **We do not have
that number and must not claim it.** A general accuracy rate needs a qualified reviewer to
say what the right answer is, and nobody insurance-qualified has reviewed a single clause
reading in this repository.

What we do have, all three checkable by a judge in the room:

1. **Citation fidelity — measured, and it needs no reviewer.** `eval/citation_audit.py`
   verifies that every quotation exists byte-for-byte at the offsets it claims in the
   immutable stored text, that every quotation sits inside a provision the finding
   actually cites, and that every figure carries an evidence class. Current run: 25/25
   spans verbatim, 8/8 within their cited provision, 1/1 figures classed. These are
   string and integer comparisons against the source, so there is nothing for a reviewer
   to disagree with — which is exactly why it is publishable now, and exactly why it is a
   narrower claim than accuracy. A perfectly faithful citation can support a wrong
   conclusion, and the audit says so in its own output.

2. **Agreement with independently derived labels, on the subset with objective ground
   truth.** `eval/labels/objective-hock-lee.json` sets expectations by operations with
   one defensible answer: comparing two integers (CPF 14 against WIC 11), subtracting two
   dates (71 days against a 60-day warranty), dividing two amounts (100k/150k against an
   85% threshold), or observing that a field is absent. Ten assertions, ten agreements.
   Every finding that turns on construction — whether an alteration is material, whether
   a term is a condition precedent — is declared out of scope in the label file itself and
   excluded from both precision and recall.

3. **Bounded omission — a real coverage number rather than an accuracy number.** 97
   provisions detected in the Chubb wording, 13 classified from clause references a human
   verified, 45 more identified by heading keyword and labelled as the weaker evidence
   they are, 39 unaccounted and quoted verbatim on screen. The invariant
   `classified + unaccounted == detected` is asserted in code and tested.

**The harness enforces this rather than trusting us to remember it.** Labels declare how
they were derived; anything derived from the engine's own output is a regression baseline
and contributes nothing to any reported figure; `accuracy_claim_permitted` is `False`
until a `REVIEWED_BY_EXPERT` label exists; and `python -m eval.harness --require-expert`
exits non-zero so a build script cannot publish a number the evidence does not support.
The harness prints the exact sentence the evidence supports, so nobody has to invent one
on a slide at 2am.

**What remains blocked, and it is the same thing it always was:** one named
insurance-qualified reviewer. Twenty bundles labelled by that person converts a scoped
claim into a general one. Without them, comparing anything of ours to Stanford's 17–33%
is an overstatement, because that figure covers open-ended legal research dominated by
precisely the constructional judgements we exclude.

### 10.6 What we are asking Zurich for

Specific, because a vague ask reads as a logo hunt.

1. **One wording and one book segment** — a single SME product line in Singapore, Mode B, on documents Zurich already holds.
2. **Ninety minutes of an underwriter's time** to review the rule library and settle whether third-party verification could ever support a coverage decision (§18 item 5).
3. **Claims denial data.** There is no published Singapore general insurance denial rate. Zurich has it. It would let us target the diagnostic at the gaps that actually convert into denied claims — which is mutually valuable rather than extractive.
4. **A named pilot sponsor**, because the Sixfold precedent shows an executive owner is what moved it from championship win to four offices in production.

### 10.7 What we would measure in a twelve-month pilot

Falsifiable, which is the most persuasive property a pilot can have. Verified cohort against control cohort on one book: decline rate at claim, claims cycle time and adjustment expense, endorsement and limit-increase conversion on reviewed accounts, retention at renewal, and adviser override rate on our findings. If the deltas are not there, the thesis is wrong and we would know inside a year. Say that out loud — a panel trusts a team that names its own kill criteria.

---

## 11. Competitive position

Name these before anyone asks. The 2018 published criteria included "unique proposition distinct from existing solutions," and this is where that is scored.

**Zurich Program IQ**, launched December 2025, already reads policy wording and flags sublimit mismatches across local and master policies — Zurich's own rationale is that those differences open coverage gaps. Open with it. It is internal-facing, built for Zurich underwriters, large-account only, single-peril today, and works on Zurich's own paper across master/local structures. None of that describes a food manufacturer with three policies from three carriers and no master programme. *Zurich proved the mechanic for 7,500 multinational customers; we are asking what it looks like for 369,500 Singapore SMEs with no master programme, no risk manager and no underwriter reading their file.*

**Zurich Risk Advisor** is a free public app with self risk assessment and Zurich's own risk grading. It assesses the **risk**. It does not read the customer's policy and price the gap. Say so explicitly — it pre-empts the obvious objection.

**Zurich Edge Assist — the collision we nearly missed.** Zurich Insurance Asia Pacific launched **Zurich Edge Assist** around November 2025, the newest module of the **Zurich Edge Platform**: a single unified system giving agents, brokers and Zurich's own teams role-based access to sales, servicing and claims across the region. Zurich Edge itself launched in July 2023 and reports reaching over 90 organisations and 450 million customers across Asia-Pacific through roughly 40 digital partners.

This matters more than any startup on this list. Our Layer 4 was drafted as an adviser workspace — which is a thin version of rails Zurich already operates, in exactly the market we are targeting. Building a parallel broker portal puts us on the wrong side of the table and competing with the champion's own investment.

**So Layer 4 is repositioned: we are the evidence and exposure layer that feeds Edge Assist, not a portal beside it.** The Review Brief is designed to be consumed by whatever system the intermediary already lives in. Edge Assist moves the transaction; SME-Check answers a first-purchase question; Program IQ reads master programmes. None of them tells Zurich which existing SME drifted out of adequacy last month, or which crossed a statutory threshold. That is the seam, and it is narrow enough to be honest about.

**Advocate Technologies — the most direct competitor found, and it is eight days old.** Emerged from stealth in early August 2026 with an **$18M seed** (CEO Ashwin Agarwal), which is several times Qumis's total raised. Its AI reads a policy and benchmarks it against market data in minutes, surfacing material coverage gaps and premiums it says can run more than 100% above market. Its Market Terminal gives brokers, commercial lenders, loan servicers and property owners portfolio-level pricing and coverage-quality comparison, tracking insurance compliance across a stated $1.3 trillion in commercial real estate assets. It also markets automated E&O and insurance-compliance checking, and a coverage-standards library.

Three consequences, and they are constraints rather than comfort. **Do not pitch benchmarking** — their moat is a market comparison corpus we do not have and cannot build. **Do not claim the book-level view is novel** — they already do portfolio coverage quality, for lenders and asset owners. And note they took the E&O-automation angle we identified as our budget line.

What still separates us: Advocate benchmarks a policy against *the market*. We compute against *the document's own arithmetic* — the verified 85% average clause, the schedule election, the indemnity period — and against *Singapore statutory obligations*. "Your limit is below market" is a market opinion that needs their dataset. "This clause reduces your payout on a S$60,000 fire to S$40,000, and here is the clause" needs only the document in front of us. Different claim, different evidence requirement, and ours is verifiable by a judge on stage. Their buyers are US brokers, lenders and CRE owners; not SMEs, not carriers, not APAC.

**Fulcrum** raised $25M seed plus Series A led by CRV in January 2026 for an AI platform aimed at insurance brokerages. Adjacent, broker-side, US.

**Qumis** launched attorney-certified agents across 16 lines around July 2026, citing conclusions to source wording. **Newfront** ships a product named AI-Powered Coverage Gap Analysis; **WTW completed the acquisition on 27 January 2026** and named it on the Q1 2026 earnings call. **Coverwatch** raised US$4.5m pre-seed on 23 July 2026 on gap identification at a flat fee. We do not claim novelty on clause citation. We differ on the guarantee, the grading, the non-insurance documents we read, the market, and the record.

**Kayna** — verified this session, and the most serious adjacent player. Irish, Cork, founded 2021 by Paul Prendergast and Peter Bermingham. €1m pre-seed September 2023; **€1.5m (US$1.7m) seed in March 2026** led by Delta Partners with MiddleGame Ventures, Aperture, Leo Capital, Enterprise Ireland and Digital Irish. It is the data orchestration layer between carriers and vertical SaaS platforms, partnered with **WTW/Willis** since March 2025, has developed an AI toolkit for policy analysis, and in July 2026 launched **KwantSure** with Willis and Kwant — embedded insurance for subcontractors inside the certificate-of-insurance workflow that general contractors already use. Also a Willis–Kayna–Belfry program for physical security firms.

Take Kayna seriously and be precise about the difference. Kayna's input is **operational data from a vertical SaaS platform the SME already uses**, which improves the *purchase* — and it requires the SME to be on such a platform and Kayna to have integrated with it, one partnership at a time. Our input is **the contract the business already holds**, from any carrier, plus documents it already filed with the government. A business onboarded with perfect Kayna-quality data can still be at 67% stock adequacy two years later, still have no Full Theft election, and still have changed its use of the premises. Kayna operates in the UK and US, not Singapore.

And take the lesson: Kayna's data-source approach is the right fix for our exposure side, which is why §5.1 reads filed documents instead of asking questions. Note also that WTW now holds Newfront's gap analysis and Kayna's embedded distribution — treat WTW as one consolidated competitor, not two.

**Chisel AI** built automated policy checking, won Gold at the first Zurich Innovation World Championship in 2019, and filed an assignment in bankruptcy on 19 April 2022. Raise it ourselves. It was pre-LLM, so it needed supervised extraction per form and the marginal cost of each new wording never fell; and it sold to brokers, who have formal minimum account thresholds for declining exactly these accounts. The category did not fail. That cost structure and that buyer failed.

---

## 12. Regulatory posture

**Licensing is a strength if stated precisely — and precisely includes saying whose
authority we are relying on.**

Our position: a tool that reads a business's own **general** insurance documents and
states findings sits outside the Financial Advisers Act, because the FAA regulates
advice on *investment products* and general insurance (property, liability, work injury,
motor) is not one. It sits outside the Insurance Act intermediary regime provided it does
not arrange or solicit. Brokers acting for policyholders register with MAS under the
Insurance Act; general insurance agents acting for insurers register with the General
Insurance Association of Singapore. **No sandbox is needed — there is no licensing
requirement to be relieved of.** Two rules hold the line: findings never
recommendations, and never touch premium, application or commission.

**Provenance of that position, carried forward rather than assumed.** The source is
`05-research/zurich-regulatory-singapore.md §B0–B1`, which rests on the **Baker McKenzie
practitioner guide** to Singapore insurance distribution. That is an authoritative
secondary source. It is not a legal opinion, and it is not the statute.

**We deliberately cite no section number, and that is a considered position, not an
omission.** `sso.agc.gov.sg` returned HTTP 403 to every automated fetch we attempted, so
nobody on this team has personally read the operative FAA or Insurance Act provisions.
The research file records this at §B1 with the instruction *"never put an Insurance Act
section number on a slide you have not personally read."* Quoting a plausible section
number we have not opened would be precisely the failure mode this product exists to
prevent, one layer up: an authoritative-looking citation with no verified basis. Under
our own grading scheme this claim is `MARKET_CONVENTION` — reasoned from a credible
secondary source, arithmetic of the statute unread — and we should label it that way
rather than exempt our own regulatory analysis from the standard we apply to a policy
wording.

The relevant instruments, for counsel to pin:
- **Financial Advisers Act 2001** (originally Act 43 of 2001; formerly Cap. 110), with
  the Financial Advisers Regulations at `FAA2001-RG2`. The load-bearing term is the
  statutory definition of "investment product".
- **Insurance Act 1966** (originally Act 46 of 1966), with the Insurance
  (Intermediaries) Regulations at `IA1966-RG16`.

**The single action that closes this:** one written opinion confirming that general
insurance is outside the FAA "investment product" definition. Until it exists, the
honest framing on stage is "our reading, from a named practitioner guide, and counsel
has not confirmed it" — which is a stronger answer to a legal-track judge than a section
number we cannot defend.

**One further caution from the same research, which cuts against us and should be said
anyway.** MAS has explicitly turned its mind to software in the advisory perimeter: the
Financial Advisory Guidelines were designed to clarify when a person is carrying on the
business of financial advisory services, and MAS's digital-advisory guidance treats
client-facing tools as generally within the FAA where they advise on regulated products.
"We're only a tool" is therefore not a defence by itself. What keeps us outside is the
product class (general insurance) plus the discipline that we state findings about the
customer's own documents and never rank or recommend a product.

**PDPA is the actual constraint.** Four decisions, made now. Redact at ingestion — if a work injury check needs headcount, occupational class and wage roll, strip names first. Contract in writing as a **data intermediary**, which under the PDPA limits us to the protection and retention obligations while consent and notification stay with the controller. **We do not train on customer documents**, which is what preserves that status and is a headline given Singapore SME AI-privacy concern moved from 10% to 66% in a year. Singapore data residency, and a named Data Protection Officer as required under s.11(3).

**Cite the current material, not the obvious one.** The **MAS AI Risk Management Operationalisation Handbook, 20 March 2026** — Project MindForge phase two, built with 24 banks and insurers — and the **MAS Information Paper on AI agent governance, 3 July 2026**. Most teams will cite the December 2024 paper.

**Arrive procurement-ready.** A one-page sub-processor register, unprompted: MAS consulted from 11 March to 20 April 2026 on Third-Party Risk Management Guidelines that will supersede both Outsourcing Guidelines, extend to all third-party arrangements, and require registers to MAS at least semi-annually including material sub-contractors. A Zurich pilot becomes a registrable arrangement and our sub-processors become Zurich's disclosure. Run the **IMDA GenAI Starter Kit's five risk tests** — hallucination and inaccuracy, bias, undesirable content, data leakage, adversarial prompts — and publish the results. Free, Singaporean, and exactly the compensatory testing MAS expects of third-party AI.

One slide: *how we meet MAS's third-party AI expectations on day one.*

---

## 13. Evidence plan

The win condition. No 2025 finalist published a measured error rate. And Zurich published what made the Sixfold pilot work — start where the human already knows the answer so errors get caught, build an accuracy harness that reports back to Zurich, name the governance framework, publish a hard number. Mirror all four.

**Status, stated before the plan, so the plan is not mistaken for the position.** The
harness is built and runs (`eval/harness.py`). The labelled set below **does not exist**.
What exists today is one bundle with two label files: a regression baseline derived from
engine output, which the harness excludes from every reported figure, and one
independently derived label covering the ten assertions with objective ground truth.
Everything from "Test set" onward in this section is the plan, not the result. See §10.5
for the three things we can actually show a judge.

**Test set, planned.** 60–100 bundles: base wording, schedule, at least one endorsement, across property, business interruption, liability and work injury. Stratified by native versus scanned versus photographed, with and without a conflicting endorsement, with and without an exclusion write-back. **Current count: 1 bundle.** The bundle loader is no longer the blocker — `POST /api/bundle` and `pipeline.run_bundle()` accept arbitrary documents, so any bundle can now be run end to end. The blocker is the reviewer.

**Provenance, declarable under clause 9.6.** LMA model wordings via the Lloyd's Wordings Repository, where the LMA states its model wordings are illustrative, use is not restricted to members, and it does not protect its IP rights over them. Plus insurers' publicly published Singapore wordings and IPIDs — we have already proven this route works. ContractNLI and CUAD are CC BY 4.0. **InsuranceQA is research-use-only and unsuitable. LegalBench is per-task licensed and cannot be declared under one label.** Real client bundles stay in a private holdout.

**Metrics, headline first.** Clause accounting completeness. **Exclusion false-negative rate.** Authority-resolution accuracy, with detection and resolution reported separately. Verbatim fidelity at cited offsets plus page accuracy — which cannot be substituted with OCR character error rate, since arXiv:2605.00911 found high OCR accuracy failing to produce good downstream retrieval. Citation precision and recall on ALCE definitions. Risk–coverage curve, with abstention rate and abstention *correctness*. AUPR and precision at 80% recall.

**New metric, from §5.1: evidence-class distribution.** What share of findings are PROVEN versus DECLARED versus UNESTABLISHED, per bundle. A product that is mostly UNESTABLISHED is honest and not yet useful; publishing the ratio is how we prove the design works and how we measure improvement.

**Ablations.** OCR degradation curve. Native versus scanned on matched documents. Retrieval versus long-context versus none, since the Quebec insurance benchmark found retrieval regressing strong models. Position sensitivity, because the operative exclusion sits mid-document.

**Error typology:** fabricated quote, misgrounded quote, misattributed quote, wrong authority, missed exclusion, unnecessary abstention.

Human adjudication on 200+ assertions with two raters and reported agreement. **Preregister, publish the labels**, and report our rate against Stanford's 17–33%. Also measure the sign-off loop — how often the adviser overrode us, and in which direction. An adviser who never overrides is evidence the control is not working.

**The comparison to Stanford's 17–33% is only available once the reviewer exists**, and
only for a metric of matching scope. That figure covers open-ended legal research, which
is dominated by the constructional judgements this engine deliberately refuses to make.
Setting our citation-fidelity rate or our objective-subset agreement beside it would be
comparing a narrow number to a broad one to our own advantage — the exact move the
product's whole argument is against. The harness's `claim_language` field prints the
sentence the current evidence supports; use it verbatim.

---

## 14. Scope boundaries

We will **not**: replace a broker, adviser or underwriter; give definitive advice or state whether a claim will be paid; recommend or rank products or calculate premium; **benchmark a policy against market pricing**, which needs a comparison corpus we do not have; **build a competing intermediary portal**, because Zurich already runs Edge Assist in this region and we feed it instead; connect to live insurer systems, bank accounts, accounting platforms or government registries in the MVP; match SMEs to advisers without a verified directory; perform **cross-carrier wording comparison**, which needs a corpus we have no right to hold; aggregate Mode A data into any book-level view; analyse every line, jurisdiction or format; claim hallucination has been eliminated; train on customer documents; assert that a warranty or condition precedent has been **breached**; or put a number on an exposure whose basis is UNESTABLISHED.

**Demo-risk rule.** The model may classify, extract and phrase. If output is unstable, fall back to a written template. Nothing consequential depends on generation.

---

## 15. Roles

| Owner | Scope |
|---|---|
| **Preran** | Layer 3 — precedence resolver, settlement arithmetic, evidence-class assignment, abstention gate. Architecture. Presents the technical case |
| **Shamanth** | Evidence plan end to end — test set, metrics harness, ablations, risk–coverage curve, evidence-class distribution |
| **Shreya** | Layers 1–2 — ingestion, span anchoring, clause accounting, unaccounted bucket. Plus the PDPA architecture: redaction at ingestion, data intermediary agreement, sub-processor register |
| **Shashank** | The record and the trust architecture — append-only store, consent-as-pull, the no-violations-table schema, disclosure log. Plus the thesis and the pitch narrative he authored |
| **Chithsukhi** | Product workflow and journey, Review Brief format, output-state discipline, consent language, adviser workspace, feature prioritisation |

**The binding constraint is labelling, not code.** The engine is buildable. A correctly labelled test set — governing provision identified, average applied on the right basis, warranty distinguished from condition precedent — needs someone who can do insurance. A domain reviewer named on the roster remains the highest-leverage action available, and the roster freezes at registration.

---

## 16. Build order

```
Vanilla HTML/JS  SME workspace: document upload, change events, graded findings,
                 evidence drawer, granular consent
                 Adviser view: disclosed brief only, gated on live consent
FastAPI/Python   L1 ingest + span anchoring  ·  L2 accounting + unaccounted
                 L3 precedence + arithmetic + evidence classes  ← pure code
                 L4 brief assembly, consent, case state machine, audit log
SQLite           case · evidence · span · disclosure · audit  (no violations table)
```

**The front end is vanilla, and that is a decision rather than a shortfall.**
`proven/web/` is `index.html`, `app.js` and `styles.css` — zero npm dependencies, no
build step. An earlier revision of this document said React; it never was. For a
four-minute demo there is nothing to install, nothing to compile and nothing that can
fail on a borrowed laptop. `tests/test_frontend.py` enforces the trade-off, asserting
that every JS selector exists in the markup, every wired button exists, and every
fetched path is a real route — which is the class of breakage a framework would
otherwise catch for us.

Build **L3 first**, on hand-built evidence, because the arithmetic is the demo. Then L2, then L1, then L4. Building ingestion first is how teams arrive at Demo Day with a parser and no product.

**Cut line if behind:** drop the adviser workspace and build the book-level view as a designed screen rather than live code. Keep ingest → accounting → arithmetic → evidence grading → Review Brief. That is the whole argument. A clearly-labelled static mock of the Mode B drift screen is worth more in the deck than three more working SME features, and it costs an afternoon of design rather than a day of code.

**Native PDF only for the demo.** No OCR on stage. The stratified scanned-and-photographed testing in §13 is the evidence plan, not the demo path; arXiv:2605.00911 is precisely why we do not want an OCR failure deciding whether a citation lands. Say "OCR is in the harness, not in the demo" and move on.

### 16.1 Data model — the highest-leverage artefact in the build

Two stores, per §9. Write this schema first; everything else is a function over it.

```sql
-- ── SOURCE LAYER (immutable) ────────────────────────────────────────────
document(id, business_id, kind, author_class, filename, sha256,
         page_count, ingested_at)
   -- kind: BASE_WORDING | SCHEDULE | ENDORSEMENT | PROPOSAL | CPF_RECORD
   --     | WORK_PASS_LIST | TENANCY | COI_REQUIREMENT | ACCOUNTS
   --     | SUPPLIER_INVOICE | RCA_REPORT
   -- author_class: INSURER | AUTHORITY | THIRD_PARTY | SELF   ← drives grading
page_text(document_id, page_no, text, extraction_method)      -- never mutated
text_fix(document_id, page_no, char_start, char_end, corrected)-- parallel layer

-- ── ACCOUNTING LAYER ───────────────────────────────────────────────────
span(id, document_id, page_no, char_start, char_end, quoted_text, sha256)
provision(id, document_id, span_id, taxonomy_code, status, authority_rank)
   -- status: CLASSIFIED | UNACCOUNTED
   -- taxonomy_code null iff status = UNACCOUNTED
   -- authority_rank: ENDORSEMENT=1 SCHEDULE=2 BASE=3 PROPOSAL=4

-- ── COMPUTATION LAYER ──────────────────────────────────────────────────
operand(id, case_id, name, value, unit, span_id, evidence_class)
   -- evidence_class: PROVEN | DECLARED | UNESTABLISHED  (derived, never typed)
finding(id, case_id, rule_id, output_state, evidence_class,
        headline, resolution_path, created_at)
   -- output_state: DOCUMENTED | NOT_CONFIRMED | INFORMATION_MISSING
   --             | REQUIRES_AUTHORISED_REVIEW
finding_operand(finding_id, operand_id)
finding_span(finding_id, span_id, role)   -- role: TRIGGER | EVIDENCE | GOVERNING

-- ── CASE (transient, SME-scoped, deletable) ────────────────────────────
case(id, business_id, opened_at, state, deleted_at)
disclosure(id, case_id, recipient, fields, granted_at, expires_at, revoked_at)
audit(id, actor, action, object_type, object_id, at)

-- ── RECORD (portable, append-only, established facts only) ─────────────
record_fact(id, business_id, attribute, value, unit,
            basis_document_id, basis_span_id, author_class,
            as_at_date, appended_at, prev_hash, hash)
-- NOTE: no violation / breach / deficiency / score column exists anywhere
-- above. That absence is the guarantee in §9. Do not add one "temporarily".
```

Three properties fall out of the schema rather than out of discipline. `evidence_class` on an operand is **derived** from `document.author_class`, so it cannot be overstated by a developer in a hurry. `finding` lives only under `case`, so deleting the case removes every negative finding. And `record_fact` is hash-chained and has nowhere to put a black mark.

### 16.2 Rule format — declarative, testable, versionable

Every compulsion trigger and every arithmetic check is a data file, not code. This is what lets Shamanth test them, Shashank version them, and a domain reviewer read them without reading Python.

```yaml
- id: WICA-HEADCOUNT-UNDERDECLARED
  version: 1
  title: Work injury declaration understated against CPF record
  requires:
    - operand: declared_employees
      from: {document_kind: SCHEDULE, taxonomy_code: WIC.DECLARED_HEADCOUNT}
    - operand: actual_employees
      from: {document_kind: CPF_RECORD, taxonomy_code: CPF.CONTRIBUTOR_COUNT}
  test: actual_employees > declared_employees
  output_state: DOCUMENTED
  escalate: false
  cite:
    - authority: MOM
      proposition: >
        Employers must ensure declared headcount and occupational class are
        accurate; wrongful declaration may affect claims.
  consequence_note: WICA non-insurance penalty up to $10,000 and/or 12 months
  deadline: {basis: policy_inception, offset_days: -21}

- id: AVG-ADEQUACY-BELOW-THRESHOLD
  version: 1
  title: Sum insured below the policy's stated average threshold
  requires:
    - operand: sum_insured
      from: {document_kind: SCHEDULE, taxonomy_code: PROP.SUM_INSURED}
    - operand: actual_value
      from: {taxonomy_code: VAL.STOCK_VALUE}      # any source; class derived
    - operand: threshold_pct
      from: {document_kind: BASE_WORDING, taxonomy_code: PROP.AVERAGE_THRESHOLD}
  test: sum_insured < (threshold_pct * actual_value)
  output_state: DOCUMENTED
  compute:
    adequacy_ratio: sum_insured / actual_value
    payout_illustration:
      formula: loss * (sum_insured / actual_value)
      basis: MARKET_CONVENTION          # ← not read from the wording
      label_on_screen: "illustration, formula not stated in policy"
  formula_basis_class: UNESTABLISHED

- id: CP-STATUTORY-COMPLIANCE-PRESENT
  version: 1
  title: Statutory-compliance condition located
  requires:
    - operand: clause
      from: {taxonomy_code: GC.STATUTORY_COMPLIANCE}
  test: clause is present
  output_state: REQUIRES_AUTHORISED_REVIEW
  escalate: true
  never: [assert_breach, assert_classification]
  cite:
    - authority: "Grace Electrical v EQ Insurance [2016] SGHC 233 at [72]"
      proposition: >
        Breach of a statutory-compliance condition precedent barred a
        S$1m liability indemnity; the action was dismissed.
```

`never: [assert_breach, assert_classification]` is enforced in the renderer, not left to prompt wording. A rule carrying that flag physically cannot emit a breach conclusion.

### 16.3 The abstention gate, concretely

For a two-day build this must be deterministic, not a second model:

1. **Span fidelity.** `quoted_text` must exact-match `page_text[char_start:char_end]` after whitespace normalisation. Mismatch → drop the finding, log it, count it.
2. **Boundary check.** The span must fall inside the classified `provision` it is attributed to. Outside → `REQUIRES_AUTHORISED_REVIEW`.
3. **Operand completeness.** Any required operand missing a `span_id` → `INFORMATION_MISSING` or `UNESTABLISHED`. Never substitute a default.
4. **Authority resolution.** If two provisions with the same `taxonomy_code` have different `authority_rank` and the policy's construction clause was not located → emit both, state that precedence could not be established, escalate.

No token probabilities anywhere. Every gate is a string comparison or an integer comparison, which is exactly why it is defensible.

### 16.4 Definition of done, 48 hours

Ship only if all nine hold. This is the checklist, not an aspiration.

1. Three real documents ingest with spans anchored and hashes recorded.
2. Provision count reconciles: classified + unaccounted = detected, and the unaccounted list renders.
3. The three rules above execute end to end and produce findings with evidence spans.
4. `evidence_class` is derived from `author_class` and cannot be set by hand.
5. All four abstention gates fire on a deliberately broken input.
6. Review Brief renders with the accounting header, graded findings, and a searched/not-searched statement.
7. Consent gate blocks disclosure until granted; audit row written.
8. Deleting a case removes findings and leaves `record_fact` intact.
9. Accuracy table produced from the labelled set, however small, with sample size on the slide.

---

## 17. Red team

1. **"Program IQ already does this."** Open with it. §11.
2. **"Qumis, Newfront, Coverwatch, Kayna, Advocate already ship this."** Name all five, Advocate first because it is the best funded and the most recent. Different guarantee, different grading, different documents, different market. We compute from the document's own arithmetic and from statute; they benchmark against market data we do not have and are not claiming. §11.
3. **"LLMs hallucinate 17–33% on legal text."** The answer is stronger than a rate:
   **there is no LLM in this pipeline.** Layers 1 through 4 are deterministic, so there
   is no generation step that could fabricate a clause. What we offer instead of an
   accuracy rate is a citation-fidelity rate — every quotation verified byte-for-byte at
   its cited offsets, 25/25 on the current run — plus the abstention gates, plus the
   honest statement that citation bounds false positives and not false negatives, which
   is why bounded omission is a headline. **Do not offer a general accuracy rate. We do
   not have one** (§10.5).
4. **"Your exposure data is self-declared."** The strongest criticism this design has received, and §5.1 is the answer: findings graded, PROVEN first, filed documents instead of typed numbers, and a refusal to compute without a basis.
5. **"Detection is not the bottleneck."** Cite Allaire honestly at about five percentage points from the one randomised experiment on point. Then compulsion events with deadlines and penalties, and an adviser hand-off that converts a finding into a bind. And the cyber data as proof education fails — take-up fell from 38% to 36% while incidents rose from 25% to 27% and awareness fell from 47% to 40%.
6. **"Adverse selection."** The mechanism in §10.
7. **"Chisel AI went bankrupt doing this."** Raise it first. §11.
8. **"This is regulated advice."** §12, including where our opinion ends and counsel's begins.
9. **"Why wouldn't Zurich build it?"** Neutrality and multi-carrier document access, never model capability — Zurich opened a Hyderabad Global Capability Center on 28 April 2026 explicitly for technology and AI. And be precise about the seam: Edge Assist moves the transaction, SME-Check answers a first-purchase question, Program IQ reads master programmes. None of them tells Zurich which existing SME drifted out of adequacy last month. We feed those rails rather than rebuild them.
10. **"You are rebuilding Edge Assist."** No — we are the evidence layer that feeds it. §6 and §11. Getting this wrong is how a good submission ends up competing with the champion's own roadmap.
11. **"Student team, no entity, no customers, and the T&C asks for a market-ready solution."** Do not bluff this. §10.5 is the answer: what exists, what does not, and the three measurements we can actually show. Claimsio won the 2025 SME statement as a two-person team; the bar was deployed-and-evidenced, not Series B. On market-ready specifically, the honest line is: **the input path exists** — a judge can upload their own policy PDF at `POST /api/bundle` and get a Brief, and the intake report names every document it could and could not read — while an entity, a customer, revenue and billing do not.

15. **"Show me it working on a document I give you."** Yes. Upload it. The engine detects the carrier and document kind, reports the clause accounting for that wording, extracts what it can find and abstains on the rest, and names in the intake report exactly which documents it still needs. If the carrier is one nobody has read, it says so and produces no clause-cited finding rather than attributing Chubb's clauses to somebody else's policy.
12. **"Your record is portable in theory only — with one carrier it is a Zurich record."** True today, and §10.4 says so. The neutrality moat is prospective. Phase one is a diagnostic, not a bureau.
13. **"Where is the formula for the average clause?"** In Liberty SMECare, quoted verbatim at p.6 and p.46 — `PROVEN`. Not in Chubb cl 4.2 or MSIG GC12, both of which say "proportionately reduced" and stop; there the conventional arithmetic is shown as a labelled `MARKET_CONVENTION` illustration. §4. The answer is per-carrier because the market is per-carrier, and we can show the page either way. This was an admitted gap in an earlier draft; three-carrier reading turned it into a demonstration of the grading scheme.
14. **"You read one wording and generalised."** The commonest and most deserved criticism of document-AI demos, and the four-scan cross-carrier table in §4 is the answer: average threshold, average formula, declaration clause and unoccupancy count **all diverge across three carriers**, and the unoccupancy count diverges *within* Liberty (30 days in most sections, 7 in another). We did not assume heterogeneity, we measured it. The one clause that is uniform — the premium payment warranty — is uniform because GIA standardised it, and we say that too.

---

## 18. Open items

### Closed since the last revision

| Was open | Resolution |
|---|---|
| Registration deadline uncertain | **14 August 2026, 2359 SGT.** T&C cl 7.3, read from the PDF at `01-competition/tnc-fulltext.txt`. Also cl 7.5: no amendments after the Closing Date |
| Premium Payment Warranty consequence unread | **Read in full.** Cover automatically terminated after 60 days; identical across all three carriers. §4 |
| Theft exclusion clause number unknown | **cl 5.1(c)(i).** Safe to print |
| Average formula unknown | **Resolved per carrier.** Liberty states it verbatim; Chubb and MSIG do not. §4 |
| Only one wording read | **Three carriers, 118 pages**, four targeted topics. `06-evidence/cross-carrier-findings.md` |
| T&C clause numbers came from a summary | **PDF extracted and read directly** |
| No taxonomy | `proven/taxonomy/taxonomy.yaml`, 40+ codes each traced to a real clause |
| No fixtures | `proven/fixtures/`, Hock Lee Foods with 7 planted defects |

### Still open

1. **General accuracy rate.** Still absent, and now correctly scoped rather than claimed. The pitch no longer rests on it: §10.5 leads with citation fidelity (measured, 25/25), agreement on the objective subset (10/10 assertions), and bounded omission (97/13+45/39). The harness refuses to permit an unqualified accuracy claim and exits non-zero under `--require-expert`. Blocked on item 3 below, and item 3 is now the *only* thing it is blocked on — the bundle loader that used to block it is built.
2. **Roster.** Five names or four. Freezes at registration. T&C cl 5.2 permits up to 10.
3. **One named insurance-qualified reviewer.** Binding constraint on the labelled set, and therefore on item 1. Nobody has reviewed any clause reading in this repo. Even one reviewer changes both the pitch and the evidence base.
4. **Is Zurich Singapore an MOM-designated WICA insurer?** Only designated insurers may issue WICA policies. If not, work injury is the credibility hook and property/BI is the conversion path.
5. **Open-source disclosure appendix.** T&C cl 9.6(c) requires the role of each open-source component to be disclosed per component, not merely a licence list. Mechanical, but it is a submission requirement and it does not exist yet.
6. **Read the MSIG and Liberty theft clauses in full.** The forcible-entry corroboration across carriers is currently a keyword count only. Do not claim equivalence with Chubb cl 5.1(c)(i) until read. High value, low effort — it would make the cleanest PROVEN finding market-wide.
7. **JTC standard lease insurance covenant** — unread. Fifteen minutes. Trigger row only.
8. **Standalone Singapore fire policies** — do they still carry electrical installation and fire appliance warranties? Decides whether the physical-verification roadmap is real. Package wordings do not carry them.
9. **Would an underwriter act on third-party verification?** Carriers already accept it from *accredited* certifiers, so this is an accreditation path rather than a yes/no. Roadmap question, not a demo blocker.
10. **How the Review Brief reaches Edge Assist.** Whether Zurich Edge exposes an API or partner integration path via the Zurich eXchange API platform. If yes, "we feed Edge Assist" becomes a concrete integration story rather than positioning.
11. **§12 regulatory claims need inline source references.** The FAA positions are stated without citation to the specific provision.
12. **Re-verify every case and clause citation against the primary document before the deck is final.** Standing rule, not a task. The *Grace Electrical* holding was wrong in an earlier draft because it came from a keyword-scan snippet rather than the judgment's conclusion; the claim that MSIG published no wording was wrong for the same class of reason. Both were caught internally. The full judgment is at `06-evidence/case-law/grace-electrical-fulltext.txt`. Treat any citation not read in full as unverified — that standard *is* the differentiator, so failing it privately is the one error we cannot afford publicly.

**Anti-duplication.** New repository, new taxonomy anchored to ACORD section structure, the LMA clause library, SSIC 2025, RICS reinstatement standards and the WICA schedule. RDTII-AEGIS went to UN ESCAP; clause 12.1(o)(iii) prohibits substantial duplication and 12.1(q) makes it a disqualification. Present the prior work as background IP under clause 14.2. Port no code.

---

## 19. The three sentences

**Problem.** 94.7% of Singapore's 369,500 SMEs employ fewer than 25 people, which makes dedicated insurance expertise economically rare — and where risk cannot be efficiently verified on a S$1,200 premium, cover gets restricted, sub-limited or conditioned.

**Insight.** We read three real Singapore SME wordings and found the same clause type behaving three different ways: Chubb reduces payment below 85% adequacy, MSIG from the first dollar of shortfall, and Liberty carries two average provisions with different thresholds on different bases of settlement. One hardcoded rule is wrong in both directions. None of it is knowable without reading the documents together, and none of it is knowable at all from asking the owner.

**Product.** Proven reads what the business already has, computes what its policy actually pays, grades every finding by the strength of the evidence behind it and refuses to put a number on what is unestablished, states how much of the document it could not account for, and hands a licensed adviser a prepared case — so the business learns what its contract does before the loss, and the carrier learns what it is actually insuring at the same moment.

### 19.1 The pitch, in six words

Do not narrate this document on stage. Narrate this:

| | | |
|---|---|---|
| **1. READ** | the policy and the business documents | native PDF, spans anchored to character offsets |
| **2. PROVE** | every finding carries an evidence class | PROVEN / DECLARED / MARKET_CONVENTION / UNESTABLISHED, derived from who authored the document |
| **3. CALCULATE** | deterministically, what the policy actually pays | no model in the consequential path; order read from cl 3.12 |
| **4. ABSTAIN** | where the evidence or the law does not reach | four gates; unresolved precedence escalates rather than guesses |
| **5. ROUTE** | a prepared case to a licensed adviser | consent-gated, granular, revocable |
| **6. REMEMBER** | a portable record of established facts | append-only, hash-chained, exportable, no breach column |

And the one-line framing, which is stronger than leading with AI:

> **Insurance decisions are made from documents. SMEs have no system that tells them
> what their documents actually establish. Proven does.**

The category to claim is **evidence-backed insurance adequacy infrastructure**, not
"insurance AI". The chain is documents → evidence → policy logic → deterministic
settlement → adequacy → Review Brief → adviser action.

### 19.2 The five questions, and the answers

| Question | Answer |
|---|---|
| "Why can't Zurich build this?" | Zurich can build a policy reader — Program IQ already is one. What it cannot ship is carrier neutrality, and a Zurich-issued credential has no value to Allianz, so it has none to the SME. §11 |
| "Why should I trust your calculations?" | No model in the consequential path. Every operand traces to a span in a named document. Unresolved precedence escalates rather than resolving. §6 |
| "What if you miss something?" | The report leads with what we could not account for: 97 detected · 58 classified · 39 unaccounted, quoted on screen. §5.2 |
| "What if the SME gives you false information?" | We never ask for a figure — we read the document that already contains it, and grade by who authored it. Where an operand has no span, we refuse to compute. §5.1 |
| "Why will an SME use it?" | It asks for no insurance knowledge and no typed values. It reads documents they already hold and already filed. §5.1 |

---

## 20. Risk register

Ordered by what would actually kill this. Each row has a mitigation we control.

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **Registration has closed** | Fatal | Verify today. Everything else is contingent on this. |
| 2 | **We cannot produce a measured error rate by Demo Day** | Fatal to the pitch | It is the stated differentiator and red-team item 3 has no other answer. Start the labelled set before the engine is finished; twenty bundles with published labels beats a hundred without. |
| 3 | **No one can label the test set correctly** | High | The binding constraint. A domain reviewer on the roster, or failing that, restrict the labelled set to findings with objective ground truth — CPF against schedule, schedule elections, dates — and say so. |
| 4 | **A citation is wrong on stage** | High | It nearly happened with *Grace Electrical*. Rule: no citation in the deck that has not been read in full from the primary document. §18 item 13. |
| 5 | **Judge names Advocate, Qumis or Kayna and we look derivative** | High | Name all of them first, unprompted, with the specific difference. §11. |
| 6 | **Judge points at Edge Assist and Program IQ** | High | Open with Program IQ; position as the layer feeding Edge Assist. §11. |
| 7 | **The average formula is never found** | Medium | Already handled: it becomes UNESTABLISHED and the discipline beat gets stronger. This risk is priced in. |
| 8 | **Zurich Singapore is not a WICA designated insurer** | Medium | Demo reorders: work injury becomes the credibility hook, property and theft become the conversion path. Check before the deck. |
| 9 | **Demo fails live** | Medium | Native PDF only, no OCR, no network dependency, deterministic engine, pre-recorded fallback. |
| 10 | **"Detection does not sell insurance"** | Medium | Compulsion events with statutory deadlines, plus *Grace Electrical* showing statutory breach forfeits unrelated cover. Concede the Allaire five points honestly. |
| 11 | **Anti-duplication challenge over RDTII-AEGIS** | Medium | New repository, new taxonomy, new data model. Techniques declared as background IP under clause 14.2. §18. |
| 12 | **Scope collapse — five people building nine things** | Medium | §16.4 definition of done, and the cut line. Ship nine items, not fourteen features. |
| 13 | **Underwriters will never act on third-party verification** | Low for the demo | Condition-evidencing needs no discretion; true write-back is roadmap. §18 item 5. |
| 14 | **PDPA exposure from employee data in bundles** | Low if designed | Redact at ingestion, data intermediary contract, no training on customer documents, Singapore residency, named DPO. §12. |

---

*Evidence: `06-evidence/policy-wordings/` holds the downloaded documents and scan scripts. Competitive detail: `05-research/competitive-map.md`. Zurich, regulatory and statistics with an appendix of 32 unverified items: `05-research/zurich-regulatory-singapore.md`. Prior drafts retained: `03-sessions/session-1.md`, `03-sessions/session-2.md`, `merged-spec-v1.md`, `chithsukhi-protection-pulse-solution-idea.md`. Content from external sources was rephrased for compliance with licensing restrictions.*
