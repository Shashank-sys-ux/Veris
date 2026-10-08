# Merged build — what changed and why

**Base:** `SFF - Shamanth` (536 tests) · **Ported from:** `SFF_Shreya` (366 tests)
**Result: 599 tests passing, 0 failing.**

Run it:

```powershell
cd proven
python -m pip install -r requirements.txt
python -m pytest                 # 599 passed
python -m uvicorn proven.api:app --app-dir src --port 8077
# then open http://127.0.0.1:8077
```

Three front doors: `/app` (owner) · `/adviser` (licensed adviser) · `/carrier` (underwriter).
Demo logins are listed at `GET /api/auth/accounts`; the password is `Demo@123`.

---

## Why Shamanth's tree is the base

Both forks implemented the Veris architecture. Shamanth's did it better in the places that
are hard to redo:

| | Shreya | Shamanth |
|---|---|---|
| Real LLM, gated, degrading | ❌ | ✅ `ai.py` — propose → verify → bind |
| Semantic retrieval | ❌ lexical | ✅ `retrieval.py`, real embeddings |
| Connector labelled `simulated` | ⚠️ state dicts | ✅ `connectors.py` |
| External-agent claim ceiling | ⚠️ severity strings | ✅ `sentinel.py`, structural |
| Six PDF decision states | ✅ | ✅ **already present** |
| `precedence_reason` on output | ✅ | ✅ **already present** |
| Password hashing | ⚠️ unsalted SHA-256 | ✅ salted, 381 lines of role tests |
| Protection score | ❌ | ✅ `score.py` |

Two things I expected to port turned out to be **already in Shamanth's orchestrator and
better implemented** — the six decision states and `precedence_reason`. That module also
carries the PDF's four conflict rules as its module docstring, with `STALE_AFTER_DAYS`
declared in one place so it can be argued with.

---

## Ported from Shreya

### 1. Three front doors — `api.py`

`/app`, `/adviser`, `/carrier`, plus `/login` and deep-link routes so a refresh on
`/adviser/queue` does not 404. Shreya's best product decision: three audiences reading the
same case for different reasons should not share one URL.

`GET /api/entrypoints` declares them **and says what they are not**:

> These paths select which view the single-page app opens. They are not an access boundary:
> authorisation is enforced server-side on the API routes, so opening `/carrier` without a
> carrier login shows a page that cannot fetch carrier data.

A route that merely looks private is worse than none, so the notice is part of the response
and `test_an_unauthenticated_carrier_page_cannot_fetch_carrier_data` pins it: the page
returns 200, `/api/carrier/portfolio` returns 401.

Implementation note: the deep-link routes are **separate functions**, not stacked
decorators. Stacking registers both paths under one operation id, which silently drops the
deep-link route from the OpenAPI schema — and a route an integrator cannot find in the
schema does not exist to them. The existing schema guard caught this.

### 2. Meeting notes as a second signal source — `connectors.py`

Shreya's most creative idea, and the one genuinely novel input in either tree.

Every transactional signal is a **consequence**: the freezer is already bought, the rent
line is already posted. By the time an accounting system knows, the exposure has existed for
weeks. A minuted decision is the same change observed **earlier**:

| Minuted | Transaction | Lead |
|---|---|---|
| 2 May — capex approved, blast freezer S$62,000 | 14 Mar posting | 41 days |
| 10 May — "lease signed, handover 1 June" | 1 Jun rent line | 22 days |
| 4 Jun — online storefront to go live mid-June | 18 Jun settlements | 14 days |

The evidence ceiling is **stricter** than the accounting feed's, and that is the point.
Minutes are owner-authored, so `author_class="SELF"` and `grades_as == "DECLARED"` — a
resolution to do something is not proof it was done. A note may raise a question and name
the document that would settle it. It may never move a figure.

`lead_days` and `anticipates` are carried so the interface can show what the early warning
was worth without implying the note evidences the outcome.

---

## Built fresh — the action loop (`actions.py`)

Neither fork had this, and it is the gap `EUREKA.md` called *"fix it before step 5"*.

Everything upstream detects. `connectors.py` sees the business move, `sentinel.py` sees the
environment move, `align.py` and `rules.py` prove what the policy would pay,
`orchestrator.py` decides what deserves attention. Then — until now — nothing happened. The
owner received a very well evidenced document about a S$50,000 shortfall and the shortfall
stayed where it was.

### The state machine

```
DRAFTED ──owner──► SENT_TO_ADVISER ──adviser──► ADVISER_REVIEWING
                                                   │
                        ┌──────────────────────────┼──────────────┐
                        ▼                          ▼              ▼
              INFORMATION_REQUESTED        QUOTE_RECEIVED   NOT_REQUIRED
                        │                          │
                        └──────────┐               ▼
                                   ▼        BOUND  /  DECLINED
                          ADVISER_REVIEWING
```

Nine states, four terminal. **The engine appears exactly once** — only `DRAFTED` is
machine-made; every other move belongs to a person, and
`test_engine_appears_exactly_once_in_the_transition_table` asserts it.

The actor comes from the **session role**, never the request body. An owner posting
`{"by": "adviser"}` gets a 409 `WRONG_ACTOR`. If they could self-report, the
exposure-closed figure would be worthless.

### The rule about money

`premium_basis` is a permanent `NOT_QUOTED`:

> Pricing a risk requires a rating engine, an underwriting appetite and an authorised
> underwriter, and this system has none of them.

Enforced three ways: the invariant refuses any other value, the schema has **no
price-shaped column** so there is nothing to roll up, and a test greps the serialised keys.

Inventing an indicative premium would be the fastest way to destroy the credibility that
verbatim citation and abstention were built to earn.

### What it does compute

One subtraction, over figures already evidenced elsewhere:

```
Observed value S$150,000  (ACCOUNTS, SELF)
less documented limit S$100,000  (SCHEDULE, INSURER)
= S$50,000 above the documented limit
```

Both provenances are named in `exposure_basis`. Where a figure is missing, there is no
number and the basis says why — `plant` has a documented limit and nothing that totals
current plant, so `ASSET_REGISTER` is requested rather than `invoice_equipment_value`
(one freezer at S$62,000) being subtracted to produce a confident wrong answer.

Interests measured in people carry `count_documented` / `count_observed` instead: 14 on the
CPF record against 11 declared on the WIC schedule. A count is not a sum insured.

### The defect worth naming

Two rules legitimately raise two corrections against the same stock shortfall:
`AVERAGE-ADEQUACY` asks for a limit increase, `SUBLIMIT-CONFLICTING-ENDORSEMENTS` asks for a
schedule amendment. Both carry S$50,000, because it is the same S$50,000.

Summing them reported **S$100,000 of exposure on a business with S$50,000 of it** — a
doubling, in the direction that flatters us, on the one figure the whole loop exists to
produce. Exposure is now counted **once per insured interest**, `exposure_by_interest` is
returned so the arithmetic can be checked by hand, and the response states its counting
basis.

`DRAFTED` is also excluded from `pending`: a prepared request has asked nobody anything, and
counting it would let the product report momentum it had not earned.

### Endpoints

| Route | Purpose |
|---|---|
| `GET /api/actions` | Every prepared or in-flight correction |
| `GET /api/actions/{id}` | One, with full history and permitted moves |
| `POST /api/actions/{id}/advance` | Move it, or 409 naming what *is* permitted |
| `GET /api/outcomes` | Did anything change |

Case deletion reaches all of them. This tree already shipped the defect where deletion
cleared the brief and left three other views serving the deleted business's data; an action
list is the worst version of that — it names a business, a figure and a request — so it goes
quiet first, with the same response shape as every other case-scoped view.

---

## Veris PDF conformance — checked by running it

| PDF requirement | Status |
|---|---|
| §2 Veris Connect (internal agent) | ✅ 8 signals across 4 declared sources |
| §3 Veris Sentinel (external agent) | ✅ structural claim ceiling, cannot emit `SME_INCIDENT` |
| §5 Shared RAG — one retrieval layer, not two engines | ✅ `retrieval.py`, both agents |
| §6 step 8 decision vocabulary | ✅ exact six-state match |
| §7 Decision Orchestrator, deterministic | ✅ no model in the decision path |
| §8 Rule 1 — internal establishes current state | ✅ external cannot overwrite |
| §8 Rule 2 — external is forward risk only | ✅ separate `risk_state` field |
| §8 Rule 3 — agreement raises priority, not certainty | ✅ 3 overlapping interests after signals applied |
| §8 Rule 4 — the reason is part of the output | ✅ `precedence_reason` on every decision |
| §9 worked example: stock S$150k vs index +10% | ✅ documented value kept, index not folded in |
| §15–16 autonomy loop | ✅ event-driven Connect, scheduled Sentinel |
| §18 adviser workflow: queue → evidence → request info → resolved | ✅ complete |
| §19 carrier Protection Attention Matrix | ✅ role-gated, Mode A refuses to aggregate |
| §20 two parallel sensing layers, one control point | ✅ |
| §21 abstain when evidence is insufficient | ✅ 7 actions listed without a figure, not estimated |
| §21 adviser remains the decision-maker | ✅ only `BOUND` closes exposure, adviser-only |

Rule 3 needs Connect signals applied first (`POST /api/signals/apply`) — which is correct:
with no internal signal there is nothing for an external one to agree with.

---

## Still open

| Item | Note |
|---|---|
| **`git init`** | Not done. Required as cl 12.1(o)(iii) evidence that this is new work. Do it now — the key is out of `.env.example` |
| **OCR** | Deliberately absent. Scans are refused with a clear message. Say so on stage |
| **Live connectors** | One simulated feed plus minutes, both labelled. A real Xero integration replaces `_FEED` with an HTTP call and changes nothing below it |
| **Sentinel sources** | `mode: DEMO_FIXTURE`. Same seam |
| **Persistence** | In-memory. Restart clears the case; the portable record can be exported and re-verified |
| **Named domain reviewer** | Still the largest credibility gap, and still a person rather than a sprint |
| **Deck / proposal / video** | Outstanding. Deadline 21 August |

## Doc corrections applied

Test counts in the inherited docs were stale (324 / 325 / 359 / 536 in different files).
The suite is **599**. Route count is now **58** product routes plus framework routes — 12
added by this merge (4 action-loop, 1 entrypoints, 7 page routes).
