# Session 1 — Global FinTech Hackcelerator 2026: Problem Statement Selection

**Date:** 11 August 2026
**Registration closes:** 14 August 2026, 2359 SGT
**Team:** Preran S Gowda, Shreya Belavatha Jayaram, Shamanth M S, Shashank S (VVCE Mysuru, all expected 2027)

---

## 1. The decision

**Go with Problem Statement 03 — Zurich Insurance, "Closing the SME Protection Gap."**

Two independent lines of reasoning point here.

**Competition structure.** Insurtech is the thinnest applicant pool at a festival that skews banking, payments and AI infrastructure. Zurich is also the champion most likely to convert a pilot: they run the Zurich Innovation Championship, and Sixfold (2024 ZIC winner) reached production with Zurich North America underwriters, while CLIMADA shipped a live tool with Zurich Resilience Solutions.

**Team fit.** Preran's RDTII-AEGIS (UN ESCAP RegTech Hackathon 2026) is the closest thing any of you have to an unfair advantage, and it maps onto the hardest part of this problem statement.

| RDTII-AEGIS already does | PS 03 needs |
|---|---|
| Crawls government law portals (Playwright) | Ingest carrier policy wordings, schedules, endorsements |
| Clause extraction from native + scanned PDFs (pypdf + OCR) | SME policies are mostly scanned PDFs and broker emails |
| Maps provisions to a 44-indicator framework, 25 statutes, 3 jurisdictions | Map policy text to a taxonomy of SME perils and coverages |
| Verbatim locking via edit distance | Never paraphrase an exclusion — quote it or say nothing |
| Dual-path verification + authority gating | Schedule overrides wording; endorsement overrides base |
| Mandatory human sign-off (React audit UI) | Licensed intermediary review — the MAS FAA answer |
| Neo4j + Qdrant evidence graph | Traceable exposure-to-coverage diff |
| 593 tests, 68 property-based, mypy/ruff | Verifiable rigour a carrier's compliance team can audit |

The advice-liability objection is the hardest one against PS 03. Telling an SME it is covered when it is not creates liability, and in Singapore that is MAS Financial Advisers Act territory. Your existing architecture is the answer: a system that structurally refuses to assert coverage without a verbatim clause citation, an authority-resolved source, and a human sign-off gate. Most competitors will demo a chatbot that paraphrases coverage confidently.

### Why not the other two

**PS 01 (GXS — unified credit and fraud risk).** Shamanth's Infosys Springboard work is real credit-risk modelling (debt-to-income features, 0.88 ROC-AUC logistic baseline) and Shashank has imbalanced-data classification, but both are junior and built on public datasets. You have no labelled joint credit-and-fraud data, no bank experience, and no model-risk-governance credibility. The field includes Oscilar (Agent Hub, June 2026), TrustDecision, Feedzai, Provenir and Zest AI, plus teams of ex-bank quants. Two objections are close to unanswerable for you: their data is the product and you won't have it, and "continuously learning" collides with MAS model governance.

**PS 02 (Julius Baer — AI private banking).** Highest applicant volume, weakest differentiation, slowest pilot path. No wealth domain on the team, no client data so the demo degrades to a synthetic-persona chatbot, and onboarding is the most KYC-constrained surface in private banking. Oxford Risk won on adjacent ground in 2025, and HSBC went public with Google Cloud on hyper-personalised wealth in June 2026.

---

## 2. What to build

**Lead with the policy side, not exposure inference.** This reverses the generic ordering.

The exposure-inference half (website fingerprinting, registry filings, supplier concentration) is data-access dependent, and you have no Singapore SME data pipeline. Building your weakest half under time pressure invites the "your signals are thin and stale" objection. Put the engineering depth into the auditable gap engine instead, and keep exposure intake to a structured 8-question form plus a few cheap public signals.

**The demo:** upload a real SME policy PDF → extract covered perils with verbatim citations → diff against the declared business profile → output a ranked gap report where every "you are not covered for X" points to the exact exclusion clause and page. Runs offline, on a laptop, on a real document, with no privileged data.

**Roles:** Preran owns the gap engine and presents. Shamanth owns the rule layer and loss quantification. Shreya owns ingestion, validation and the audit trail. Shashank owns exposure intake, the React UI and the demo video.

**Prepare for the cold-company test.** Judges will name a company and ask you to run it live.

---

## 3. Red team — the objections to pre-empt in the deck

Ordered by lethality. The strongest submissions answer the top two on the page rather than waiting to be asked.

1. **Detection is not the bottleneck; affordability is.** QBE attributes low SME take-up to awareness, bandwidth *and cost*. You can improve diagnosis and move zero premium. Answer with a bind-rate number from a pilot, or attach to a moment of forced attention (loan drawdown, tender compliance, tenancy, headcount threshold). Note that your paying customer is probably the broker or carrier who earns on conversion, not the SME.
2. **Adverse selection.** The SMEs who act fastest on a gap report are disproportionately those sensing a claim. You may hand Zurich a worse book. Make the engine two-sided: gap detection for the SME, risk-quality signal for the carrier.
3. **Signal coverage on the long tail.** Many SMEs are near-invisible digitally. Report measured profileability on a random SME sample, with permissioned accounting/banking/POS fallbacks.
4. **Policy parsing is a legal judgement.** Advice liability, MAS FAA. State your regulatory posture: a tool used by a licensed intermediary, not an adviser. Report parsing accuracy on a labelled set of real policies.
5. **Zurich may have decided this isn't worth building.** ZRS runs ~60,000 risk assessments a year, human-led and priced for large commercial. Your line: *you do this for large corporates with engineers; we do it for 100,000 SMEs with software.* Know which Zurich SME P&L and which market — their SME footprint is strongest in UK, Switzerland, Germany, US middle market.
6. **Why hasn't a broker done this?** Newfront was built on the real-time-risk-data premise; Belem runs AI coverage-gap audits (reports 95% of audits surface critical gaps). Answer structurally: brokerage commission economics make low-premium SME advisory unprofitable to staff.

### Supporting statistics (treat as table stakes, not differentiation)

- QBE Singapore SME survey: 74% concerned about business-interruption income loss, 23% insured; 72% worried about inventory loss, 29% covered; 72% worried about fraud, 17% covered.
- Hiscox Global Protection Gap Report: 74% of SMEs may lack adequate coverage; 55% missing core covers.
- ABI (Jan 2026): 57% of SMEs use software or cloud services, 29% hold cyber cover.
- NetDiligence via Risk & Insurance: 98% of cyber claims 2020–2024 came from organisations under $2B revenue.
- Gallagher Re: 95.2% of Q1 2026 insurtech funding went to AI-focused companies (~US$1.63bn).

Anyone with a model and the same prompt finds these in ten minutes. They frame the problem; they do not prove you understand it.

### On everyone using the same AI

Crowding of PS choice is a smaller risk than it feels: this is not an ideation contest, submissions require an existing product, and nobody pivots verticals in three days. The real risk is homogenisation of *solutions and decks*. What survives: access (a named design partner), real usage, measured error on a test set you built, a contrarian and specific take, and founder-domain fit. Strip the LLM tells from the writing — no "rapidly evolving landscape," no hedged both-sides paragraphs, no claim without a number or a name behind it.

---

## 4. Terms and Conditions — binding constraints

Read from `2026 Hackcelerate TnC (2025 05 25).pdf`, 11 pages.

**Three that change the plan:**

- **You are eligible; no incorporation required.** Clause 4.1 — open to anyone 18+ with a market-ready solution. Clause 4.2 lists *developers* as a target group. Clause 2.3 invites individuals, entities and teams. The Bootstrapped/Pre-Seed/Seed/Series A and Southeast Asia language on aggregator sites is **not** in the governing document. Clause 5.1 is the real bar: demonstrable ability and track record of building scalable solutions.
- **Teams up to 10 (Clause 5.2), roster frozen after 14 August (Clause 7.5).** Six open seats. If you want an insurance domain member or a Singapore-based member on the team, they must be named on the registration form before the deadline. After that they can only be an informal advisor, which is worth far less to the panel.
- **Anti-duplication (Clause 12.1(o)(iii)) — do not resubmit RDTII-AEGIS.** Content that substantially duplicates a Project or Solution previously entered in *any other competition* is prohibited, and 12.1(q) makes violations grounds for immediate disqualification. RDTII-AEGIS was entered at UN ESCAP. Clause 14.2 protects your ownership of IP created before and during the competition, so reuse the *techniques* (verbatim locking, dual-path verification, authority gating, human sign-off, evidence graph) in a genuinely new insurance-domain build. New taxonomy, new data model, new repository. Present the prior work as background IP you own.

**Money:**

- S$20,000 stipend and S$80,000 prize are both **per team, not per person**. Clause 10.4: Organisers take no responsibility for how you split it. Agree a written split now.
- Stipend is discretionary (8.6) though 10.1 states shortlisted teams "will be eligible." Before tax, wire transfer only, subject to MAS due diligence, KYC and AML on the recipient. 30 days to supply payment details (10.3), acknowledge receipt within 3 days (10.4). Decide now whose account receives it and whether it passes KYC.
- Clauses 9.4 and 15.3: all costs are yours, no reimbursement obligation. Budget flights, visas and accommodation for the in-person programme (11–13 Nov) and Demo Day (18 Nov).

**Deadlines — the T&C does not settle the artefact deadline.** Registration closes 14 Aug 2026 2359 SGT (7.3); late entries rejected (7.4); connectivity and equipment failures are on you (7.6). But Clause 7.1 says registration includes submitting "all required materials via the programme portal," which reads more demanding than the website's "no documents required at this stage." Clauses 9.1 and 9.2 defer the artefact deadline to whatever is published on the website, and Clause 8.1 makes tracking it solely your responsibility. **Confirm the deck/proposal/video deadline in writing with gfh@gftn.com.** Competition window: 2 June – 19 Nov 2026 (7.7).

**Other clauses worth knowing:**

- **Declare all open source** (9.6): licences, rights, and the specific role each component plays. Your stack is dense with it — Ollama, Llama 3.1, Qwen 2.5, BGE-M3, Neo4j, Qdrant, FastAPI, pypdf, Playwright. Build the appendix now.
- **Do not inflate anything** (12.1(j)): misrepresenting work, education, skills or qualifications is grounds for immediate disqualification. Present as a bootstrapped student team with a verifiable competition record. No implied customers or revenue.
- **No MAS or GFTN names or logos** without prior written consent (14.11). Only *winning* participants may publish the fact of participation (14.12), and 8.7 requires protecting competition information. Hold off on announcing your entry publicly.
- **IP licence is a marketing licence, not a tech grab** (14.2): irrevocable, non-exclusive, worldwide, royalty-free, transferable, but expressly non-commercial, for promotion of current and future editions.
- **Back up everything** (9.5, 9.7): Organisers keep submissions with no obligation to return, and disclaim responsibility for lost or corrupted uploads.
- **Reclassification** (8.3): Organisers may move your solution to a different Problem Statement at their discretion.
- **Ambiguity resolves in GFTN's favour** (21.3), at GFTN's sole discretion. Never plan on a generous reading. All Panel and GFTN decisions are final, no appeal (6.2, 8.4). Singapore law, SIAC arbitration (20.1).
- **One team per person** (5.7). English only (8.2). Organiser employees and immediate family barred (18.1).
- Terms can be amended unilaterally by posting to the website (17.1). The filename is dated 2025-05-25 — check the live version before registering.
- Registration form: `forms.gftn.co/gfh2026`. Portal: `hackcelerator.gftn.co`.

---

## 5. Realistic target

Aim for **finalist**, not winner. Up to 20 shortlisted teams (8.5), S$20,000 each, a pitch to 70,000 attendees, Investor Hours and mentorship. That is a large outcome for a student team and is reachable on technical merit — UN ESCAP RegTech 2026, Meta OpenEnv top 800 of 53,000, TiE U runner-up, Infosys national finals.

The S$80,000 win means beating funded companies. Recent winners were operating businesses: Oxford Risk (established UK firm), ActuaViz, Claimsio. Planning around the win will push you to overclaim in the deck, which the panel punishes and which Clause 12.1(j) makes dangerous.

**Honest gaps:** no incorporated entity, no product in market, no customers, no revenue, no insurance domain experience among the four, no Southeast Asia presence. The plan also concentrates on one person's prior work — if Preran is stretched, the differentiation evaporates.

---

## 6. Next 72 hours

1. Email gfh@gftn.com to confirm the deck, proposal and video deadline in writing.
2. Recruit an insurance domain member (broker, underwriter, or SME-association contact) and get them named on the registration form. Highest-leverage action available. Consider a Singapore-based member too.
3. Register at `forms.gftn.co/gfh2026` — early in the day, not at 2350.
4. Agree the prize and stipend split in writing, and nominate the receiving account.
5. Check the live T&C version against the downloaded copy.
6. Start the new insurance-domain build. Do not port the RegTech repository.

## 7. Open questions

- Exact deadline for deck, written proposal and demo video.
- Whether GFTN treats a pre-incorporation student team differently in scoring, even though eligibility is open.
- Which Zurich entity and market to target, and whether a Zurich Singapore SME line exists to pitch.
- Whether any domain member can realistically be secured before 14 August.

---

## Sources

Programme and terms: fintechfestival.sg/global-fintech-hackcelerator; `2026 Hackcelerate TnC (2025 05 25).pdf`.
Research cited above drawn from QBE Singapore SME survey, Hiscox Global Protection Gap Report, ABI (Jan 2026), NetDiligence via Risk & Insurance, Gallagher Re Q1 2026 insurtech funding, Zurich Innovation Championship and Zurich Resilience Solutions materials, Experian and Cifas first-party fraud data, Natixis and Cerulli wealth-transfer data, and MAS/IMDA Shared Responsibility Framework documents. Content was rephrased for compliance with licensing restrictions.
