# Open-source appendix — PROVEN

Required by SFF 2026 Hackcelerate T&C **clause 9.6(c)**: not a bare licence list,
but a per-component statement of *what role each open-source material plays in the
Solution*. Verified against `01-competition/tnc-fulltext.txt`.

## Code dependencies

| Component | Licence | Role in PROVEN |
|---|---|---|
| **pypdf** | BSD-3-Clause | Layer 1 (Locate) — native PDF text extraction of the Chubb Select+ base wording, page by page. No OCR in the demo path by design; an OCR failure must never decide whether a citation lands. |
| **FastAPI** | MIT | Layer 4 API surface exposing the Review Brief, consent gate, case-lifecycle and book view. |
| **uvicorn** | BSD-3-Clause | ASGI server that runs the FastAPI app for the demo. |
| **pydantic** (v2) | MIT | Request-body validation on the API (`/api/consent`). |
| **PyYAML** | MIT | Loads the clause taxonomy (`taxonomy/taxonomy.yaml`) and the rule files (`rules/*.yaml`). Rules are data so a domain reviewer can read them without reading Python. |
| **python-multipart** | Apache-2.0 | Parses the multipart upload body on `POST /api/bundle`. Required by FastAPI for file uploads. |
| **scikit-learn** | BSD-3-Clause | **Optional, and deliberately non-decisive.** Backs `TfidfProposer` in `align.py`, which ranks candidate clause spans by character n-gram similarity. A proposer only *offers* spans; a deterministic slot verifier decides whether any span binds, so this component cannot change a finding. Not in `requirements.txt`: if the import fails, `TfidfProposer` falls back to the lexical proposer and the engine behaves identically. See the claim note below. |
| **pytest** | MIT | Test runner for the invariant, arithmetic, grading, gate, alignment, API and front-end contract suites (324 tests). |
| **hypothesis** | MPL-2.0 | Property-based tests for the settlement arithmetic (illustration never exceeds loss; a null threshold is never silently defaulted). |
| **httpx** | BSD-3-Clause | Test transport for `fastapi.testclient`, and the live HTTP sweep of every route. Test-time only. |
| **SQLite** (`sqlite3`, Python stdlib) | Public domain | The two-store data model (source / accounting / computation / case / record). No server. |
| **jsdom** | MIT | **Verification only, not shipped and not a dependency.** Installed transiently (`npm install --no-save`) to boot `web/index.html` in a real DOM against the running API and confirm the render path executes without throwing. Removed afterwards; the repository has no `package.json` and the front end still has no build step. |
| **React + Vite** | MIT | *Named in the build spec as the intended front end.* The shipped demo front end is dependency-free static HTML/CSS/JS (`web/`) so it runs with zero build step; React/Vite can replace it without touching the engine. |

## The claim about models, stated precisely

An earlier revision of the docs said "there is no model in this pipeline". With
`scikit-learn` available as an optional proposer that is no longer exactly true, and
an approximately-true claim is the kind of thing this project exists to avoid. The
accurate claim, which the architecture enforces rather than merely asserts:

> **No machine-learning model makes a consequential decision.**

The three-stage split in `align.py` is what makes that structural rather than a
promise. A proposer — lexical, TF-IDF, or a dense embedding model added later — may
offer any span it likes and is explicitly allowed to be wrong. Binding requires that
every mandatory structural slot match and no negative slot match, which is ordinary
regex over stored page text. The proposer gets no vote, and
`test_swapping_the_proposer_cannot_change_a_carrier_fact` fails the build if swapping
it ever changes a bound value.

Everything below Layer 2 — grading, precedence, settlement arithmetic, the abstention
gates — contains no model of any kind and never has.

## Data / evidence sources (not code, but disclosed for completeness)

| Source | Status | Role |
|---|---|---|
| Chubb Select+ Insurance Policy Wording, Singapore 07/2020 | Publicly downloadable | The base wording in the demo pipeline. Every clause the demo cites comes from it. |
| MSIG SUMO (2024-01), Liberty SMECare (2025-05) | Publicly downloadable | Cross-carrier verification on four targeted topics, and two of the three hand-read Singapore wordings in the alignment corpus. See `06-evidence/cross-carrier-findings.md`. |
| AIG Malaysia SME Fire & Perils; AIG Malaysia All Risks & BI; QBE Malaysia Retail Package; QBE Malaysia Industrial All Risk | Publicly downloadable | **The generalisation test.** Four wordings nobody on the team has hand-mapped, used to measure whether structural alignment finds mechanisms in a carrier it was never taught. Recall 8/8. Malaysian jurisdiction travels with every row and they are excluded from any Singapore market ordering. |
| *Grace Electrical Engineering v EQ Insurance* [2016] SGHC 233 | Public judgment | Authority for the locate-quote-escalate design rule on conditions precedent. |
| Marsh Singapore, "How the Average Clause affects your business insurance coverage" | Public article | The source of the drift argument: an asset fully insured at inception becomes partially insured as costs move, engaging the average clause with no change to the policy. Referenced in `drift.py`, rephrased rather than quoted. |
| Hock Lee Foods fixtures | **Synthetic**, authored by the team | Schedule and non-insurance documents for a fictional business. Labelled synthetic on screen, every time. |
| Cost index series in `drift.py` | **Synthetic**, authored by the team | Declared sample data, labelled `DECLARED_SAMPLE_SERIES` on every response that touches it. Shaped like a quarterly published series so substituting a real one (BCA tender price index, SingStat) changes the figures and nothing else in the method. |

## Provenance / anti-duplication note

New repository, new taxonomy, no code ported from any prior competition entry
(T&C cl 12.1(o)(iii), 12.1(q)). Techniques are reusable as background IP under
cl 14.2; code and taxonomy here are original to this submission.
