# PROVEN / VERIS — demo script

Verified 11 Aug 2026 by running every step and timing it. All timings below are
measured on this machine, not estimated.

**Total: 4 minutes.** Beats 3, 4 and 5 are the argument and never get cut.

---

## Part 0 — the problem statement, clause by clause

> Most SMEs don't know what they don't know. Gaps in coverage against cyber, supply
> chain, and asset risks go unnoticed until a claim is denied or a loss hits — and as
> businesses grow, those gaps quietly compound. How might we use AI to give SMEs a
> clear, real-time picture of their risk exposure and coverage gaps, and guide them to
> the right protection at every stage of their growth?

Every clause has one surface that answers it and one artefact that proves the answer.
Nothing below is a mock-up.

| Clause | Surface | The proof, from the demo bundle |
|---|---|---|
| "don't know what they don't know" | **What we haven't checked** (`/api/blindspots`) | Reports the boundary of its own assessment: 6 risk areas, how many can be spoken to, and the sentence that says what the score leaves out |
| "gaps … against **cyber**" | **Cyber and data** (`/api/cyber`) | Locates **LMA5401 Property Cyber and Data Exclusion** on page 9 of the real Chubb wording and quotes it verbatim. 5 of 6 breach cost heads: nothing responds |
| "**supply chain**" | **Who you depend on** (`/api/supply-chain`) | 4 dependencies, all PROVEN. No BI section ⇒ dependency cover is structurally impossible, so all 10 failure paths are uncovered |
| "**asset** risks" | **Property and assets** (`/api/score`) | Stock adequacy 66.7% against the 85% threshold in cl 4.2; plant and buildings UNESTABLISHED with the missing document named |
| "until a claim is denied or a loss hits" | **If you claim tomorrow** (`/api/scenario`) + **Will it actually pay?** (`/api/warranty`) | Settlement waterfall in Decimal, average applied before sub-limits per cl 3.12, then the S$5,000 deductible |
| "as businesses grow, those gaps **quietly compound**" | **How this crept up** (`/api/compounding`) | 4 dated business changes, 1 followed by an endorsement, oldest gap open **121 days** |
| "use **AI**" | Ask Pulse (`/api/ai/ask`), model-proposed alignment (`/api/ai/propose`), semantic retrieval (`/api/evidence/search`) | A model may propose a clause span; a deterministic verifier binds it. `test_ai_layer.py` asserts no model touches a consequential decision |
| "**real-time** picture" | Sentinel (`/api/sentinel`), Discovery (`/api/discovery`), Scheduler | Live calls to data.gov.sg rainfall, SingStat M211251 and the ACRA register, each falling back to a **labelled** fixture |
| "guide them to the right protection **at every stage**" | **Protection for your stage** (`/api/stages`) | Placed at SCALING from documents. 6 protections expected, 2 held, 3 absent, 1 indeterminate — with STATUTORY and MARKET_CONVENTION never merged |

### The one thing to say out loud

The `digital` score dimension shipped for two versions with **no rules attached**. It
rendered as a labelled row on the owner's screen, so it looked like something being
watched, while being incapable of ever reporting anything. And because the overall score
averages only *assessed* dimensions, the score was **higher** because cyber had never
been examined.

That is the problem statement, reproduced inside our own product. We found it by
building the blind-spot register, we fixed it by wiring cyber to real rules, and
`test_every_declared_dimension_can_actually_be_assessed` now fails the build if any
dimension is ever left unfillable again.

**Demo order:** Blind spots → Cyber → Dependencies → Compounding → Stage roadmap. That
sequence is the problem statement in order, and each screen hands the next one its cue.

---

## Before they walk in (5 minutes, do it once)

```powershell
cd E:\SFF\proven
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Then, in order:

```powershell
# 1. Prove the build is green. Say the number out loud during the demo.
python -m pytest -q
#    expect: 1017 passed, 5 skipped (1022 collected). Takes ~9 minutes — run it before,
#    not during. The old figures in this file (163, 617) were from earlier builds on
#    other machines; verified on this one 19 Aug 2026.

# 2. Start the server and LEAVE IT RUNNING in its own terminal.
python -m uvicorn proven.api:app --app-dir src --port 8077
```

Open a second terminal for the evaluation commands, and a browser at
**http://127.0.0.1:8077**

**Critical: load the page once before they arrive.** The first `/api/brief` parses the
28-page wording and takes **3.5 s**. Every request after that is **0.01 s**. Do not let
a judge watch the cold start.

Have these two ready in a file explorer window, because you will drag them in:

| File | Use |
|---|---|
| `06-evidence\policy-wordings\chubb-selectplus-wording.pdf` | the known carrier |
| `06-evidence\policy-wordings\aig-sg-homes-advantage-wording.pdf` | **the unseen carrier — this is the best moment in the demo** |

**Fallback if anything fails:** the pre-loaded demo bundle is one click away —
`Reload demo bundle`, top right. Have a screen recording as a hard backup.

---

## The 4-minute run

### Beat 0 · 0:00–0:15 — Frame it before you show anything

> "Insurance decisions are made from documents. A small business has no system that
> tells them what their documents actually establish. That's what this does."

Do not say "AI-powered" in the first sentence. The differentiator is the opposite.

---

### Beat 1 · 0:15–0:35 — Their documents, not a form

**Screen:** "Your documents" card, top of page.

**Do:** drag `chubb-selectplus-wording.pdf` onto the dropzone. Point at the file list.
Click **Analyse my documents**.

**Say:**
> "No questionnaire. No 'estimate your stock value'. It reads the policy they already
> have. Twelve documents, 20 MB each, native PDF only — and it tells you when a file
> is a scan with no text layer instead of guessing at it."

*(~2 s on a 300 KB file. The intake report appears underneath with the detected kind,
the detected carrier, and page count.)*

---

### Beat 2 · 0:35–1:00 — Lead with what we could NOT read

**Screen:** "Accounting" card. Three numbers.

```
97 detected   ·   58 classified   ·   39 unaccounted
```

**Do:** expand **"Unaccounted (39, quoted verbatim)"**.

**Say:**
> "Every competitor shows you what it found. We start with what we couldn't account
> for — all 39, quoted, so you can read them yourself. A citation proves what a system
> said; it proves nothing about what it missed."

Then point at the split:
> "58 classified is 13 hand-verified plus 45 by keyword. We report those separately,
> and the keyword ones **feed no finding**. Shrinking the unaccounted bucket is not the
> same as being able to reason about a clause."

**This beat buys you credibility for everything after it.** Do not rush it.

---

### Beat 3 · 1:00–1:45 — PROVEN findings first

**Screen:** "Findings" card. Set the class filter to **PROVEN**.

**Point at the theft finding:**
> "Theft is only covered where there was violent or forcible entry — clause 5.1(c)(i).
> Their schedule doesn't elect Additional Extension 2.17. So shoplifting and employee
> theft are outside cover. Two insurer-authored documents, zero input from the owner.
> That's why it's graded PROVEN."

**Then the WICA finding:**
> "Their work injury schedule declares 11 employees. The CPF contribution record shows
> 14. That's a government record against an insurer record — neither is the owner's
> opinion. Penalty is up to $10,000 and 12 months, and MOM wants the declaration 21
> days before commencement."

Click the evidence drawer on any finding to show the **verbatim quote, page number and
character offsets**.

---

### Beat 4 · 1:45–2:30 — The money, honestly

**Screen:** the average finding.

```
Stock sum insured   S$100,000   (schedule — PROVEN)
Stock value         S$150,000   (their own accounts — DECLARED)
Adequacy            66.7%       below the 85% threshold
Illustration        S$35,000
```

**Say:**
> "On a S$60,000 stock loss the policy pays about S$35,000. Average first, then
> sub-limits, then the S$5,000 deductible — that order is read from clause 3.12, not
> assumed."

**Now the discipline beat — this is what wins the technical panel:**
> "Notice the label. Clause 4.2 states the 85% trigger and **never states the formula**.
> We searched all 28 pages. So that figure is marked MARKET_CONVENTION, not 'amount
> payable'. It's an illustration, and we say so on the screen."

---

### Beat 5 · 2:30–2:50 — Refusing to compute

**Screen:** scroll to the UNESTABLISHED findings.

**Say:**
> "Buildings. Leasehold, no reinstatement assessment on record. We have no evidence of
> value, so there is **no number here at all** — UNESTABLISHED. Two refusals in a row is
> deliberate: it's what makes every number we *do* show worth trusting."

---

### Beat 6 · 2:50–3:15 — The unseen carrier ★ best moment

**Screen:** back to "Your documents". Drag in `aig-sg-homes-advantage-wording.pdf`.

**Result on screen:**
```
carrier: AIG        carrier_in_clause_map: False
detected 21 · classified 6 · unaccounted 15
verified_classified: 0
```

**Say:**
> "This is a wording the engine has never been taught. It identifies AIG, then tells
> you it has no verified clause map for AIG, classifies zero provisions as verified,
> and states that **no finding rests on this wording's clause references**.
>
> It would have been trivial to apply Chubb's 85% threshold here and produce a
> confident number. That number would be wrong. Showing you the system fail safely is
> the only way to prove the abstention gates aren't decorative."

*(1.8 s on a 761 KB, 13-page file.)*

Then click **Reload demo bundle** to get back to Hock Lee for the last beats.

---

### Beat 7 · 3:15–3:35 — Consent is a pull

**Screen:** "Consent and hand-off".

**Do:** click **Grant disclosure** with *nothing* ticked first.
> "It refuses. Granular means you have to name the documents."

Tick **Schedule** and **Base wording**, click **Grant disclosure**. The adviser view
appears. Point at `findings_withheld_count`.
> "The adviser sees only what was named. Everything else is withheld and counted."

Click **Revoke disclosure**.
> "And it goes away. The database has a `revoked_at` column and an endpoint that
> uses it."

---

### Beat 8 · 3:35–4:00 — The record, and the invitation

**Do:** click **Show record**, then **Download and verify export**.

```
chain_valid: True    fact_count: 5    problems: []
```

**Say:**
> "Established facts only, hash-chained, exportable, and independently verifiable.
> Change one byte and the chain fails — there's a test for that."

**Then click Delete case.** Findings go to zero. The record survives.

**Close on the invitation:**
> "Search that schema for a breach column. There isn't one — no violation, no
> deficiency, no score. It's not a privacy policy, it's the schema, and there's a test
> asserting it stays that way. Delete the case and the negative findings are gone. What
> survives is only what was established."

---

## The other terminal — run these when asked

**"What's your accuracy?"**

```powershell
python -m eval.harness
```

Read the output verbatim. Do **not** paraphrase upward:

> 10 assertions, objective ground truth, precision 1.0, recall 1.0, n=1 bundle.
> `BLOCKED ON: no label carries derivation REVIEWED_BY_EXPERT.`

> "That's a scoped number on objective facts — counts, dates, arithmetic. It is **not**
> a general accuracy rate and I won't compare it to one. The harness physically refuses
> to print a broader claim until a named insurance-qualified reviewer has labelled a
> set. That reviewer is our next hire."

**"How do I know the quotes are real?"**

```powershell
python -m eval.citation_audit
```

> 25/25 spans verbatim at cited offsets. 8/8 inside a cited provision.
> `classified + unaccounted == detected: True`

> "That one needs no domain expert. It says the quotations are real. It does not say
> the conclusions are right, and we keep those two claims separate."

**"Is it just one policy?"** → the "same rule, three real wordings" card, already on
the page:

| Carrier | Average threshold |
|---|---|
| Chubb | 85% |
| MSIG | none — any shortfall bites |
| Liberty | **two provisions, basis-dependent**: value = no threshold; reinstatement = 85% |

> "Same rule, same engine, three real published Singapore wordings, 118 pages. Hardcode
> Chubb's 85% and you under-report every MSIG insured. Read only Liberty's General
> Condition 4 and you over-report every Liberty insured on a reinstatement claim,
> because you've removed an 85% cushion their 'Average Relief' clause actually grants.
> Wrong in **both** directions. That's why thresholds are stored per clause instance,
> not per carrier."

---

## Questions you will get

| Question | Answer |
|---|---|
| "Why can't Zurich build this?" | "They can build a policy reader — Program IQ already is one. What they can't ship is neutrality. A Zurich-issued credential is worth nothing to Allianz, so it's worth nothing to the SME." |
| "Why trust your maths?" | "No machine-learning model touches a consequential decision. Every operand traces to a span in a named document. When precedence can't be established the finding escalates instead of guessing." |
| "What if you miss something?" | "39 of 97 unaccounted, quoted on screen. We lead with it." |
| "What if the SME lies?" | "We never ask for a figure. We read the document that contains it and grade by who wrote it. No span, no number." |
| "Is this AI?" | "It's document intelligence. A model may help *find and label* text — that's on the roadmap with OCR and extraction. A model may never decide what the contract pays. That line is architectural." |
| "How big is this?" | "S$18 per policy per year is illustrative and needs pilot validation. Fully penetrated Singapore SME is roughly S$10m ARR. Marginal cost falls per *wording*, not per policy — every wording parsed makes its whole installed base nearly free." |

---

## Say these, unprompted, before anyone asks

Naming your own weaknesses first is the whole brand. Do it.

- **No entity, no customer, no revenue, no pilot.** Say it plainly.
- **Authentication exists but the business workspace is open.** Three roles (SME / adviser /
  carrier), `role_boundary_enforced: true`, passwords as PBKDF2-SHA256 at 200,000 iterations
  — so do NOT repeat the old line "there is no authentication", it undersells you. What is
  true: `login_required_for_business_workspace` is `false`, so anyone reaching the port gets
  a session. Localhost demo posture, not a production one. Say it that way.
- **Cases do not survive a restart.** In-memory by design for the case; but the portable
  record does not persist either, because `persistence.save_snapshot()` has no call sites.
  `/api/health` reports `persistent: false` and says why.
- **Only three carriers have verified clause maps.** Coverage grows per wording read.
- **No expert-reviewed accuracy rate.** The harness refuses to fake one.
- **Advocate ($18M), Qumis, Coverwatch, Newfront/WTW, Kayna all exist.** Name them
  first, then the difference: they benchmark against market data. We compute from the
  document's own arithmetic and Singapore statute. Ours is checkable on stage; theirs
  needs their dataset.

---

## Do not say

- ~~"98% accurate"~~ / ~~"hallucination-free"~~ / ~~"fully automated"~~
- ~~"PROVEN is not AI"~~ — say "no model makes a consequential decision"
- ~~"S$18 is our price"~~ — say "illustrative, subject to pilot validation"
- ~~"We replace brokers"~~ — the adviser is the routing target, not the competitor
- Never state a claim will or won't be paid. Never say a term has been breached.

---

## If something breaks

| Symptom | Do this |
|---|---|
| Page blank / fetch error | The error banner has a **Try again** button. Use it |
| Upload rejected unexpectedly | Read the per-file reason aloud — it's a feature. Then use the demo bundle |
| Server died | `python -m uvicorn proven.api:app --app-dir src --port 8077`, then load the page once before continuing |
| Port 8077 taken | Use 8123. Port 8080 is blocked on this machine |
| Anything else | **Reload demo bundle**, top right. It restores the full Hock Lee case in 0.2 s |

---

## Measured timings — so nothing surprises you

| Action | Time |
|---|---|
| Page load | 0.02 s |
| First `/api/brief` (**cold — do this before they arrive**) | **3.50 s** |
| Every subsequent brief | 0.01 s |
| Upload 300 KB / 28 pp (Chubb) | ~2 s |
| Upload 761 KB / 13 pp (AIG) | 1.84 s |
| Change events, consent, revoke, export | under 0.02 s |
| Reload demo bundle | 0.20 s |
| Full test suite | ~55 s — run it before, not during |


---

# ADDENDUM — live data, renewal, scenario, agents (added 15 Aug 2026)

This addendum covers the features built after the original script. All backend paths are
covered by tests and were executed against the real APIs on 15 Aug 2026. Test suite is
**1017 passed, 5 skipped** (1022 collected), verified 19 Aug 2026. The "617 passed" figure
this line used to carry was from an earlier build.

## Enable live data before the demo

```powershell
cd c:\Users\Shashank\Desktop\SFF\SFF\proven
$env:PROVEN_LIVE_SOURCES="1"          # real data.gov.sg / SingStat / ACRA / OneMap calls
python -m uvicorn proven.api:app --app-dir src --port 8077
```

Leave `PROVEN_LIVE_SOURCES` UNSET when running `python -m pytest -q` — the suite must run
offline and mocks the HTTP layer instead. With the flag off the app still runs; every
source simply shows a grey **DEMO_FIXTURE** badge instead of a green **LIVE** one.

Check the switch: `GET /api/health` → `external_sources.live_enabled: true`,
`ai.enabled: true`, `ocr.available: true`.

## New click path

### Live agents — "is any of this real?"
1. Sidebar → **Veris Sentinel**. Top card shows a green **● LIVE** badge, the exact URLs
   called (data.gov.sg rainfall + 24h forecast, SingStat M211251), each with an OK
   status and a fetch timestamp. The cost-index signal shows the real year-on-year
   movement of steel reinforcement bars.
2. Sidebar → **Discovery Agent**. Green **LIVE** badge; the ACRA public register was
   queried and the returned entity is grounded verbatim in the fetched JSON.
3. Sidebar → **Drift Over Time**. Index-source card shows the real SingStat series,
   e.g. *"Steel Reinforcement Bars (16-32mm High Tensile) · SingStat M211251 ·
   2025 Jun–2026 Jun"*. Same arithmetic, real input.

> Say: "Three agents, four real Singapore government APIs. When a call fails it falls
> back to a labelled fixture — it never dresses a fixture up as live."

### The claim scenario — the punch in the stomach
4. Sidebar → **If You Claim Tomorrow**. Pick **Total loss**. The screen leads with
   **YOU ABSORB S$238,300** in large red type, then the waterfall: loss capped at the
   sum insured → average clause 66.7% → less deductible → insurer illustration. Every
   line cites the schedule/accounts page it came from.
   - Worked reference figure (loss 300k, SI 100k, VAR 150k, deductible **1,000**) is
     the exact 65,700 / 234,300 in the checklist; the live demo case carries a 5,000
     deductible, so its total-loss figure is 238,300 — the arithmetic is shown in full.
   - Try **plant**: the engine ABSTAINS — *"Cannot calculate from the evidence
     provided"* — because no plant value at risk is on record. It refuses to guess.

> Say: "Same 66.7% adequacy as the score screen. This screen just tells the owner what
> it means in dollars — and it will not invent a number when the evidence is missing."

### What changed at renewal — the differentiator
5. Sidebar → **What Changed at Renewal**. Prior policy → renewal. One **MATERIAL** change
   surfaces at the top: a **Communicable Disease Exclusion** endorsement added at
   renewal, quoted verbatim from the current document with its page, next to the (absent)
   prior term. Administrative changes collapse below; anything unclassifiable is shown
   as **UNKNOWN (escalated)** — never dropped.

> Say: "The premium held, the schedule looked the same, and a category of loss quietly
> left the policy. Nobody else notices this. And when the system can't safely tell what
> a change does, it escalates rather than assuming it's harmless."

### What the agents are doing — legibility
6. Sidebar → **What the Agents Are Doing**. Newest run first, each with a LIVE/DEMO
   badge, the URL it called, facts extracted / grounded / **rejected**. Expand a row to
   see the calls. The **claims discarded** stat is prominent.

> Say: "Anyone can show findings. Showing what the system refused to say — the rejected,
> ungrounded claims — is what proves the grounding gate is real, not decoration."

## Truthful status to state on stage
- **LIVE** (verified 19 Aug 2026 on the demo machine): rainfall, 24h forecast, SingStat
  M211251, ACRA register, OneMap geocoding, and the AI layer (gpt-4o-mini).
- **OCR: now genuinely working, verified 19 Aug 2026.** Tesseract 5.4.0.20240606 is
  installed and `C:\Program Files\Tesseract-OCR` is on the persistent User PATH.
  `/api/health` reports `ocr.available: true` with the version string. Verified end to end
  by rendering a schedule to an image and reading it back: *"Sum Insured (Stock): SGD
  100,000"*, *"Deductible: SGD 5,000 each and every loss"*, *"Average Clause applies to
  this Section"* — recovered exactly.
  - **Vector PDFs now work too.** PyMuPDF 1.28.2 is installed, so a page drawn as vectors
    with no embedded raster is rendered at 200 dpi and read, instead of being reported
    unreadable. `/api/health` reports `rasteriser: pymupdf`, detected rather than asserted.

### NEW BEAT — recovering the illegible endorsement (worth 20 seconds)

Upload `demo-documents\13-illegible-endorsement-scan.pdf`. It has **zero embedded
rasters**, so before this it was simply unreadable. Now:

```
rendered 110 KB PNG · OCR 641 chars · mean confidence 93.2%
CHUBB INSURANCE SINGAPORE LIMITED / MEMORANDUM OF ENDORSEMENT
Policy Number : SG-SEL-2026-HL001   Insured : Hock Lee Foods Pte Ltd
Endorsement No. : END-05            Effective Date : 2026-06-25
"It is hereby endorsed and agreed that the following provision is amended.
 The amended text could not be reproduced electronically because the..."
```

> "We recovered which policy this amends, which endorsement it is and when it took effect —
> at 93% confidence, from a page with no text layer. And the document itself tells us the
> amended wording is not reproducible, so every finding this endorsement touches stays
> provisional. We read what is there and we stop where the page stops."

That is the abstention thesis with evidence attached, which is stronger than abstention
alone. Contrast it with `05-illegible-scan.pdf`, which rasterises fine and returns **zero
characters** — genuinely blank, correctly reported `EMPTY` rather than guessed at.
  - **A bug was found doing this.** `ocr.py` ended its success path with
    `getattr(self, last_conditioning, {})` — attribute name unquoted — raising `NameError`
    on every call that had text to return. So OCR had never produced a result in this
    project's history, and it was invisible because the OCR tests skip without a binary and
    no machine had both at once. Fixed, with a regression test that renders an image and
    asserts a page comes back.
- Nothing here decides coverage. AI proposes and explains; every model claim is
  re-located verbatim in the source or rejected. Deterministic code computes every
  figure. A licensed adviser decides.
