# PROVEN — explained in simple words

Written for someone with no insurance knowledge and no technical background.
Everything here was checked by actually running the software.

**Last verified:** after the product rebuild. 359 tests passing.

**Two things are now true that weren't, and they answer the two hardest questions a
judge asks:**

- **The page starts empty and the example is UPLOADED, not seeded.** "Show me an
  example" fetches the 13 synthetic PDFs and pushes them through the exact same upload
  path your own files take. Nothing is pre-filled on the server — a judge watches
  documents become answers.
- **You can watch the pipeline run.** A processing panel shows each real stage:
  uploading → reading pages → detecting each document → refusing the illegible scan →
  accounting 97 clauses → computing findings. It narrates real output, not a spinner.

---

## PART 1 — The problem

### A story

Ram owns a small food factory in Singapore. 14 staff. He bought business insurance
5 years ago. He pays every year. He has the certificate in a drawer.

Since then he has:
- rented a second unit next door
- bought a big freezer
- hired 3 more people
- started taking orders online

He thinks he is insured. **He is mostly not.**

### Why not

Insurance is a **contract**. It only covers what the contract says, under the
conditions the contract states. Ram's contract was written for the business he had
5 years ago — 1 unit, 8 staff, no freezer, no online orders.

Here is the cruel part: **nothing is hidden.** The answers are all sitting in Ram's
own paperwork. But to find them you must read a 28-page policy *against* his schedule
*against* his staff records — all at the same time.

Nobody at a 14-person company does that. There is no such job.

### Why the insurance company doesn't help

Ram pays about **S$1,200 a year**. An insurance company cannot send an engineer to
inspect his factory for that — the visit costs more than the premium.

So when the insurer cannot check something, they don't refuse Ram. They just quietly
**limit** that part of the cover. Ram never notices, because it's on page 17.

### The real problem in one line

> **Nothing about a small business is ever properly established.**
> Everything is either "the owner said so" (useless to an insurer) or
> "nobody checked" (impossible to price).

---

## PART 2 — What we built

**PROVEN reads the documents Ram already has, and tells him what his policy would
actually pay.**

Not a form. Not a questionnaire. We never ask "how much is your stock worth?" —
because Ram genuinely doesn't know, and if he guessed wrong we'd produce a confident
wrong answer with his name on it.

We just read his papers.

### The one thing that makes us different

Most AI tools always give you an answer. **We label how much we trust every answer,
and when we can't prove something we show no number at all.**

Four labels:

| Label | Plain meaning |
|---|---|
| **PROVEN** | Every number came from a document someone else wrote — the insurer, the government, a supplier. Ram couldn't have made it up. |
| **DECLARED** | At least one number came from a document Ram wrote himself. Real document, weaker evidence. |
| **MARKET CONVENTION** | We have all the numbers, but **the policy never says how to combine them**. So we show the sum as an illustration, never as "what you'll be paid". |
| **UNESTABLISHED** | A needed number exists in no document at all. **We show nothing.** |

The rule for which label applies is simple: **who wrote the document it came from?**
A number is not trustworthy because it's in a PDF. It's trustworthy because the person
who wrote it had an independent reason to get it right.

### And the second thing, added in v2

Telling Ram "we cannot establish this" is honest, and on its own it is **useless**. It
tells him nothing about what to do next.

So we added three things that turn a report into a tool:

| | What it answers |
|---|---|
| **What to find out next** | "Get *this one document* — it's worth more than the other four combined, and here's how much of your exposure it closes." |
| **Drift over time** | "You did nothing wrong. Rebuilding costs moved and your sum insured didn't. On this date your policy's own penalty clause switched on." |
| **Market position** | "Four of six insurers give you a cushion before cutting your payout. Yours doesn't." |

---

## PART 3 — What the demo actually shows

### Round 1 — Give it only the policy

We uploaded **just** the 28-page insurance policy. Nothing else.

Result: **11 findings — 3 answered, 8 refused.**

The 3 it answered are things the policy alone genuinely settles, and it marks them
**PROVEN**: the claim notification time limit, the minimum security requirement, and a
water-damage exclusion during unoccupancy. All three are clause facts. No other document
is needed to read them.

The other **8 say "Information missing"**, and each one names the exact document it
needs:
- "To check your theft cover I need your **Schedule**"
- "To check your stock adequacy I need your **Accounts** and **Schedule**"
- "To check your staff declaration I need your **CPF record**"

**Why this matters:** a policy alone is enough to *sound* confident. A lesser tool
would have produced a full report from this. Ours answered exactly the three questions
the document could answer and refused the other eight by name.

That split is better than a blanket refusal — it shows the line is drawn per finding,
not applied as a general excuse.

### Round 2 — Give it the full set of documents

We added the schedule, accounts, CPF record, tenancy agreement, staff list, and
endorsements.

Result: **15 findings. 11 PROVEN.** Here are the four that matter.

---

#### Finding 1 — The business may have no insurance at all

The policy started **1 March**. The premium arrived **11 May**. That is **day 71**.

The policy says cover **automatically ends** if premium isn't paid within **60 days**.

Ram is paying. Ram has a certificate. Ram may have nothing.

This is just two dates subtracted. No AI. No judgement. And nobody else is checking it.

*Note: we say "requires review by a licensed adviser" — not "your cover is void."
We show the dates and the clause. A qualified human decides.*

---

#### Finding 2 — Two documents contradict each other, so we refuse to choose

Two endorsements change the same spending limit:
- One says **S$5,000**
- One says **S$25,000**

Neither says which one wins.

We had a coin-flip available. **We refused it:**

> "Precedence could not be established from the documents, so this is routed to a
> licensed adviser rather than resolved by the engine."

**Why this matters:** any tool can guess. Guessing is how you create a S$20,000
mistake with a paper trail attached.

---

#### Finding 3 — The money, and how we label it honestly

Ram insured his stock for **S$100,000**. His own accounts say the stock is actually
worth **S$150,000**.

He is only **66.7%** insured. The policy says that below **85%**, it pays
proportionally less.

So on a **S$60,000** fire he'd get roughly **S$35,000** — not S$60,000.

**But here is the important part.** The policy clause says the payout is
"proportionately reduced" and **never says how to calculate it**. We searched all 28
pages. It isn't there.

So on screen the figure says:

> **Market convention** — *"Illustration only — this policy states the trigger but not
> the formula. This is not the amount payable."*

We show the number. We refuse to call it the payout. That distinction is the product.

---

#### Finding 4 — Two things that are simply, provably wrong

- **Staff:** his insurance form declares **11** employees. The government CPF record
  shows **14**. Government record vs insurer record — neither is Ram's opinion.
  Penalty: up to $10,000 and 12 months.
- **Foreign worker:** one has **S$45,000** medical cover. Singapore law requires a
  minimum of **S$60,000**.

---

#### And three we still refuse to answer

- **Building value** — no professional valuation exists. So no number.
- **Machinery** — one invoice, but no complete asset list, so no total to compare
  against. No number.
- **One endorsement** — the scan is blurry and unreadable. *"The engine will not guess
  its effect."*

The screen shows a counter: **8 abstained rather than asserted.** That counter is the
whole point.

---

### Round 3 — The best moment: a policy it has never seen

We uploaded a real **AIG** policy. Our system has never been taught AIG's document.

It said:

> "I recognise this is AIG.
> I have **no verified clause map** for AIG.
> So I will cite no clause and build no finding on it."

**0 Proven. 8 Abstained.**

It could easily have applied the rules it learned from Chubb's policy to AIG's policy
and produced a confident report. That report would be **wrong**.

**Showing the system fail safely is the only way to prove the refusals are real and
not decoration.**

#### A small detail that proves it's precise

The AIG warning appeared on only **4** of the 8 findings — not all of them.

- The 4 that need AIG's specific clause numbers → warning shown
- The staff/CPF finding → **no warning**, because it's based on **Singapore law**,
  and the law doesn't change depending on your insurer

So it warns only where the insurer actually matters. That's precision, not a blanket
excuse.

---

## PART 4 — Why one policy isn't enough (the old strongest argument)

We read **three real, published Singapore business insurance policies** — 118 pages
total: **Chubb**, **MSIG**, and **Liberty**.

We checked the same rule in all three: *what happens if you're under-insured?*

**All three behave differently:**

| Insurer | When does the penalty start? |
|---|---|
| **Chubb** | When you're below **85%** insured |
| **MSIG** | From the **first dollar** short — no cushion at all |
| **Liberty** | **Two different clauses**: no cushion in one, 85% in the other, depending on how the claim is valued |

### Why this is a killer argument

If we had built the software using only Chubb's policy and assumed "85% is the rule":

- Every **MSIG** customer would be told they're fine when they're not → we
  **under-report** their risk
- Every **Liberty** customer on one type of claim would be told they're in trouble when
  they're not → we **over-report**

**Wrong in both directions.**

So the software stores these numbers **per clause, per insurer** — never as one global
rule. And when the documents don't make clear which clause applies, it **refuses to
choose** and sends it to a human.

### An honest note worth keeping

We got Liberty wrong at first. We read one clause, missed the second, and recorded
Liberty as having no cushion. An outside reviewer caught it. We fixed it and wrote 5
tests so it can never happen again — and we wrote the mistake down in our own
documents.

That's not embarrassing. **It's proof the method works, applied to ourselves.**

---

## PART 4B — The NEW strongest argument, and the only real score we have

### The problem with Part 4

Reading a wording by hand is slow. Three insurers took a week. Forty would take a year.
So "we store it per insurer" was honest but it sounded like it would never scale.

**v2 fixed that, and produced the best number in the whole submission.**

### The trick

Insurers give the *same rule* different **names**:

| Insurer | What they call it |
|---|---|
| Chubb | "Average" |
| MSIG | "UNDERINSURANCE" |
| Liberty | "Average" **and** "Average Relief" — two clauses, different numbers |

Looking for the *name* fails. Looking for the *clause number* fails.

So instead we look for the **shape of the sentence**. An under-insurance clause always
does two things:
1. compares your sum insured against what the property is actually worth
2. says your payout gets cut proportionally

Anything that does both is that mechanism — whatever it's called, whatever clause
number it sits at.

### How we stop that from going wrong

Three steps, and the split is the whole safety argument:

| Step | What happens | Allowed to be wrong? |
|---|---|---|
| **PROPOSE** | "here's a paragraph that might be it" | **Yes.** This is the only place AI is allowed. |
| **VERIFY** | check every required element is really there, and no disqualifying one is | **No.** Plain code. |
| **BIND** | only now is it a fact a rule may use | — |

**The proposer gets no vote.** That is how "no AI decides anything" stays true even
when AI helps read.

### The number

Run `python -m eval.alignment_metrics`:

```
Documents scored      7
Proposals offered     294
Bound (verified)      26
Rejected by verifier  238   rejection rate 0.81

Correct alignments    20
Missed / wrong value  0
False positives       0
PRECISION             1.0
RECALL                1.0

  Singapore, read by hand      recall 1.0  (12/12)
  Malaysia, NEVER hand-mapped  recall 1.0  (8/8)
```

**Read the last line out loud.** We added four Malaysian policies — AIG Malaysia, QBE
Malaysia, two more. **Nobody on the team has ever read them.** There is no map for
those insurers. And it found every mechanism, correctly, in all four.

That is the scaling story stopping being a promise and becoming a measurement.

### What it is NOT — say this yourself before anyone asks

It measures **"did you find the right paragraph"**. Not **"is your conclusion right"**.

A second person can check it in seconds by opening the PDF at the page we cite — no
insurance qualification needed. That is exactly *why* it's the number we can show.

It is **not** a general accuracy rate and must never be compared to one.

### One more honest thing

**The 81% rejection rate is a feature, not waste.** 238 of 294 candidate paragraphs
were thrown out. We show every single rejection on screen with the reason it failed.

> A checker that hides its refusals is indistinguishable from one that approves
> everything.

Also: we found a real bug this way. A **CONTRIBUTION** clause (which splits a loss
between two *insurers*) was being mistaken for an **AVERAGE** clause (which splits a
loss between the insurer and *you*). They share the phrase "rateable proportion". Same
words, completely different consequence. It's now a named test.

---

## PART 5 — The other things the demo shows

### What to find out next (new)

Instead of three dead ends saying "unestablished", the screen now ranks them:

```
1  Not established: the cost of rebuilding the premises
   Get: Reinstatement cost assessment on a RICS basis
   [ size unknown — nothing bounds this ]   [ becomes Proven ]

2  Not established: the total value of plant and machinery at risk
   Get: Fixed asset register, or invoices for every item of plant
   [ S$0 – S$180,000 left open ]  [ 64% of the measured exposure ]
   [ becomes Proven ]

3  Not established: what the endorsement changes
   Get: A legible copy of the endorsement, or the wording from your insurer
   [ S$0 – S$100,000 left open ]  [ 36% of the measured exposure ]
   [ upper bound is an assumed range, not a reading ]  [ becomes Proven ]
```

Total left open by the documents: **S$280,000.**

Three details worth pointing at:

- **The building ranks FIRST even though it has no number.** Nothing in Ram's papers
  bounds that exposure at all — so its size is *unknown*, not *small*. Earlier it
  scored 0% and sorted last, beneath the two gaps below it. That inverted the truth,
  and it's fixed.
- **No percentage on the building.** Deliberately. A share of a total that excludes the
  unbounded gap would be arithmetic on an incomplete denominator.
- **Number 3 says "upper bound is an assumed range, not a reading."** The S$180,000 on
  the plant came from a real sum insured in the schedule. The S$100,000 on the
  endorsement did not — it's a plausible ceiling we chose, and it's labelled as such
  rather than dressed up as evidence.

### Drift — the finding that fires when you do nothing (new)

Every other finding is triggered by something Ram did. This one triggers when he does
**nothing at all**.

Hold the sum insured still. Let rebuilding costs rise. His policy's own 85% threshold
switches on by itself, on a specific date, and **nobody notifies him today**.

```
As at        Index    Implied cost to reinstate   Adequacy   Average clause
2026-03-01   100.0    S$180,000                   100.0%     not engaged
2026-06-01   104.2    S$187,560                    96.0%     not engaged
2026-09-01   109.6    S$197,280                    91.2%     not engaged
2026-12-01   115.1    S$207,180                    86.9%     not engaged
2027-03-01   119.4    S$214,920                    83.8%     ENGAGED
```

**Say this out loud, every time:** the cost index is **our own sample data**, clearly
labelled `DECLARED_SAMPLE_SERIES` on screen. Plugging in a published index (BCA tender
price index) changes the numbers and nothing else about the method. Never let this look
like real published data.

### Market position (new)

The same reader run across all 7 published policies:

| Insurer | Under-insurance: when payment starts being cut |
|---|---|
| Chubb | below 85% |
| MSIG | **first dollar short** |
| Liberty | 3 provisions: below 85%; first dollar short |
| AIG (MY), QBE (MY) ×2, AIG (MY) AR | *shown, flagged as Malaysian, excluded from any Singapore ranking* |

Two honesty rules built into this screen:

- A blank cell says **"no span satisfied the mechanism"** — never "this policy doesn't
  have it". Not finding something is not proof it isn't there.
- Malaysian rows are visually dashed and **never counted into a Singapore statement**.

And this compares **clause wording**, not prices. Competitors compare your premium
against a private dataset you can't see. Every cell here has a page number and a
verbatim quote you can check against the PDF on stage.

### Consent — permission has to be specific

Click "Grant disclosure" with nothing selected → **it refuses.**

"Granular consent" means you must **name** which documents the adviser can see. Tick
two, grant, and the adviser sees only those two, plus a count of what was held back.

Click "Revoke" and it's gone.

### The portable record — Ram owns his facts

There's a permanent list of things that have been *established* about Ram's business:
14 employees (per CPF), his registered activity, his permitted use of the premises.

You can **export** it and **verify** it. Change one character and the verification
fails — there's a test that proves this.

### The closing line — the strongest thing we have

Click **Delete case**. All the negative findings disappear. The record of established
facts survives.

> **"Search that database for a 'breach' column. There isn't one. No violation, no
> deficiency, no score. That's not a privacy promise — it's the structure of the
> database, and there's an automatic test that fails the build if anyone adds one."**

Most companies say "we respect your privacy." We're saying: **the system physically
cannot store a black mark against you, and you can check.**

#### And a bug we found in our own deletion — worth telling

When we tested it properly, deletion was **fake in three places**. The main Findings
screen correctly emptied. But the new "what to find out next" panel was still listing
the deleted findings' missing documents, and the drift panel still showed a date.

Deletion held exactly where a person would look, and failed everywhere else. Fixed,
and now tested in the browser as well as the server.

**Say this if asked about testing.** Finding your own broken promise and naming it is
worth more than claiming you had none.

---

## PART 6 — Where the AI is, and where it isn't

This matters because we're in a fintech competition and people will ask.

**The claim to make:**

> **No machine-learning model makes any consequential decision.**

Plain version: **AI may help find and label the text. AI never decides what the
contract pays.**

Everything that matters — the arithmetic, which clause wins, which label applies — is
ordinary, predictable computer code that produces the same answer every time and can
be checked line by line.

### Where exactly the line sits now

There *is* one optional AI-ish component: a TF-IDF text matcher that can suggest which
paragraphs to look at. It ships switched off by default and it **cannot change any
answer** — a suggested paragraph still has to pass the plain-code verifier.

There's a test called
`test_swapping_the_proposer_cannot_change_a_carrier_fact` that **fails the build** if
swapping the matcher ever changes a single number.

**An honest correction we made to ourselves:** our own documents used to say "there is
no model anywhere in this pipeline." Once that matcher existed, that sentence was no
longer exactly true — including in a message the product itself printed on screen. We
corrected it everywhere and added a test that fails if the overstated version comes
back. Being caught overstating is the one thing this product cannot afford.

**Why we did it this way:** a research study measured the best AI models getting only
**34–57%** right when reasoning across multiple clauses in real contracts. That is not
good enough to tell someone whether they're insured.

**Don't say "PROVEN is not AI."** It's a document-intelligence system. The line is
about *where* AI is allowed to sit.

---

## PART 7 — What we honestly don't have

Say these before anyone asks. Naming your own weaknesses first is the whole brand.

- **No company, no customer, no revenue, no pilot.** Student team.
- **No login system.** Not safe to put on the public internet yet, and the software
  says so itself when you check its status.
- **Findings still only work for 3 insurers.** This is the important nuance: we can now
  *identify clauses* in a policy nobody taught us (Malaysia recall 8/8), but we still
  only *build findings* on clause references a human has verified. Reading the clause
  and being willing to base a legal consequence on it are two different bars.
- **The drift cost index is our own sample data.** Labelled as such on every screen.
- **No verified general accuracy percentage.** We can measure narrow things, and we
  measure three of them:

  | What | Score | Needs an expert? |
  |---|---|---|
  | Finding the right clause, 7 real policies | precision 1.0 / recall 1.0 | No |
  | Quotations word-perfect at the offsets we cite | 25/25 | No |
  | Objective facts — dates, counts, arithmetic | 10/10 | No |
  | General accuracy rate | **not available** | **Yes** |

  A general "we're 95% accurate" claim needs a qualified insurance professional to
  grade our work, and we haven't got one. That is our single biggest gap and our next
  priority.

**The tool refuses to print a bigger accuracy claim than the evidence supports.** That
was a deliberate design choice.

- **Competitors exist and are funded:** Advocate ($18M), Qumis, Coverwatch,
  Newfront/WTW, Kayna. Name them first.
  **The difference:** they compare your policy against *market data* they own. We
  compute from *your policy's own words* and *Singapore law*. Ours can be checked live
  on stage. Theirs needs their private dataset.

---

## PART 8 — The whole thing in 7 steps

| | | |
|---|---|---|
| **1. READ** | the documents the business already has | no forms |
| **2. PROVE** | label every finding by evidence strength | who wrote the source? |
| **3. CALCULATE** | what the policy actually pays | plain code, not AI |
| **4. ABSTAIN** | say nothing where evidence runs out | 8 abstained is a feature |
| **5. RANK** | tell them which missing document is worth the most | new in v2 |
| **6. ROUTE** | hand a prepared case to a licensed adviser | with specific permission |
| **7. REMEMBER** | keep a portable record of established facts | no black marks possible |

### And the one sentence to lead with

> **"Insurance decisions are made from documents. Small businesses have no system that
> tells them what their documents actually establish. PROVEN does."**

Do **not** open with "AI-powered." The opposite is our differentiator.

---

## PART 9 — Never say these

| Don't say | Say instead |
|---|---|
| "98% accurate" | "1.0 precision on clause identification, 7 real policies. No general accuracy rate yet." |
| "Hallucination-free" | "No model makes a consequential decision." |
| "PROVEN is not AI" | "No model decides what the contract pays." |
| "There's no model anywhere" | "No model makes a consequential decision." (The first version stopped being true — don't reintroduce it.) |
| "This policy doesn't have that clause" | "No span satisfied the mechanism." Not finding it isn't proof it's absent. |
| "The cost index shows..." | "Our sample cost index, labelled as sample data, shows..." |
| "S$18 is our price" | "Illustrative, subject to pilot validation." |
| "We replace brokers" | "We hand the adviser a prepared case." |
| "Your claim will be denied" | Never. We locate and quote. A human concludes. |
| "You are in breach" | Never. Not once, anywhere. |

---
---

# PART 10 — How to run it (copy-paste commands)

## One-time setup

Open PowerShell:

```powershell
cd E:\SFF\proven
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Every time you demo

**Terminal 1 — check it's healthy, then start the server:**

```powershell
cd E:\SFF\proven
python -m pytest -q
```
Expect: **359 passed**. Say that number out loud during the demo.

```powershell
python -m uvicorn proven.api:app --app-dir src --port 8077
```
**Leave this terminal running.** Don't close it, don't type in it.

**Terminal 2 — keep this one free** for the accuracy commands in Part 13.

**Browser:** go to **http://127.0.0.1:8077**

## ⚠️ The two things you must not forget

**1. Load the page once BEFORE anyone is watching.**

The very first load reads the whole 28-page policy and aligns all 7 corpus wordings:
about **4.5 seconds**. Every click after that is **0.1s or less**.

**2. Upload the AIG file once too, before they arrive.**

First parse of AIG is ~1.8s. After that it's cached and instant. Then click
**Reload example** to get back to a clean start.

Do both early. Never let a judge watch a first load.

## Have these two files ready in a File Explorer window

Both are in `E:\SFF\06-evidence\policy-wordings\`

| File | What it is |
|---|---|
| `chubb-selectplus-wording.pdf` | A real Chubb policy — the insurer we've taught |
| `aig-sg-homes-advantage-wording.pdf` | A real AIG policy — the insurer we have **not** taught. **This is your best moment.** |

## If port 8077 is busy

Use **8123** or **8200**. Do **not** use 8080 — it's blocked on this machine.

```powershell
python -m uvicorn proven.api:app --app-dir src --port 8123
```

**If you change any code, you must restart the server.** It does not reload by itself.
This has caught us out repeatedly — the page silently serves the old version.

---

# PART 11 — Guide to the screen

## ⭐ The two things that changed, and why they matter most

**1. It starts empty.**

Open the page and there is nothing there. No business, no findings — just a place to
drop a PDF and a button that says *"Show me an example"*.

This is deliberate and it is the single most important change. Before, the page
pre-loaded a fictional business, so a judge could not tell what had been computed from
what had been hardcoded. Now they watch it go from **nothing** to **answers**.

Say it out loud: *"Nothing is loaded. Watch what happens when I give it a document."*

**2. There is a view switch, top right: Business owner ⟷ Evidence.**

Same data, two depths.

| | Business owner (default) | Evidence |
|---|---|---|
| Who it's for | The person who owns the policy | An auditor, a judge, a regulator |
| Findings | Grouped by **what you can do** | Same, plus internal rule IDs |
| Clause quotes | One click away, behind *"Show the exact wording"* | Open inline |
| Clause accounting | Hidden | 97 / 58 / 39 with every unclassified provision |
| Clause alignment | Hidden | Proposed / bound / rejected + every refusal |
| Cross-carrier | Hidden | Full table |
| Drift | A **chart** | Chart **and** the figures table |

**This is your best answer to "who actually uses this?"** — the owner view is the
product, the evidence view is the proof. Flip between them on stage.

---

## The cards, in order

Empty state shows only the first one. Everything else appears once a case exists.

| # | Card | Owner sees it? | What it's for |
|---|---|---|---|
| 1 | **Find out what your insurance would actually pay** | ✅ | The upload hero. Drop PDFs, or load the example. |
| 2 | **Your position** | ✅ | Plain-English verdict + 4 headline numbers |
| 3 | **What has changed in the business?** | ✅ | 9 chips like "Started selling online" |
| 4 | **Needs your attention** | ✅ | The findings, grouped by what you can do |
| 5 | **Do this next** | ✅ | ⭐ Ranked missing documents, with what each is worth |
| 6 | **Your cover, if you change nothing** | ✅ | ⭐ The drift chart |
| 7 | **How your wording compares** | ✅ | ⭐ 7 policies, clause by clause |
| 8 | **Clause accounting** | evidence only | detected / classified / unaccounted |
| 9 | **How each clause was identified** | evidence only | ⭐ propose / verify / bind + every rejection |
| 10 | **The same rule, three real wordings** | evidence only | Proof one hardcoded rule can't work |
| 11 | **What we read, and what we did not** | evidence only | The falsifiable half of the claim |
| 12 | **Share with your adviser** | ✅ | Grant access to named documents only |
| 13 | **Your record** | ✅ | Established facts, exportable and verifiable |

## Findings are grouped by what you can DO

Not by evidence strength. This is the product change that matters most inside card 4:

| Group | Meaning |
|---|---|
| **Take these to a licensed adviser** | Real and specific, but only a qualified human may judge it |
| **Confirmed from your documents** | Read straight from your papers, wording quoted |
| **We need a document to answer these** | We refuse to estimate. Card 5 ranks which to get first. |
| **Not found in what we read** | We looked and didn't find it. **Not** the same as "not covered." |

The grouping is the engine's own output state — no new judgement was invented for it.

## Every button

| Button | Where | What happens |
|---|---|---|
| **Show me an example** | card 1, empty state | Loads the synthetic business. Labelled synthetic everywhere. |
| **Reload example** | top right | Re-uploads the synthetic example (~3.4s, pipeline shown). Your safety net between rounds. |
| **Business owner / Evidence** | top right | The view switch. Flip it live. |
| **Analyse my documents** | card 1 | Reads the PDFs you dropped |
| **Clear selection** | card 1 | Removes files before analysing |
| **Clear selection** | card 3 | Unticks the change-event chips |
| **Grant access** | card 12 | Adviser sees only the documents you tick |
| **Revoke** | card 12 | Takes that access away |
| **Show my record** | card 13 | Displays the established facts |
| **Download & verify** | card 13 | Exports and proves the chain isn't tampered with |
| **Insurer book view** | card 13, evidence only | **Always say "this is synthetic"** |
| **Delete my case** | card 13 | Deletes all findings. The record survives. Your closing move. |

## Four dropdowns

| Control | Where | What it does |
|---|---|---|
| **Evidence** | card 4 | Switch to **Proven only** to show the strongest findings |
| **Only what my changes point at** | card 4 | Filters to your chosen change-events |
| **Cost series** | card 6 | Building ↔ equipment. **Switching it moves the drift date** — good live proof |
| **Jurisdiction** | card 7 | All / Singapore / Malaysia. Instant. |

## Two expandable sections worth opening on stage (evidence view)

- Card 8 → **"Read the provisions we could not classify (39, quoted verbatim)"**
- Card 9 → **"Read what the verifier refused (9, quoted verbatim)"**

Both are the same argument: we lead with what we could *not* do.

## How to read a single finding

Every finding card has the same shape:

```
PROVEN                 ← how much we trust it (the label)
Documented             ← the outcome state
THEFT-FORCIBLE-ENTRY-NOT-WRITTEN-BACK      ← internal rule name
Theft is covered only where there was violent or forcible entry...   ← plain English
"there is violent or forcible entry"        ← the EXACT words from the policy
page 17, characters 2048–2082               ← precisely where we found it
cite · cl 5.1(c)(i)                         ← the clause number
```

That "page 17, characters 2048–2082" is the important bit. **It means anyone can open
the PDF and check us.** Nothing is summarised or paraphrased.

## How to read a clause-alignment card (card 6)

```
Proportionate reduction of payment for under-insurance
  called "Average"          ← what THIS insurer names it (a hint, never load-bearing)
  ADEQ.AVERAGE_CONDITION    ← our internal name for the mechanism

  ENGAGES BELOW   85%       ← read from the clause, never a market default
  VALUATION BASIS Actual Value

  "…shall be proportionately reduced…"
  page 15, characters 1204–1698
```

If an insurer's clause states **no** threshold, the card says **"first dollar short"** —
because the absence *is* the answer, and printing 85% there would be wrong.

## The four outcome states, in plain words

| State | Meaning |
|---|---|
| **Documented** | We found it and quoted it |
| **Not confirmed in reviewed documents** | We looked, didn't find it. **This is not the same as "you're not covered."** |
| **Information missing** | We need a document you haven't given us |
| **Requires authorised review** | We found something real, but only a licensed human may judge what it means |

---

# PART 12 — The demo, step by step

**Total 5 minutes.** Rounds 2, 3, 4 and 4B are the argument — never cut those.
If you only have 3 minutes, cut Rounds 5 and 7.

## ROUND 0 · Start on an empty screen (0:00–0:15)

**Load the page. Do not click anything.** Let them look at it.

> "Insurance decisions are made from documents. A small business has no system that
> tells them what their documents actually establish. That's what this does.
>
> And notice — there's nothing here. No data, no example loaded, no demo. Just a place
> to put a document. Everything you're about to see gets computed from files I hand it
> in the next four minutes."

**Do not say "AI-powered" in your first sentence.** The opposite is the point.

**Why this beat exists:** it's the cheapest credibility you will ever buy. A judge who
watches the screen go from empty to full has no room to wonder what was hardcoded.

---

## ROUND 1 · Give it only the policy (0:15–0:45)

**What to do:**
1. Drag **`chubb-selectplus-wording.pdf`** onto the drop zone
2. Click **Analyse my documents**
3. Scroll to card 4, **Needs your attention**

**What you'll see:** *11 findings · 3 Proven · 8 Unestablished*. The 3 Proven are
clause facts (claim time limit, minimum security, unoccupancy water exclusion). The
other 8 say **Information missing** and name the document each one needs.

**What to say:**
> "I've given it only the policy — nothing else.
>
> It answered three things: the claim notification limit, the minimum security
> requirement, a water exclusion. Those are clause facts. The policy alone settles them,
> so they're marked Proven.
>
> The other eight it refuses. And it tells me why: it needs the Schedule to check theft,
> the Accounts to check stock adequacy, the CPF record to check staff.
>
> A policy alone is enough to *sound* confident. Most tools would produce a full report
> from this. Ours answered exactly what this document can answer and named what it's
> missing for the rest."

**Why start here:** refusing first, answering second, is far stronger than the reverse.
And the fact that it's 3-and-8 rather than a blanket refusal is the better detail — the
line is drawn per finding, not used as a general excuse.

---

## ROUND 2 · Give it everything (0:45–2:15)

**What to do:** click **Show me an example** (or **Reload example** if you're already
loaded). Takes ~3.4s, and you watch the pipeline run.

**This is the important part now: it UPLOADS the example.** The browser fetches 13
synthetic PDFs and pushes them through the same path your own files take. The
processing panel shows it happen: uploading 13 documents → reading pages → detecting
each one → refusing the illegible scan → accounting 97 clauses → computing findings.

> "I'm not loading a saved demo. It's uploading 13 documents right now and reading
> them — watch the stages. The one it refuses, the illegible scan, it names and drops
> before parsing. Nothing here is pre-filled."

That loads the complete set: policy + schedule + accounts + CPF record + tenancy +
staff list + two endorsements + scans.

### First, card 2 — Your position

> "One sentence, plain English: 15 things worth knowing, 4 need a licensed adviser, and
> 8 we couldn't answer from what it was given.
>
> And that chip in the corner says **Synthetic example** — because this one is. When I
> upload a real document in a minute it changes to *Your documents*."

### Now card 4 — Needs your attention

**Point at the group headings before any individual finding.**

> "These aren't sorted by how confident we are. They're grouped by **what you can do
> about it.** Take to an adviser. Confirmed from your documents. We need a document.
> Not found in what we read.
>
> That last group matters: 'not found' is not the same as 'not covered', and we never
> let those two blur."

Then show these four findings, in this order:

**① Premium timing** — *"Premium appears to have been received on day 71"*
> "Policy started 1 March. Premium arrived 11 May — day 71. The policy says cover
> automatically terminates after day 60. This business is paying, has a certificate,
> and may have no insurance at all. Two dates subtracted. Nobody else is checking this."

**② Conflicting endorsements** — S$5,000 vs S$25,000
> "Two endorsements set the same limit to different figures. Neither says which wins.
> We had a coin flip available and refused it — it says 'routed to a licensed adviser
> rather than resolved by the engine.' Any tool can guess. Guessing is how you create a
> S$20,000 mistake with a paper trail."

**③ The average finding** — this one wins technical judges
```
Adequacy ratio    66.7%
Average threshold 85.0%
Assessed loss     S$60,000
Illustration      S$35,000
```
> "Stock insured for S$100,000. Their accounts say S$150,000. They're 66.7% insured, so
> on a S$60,000 fire the policy pays about S$35,000.
>
> Now read the label: **Market convention.** Clause 4.2 states the 85% trigger and
> **never states the formula.** We searched all 28 pages. So the screen says
> 'illustration only — this is not the amount payable.' We show the number and refuse
> to call it the payout."

**④ WICA** — declared 11, CPF shows 14
> "Their insurance form says 11 employees. The government CPF record says 14. Neither
> is the owner's opinion. Penalty up to $10,000 and 12 months."

### Then say:

> "Building value — no valuation exists, so no number. Machinery — one invoice but no
> full asset list, so no number. And one endorsement: 'could not be read, illegible
> scan. The engine will not guess its effect.'
>
> The counter at the top says **8 abstained rather than asserted.** That counter is the
> product."

### ⭐ Now scroll ONE card down to card 5 — Do this next

**This is new and it answers the obvious objection.**

> "And here's the part that makes those three refusals useful instead of just honest.
>
> The documents leave **S$280,000** of payout open. This ranks the one document that
> closes the most of it.
>
> Look at number one: the rebuilding cost. Ranked **first**, and it has **no number** —
> because nothing in their papers bounds that exposure at all. Its size is *unknown*,
> not *small*. It used to rank last for scoring zero. That was backwards and we fixed it.
>
> And it deliberately shows **no percentage**, because a share of a total that excludes
> the unbounded gap would be arithmetic on an incomplete denominator.
>
> Then look at number three: 'upper bound is an **assumed range**, not a reading.' The
> S$180,000 on the plant came from a real sum insured on their schedule. The S$100,000 on
> the endorsement didn't — that's a ceiling we chose, and we label it rather than dress it
> up as evidence."

---

## ROUND 3 · The unseen insurer ★ your best 20 seconds (2:15–2:40)

**What to do:**
1. Scroll to card 1 (the upload bar at the top)
2. Drag in **`aig-sg-homes-advantage-wording.pdf`**
3. Click **Analyse my documents**
4. Look at the findings — and at the source chip, which now reads **Your documents**

**What you'll see:** *0 Proven · 8 Abstained*, and on four of them this line:

> *"this wording's clause references are not in the verified map for carrier **AIG**, so
> no clause can be cited for it."*

**What to say:**
> "This is a real AIG policy. Our system has never been taught it. It recognises AIG,
> tells you it has no verified clause map for AIG, and refuses to build any finding on
> it.
>
> It would have been trivial to apply the rules we learned from Chubb to this document
> and produce a confident report. That report would be wrong. Showing you the system
> **fail safely** is the only way to prove the refusals aren't decoration."

**If someone is paying close attention, add this:**
> "And notice it's on four findings, not all eight. The staff/CPF one has no warning —
> because it rests on **Singapore law**, and the law doesn't change with your insurer.
> It warns only where the insurer actually matters."

**Then click Reload example** to get back to the full case.

---

## ⭐ ROUND 3B · Flip the view switch — "who uses this?" (2:40–2:55)

This is the answer to the question a corporate judge will definitely ask.

**What to do:** click **Evidence** in the switch, top right. Watch four new cards
appear.

**What to say:**
> "Everything you've seen so far is the business owner's view. It's written for someone
> who owns a policy, not for someone who builds software.
>
> [click Evidence] This is the same data with the proof exposed. Clause accounting.
> How every clause was identified, and everything the verifier refused. Cross-carrier.
> Internal rule IDs and character offsets on every quote.
>
> Same engine, same numbers, two audiences. The owner gets an answer. An auditor,
> a regulator or a carrier's compliance team gets the working."

**Leave it in evidence view** — the next two rounds live there.

---

## ROUND 4 · Three insurers, one rule (2:55–3:10)

**What to do:** scroll to card 10, **The same rule, three real wordings**.

**What to say, pointing at the table:**
> "Same rule, same engine, three real published Singapore policies — 118 pages.
>
> Chubb penalises you below 85% insured. MSIG penalises from the first dollar short.
> Liberty has **two** clauses with different thresholds depending on how the claim is
> valued.
>
> Hardcode 85% and you tell every MSIG customer they're fine when they're not.
> Read only Liberty's first clause and you tell Liberty customers they're in trouble
> when they're not. **Wrong in both directions.** That's why we store these per clause,
> never as one global rule."

---

## ROUND 4B ★★ How we made that scale — your strongest technical moment (3:10–3:50)

The obvious objection to Round 4 is *"so you have to hand-read every policy — that
never scales."* This is the answer.

**Step 1 — card 9, How each clause was identified.**

Point at the four tiles: *12 candidates proposed · 3 bound · 9 rejected · 0 duplicates*

> "Insurers call the same rule different names — Average, Underinsurance, Average
> Relief. Looking for the name fails. Looking for the clause number fails.
>
> So we look for the *shape of the sentence*: does it compare your sum insured against
> what the property is really worth, **and** does it cut your payout. Anything doing
> both is that mechanism, whatever it's called.
>
> Three steps. A candidate gets **proposed** — that's the one place we allow AI, and
> it's allowed to be wrong. Then it gets **verified** by plain code against the
> structural requirements. Only then is it **bound**. The proposer gets no vote. That's
> how 'no AI decides anything' survives having AI in the pipeline."

**Step 2 — expand "Read what the verifier refused (9, quoted verbatim)."**

> "Nine refusals, each with the exact requirement it failed. A checker that hides its
> refusals is indistinguishable from one that approves everything."

**Step 3 — Terminal 2. This is the moment.**

```powershell
python -m eval.alignment_metrics
```

Point at the last two lines:

> "Precision 1.0, recall 1.0 across 20 mechanisms in 7 real published policies, having
> thrown out 238 of 294 candidates.
>
> And read this line: **Malaysia, never hand-mapped — recall 8 out of 8.** We added four
> Malaysian policies. Nobody on our team has read them. There is no map for those
> insurers. It found every mechanism correctly.
>
> That's the scaling answer, measured rather than promised."

**Then immediately say what it is not — don't wait to be asked:**

> "To be precise: that measures *did we find the right paragraph*. Not *is our
> conclusion right*. A second reader can check it by opening the PDF at the page we
> cite, with no insurance training — which is exactly why it's the number we can show
> you. It is not a general accuracy rate and I won't compare it to one."

**Step 4 — card 7, How your wording compares.**

> "Same engine across all seven. Chubb 85%, MSIG first dollar, Liberty three
> provisions. And notice **Chubb is outlined and marked 'yours'** — the map knows which
> row is this business's own insurer."

Flip the **Jurisdiction** dropdown to **Singapore only** — instant.

> "Malaysian rows are dashed and excluded from any Singapore statement. And an empty
> cell says 'no span satisfied the mechanism' — never 'this policy doesn't have it.'
> Not finding something isn't proof it isn't there.
>
> One more thing: this compares *clause wording*, not premiums. Everyone else in this
> space compares your price against a private dataset you can't inspect. Every cell here
> has a page number and a quote you can check on the PDF right now."

---

## ROUND 5 · Drift — the finding that fires when you do nothing (3:50–4:10)

**What to do:** switch back to **Business owner** view, then scroll to card 6,
**Your cover, if you change nothing**. You'll see five bars, the last one red.

**What to say:**
> "Every finding so far was triggered by something the business did. This one fires when
> they do **nothing**.
>
> Hold the sum insured still. Let rebuilding costs move. Watch the bars fall — and on
> **1 March 2027** the bar turns red, because their own policy's 85% threshold switched
> on by itself. They did nothing wrong, they're now under-insured, and no insurer
> notifies them of this today."

**Now switch the Cost series dropdown to "Manufacturing equipment cost".**

> "Different asset class, faster-moving costs — the date moves to **December 2026**."

**Then immediately, without being asked:**
> "And that cost index is **our own sample data** — it says `DECLARED_SAMPLE_SERIES`
> right there on the screen. Plugging in a published index changes the numbers and
> nothing else about the method. I'm not going to show you sample data and let you think
> it's published."

---

## ROUND 6 · Consent (4:10–4:30)

**What to do:**
1. Scroll to card 12, **Share with your adviser**
2. Click **Grant access** with **nothing ticked** → it refuses
3. Now tick **Schedule** and **Base wording**
4. Click **Grant access** → "What they see" appears
5. Click **Revoke**

**What to say:**
> "It refused an empty request. Granular consent means you have to *name* the documents.
>
> [after ticking two] Now the adviser sees only those two, and a count of what was held
> back — so they can ask for what they need instead of being handed a silently shortened
> list.
>
> [after revoking] And it's gone."

---

## ROUND 7 · The close (4:30–5:00)

**What to do:**
1. Card 13 → **Show my record**
2. → **Download & verify** → shows `chain_valid: True`
3. → **Delete my case**
4. **Scroll up through cards 2, 4, 5 and 6** — all empty and saying "deleted"
5. **Scroll to card 7** — market map still there

**What to say:**
> "Established facts only — 14 employees per CPF, registered activity, permitted
> premises use. Exportable, and independently verifiable. Change one character and the
> verification fails. There's a test for that.
>
> [click Delete case, then scroll up] Findings gone. What to find out next — gone.
> Clause alignment — gone. Drift — gone. All four say 'this case was deleted.'
>
> [scroll to card 10] And the market map is still there, because it holds no case — it's
> computed from published policies, not from theirs.
>
> That distinction was a real bug we found. Deletion emptied the main Findings screen
> and quietly left the three new panels intact. It held exactly where a person would
> look. We only caught it by testing every view."

**Then your closing line:**
> "Search that database for a 'breach' column. There isn't one. No violation, no
> deficiency, no score. That's not a privacy policy — it's the structure of the
> database, and there's an automatic test that fails the build if anyone adds one.
>
> Delete the case and the negative findings are gone. What survives is only what was
> established."

---

# PART 13 — When they ask questions

## "What's your accuracy?" ★ lead with this one now

**Terminal 2:**
```powershell
python -m eval.alignment_metrics
```

> "On clause identification — did we find the right paragraph — precision 1.0 and recall
> 1.0 across 20 mechanisms in 7 real published policies, rejecting 238 of 294
> candidates. Including recall 8 out of 8 on four Malaysian policies nobody on our team
> has ever read.
>
> Any second reader can check that by opening the PDF at the page we cite. No insurance
> training needed. That's why it's the number we're willing to show.
>
> It is **not** a general accuracy rate for findings, and I won't compare it to one."

Then, if they push on findings:
```powershell
python -m eval.harness
```

> "10 assertions with objective ground truth — counts, dates, arithmetic. Precision 1.0,
> recall 1.0, one bundle.
>
> The tool physically refuses to print a broader claim until a named
> insurance-qualified reviewer has graded a set. That reviewer is our next priority."

## "How do I know the quotes are real?"

```powershell
python -m eval.citation_audit
```

> "25 out of 25 quotations word-perfect at the exact character positions we cite.
> 8 out of 8 sitting inside the clause we attribute them to.
>
> That measurement needs no insurance expert. It says the quotations are real. It does
> **not** say the conclusions are right — and we keep those two claims separate."

## "How well is this tested?"

```powershell
python -m pytest -q
```

> "359 tests. But the number isn't the point — what we found is. Three real bugs that
> code review had missed, all the same shape: a guarantee that held exactly where a
> person would look and nowhere else.
>
> Deletion was fake in three panels. Our clause counts didn't add up — 23 proposed, 13
> rejected, 4 shown, and six vanished in between, so the rejection rate couldn't be
> checked by arithmetic. And one whole class of button had no styling at all.
>
> Each one is now a named test. Every single API route has a test, and there's a guard
> that fails the build if anyone adds a route without one."

## Quick answers to the rest

| They ask | You say |
|---|---|
| "Why can't Zurich build this?" | "They can build a policy reader. What they can't ship is neutrality — a Zurich-issued record is worth nothing to Allianz, so it's worth nothing to the business." |
| "Doesn't hand-reading policies kill your scaling?" | "It did. That's what v2 fixed — structural identification, recall 8/8 on four policies nobody taught us. Findings still need a verified clause map; identification doesn't." |
| "Why trust the maths?" | "No machine-learning model touches a consequential decision. Every number traces to a quote in a named document. When we can't establish precedence, we escalate instead of guessing." |
| "What if you miss something?" | "39 of 97 provisions unaccounted, quoted on screen. Plus 9 rejected clause candidates, also quoted. We lead with both." |
| "What if the owner lies?" | "We never ask for a figure. We read the document that contains it and grade by who wrote it. No document, no number." |
| "Is this AI?" | "It's document intelligence. A model may help *find* text — there's an optional one in there now, switched off by default, and a test that fails the build if it ever changes an answer. A model may never decide what the contract pays." |
| "Is that cost index real?" | "No, and the screen says so. Sample data, labelled `DECLARED_SAMPLE_SERIES`. Swapping in a published index changes the numbers and nothing else." |
| "How big is the market?" | "S$18 per policy per year is illustrative and needs pilot validation. Fully penetrated Singapore SME is roughly S$10m recurring. Our cost falls per *policy wording*, not per customer — each wording we learn makes its whole installed base nearly free." |

---

# PART 14 — If something breaks

| Problem | Fix |
|---|---|
| **Anything at all goes wrong** | Click **Reload example**, top right. Re-uploads the example (~3.4s, pipeline shown). |
| Page blank or error banner | The banner has a **Try again** button. Click it. |
| A file was rejected | **Read the reason out loud — it's a feature.** Then use the demo bundle. |
| A panel says "unavailable" | It failed on its own without taking the page down. Say that — the panels are independent by design. |
| Server stopped | In Terminal 1: `python -m uvicorn proven.api:app --app-dir src --port 8077` then load the page once before continuing |
| Port 8077 busy | Use **8123** or **8200**. Never 8080 — blocked on this machine. |
| You edited code and nothing changed | **Restart the server.** It does not reload by itself. |
| Upload feels slow | It's under 2 seconds. Keep talking through it. |

## Measured timings — so nothing surprises you

| Action | Time |
|---|---|
| **Very first page load after starting the server** | **4.5s** — do this before anyone arrives |
| **First AIG upload after starting the server** | **1.3–1.8s** — do one practice run too |
| A fresh browser session, once the server is warm | **0.34s** |
| Every panel reload after that | 0.10s |
| Show me an example / Reload example (uploads 13 PDFs) | ~3.4s, pipeline shown |
| Upload Chubb (299 KB, 28 pages) | ~2s |
| Upload AIG again | instant |
| Switch cost series | instant |
| Switch jurisdiction | instant |
| Consent, revoke, export, delete, events | instant |
| Full test suite | ~41s — **run before, never during** |

**Why the warm-up matters and what it protects:** the 4.5s is paid **once per server
process**, not once per person. Warm it up and then even a brand-new browser — or a judge
opening it on their own laptop against your server — loads in 0.34s. Restart the server
and you owe the 4.5s again.

---

# PART 15 — The whole demo on one card

Print this. Keep it in your hand.

```
BEFORE:  cd E:\SFF\proven
         python -m pytest -q                    -> 359 passed
         python -m uvicorn proven.api:app --app-dir src --port 8077
         open http://127.0.0.1:8077
         click "Show me an example" once (4.5s), upload the AIG pdf once,
         then click Delete my case -> reload the page so it lands EMPTY again

0:00  SHOW  an EMPTY page. Don't click.
      SAY   "Insurance decisions are made from documents. SMEs have no
             system telling them what theirs establish.
             And notice - nothing is loaded. Watch it fill up."

0:15  DO    drag chubb-selectplus-wording.pdf -> Analyse
      SHOW  11 findings: 3 Proven (clause facts) + 8 need a document
      SAY   "Answered the 3 the policy settles. Refused 8, named
             the document each one needs."

0:45  DO    click Show me an example (it UPLOADS 13 PDFs, ~3.4s)
      SHOW  the processing panel running its 6 stages
      SHOW  card 2 verdict + "Synthetic example" chip + synthetic banner
      SAY   "Not a saved demo - it's uploading and reading 13 docs now."
      SHOW  card 4 group headings, NOT individual findings first
      SAY   "Grouped by what you can DO, not by how sure we are."

1:15  SHOW  card 4 findings
      SAY   day 71 premium -> cover may have ended
            S$5,000 vs S$25,000 -> we refuse to pick
            66.7% adequacy -> S$35,000, labelled illustration only
            11 declared vs 14 on CPF
            "8 we could not answer, and we say so"

1:55  SHOW  card 5 Do this next  (S$280,000 left open)
      SAY   "Building ranks FIRST - unknown, not small. No percentage
             on it, because that denominator is incomplete.
             #3 says 'assumed range, not a reading'."

2:15  DO    drag aig-sg-homes-advantage-wording.pdf -> Analyse
      SHOW  0 Proven. chip flips to "Your documents".
            "not in the verified map for carrier AIG"
      SAY   "Never taught this insurer. Failing safely
             is the only proof the refusals are real."
      DO    Reload example

2:40  DO    flip the view switch to EVIDENCE          <- "who uses this?"
      SAY   "Owner gets an answer. Auditor gets the working.
             Same engine, same numbers, two audiences."

2:55  SHOW  card 10 - three wordings table
      SAY   "Chubb 85%. MSIG first dollar. Liberty two clauses.
             Hardcode one number, wrong in both directions."

3:10  SHOW  card 9 - 12 proposed / 3 bound / 9 rejected
      SAY   "Propose, verify, bind. Proposer gets no vote."
      DO    expand the 9 rejections
      DO    Terminal 2: python -m eval.alignment_metrics
      SAY   "1.0 / 1.0 on 7 policies. Malaysia 8/8, never taught.
             That measures FINDING the clause, not being RIGHT."
      SHOW  card 7 -> Chubb outlined as 'yours'
      DO    flip Jurisdiction to Singapore only
      SAY   "Clause wording, not premiums. Every cell has a page."

3:50  DO    switch back to BUSINESS OWNER
      SHOW  card 6 drift bars, last one red -> switch to equipment
      SAY   "Fires when they do NOTHING. 2027-03-01 -> 2026-12-01.
             And that index is OUR SAMPLE DATA. It says so."

4:10  DO    Grant access with nothing ticked -> refuses
            tick Schedule + Base wording -> Grant -> Revoke
      SAY   "Granular means you name the documents."

4:30  DO    Show my record -> Download & verify -> Delete my case
      DO    scroll up: cards 2, 4, 5, 6 all say "deleted"
      DO    scroll to card 7: still there
      SAY   "Deletion reaches every view. That was a real bug we found.
             Search that schema for a breach column. There isn't one.
             Delete the case; the record survives."

ASKED?   python -m eval.alignment_metrics  -> 1.0 / 1.0, MY 8/8   <- LEAD WITH THIS
         python -m eval.citation_audit     -> 25/25 verbatim
         python -m eval.harness            -> read it exactly, don't round up

BROKEN?  Reload example. Always.
```
