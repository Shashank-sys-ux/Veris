"""Xero — turning the one place this product overclaimed into a real integration (spec §20).

THE PROBLEM THIS FIXES.

`connectors.py` opens by admitting it is a "SIMULATED read-only accounting feed", and every
signal it emits carries `simulated: true`. That honesty was correct and it was also the one
place the product's reach fell short of its story: the landing page describes an agent that
reads the systems a business already uses, and until now nothing did.

The fix is to make the code true rather than to soften the copy.

WHY XERO'S DEMO COMPANY IS THE RIGHT TARGET.

A free Xero developer account provisions a **Demo Company** containing real invoices,
contacts, items and accounts, reachable over the ordinary OAuth 2.0 API. So the request is
real, the token exchange is real, the JSON is real and the parsing is real. Only the
business inside it is Xero's sample data rather than a customer's — which is exactly the same
compromise `demo-site/site.py` already makes for Discovery, and it is labelled the same way.

WHAT IS DELIBERATELY NOT HERE.

No credentials. `PROVEN_XERO_CLIENT_ID` and `PROVEN_XERO_CLIENT_SECRET` are read from the
environment and nothing else; there is no default, no committed secret, and no endpoint that
returns either. With them unset every function below degrades to the labelled fixture path
rather than raising, so the product runs identically with or without a Xero app registered.

THE RULE THAT MATTERS MOST.

`simulated` is flipped to False ONLY on rows that genuinely came back from Xero. Never
blanket-flipped, never inferred from "we are configured, therefore this is live". A fixture
rendered as live is the single failure this codebase treats as unforgivable, and the reverse —
live data labelled as a fixture — is the bug already found in `discovery.py`. Both are wrong,
so the label is derived from the fetch outcome and from nothing else.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Optional

from . import config

# ── endpoints ───────────────────────────────────────────────────────────────
AUTHORIZE_URL = "https://login.xero.com/identity/connect/authorize"
TOKEN_URL = "https://identity.xero.com/connect/token"
CONNECTIONS_URL = "https://api.xero.com/connections"
API_BASE = "https://api.xero.com/api.xro/2.0"

# The read-only scopes this integration needs, and no more. `offline_access` is required for
# refresh; everything else is scoped to reading. There is deliberately no write scope: this
# product observes a business, it does not post journals into its books.
#
# GRANULAR SCOPES (mandatory for apps created after March 2026). The old broad scope
# `accounting.transactions.read` no longer exists for new apps and triggers `invalid_scope`
# at Xero's authorize endpoint. The replacements are per-resource:
#   Items endpoint   → accounting.settings.read (Items live under settings)
#   Contacts         → accounting.contacts.read
#   Invoices (bills) → accounting.invoices.read
SCOPES = ("offline_access",
          "accounting.invoices.read",
          "accounting.contacts.read",
          "accounting.settings.read")

FETCH_TIMEOUT = 20

# Modes, matching the vocabulary sentinel.py and discovery.py already use so the interface
# renders all three agents' provenance identically.
LIVE = "LIVE"
DEMO_FIXTURE = "DEMO_FIXTURE"
NOT_CONNECTED = "NOT_CONNECTED"


@dataclass(frozen=True)
class XeroSource:
    id: str = "conn-xero"
    name: str = "Xero (accounting)"
    category: str = "ACCOUNTING"
    publisher: str = "Xero Limited"
    author_class: str = "THIRD_PARTY"
    mode: str = DEMO_FIXTURE
    live_equivalent: str = "Xero Accounting API 2.0, OAuth 2.0"

    def as_dict(self) -> dict:
        return {"id": self.id, "name": self.name, "category": self.category,
                "publisher": self.publisher, "author_class": self.author_class,
                "mode": self.mode, "is_live": self.mode == LIVE,
                "live_equivalent": self.live_equivalent}


SOURCE = XeroSource()


# ── credentials, read and never returned ────────────────────────────────────

def client_id() -> str:
    return (config._env("PROVEN_XERO_CLIENT_ID") if hasattr(config, "_env")
            else _env("PROVEN_XERO_CLIENT_ID"))


def _env(name: str) -> str:
    import os
    return (os.getenv(name) or "").strip()


def client_secret() -> str:
    return _env("PROVEN_XERO_CLIENT_SECRET")


def redirect_uri() -> str:
    """Where Xero sends the browser back to. `localhost`, deliberately NOT `127.0.0.1`.

    This looks like a cosmetic preference and it is not. Xero's edge sits behind an AWS
    load balancer with a WAF in front of the token endpoint, and that WAF rejects a token
    POST whose body contains the loopback IP literal — a standard anti-SSRF rule. The
    failure is silent and misleading, because it happens BEFORE OAuth is evaluated:

        redirect_uri=http://localhost:8000/...  -> HTTP 400 {"error":"invalid_grant"}
                                                  (reached Xero's identity server)
        redirect_uri=http://127.0.0.1:8000/...  -> HTTP 403 text/html from awselb/2.0
                                                  (never reached it)

    Verified against the live endpoint with otherwise byte-identical requests, so the only
    variable was the loopback spelling. With the IP form the token exchange could never
    have completed no matter how correct the credentials were, and the 403 would have read
    like a rejected client rather than a blocked request.

    Two consequences worth knowing, because both bite at demo time:
      * The Xero app registration must carry this EXACT string. Xero string-compares it.
      * The product must therefore be browsed at http://localhost:8000, not
        http://127.0.0.1:8000. Cookies are scoped per host and the two are different
        hosts, so a session started on the IP will not be sent to the callback on the
        name, and the `state` check in the callback route will correctly refuse it.
    """
    return _env("PROVEN_XERO_REDIRECT_URI") or "http://localhost:8000/api/xero/callback"


def configured() -> bool:
    """Whether a Xero app has been registered for this deployment.

    Both halves are required. A client id with no secret cannot complete a token exchange,
    and reporting "configured" on the strength of half a credential would produce a
    confident failure later instead of an honest refusal now.
    """
    return bool(_env("PROVEN_XERO_CLIENT_ID") and _env("PROVEN_XERO_CLIENT_SECRET"))


def status() -> dict:
    """What the interface is told. Reports PRESENCE of credentials, never their value."""
    conn = TOKENS.current()
    return {
        "configured": configured(),
        "connected": conn is not None,
        "mode": (LIVE if conn is not None else
                 DEMO_FIXTURE if not configured() else NOT_CONNECTED),
        "client_id_present": bool(_env("PROVEN_XERO_CLIENT_ID")),
        "client_secret_present": bool(_env("PROVEN_XERO_CLIENT_SECRET")),
        "redirect_uri": redirect_uri(),
        "scopes": list(SCOPES),
        "tenant_name": (conn or {}).get("tenant_name"),
        "expires_at": (conn or {}).get("expires_at"),
        "source": SOURCE.as_dict(),
        "notice": (
            "Connected to Xero. Signals derived from this connection are labelled live; "
            "anything still coming from the fixture stays labelled as a fixture."
            if conn is not None else
            "No Xero app is configured, so the accounting feed falls back to its labelled "
            "fixture. Set PROVEN_XERO_CLIENT_ID and PROVEN_XERO_CLIENT_SECRET, then "
            "connect, to read the Xero Demo Company over the real API."
            if not configured() else
            "A Xero app is configured but nobody has authorised it yet. Start the consent "
            "flow to connect."),
        "credentials_never_served": (
            "No endpoint in this product returns the client id or secret. They are read "
            "from the environment at call time and never logged."),
    }


# ── token storage ───────────────────────────────────────────────────────────

class TokenStore:
    """One connection, in memory.

    In memory because a refresh token is a bearer credential and writing one to the
    repository's SQLite file — which is a demo artefact people copy around — would be a
    worse failure than losing the connection on restart. A production deployment would put
    this in a secret store, and that is a deployment decision rather than a code one.
    """

    def __init__(self) -> None:
        self._conn: Optional[dict] = None

    def save(self, *, access_token: str, refresh_token: str, expires_in: int,
             tenant_id: str, tenant_name: str) -> dict:
        self._conn = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_at": (datetime.now(timezone.utc).timestamp()
                           + max(0, int(expires_in)) - 30),
            "tenant_id": tenant_id,
            "tenant_name": tenant_name,
        }
        return self.redacted()

    def current(self) -> Optional[dict]:
        """The connection WITHOUT its secrets, for anything that might be serialised."""
        return self.redacted() if self._conn else None

    def redacted(self) -> Optional[dict]:
        if not self._conn:
            return None
        return {
            "tenant_id": self._conn["tenant_id"],
            "tenant_name": self._conn["tenant_name"],
            "expires_at": datetime.fromtimestamp(
                self._conn["expires_at"], tz=timezone.utc).isoformat(),
            "access_token_present": True,
            "refresh_token_present": bool(self._conn.get("refresh_token")),
        }

    def raw(self) -> Optional[dict]:
        return self._conn

    def expired(self) -> bool:
        if not self._conn:
            return True
        return datetime.now(timezone.utc).timestamp() >= self._conn["expires_at"]

    def clear(self) -> None:
        self._conn = None


TOKENS = TokenStore()


# ── OAuth 2.0 ───────────────────────────────────────────────────────────────

def authorize_url(state: str) -> Optional[str]:
    """Where to send the user to grant consent, or None if no app is configured."""
    if not configured():
        return None
    query = urllib.parse.urlencode({
        "response_type": "code",
        "client_id": _env("PROVEN_XERO_CLIENT_ID"),
        "redirect_uri": redirect_uri(),
        "scope": " ".join(SCOPES),
        "state": state,
    })
    return f"{AUTHORIZE_URL}?{query}"


def _post_form(url: str, form: dict, headers: dict) -> tuple[Optional[dict], str]:
    """POST a form and return (json, error). Never raises."""
    body = urllib.parse.urlencode(form).encode()
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=FETCH_TIMEOUT) as response:
            return json.loads(response.read().decode("utf-8")), ""
    except urllib.error.HTTPError as exc:
        # The response body can carry Xero's reason. It never carries our secret, because
        # the secret is only ever sent in a header we build and never interpolated into a
        # message.
        try:
            detail = exc.read().decode("utf-8")[:300]
        except Exception:
            detail = ""
        return None, f"HTTP {exc.code}: {detail}"
    except Exception as exc:
        return None, f"{type(exc).__name__}: {exc}"


def _basic_auth() -> str:
    import base64
    raw = f"{_env('PROVEN_XERO_CLIENT_ID')}:{_env('PROVEN_XERO_CLIENT_SECRET')}"
    return "Basic " + base64.b64encode(raw.encode()).decode()


def exchange_code(code: str) -> tuple[Optional[dict], str]:
    """Swap the authorisation code for tokens, then resolve the tenant."""
    if not configured():
        return None, "No Xero app is configured."
    payload, err = _post_form(TOKEN_URL, {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri(),
    }, {"Authorization": _basic_auth(),
        "Content-Type": "application/x-www-form-urlencoded"})
    if payload is None:
        return None, err

    tenant_id, tenant_name, terr = _first_tenant(payload.get("access_token") or "")
    if not tenant_id:
        return None, terr or "Xero returned no connected organisation."
    return TOKENS.save(
        access_token=payload.get("access_token") or "",
        refresh_token=payload.get("refresh_token") or "",
        expires_in=int(payload.get("expires_in") or 0),
        tenant_id=tenant_id, tenant_name=tenant_name), ""


def refresh() -> tuple[bool, str]:
    """Refresh the access token. A failure DEGRADES rather than raising.

    That is the load-bearing behaviour: an expired token must drop the accounting feed back
    to its labelled fixture, not take down the screen that was going to render it.
    """
    conn = TOKENS.raw()
    if not conn or not conn.get("refresh_token"):
        return False, "No refresh token is held."
    payload, err = _post_form(TOKEN_URL, {
        "grant_type": "refresh_token",
        "refresh_token": conn["refresh_token"],
    }, {"Authorization": _basic_auth(),
        "Content-Type": "application/x-www-form-urlencoded"})
    if payload is None:
        TOKENS.clear()
        return False, f"Refresh failed, so the connection was dropped. {err}"
    TOKENS.save(
        access_token=payload.get("access_token") or "",
        refresh_token=payload.get("refresh_token") or conn["refresh_token"],
        expires_in=int(payload.get("expires_in") or 0),
        tenant_id=conn["tenant_id"], tenant_name=conn["tenant_name"])
    return True, ""


def _get_json(url: str, token: str,
              tenant_id: Optional[str] = None) -> tuple[Optional[Any], str]:
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    if tenant_id:
        headers["Xero-tenant-id"] = tenant_id
    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=FETCH_TIMEOUT) as response:
            return json.loads(response.read().decode("utf-8")), ""
    except urllib.error.HTTPError as exc:
        return None, f"HTTP {exc.code}"
    except Exception as exc:
        return None, f"{type(exc).__name__}: {exc}"


def _first_tenant(token: str) -> tuple[str, str, str]:
    payload, err = _get_json(CONNECTIONS_URL, token)
    if not isinstance(payload, list) or not payload:
        return "", "", err or "No organisations are connected to this Xero app."
    first = payload[0]
    return (str(first.get("tenantId") or ""),
            str(first.get("tenantName") or "Xero organisation"), "")


def _authorised() -> tuple[Optional[str], Optional[str], str]:
    """(access_token, tenant_id, error), refreshing first if the token has expired."""
    if TOKENS.raw() is None:
        return None, None, "Not connected to Xero."
    if TOKENS.expired():
        ok, err = refresh()
        if not ok:
            return None, None, err
    conn = TOKENS.raw() or {}
    return conn.get("access_token"), conn.get("tenant_id"), ""


# ── deriving the signals connectors.py already emits ────────────────────────

def fetch_observations() -> dict:
    """Read the connected organisation and derive the same facts the fixture fakes.

    Returns a dict with `observations` (each carrying its own `simulated` flag), a
    `fetch_log` and a `mode`. Nothing here raises: every failure path returns a labelled
    result so the caller can fall back to the fixture and say so.
    """
    log: list[dict] = []
    token, tenant, err = _authorised()
    if not token:
        return {"mode": DEMO_FIXTURE if not configured() else NOT_CONNECTED,
                "observations": [], "fetch_log": [
                    {"source": "Xero", "url": API_BASE, "outcome": err}],
                "error": err}

    observations: list[dict] = []

    # Stock value, from tracked inventory items. Xero reports QuantityOnHand and a unit
    # cost per item; the product of the two, summed, is the stock at risk — which is the
    # figure the average condition bites on.
    items, ierr = _get_json(f"{API_BASE}/Items", token, tenant)
    log.append({"source": "Xero Items", "url": f"{API_BASE}/Items",
                "outcome": ierr or "ok"})
    if isinstance(items, dict):
        total = Decimal("0")
        counted = 0
        for item in items.get("Items") or []:
            qty = item.get("QuantityOnHand")
            cost = ((item.get("PurchaseDetails") or {}).get("UnitPrice")
                    or item.get("UnitPrice"))
            if qty is None or cost is None:
                continue
            try:
                total += Decimal(str(qty)) * Decimal(str(cost))
                counted += 1
            except Exception:
                continue
        if counted:
            observations.append({
                "fact": "stock_value", "value": str(total.quantize(Decimal("1"))),
                "unit": "SGD", "basis": f"{counted} tracked inventory item(s) in Xero",
                # SELF, not THIRD_PARTY. The business keys its own inventory into Xero,
                # so this is its own assertion arriving over somebody else's API. Grading
                # it THIRD_PARTY would let a self-declared stock figure reach PROVEN,
                # which is the exact laundering the evidence classes exist to stop.
                "simulated": False, "author_class": "SELF",
                "source": "Xero Items"})

    # Headcount proxy, from contacts flagged as employees. Named a PROXY in the payload
    # because Xero's contact list is not a payroll record, and calling it headcount would
    # overstate what the API actually establishes.
    contacts, cerr = _get_json(
        f"{API_BASE}/Contacts?where=IsEmployee%3D%3Dtrue", token, tenant)
    log.append({"source": "Xero Contacts", "url": f"{API_BASE}/Contacts",
                "outcome": cerr or "ok"})
    if isinstance(contacts, dict):
        employees = contacts.get("Contacts") or []
        if employees:
            observations.append({
                "fact": "headcount_proxy", "value": len(employees), "unit": "people",
                "basis": ("Contacts flagged as employees in Xero. A proxy, not a payroll "
                          "record — it cannot establish a WICA declaration."),
                # SELF: the business chose which contacts to flag as employees.
                "simulated": False, "author_class": "SELF",
                "source": "Xero Contacts"})

    # Asset purchases, from bills above a threshold. These are what move plant value.
    bills, berr = _get_json(
        f"{API_BASE}/Invoices?where=Type%3D%3D%22ACCPAY%22", token, tenant)
    log.append({"source": "Xero Bills", "url": f"{API_BASE}/Invoices",
                "outcome": berr or "ok"})
    if isinstance(bills, dict):
        for invoice in (bills.get("Invoices") or [])[:20]:
            try:
                amount = Decimal(str(invoice.get("Total") or 0))
            except Exception:
                continue
            if amount < Decimal("5000"):
                continue
            observations.append({
                "fact": "asset_purchase", "value": str(amount.quantize(Decimal("1"))),
                "unit": "SGD",
                "basis": (f"Bill from "
                          f"{(invoice.get('Contact') or {}).get('Name') or 'a supplier'}"),
                "reference": invoice.get("InvoiceNumber"),
                "dated": str(invoice.get("Date") or "")[:10],
                # THIRD_PARTY, and the only one of the three that is. A supplier issued
                # this bill, so it is somebody else's assertion about what the business
                # bought and what it cost — which is why it alone can support PROVEN.
                "simulated": False, "author_class": "THIRD_PARTY",
                "source": "Xero Bills"})

    return {"mode": LIVE if observations else NOT_CONNECTED,
            "observations": observations, "fetch_log": log,
            "tenant_name": (TOKENS.current() or {}).get("tenant_name"),
            "error": "",
            "notice": ("Every observation above came back from the Xero API and is labelled "
                       "live. Anything the fixture still supplies stays labelled as a "
                       "fixture — the flag follows the fetch, never the configuration.")}


def disconnect() -> dict:
    TOKENS.clear()
    return {"ok": True, "connected": False,
            "notice": "Connection dropped. The accounting feed falls back to its fixture."}
