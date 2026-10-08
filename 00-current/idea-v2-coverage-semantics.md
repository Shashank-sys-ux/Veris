# PROVEN v2 — the upgrade that could not have been built ten years ago

Written 11 Aug 2026 in response to a fair criticism: v1 is a policy checker, and a
policy checker was buildable in 2010. This document says what to change, why it is
genuinely new, what the champion buys, and what is implementable before the deadline.

**Every claim about feasibility below was tested against our own corpus, not asserted.**

---

## 1. Where v1 actually sits against the finalist bar

| | Past winners / finalists | PROVEN v1 |
|---|---|---|
| Idea depth | Claimsio: AI debt-collection workflows. Oxford Risk: behavioural profiling. ActuaViz: structured processing of insurance documents | **On par or better** — we answer insurability, not just resilience |
| Evidence depth | Product metrics, customers | **Better** — 118 pages of three real wordings, page-cited, with a measured self-correction |
| Technical novelty | 2025 theme was literally *AI in Finance*; all three winners shipped AI | **Worse. Regex + a lookup table.** This is the gap |
| Deployment | Live, customers | localhost, no auth |

**The honest diagnosis.** The idea is finalist-grade. The evidence is above the bar.
The engine is below it — not because it is small, but because its central mechanism is
a **hand-built map of clause numbers per carrier**. Three carriers took a week of human
reading. Forty carriers would take a year. That is a 2010 architecture and a judge will
see it immediately.

**The bottleneck is the whole opportunity.** Fix the bottleneck and everything else in
the pitch changes character.

---

## 2. The insight

> **Insurance has a data standard for the envelope and no standard for the meaning.**

ACORD standardises who is insured, the policy number, the premium — the transactional
envelope. It does not standardise what a clause *does to your payout*. Forbes reported
in March 2026 that ACORD XML permits so many optional fields that two perfectly valid
ACORD messages can be functionally incompatible, and that firms struggle to interpret
what the standard even requires. ([Forbes, Mar 2026](https://www.forbes.com/councils/forbesbusinesscouncil/2026/03/11/why-technology-kept-failing-in-insurance-what-actually-had-to-change/) — rephrased for licensing compliance.)

So every wording is a snowflake, and the consequences run all the way down:

- an SME cannot know what they hold
- a broker must read every wording by hand
- a carrier cannot see how its own wording compares to the market it competes in
- **no software can compute across carriers** — which is why every product in this
  category either serves one carrier's paper or benchmarks price instead of meaning

Our own v1 proves the point. We needed a human to read 118 pages to map three carriers.

**The missing layer is coverage semantics: a machine-readable representation of what a
clause DOES, populated automatically from the prose, and verifiable against the source.**

---

## 3. What changes: Propose → Verify → Bind

This is the core architectural change, and it is the whole submission.

```
        UNSEEN WORDING (any carrier, never taught)
                    │
     ┌──────────────▼──────────────┐
     │ 1. PROPOSE   (model, MAY be wrong)                       │
     │    Embeddings + constrained generation propose that a    │
     │    span implements a mechanism. It may ONLY emit a code  │
     │    from the taxonomy, or UNACCOUNTED. It cannot invent   │
     │    a code, and it never sees a number.                   │
     └──────────────┬──────────────┘
                    │
     ┌──────────────▼──────────────┐
     │ 2. VERIFY    (deterministic, MUST pass)                  │
     │    Each mechanism declares the STRUCTURAL SLOTS it       │
     │    requires. The verifier must locate every mandatory    │
     │    slot inside the proposed span, by pattern, in code.   │
     │    No slots -> proposal REJECTED and counted.            │
     │    The model gets no vote on whether it was right.       │
     └──────────────┬──────────────┘
                    │
     ┌──────────────▼──────────────┐
     │ 3. BIND      (only verified alignments become facts)     │
     │    A verified alignment becomes a clause_instance a rule │
     │    may rest on. Everything else stays UNACCOUNTED and    │
     │    quoted. Rules never see a proposal.                   │
     └─────────────────────────────┘
```

**A mechanism is defined by its slots, not by its name.** Under-insurance is:

```yaml
ADEQ.PROPORTIONATE_REDUCTION:
  mandatory_slots:
    comparison_to_value:    a comparison of a sum insured against a value at risk
    reduction_consequence:  a consequence that reduces the amount payable
  optional_slots:
    threshold_pct:          a stated percentage below which it engages
    stated_formula:         the arithmetic, if the wording states it
    settlement_basis:       value / reinstatement / any
  known_names: [Average, Underinsurance, Average Relief, Basis of Settlement,
                Condition of Average, Pro-rata Condition]
```

Chubb calls it **Average**. MSIG calls it **UNDERINSURANCE**. Liberty calls it
**Average** *and* **Average Relief**, with different thresholds. **A clause-number map
cannot find these. A slot verifier can.**

### This preserves the honesty rule exactly

The line was always "no machine-learning model makes a consequential decision." That
line is now *stronger*, not weaker:

- The model does the one thing only a model can do: **propose** that heterogeneous prose
  implements a known mechanism
- A deterministic verifier **disposes** — it must find the structural slots or the
  proposal dies
- Arithmetic, precedence, evidence class and settlement remain untouched code

A rejected proposal is not a failure to hide. **It is the measurement.**

---

## 4. Why this could not have been built ten years ago

| Capability | 2016 | 2026 |
|---|---|---|
| Recognising that "Average", "Underinsurance" and "Average Relief" are one mechanism, from prose alone | Hand-built rules per carrier, or a lawyer | Embeddings + constrained generation over long context |
| Constraining output to a closed code set | Not reliable | Constrained decoding, schema-enforced |
| Reading 40 wordings of 30–70 pages | Weeks of human reading | Minutes |
| Verifying the machine did not hallucinate the alignment | No mechanism | **Structural slot verification against the source span** |

The last row is the one that matters, and it is the part nobody does. Every document-AI
product in this category ships *citation* — proof of what the system said. None ships
*structural verification* — proof that the cited span actually contains the mechanism
claimed. That is a falsifiable guarantee and it needs no domain reviewer to score.

**Honest prior art, stated up front.** An academic benchmark aligning natural-language
contract text to a formal ontology with evidence-linked ground truth and clause-level
excerpts exists — ten simplified **life-insurance** contracts, ontology plus SPARQL,
showing explicit modelling improves gap/overlap diagnosis
([CEUR Vol-4205 paper 10](https://ceur-ws.org/Vol-4205/paper10.pdf)). We are not
claiming to have invented ontology-driven contract analysis. What is new here is
**commercial SME lines, real published wordings rather than simplified ones,
verification of the alignment as a first-class deterministic gate, and a product
surface on top.** Cite this paper in the deck. Being the team that names its own prior
art is worth more than pretending there is none.

---

## 5. Proof it works — measured tonight, not asserted

I built the verifier for one mechanism and ran it across seven wordings — three we had
hand-mapped, and **four Malaysian wordings the system had never been taught.**

```
Mechanism: proportionate reduction for under-insurance
Test: find it WITHOUT knowing what the carrier calls the clause

CHUBB            verified  1  rejected  1   -> threshold 85%
MSIG             verified  2  rejected  4   -> "UNDERINSURANCE", no threshold
LIBERTY          verified  3  rejected  9   -> 85% AND no-threshold variants
MY_AIG_FIRE      verified  2  rejected 10   <- never taught
MY_QBE_RETAIL    verified  5  rejected 10   <- never taught, found "Average"
MY_QBE_IAR       verified  7  rejected 11   <- never taught
MY_AIG_ALLRISK   verified  8  rejected 10   <- never taught
```

**Recall is real.** It found the mechanism in four unseen wordings, and it recovered
Liberty's two variants — the exact thing we got wrong by hand.

**Precision needs work, and that is the honest headline.** `CONTRIBUTION` was
wrongly verified in the QBE industrial wording. Contribution between insurers shares
the phrase "rateable proportion" with average but is a *different mechanism*. The fix
is a discriminating slot: average compares a sum insured to a **value at risk**;
contribution compares it to **another policy**. That is one more mandatory slot and a
negative slot.

**This is the accuracy number the submission has been missing.** Alignment precision
and rejection rate are scoreable **without a domain reviewer**, because the ground
truth is "does the span contain the required structural elements", which a second
reader can check in seconds. We finally have a metric we can defend.

---

## 6. What this unlocks — three surfaces, one engine

### Surface 1 · SME: the diagnostic (v1, unchanged)
What v1 already does, now on any carrier instead of three.

### Surface 2 · Carrier: drift on the in-force book (v1 Mode B, unchanged)
Which policyholders crossed a statutory threshold or fell out of adequacy this quarter.

### Surface 3 · NEW — the market map. **This is what Zurich buys.**

Once alignment is automatic, run it across every published wording in a market and you
get a clause-level competitive map computed entirely from public documents:

```
Singapore SME — proportionate reduction for under-insurance

CARRIER    ENGAGES AT              FORMULA STATED   BASIS
MSIG       first dollar short      no               any
Chubb      below 85%               no               any
Liberty    first dollar (GC4)      YES, verbatim    value
Liberty    below 85% (Relief)      YES, verbatim    reinstatement
+ any carrier whose wording is published

Reading: MSIG is the harshest in this market. Liberty is the only carrier that
tells the insured how the reduction is calculated.
```

For an SME: *"your policy is harsher than four of six carriers on under-insurance."*

For Zurich: *"here is where your wording is a market outlier — on the harsh side you
create claims disputes and complaints, on the soft side you leak margin. You have never
been able to see this because nobody has read the market at clause level."*

**This is not Advocate's product.** Advocate benchmarks **price** against a private
market dataset. This benchmarks **clause semantics** against **public wordings** — so a
judge can verify any cell on stage from a PDF, and there is no dataset moat to buy.

**And it is not cross-carrier wording comparison for resale**, which v1 §14 correctly
ruled out. We publish *mechanism-level positions*, never another carrier's text. That
distinction is what keeps it lawful.

---

## 7. Second upgrade — make abstention productive

Today UNESTABLISHED is a dead end. It is honest and it is useless: *"we cannot value
your building."* A product must say what to do next.

**Convert every unestablished operand into value of information.**

For each missing operand, compute the payout interval across its plausible range, then
rank the missing documents by uncertainty removed:

```
Buildings value — UNESTABLISHED
  Payout on a total loss ranges S$0 to S$420,000 depending on one number
  nobody has established.
  Cheapest document that collapses this interval:
      a RICS-basis reinstatement cost assessment
  Uncertainty removed: S$420,000 of a S$460,000 total exposure interval  (91%)
  -> This is the single highest-value document you can obtain. Get this first.
```

- Deterministic interval arithmetic. No model, no new evidence class.
- Turns three dead findings into a **ranked action list**.
- And it is exactly how an underwriter thinks: not *"is this true"* but *"what does it
  cost me if it is wrong, and what is the cheapest way to find out."*

This single change is what makes the product feel like a product rather than a report.

---

## 8. Third upgrade — the drift clock

Coverage is now machine-readable, so a policy can be diffed against itself over time.

Marsh Singapore makes our argument for us: a fully insured asset at the start of a
policy period **becomes partially insured** as costs move, and the average clause then
engages without anything about the policy changing.
([Marsh Singapore](https://www.marsh.com/sg/services/small-business-insurance/insights/how-the-average-clause-affects-business-insurance-coverage.html)
— rephrased for licensing compliance.)

So: hold sum insured constant, move a published construction or equipment cost index,
and report the date adequacy crossed the threshold. Nothing about the policy changed.
The SME did nothing wrong. They are now under-insured.

**That is a notification nobody currently sends, and it needs no SME input at all.**

Note honestly that Marsh already offers a free protection-gap self-assessment and states
it has helped 15,000+ Asian SMEs. Put them on the competitor slide. The difference is
that a survey asks the owner; we read the documents and the index.

---

## 9. The reframe

**v1:** "we check your policy and refuse to guess."
A tool. Tools do not get funded.

**v2:** **"Coverage has no machine-readable meaning. We build the layer that gives it
one, and we verify every alignment against the source."**

Infrastructure. And every surface follows from it:
adequacy is a query · market position is a query · drift is a diff · portability is
trivial once meaning is structured.

The one-liner to lead with:

> **Insurance decisions are made from documents that no machine can read for meaning.
> PROVEN makes coverage machine-readable — and proves every reading against the page.**

---

## 10. Build plan — what is actually reachable

Ordered by value per hour. **Stop wherever the clock stops; every step ships standalone.**

| # | Task | Hours | Ships? |
|---|---|---|---|
| 1 | `mechanisms.yaml` — slots for the 4 mechanisms already verified (average, premium warranty, unoccupancy, declaration clause) | 2 | yes |
| 2 | `align.py` — Propose/Verify/Bind. Proposal = embeddings or plain candidate windows; **verification is the deliverable** | 4 | yes |
| 3 | Fix the CONTRIBUTION false positive: add `compares_to_value_at_risk` as mandatory, `compares_to_other_policy` as a negative slot | 1 | yes |
| 4 | Alignment metrics: precision, recall, rejection rate across all 7 wordings. **This is the accuracy number.** | 2 | yes |
| 5 | Market map screen — mechanism rows, carrier columns, every cell click-through to the verbatim span | 3 | yes |
| 6 | Value-of-information ranking on the 3 UNESTABLISHED findings | 3 | yes |
| 7 | Drift clock — one published index, one date, one crossing | 2 | optional |

**Total to a transformed submission: ~15 hours. Steps 1–4 alone (9 hours) change the
technical story completely**, because they replace "hand-built map" with "verified
automatic alignment, measured."

### The demo beat this creates — and it is the best one available

> Upload a wording from a carrier the system has never seen. It finds the
> under-insurance mechanism, tells you it engages at the first dollar rather than at
> 85%, quotes the clause verbatim, **and shows you the four proposals it rejected and
> why.** Then it places that carrier on the market map beside the others.

Nothing in v1 comes close to that, and no competitor demo shows a machine being
overruled by a verifier in public.

---

## 11. What must not change

The upgrade is worthless if it costs the discipline that makes the submission credible.

- `evidence_class` stays derived from authorship. A verified alignment is not evidence
  of a *value*; it only says which mechanism a span implements.
- No model touches arithmetic, precedence or settlement. Ever.
- A **rejected proposal is displayed, not hidden.** Rejections are the proof the
  verifier is load-bearing.
- Unverified alignments stay UNACCOUNTED and quoted. The bounded-omission header
  survives untouched.
- The accuracy sentence stays scoped. Alignment precision is **not** a general accuracy
  rate and must never be presented as one.
- Still never assert breach. Still never assert a claim outcome.

---

## 12. Honest risk

- **The false positive is real.** CONTRIBUTION verified when it should not have. If
  step 3 is not done, do not show the Malaysian wordings.
- **Malaysia is not Singapore.** Those four wordings prove the *method* generalises.
  They must never be cited as Singapore market positions.
- **Precision is unmeasured across mechanisms.** We have one mechanism tested on seven
  documents. Say exactly that.
- **This is v2 of a submission due tomorrow.** If time runs out, submit v1 with §9's
  reframe in the deck — the framing alone raises the ceiling, and it is free.
