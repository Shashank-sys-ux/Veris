# VERIS — Master Task List

**Baseline:** 851 tests passing, exit 0 (verified 17 Aug 2026)
**Working tree:** Shashank's build — the newest tree, includes everything
**Owner:** Shashank — all five tasks
**Submission:** 21 Aug 2026

---

## Read this before you start

**Ten steps total.** Steps 1–6 come from the five `.txt` prompts. Steps 7–10 are
Tasks 6–9 at the bottom of this document — they close the four gaps no prompt covered,
and they are specified here in full rather than in a separate file.

The five `.txt` files were written independently, at different times, and they all edit
the same two files. Two of them contain instructions that are now wrong.

**This document is the order of execution and the corrections list.** Read each task's
`.txt` for the detail; read this for what to do first and what to ignore.

Because one person is doing all of it, the risk is not merge conflicts between people —
it is **doing them in the wrong order and having to redo work.** Task 1 restructures the
SME sidebar that four later steps build on top of. Do it early or build those screens
twice.

### Three corrections that override the individual prompts

**1. Use OpenAI, not Groq. Everywhere.**
`4th and 6th task.txt` still mentions Groq **9 times** — lines 772, 784, 1035–1055
(section 36 in full), and two required tests at lines 1357–1358. Ignore all of them.

`GROQ_API_KEY` is not set in this environment, and `presenter.py` already falls back to
OpenAI on its own when it is missing — so Groq is **already inactive**. We have OpenAI
credits. Do not add a Groq key, do not ask the user for one, do not write a Groq code path.

- Where a prompt says "Groq", read **"the presenter's existing model layer"**
- Section 36 (GROQ/API CREDENTIAL HANDLING) — skip entirely, it would send you hunting
  for a key you do not need
- Section 47's two tests "Groq failure" and "Groq missing" — **rewrite as one test**:
  *model unavailable → deterministic fallback wording still works*. That is the real
  behaviour and it is worth testing; the Groq-specific version tests a path we do not use

**2. One endpoint name in `4th and 6th task.txt` is wrong.**
Section 37 lists `/api/renewal`. The actual route is **`/api/renewal/compare`**.

This matters: `tests/test_frontend.py::test_every_fetched_path_is_a_real_route` parses
every `api("...")` call in `app.js` and fails the suite on a typo'd path.

Verified as correct exactly as written in section 37: `/api/blindspots`, `/api/brief`,
`/api/score`, `/api/cyber`, `/api/bi`, `/api/actions`, `/api/information-value`.
`/api/gap-summary` correctly does not exist yet — that is the one being created.

**3. Fix the paths.**
`1st task.txt` and `2nd task.txt` say `E:\SFF\SFF1\SFF-preran\proven` — that path was
written from a different machine. `3rd Task.txt` and `5th task.txt` say
`c:\Users\Shashank\Desktop\SFF1\SFF-preran\proven`.

Since Shashank is running all five, **use his local path throughout** and ignore the
`E:\` one wherever it appears.

---

## Order of execution — do not reorder this

All five tasks edit `web/app.js`. Four edit `src/proven/api.py`. Task 1 rebuilds the
SME sidebar that tasks 4/6 and 5 then add things to. Wrong order means building the
same screen twice.

| Step | Task | Why here |
|------|------|----------|
| **1** | **Task 3, Phase A only** (security fix) | Backend only, touches almost nothing else, and it is a live data leak. Close it before adding features on top of a leaking API. Task 3's own prompt already says do not start Phase B until Phase A's tests pass — respect that. |
| **2** | **Task 1** (23 → 9 nav) | Rebuilds the whole SME sidebar. Steps 4 and 6 add things into that new structure. Doing this after them means building those screens twice. |
| **3** | **Task 2** (carrier build) | Carrier-only screens (`car*` functions). Barely touches the SME side, so it is safe once the sidebar has settled. |
| **4** | **Task 5** (email) | Adds a carrier button (needs Task 2's carrier screens to exist) **and** an SME notification (needs Task 1's What's New to be settled). So it goes after both. |
| **5** | **Task 3, Phase B** (adviser AI note) | Adviser workspace only. Independent of everything above. |
| **6** | **Task 4/6** (landing page + gap snapshot) | Landing page is mostly new markup. But the **gap snapshot sits on the SME Overview**, so it must come after Task 1 has restructured it. |
| **7** | **Task 6** — Connect → real Xero | Closes the one place the product overclaims. Must land after Task 4/6, because Task 4/6's landing page copy claims this integration exists. |
| **8** | **Task 7** — PDF quality report | ~70% already built in `ocr.py`. Independent of everything else. |
| **9** | **Task 8** — onboarding 14 → 2 | Reframes the upload screen, which Task 1 will have moved into **Documents**. Must come after it. |
| **10** | **Task 9** — concentration risk | Extends `supplychain.py`, surfaces on the Protection screen Task 1 built. Last because it is the least load-bearing for judging. |

**If time runs out, drop in this order:** Task 9, then Task 8. Tasks 6 and 7 are the two
that change what you can honestly claim on stage — keep them.

### Between every step

```
node --check web/app.js
python -m pytest -p no:warnings
```

Green before moving on, and **commit at each step.** Six tasks stacked into one
uncommitted change set is unrecoverable if step 5 goes wrong.

### Files that get touched repeatedly

- `web/app.js` — every task. It is 113 KB; expect to re-read the region before each edit
- `src/proven/api.py` — tasks 2, 3, 4/6, 5
- `tests/test_api_v2.py` (`COVERED` set) — tasks 2, 4/6, 5 all add routes to it

---

## Task 1 — Reduce 23 sections to 9

**File:** `1st task.txt` · **Touches:** `web/app.js` · **Step 2**

Collapses the SME sidebar from 23 items to 9. Nothing is deleted — screens become
tabs or sections inside larger screens.

- Overview, What's New, Share with Adviser, Your Record — unchanged
- **Protection** — 4 cards (Property / Cyber / Supply Chain / Business Interruption) + the claim scenario tool
- **Timeline** — what changed this year + how this crept up + what we found, one list, All-time/This-year filter
- **Actions** — things to do + what would help + growth stage
- **Monitoring** — your business / around you / public records / costs, as tabs
- **Documents** — upload + what we haven't checked

**Keep What's New separate from Monitoring.** What's New is "this just happened".
Monitoring is "the full picture". Different jobs.

**Done when:** all 9 destinations reachable, every old screen's content still findable,
`node --check web/app.js` passes, suite still green.

---

## Task 2 — Zurich carrier build

**File:** `2nd task.txt` · **Touches:** `web/app.js`, `api.py`, `presenter.py`, new modules, tests · **Step 3**

Carrier currently has 5 read-only screens reading only 2 endpoints. Make it a
workspace an underwriter can question and act on.

**Plumbing:**
- **A1 Case detail** — open an account, see findings + evidence + document trace. Reuse `renderDecision()` and `/api/orchestrator/evaluate`
- **A2 Undisclosed facts inbox** — Discovery's findings aimed at the underwriter. Reuse `watchlist.py` + `notifications.py`, do not write a second change-detection engine
- **A3 Request a document** — carrier asks, SME replies. Follow `POST /api/adviser/request-information`. Actor from session, never from request body
- **A4 Decision record** — Reviewed / Accepted / Needs endorsement. Append-only, feeds `/api/record`

**AI (rules decide, AI only words or retrieves):**
- **B1** Ask the book a question — reuse `ai.answer_question()` + `Retriever`, scope across the book, cite account + document + page
- **B2** Portfolio briefing — new presenter purposes (`carrier_briefing`, `carrier_account_summary`). Template first via `_fb_*`, model rewords only `_MODEL_OWNS`, all four gates apply
- **B3** Explain finding, underwriter framing — reuse `ai.explain_finding()`
- **B4** Renewal triage — deterministic disclosure-delta ranking, AI writes the one-line reason
- **B5** Systemic patterns — rules find them, AI writes the sentence

**Hard limits:** no premium figures anywhere (`test_actions.py` fails the build),
no SME risk score for underwriting, no model decides anything, every route role-guarded.

**Done when:** ~8 carrier screens, new routes in `COVERED`, tests for every new
module and route, suite above 851 and green.

---

## Task 3 — Adviser part (answers "is adviser needed?" — yes)

**File:** `3rd Task.txt` · **Touches:** `api.py`, `ai.py`, `web/app.js`, tests
**Split across the schedule: Phase A is Step 1 (first thing you do). Phase B is Step 5.**

### Phase A — the security fix (verified live, not theoretical)

I tested this against the running server. Logged in as **carrier**:

```
403  GET  /api/brief                 <- correctly blocked
403  GET  /api/score                 <- correctly blocked
200  GET  /api/evidence/search       <- LEAKED  340000, "Tai Seng", total_sum_insured
200  POST /api/ai/ask                <- LEAKED  340000, 100000
```

Adviser without consent: same leak. None of these four routes has `_deny_foreign_role`
or `_require_role`, while `/api/brief` and `/api/score` both do.

A Zurich underwriter can read the SME's stock figure and premises address right now.
Close it:

- **Owner** — normal access to their own case
- **Adviser with consent** — only disclosed material, via existing `pipeline.disclosed_brief()`. Do not write a second disclosure implementation
- **Adviser without consent** — 403
- **Carrier** — 403 on all four routes, no special AI read path

Evidence search must be **authorization-first**: resolve permitted chunks, *then*
search. Never retrieve the whole case and filter after.

**Phase A gate:** add the regression test using the exact query `"stock sum insured"`
asserting a carrier gets 403 and never receives `total_sum_insured_sgd`. Run the suite.
**Do not start Phase B until the security tests pass.**

### Phase B — AI adviser review note

AI drafts a file note from material the adviser is authorised to see. Deterministic
grounding check rejects any invented citation, page number or figure. Adviser must
explicitly save. Three states: `AI_DRAFT` / `ADVISER_EDITED` / `ADVISER_APPROVED`.
Never auto-send to SME or Zurich. Not exposed to the SME in this task.

Banned phrases unless part of a verbatim quote: "you are covered", "not covered",
"the insurer will pay", "the claim will fail", "guaranteed", "breach", "violation".

---

## Task 4 & 6 — Landing page + gap experience

**File:** `4th and 6th task.txt` — 1392 lines, sections 0–48, complete
**Touches:** `web/index.html`, `web/app.js`, `web/styles.css`, `api.py`
**Step 6 — do this last**

Apply the two corrections above before starting: **ignore all 9 Groq mentions**, and
**`/api/renewal` is really `/api/renewal/compare`**.

**Build the gap snapshot against the sidebar Task 1 produced, not the current one.**
The snapshot goes on the SME Overview, which will have been restructured by then.

### Part A — landing page and login

- `GET /` unauthenticated → real product landing page. Authenticated → their workspace
- `GET /login` → always the login page. An authenticated user visiting it → redirect to their workspace
- Narrative: *"Your business changes. Your insurance often doesn't. Veris continuously checks whether the two still match."*
- Sections: hero + two-agent diagram (Connect = inside, Sentinel = around), why-Veris, trust/evidence chain (source → retrieval → evidence → rules → decision), who it helps, one worked example (stock S$100k insured vs S$150k documented)
- Custom SVG/CSS only. No AI-generated art, no generic SaaS gradients, no neon. Respect `prefers-reduced-motion`
- Login redesigned as a continuation of the landing page. Keep `POST /api/auth/login` as-is — **server decides the role**, no client-side role selection
- Demo accounts stay usable but behind a small "Try the demo" toggle, not splashed across the hero
- Route after login: SME → `/app`, Adviser → `/adviser`, Carrier → `/carrier`. Session must survive refresh; invalid session → `/login`

### Part B — gap discovery and communication

The backend logic is already correct. **Do not change it.** Specifically:

- Never convert `UNKNOWN` → `GAP`
- Never convert "cannot determine" → "not covered"
- Never manufacture severity the evidence does not support
- Keep the existing `silent_gap` concept in `blindspots.py` (verified present, lines 31/143/153/195)

Build a **Gap Snapshot** presentation layer over the existing endpoints
(`/api/blindspots`, brief, score, cyber, dependency, actions, gaps, renewal,
compounding). **No second source of truth, no second blindspot engine.**

Three categories, deliberately not all called "gaps":
- **Action required** — confirmed, evidence-backed
- **Needs verification** — possible, more evidence required. Say *"cannot confirm yet"*, never *"you are not covered"*
- **Not yet assessed** — neutral/grey, **not red**

Plus: category map (green/amber/red/grey), deterministic prioritisation (never AI-invented),
gap-age timeline for the 481-day item without fear language, executive summary at top,
evidence drawer on click, default view shows only top 3 + what's uncertain + best next action.

### What the prompt now covers (sections 37–48)

The previously-missing tail is present and good. Key points:

- **§37/38** — `GET /api/gap-summary` is a **composition layer only** over existing
  endpoints. No duplicated business rules, no second blindspot engine. Don't leak
  internal enum names to the frontend
- **§39/40** — the landing page must not load the case engine to render marketing;
  login must not fetch brief/score/blindspots before authentication
- **§41** — landing, login and gap summary all fully responsive; gap status must not
  depend on a wide desktop table
- **§42** — gap states must not rely on colour alone. Icon + label + text
- **§44/45** — acceptance criteria with the exact redirect paths per role
- **§46** — the language rules. Never *uncertain → gap*, never *not assessed →
  uncovered*, never create fear from missing evidence. **This is the section that
  protects the engine's honesty from the UI. Treat it as non-negotiable.**
- **§47** — testing

### Additions to §47's test list

- Any new route added to the `COVERED` set in `tests/test_api_v2.py`
- `tests/test_frontend.py::test_every_fetched_path_is_a_real_route` still passes
- Replace "Groq failure" + "Groq missing" with a single test: model unavailable →
  deterministic fallback wording still works
- A test asserting `/api/gap-summary` returns nothing that isn't already derivable
  from the existing endpoints (proves it is composition, not a second engine)

### Definition of done

- `node --check web/app.js` passes
- Full suite green and **above 851**
- Manual: all three roles log in and land on the right workspace; refresh preserves
  session; an authenticated user visiting `/login` is redirected to their workspace

---

## Task 5 — Email SMTP configuration

**File:** `5th task.txt` · **Touches:** `mailer.py`, `notifications.py`, `api.py`, `web/app.js`, tests · **Step 4**

Depends on Task 2 (needs the carrier screens to hang the button on) and Task 1 (needs
What's New settled). Do not start it before both.

Carrier-initiated email so Zurich can tell an SME "something changed, please review".

- Three new codes: `CARRIER_REVIEW_REQUESTED` (HIGH), `CARRIER_RENEWAL_REMINDER` (MODERATE), `CARRIER_INFORMATION_NEEDED` (HIGH)
- `deliver()` gains an optional `sender_brand` so the carrier path sends as **"Zurich"**. Do not global-replace `BRAND` — agent emails must keep saying **VERIS**, because VERIS sent those
- `owner_email` added to carrier account records; `PROVEN_NOTIFY_TO` still wins so demos don't bounce off `.demo`
- `POST /api/carrier/notify`, role-guarded, closed template vocabulary, dedupe on account + template
- SME side: it lands in `/api/notifications` automatically. Make it **visually distinguishable as from the insurer, not from VERIS** — that distinction is the whole feature

**The hard constraint:** the email contains **only** business name + book-level
`lead_reason` + a call to action. No figures, no clause quotes, no findings, nothing
derived from the SME's documents. Zurich is book-level only. Add a test asserting this
against the actual finding headlines.

Singapore Spam Control Act 2007 / IMDA: working unsubscribe (the preference system
already is one) and a subject label where the send is bulk/commercial rather than a
transactional notice to an existing policyholder. Encode the distinction, comment the
reasoning.

---

## Global rules — apply to every task

These come from the existing codebase and break the build if violated.

1. **CSP is `script-src 'self'`.** Inline `onclick=` is impossible. Use `data-act` + `data-arg` and register the handler in the `ACTIONS` map at the top of `app.js`
2. **One route per decorator.** Stacking is banned
3. **Every new route** goes in the `COVERED` set in `tests/test_api_v2.py` or `test_every_declared_route_is_covered_by_a_test` fails
4. **`tests/test_frontend.py`** parses every `api("...")` call in `app.js` — a typo'd path fails the suite
5. **`esc()` every server value** in the frontend. The HTML mail path stays escaped
6. **Grep `styles.css` before using a CSS class.** Do not invent class names
7. **Never claim an email was sent when it wasn't.** Outbox + honest status
8. **No premium figures anywhere.** `actions.py` forbids them structurally
9. **AI proposes / explains / retrieves → deterministic verification → human decides.** Never AI → insurance decision
10. **Tests run fully offline.** `conftest.py` strips model keys and forces `PROVEN_LIVE_SOURCES=0`. Mock the transport, assert on the gates
11. **Comments explain WHY**, especially where a simpler option was rejected
12. **Do not weaken or delete existing tests.** 851 is the floor

### Before reporting done, every task

```
cd <your proven path>
node --check web/app.js
python -m pytest -p no:warnings
```

Report the **real** pass count and say plainly what you could not verify.
Do not claim something works unless it was actually tested.

---

## Running the demo

Two servers, two terminals:

```powershell
# the business's own website (for the Discovery/scraping demo)
cd E:\SFF\SFF1\SFF-preran\proven
python demo-site/site.py                      # -> :8100

# the product
cd E:\SFF\SFF1\SFF-preran\proven\src
$env:PROVEN_LIVE_SOURCES="1"
$env:PYTHONIOENCODING="utf-8"
$env:PATH="C:\Program Files\Tesseract-OCR;"+$env:PATH
python -m uvicorn proven.api:app --port 8000
```

Operator panel to change the business live: `http://127.0.0.1:8100/operator`

| Role | Email | Password |
|------|-------|----------|
| Business owner | `owner@hockleefoods.demo` | `Demo@123` |
| Adviser | `adviser@lionbrokers.demo` | `Demo@123` |
| Carrier | `underwriter@carrier.demo` | `Demo@123` |

---

## Tasks 6–9 — closing the last four gaps

These four were **not** covered by any of the five prompts above. Together they take the
build from "~90% of the problem statement" to a product that survives a hostile Q&A.

Each one is researched, each reuses a seam that already exists, and none needs data we
do not have. Do them **after** steps 1–6, in this order.

---

### Task 6 — Make Connect real (Step 7) — highest value of the four

**The problem:** `connectors.py` is fixture data. Line 4 of its own docstring says
`SIMULATED read-only accounting feed`, and every signal carries `"simulated": True`.
Meanwhile Task 4/6's landing page (§6) will tell visitors Connect "works with the
systems your business already uses" and list Accounting / Inventory / Payroll / ERP / POS.

That is the one place this product overclaims, and overclaiming is the thing it
otherwise refuses to do. Fix the code, not the copy.

**The solution — free, real, no credit card:**
- **Xero** gives a free developer account with a **Demo Company** containing real
  invoices, contacts and accounts. OAuth 2.0 (no API-key auth). Their API Explorer
  makes real calls against that demo data
- **QuickBooks** alternative: a free `developer.intuit.com` account auto-creates a
  **sandbox company** with region-specific sample data
- Recommend Xero — the demo company is richer and region-switchable

**What to build:**
- Real OAuth 2.0 against Xero's Demo Company. Real HTTP, real JSON back
- `connectors.py` already has the exact seam: a `Signal` dataclass (L44) and
  `timeline()` / `signals()` / `catalogue()` as the public API. **Keep those signatures.**
  Swap the source underneath
- Derive the signals already faked, now from real data: stock value from inventory
  items, headcount from payroll/contacts, asset purchases from bills
- Flip `"simulated": True` → `False` **only on the rows that really came from Xero**.
  Never blanket-flip it
- `author_class` becomes `THIRD_PARTY` (an external system said it), not `SELF`
- **Keep the fixture as the labelled fallback.** Copy the pattern
  `discovery.py` uses with `config.demo_site_url()`: if OAuth is not connected, fall
  back and say so on screen. Never render a fixture as live
- Credentials via env only (`PROVEN_XERO_CLIENT_ID` / `_SECRET`), following
  `config.py` conventions. Never in source, never returned by an endpoint

**Tests:** signals from a mocked Xero response are labelled `simulated: false`;
with no OAuth configured the fixture path still works and is labelled `simulated: true`;
a token refresh failure degrades to fixture rather than raising; no endpoint leaks the
client secret.

**Note:** OAuth token refresh and the consent redirect are the only genuinely fiddly
part. Budget for that, not for the API calls.

---

### Task 7 — PDF quality report (Step 8) — ~70% already built

**The problem:** the corpus is cleaner than reality. Published research (arXiv, May
2026) found high OCR accuracy does **not** guarantee good downstream retrieval —
structural errors break it even at low character error rates. Clean printed text scores
96–99%; annotated or handwritten drops to ~80%; complex layouts ~60%. Rotated pages
break parsers before OCR even starts.

**What already exists — read it before writing anything:**
- `ocr.py` has `LOW_CONFIDENCE_THRESHOLD = 55.0` (L44)
- `OCRPage.status` is already three-state: `OK` / `LOW_CONFIDENCE` / `EMPTY` (L95)
- `OCRBlock` already carries per-block `confidence` (L79)
- `05-illegible-scan.pdf` is already correctly rejected on upload

**What to build:**
- **Pre-OCR image conditioning** — deskew, denoise, upscale low-DPI. The research is
  explicit that the extraction layer matters more than the model layer, so this is where
  real accuracy comes from
- **Per-page quality report**, surfaced to the user: *"page 9 of 28 was scanned at low
  quality — the exclusion clause on it may be incomplete."* Page-level, not
  document-level. Page 9 is where LMA5401 lives, so this is not hypothetical
- **A LOW_CONFIDENCE span may never support a PROVEN finding.** Cap it at
  `UNESTABLISHED` automatically. Same discipline as the website-is-SELF-authored rule —
  the confidence of the *extraction* constrains the class of the *evidence*
- Document-level summary: "26 of 28 pages read cleanly, 2 uncertain"

**Tests:** a synthetic low-confidence page cannot produce a PROVEN finding; the
per-page report names the specific pages; a skewed input still extracts after
conditioning; an unreadable page is reported, not silently dropped.

**Why this is worth doing:** it converts your weakest area into a trust feature.
*"We tell you which pages we could not read, and we refuse to base a finding on them."*

---

### Task 8 — Onboarding: 14 documents down to 2 (Step 9)

**The problem:** a real SME will not have a CPF record, an ACRA profile extract and
management accounts ready. The demo hides this behind one button; a pilot would not.

**The solution — Singapore built the answer, and it went live this year:**
- **Myinfo Business** became available for onboarding **18 May 2026** — consent-based
  sharing of verified corporate data, explicitly to reduce manual data entry
- Singapore banks already use Myinfo to prefill loan and credit-card applications.
  Same pattern, different form
- **ACRA API Marketplace** (live since 26 May 2024) is the structured version of the
  profile currently being uploaded as a PDF

**What to build:**
- **Mandatory set drops to 2**: policy wording + policy schedule. That is the
  irreducible minimum — nothing else can establish what cover exists
- Everything else becomes **progressive disclosure**: each screen asks for the one
  document that answers its own open question. `voi.py::rank_information_gaps()` (L257)
  already computes exactly this ranking — surface it per screen instead of as one list
- **Prefill company identity from ACRA** rather than asking for
  `09-acra-business-profile.pdf`. The ACRA datastore is already called in
  `discovery.py` — extend it. Treat Myinfo Business as a documented seam, not a
  hackathon build
- **Completeness meter**: *"2 of 14 uploaded — enough to assess 3 of 6 areas."*
  `blindspots.py` already knows what it cannot assess and why. This is a UX reframe over
  logic that exists
- The upload screen must work with 2 documents and not look broken or half-finished

**Tests:** the app produces a useful assessment from wording + schedule alone; each
unassessed area names the single document that would unlock it; the completeness meter
matches `blindspots.py` rather than being computed twice.

---

### Task 9 — Concentration risk, not a supply-chain map (Step 10)

**The problem:** `supplychain.py` checks "is my named supplier on the schedule" and the
brief says "supply chain". A judge may expect more.

**The reframe — and it is stronger than a fake map:** the industry's own term for what
you can actually evidence is **concentration risk** / **supplier dependency mapping**.
Riskledger's own literature says a supplier register "tells you who you have a contract
with. It doesn't tell you who that supplier can't function without." The named blind
spot is **sub-tier concentration** — three suppliers who all depend on one upstream
plant are one supplier, not three.

So: do not attempt a multi-tier map. Detect **concentration from documents already read**.

**What already exists:**
- `_suppliers_from_documents(store)` (L204)
- `_utility_dependencies(facts)` (L241) — already reads cold-storage electricity off the
  tenancy's permitted use
- `_landlord_dependency(facts)` (L288)
- `_cbi_state(facts)` (L306)

**What to add:**
- **Single-supplier concentration** — one supplier across multiple invoices with no
  alternate named
- **Geographic concentration** — all premises in one postal district. You already have
  the addresses
- **Utility single point of failure** — already detected; state it as a concentration
  finding
- **Landlord concentration** — already detected; same treatment
- Then say the honest, sharper thing: *"You have one cold-storage supply and no
  alternate named. Contingent business interruption only responds to suppliers listed
  on the schedule. Yours lists none."*
- **Frame the boundary as the feature**: "we map the dependencies your documents
  evidence, and name the ones we cannot see." That is the abstention discipline applied
  to supply chain

**Do not:** invent a supplier the documents do not name, or assign severity to a
dependency that is only inferred. Same rule as everywhere else.

**Tests:** concentration is only reported where a document evidences it; an inferred
dependency never reaches PROVEN; the CBI-lists-none finding cites the schedule.

---

## What is still open after tasks 6–9

Be ready to say these out loud rather than have them found:

- **Myinfo Business is a seam, not an integration** (Task 8) — it needs a real
  onboarding agreement with GovTech. Documented and designed for, not wired
- **Xero Demo Company is a demo company** (Task 6) — the OAuth, the HTTP and the
  parsing are real; the business in it is Xero's sample data, not a real customer's
- **Sub-tier supply chain remains invisible** (Task 9) — by design. We report what
  documents evidence and name what we cannot see
- **Connect covers accounting only** — payroll, POS and ERP stay listed as seams unless
  Task 6 comes in under budget
