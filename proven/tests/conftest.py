import os
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

# ── TEST ISOLATION — the normal suite must NEVER touch the network ───────────
#
# `PROVEN_LIVE_SOURCES` flips Sentinel, Discovery and the drift index onto real
# outbound government-API calls. If it leaks in from the shell (it did once, turning a
# 90s offline run into a 9-minute run with failures), the deterministic suite would
# silently depend on the internet, API keys and external services.
#
# Force it OFF for the entire test process here, before any `proven` module is imported,
# so `python -m pytest -q` is deterministic and offline no matter what the environment
# holds. `config.live_sources_enabled()` reads this at call time, so overwriting it here
# is authoritative. The live paths are still fully exercised — by MOCKING the HTTP layer
# in test_live_sources.py, never by a real call — so nothing is weakened.
#
# A genuine live integration run is opt-in and lives OUTSIDE this suite: set the flag in
# the shell and run the app (see DEMO-SCRIPT.md / .env.example). It is deliberately not
# collected by the default `pytest` invocation.
os.environ["PROVEN_LIVE_SOURCES"] = "0"

# ── THE SAME RULE FOR MODEL KEYS ─────────────────────────────────────────────
#
# The flag above stops government API calls. It does not stop a model call, and model
# calls have leaked into the suite by accident: once `discovery.discover_business()` began
# asking a model to read each fetched page, all sixteen pre-existing discovery tests would
# have started making three paid HTTP requests each — on a machine where OPENAI_API_KEY is
# set at Machine scope, so every developer would inherit it silently.
#
# The damage is not mainly the cost. It is that assertions about fact counts would depend
# on what a non-deterministic model happened to return that morning, and the suite would
# fail on a train. So the keys are removed from the process before any `proven` module is
# imported. Tests that need the model path exercise it by monkeypatching the transport and
# asserting on the gates, which is where the risk lives.
for _model_key_env in ("OPENAI_API_KEY", "GROQ_API_KEY"):
    os.environ.pop(_model_key_env, None)

import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _force_offline_sources(monkeypatch):
    """Belt-and-braces per test: even if a test sets the flag, it is reset around it."""
    monkeypatch.setenv("PROVEN_LIVE_SOURCES", "0")
    for env in ("OPENAI_API_KEY", "GROQ_API_KEY"):
        monkeypatch.delenv(env, raising=False)
    yield
