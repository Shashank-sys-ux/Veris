# Wording corpus — manifest

18 documents retrieved from carrier and government sites. Every file carries
`SOURCE_URL:` on line 1 and the original byte count on line 3, so any claim made
from these files can be re-fetched and re-checked at source.

Page counts below are counted `=== PAGE n ===` markers from the pypdf extraction,
not estimates. Word counts are whitespace-split tokens.

**Filename suffixes are load-bearing.** A document that is not a policy wording
says so in its own name. Nothing in this folder should be cited as a Singapore
policy wording unless the table below classifies it as one.

---

## Class A — real Singapore SME policy wordings

These are full contract documents. Citable.

| File | Carrier | Pages | Words | Notes |
|---|---|---|---|---|
| `sg-liberty-smecare-policy-wording.txt` | Liberty Pte Limited (SG) | 49 | 21,643 | "SMECare — MAY 2025". Most recent full wording held. |
| `sg-msig-sumo-sme-policy-wording.txt` | MSIG Insurance (Singapore) | 41 | 19,479 | Form SMO022401, dated 2024-01. |
| `sg-chubb-selectplus-lite-wording-DUPLICATE.txt` | Chubb (SG), via DBS | 28 | 10,634 | **Duplicate** of the primary wording already verified at `../extracted-text/chubb-selectplus-fulltext.txt`. Retrieved from a different host (dbs.com.sg), which independently corroborates the same document. |

Together with Chubb Select+ this gives **three distinct Singapore carriers** with
full wordings in hand.

## Class B — schedules, proposal forms, factsheets

Real primary documents, but **not** contract wordings. Useful as structural
templates and for corroborating limits; not authority for what a policy says.

| File | Issuer | Pages | What it actually is |
|---|---|---|---|
| `sg-aig-sme-restaurant-food-stall-PROPOSAL-FORM.txt` | AIG Singapore | 8 | **Proposal / quotation form.** Contains "Agent Details", "Producer Code", target-occupation list. This is the document class PROVEN ingests to read *declared* values — valuable as a fixture template, not as wording. |
| `sg-greateastern-bizprotect-restaurant-BENEFITS-SCHEDULE.txt` | **Great Eastern General Insurance** (distributed by OCBC) | 5 | **Benefits/limits schedule**, Standard vs Deluxe plan. Note the underwriter is Great Eastern, not OCBC — do not attribute to OCBC. |
| `sg-great-eastern-bizsupreme-education-BROCHURE-not-wording.txt` | Great Eastern | 3 | Product brochure. |
| `sg-chubb-select-factsheet-fb-DUPLICATE.txt` | Chubb (SG) | 2 | Duplicate of `../policy-wordings/chubb-select-factsheet-fb.pdf`. |
| `sg-qbe-business-insurance-BROCHURE-not-wording.txt` | QBE Singapore | 3 | Brochure, dated 08/07/24. |

## Class C — marketing web pages

No page markers (HTML). Product-existence evidence only.

| File | Words |
|---|---|
| `sg-msig-sumo-WEBPAGE-not-wording.txt` | 1,677 |
| `sg-chubb-select-WEBPAGE-not-wording.txt` | 1,039 |
| `sg-allied-world-sme-WEBPAGE-not-wording.txt` | 1,278 |

## Class D — Malaysia. NOT Singapore.

Retained for regional comparison only. **Never cite these for a Singapore claim.**
Malaysian general insurance sits under a different statute (Financial Services Act
2013) and different market conduct rules. The `MY-` prefix exists to make
misattribution obvious in review.

| File | Carrier | Pages | Words |
|---|---|---|---|
| `MY-aig-sme-fire-and-perils-wording.txt` | AIG Malaysia | 72 | 58,015 |
| `MY-qbe-retail-package-wording.txt` | QBE Malaysia | 35 | 20,961 |
| `MY-qbe-industrial-all-risk-wording.txt` | QBE Malaysia | 34 | 18,404 |
| `MY-aig-all-risks-and-bi-wording.txt` | AIG Malaysia | 32 | 32,176 |

## Class E — statute and practice material

| File | Source | Pages |
|---|---|---|
| `sg-statute-marine-insurance-act-1906-pdf.txt` | AGC Singapore Statutes Online, rev. 31 Dec 2021 | 43 |
| `sg-statute-marine-insurance-act-1906-html.txt` | AGC SSO, HTML | — |
| `sg-chambers-practice-guide-transport-distribution.txt` | Chambers Global Practice Guide | 11 |

The Marine Insurance Act 1906 matters because Singapore's law on warranties and
disclosure descends from it; it is **not** directly the governing statute for an
SME property policy. Cite with care.

---

## What this corpus changed

**Corrected an overclaim.** An earlier draft of `../../README.md` said this folder
held "four more real Singapore SME wordings", naming AIG Restaurant and OCBC
BizProtect among them. That was wrong: those two are a proposal form and a benefits
schedule. The accurate count is **two** new full Singapore wordings (Liberty, MSIG),
plus one duplicate retrieval of Chubb. Filenames and README have been corrected.

**One cross-carrier finding worth keeping.** Theft cover conditioned on forcible or
violent entry appears in Chubb Select+ (cl 5.1(c)(i)), MSIG SUMO, and Liberty
SMECare, and again in the Great Eastern schedule ("Theft and Hold up (1st Loss Basis
by forcible/violent entry)"). So the forcible-entry condition is a **market-wide
pattern across four Singapore insurers**, not a single-carrier quirk. That is a
materially stronger basis for the demo's theft finding than one wording alone.

## Still unverified in this corpus

Nobody has read the MSIG or Liberty wordings clause-by-clause yet. Only the
targeted `forcible|violent` scan above has been run. Specifically not yet checked:

- Whether MSIG or Liberty state an **average/underinsurance formula** (Chubb does
  not — this is the open `UNESTABLISHED` item). If either states one explicitly,
  the demo can stop hedging.
- Whether either contains a **condition-precedent declaration clause** (Chubb does
  not; Grace Electrical turned on one).
- Premium payment warranty treatment.
- Whether "Vacant"/unoccupancy is defined and on what day count.

Running those four scans across the two new wordings is the highest-value hour
available, because each one either removes a hedge from the demo or converts a
single-carrier claim into a market-wide one.
