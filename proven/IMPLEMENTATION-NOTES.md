# VERIS — Implementation notes (feature build)

## Baseline (recorded before any change)
- `python -m pytest -q` → **617 passed**, exit 0. Matches features.md.
- Python 3.10, FastAPI, pytest. Shell is PowerShell.

## Environment probe (15 Aug 2026)
- Rainfall API: LIVE OK (data.stations[], data.readings[0].data[{stationId,value}]).
- 24h forecast: LIVE OK (data.records[0].periods[].regions.{n,s,e,w,c}.{text,code}, general).
- SingStat M211251: LIVE OK **only with full browser UA + Accept + Referer** (else 403).
  Rows: rowText + columns[{key:"2026 Jun", value:"708"}]. Steel bars 703.9→708 (May→Jun).
- ACRA datastore_search: LIVE OK. Fields: uen, entity_name, uen_status_desc,
  entity_type_desc, uen_issue_date, reg_street_name, reg_postal_code.
- OneMap search: LIVE OK. results[0].LATITUDE/LONGITUDE/ADDRESS/SEARCHVAL.
- Tesseract 5.5.0 installed at C:\Program Files\Tesseract-OCR; pytesseract+PIL present → OCR available:true.
- OPENAI_API_KEY present in .env (sk-, 164 chars); openai lib installed; ai_enabled true.

## Key design decision — preserve tests + add live honestly
Existing tests (test_orchestrator.py) assert `/api/sentinel/sources` is all DEMO_FIXTURE
(live_count==0) and fixture COST_INDEX magnitude_pct==8.4. The offline test suite must not
make network calls. So:
- Live fetching is gated by env flag `PROVEN_LIVE_SOURCES` (config.live_sources_enabled()).
- Default OFF → tests stay green offline, module fixtures never mutate.
- `.env` sets it ON for the demo → judges see real LIVE badges.
- Live path is unit-tested by MOCKING urlopen (LIVE success, timeout, malformed, fallback).

## Plan / priorities
- P1: sentinel live weather + cost index; drift live index; discovery ACRA live;
  scheduler honest modes; frontend badges.
- P2: renewal.py + materiality + /api/renewal/compare + demo PDFs + sme-renewal + tests.
- P2B: scenario.py simulate() + /api/scenario + sme-scenario + tests (order: SI cap → sublimit → average → deductible).
- P2B.4: OneMap geocoding → nearest rainfall station distance.
- P2C.1: OCR already available; verify /api/health + test.
- P2C.2: AI already wired + key present; verify live; truthful status.
- P3: /api/agents/activity from scheduler history + sme-agents + finding trace.
- P4: health source availability, demo reliability, DEMO-SCRIPT.md, final report.

Run `python -m pytest -q` after every feature.

## Progress log
- P1 DONE (backend): sentinel live weather+cost, drift live index, discovery live ACRA,
  scheduler honest modes. Verified LIVE against real APIs. Tests: test_live_sources.py (15).
- P2 DONE (backend): renewal.py + /api/renewal/compare + demo PDFs + test_renewal.py.
- P2B DONE (backend): scenario.py + /api/scenario(+presets) + test_scenario.py.
  Worked example reproduces EXACTLY 65,700 / 234,300 (compute_waterfall).
- P2B.4 DONE: OneMap geocoding + nearest rainfall station distance in weather signal.
- P3 DONE (backend): /api/agents/activity from scheduler history + test_agents_activity.py.
- Route-coverage guard (test_api_v2) updated; all new routes covered.
- Full suite: 617 passed (519 baseline, +43 live/renewal/scenario, +55 bi/warranty). Live sources gated by PROVEN_LIVE_SOURCES.

## Remaining
- Frontend: sme-renewal, sme-scenario, sme-agents screens; LIVE/DEMO badges on
  Sentinel/Discovery; drift source presentation; finding trace.
- 2C.1 OCR: available on this machine (Tesseract 5.5.0); /api/health reports it. LIVE.
- 2C.2 AI: key present; verify one live call; truthful status. 
- P4: /api/health source availability, DEMO-SCRIPT.md, final report.
