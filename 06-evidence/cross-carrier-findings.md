# Cross-carrier clause findings — three Singapore SME wordings

Four targeted scans run 11 Aug 2026 across the three full Singapore SME policy
wordings held in this repo. Reproduce with:

```
python 06-evidence/scripts/scan_corpus.py all
python 06-evidence/scripts/dump_clause.py <file-substring> <anchor-regex>
```

Wordings scanned:

| Short name | File | Pages |
|---|---|---|
| **CHUBB** | Chubb Select+ Insurance Policy, Singapore, published 07/2020 | 28 |
| **MSIG** | MSIG SUMO Insurance Policy, form SMO022401, dated 2024-01 | 41 |
| **LIBERTY** | Liberty SMECare, May 2025 | 49 |

Brochures, benefits schedules, proposal forms and the four Malaysian wordings were
excluded. They are not authority for what a Singapore policy says.

---

## Headline

**Every one of the four scans found carrier-level divergence.** Not one of the four
clause behaviours is uniform across three wordings, and one of them is not even
uniform *within* a single wording. The one clause that *is* identical across all
three is identical because a market body standardised it.

This is the empirical case for the product. It is no longer an assertion.

---

## 1. Average / underinsurance — the formula

The open item was: Chubb states an 85% threshold and the words "proportionately
reduced" but **never states the arithmetic**. Does anyone state it?

**Answer: Liberty does, verbatim. Chubb and MSIG do not.**

### LIBERTY — General Condition 4 "Average", p.46

> If the property hereby insured under Section 1 shall at the happening of any fire
> or insured perils be collectively of greater value than the sum insured thereon,
> or if the total number of your employees shall, at the happening of any accident
> be collectively greater than that specified in Fire, All Risk, Workmen Injury
> Compensation and Fidelity Guarantee sections, you shall be considered to be
> responsible for the difference and shall bear a rateable proportion of such loss
> **which the said difference bears to the total value of the property insured**,
> number of employees or annual wages as the case may be.

### LIBERTY — "Basis of Insurance" p.6, repeated as "Basis of Settlement" cl 5 p.46

> Payment shall not exceed **such proportion of the loss or damage as the sum
> insured bears to the value of all property** at the time of loss or damage. Each
> item, if any, as declared in the Policy Schedule is separately subject to this
> provision.

That is the average formula stated in words by the insurer:
`payment ≤ loss × (sum insured ÷ value of all property)`.

### MSIG — General Condition 12 "UNDERINSURANCE", p.38

> If any property insured shall at the time of the occurrence be collectively of
> greater value than the sum insured, the amount payable by the Company in respect
> of the loss or damage shall be proportionately reduced.

No arithmetic. **And no threshold** — any shortfall bites.

### CHUBB — cl 4.2 "Average", p.15

> If at the time of Damage the Total Sum Insured represents less than 85% of the
> actual value of the Property Insured under this Section, the amount payable by
> Chubb in respect of Damage to Property Insured under this Section shall be
> proportionately reduced.

No arithmetic. 85% threshold.

### What this changes

| | Threshold | Formula stated? | Evidence class in PROVEN |
|---|---|---|---|
| CHUBB | 85% | No | `MARKET_CONVENTION` illustration only |
| MSIG | **none — any shortfall** | No | `MARKET_CONVENTION` illustration only |
| LIBERTY | **two provisions**: none on a value basis (GC4 p.46); **85% on a reinstatement basis** ("Average Relief" p.7 cl 7, p.26 cl 6) | **Yes, verbatim** | `PROVEN` — insurer-authored span |

### Liberty's second average provision — corrected after external review

"Average Relief", Liberty SMECare p.7 cl 7 and repeated at p.26 cl 6:

> If at the time of reinstatement, the sum representing **85%** of the total
> reinstatement cost which would have been incurred, if the whole of the Insured
> Property had been destroyed, exceeds the sum insured thereon at the time of loss,
> then the Insured shall be considered as being his own insurer for the difference and
> shall bear a rateable proportion of the loss accordingly. Every item, if more than
> one, of this Section shall separately be subject to this condition.

**Read the trigger, not the heading.** It fires when `0.85 × reinstatement cost > sum
insured` — that is, when the sum insured sits below 85% of reinstatement cost. This is
functionally the same test as Chubb cl 4.2, on a different valuation basis. Despite the
name, it is an average condition and not a relief from one. A reader who trusted the
heading would get this backwards.

**What was wrong and why it mattered.** An earlier revision of this file and of
`proven/taxonomy/taxonomy.yaml` recorded Liberty as having **no** average threshold,
having read GC4 and stopped. Applied to a reinstatement-basis claim that would have
removed an 85% cushion the policy actually grants — **over-reporting** every Liberty
insured whose adequacy sat between 85% and 100%. It is the precise mirror of the MSIG
under-reporting error this corpus exists to prevent. It was caught by external review,
not by us.

**Consequence for the engine, now implemented.** Thresholds are stored per clause
instance keyed to `settlement_basis`, never per carrier. Where two provisions could
apply and the documents do not establish which basis governs, the engine **declines to
choose**: the finding escalates to `REQUIRES_AUTHORISED_REVIEW`, both candidate
provisions are reported with their thresholds, and the illustration applies the harsher
threshold so it understates rather than overstates. Five regression tests in
`proven/tests/test_arithmetic.py` fail the build if either provision is lost.

**And it strengthens the thesis rather than denting it.** A single hardcoded threshold
is now demonstrably wrong in *both* directions on real documents: 85% under-reports
MSIG, and no-threshold over-reports Liberty on reinstatement.

Three carriers, three different regimes. A tool that hardcoded Chubb's 85% would
**under-report** every MSIG insured, whose exposure begins at the first dollar of
shortfall. A tool that hardcoded the formula would be asserting arithmetic that two
of three wordings never state.

**Demo consequence:** the average illustration is no longer uniformly hedged. On a
Liberty policy PROVEN can show the formula as a quoted insurer span. On Chubb and
MSIG it stays a labelled illustration. Same engine, different evidence class,
decided by what the document actually says.

---

## 2. Condition-precedent declaration clause

The open item was: Chubb has **no** general declaration clause (zero hits for
"condition precedent" across all 28 pages). Grace Electrical turned on exactly such
a clause. Is Chubb the outlier?

**Answer: yes. MSIG has a sweeping one. Liberty confines it to arbitration.**

### MSIG — preamble p.1, and repeated as General Condition p.36

> ...the due observance and fulfilment of the terms and conditions of the Policy, in
> so far as they relate to anything to be done or complied with by the Insured and
> the truth of the statements and answers in the said Proposal **shall be conditions
> precedent to any liability of the Company** to make any payment under this Policy.

### MSIG — General Condition 17 "CONDITION PRECEDENT", p.39

A discrete, specific condition precedent going to premium-payment history:

> The validity of this Policy is subject to the condition precedent that:
> (a) for the risk insured, the name Insured has never had any insurance terminated
> in the last twelve (12) months due to solely or in part to a breach of any premium
> payment condition; or
> (b) if the named Insured has declared that it has breached any premium payment
> condition in respect of a previous policy taken up with another insurer in the last
> twelve (12) months: (i) ...fully paid all outstanding premium for time on risk...
> and (ii) a copy of the written confirmation from the previous insurer...is first
> provided...before cover incepts.

### LIBERTY — p.39 and p.46

Condition precedent appears **only** as the arbitration precondition:

> The making of an Award by the Tribunal as herein before specified shall be a
> condition precedent to any right of action against the Company.

No general compliance declaration.

### What this changes

| | General declaration clause | Effect |
|---|---|---|
| CHUBB | **Absent** | Breach of a condition is not automatically fatal to the claim |
| MSIG | **Present, sweeping** — every obligation + truth of proposal | Arguably every obligation is a condition precedent |
| LIBERTY | Absent as a general clause; present for arbitration only | Confined |

This is the single most consequential divergence in the corpus, and it lands
precisely where *Grace Electrical Engineering Pte Ltd v EQ Insurance Co Ltd*
[2016] SGHC 233 lands. In that case a general declaration clause was **not treated
as automatically decisive by its label**; the court examined each condition
individually — GC9 was a condition precedent and its breach barred a S$1m indemnity
([72](a), action dismissed at [73]); GC4 was in the same form but was not breached
on the facts ([72](b)).

So: MSIG's preamble looks like it makes everything a condition precedent, and
*Grace Electrical* is authority that **you still cannot conclude that from the
label**. Clause-by-clause analysis is required, citing *London Guarantee v Fearnley*
(1880) 5 App Cas 911 and *Aspen Insurance UK v Pectel* [2008] EWHC 2804 (Comm).

**Demo consequence, and it is the core of the pitch:** a system that answered "does
breach of this obligation forfeit cover?" with a hardcoded rule would be wrong for
Chubb, wrong for Liberty, and *unsafe* for MSIG. PROVEN never answers it. It
identifies the obligation, quotes the clause, flags that the classification is
contested, and routes to a licensed adviser. The corpus now demonstrates why that
abstention is engineering necessity rather than legal timidity.

---

## 3. Premium Payment Warranty — the one uniform clause

**Answer: substantively identical across all three, to the dollar.**

| | Location | Trigger | Consequence | Min premium |
|---|---|---|---|---|
| CHUBB | cl 3.20 | 60 days from inception | cover **automatically terminated** immediately after expiry | S$25.00 |
| MSIG | "PREMIUM PAYMENT WARRANTY", p.41 | 60 days from inception | cover **automatically terminated** immediately after expiry | S$25.00 |
| LIBERTY | cl 14, p.40 (and p.48) | 60 days from Commencement Date | cover **automatically terminated** immediately after expiry | S$25 |

All three carry the same three-limb structure: (a) automatic termination, (b)
without prejudice to liability incurred within the 60-day period, (c) insurer
entitled to pro-rata time-on-risk premium subject to the S$25 minimum. All three
carry the same sub-60-day variant.

The uniformity is not coincidence — this is the General Insurance Association of
Singapore's market-standard warranty, which is why it is reproduced near-verbatim.

MSIG's applies to the whole policy **except** Section 4 Work Injury Compensation.
That carve-out matters: WICA cover is compulsory, so it cannot simply evaporate for
non-payment.

### What this changes

This is the **highest-confidence rule in the entire product**: identical across
three carriers, purely date arithmetic, no legal judgment required, and the
consequence is total loss of cover rather than a reduction. It belongs in Layer 3
as a deterministic computation with `PROVEN` evidence class and no abstention path,
subject only to the WICA carve-out check.

It is also the most valuable finding for an SME. A missed premium instalment on day
61 means there is no policy at all — and nothing in the SME's own records would
tell them.

---

## 4. Unoccupancy / vacancy — day counts diverge, including internally

**Answer: 14 days, 30 days, and 7 days, depending on carrier _and section_.**

### CHUBB
Defined term **"Vacant"** at cl 2.35 (three limbs). Water escape excluded when
premises Vacant **in excess of 14 days** — cl 5.1(b)(v).

### MSIG — General Condition, p.37
Not merely an exclusion but an **avoidance/alteration** provision:

> b) If the building insured or containing the property insured becomes unoccupied
> and so remains for a period of more than **30 days**.

### LIBERTY — p.45, alteration provision
> b) the building insured or containing the property insured becomes unoccupied and
> so remains for a period of more than **30 consecutive days**

### LIBERTY — p.13 and p.30, peril exclusions
> whilst the premises are left without an inhabitant actually in them if the
> premises have been left for a continuous period exceeding **30 consecutive days
> and nights** unless written consent has been obtained from the Company

### LIBERTY — p.31, a different section
> loss or damage happening whilst your premises are left without an inhabitant
> actually in them if the premises have been so left for continuous period exceeding
> **seven consecutive days and nights**

### What this changes

| | Day count | Instrument |
|---|---|---|
| CHUBB | **14** | Defined term + peril exclusion |
| MSIG | **30** | Alteration / avoidance |
| LIBERTY | **30** in most sections, **7** in another | Alteration + peril exclusions |

Two observations, and the second is the sharper one.

1. **Across carriers the count differs by more than 2x** (14 vs 30) and the legal
   instrument differs — an exclusion narrows one peril, an alteration provision can
   affect the policy far more broadly.
2. **Within one Liberty wording the count is 30 days in some sections and 7 days in
   another.** A single insured, one document, two different unoccupancy tripwires.

No SME tracks this. No SME could. And a tool that read one wording and generalised
"14 days" would be wrong for two of three carriers and wrong about part of the third
even after reading it.

**Demo consequence:** the unoccupancy trigger must be resolved per clause and per
section, never per carrier and never globally. This is the clearest justification in
the corpus for `clause_instance`-level storage rather than a per-policy attribute
table.

---

## Effect on the open items

| Item | Before | After |
|---|---|---|
| Average formula unstated | `UNESTABLISHED` across the board | Resolved per carrier: `PROVEN` for Liberty, `MARKET_CONVENTION` for Chubb and MSIG |
| Only one wording read | 1 carrier | **3 carriers** read on 4 targeted topics |
| Premium warranty consequence | Chubb only | Market-standard, 3 carriers, verbatim |
| Vacancy day count | Chubb 14 days | 14 / 30 / 7, diverging across and within wordings |
| "Statutory breach forfeits cover" claim | withdrawn for Chubb | Confirmed unsafe to generalise; MSIG's sweeping clause + *Grace Electrical* explain exactly why |

## What is still not verified

Honesty about scope, since that is the product's whole claim.

- These were **four targeted regex scans**, not a clause-by-clause reading of 118
  pages. Findings are sound for the four topics; the wordings have not been fully
  mapped.
- Only the **hits shown** were read in context. Regex misses paraphrase.
- The theft/forcible-entry corroboration noted in `wording-corpus/MANIFEST.md` was a
  keyword count only. The MSIG and Liberty theft clauses have **not** been read in
  full; do not present them as equivalent to Chubb cl 5.1(c)(i) until they are.
- No insurance-qualified person has reviewed any of this. Every clause above is
  quoted from the extraction and page-cited so a reviewer can check it fast, which
  is the point — but the review has not happened.
- Ligature corruption in the Liberty extraction (`fi`/`ffi` render as artefacts)
  affects display only, not the substance of the spans quoted here.
