# Session 2 — PS 03 (Zurich, "Closing the SME Protection Gap"): the solution

**Date:** 11 August 2026
**Inputs:** `session-1.md`; `sff-2026-zurich-ps03-competitive-map.md`; `sff-2026-zurich-regulatory-singapore.md`
**Working name:** **Adequacy** — because *sum insured adequacy* and *indemnity period adequacy* are the exact technical terms for what the product measures. An underwriter hears the name and knows what it does. (Alternates: Payable, Shortfall.)

---

## 1. What the research changed

Three findings force a redesign of the session-1 plan. Read these before anything else.

**The wedge in session-1 is occupied.** "Every gap cites a verbatim clause and page" was commercialised by three parties in the last seven months. Qumis launched attorney-certified agents across 16 lines around July 2026 that ingest whole programmes and return coverage conclusions cited to source wording, and flag uncertainty rather than forcing an answer. Newfront ships a product literally called AI-Powered Coverage Gap Analysis; WTW completed the acquisition on 27 January 2026 and named it on the Q1 2026 earnings call as a tool to scale. Coverwatch raised US$4.5m pre-seed on 23 July 2026 doing gap identification on a flat fee. Nomad Data markets page-level citations on policy binders. If we pitch clause citation as the innovation, an insurance jury names Qumis inside a minute.

**Zurich already built it.** **Zurich Program IQ**, launched December 2025, is an in-house AI that scans sublimits across local and master policies and flags mismatches — Zurich's own stated rationale is that those differences create unseen exposures and open coverage gaps. Scope today is property nat cat inside multinational programmes; Zurich cites 7,500 customers and roughly 8,500 programmes. Zurich also runs Cytora on submission intake (five countries, scaling to 20; digitisation accuracy 70–80% up to 98%) and Sixfold with 200+ Zurich North America underwriters. Do not propose anything resembling submission intake, and do not walk into the room unaware of Program IQ.

**Detection is not the constraint, and there is data proving it.** Singapore SME cyber insurance take-up *fell* from 38% to 36% while incidents *rose* from 25% to 27% and awareness *fell* from 47% to 40%. Availability, price and marketing all improved over that window. Risk education demonstrably does not move this market. Separately, the only randomised field experiment directly on point (Allaire 2016, 364 Bangkok households) found information provision plus social proof raised flood insurance purchase by about five percentage points — real and causal, but small. And Bradt found competence-building "boosts" underperformed nudges on willingness to pay. Our product is a boost. Plan accordingly.

---

## 2. The idea in one paragraph

**Adequacy reads the documents an SME already holds and computes what a claim would actually pay.** Not a coverage checklist — a settlement simulation. Upload the policy bundle plus the handful of non-insurance documents the SME already has (CPF submission, work pass list, lease, tender insurance requirement), and Adequacy returns: *on this loss, this document pays S$X against the S$Y you believe you hold; here is the arithmetic; here are the four provisions that produced the difference, quoted verbatim at the exact page; and here are the three provisions in your bundle we could not account for.* The same pass emits a structured insurability record for the carrier. Zurich's own problem statement says gaps go unnoticed "until a claim is denied." We move the denial forward in time, to a moment when it is still fixable.

---

## 3. The wedge: bounded omission, not citation

This is the defensible technical claim and it is worth understanding precisely, because it is the whole submission.

**Citation is a guarantee about what a system said. It is not a guarantee about what it missed.** When a model asserts "clause 4.2 excludes flood," the citation lets a human verify it in five seconds. When a model finds nothing and stays silent, there is no citation to check. ContractEval (arXiv:2508.03080) measured exactly this: models reporting that no relevant clause exists when one was present. For a coverage product, a false negative reads as "you are not covered for X" — or worse, as silence where an applicable exclusion sat. That is the error that harms the client, and it is the error every competitor's safety story leaves untouched.

So Adequacy makes a different promise. It does not claim to be right. It claims to tell you **exactly how much of your document it could not account for.**

Mechanically: every operative provision in the bundle is detected, classified into a taxonomy slot, and assigned to a settlement effect — or it lands in an **unaccounted** bucket that is surfaced, quoted and counted. The headline output alongside every report is a completeness figure: *214 operative provisions detected, 209 classified, 5 unaccounted — here they are, read them yourself.*

That converts an unfalsifiable accuracy claim into a falsifiable coverage claim. It is the metric an auditor, an underwriter and a compliance officer all already recognise, and it is the honest answer to the finding we cannot argue past — Stanford's preregistered evaluation found purpose-built legal AI research tools from LexisNexis and Thomson Reuters hallucinating between 17% and 33% of the time *with retrieval in the loop*. Our architecture is theirs. Claiming elimination is not available. Bounding omission is.

**Say on stage:** citation grounding constrains false positives and does nothing for false negatives; that is why we measure completeness and report it as a headline rather than an appendix.

---

## 4. Architecture: the model never decides anything consequential

Three layers. The separation is the point, and it is the direct answer to four separate published findings.

**Layer 1 — Locate.** Ingest the bundle. The model's only job is to find and type spans. Every span is anchored to (document id, page, character offset). Original text is preserved immutably; OCR corrections live in a parallel layer so a correction can never break citation fidelity. Multi-hypothesis OCR on poor scans rather than committing to one transcription.

**Layer 2 — Account.** Exhaustive clause partition against the taxonomy, plus the unaccounted bucket. This is Layer 2's entire reason for existing and it is the wedge from §3.

**Layer 3 — Resolve and compute. Deterministic. No model.** Precedence resolution (endorsement over schedule over base wording over proposal; specific over general) is code, and it emits the resolution path as evidence. All arithmetic — average clause proportion, sub-limit caps, maximum indemnity period truncation, deductibles, aggregate erosion — is code. The model does not touch a number.

Why Layer 3 is not a prompt:

- **COMPACT (EACL 2026)** measured frontier models at 34–57% base accuracy on cross-clause reasoning over real contracts involving exception hierarchies and definitional dependencies. Schedule-versus-endorsement precedence is exactly this class of reasoning.
- **arXiv:2510.01228** found that although models are intended to honour hierarchical instruction structures, conflict-detection signals appear internally while consistent resolution does not follow. Telling a model "endorsement beats schedule" is not a mechanism.
- **InsLogicBench (ACL 2026)** found models reaching correct insurance adjudications via unsound justifications, with specific weakness on exception clauses and on verifying absent conditions. Since exclusions *are* exception clauses and our entire product is the justification, scoring only the verdict would look excellent and be worthless.
- **Lost in the Middle (TACL 2024)** plus **Lost in Decomposition (Findings of ACL 2026)**: long-context stuffing degrades mid-document retrieval, while chunked decomposition degrades the context-dependency insurance wordings rely on. There is no free option, so pick one and measure the specific loss.

**The line for the deck:** the language model locates and types text. Precedence and money are computed by code. Everything consequential is deterministic, inspectable and reproducible.

Abstention is a first-class output with a **risk–coverage curve**, framed as selective prediction. Not built on token entropy — arXiv:2603.21172 warns entropy alone is insufficient for safe abstention in high-stakes settings. An independent verifier re-checks the cited span.

**Prior art to cite rather than pretend around:** *Traceable by Design* (arXiv:2605.30995) built a verbatim-grounded pipeline over 4,322 documents producing 20,951 verbatim evidence quotes under three stated principles — verbatim grounding, full traceability, transparency by design. *From Policy to Logic* (AAAI 2026) paired a coverage-aware retriever with symbolic rule reasoning on medical coverage policy review and cut inference cost 44% while improving F1 by 4.5 points. *Towards Robust Legal Reasoning* (arXiv:2502.17638) applied neuro-symbolic methods to coverage queries on insurance contracts and reported guided encoding beating both a vanilla LLM and unguided LLM-to-logic translation. Citing these makes us look read-in. Ignoring them makes us look naive.

---

## 5. Reframe: compliance drift, not coverage advice

This solves three problems at once — the weak boost effect, the advice perimeter, and go-to-market.

Instead of "you have a coverage gap," Adequacy's primary output is: **this document no longer matches a statutory or contractual requirement, as of a dated event.** That is a factual statement about two documents the SME already owns. It is not advice. It attaches to a moment when the SME is already looking at its insurance. And it has a deadline attached.

The evidence that this is the right frame is a competitor's own research: QBE Singapore's head of SME underwriting told the Straits Times (31 July 2025) that most Singapore SMEs buy the insurance mandated by regulatory or contractual obligation and nothing more. That is not our hypothesis. It is a published market fact. It means the route into this segment is the compulsion event.

**Flagship feature — the WICA declaration check.** MOM publishes, in its own guidance, exactly what employers get wrong: they under-declare headcount and mis-state occupational class to their work injury compensation insurer, and they rely on project WIC policies that do not cover company transport or off-site work. MOM warns that wrongful declaration may affect all claims. Both defects are detectable by comparing three documents the SME already holds — the WIC policy schedule, the payroll or CPF submission, and the work pass list. And:

- Work injury compensation insurance is **compulsory** for all employees doing manual work regardless of salary, and all non-manual employees earning $2,600 or less per month.
- Failure to provide adequate insurance carries a fine of up to **$10,000**, imprisonment up to **12 months**, or both.
- Compensation limits **rose on 1 November 2025**: medical expenses cap $45,000 → **$53,000**; permanent incapacity $97,000–$289,000 → **$116,000–$346,000**; death $76,000–$225,000 → **$91,000–$269,000**. Any policy last priced before that date is a live adequacy question.
- MOM instructs employers to provide required information to the insurer **at least 21 days before policy commencement** — an annual, dated, forced-attention event.
- MOM publishes the standard declaration form, which means the correct answer is **objective ground truth**, not a judgement call.
- **34% of Singapore SMEs are not fully informed** about this compulsory insurance, and that figure worsened from 30% in a year, while Hong Kong improved from 24% to 17%.

Nothing else in the research combines objective ground truth, a statutory penalty, a dated limit change and an annual renewal trigger this cleanly.

Handle the PI limits precisely or an underwriter will catch it: the maximum applies only at 100% permanent incapacity and is otherwise prorated; the stated amounts exclude the additional 25% paid for total PI; and the formula is average monthly earnings × age multiplying factor × %PI, with the minimum and maximum acting as a collar rather than as the calculation.

**Second trigger, and it is Zurich's own language.** Zurich's problem statement says gaps "quietly compound as the business grows." Sedgwick observes that firms moving from packaged commercial combined policies (often 24- or 36-month minimum indemnity periods) into bespoke cover frequently end up selecting 12-month indemnity periods, influenced by the premium a longer period costs. That is a growth-induced reduction in cover, invisible on a schedule read at limit level, and detectable from a PDF. It is the literal instantiation of the sentence the judges wrote.

**Trigger backlog, in order of strength:** WICA renewal and the 1 Nov 2025 uplift → migrant worker medical insurance ($60,000 minimum per Work Permit holder, with Stage 2 changes from 1 July 2025 standardising exclusions and introducing age-banded premiums across two bands) → work pass maximum age rising to 63 from 1 July 2025, which interacts directly with those age-banded premiums → tender and contract certificate-of-insurance requirements → lease renewal and reinstatement (JTC runs a joint site inspection about six months before lease expiry) → SSIC 2025 activity code remap, which flowed through Bizfile, Myinfo Business and Entity Data Hub from 9 May 2026.

That last one is also the zero-input onboarding story: an SME's activity code is machine-retrievable from official Singapore infrastructure.

---

## 6. The demo: a denial rehearsal

Three acts, four minutes. Runs on a laptop, on real documents, with no privileged data.

**Act 1 — Account for the document.** Upload a Singapore SME bundle. Show the clause accounting live: N provisions detected, M classified, K unaccounted, with the unaccounted ones quoted on screen. Lead with the number we cannot explain. Nobody else does this and it reframes the entire room's expectation of what an honest AI output looks like.

**Act 2 — Run the loss.** Fire in a leased industrial unit. Show the settlement arithmetic assembling itself: property claim reduced proportionally because the declared value is a 2019 reinstatement figure and the average clause applies; business interruption truncated at month 12 against a 14-month rebuild lead time; debris removal capped by a sub-limit that never appears when a schedule is read at limit level; an alarm-setting condition precedent flagged as unverified. Each number links to the provision that produced it, quoted verbatim at the page. Final frame: *believed cover S$Y, document-implied recovery S$X.*

**Act 3 — Run the compulsion check.** WIC schedule declares 11 employees; the CPF submission shows 14; two of the three undeclared are doing manual work. Quote MOM's own warning. State the penalty. State the renewal date. This is the act that lands with a Singapore jury, because it is checkable and it is law.

**Then one screen for the carrier.** The same pass, same documents: declared versus derived exposure, adequacy ratio per section, control evidence located, and the unaccounted provisions flagged for a human. This is the insurability half of Zurich's sentence, and it is the screen that makes us a Zurich asset rather than a Zurich critic.

**Prepare for the cold-company test.** The judges will name a business and ask us to run it. Act 3 is the one to run live, because MOM's ground truth is public.

---

## 7. Two-sided by mechanism, not by slide

Session-1 correctly identified adverse selection as the second-most lethal objection: the SMEs who act fastest on a gap report are disproportionately those sensing a claim, so we may hand Zurich a worse book. Saying "we'll also be useful to the carrier" does not answer it.

The mechanism does: **the diagnosis is only produced in exchange for the record.** An SME cannot obtain the settlement simulation without generating the structured insurability record that goes to the carrier or intermediary — same documents, same pass, same evidence. Adverse selection is priced rather than absorbed, because the carrier sees what the SME just saw, at the same moment. That is a structural answer, and it is the only kind that survives an underwriter.

---

## 8. Who pays

Not the SME. Three independent lines of evidence converge on an intermediary- and carrier-facing product:

- **The advice perimeter is safest** when the tool states findings and a registered intermediary makes the recommendation.
- **The market buys that way.** 65% of Singapore SMEs prefer buying offline; agent share is *rising* (27% → 29%) while aggregator share is *falling* (16% → 13%); reliance on intermediaries increased at every touchpoint in the buying journey **except when asking questions**. That single exception is precisely the gap a self-serve diagnostic fills without displacing anyone.
- **Zurich Singapore distributes through brokers** and created a dedicated broker-focused leadership role in 2025.

Three separate arguments, one product decision. Say that explicitly — converging evidence is more persuasive than any one of the three.

**The economics that make it fundable.** ReSource Pro documented in January 2026 that under staffing pressure agencies have not merely deprioritised small-commercial policy reviews, some have **eliminated them outright**; that roughly 80% of accounts produce about 20% of revenue; and that skipping policy checking does not remove the risk but transfers it onto the agency as aggregate E&O exposure. MarshBerry publishes recurring guidance on formal minimum account thresholds below which producers should decline business. **The task we are automating is the task the industry stopped performing** — a cleaner framing of the protection gap than any take-up statistic, and it points at an E&O budget that already exists rather than a new line item.

**Be unambiguous with the panel about what we are.** Three of the nine judges on the 2025 Demo Day panel were venture investors, so unit economics get scored in the room. Adequacy is a Zurich distribution and risk-quality asset first and a standalone company second. Saying so is better than being caught being vague about it.

---

## 9. The evidence plan — this is the win condition

No 2025 finalist published a measured error rate. Zurich itself published what made the Sixfold pilot work: start with a use case where the human already knows the answer so errors get caught; build an accuracy-reporting harness that reports back to Zurich; name the governance framework you comply with; publish a hard number. All four are within reach and we should mirror all four.

**Test set.** 60–100 bundles, each with base wording, schedule, at least one endorsement, and where available a broker email. At least four lines: property, business interruption, public and employers' liability / work injury, cyber. Deliberately stratified along the axes that break systems — native PDF versus scanned versus photographed; with and without a conflicting endorsement; with and without an exclusion write-back.

**Provenance, which we must declare under clause 9.6 anyway.** LMA model wordings via the Lloyd's Wordings Repository are the defensible route to real market wordings: the LMA states its model wordings are illustrative, that use is not restricted to members, and that it does not protect its IP rights over them. Add insurers' publicly published Singapore SME wordings and IPIDs. RISCBAC (10,000 synthetic bilingual contracts, Quebec motor, from the paper published CC BY 4.0) is a pipeline smoke test, not an evaluation set. ContractNLI and CUAD are CC BY 4.0 and give us a proxy task shape. **InsuranceQA is research-use-only — unsuitable for a competition entry. LegalBench is per-task licensed, so it cannot be declared under one label.** Real client bundles stay in a private holdout that never appears in anything published.

**Annotation.** Two independent annotators per bundle with a documented adjudication step, and report inter-annotator agreement. Ground truth per (bundle, peril) is a ContractNLI-style triple — Covered / Excluded / Not addressed — plus character-offset evidence spans, page numbers, and the governing document in the authority hierarchy.

**Metrics, headline first:**

1. **Clause accounting completeness** — the wedge. Provisions detected, classified, unaccounted.
2. **Exclusion false-negative rate** — the share of cases where an applicable exclusion existed and we surfaced nothing. Headline, not appendix. This is the harm that matters and the one citations cannot catch.
3. **Authority-resolution accuracy**, with conflict **detection** and conflict **resolution** reported separately.
4. **Verbatim fidelity** — exact-match rate of the quoted string at the cited offsets, plus page-reference accuracy. This is what makes the no-paraphrase promise falsifiable, and it cannot be substituted with OCR character error rate: arXiv:2605.00911 found high OCR accuracy failing to translate into downstream retrieval performance because structural and semantic errors bite at low CER and WER.
5. **Citation precision and recall**, using the ALCE definitions, reported separately from correctness.
6. **Risk–coverage curve**, plus abstention rate and abstention *correctness* — an abstention that hides a real exclusion is a failure, not a safe default.
7. **AUPR and precision at 80% recall**, per CUAD, so the operating point is visible.

**Ablations:** OCR degradation curve (ECIR 2020 found significant retrieval impact from around a 5% error rate — a concrete reference point); native versus scanned versus photographed on matched documents; retrieval versus long-context versus none, because the Quebec insurance benchmark (arXiv:2603.07825) found RAG lifting weak models by 35+ points while causing catastrophic regressions in others; and position sensitivity, since the operative exclusion is usually mid-document.

**Error typology**, borrowed from Magesh et al. because different buckets need different fixes: fabricated quote, misgrounded quote, misattributed quote, wrong authority, missed exclusion, unnecessary abstention.

**Human adjudication** on at least 200 assertions under the AIS protocol with two raters, reporting agreement with the automatic scorer. Godbole & Jia found factuality metrics disagreeing with each other and biased against outputs drawing on distant parts of a source — and an exclusion and its write-back can sit forty pages apart.

**Preregister it and publish the labels.** For a panel of insurance and banking experts, a preregistered evaluation with published labels is a stronger signal than any headline accuracy number. And report our measured rate *against* Stanford's 17–33%. Knowing the failure literature is exactly what an underwriter is assessing when they assess a vendor.

---

## 10. Regulatory posture — a strength, if stated precisely

The perimeter is not our problem, and most teams will either ignore it or over-claim.

**Licensing.** A tool that reads an SME's own general insurance documents and states findings sits outside the Financial Advisers Act, because the FAA regulates advice on investment products and general insurance is not one. It sits outside the Insurance Act intermediary regime provided it does not arrange or solicit. Brokers acting for policyholders register with MAS under the Insurance Act; general insurance agents acting for insurers register with the General Insurance Association of Singapore. **No sandbox is needed — there is no licensing requirement to be relieved of.** Knowing what a sandbox is *for* is a better signal than having applied to one.

Two design rules keep us there: output findings, never recommendations; never touch premium, application or commission. *"Your indemnity period is 12 months; your stated fit-out lead time is 7 months and supplier lead time is 9 months"* is two facts. *"You should extend to 24 months and buy from Zurich"* is not. Note also that MAS's Financial Advisory Guidelines were framed with online and software tools explicitly in mind, so "we're just a tool" is not a defence on its own.

**Get one thing in writing from counsel:** the FAA statutory definition of "investment product." It is the load-bearing assumption of the whole position.

**The real constraints.** PDPA, and MAS's AI and third-party expectations flowing to us contractually through Zurich.

- **Architect for PDPA data intermediary status.** Under a written contract, a data intermediary is exempt from PDPA Parts III–VI except the protection and retention obligations, with consent, notification and purpose limitation staying with the controller. That is a deliberate architectural choice, and **training on customer documents breaks it.** Decide now: we do not train on client documents.
- **Redact at ingestion.** A WIC schedule carries employee names and occupations; a motor policy carries named drivers; proposal forms carry director details. If we only need headcount, occupational class and wage roll to test WICA adequacy, strip names before they reach the model. This answers the question we will be asked — *the SME consented, but its 14 employees did not* — and it is a conversion feature, not a compliance line. Singapore SME AI-privacy concern went from 10% to 66% in a single year, and security-breach anxiety from 15% to 51%. We are asking exactly those firms to upload exactly those documents.
- **Appoint a DPO.** Required under PDPA s.11(3). Costs nothing, including pre-revenue.
- **Cite the current MAS material, not the obvious one.** Most teams will cite the December 2024 AI Model Risk Management information paper. The current word is the **MAS AI Risk Management Operationalisation Handbook, 20 March 2026** — Project MindForge phase two, built with 24 banks and insurers, covering traditional, generative and agentic AI — plus the **MAS Information Paper on AI agent governance, 3 July 2026**.
- **Hand over a sub-processor register unprompted.** MAS consulted from 11 March to 20 April 2026 on Third-Party Risk Management Guidelines that will supersede both Outsourcing Guidelines, extend to all third-party arrangements, and require registers submitted to MAS at least semi-annually including material sub-contractors. A Zurich pilot becomes a registrable arrangement and our LLM provider, cloud region and OCR vendor become Zurich's regulatory disclosure. A one-page sub-processor register plus Singapore data residency removes a whole class of objection.
- **Bring test evidence, not intentions.** Run the IMDA GenAI Starter Kit's five risk tests — hallucination and inaccuracy, bias, undesirable content, data leakage, adversarial prompt vulnerability — on the prototype and put the results in an appendix. Free, Singaporean, voluntary, and precisely the compensatory testing MAS expects of third-party AI.

One slide titled *"how we meet MAS's third-party AI expectations on day one"* answers the procurement question that otherwise kills a pilot six months after winning. Almost no other team will have it.

---

## 11. Anti-duplication discipline

Clause 12.1(o)(iii) prohibits content substantially duplicating a project entered in any other competition, and 12.1(q) makes violation grounds for immediate disqualification. RDTII-AEGIS went to UN ESCAP. Clause 14.2 protects IP created before and during the competition, so the *techniques* are ours to reuse.

**New repository. New taxonomy. New data model.** The taxonomy is built on things that did not exist in the RegTech work: ACORD 125/126/140 section structure, the LMA clause library, SSIC 2025 activity codes, the RICS reinstatement cost assessment standard, and the WICA statutory schedule. Present the prior work as background IP we own, and do not port code.

---

## 12. Red team, ordered by lethality

**1. "Zurich already built this — Program IQ."** Open with it, before anyone asks. Program IQ is internal-facing, built for Zurich underwriters, large-account only, single-peril today, and works on master/local structures on Zurich's own paper. None of that describes a Singapore SME with three policies from three carriers and no master programme. The line: *Zurich proved the mechanic works for 7,500 multinational customers; we are asking what that capability looks like for the 369,500 Singapore SMEs with no master programme, no risk manager and no underwriter reading their file.* Acknowledging the incumbent tool converts the panel's strongest objection into our strongest framing.

**2. "Qumis, Newfront and Coverwatch already do citation-grounded gap analysis."** Correct, and we say so by name. We make a different guarantee (bounded omission, §3), to a different user (the SME's own documents, via its intermediary), in a different market (no wording-level analysis found in Singapore or APAC — MSIG Business Plus, Chubb Select+ and AIG SME Package are product portals), with the carrier record in the same pass (nobody found does both halves). That is a go-to-market and guarantee difference, not a model difference. Do not claim technical novelty on clause citation.

**3. "LLMs hallucinate on legal text — 17 to 33%, measured, with retrieval."** The strongest objection and it cannot be argued away, only measured. Answer: the deterministic Layer 3, the abstention gate, our own measured rate against theirs, and the honest statement that citation bounds false positives and not false negatives, which is exactly why we report completeness and exclusion false-negative rate as headlines. If we cannot produce those numbers by Demo Day, this objection lands and we do not recover.

**4. "Detection is not the bottleneck — affordability is."** Cite Allaire honestly at about five percentage points. Then pivot: we do not rely on persuasion, we attach to compulsion (§5), where the SME must act and a deadline exists. And use the cyber data as proof that education fails — take-up fell while incidents rose and awareness fell. Note also that our paying customer is the carrier or intermediary who earns on conversion, not the SME.

**5. "Adverse selection — you will hand Zurich a worse book."** The mechanism in §7, not a slide.

**6. "Chisel AI did exactly this and went bankrupt."** Raise it ourselves. Chisel's automated policy check compared policy against quote and binder — functionally our diff. Founded 2015, won Gold at the very first Zurich Innovation World Championship in 2019, filed an assignment in bankruptcy on 19 April 2022. Why it failed and why that is not us: it was pre-LLM, so it needed supervised extraction per form and the marginal cost of each new wording never fell; and it sold to brokers, who have formal minimum account thresholds for declining exactly these accounts. The category did not fail. That cost structure and that buyer failed. Naming this before the panel does is the most credible thing we can say to a room full of insurance people.

**7. "This is regulated advice."** §10, stated precisely, including where our opinion ends and counsel's begins.

**8. "Why wouldn't Zurich just build it?"** Answer on data access and distribution neutrality, never on model capability — Zurich opened a Global Capability Center in Hyderabad on 28 April 2026 explicitly for technology and AI. The multi-carrier documents sit with the SME, not with Zurich, and a tool that reads a competitor's wording is easier to trust from a neutral party.

**9. "Student team, no entity, no customers."** Claimsio won the 2025 SME problem statement as a two-person team. Every 2024–2025 winner had something running with either named deployments or hard numbers, but the bar was "deployed and evidenced," not "Series B." Our answer is the measured error rate and the procurement pack — evidence a funded competitor probably will not bring.

---

## 13. Roles

| Owner | Scope | Why |
|---|---|---|
| **Preran** | Layer 3 (precedence resolver, settlement arithmetic), architecture, presents | The deterministic core is the differentiator and the hardest part to fake |
| **Shamanth** | The evidence plan end to end — test set, metrics harness, ablations, risk–coverage curve | This is the win condition, so it gets a dedicated owner, not a spare afternoon |
| **Shreya** | Layers 1–2 (ingestion, span anchoring, clause accounting, unaccounted bucket) and the PDPA architecture (redaction at ingestion, DI agreement, sub-processor register) | Ingestion fidelity and the data-protection design are the same problem |
| **Shashank** | Compulsion module (WICA, migrant worker, tender, lease checks against published ground truth), React UI, demo video | Act 3 of the demo is his, and it is the act that lands locally |
| **Fifth seat** | Ground-truth labelling and domain review | See §14 — this is the binding constraint |

---

## 14. Honest weaknesses

**Labelling is the binding constraint, not code.** The engine is buildable in the time available. A correctly labelled test set of real SME bundles — with the governing provision identified and the average clause applied correctly — needs someone who can tell a warranty from a condition precedent. Nobody on the team can do that yet. This is why recruiting a domain member before the roster freezes is still the highest-leverage action available, exactly as session-1 concluded. There are five resumes in this folder for a four-person team; if Chithsukhi is the fifth member, that decision is due before registration closes.

**Zurich Singapore's WICA designated-insurer status is unverified.** Only MOM-designated insurers may issue WICA policies. If Zurich Singapore is not designated, a WICA-adequacy feature generates leads Zurich cannot convert on its own paper — in which case WICA becomes the credibility hook and property/BI becomes the conversion path. **Check MOM's designated insurer list before the deck is written.**

**Cross-carrier comparison is out of scope and we should say so out loud.** Single-bundle diagnosis works from the insured's own documents. Ranking carriers on their exclusions needs a wordings corpus we have no right to hold. Volunteering this makes everything else more credible.

**"Throughout their business journey" needs the re-check loop.** The demo as designed is one-shot. Even a thin implementation of re-assessment on a growth trigger (headcount crossing the WICA threshold, new premises, new supplier, packaged-to-bespoke migration shortening the indemnity period) is required to answer the problem statement as written.

**No real Singapore SME bundles yet.** Public wordings and IPIDs get us to a demo. Consented real bundles are what make the accuracy number mean something.

---

## 15. Before registration closes

1. Confirm the registration deadline and the deck/proposal/video deadline in writing with gfh@gftn.com. Registration is most likely 14 August 2026 2359 SGT; the staging page said 24 July. Verify in a browser today.
2. Decide the fifth seat and name them on the form. The roster freezes at registration.
3. Check MOM's designated insurer list for Zurich Insurance Company Ltd (Singapore Branch).
4. Read the T&C PDF directly — the clause numbers in session-1 came from a summary, and IP and data terms matter.
5. Agree the prize and stipend split in writing; nominate the receiving account.
6. Start the new repository. New taxonomy, new data model, nothing ported.
7. Download the JTC standard lease terms and read the insurance covenant. Fifteen minutes, and it converts an unverified claim into a verified one.
8. Verify the ISO generative-AI exclusion endorsements (reportedly CG 40 47, CG 40 48, CG 35 08, January 2026) against ISO directly. A brand-new, dated, machine-detectable exclusion appearing silently at renewal would be close to a perfect demo — but it is secondary-sourced and must not go on stage unverified.

---

## 16. Numbers that are safe to use

Verified, sourced, dated, Singapore-specific. Full citations in `sff-2026-zurich-regulatory-singapore.md`.

| Statistic | Value | Source, date |
|---|---|---|
| Singapore SMEs | **369,500**, 99% of enterprises | SingStat M600981, 2025 data |
| SMEs employing fewer than 25 people | **337,700 — 94.7%** | MOM PQ 1166, 3 Mar 2026 |
| SME share of enterprise employment | **69%** — *not* 71% | SingStat, 2025 |
| Concerned about business interruption vs insured for it | **74% vs 23%** | QBE Singapore, 18 Mar 2025 |
| Actually suffered a BI income loss in the year | **19%** | QBE, c. Jul 2024 |
| Not fully informed about compulsory work injury insurance | **34%**, worsening from 30% | QBE Singapore, 18 Mar 2025 |
| Cyber take-up, falling while incidents rise | **36%** from 38%; incidents 25% → 27% | QBE Singapore, 17 Feb 2025 |
| Price is the first consideration when buying | **70%**, having displaced suitability in one year | QBE Singapore, 18 Mar 2025 |
| ZRS engineer-led risk assessments | **60,000 per year across 40 countries** ≈ 1,500 per country | zurichresilience.com |

**The 19% versus 23% pairing is the strongest quantitative argument available.** One in five Singapore SMEs suffered a business interruption loss last year; fewer than a quarter were insured for it. Incidence has caught up with take-up. That is not a tail risk being rationally declined.

**Do not use:** "SMEs employ 71% of the workforce" (stale since around 2018; it is 69%). The FIDReC figure of 4,355 claims (FIDReC's own press conference gave **2,646** for FY2024/25). Any "40% of small businesses never reopen after a disaster" figure — FEMA-lineage, contested, and this panel will know. The CILA 43%/53% business interruption figures without attributing them to CILA and flagging the 2017 vintage.

**One statistic that does not exist, and it is an asset.** There is no published Singapore general insurance claim denial rate. The problem statement says gaps surface when a claim is denied. Zurich holds that data. A slide saying *"we could not find a published Singapore denial rate; Zurich's claims data would let us quantify which gaps actually convert into denied claims, and we would target the diagnostic at those"* turns a research gap into a pilot ask that is mutually valuable rather than extractive.

---

## 17. The three sentences

**Problem.** 94.7% of Singapore's 369,500 SMEs employ fewer than 25 people, so nobody's job is reading policy wording — and Zurich's own risk engineers complete 60,000 assessments a year across 40 countries, which is roughly 1,500 per country against 337,700 firms in Singapore alone.

**Insight.** Every AI coverage tool shipping in 2026 promises that its answers are cited. A citation proves what the system said; it proves nothing about what the system missed — and a missed exclusion is the error that costs the SME the claim.

**Product.** Adequacy accounts for every provision in the bundle, tells you how many it could not explain, and computes what a claim would actually pay using code rather than a language model — so the SME learns what its policy does before the loss, and the carrier learns what it is actually insuring at the same moment.

---

*Research files: `sff-2026-zurich-ps03-competitive-map.md` (competitive landscape, distribution economics, six objections), `sff-2026-zurich-regulatory-singapore.md` (Zurich APAC, regulatory perimeter, 19 forced-attention triggers, statistics with an appendix of 32 unverified items). Academic findings summarised inline above. Content from external sources was rephrased for compliance with licensing restrictions.*
