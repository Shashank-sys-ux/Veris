"""Xero: the real accounting connector, and the label that must follow the fetch.

WHAT WAS WRONG, AND WHY IT MATTERED.

`connectors.py` described itself as a "SIMULATED read-only accounting feed" and every signal
carried `simulated: true`. That was honest, and it was the one place the product's reach fell
short of its own story: the landing page describes an agent reading the systems a business
already uses, and nothing did.

WHAT THESE TESTS GUARD.

One rule, and everything else is detail: **`simulated` is False only on a row that actually
came back from Xero.** Never inferred from "we are configured, therefore this is live".

Both directions are failures, and this codebase has now met both. A fixture rendered as live
is the unforgivable one. Live data rendered as a fixture is the bug found in `discovery.py`,
where website facts always used a module constant with `mode="DEMO_FIXTURE"` hardcoded, so
real fetched values were labelled simulated. So the flag is asserted in both directions here.

No network is touched. `conftest.py` forces the suite offline, so every HTTP boundary is
mocked and the assertions are about the GATES, which is where the risk lives.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from proven import connectors, xero
from proven.api import SESSIONS, app


@pytest.fixture
def client():
    SESSIONS.clear()
    xero.TOKENS.clear()
    with TestClient(app) as c:
        yield c
    SESSIONS.clear()
    xero.TOKENS.clear()


@pytest.fixture
def no_creds(monkeypatch):
    for key in ("PROVEN_XERO_CLIENT_ID", "PROVEN_XERO_CLIENT_SECRET"):
        monkeypatch.delenv(key, raising=False)
    yield


@pytest.fixture
def with_creds(monkeypatch):
    monkeypatch.setenv("PROVEN_XERO_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("PROVEN_XERO_CLIENT_SECRET", "test-client-secret")
    yield


# ── it works with no credentials at all ─────────────────────────────────────

def test_status_reports_unconfigured_without_raising(client, no_creds):
    body = client.get("/api/xero/status").json()
    assert body["configured"] is False
    assert body["connected"] is False
    assert body["mode"] == xero.DEMO_FIXTURE
    assert "fixture" in body["notice"].lower()


def test_connect_declines_politely_rather_than_erroring(client, no_creds):
    """A missing credential is a configuration state, not a crash."""
    body = client.get("/api/xero/connect").json()
    assert body["available"] is False
    assert "PROVEN_XERO_CLIENT_ID" in body["what_is_needed"]
    assert "developer.xero.com" in body["where"]


def test_the_fixture_feed_still_works_and_is_labelled(client, no_creds):
    """The floor: with nothing connected, the product behaves exactly as it did before."""
    body = client.get("/api/signals").json()
    assert body["events"], "the fixture timeline disappeared"
    assert body["live"]["any_live"] is False
    assert body["live"]["live_count"] == 0
    for event in body["events"]:
        assert event["simulated"] is True, (
            "a fixture row was labelled live with nothing connected")


def test_observations_are_empty_and_say_why(client, no_creds):
    body = client.get("/api/xero/observations").json()
    assert body["observations"] == []
    assert body["mode"] == xero.DEMO_FIXTURE
    assert body["fetch_log"]


# ── credentials are never served ────────────────────────────────────────────

def test_no_endpoint_returns_the_client_secret(client, with_creds):
    """A secret that can be read back over HTTP is not a secret.

    The client ID is deliberately NOT asserted against. In OAuth 2.0 the client id is public
    by construction — it travels in the authorize URL the browser is sent to, so it cannot be
    confidential and treating it as though it were would be security theatre. The secret is
    the credential that matters, and it appears nowhere.
    """
    for path in ("/api/xero/status", "/api/xero/connect", "/api/xero/observations"):
        text = client.get(path).text
        assert "test-client-secret" not in text, f"{path} leaked the client secret"
        assert "client_secret" not in text.replace('"client_secret_present"', ""), (
            f"{path} exposed a client_secret field")


def test_status_reports_presence_not_value(client, with_creds):
    body = client.get("/api/xero/status").json()
    assert body["client_id_present"] is True
    assert body["client_secret_present"] is True
    assert "client_id" not in body or body.get("client_id") is None


def test_the_authorize_url_carries_read_scopes_only(client, with_creds):
    """This product observes a business; it does not post journals into its books."""
    body = client.get("/api/xero/connect").json()
    assert body["available"] is True
    url = body["authorize_url"]
    assert url.startswith(xero.AUTHORIZE_URL)
    for scope in ("accounting.invoices.read", "accounting.contacts.read",
                  "accounting.settings.read", "offline_access"):
        assert scope.replace(".", "%2E") in url or scope in url.replace("+", " ")
    assert "write" not in url, "a write scope was requested"


# ── the label follows the fetch, in both directions ─────────────────────────

_XERO_ITEMS = {"Items": [
    {"Code": "STK-1", "QuantityOnHand": 100.0,
     "PurchaseDetails": {"UnitPrice": 900.0}},
    {"Code": "STK-2", "QuantityOnHand": 50.0,
     "PurchaseDetails": {"UnitPrice": 1200.0}},
]}
_XERO_CONTACTS = {"Contacts": [{"Name": "A"}, {"Name": "B"}, {"Name": "C"}]}
_XERO_BILLS = {"Invoices": [
    {"InvoiceNumber": "BILL-9", "Total": 62000.0, "Date": "2026-05-18",
     "Contact": {"Name": "Freezer Supplier Pte Ltd"}},
    {"InvoiceNumber": "BILL-1", "Total": 120.0, "Date": "2026-05-02",
     "Contact": {"Name": "Stationery"}},
]}


def _connected(monkeypatch):
    """Pretend a token exchange succeeded, and mock the three reads."""
    xero.TOKENS.save(access_token="tok", refresh_token="ref", expires_in=3600,
                     tenant_id="tenant-1", tenant_name="Demo Company (SG)")

    def fake_get(url, token, tenant_id=None):
        if "/Items" in url:
            return _XERO_ITEMS, ""
        if "/Contacts" in url:
            return _XERO_CONTACTS, ""
        if "/Invoices" in url:
            return _XERO_BILLS, ""
        return None, "HTTP 404"

    monkeypatch.setattr(xero, "_get_json", fake_get)


def test_live_observations_are_labelled_live(client, with_creds, monkeypatch):
    """The direction that was broken in discovery.py: real data must not say 'fixture'."""
    _connected(monkeypatch)
    body = xero.fetch_observations()
    assert body["mode"] == xero.LIVE
    assert body["observations"]
    for obs in body["observations"]:
        assert obs["simulated"] is False, (
            "data fetched from Xero was labelled simulated")
        assert obs["source"].startswith("Xero")

    # AUTHOR CLASS FOLLOWS WHO TYPED THE FIGURE, NOT WHOSE API SERVED IT.
    #
    # Every row here used to assert THIRD_PARTY on the reasoning that Xero is a third
    # party. That is the wrong test and it inverted the product's own rule. A business
    # that keys its own stock count into Xero has authored that number; serving it over
    # somebody else's API does not launder it into independent evidence.
    by_fact = {o["fact"]: o["author_class"] for o in body["observations"]}
    if "stock_value" in by_fact:
        assert by_fact["stock_value"] == "SELF", (
            "inventory the business maintains itself is SELF-authored")
    if "headcount_proxy" in by_fact:
        assert by_fact["headcount_proxy"] == "SELF", (
            "contacts the business flagged as employees are SELF-authored")
    if "asset_purchase" in by_fact:
        assert by_fact["asset_purchase"] == "THIRD_PARTY", (
            "an ACCPAY bill was issued by the supplier, so it is genuinely third-party "
            "evidence and the only one of the three that can support PROVEN")


def test_stock_value_is_computed_from_quantity_times_cost(client, with_creds,
                                                          monkeypatch):
    """100 x 900 + 50 x 1200 = 150,000 — the figure the average condition bites on."""
    _connected(monkeypatch)
    obs = xero.fetch_observations()["observations"]
    stock = next(o for o in obs if o["fact"] == "stock_value")
    assert stock["value"] == "150000"
    assert stock["unit"] == "SGD"


def test_headcount_is_labelled_a_proxy_not_a_payroll_record(client, with_creds,
                                                            monkeypatch):
    """Xero's contact list is not a payroll record, and calling it headcount would overstate
    what the API establishes. It must not be able to settle a WICA declaration."""
    _connected(monkeypatch)
    obs = xero.fetch_observations()["observations"]
    head = next(o for o in obs if o["fact"] == "headcount_proxy")
    assert head["value"] == 3
    assert "proxy" in head["basis"].lower()
    assert "not a payroll record" in head["basis"].lower()


def test_small_bills_are_not_treated_as_asset_purchases(client, with_creds,
                                                         monkeypatch):
    _connected(monkeypatch)
    obs = xero.fetch_observations()["observations"]
    assets = [o for o in obs if o["fact"] == "asset_purchase"]
    assert len(assets) == 1, "a stationery bill was treated as plant"
    assert assets[0]["value"] == "62000"


def test_the_timeline_mixes_live_and_fixture_without_blanket_flipping(
        client, with_creds, monkeypatch):
    """Live rows are PREPENDED, not substituted. Replacing the fixture would delete the
    minuted-decision signals that only exist there, and blanket-flipping the flag is the
    failure this whole module is written to avoid."""
    _connected(monkeypatch)
    body = connectors.timeline()
    assert body["live"]["any_live"] is True
    assert body["live"]["live_count"] >= 1
    assert body["live"]["fixture_count"] >= 1
    live_rows = [e for e in body["events"] if e["simulated"] is False]
    fixture_rows = [e for e in body["events"] if e["simulated"] is True]
    assert live_rows and fixture_rows, "the two provenances were merged into one label"
    for row in live_rows:
        assert str(row["id"]).startswith("XERO-")


def test_live_signals_keep_the_evidence_ceiling(client, with_creds, monkeypatch):
    """A feed is not a document. A Xero row may raise a question and name the document that
    would settle it; it may never produce a PROVEN finding on its own."""
    _connected(monkeypatch)
    rows, _ = connectors.live_signals()
    assert rows
    for row in rows:
        # The ceiling that matters is unchanged and is the point of the test: no signal
        # from a feed may reach PROVEN on its own, and every one must name the document
        # that would settle it.
        assert row["grades_as"] != "PROVEN"
        assert row["asks_for"], "a signal with no document to ask for is a dead end"
        assert row["author_class"] in {"SELF", "THIRD_PARTY"}

    # And the classes themselves follow authorship rather than transport. Two of the three
    # Xero rows are the business's own bookkeeping; only the supplier bill is independent.
    by_kind = {r["kind"]: r["author_class"] for r in rows}
    if "STOCK_VALUE" in by_kind:
        assert by_kind["STOCK_VALUE"] == "SELF"
    if "HEADCOUNT" in by_kind:
        assert by_kind["HEADCOUNT"] == "SELF"
    if "ASSET_ACQUIRED" in by_kind:
        assert by_kind["ASSET_ACQUIRED"] == "THIRD_PARTY"


# ── failure degrades rather than raising ────────────────────────────────────

def test_a_failed_refresh_drops_to_the_fixture_rather_than_raising(client, with_creds,
                                                                   monkeypatch):
    """The load-bearing failure mode. An expired token must not take down the screen."""
    xero.TOKENS.save(access_token="tok", refresh_token="ref", expires_in=-100,
                     tenant_id="t", tenant_name="Demo")
    monkeypatch.setattr(xero, "_post_form", lambda *a, **k: (None, "HTTP 400"))
    body = xero.fetch_observations()
    assert body["observations"] == []
    assert body["error"]
    assert xero.TOKENS.current() is None, "a dead connection was kept"

    # And the product still serves its timeline.
    feed = client.get("/api/signals").json()
    assert feed["events"]
    assert feed["live"]["any_live"] is False


def test_a_failed_read_does_not_invent_an_observation(client, with_creds, monkeypatch):
    xero.TOKENS.save(access_token="tok", refresh_token="ref", expires_in=3600,
                     tenant_id="t", tenant_name="Demo")
    monkeypatch.setattr(xero, "_get_json", lambda *a, **k: (None, "HTTP 500"))
    body = xero.fetch_observations()
    assert body["observations"] == []
    assert any(entry["outcome"].startswith("HTTP") for entry in body["fetch_log"])


def test_disconnect_returns_to_the_fixture(client, with_creds, monkeypatch):
    _connected(monkeypatch)
    assert xero.status()["connected"] is True
    body = client.post("/api/xero/disconnect").json()
    assert body["connected"] is False
    # Credentials are still configured, so the honest state is "configured but not
    # authorised" rather than "unconfigured" — the notice reflects that, and the feed
    # is verified below to have genuinely returned to its fixture.
    assert body["mode"] == xero.NOT_CONNECTED
    feed = client.get("/api/signals").json()
    assert feed["live"]["any_live"] is False
    assert all(e["simulated"] is True for e in feed["events"])


def test_a_callback_from_another_session_is_refused(client, with_creds):
    """State binds the callback to the session that started it, so it cannot be replayed."""
    r = client.get("/api/xero/callback?code=abc&state=not-this-session",
                   follow_redirects=False)
    assert r.status_code == 400


# ── the redirect URI, and the 403 that is not an OAuth error ─────────────────
#
# These guard a defect found only by pointing the finished code at the real Xero endpoint.
# Every mocked test above passed while the live token exchange could not complete at all.
#
# Xero's token endpoint sits behind an AWS load balancer whose WAF rejects a POST body
# containing the loopback IP literal — an ordinary anti-SSRF rule. Two otherwise identical
# requests, differing only in how the loopback host was spelled:
#
#   redirect_uri=http://localhost:8000/...  -> 400 {"error":"invalid_grant"}  (reached Xero)
#   redirect_uri=http://127.0.0.1:8000/...  -> 403 text/html from awselb/2.0  (blocked)
#
# The 403 carries no OAuth error body, so it looks like a rejected client rather than a
# blocked request. The credentials were fine the whole time: with the real pair Xero answered
# `invalid_grant` (client authentication PASSED, only the code was absent), while a wrong
# secret produced `invalid_client`. That contrast is what proved the redirect URI was the
# variable and the credentials were not.

def test_the_default_redirect_uri_does_not_use_the_loopback_ip_literal(monkeypatch):
    """The regression guard. Reverting this to 127.0.0.1 breaks the live flow silently.

    Asserted on the DEFAULT rather than on the environment, because the default is what a
    fresh clone gets and therefore what would fail for anyone who did not read the note.
    """
    monkeypatch.delenv("PROVEN_XERO_REDIRECT_URI", raising=False)
    default = xero.redirect_uri()
    assert "127.0.0.1" not in default, (
        "the loopback IP literal is blocked by Xero's WAF before OAuth is evaluated, so "
        "the token exchange can never complete with this default")
    assert default == "http://localhost:8000/api/xero/callback"


def test_the_redirect_uri_is_still_overridable(monkeypatch):
    """A deployment on a real host must be able to set its own, so the fix above must not
    have hardcoded the value past the environment."""
    monkeypatch.setenv("PROVEN_XERO_REDIRECT_URI", "https://proven.example.com/cb")
    assert xero.redirect_uri() == "https://proven.example.com/cb"


def test_the_authorize_url_sends_the_same_redirect_uri_it_will_exchange_with(
        client, with_creds, monkeypatch):
    """Xero compares the redirect_uri in the token exchange against the one in the authorize
    request. If these two ever diverge the consent succeeds and the exchange fails, which is
    the most confusing failure shape available."""
    monkeypatch.delenv("PROVEN_XERO_REDIRECT_URI", raising=False)
    import urllib.parse

    url = client.get("/api/xero/connect").json()["authorize_url"]
    sent = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)["redirect_uri"][0]

    exchanged = {}

    def capture(url, form, headers):
        exchanged.update(form)
        return None, "HTTP 400"

    monkeypatch.setattr(xero, "_post_form", capture)
    xero.exchange_code("some-code")
    assert exchanged["redirect_uri"] == sent == xero.redirect_uri()


def test_a_blocked_request_degrades_instead_of_pretending_to_be_connected(
        client, with_creds, monkeypatch):
    """A 403 with an HTML body is not an OAuth answer, and must not be read as one.

    The requirement is that an unparseable rejection leaves the product on its labelled
    fixture rather than half-connected, because a connection recorded from a failed exchange
    would put a live badge on fixture rows — the one failure this module exists to prevent.
    """
    monkeypatch.setattr(xero, "_post_form", lambda *a, **k: (
        None, "HTTP 403: <html><head><title>403 Forbidden</title></head></html>"))
    connection, err = xero.exchange_code("code-from-a-real-consent")
    assert connection is None
    assert "403" in err
    assert xero.TOKENS.current() is None, "a token was stored from a blocked exchange"

    body = client.get("/api/xero/observations").json()
    assert body["observations"] == []
    assert body["mode"] == xero.NOT_CONNECTED

    feed = client.get("/api/signals").json()
    assert feed["live"]["any_live"] is False
    assert all(event["simulated"] is True for event in feed["events"])
