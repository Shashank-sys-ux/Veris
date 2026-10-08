# SFF 2026 — Global FinTech Hackcelerator · PS 03 (Zurich, "Closing the SME Protection Gap")

**Project: PROVEN** — reads the documents a small business already holds, computes
what its insurance would actually pay, grades every finding by the strength of the
evidence behind it, and hands a licensed adviser a prepared case.

**Team:** Preran S Gowda · Shreya Belavatha Jayaram · Shamanth M S · Shashank S · Chithsukhi C V

---

## Resuming work

**`MASTER-PROMPT.md`** — paste the block in that file into a fresh AI session with
this folder open. It carries the verified clauses, the decisions not to re-litigate,
the engineering constraints, and the next actions. Keep it current.

## The build

`proven/` is the implementation and is the authoritative tree — 42 source files,
158 tests passing. Run it:

```powershell
cd proven
python -m venv .venv ; .\.venv\Scripts\Activate.ps1 ; pip install -r requirements.txt
python -m pytest -q
python -m uvicorn proven.api:app --app-dir src --port 8077
```

**`00-current/product-readiness.md`** is the honest state of it: what was fixed, what
blocks calling it a product, and the solution for each. Read it before touching code.

## Read these three, in this order

| File | What it is |
|---|---|
| **`00-current/finalized-idea.md`** | The authoritative idea. Thesis, wedge, architecture, demo, competitive position, business model, red team. Start here. |
| **`00-current/technical-implementation.md`** | Build spec. Schema, taxonomy, rules, gates, build order, definition of done. Someone with no context can build from this. |
| **`00-current/verification-errors.md`** | Verification of the idea against the competition rules. Deadline confirmed, two compliance-hygiene fixes outstanding. |

Everything else is provenance for those three.

---

## Folder map

```
00-current/            The live documents. If it isn't here, it's history or evidence.
01-competition/        The T&C (governing document) + full text extraction
02-team/               Resumes, 5 members
03-sessions/           Chronological working notes (session-1, session-2)
04-team-contributions/ Teammates' own idea documents + the superseded merge
05-research/           Two research dossiers (competitors, Zurich/regulatory)
06-evidence/           Primary sources. This is what makes the claims checkable.
  policy-wordings/       Real PDFs
  case-law/              Grace Electrical v EQ Insurance [2016] SGHC 233
  extracted-text/        pypdf extractions used for clause verification
  wording-corpus/        18 additional wordings/pages — see MANIFEST.md
  cross-carrier-findings.md   Four clause scans across 3 carriers, page-cited
  scripts/               Extraction and scanning tools
    scan_corpus.py         Four topic scans across the 3 full wordings
    dump_clause.py         Print an exact clause span with its page number
proven/                The build
  taxonomy/              taxonomy.yaml — 40+ clause codes, each traced to a real clause
  fixtures/              Hock Lee Foods synthetic documents, 7 planted defects
```

---

## Renames applied during cleanup

| Was | Now | Why |
|---|---|---|
| `finalized idea.md` | `00-current/finalized-idea.md` | Spaces in filenames break scripts |
| `technical implementation.md` | `00-current/technical-implementation.md` | Same |
| `finalized idea erros.md` | `00-current/verification-errors.md` | Typo fixed, clearer name |
| `sff-2026-zurich-ps03-competitive-map.md` | `05-research/competitive-map.md` | Folder already gives the context |
| `sff-2026-zurich-regulatory-singapore.md` | `05-research/zurich-regulatory-singapore.md` | Same |
| `wordings/` | split into `06-evidence/*` | PDFs, extractions and scripts were mixed together |
| `_research_tmp/` | `06-evidence/wording-corpus/` | 18 real wordings were sitting in a temp folder with unreadable hash filenames |

Nothing was deleted. `_research_tmp/` may remain as an empty locked directory —
safe to delete manually.

---

## Where the important claims come from

Every clause the demo cites is verifiable from files in this repo.

**Cross-carrier scan, three carriers, 118 pages — `06-evidence/cross-carrier-findings.md`.**
Every one of four scanned behaviours diverges across carriers, and one diverges
*within* a single wording:

| Behaviour | Chubb (28pp) | MSIG SUMO (41pp) | Liberty SMECare (49pp) |
|---|---|---|---|
| Average threshold | 85% | **none — any shortfall** | none in GC4 |
| Average formula in text | No | No | **Yes, verbatim** |
| Condition-precedent declaration clause | **Absent** | **Present, sweeping** | Arbitration only |
| Premium payment warranty | 60d / auto-terminate / S$25 | identical | identical |
| Unoccupancy day count | **14** | **30** | **30, but 7 in one section** |

| Claim | Source |
|---|---|
| Average clause, 85% threshold, **no formula stated** | `06-evidence/extracted-text/chubb-selectplus-fulltext.txt` cl 4.2 |
| Average formula **stated verbatim** by one carrier | Liberty SMECare p.6 and cl 5 p.46 |
| Average with **no threshold at all** — any shortfall bites | MSIG SUMO GC12 p.38 |
| General declaration clause making compliance a condition precedent | MSIG SUMO preamble p.1 and GC p.36 |
| Premium warranty identical across 3 carriers (GIA standard) | Chubb cl 3.20, MSIG p.41, Liberty cl 14 p.40 |
| Unoccupancy 7 days in one Liberty section, 30 in others | Liberty p.31 vs p.13/p.30/p.45 |
| Theft excluded unless forcible entry, or Schedule elects Full Theft | cl 5.1(c)(i) |
| Forcible/violent-entry theft condition is **market-wide, 4 insurers** (Chubb, MSIG, Liberty, Great Eastern) | `06-evidence/wording-corpus/MANIFEST.md` |
| Water escape excluded when Vacant beyond 14 days | cl 5.1(b)(v), definition cl 2.35 |
| Premium payment warranty — **cover automatically terminated** after 60 days | cl 3.20(a) |
| Alteration — **self-executing**, no liability for altered risk until written agreement | cl 3.1 |
| Minimum Security — locks, ground-floor windows | cl 4.9 |
| Order of operations: average → sub-limits → deductible | cl 3.12 |
| **No condition-precedent declaration clause in this wording** | searched all 28 pages, zero hits |
| Statutory breach barred a S$1m indemnity, action dismissed | `06-evidence/case-law/grace-electrical-fulltext.txt` at [72] |
| Registration closes 14 Aug 2026 2359 SGT | `01-competition/tnc-fulltext.txt` cl 7.3 |

---

## Open items

Not blockers for code. Blockers for the deck.

1. **No measured error rate yet.** The stated differentiator. Needs a labelled set,
   which needs someone who can distinguish a warranty from a condition precedent.
2. ~~Only one wording verified.~~ **Closed.** Three carriers, 118 pages, four
   targeted topics — `06-evidence/cross-carrier-findings.md`. What remains is
   narrower: the MSIG and Liberty **theft clauses** have been keyword-counted but
   not read in full, so the forcible-entry finding is not yet demonstrably
   market-wide. That is the highest-value remaining hour.

   Two corrections made along the way, both to this file: an earlier draft claimed
   four new Singapore wordings including AIG Restaurant and OCBC BizProtect — those
   are a **proposal form** and a **benefits schedule**, and the latter is
   underwritten by Great Eastern, not OCBC. And `finalized-idea.md` had said MSIG
   published no wording PDF; the full 41-page policy is public and now in the repo.
3. **JTC lease insurance covenant** unread. Trigger row only.
4. **Zurich Singapore WICA designated-insurer status** unconfirmed.
5. **No domain reviewer named.** Binding constraint on the labelled set.
6. **Open-source appendix** required by T&C cl 9.6(c) — per-component role
   disclosure, not just a licence list.
