"use strict";
/* VERIS — Insurance Intelligence Platform. Complete SPA.
 *
 * Three roles, one engine. The SME owns their case; the adviser reviews it;
 * the carrier sees their book. All share the same deterministic policy engine
 * underneath, and no machine-learning model makes any consequential decision.
 *
 * SECURITY: auth is cookie-based (proven_sid, HttpOnly, SameSite=Lax).
 * The server enforces roles; the client selects views.
 *
 * ESCAPING: every document-derived value reaches the DOM through esc() or
 * textContent. innerHTML is used for layout only — never for document text.
 */

// `tab` holds the active sub-tab per container screen, keyed by group name. Kept on S
// rather than in the URL because the app has no router — nav8() sets S.view and
// re-renders — and inventing one here would be a larger change than the sidebar
// collapse it exists to serve.
const S = { user: null, view: null, data: {}, tab: {} };
// Set when the built-in example bundle is loaded, so the Overview can keep saying the
// business is fictional even though the files were genuinely uploaded.
const EXAMPLE_FLAG = "veris_example_loaded";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = v => { const n = Number(v); return isNaN(n) ? (v ?? "") : "S$" + n.toLocaleString("en-SG", { maximumFractionDigits: 0 }); };
const pct = v => v == null ? "—" : String(v).includes("%") ? v : v + "%";
const titleCase = s => String(s || "").toLowerCase().split(/[_\s]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

/* ── Event delegation ─────────────────────────────────────────────────────
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT AN inline onclick.
 *
 * The server sends `Content-Security-Policy: script-src 'self'`, which blocks every
 * inline event handler attribute. That policy is deliberate and load-bearing: this
 * product renders verbatim text out of documents somebody else authored, so if an
 * escaping bug ever slips through, the CSP is the second line of defence. Adding
 * 'unsafe-inline' to make onclick= work would trade a real security control for a
 * convenience, in a product whose entire pitch is that it does not cut corners.
 *
 * So every interactive element declares `data-act` (and optionally `data-arg`) and one
 * delegated listener dispatches it. `closest()` is used so a click landing on a child
 * element still resolves to the element that declared the action.
 *
 * Adding a new action: add the element with data-act, add the case here. Never reach
 * for onclick=.
 */
const ACTIONS = {
  nav: arg => nav8(arg),
  logout: () => logout(),
  "delete-case": () => deleteCase(),
  "export-record": () => exportRecord(),
  "load-example": () => loadExample(),
  "pick-scenario": arg => pickScenario(Number(arg)),
  "remove-file": arg => removeFile(Number(arg)),
  "toggle-detail": (_arg, el) => el.querySelector(".finding-detail")?.classList.toggle("open"),
  "fill-login": arg => fillLogin(arg),
  "switch-role": () => switchRole(),
  /* The watching surface. Every toggle is a BUTTON carrying the value it will set,
   * because the delegated handler below calls preventDefault() — which would cancel a
   * checkbox's own state change and leave the control lying about what is stored. */
  "check-now": () => checkNow(),
  "ntf-read": arg => markNotificationRead(arg),
  "ntf-read-all": () => markAllNotificationsRead(),
  "ntf-pref": arg => setNotificationCode(arg),
  "ntf-mail": arg => setNotificationPref({ email_enabled: arg === "1" }),
  "ntf-sev": arg => setNotificationPref({ minimum_severity: arg }),
  "ntf-digest": arg => setNotificationPref({ digest: arg }),
  "ntf-preview": arg => { S.previewMessage = arg; render(); },
  "ntf-restart": () => restartWatch(),
  /* Tab selection inside a container screen. `arg` is "group:tabId" — one action rather
   * than one per group, because the alternative was 23 near-identical entries in this
   * map for the 23 screens the sidebar collapse turned into tabs. */
  tab: arg => {
    const split = String(arg || "").indexOf(":");
    if (split < 0) return;
    S.tab[arg.slice(0, split)] = arg.slice(split + 1);
    render();
  },
  /* Jump to a container screen AND select a tab inside it, as one click.
   * `arg` is "view|group|tabId".
   *
   * Needed because the sidebar collapse turned eleven destinations into tabs, and the
   * links pointing at them from elsewhere — the Overview's risk cards, the empty states —
   * would otherwise land on a screen with no sidebar item highlighted, which reads as
   * "you are nowhere". This keeps the deep-link and leaves the user somewhere they can
   * see they are.
   */
  open: arg => {
    const [view, group, tabId] = String(arg || "").split("|");
    if (group && tabId) S.tab[group] = tabId;
    if (view) nav8(view);
  },
  /* Open one carrier account. The id rides on S rather than the path because the app has
   * no router; see the note on S.tab. */
  "car-open": arg => { S.carAccount = arg; nav8("car-detail"); },
  /* The adviser's two real actions on a disclosed case: ask the client for something, and
   * move a correction request through the state machine. Both are server-enforced —
   * `adv-move` sends only the target state, never the actor. */
  "adv-ask": arg => adviserAsk(arg),
  "adv-move": arg => adviserMove(arg),
  /* Landing page: move from marketing to the login form, and jump between sections.
   * `show-login` sets a flag rather than navigating, so the transition needs no round trip
   * and the browser Back button still returns to the landing page. */
  "show-login": () => {
    S.showLogin = true;
    try { history.pushState({}, "", "/login"); } catch (_) { /* file:// etc */ }
    render();
  },
  "lp-jump": arg => {
    const target = document.getElementById(String(arg || ""));
    if (target) target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto" : "smooth", block: "start" });
  },
  /* Timeline period filter. Client-side over rows already loaded — see TIME_PERIODS. */
  "tl-period": arg => { S.timePeriod = arg; render(); },
  /* The evidence drawer. Opens the quotation behind one gap-snapshot row without leaving the
   * screen, because "show me why" is the question this product exists to answer and making it
   * a navigation event buries it. */
  "gap-why": arg => openEvidenceDrawer(arg),
  "drawer-close": () => {
    S.drawer = null; S.pageFull = null;
    document.getElementById("veris-drawer")?.remove();
    document.getElementById("veris-pagefull")?.remove();
  },
  /* The source-page viewer inside the drawer. `drawer-page` switches which citation's
   * page is shown when a finding rests on more than one. */
  "drawer-page": arg => loadDrawerPage(Number(arg)),
  "pagefull-open": () => openPageFullscreen(),
  "pagefull-close": () => {
    S.pageFull = null;
    document.getElementById("veris-pagefull")?.remove();
  },
};

/* The Back button must work on a page that has a real address. Without this, leaving the
 * login form via Back changes the URL and leaves the login form on screen. */
window.addEventListener("popstate", () => {
  S.showLogin = location.pathname === "/login";
  render();
});

document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-act]");
  if (!el) return;

  const handler = ACTIONS[el.dataset.act];
  if (!handler) return;
  ev.preventDefault();
  handler(el.dataset.arg, el);
});

/* ══════════════════════════════════════════════════════════════════════════
   VISUAL COMPONENTS

   Ported from Shreya's design system, unchanged in behaviour. A number in a table is
   read; a number in a ring or a waterfall is FELT, and the whole problem with insurance
   documents is that nobody feels them until it is too late.

   These are pure functions: data in, HTML out. They hold no state, fetch nothing, and
   never decide anything. Every value they draw was verified by the engine before it got
   here.

   Credit: Shreya.
   ══════════════════════════════════════════════════════════════════════════ */

function renderHero(label, value, sub, severity) {
  const cls = severity === "HIGH" ? "hero--critical"
    : severity === "ELEVATED" ? "hero--elevated"
      : severity === "LOW" ? "hero--good" : "";
  return `<div class="v-hero ${cls}"><div class="v-hero__label">${esc(label)}</div><div class="v-hero__value">${value}</div><div class="v-hero__sub">${esc(sub || "")}</div></div>`;
}

function renderRing(score, size) {
  size = size || 140;
  const r = (size - 16) / 2, c = 2 * Math.PI * r, off = c * (1 - (score || 0) / 100);
  const cls = score > 70 ? "ring--good" : score > 40 ? "ring--warn" : "ring--bad";
  return `<div class="v-ring ${cls}" style="width:${size}px;height:${size}px" role="img" aria-label="Score ${score} out of 100"><svg width="${size}" height="${size}"><circle class="v-ring__track" cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle class="v-ring__fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg><span class="v-ring__val">${score ?? "—"}</span></div>`;
}

function renderBars(items) {
  if (!items?.length) return "";
  const max = Math.max(...items.map(i => i.max || i.value || 0), 1);
  return `<div class="v-bars">${items.map(i => {
    const w = Math.min(100, ((i.value || 0) / max) * 100);
    const cls = i.status === "bad" ? "v-bar--bad" : i.status === "warn" ? "v-bar--warn" : "v-bar--good";
    return `<div class="v-bar-row"><span class="v-bar-label">${esc(i.label)}</span><div class="v-bar-track"><div class="v-bar-fill ${cls}" style="width:${w}%"></div></div><span class="v-bar-val">${esc(i.display || String(i.value ?? ""))}</span></div>`;
  }).join("")}</div>`;
}

function renderRiskMeter(level) {
  const levels = ["LOW", "MODERATE", "ELEVATED", "HIGH"];
  const idx = levels.indexOf((level || "").toUpperCase());
  const colors = ["var(--success)", "#84cc16", "var(--warning)", "var(--danger)"];
  return `<div class="v-meter" role="img" aria-label="Conditions ${esc(level || "unknown")}"><div class="v-meter__bar">${levels.map((l, i) => `<div class="v-meter__seg${i <= idx ? " v-meter__seg--active" : ""}" style="${i <= idx ? "background:" + colors[i] : ""}"></div>`).join("")}</div><div class="v-meter__label" style="color:${colors[Math.max(idx, 0)]}">${esc(level || "UNKNOWN")}</div></div>`;
}

function renderTimeline(items) {
  if (!items?.length) return '<p class="v-muted">Nothing yet</p>';
  return `<div class="v-timeline">${items.slice(0, 6).map(i => {
    const dot = i.severity === "HIGH" ? "v-tl__dot--alert" : i.severity === "LOW" ? "v-tl__dot--ok" : "v-tl__dot--active";
    return `<div class="v-tl__item"><div class="v-tl__dot ${dot}"></div><div class="v-tl__content"><div class="v-tl__title">${esc(i.title || i.label || "")}</div><div class="v-tl__meta">${esc(i.source || "")}${i.date ? " · " + esc(i.date) : ""}</div>${i.detail ? `<div class="v-tl__body">${esc(i.detail)}</div>` : ""}</div></div>`;
  }).join("")}</div>`;
}

function renderWaterfall(steps, startLabel, startAmt) {
  if (!steps?.length) return "";
  return `<div class="v-waterfall"><div class="v-wf__step v-wf__step--start"><span class="v-wf__label">${esc(startLabel || "The loss")}</span><span class="v-wf__amt">${money(startAmt)}</span></div>${steps.map(s => {
    const neg = Number(s.amount) < 0 || (s.operation || "").includes("reduc");
    return `<div class="v-wf__step${neg ? " v-wf__step--neg" : ""}"><span class="v-wf__label">${esc(s.label)}</span><span class="v-wf__amt">${money(Math.abs(Number(s.amount) || 0))}</span><span class="v-wf__op">${esc(s.operation || "")}</span></div>`;
  }).join("")}</div>`;
}

function renderFlowchart(nodes) {
  if (!nodes?.length) return "";
  return `<div class="v-flow">${nodes.map((n, i) => `${i > 0 ? '<div class="v-flow__arrow">↓</div>' : ""}<div class="v-flow__node v-flow__node--${n.type || "default"}">${esc(n.text)}</div>`).join("")}</div>`;
}

function renderConvergence(internal, external, result) {
  return `<div class="v-convergence"><div class="v-conv__sources"><div class="v-conv__src v-conv__src--int"><div class="v-conv__badge">FROM YOUR RECORDS</div><div class="v-conv__text">${esc(internal)}</div></div><div class="v-conv__src v-conv__src--ext"><div class="v-conv__badge v-conv__badge--ext">FROM OUTSIDE</div><div class="v-conv__text">${esc(external)}</div></div></div><div class="v-conv__arrow">↓</div><div class="v-conv__result"><div class="v-conv__badge v-conv__badge--result">WHAT IT MEANS</div><div class="v-conv__text">${esc(result)}</div></div></div>`;
}

const _OB_WORDS = {
  COMPLIANT: "Confirmed fine",
  UNVERIFIED: "Cannot confirm yet",
  BREACHED: "Not being kept",
  NOT_IN_POLICY: "Not in your policy",
};

function renderObligationMap(items) {
  if (!items?.length) return "";
  return `<div class="v-obligations">${items.map(i => `<div class="v-ob__item"><div class="v-ob__dot v-ob__dot--${(i.state || "").toLowerCase()}"></div><div class="v-ob__label">${esc(i.title)}</div><div class="v-ob__state v-ob__state--${(i.state || "").toLowerCase()}">${esc(_OB_WORDS[i.state] || i.state || "")}</div></div>`).join("")}</div>`;
}

function renderChangePulse(items) {
  if (!items?.length) return '<p class="v-muted">Nothing has changed</p>';
  return `<div class="v-pulse">${items.slice(0, 5).map(i => `<div class="v-pulse__item"><div class="v-pulse__icon">${i.direction === "up" ? "↑" : i.direction === "down" ? "↓" : i.direction === "new" ? "+" : "•"}</div><div class="v-pulse__content"><strong>${esc(i.label || "")}</strong><span class="v-pulse__val">${esc(i.value || "")}</span></div><div class="v-pulse__source">${esc(i.source || "")}</div></div>`).join("")}</div>`;
}

function renderTrendChart(observations, threshold) {
  if (!observations?.length) return '<p class="v-muted">Not enough history yet</p>';
  const vals = observations.map(o => parseFloat(o.adequacy_ratio) || 0);
  const max = Math.max(...vals, threshold || 100, 100), min = Math.min(...vals, 0);
  const range = max - min || 1, h = 140, w = Math.max(observations.length * 50, 320);
  const thY = h - ((threshold - min) / range * h);
  const pts = observations.map((o, i) => ({
    x: (i / Math.max(observations.length - 1, 1)) * (w - 40) + 20,
    y: h - ((parseFloat(o.adequacy_ratio) - min) / range * h),
    e: o.engaged, l: o.as_at,
  }));
  let svg = `<svg viewBox="0 0 ${w} ${h + 24}" class="v-trend__svg" role="img" aria-label="Cover against costs over time">`;
  if (threshold) svg += `<line x1="0" y1="${thY}" x2="${w}" y2="${thY}" stroke="var(--danger)" stroke-dasharray="4" opacity=".4"/><text x="${w - 4}" y="${thY - 4}" font-size="9" fill="var(--danger)" text-anchor="end">safe level</text>`;
  for (let i = 1; i < pts.length; i++) svg += `<line x1="${pts[i - 1].x}" y1="${pts[i - 1].y}" x2="${pts[i].x}" y2="${pts[i].y}" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round"/>`;
  pts.forEach(p => { svg += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="${p.e ? "var(--danger)" : "var(--brand)"}" stroke="#fff" stroke-width="2"/>`; });
  pts.forEach((p, i) => { if (i % 2 === 0 || i === pts.length - 1) svg += `<text x="${p.x}" y="${h + 16}" font-size="9" fill="var(--text-4)" text-anchor="middle">${esc(p.l || "")}</text>`; });
  return `<div class="v-trend">${svg}</svg></div>`.replace("</svg></svg>", "</svg>");
}

function renderMatrix(am) {
  const grid = (am || {}).grid || {}, pc = (am || {}).priority_cell || {};
  const rows = ["HIGH", "MED", "LOW"], cols = ["LOW", "MED", "HIGH"];
  let html = `<div class="v-matrix"><table><thead><tr><th></th>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>`;
  rows.forEach(r => {
    html += `<tr><th>${r}</th>`;
    cols.forEach(c => {
      const n = ((grid[r] || {})[c]) ?? 0;
      const hot = pc.internal === r && pc.external === c;
      html += `<td class="v-mx__cell${hot ? " v-mx__cell--hot" : ""}"><div class="v-mx__n">${n}</div>${hot ? '<div class="v-mx__tag">PRIORITY</div>' : ""}</td>`;
    });
    html += "</tr>";
  });
  return html + `</tbody></table><div class="v-mx__axes"><span>↑ Change inside the business</span><span>Conditions outside →</span></div></div>`;
}

function renderEvidenceStack(evs) {
  if (!evs?.length) return "";
  return evs.slice(0, 3).map(ev => `<div class="v-evidence"><div class="v-evidence__quote">"${esc(String(ev.quote || ""))}"</div><div class="v-evidence__src">${esc(ev.document_kind || ev.source || "")}${ev.page ? " · page " + ev.page : ""}</div></div>`).join("");
}

function renderDataBadge(isLive) {
  return isLive
    ? '<span class="v-badge v-badge--live">● LIVE</span>'
    : '<span class="v-badge v-badge--demo">EXAMPLE</span>';
}

/* ── The assessment panel ─────────────────────────────────────────────────
 * Where the presentation layer's output lands. Every screen that shows one of these got
 * its wording from `/api/presentation/compose`, and the mode badge says whether a model
 * wrote it or a written template did. That distinction is on screen rather than in a
 * footnote, because a reader is entitled to know which they are looking at. */
function renderAssessment(pres, mode) {
  if (!pres) return "";
  const pts = (pres.supporting_points || []).filter(Boolean);
  const badge = mode === "MODEL"
    ? '<span class="v-badge v-badge--live" title="Wording written by a language model from verified figures">◆ AI worded</span>'
    : '<span class="v-badge v-badge--demo" title="Wording from a written template">◆ Standard wording</span>';
  return `<div class="v-ai">
    <div class="v-ai__mark">Veris assessment ${badge}</div>
    <div class="v-ai__headline">${esc(pres.headline || "")}</div>
    ${pres.subheadline ? `<div class="v-ai__sub">${esc(pres.subheadline)}</div>` : ""}
    ${pts.length ? `<ul class="v-ai__pts">${pts.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
    ${pres.why_it_matters ? `<div class="v-ai__why">${esc(pres.why_it_matters)}</div>` : ""}
    ${pres.what_next ? `<div class="v-ai__next">${esc(pres.what_next)}</div>` : ""}
  </div>`;
}

/* Ask the presentation layer to word a screen. Never throws: a failed call means the
 * screen renders without the panel rather than not rendering at all. */
async function getPresentation(purpose, verified_context) {
  try {
    const r = await api("/api/presentation/compose", {
      method: "POST", body: { purpose, verified_context },
    });
    return r ? { pres: r.presentation, mode: r.mode, rejected: r.error } : null;
  } catch {
    return null;
  }
}

/* ── API transport ────────────────────────────────────────────────────── */

async function api(path, opts = {}) {
  const h = { ...opts.headers };
  if (opts.body && !(opts.body instanceof FormData)) {
    h["Content-Type"] = "application/json";
    opts.body = JSON.stringify(opts.body);
  }
  let r;
  try {
    r = await fetch(path, { ...opts, headers: h, credentials: "same-origin" });
  } catch (e) {
    throw new Error("Cannot reach the server. Check it is running.");
  }
  // A 401 means this session is not authenticated for that route. It must NOT call
    // logout(), because logout drops the CASE from the server -- so one stray request to a
    // route the current role cannot reach would silently destroy the case being reviewed.
    // Forget the user on the client, keep server state, show the login form.
    if (r.status === 401) { switchRole(); return null; }
  if (!r.ok) {
    const e = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(e.detail || e.error?.message || `Error ${r.status}`);
  }
  return r.json();
}

/* ── Auth (cookie-based) ──────────────────────────────────────────────── */

function getUser() {
  try { return JSON.parse(sessionStorage.getItem("veris_user")); } catch { return null; }
}
function setUser(u) { S.user = u; sessionStorage.setItem("veris_user", JSON.stringify(u)); }
/* SIGN OUT versus SWITCH ROLE — the distinction is load-bearing.
 *
 * A case lives on the server session, and POST /api/auth/logout deliberately drops it:
 * signing out means the analysis goes with you. That is a real privacy property and worth
 * demonstrating.
 *
 * But a case is also reviewed by three roles in turn, and the adviser reads the case from
 * the SAME session the owner disclosed. So signing out to reach the login form destroys the
 * very case the next role is meant to look at — the adviser then lands on an empty queue and
 * a 403, which reads as a broken product when it is actually the session being gone.
 *
 * switchRole() therefore forgets the user on the client and shows the login form WITHOUT
 * calling the logout endpoint, so the case and its disclosures survive the handover.
 */
function logout() {
  S.user = null;
  sessionStorage.removeItem("veris_user");
  api("/api/auth/logout", { method: "POST" }).catch(() => {});
  render();
}
window.logout = logout;

function switchRole() {
  S.user = null;
  S.view = null;
  sessionStorage.removeItem("veris_user");
  render();
}
window.switchRole = switchRole;

/* ── Router ───────────────────────────────────────────────────────────── */

/* Where each role belongs after signing in. The SERVER decides the role — this is only
 * where the client puts them once it has been told. There is deliberately no role picker
 * on the login form: letting a client choose its own role would make the whole boundary
 * decorative. */
const ROLE_PATH = { SME: "/app", ADVISER: "/adviser", CARRIER: "/carrier" };

function render() {
  const u = getUser();
  if (u) S.user = u;

  if (!S.user) {
    // Unauthenticated. `/login` is always the login form; everything else is the landing
    // page. `renderLanding()` issues no api() call at all, which is how the requirement
    // that marketing must not touch the case engine is met — not by remembering to avoid
    // it, but by there being nothing to avoid.
    const path = location.pathname;
    if (path === "/login" || S.showLogin) renderLogin();
    else renderLanding();
    return;
  }

  // Authenticated. Keep the address bar honest about which workspace this is, and send an
  // authenticated visitor away from /login rather than showing them a form they have
  // already filled in.
  const want = ROLE_PATH[S.user.role];
  if (want && (location.pathname === "/login" || location.pathname === "/")) {
    try { history.replaceState({}, "", want); } catch (_) { /* file:// etc */ }
  }
  if (S.user.role === "SME") renderSME();
  else if (S.user.role === "ADVISER") renderAdviser();
  else if (S.user.role === "CARRIER") renderCarrier();
  else renderLogin();
}
function nav8(v) { S.view = v; render(); }
window.nav8 = nav8;

/* Every view is async and starts by painting a spinner. If one then throws — a 403 from a
 * consent boundary, a network drop, a field that moved — the spinner used to stay on screen
 * forever with no explanation. This wrapper guarantees the user always gets either the
 * screen or a readable reason, never a hang. */
async function mount(view, el) {
  try {
    await view(el);
  } catch (err) {
    el.innerHTML = `<div class="insight critical"><div class="insight-label">This screen could not load</div>
        <div class="insight-text">${esc(err && err.message ? err.message : String(err))}</div></div>
      <p class="text-sm text-muted mt-12">Nothing was changed. Try another screen, or reload the page.</p>`;
  }
}

/* ── Login ────────────────────────────────────────────────────────────── */
//
// The demo walkthrough switches role three times. Retyping an email and password at each
// switch is three chances to fumble in front of an audience, so the accounts are buttons
// that fill the form rather than text to copy. The password is a printed demo credential
// by design — `auth.py` says so explicitly and this is not a production posture.
const DEMO_PASSWORD = "Demo@123";
const DEMO_ACCOUNTS = [
  { email: "owner@hockleefoods.demo", label: "Business owner" },
  { email: "adviser@lionbrokers.demo", label: "Licensed adviser" },
  { email: "underwriter@carrier.demo", label: "Carrier underwriter" },
];

function fillLogin(email) {
  const e = $("#lemail"), p = $("#lpass");
  if (!e || !p) return;
  e.value = email;
  p.value = DEMO_PASSWORD;
  $("#lbtn")?.focus();
}
window.fillLogin = fillLogin;

/* ── Landing page ─────────────────────────────────────────────────────────
 *
 * Renders from NOTHING. No fetch, no session read, no engine. That is a requirement rather
 * than an optimisation: a marketing page that loads the case engine to draw itself would
 * make an unauthenticated visitor's first request a case build, and would couple the thing
 * we say about the product to the state of somebody's documents.
 *
 * The visual brief ruled out gradients, neon and generated art, which removes the usual
 * ways of filling a page and forces the argument into type and structure. That suits a tool
 * whose claim is "we show you the document": it has no business opening with a glowing orb.
 */
function renderLanding() {
  $("#app").innerHTML = `<div class="lp">
  <header class="lp__bar"><div class="lp__bar-in">
    <div class="lp__mark">VERIS<span>Insurance assurance</span></div>
    <nav class="lp__navlinks">
      <a href="#how" data-act="lp-jump" data-arg="how">How it works</a>
      <a href="#evidence" data-act="lp-jump" data-arg="evidence">Evidence</a>
      <a href="#example" data-act="lp-jump" data-arg="example">Example</a>
    </nav>
    <button class="btn btn-primary btn-sm" data-act="show-login">Sign in</button>
  </div></header>

  <section class="lp__hero"><div class="lp__wrap">
    <span class="lp__eyebrow">For Singapore SMEs</span>
    <h1 class="lp__h1">Your business changes. Your insurance <em>often doesn't.</em></h1>
    <p class="lp__lede">Veris continuously checks whether the two still match — reading your
      own policy documents, watching what your business publishes about itself, and telling
      you where the two have drifted apart. Every answer points at the document it came
      from.</p>
    <div class="lp__cta">
      <button class="btn btn-primary" data-act="show-login">Open the workspace</button>
      <button class="btn btn-secondary" data-act="lp-jump" data-arg="example">See a worked example</button>
    </div>
    <p class="lp__note">No machine-learning model makes a coverage decision. Every figure is
      a comparison between two documents you already hold.</p>

    <div class="lp__diagram">
      <div class="lp__agent">
        <h4>Agent one</h4>
        <b>Connect — inside your business</b>
        <p>Reads the systems and records that show what your business actually does now.</p>
        <ul><li>Stock and asset values</li><li>Payroll and headcount</li>
          <li>New premises on a lease</li><li>New activities on your registration</li></ul>
      </div>
      <div class="lp__spine"></div>
      <div class="lp__agent">
        <h4>Agent two</h4>
        <b>Sentinel — around your business</b>
        <p>Watches the conditions and public records that change without you doing anything.</p>
        <ul><li>Rainfall and flood exposure</li><li>Construction cost indices</li>
          <li>Your public company record</li><li>What your own website says</li></ul>
      </div>
      <div class="lp__engine">
        <b>One deterministic decision layer</b>
        <p>Both agents feed the same engine. It compares what they found against the clauses
          in your policy and reports the difference — as a quotation with a page number, or
          as an honest "we could not establish this".</p>
      </div>
    </div>
  </div></section>

  <section class="lp__sec" id="how"><div class="lp__wrap">
    <div class="lp__kicker">Why this is hard to notice</div>
    <h2 class="lp__h2">Nothing goes wrong all at once</h2>
    <p class="lp__sub">A policy is written on the day you buy it and describes the business
      you were then. Every change after that is small, reasonable, and invisible until a
      claim.</p>
    <div class="lp__grid">
      <div class="lp__card"><div class="lp__num">01</div>
        <b>You don't know what you don't know</b>
        <p>An empty screen and a clean screen look identical. Veris reports which areas it
          could not check, and why, instead of leaving the silence to be read as safety.</p></div>
      <div class="lp__card"><div class="lp__num">02</div>
        <b>The gaps compound</b>
        <p>You take a second unit. You buy a freezer. You start selling online. Each is one
          conversation nobody had, and a loss engages all of them at once.</p></div>
      <div class="lp__card"><div class="lp__num">03</div>
        <b>Cyber and supply chain are usually excluded, not absent</b>
        <p>The wording already says so. Nobody reads page nine. Veris finds the clause and
          shows it to you in your insurer's own words.</p></div>
      <div class="lp__card"><div class="lp__num">04</div>
        <b>You find out at the worst moment</b>
        <p>Adequacy, warranties and conditions decide what a claim pays. Veris runs the
          arithmetic before the loss, not after it.</p></div>
    </div>
  </div></section>

  <section class="lp__sec lp__sec--alt" id="evidence"><div class="lp__wrap">
    <div class="lp__kicker">How you can trust it</div>
    <h2 class="lp__h2">Every answer carries its evidence</h2>
    <p class="lp__sub">Nothing here is a model's opinion about your cover. The chain below
      runs on every single finding, and any link that cannot be completed becomes an
      abstention rather than a guess.</p>
    <div class="lp__chain">
      <div class="lp__link"><i>01</i><b>Source</b><p>Your own documents, a government
        register, or a published wording.</p></div>
      <div class="lp__link"><i>02</i><b>Retrieval</b><p>The passage is located and its exact
        offsets recorded.</p></div>
      <div class="lp__link"><i>03</i><b>Evidence</b><p>The quotation is re-read at those
        offsets and must match byte for byte.</p></div>
      <div class="lp__link"><i>04</i><b>Rules</b><p>Deterministic comparison of dates,
        integers and decimals. No model.</p></div>
      <div class="lp__link"><i>05</i><b>Decision</b><p>Graded by who authored the evidence,
        with the page shown to you.</p></div>
    </div>
  </div></section>

  <section class="lp__sec" id="example"><div class="lp__wrap">
    <div class="lp__kicker">A worked example</div>
    <h2 class="lp__h2">Two documents, one subtraction</h2>
    <p class="lp__sub">This is the whole method. Not a prediction, not a score derived from
      a model — one figure from the insurer's document, one from the business's own accounts,
      and the difference between them.</p>
    <div class="lp__example">
      <div class="lp__ex-row">
        <div class="lp__ex-cell"><i>Policy schedule · written by the insurer</i>
          <div class="lp__ex-fig">S$100,000</div>
          <p>Stock in trade, sum insured.</p></div>
        <div class="lp__ex-cell"><i>Management accounts · written by the business</i>
          <div class="lp__ex-fig">S$150,000</div>
          <p>Inventory actually held.</p></div>
      </div>
      <div class="lp__ex-out">
        <b>Adequacy 66.7%, against the 85% threshold the wording states</b>
        <p>The policy's average condition is engaged, so a claim would be reduced in
          proportion. Veris shows the clause, the page, and the arithmetic — and labels the
          conventional formula as market convention, because the wording states the trigger
          and not the sum.</p>
      </div>
      <div class="lp__ex-foot">Illustrative figures from the built-in example business.
        A real assessment reads your own documents.</div>
    </div>
  </div></section>

  <section class="lp__sec lp__sec--alt"><div class="lp__wrap">
    <div class="lp__kicker">Who it is for</div>
    <h2 class="lp__h2">Three people, one set of facts</h2>
    <div class="lp__grid">
      <div class="lp__card"><b>The business owner</b>
        <p>Sees their whole position in plain words, owns the data, and decides who else
          sees any of it.</p></div>
      <div class="lp__card"><b>The licensed adviser</b>
        <p>Reads only what the owner disclosed, and only after they disclosed it. Consent is
          the access path, not a checkbox.</p></div>
      <div class="lp__card"><b>The carrier</b>
        <p>Sees book-level patterns, never one business's documents — unless that business
          names them.</p></div>
    </div>
  </div></section>

  <section class="lp__close"><div class="lp__wrap">
    <h2 class="lp__h2" style="margin:0 auto">See it against a real policy wording</h2>
    <p class="lp__sub" style="margin:14px auto 0">The example business runs on a genuine
      published Singapore wording, with the clauses located and quoted.</p>
    <div class="lp__cta" style="justify-content:center">
      <button class="btn btn-primary" data-act="show-login">Open the workspace</button>
    </div>
    <details class="lp__demo" style="max-width:520px;margin:26px auto 0;text-align:left">
      <summary>Trying the demo? Accounts are here.</summary>
      <div class="lp__demo-body">
        ${DEMO_ACCOUNTS.map(a => `<button type="button" class="btn btn-ghost btn-sm"
          data-act="fill-login" data-arg="${a.email}"
          style="display:block;width:100%;text-align:left;margin:6px 0"><code>${a.email}</code> — ${a.label}</button>`).join("")}
        <p class="text-xs text-muted mt-8">Password: <code>${DEMO_PASSWORD}</code>. A printed
          demo credential by design — this is not a production posture.</p>
      </div>
    </details>
  </div></section>

  <footer class="lp__foot"><div class="lp__foot-in">
    <span>VERIS — clause accounting and evidence grading for Singapore SME insurance.</span>
    <span>Findings are evidence, not advice. Cover decisions rest with your insurer.</span>
  </div></footer>
</div>`;
}

function renderLogin() {
  $("#app").innerHTML = `<div class="login-page"><div class="login-card">
    <div class="login-brand"><h1>VERIS</h1><p>Insurance intelligence that keeps up with your business</p></div>
    <p class="login-tagline">Two autonomous agents. One deterministic decision layer. Zero guesswork.</p>
    <div class="login-error" id="lerr"></div>
    <form id="lform">
      <div class="form-group"><label>Email</label><input type="email" id="lemail" required autocomplete="email"></div>
      <div class="form-group"><label>Password</label><input type="password" id="lpass" required autocomplete="current-password"></div>
      <button type="submit" class="btn btn-primary btn-full" id="lbtn">Sign In</button>
    </form>
    <div class="login-hint">
      <strong>Demo accounts</strong> — click one to fill the form:<br>
      ${DEMO_ACCOUNTS.map(a => `<button type="button" class="btn btn-ghost btn-sm" data-act="fill-login" data-arg="${a.email}" style="display:block;width:100%;text-align:left;margin:4px 0"><code>${a.email}</code> — ${a.label}</button>`).join("")}
      Password: <code>${DEMO_PASSWORD}</code>
    </div>
  </div></div>`;
  $("#lform").onsubmit = async e => {
    e.preventDefault();
    const btn = $("#lbtn"), err = $("#lerr");
    btn.disabled = true; btn.textContent = "Signing in..."; err.classList.remove("show");
    try {
      const d = await api("/api/auth/login", { method: "POST", body: { email: $("#lemail").value, password: $("#lpass").value } });
      if (d && d.ok) { setUser(d.user); render(); }
      else { err.textContent = "Login failed"; err.classList.add("show"); }
    } catch (x) { err.textContent = x.message; err.classList.add("show"); }
    finally { btn.disabled = false; btn.textContent = "Sign In"; }
  };
}

/* ── Shell ────────────────────────────────────────────────────────────── */

function shell(role, nav) {
  const roleLabel = { SME: "Business Owner", ADVISER: "Licensed Adviser", CARRIER: "Carrier Underwriter" }[role] || role;
  let navHtml = "";
  nav.forEach(s => {
    if (s.section) { navHtml += `<div class="nav-section-title">${s.section}</div>`; return; }
    const active = S.view === s.id ? "active" : "";
    const badge = s.badge ? `<span class="badge-count">${s.badge}</span>` : "";
    navHtml += `<div class="nav-item ${active}" data-v="${s.id}"><span class="icon">${s.icon}</span>${s.label}${badge}</div>`;
  });
  $("#app").innerHTML = `<div class="shell"><aside class="sidebar">
    <div class="sidebar-head"><h2>VERIS</h2><span class="badge">${esc(roleLabel)}</span></div>
    <nav class="sidebar-nav">${navHtml}</nav>
    <div class="sidebar-foot"><div class="name">${esc(S.user.name || S.user.email)}</div><div class="org">${esc(S.user.organisation_name || "")}</div><button class="btn btn-secondary btn-sm" data-act="switch-role" title="Keeps the case and its disclosures on the server, so the next role can review it">Switch Role</button><button class="btn btn-ghost btn-sm" data-act="logout" title="Signs out AND drops the case from the server">Sign Out</button></div>
  </aside><main class="main" id="main"></main></div>`;
  $$(".nav-item").forEach(n => n.onclick = () => nav8(n.dataset.v));
}

/* ══════════════════════════════════════════════════════════════════════════
   SME WORKSPACE

   WRITTEN FOR A SHOP OWNER, NOT AN UNDERWRITER.

   The engine thinks in "average clause", "condition precedent", "sum insured
   adequacy". A person running a food factory does not, and should not have to.
   Every label and sentence on these screens is the plain-English version, with
   the technical wording kept one click away rather than on the surface.

   Where a screen carries a headline, it came from `/api/presentation/compose`
   and the badge on the panel says whether a model or a written template wrote
   it. Every NUMBER came from the deterministic engine either way.
   ══════════════════════════════════════════════════════════════════════════ */

/* The unread count is painted onto the nav AFTER the shell exists.
 *
 * `shell()` is synchronous and the count needs a request, so awaiting it here would hold
 * the entire workspace behind one network call for a number. Instead the shell renders with
 * whatever was last known, the request happens alongside the screen, and the badge appears
 * when it lands. A badge is never worth a blank page, and never worth an error either —
 * a failure here is swallowed on purpose.
 */
async function refreshUnread() {
  try {
    const d = await api("/api/notifications");
    if (!d) return;
    S.unread = d.unread || 0;
    paintUnreadBadge();
  } catch { /* the rest of the workspace is unaffected */ }
}

function paintUnreadBadge() {
  const item = document.querySelector('.nav-item[data-v="sme-alerts"]');
  if (!item) return;
  item.querySelector(".badge-count")?.remove();
  if (!S.unread) return;
  const badge = document.createElement("span");
  badge.className = "badge-count";
  badge.textContent = String(S.unread);
  badge.setAttribute("aria-label", `${S.unread} unread`);
  item.appendChild(badge);
}

function renderSME() {
  if (!S.view || !S.view.startsWith("sme")) S.view = "sme-home";
  // NINE destinations, down from 23.
  //
  // 23 items is not navigation, it is an index, and an owner cannot hold 23 places in
  // their head. Worse, it made the product look like an analyst's cockpit when its whole
  // claim is that an owner can understand their own position.
  //
  // Nothing was deleted. Nineteen of the old screens are now tabs inside five container
  // screens, each still rendered by its ORIGINAL function — see renderTabs(). The four
  // that stayed standalone did so because each answers a question with no sibling:
  // Overview (where do I stand), What's New (what just happened), Share with Adviser
  // (who can see this), Your Record (what can I take away).
  //
  // Order is an argument. Overview first, then what changed, then where you are exposed,
  // then the sequence that got you here, then what to do, then what we watch, then the
  // documents that would improve all of it.
  shell("SME", [
    { section: "My business" },
    { id: "sme-home", label: "Overview", icon: "◈" },
    { id: "sme-position", label: "Your position", icon: "◉" },
    { id: "sme-alerts", label: "What's new", icon: "◍", badge: S.unread || 0 },
    { section: "Where I stand" },
    { id: "sme-protect-hub", label: "Protection", icon: "◆" },
    { id: "sme-time-hub", label: "Timeline", icon: "⧗" },
    { id: "sme-act-hub", label: "What to do", icon: "→" },
    { section: "Behind the scenes" },
    { id: "sme-mon-hub", label: "Monitoring", icon: "◎" },
    { id: "sme-docs-hub", label: "Documents", icon: "▤" },
    { section: "Your control" },
    { id: "sme-consent", label: "Share with adviser", icon: "↦" },
    { id: "sme-record", label: "Your record", icon: "▣" },
  ]);
  const m = $("#main");
  const views = {
    // the ten destinations
    "sme-home": smeHome,
    "sme-position": smeGapSnapshot,
    "sme-alerts": smeAlerts,
    "sme-protect-hub": smeProtectionHub,
    "sme-time-hub": smeTimelineHub,
    "sme-act-hub": smeActionsHub,
    "sme-mon-hub": smeMonitoringHub,
    "sme-docs-hub": smeDocumentsHub,
    "sme-consent": smeConsent,
    "sme-record": smeRecord,
    // The old ids stay routable. They are no longer in the sidebar, but internal
    // deep-links use them (the Overview's risk cards, the empty states, the "see what we
    // haven't checked" button), and breaking those to tidy a map would trade working
    // navigation for a shorter object.
    "sme-blindspots": smeBlindSpots,
    "sme-cyber": smeCyber,
    "sme-dependencies": smeDependencies,
    "sme-compounding": smeCompounding,
    "sme-roadmap": smeRoadmap,
    "sme-upload": smeUpload,
    "sme-protection": smeProtection,
    "sme-findings": smeFindings,
    "sme-scenario": smeScenario,
    "sme-willitpay": smeWillItPay,
    "sme-bi": smeBI,
    "sme-renewal": smeRenewal,
    "sme-actions": smeActions,
    "sme-gaps": smeGaps,
    "sme-connect": smeConnect,
    "sme-sentinel": smeSentinel,
    "sme-discovery": smeDiscovery,
    "sme-agents": smeAgents,
    "sme-drift": smeDrift,
  };
  mount(views[S.view] || smeHome, m);
  paintUnreadBadge();
  refreshUnread();
}

/* Small shared pieces ─────────────────────────────────────────────────────── */

/* ── Toasts ───────────────────────────────────────────────────────────────
 *
 * For the OUTCOME of something the user just did — "nothing has changed since the last
 * check" — and never for anything they need to read in order to stay correct. Anything
 * consequential belongs on the page, where it survives four seconds and a glance away.
 */
function toast(message, kind) {
  let host = document.getElementById("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    host.className = "toast-host";
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = "toast" + (kind ? ` toast--${kind}` : "");
  el.textContent = String(message || "");
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add("toast--leaving");
    setTimeout(() => el.remove(), 220);
  }, kind === "err" ? 6000 : 4000);
}

function pageTitle(h1, sub) {
  return `<div class="page-title"><h1>${esc(h1)}</h1>${sub ? `<p>${esc(sub)}</p>` : ""}</div>`;
}

/* ── Container screens: the 23 → 9 sidebar collapse ───────────────────────
 *
 * WHY COMPOSITION RATHER THAN A REWRITE.
 *
 * The sidebar had 23 destinations. That is not navigation, it is an index, and an owner
 * cannot hold 23 places in their head — so related screens became tabs inside nine
 * destinations. The brief was explicit that nothing may be deleted: every old screen's
 * content stays findable.
 *
 * The cheap way to honour that is to rebuild each screen as a section of a bigger one.
 * The safe way is what this does: every original view function is reused UNCHANGED, and
 * a container renders a tab strip above it. So `smeCyber` is still `smeCyber`, still
 * fetches what it fetched, still tested by whatever tested it. The collapse is a
 * navigation change, not a rewrite of eleven screens — which is the difference between
 * a day's work and a week of regressions.
 *
 * The one visible cost: a container's heading and the tab's own pageTitle both render,
 * so the tab title reads as a section heading. That is a normal pattern and it is worth
 * the safety.
 */
function tabStrip(group, tabs, activeId) {
  return `<div class="tabs" role="tablist">${tabs.map(t => {
    const on = t.id === activeId;
    const count = t.count != null && t.count !== 0
      ? `<span class="tab__n ${t.warn ? "warn" : ""}">${esc(t.count)}</span>` : "";
    return `<button class="tab ${on ? "on" : ""}" role="tab"
      aria-selected="${on}" data-act="tab" data-arg="${esc(group)}:${esc(t.id)}"
      >${esc(t.label)}${count}</button>`;
  }).join("")}</div>`;
}

/* Render a container: heading, optional lead sentence, tab strip, then the active tab's
 * own view mounted into a panel. `mount()` is reused so a failing tab shows the standard
 * readable error instead of a dead panel. */
async function renderTabs(el, { group, title, lead, tabs, fallback }) {
  const active = tabs.some(t => t.id === S.tab[group])
    ? S.tab[group] : (fallback || tabs[0].id);
  const tab = tabs.find(t => t.id === active) || tabs[0];
  el.innerHTML = pageTitle(title)
    + (lead ? `<p class="tab-lead">${esc(lead)}</p>` : "")
    + tabStrip(group, tabs, tab.id)
    + `<div class="tabpanel" role="tabpanel" id="tabpanel"></div>`;
  const panel = $("#tabpanel");
  if (panel) await mount(tab.view, panel);
}

/* ── The nine destinations ────────────────────────────────────────────────
 *
 * Overview, What's New, Share with Adviser and Your Record keep their own single
 * screens. The five below absorb the other nineteen.
 */

/* Protection — the four risk classes the problem statement names, plus the two
 * "what would I actually get" tools. Grouped because an owner asking "am I covered?"
 * does not know in advance whether the answer is a property, cyber, dependency or
 * business-interruption question, so making them choose the category first is asking
 * them to know the answer before they ask. */
async function smeProtectionHub(el) {
  await renderTabs(el, {
    group: "prot", title: "Protection",
    lead: "What you hold, what you don't, and what a claim would actually pay.",
    tabs: [
      { id: "score", label: "Your cover score", view: smeProtection },
      { id: "property", label: "Property and assets", view: smeFindings },
      { id: "cyber", label: "Cyber and data", view: smeCyber },
      { id: "supply", label: "Who you depend on", view: smeDependencies },
      { id: "bi", label: "If you can't trade", view: smeBI },
      { id: "scenario", label: "If you claim tomorrow", view: smeScenario },
      { id: "pay", label: "Will it actually pay?", view: smeWillItPay },
    ],
  });
}

/* Timeline — everything that is a dated sequence rather than a current state. These
 * three were separate screens telling one story out of order: what changed at renewal,
 * what changed in the business and was never followed up, and what we found as a
 * result. */
/* The Timeline's period filter.
 *
 * Kept on S and applied CLIENT-SIDE to rows the screen already has, rather than added as an
 * endpoint parameter. Two reasons: the backend pins `as_at` to the latest date the documents
 * evidence so the screen is reproducible, and a server-side window would quietly change that
 * anchor. And filtering a list of eight rows over HTTP would be a round trip to hide three of
 * them.
 *
 * "This year" means the twelve months before that document-derived `as_at`, not before today,
 * for the same reproducibility reason. */
const TIME_PERIODS = [
  { id: "all", label: "All time" },
  { id: "year", label: "This year" },
];

function timelineWithin(period, isoDate, asAt) {
  if (period !== "year" || !isoDate || !asAt) return true;
  const then = new Date(isoDate), anchor = new Date(asAt);
  if (isNaN(then) || isNaN(anchor)) return true;
  const cutoff = new Date(anchor);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  return then >= cutoff;
}

async function smeTimelineHub(el) {
  await renderTabs(el, {
    group: "time", title: "Timeline",
    lead: "Nothing here went wrong all at once. That is what makes it hard to notice.",
    tabs: [
      { id: "crept", label: "How this crept up", view: smeCompounding },
      { id: "renewal", label: "What changed this year", view: smeRenewal },
      { id: "found", label: "What we found", view: smeFindings },
    ],
  });
}

/* Actions — the three screens that answer "so what do I do". Split across the old
 * sidebar as Things to do / What would help / Protection for your stage, which meant an
 * owner looking for their next step had three candidates and no way to rank them. */
async function smeActionsHub(el) {
  await renderTabs(el, {
    group: "act", title: "What to do",
    lead: "Prepared for you, ranked by what it would settle.",
    tabs: [
      { id: "todo", label: "Things to do", view: smeActions },
      { id: "help", label: "What would help", view: smeGaps },
      { id: "stage", label: "Protection for your stage", view: smeRoadmap },
    ],
  });
}

/* Monitoring — the five agent surfaces. Deliberately NOT merged with What's New: that
 * screen answers "what just happened", this one answers "what is being watched". An
 * owner checking whether they need to act and an owner auditing our coverage are doing
 * different jobs, and collapsing them would serve neither. */
async function smeMonitoringHub(el) {
  await renderTabs(el, {
    group: "mon", title: "Monitoring",
    lead: "What we watch on your behalf, and where each answer came from.",
    tabs: [
      { id: "business", label: "Your business", view: smeConnect },
      { id: "systems", label: "Connected systems", view: smeConnected },
      { id: "around", label: "Around you", view: smeSentinel },
      { id: "public", label: "Public records", view: smeDiscovery },
      { id: "costs", label: "Keeping up with costs", view: smeDrift },
      { id: "checked", label: "What we checked", view: smeAgents },
    ],
  });
}

/* Documents — upload sits next to the blind-spot register because they are two halves
 * of one loop: here is what we could not check, and here is where you fix that. Having
 * them at opposite ends of a 23-item sidebar meant the answer to "what should I upload?"
 * was on a different screen from the upload button. */
async function smeDocumentsHub(el) {
  await renderTabs(el, {
    group: "docs", title: "Documents",
    lead: "What we have read, what we could not, and what would fill the gaps.",
    tabs: [
      { id: "start", label: "Getting started", view: smeOnboarding },
      { id: "add", label: "Add documents", view: smeUpload },
      { id: "gaps", label: "What we haven't checked", view: smeBlindSpots },
      { id: "quality", label: "How well we read them", view: smePageQuality },
    ],
  });
}

/* The honest refusal, rendered from a `_no_book_yet()` payload.
 *
 * Four carrier operations — the work queue, book patterns, the attention inbox and
 * premium-at-risk — used to compute over six invented businesses. The rows are gone, so
 * these screens now have nothing to aggregate, and the correct response is to say so
 * with what would populate them rather than to render an impressive-looking empty grid.
 *
 * Deliberately NOT styled as an error. Nothing failed; the data does not exist yet, and
 * a red banner would teach an underwriter to distrust a screen that is telling the truth.
 */
function noBookState(d) {
  return `${pageTitle("Not available yet", d.operation ? `Operation: ${esc(d.operation)}` : "")}
    <div class="insight mb-16"><div class="insight-label">Why this is empty</div>
      <div class="insight-text">${esc(d.reason || "")}</div></div>
    <div class="card mb-16"><div class="card-head"><h3>What would fill this in</h3></div>
      <p class="text-sm">${esc(d.would_need || "")}</p></div>
    ${d.what_is_real_today ? `<div class="card mb-16"><div class="card-head"><h3>What is real today</h3></div>
      <p class="text-sm">${esc(d.what_is_real_today)}</p>
      <button class="btn btn-sm btn-primary mt-12" data-act="nav" data-arg="car-portfolio">Open the wording portfolio →</button></div>` : ""}
    ${d.deliberately_not_shown ? `<p class="text-sm text-muted">${esc(d.deliberately_not_shown)}</p>` : ""}`;
}

function spinner(msg) {
  return `<div class="loading"><div class="spinner"></div>${esc(msg || "Loading")}</div>`;
}

function emptyState(title, body, actions) {
  return `<div class="card"><div class="card-head"><h3>${esc(title)}</h3></div>
    <p class="text-sm">${body}</p>
    ${actions ? `<div class="grid-2 mt-16">${actions}</div>` : ""}</div>`;
}

/* Plain words for the engine's decision states. The engine's vocabulary is precise and
 * unreadable; these are the same thing said out loud. */
const DECISION_WORDS = {
  ACTION_REQUIRED: "Needs doing",
  REVIEW: "Worth a look",
  POTENTIAL_INCIDENT: "Possible problem",
  WATCH: "Keeping an eye on it",
  MONITOR: "Nothing to do",
  UNESTABLISHED: "Can't tell yet",
};

const STATE_WORDS = {
  DOCUMENTED: "Proven by your documents",
  REQUIRES_AUTHORISED_REVIEW: "Needs an expert to look",
  INFORMATION_MISSING: "We need a document",
  NOT_CONFIRMED: "Not confirmed yet",
};

function humanDecision(v) { return DECISION_WORDS[v] || titleCase(v || ""); }
function humanState(v) { return STATE_WORDS[v] || titleCase(v || ""); }

/* One finding, in plain words. Shared with the adviser workspace, which is why it lives
 * out here rather than inside a screen.
 *
 * The old version printed the engine's own vocabulary — "REQUIRES_AUTHORISED_REVIEW",
 * "Precedence reasoning", "INTERNAL ×2". Correct, and unreadable to the person whose
 * money it concerns. Same data, said out loud. */
function renderDecision(dec) {
  const tags = [];
  if (dec.internal_refs?.length) tags.push('<span class="tag tag-info">from your records</span>');
  if (dec.external_refs?.length) tags.push('<span class="tag tag-purple">from outside</span>');
  if (dec.overlap) tags.push('<span class="tag tag-danger">two sources agree</span>');
  return `<div class="finding ${dec.decision}" data-act="toggle-detail">
    <div class="finding-head">
      <div class="finding-title">${esc(dec.interest_label || dec.interest)}</div>
      <span class="tag tag-${dec.decision}">${esc(humanDecision(dec.decision))}</span>
    </div>
    <div class="finding-body">${esc(dec.current_state || "")}</div>
    <div class="finding-meta">${tags.join("")}</div>
    <div class="finding-detail">
      ${dec.precedence_reason ? `<p class="text-sm"><strong>Why we concluded that:</strong> ${esc(dec.precedence_reason)}</p>` : ""}
      ${dec.overlap ? '<p class="text-sm mt-8">Two separate sources point the same way, which is why this ranks higher than a single signal would.</p>' : ""}
      ${(dec.actions || []).map(a => `<div class="insight mt-12"><div class="insight-label">${esc(titleCase(a.type || ""))}</div><div class="insight-text">${esc(a.label)}${a.documents?.length ? " — send: " + a.documents.map(x => esc(x)).join(", ") : ""}</div></div>`).join("")}
    </div>
  </div>`;
}

/* ── Overview ──────────────────────────────────────────────────────────────
 * Asks /api/session BEFORE /api/brief, because touching the brief CREATES the example
 * case. A user who has uploaded nothing must see nothing. */
async function smeHome(el) {
  el.innerHTML = spinner("Checking your workspace");
  const ses = await api("/api/session");
  if (ses && ses.has_case === false) {
    el.innerHTML = pageTitle(`Welcome, ${S.user.name || ""}`, "Nothing to show yet.")
      + emptyState("Give Veris something to read",
        "There are no findings here because we have not seen any of your paperwork. "
        + "Veris will not guess about a business it has not read.",
        '<button class="btn btn-primary" data-act="nav" data-arg="sme-upload">Add my documents</button>'
        + '<button class="btn btn-secondary" data-act="load-example">Try it with an example business</button>')
      + `<p class="text-xs text-muted mt-12">${esc(ses.notice || "")}</p>`;
    return;
  }

  el.innerHTML = spinner("Reading your documents");
  // The blind-spot report is fetched alongside the score, not on a separate screen the
  // owner has to go looking for. A score shown without the boundary of the assessment
  // that produced it invites exactly the wrong conclusion — that a number covering four
  // areas out of six is a verdict on all six.
  const [brief, score, signals, sentinel, notes, blind, gaps] = await Promise.all([
    api("/api/brief"), api("/api/score"), api("/api/signals"), api("/api/sentinel"),
    api("/api/notifications"), api("/api/blindspots"), api("/api/gap-summary"),
  ]);
  const findings = brief.findings || [];
  const byState = brief.summary?.by_state || {};
  const byClass = brief.summary?.by_class || {};
  const needExpert = byState.REQUIRES_AUTHORISED_REVIEW || 0;
  const cantTell = (byState.INFORMATION_MISSING || 0) + (byState.NOT_CONFIRMED || 0);
  const env = (sentinel.environment || {}).level || "LOW";

  const preloaded = brief.source === "DEMO_BUNDLE" || brief.synthetic === true;
  const exampleFiles = sessionStorage.getItem(EXAMPLE_FLAG) === "1";
  const isExample = preloaded || exampleFiles;

  const p = await getPresentation("home_overview", {
    overall: score.overall, status: score.status, action_count: needExpert,
    finding_count: findings.length, environment_level: env,
  });

  el.innerHTML = `
    ${isExample ? `<div class="synthetic-banner">${preloaded
      ? `EXAMPLE BUSINESS — you have not uploaded anything. Everything below is read from our sample paperwork for a made-up company.`
      : `EXAMPLE DOCUMENTS — these files were really uploaded and read, but the company is made up.`} Add your own to replace it.</div>` : ""}
    ${pageTitle(`Hello, ${S.user.name || ""}`,
      `${brief.business || "Your business"}${isExample ? " · example data" : ""}`)}

    ${renderWhatsNewStrip(notes)}

    <div class="grid-2 mb-16">
      <div class="card text-center card-clickable" data-act="nav" data-arg="sme-protection">
        <div class="card-head"><h3>Your cover score</h3></div>
        ${renderRing(score.overall, 150)}
        <p class="text-sm text-muted mt-8">${esc(score.status || "")}</p>
        ${blind && blind.coverage ? `<p class="text-xs text-muted mt-8">
          Covers ${blind.coverage.areas_we_can_speak_to} of ${blind.coverage.areas_total} areas of your protection.</p>` : ""}
      </div>
      <div>${renderAssessment(p?.pres, p?.mode)}</div>
    </div>

    ${blind && blind.score_caveat && blind.score_caveat.applies ? `
      <div class="caveat mb-16">
        <div class="caveat__t">What this score does and does not include</div>
        <p>${esc(blind.score_caveat.statement)}</p>
        <button class="btn btn-secondary btn-sm mt-12" data-act="open" data-arg="sme-docs-hub|docs|gaps">
          See what we haven't checked →</button>
      </div>` : ""}

    <div class="stats mb-16">
      <div class="stat card-clickable" data-act="nav" data-arg="sme-findings">
        <div class="val">${findings.length}</div><div class="lbl">Things we found</div></div>
      <div class="stat green"><div class="val">${byClass.PROVEN || 0}</div>
        <div class="lbl">Proven by a document</div></div>
      <div class="stat red card-clickable" data-act="nav" data-arg="sme-actions">
        <div class="val">${needExpert}</div><div class="lbl">Need an expert</div></div>
      <div class="stat card-clickable" data-act="nav" data-arg="sme-gaps">
        <div class="val">${cantTell}</div><div class="lbl">We couldn't check</div></div>
    </div>

    ${gaps && gaps.available ? `<div class="sub-head">Your position, in short</div>
      <div class="cov mb-16">
        <div class="cov__top">
          <div><div class="cov__label">Where you stand</div>
            <div class="cov__say">${esc(gaps.executive_summary)}</div></div>
        </div>
        <div class="stats mt-16">
          ${(gaps.categories || []).map(c => `<div class="stat ${
            c.category === "ACTION_REQUIRED" ? "red"
            : c.category === "NEEDS_VERIFICATION" ? "amber" : ""}">
            <div class="val">${c.count}</div>
            <div class="lbl">${esc(c.icon)} ${esc(c.label)}</div></div>`).join("")}
        </div>
        ${(gaps.top_three || []).length ? `<div class="sub-head" style="margin-top:20px">Start with these three</div>
          <div class="heads">${gaps.top_three.map(i => `<div class="head is-gap">
            <div><div class="head__n"><span class="gap__icon">${esc(i.icon)}</span> ${esc(i.title)}</div></div>
            ${i.source === "Your documents" ? `<button class="btn btn-ghost btn-sm"
              data-act="gap-why" data-arg="${esc(i.key)}">Show me why</button>` : ""}
          </div>`).join("")}</div>` : ""}
        <div class="caveat">
          <div class="caveat__t">Best next step</div>
          <p>${esc((gaps.best_next_action || {}).what || "")}</p>
          <button class="btn btn-secondary btn-sm mt-12" data-act="nav" data-arg="sme-position">
            See the full picture →</button>
        </div>
      </div>` : ""}

    ${blind && blind.areas ? `<div class="sub-head">Where you're exposed</div>
      <div class="areas mb-16">
        ${blind.areas.filter(a => ["digital", "dependencies", "property"].includes(a.key))
          .map(a => {
            const tab = a.key === "digital" ? "cyber"
              : a.key === "dependencies" ? "supply" : "property";
            return `<div class="area k-state ${kClass(a.state)} card-clickable"
              data-act="open" data-arg="sme-protect-hub|prot|${tab}">
            <div class="area__head">
              <div class="area__name">${esc(a.label)}</div>
              <span class="area__pill">${esc(a.state_label)}</span>
            </div>
            <div class="area__plain">${esc(a.plain)}</div>
            ${a.finding_count ? `<div class="area__meta"><b>${a.finding_count}</b> thing(s) to look at</div>` : ""}
          </div>`;
          }).join("")}
      </div>` : ""}

    <div class="grid-2 mb-16">
      <div class="card"><div class="card-head"><h3>The three big questions</h3></div>
        <p class="text-sm text-muted mb-12">Most owners want to know these before anything else.</p>
        <button class="btn btn-secondary btn-full mb-8" data-act="nav" data-arg="sme-scenario">If I claim tomorrow, what do I get?</button>
        <button class="btn btn-secondary btn-full mb-8" data-act="nav" data-arg="sme-willitpay">Will my policy actually pay?</button>
        <button class="btn btn-secondary btn-full" data-act="nav" data-arg="sme-bi">What if I can't trade for months?</button>
      </div>
      <div class="card"><div class="card-head"><h3>What we watched while you were away</h3>${renderDataBadge((sentinel.live || {}).any_live)}</div>
        ${renderChangePulse([
          { direction: "up", label: "Changes in your business",
            value: `${(signals.events || []).length} picked up`, source: "your records" },
          { direction: "new", label: "Conditions around you",
            value: env.toLowerCase(), source: "live government data" },
        ])}
        <button class="btn btn-ghost btn-sm mt-12" data-act="nav" data-arg="sme-agents">See everything we checked →</button>
      </div>
    </div>

    ${brief.synthetic_notice ? `<p class="text-xs text-muted">${esc(brief.synthetic_notice)}</p>` : ""}`;
}

/* ── Add documents ───────────────────────────────────────────────────────── */
async function smeUpload(el) {
  const kinds = await api("/api/bundle/kinds");
  el.innerHTML = pageTitle("Add your documents",
      "Your policy, your accounts, anything else you have. PDFs only.")
    + `<div class="card">
      <div class="dropzone" id="dz" role="button" tabindex="0"
           aria-label="Choose PDF files, or drag them here">
        <div class="dropzone-label">Click anywhere in this box to choose files</div>
        <p class="dropzone-hint">or drag them here</p>
        <input type="file" id="finput" multiple accept=".pdf,application/pdf" hidden>
      </div>
      <ul class="file-list" id="flist"></ul>
      <div class="form-group mt-16"><label>Your business name (optional)</label>
        <input type="text" id="bname" placeholder="e.g. Hock Lee Foods Pte Ltd" maxlength="120"></div>
      <button class="btn btn-primary mt-16" id="ubtn" disabled>Read my documents</button>
      <div id="uresult"></div>
    </div>
    <div class="card mt-16">
      <div class="card-head"><h3>Helpful to include</h3></div>
      <p class="text-sm text-muted mb-8">You do not need all of these. More documents means fewer questions we have to leave open.</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${(kinds.kinds || []).map(k => `<span class="tag">${esc(k.label || k.kind)}</span>`).join("")}
      </div>
    </div>
    <div class="card mt-16 card-clickable" data-act="load-example">
      <div class="card-head"><h3>Or try it with an example business</h3></div>
      <p class="text-sm text-muted">A made-up food factory with real problems hidden in its paperwork. Goes through exactly the same reading process as your own files.</p>
    </div>`;

  /* Each entry is `{ file, status, note }` rather than a bare File, because
   * `renderList()` rewrites the whole list and anything held only in the DOM would be
   * lost on the next repaint — including the tick we just earned. `removeFile` splices
   * this array, so status travels with its file instead of with an index. */
  let files = [];
  const dz = $("#dz"), fl = $("#flist"), fi = $("#finput"), btn = $("#ubtn");

  // The whole box is the target. Previously only the small label opened the picker while
  // the entire dashed area showed a pointer cursor, so clicking the obvious place did
  // nothing and the screen looked broken.
  dz.onclick = () => fi.click();
  dz.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fi.click(); } };
  fi.onchange = e => { addFiles(e.target.files); fi.value = ""; };
  dz.ondragover = e => { e.preventDefault(); dz.classList.add("dragover"); };
  dz.ondragleave = e => { e.preventDefault(); dz.classList.remove("dragover"); };
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove("dragover"); addFiles(e.dataTransfer?.files); };

  function addFiles(list) {
    for (const f of Array.from(list || [])) {
      if (f.name.toLowerCase().endsWith(".pdf")) {
        files.push({ file: f, status: "queued", note: "" });
      }
    }
    renderList();
  }

  /* The per-file mark. `queued` is deliberately an empty slot rather than a grey tick:
   * nothing has happened to that file yet and a mark would imply otherwise. */
  function fileMark(status) {
    if (status === "reading") {
      return `<span class="fmark fmark--reading" role="status"
        aria-label="Reading"><span class="fmark__spin"></span></span>`;
    }
    if (status === "done") {
      return `<span class="fmark fmark--done" aria-label="Read">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path
          d="M3.5 8.6l3 3 6-6.5" fill="none" stroke="currentColor"
          stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    }
    if (status === "failed") {
      return `<span class="fmark fmark--failed" aria-label="Could not be read">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path
          d="M5 5l6 6M11 5l-6 6" fill="none" stroke="currentColor"
          stroke-width="2.2" stroke-linecap="round"/></svg></span>`;
    }
    return `<span class="fmark fmark--queued" aria-hidden="true"></span>`;
  }

  function renderList() {
    const busy = files.some(r => r.status === "reading");
    fl.innerHTML = files.map((r, i) => `<li class="file-item ${esc(r.status)}">
      ${fileMark(r.status)}
      <span class="file-item__name">${esc(r.file.name)}${r.note
        ? `<span class="file-item__note">${esc(r.note)}</span>` : ""}</span>
      <span class="text-xs text-muted">${(r.file.size / 1024).toFixed(0)} KB</span>
      ${busy ? "" : `<button class="btn btn-ghost btn-sm" data-act="remove-file"
        data-arg="${i}" aria-label="Remove ${esc(r.file.name)}">✕</button>`}
    </li>`).join("");
    btn.disabled = !files.length || busy;
    btn.textContent = busy ? "Reading..." : files.length
      ? `Read my ${files.length === 1 ? "document" : files.length + " documents"}`
      : "Read my documents";
  }
  window.removeFile = i => { files.splice(i, 1); renderList(); };

  /* Find the row a server event refers to. Matched on FILENAME, never on index: the
   * intake report is built in two passes, so rejected files are reported before accepted
   * ones and the server's order is not the upload order. The server also normalises the
   * name (`ingest.safe_filename`), hence the relaxed fallback. */
  function rowFor(filename) {
    const want = String(filename || "");
    return files.find(r => r.file.name === want)
      || files.find(r => r.file.name.replace(/[<>:"/\\|?*]/g, "_") === want)
      || null;
  }

  btn.onclick = async () => {
    files.forEach(r => { r.status = "queued"; r.note = ""; });
    renderList();
    btn.disabled = true; btn.textContent = "Reading...";
    $("#uresult").innerHTML = "";
    const fd = new FormData();
    files.forEach(r => fd.append("files", r.file, r.file.name));
    const nm = $("#bname")?.value?.trim();
    if (nm) fd.append("business_name", nm);
    try {
      sessionStorage.removeItem(EXAMPLE_FLAG);
      const done = await streamBundle(fd, ev => {
        if (ev.event === "reading") {
          const row = rowFor(ev.filename);
          if (row) { row.status = "reading"; renderList(); }
        } else if (ev.event === "read") {
          const row = rowFor(ev.filename);
          if (row) {
            row.status = ev.accepted ? "done" : "failed";
            row.note = ev.accepted
              ? `${titleCase(ev.kind || "")} · ${ev.pages} page${ev.pages === 1 ? "" : "s"}`
              : (ev.message || "Could not be read");
            renderList();
          }
        } else if (ev.event === "analysing") {
          $("#uresult").innerHTML = `<div class="loading mt-16"><div class="spinner"></div>
            Working out what your documents mean</div>`;
        }
      });
      const rejected = (done.intake?.files || []).filter(f => !f.accepted);
      const accepted = (done.intake?.files || []).filter(f => f.accepted).length;
      const found = done.brief.findings?.length || 0;
      $("#uresult").innerHTML = `<div class="insight mt-16">
        <div class="insight-label">Done</div>
        <div class="insight-text">We read ${accepted} document${accepted === 1 ? "" : "s"} and found ${found} thing${found === 1 ? "" : "s"} worth telling you about.</div>
        <div class="insight-action"><button class="btn btn-sm btn-primary" data-act="nav" data-arg="sme-home">See what we found →</button></div></div>
        ${rejected.length ? `<div class="insight warn mt-8"><div class="insight-label">Couldn't read ${rejected.length}</div><div class="insight-text">${rejected.map(f => esc(f.filename || "") + (f.message ? " — " + esc(f.message) : "")).join("<br>")}</div></div>` : ""}`;
      // The rows keep their ticks. Clearing the list here would delete the only record
      // the user has of which documents were accepted and which were not.
      files.forEach(r => { if (r.status === "reading") r.status = "queued"; });
    } catch (err) {
      files.forEach(r => { if (r.status === "reading") r.status = "failed"; });
      $("#uresult").innerHTML = `<div class="insight critical mt-16"><div class="insight-label">Something went wrong</div><div class="insight-text">${esc(err.message)}</div></div>`;
    }
    renderList();
    btn.disabled = false;
  };
}

/* Read the NDJSON progress stream from POST /api/bundle/stream.
 *
 * Not routed through `api()` because that helper resolves the whole body as JSON, which
 * is exactly what must not happen here — the point is to act on each line as it lands.
 * Resolves with the terminal `done` event, throws on a terminal `error` event.
 *
 * Falls back to the blocking `/api/bundle` when the browser has no streaming body reader.
 * The fallback loses per-file timing and says so by leaving the rows queued rather than
 * inventing ticks for work it did not watch.
 */
async function streamBundle(formData, onEvent) {
  let r;
  try {
    r = await fetch("/api/bundle/stream",
      { method: "POST", body: formData, credentials: "same-origin" });
  } catch (e) {
    throw new Error("Cannot reach the server. Check it is running.");
  }
  if (!r.ok) {
    const e = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(e.detail || e.error?.message || `Error ${r.status}`);
  }
  if (!r.body || !r.body.getReader) {
    const blocking = await api("/api/bundle", { method: "POST", body: formData });
    return blocking;
  }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let terminal = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    // Keep the trailing fragment: a chunk boundary can land mid-line.
    const lines = buffer.split("\n");
    buffer = done ? "" : lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      let ev;
      try { ev = JSON.parse(line); } catch (_) { continue; }
      if (ev.event === "error") throw new Error(ev.message || "The upload failed.");
      if (ev.event === "done") terminal = ev;
      else onEvent(ev);
    }
    if (done) break;
  }
  if (!terminal) throw new Error("The upload ended before it finished reading.");
  return terminal;
}

window.loadExample = async function () {
  const el = $("#main");
  if (el) el.innerHTML = spinner("Loading the example business and reading its paperwork");
  try {
    sessionStorage.setItem(EXAMPLE_FLAG, "1");
    const man = await api("/api/example/manifest");
    const files = [];
    for (const doc of (man.documents || [])) {
      const resp = await fetch("/api/example/file/" + encodeURIComponent(doc.name));
      if (resp.ok) files.push(new File([await resp.blob()], doc.name, { type: "application/pdf" }));
    }
    const fd = new FormData();
    files.forEach(f => fd.append("files", f, f.name));
    fd.append("business_name", man.business_name || "Hock Lee Foods Pte Ltd");
    await api("/api/bundle", { method: "POST", body: fd });
    nav8("sme-home");
  } catch (err) {
    if (el) el.innerHTML = `<div class="insight critical"><div class="insight-label">Could not load the example</div><div class="insight-text">${esc(err.message)}</div></div>`;
  }
};

/* ── Your cover score ────────────────────────────────────────────────────── */
async function smeProtection(el) {
  el.innerHTML = spinner();
  const score = await api("/api/score"); if (!score) return;
  const p = await getPresentation("protection_overview", {
    overall: score.overall, status: score.status,
    assessed_dimensions: score.assessed_dimensions,
    total_dimensions: score.total_dimensions,
  });
  const dims = (score.dimensions || []).map(d => ({
    label: d.label || d.key, value: d.score ?? 0, max: 100,
    display: d.score == null ? "not checked" : d.score + "/100",
    status: d.score == null ? "warn" : d.score > 70 ? "good" : d.score > 40 ? "warn" : "bad",
  }));
  el.innerHTML = pageTitle("Your cover score",
      "How well your paperwork backs up the cover you think you have.")
    + `<div class="grid-2 mb-16">
        <div class="card text-center">${renderRing(score.overall, 170)}
          <h3 class="mt-12">${esc(score.status || "")}</h3>
          <p class="text-xs text-muted mt-8">We could check ${score.assessed_dimensions ?? "—"} of ${score.total_dimensions ?? "—"} areas. An area with no paperwork is left blank, not marked zero.</p>
        </div>
        <div>${renderAssessment(p?.pres, p?.mode)}</div>
      </div>
      ${score.headline_exposure ? `<div class="insight critical mb-16"><div class="insight-label">Biggest single gap</div><div class="insight-text">On a ${money(score.headline_exposure.assessed_loss_sgd)} loss you would get about ${money(score.headline_exposure.illustrated_settlement_sgd)} — leaving ${money(score.headline_exposure.amount_sgd)} with you.</div><div class="insight-action"><button class="btn btn-sm btn-primary" data-act="nav" data-arg="sme-scenario">See how that works →</button></div></div>` : ""}
      <div class="card"><div class="card-head"><h3>Area by area</h3></div>${renderBars(dims)}
        <p class="text-xs text-muted mt-12">${esc(score.notice || "")}</p></div>`;
}

/* ── What we found ───────────────────────────────────────────────────────── */
async function smeFindings(el) {
  el.innerHTML = spinner("Putting everything together");
  const d = await api("/api/orchestrator/evaluate"); if (!d) return;
  const decisions = d.decisions || [];
  const needs = decisions.filter(x => x.decision === "ACTION_REQUIRED" || x.decision === "REVIEW");
  const rest = decisions.filter(x => !needs.includes(x));
  el.innerHTML = pageTitle("What we found",
      `${decisions.length} area${decisions.length === 1 ? "" : "s"} of your business, each judged on your own documents.`)
    + (needs.length ? `<h3 class="mb-8">Worth your attention</h3><div class="findings mb-16">${needs.map(renderDecision).join("")}</div>` : "")
    + (rest.length ? `<h3 class="mb-8">Everything else</h3><div class="findings">${rest.map(renderDecision).join("")}</div>` : "")
    + `<p class="text-xs text-muted mt-16">${esc(d.notice || "")}</p>`;
}

/* ── Things to do ────────────────────────────────────────────────────────── */
async function smeActions(el) {
  el.innerHTML = spinner();
  const d = await api("/api/actions"); if (!d) return;
  const actions = d.actions || [];
  if (!actions.length) {
    el.innerHTML = pageTitle("Things to do", "Nothing waiting on you.")
      + emptyState("All clear", "There is nothing for you to action right now.");
    return;
  }
  el.innerHTML = pageTitle("Things to do",
      `${actions.length} item${actions.length === 1 ? "" : "s"} prepared for you.`)
    + actions.map(a => `<div class="action-card">
        <div class="action-head"><div class="action-title">${esc(a.title || a.interest || "")}</div>
          <span class="tag tag-${a.state || ""}">${esc(humanState(a.state) || (a.state || "").replace(/_/g, " "))}</span></div>
        <div class="action-body">${esc(a.action_label || a.exposure_basis || "")}${a.asks ? " — we would ask for: " + esc(a.asks) : ""}</div>
        <div class="action-meta">${a.exposure_sgd ? `<span class="tag tag-danger">${money(a.exposure_sgd)} at stake</span>` : ""}<span class="tag">${esc(titleCase(a.interest || ""))}</span></div>
      </div>`).join("")
    + `<p class="text-xs text-muted mt-16">${esc(d.premium_notice || "")}</p>`;
}

/* ── What would help ────────────────────────────────────────────────────── */
async function smeGaps(el) {
  el.innerHTML = spinner();
  const d = await api("/api/information-value"); if (!d) return;
  const gaps = d.gaps || [];
  const p = await getPresentation("gaps_summary", {
    gap_count: gaps.length,
    top_document: (gaps[0] || {}).document_needed,
  });
  el.innerHTML = pageTitle("What would help",
      "Questions we left open, and the one document that would answer each.")
    + renderAssessment(p?.pres, p?.mode)
    + (gaps.length ? gaps.map((g, i) => `<div class="card mb-12">
        <div class="card-head"><h3>${i + 1}. ${esc(g.document_needed || g.operand || "")}</h3>
          ${g.unbounded ? '<span class="tag tag-danger">Biggest unknown</span>' : ""}</div>
        <p class="text-sm">${esc(g.note || "")}</p>
        <p class="text-xs text-muted mt-8">Sending this would turn a guess into something proven.</p>
      </div>`).join("")
      : emptyState("Nothing missing", "We had enough paperwork to answer every question we asked."))
    + `<p class="text-xs text-muted mt-12">${esc(d.caveat || "")}</p>`;
}

/* ── Changes in your business ───────────────────────────────────────────── */
async function smeConnect(el) {
  el.innerHTML = spinner();
  const d = await api("/api/signals"); if (!d) return;
  const events = d.events || [];
  const p = await getPresentation("connect_summary", { event_count: events.length });
  el.innerHTML = pageTitle("Changes in your business",
      "Picked up from your own records, without you telling us.")
    + renderAssessment(p?.pres, p?.mode)
    + `<div class="card mb-16"><div class="card-head"><h3>What changed</h3></div>
        ${renderChangePulse(events.map(e => ({
          direction: e.kind === "ASSET_ACQUIRED" ? "new" : "up",
          label: e.label || titleCase(e.kind || ""),
          value: e.amount_sgd ? money(e.amount_sgd) : "",
          source: e.connector || "",
        })))}</div>
      <div class="card"><div class="card-head"><h3>Where this comes from</h3></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${(d.connectors || []).map(c => `<span class="source-badge ${c.simulated ? "demo" : "connected"}">${esc(c.name)} ${c.simulated ? '<small style="margin-left:auto">example</small>' : ""}</span>`).join("")}
        </div>
        <p class="text-xs text-muted mt-12">${esc(d.notice || "")}</p></div>`;
}

/* ── Around your business ───────────────────────────────────────────────── */
async function smeSentinel(el) {
  el.innerHTML = spinner("Checking conditions around you");
  const d = await api("/api/sentinel"); if (!d) return;
  const live = d.live || {};
  const env = (d.environment || {}).level || "LOW";
  const signals = d.signals || [];
  const p = await getPresentation("sentinel_summary", {
    environment_level: env, signal_count: signals.length,
  });
  el.innerHTML = pageTitle("Around your business",
      "Things happening outside that could affect what it costs to put you back together.")
    + `<div class="grid-2 mb-16">
        <div class="card"><div class="card-head"><h3>Conditions now</h3>${renderDataBadge(live.any_live)}</div>
          ${renderRiskMeter(env)}
          <p class="text-xs text-muted mt-12">${live.any_live
            ? "Live — we called a Singapore government service for this, just now."
            : "Example data. Set PROVEN_LIVE_SOURCES=1 for live figures."}${live.fetched_at ? " · " + esc(live.fetched_at) : ""}</p>
        </div>
        <div>${renderAssessment(p?.pres, p?.mode)}</div>
      </div>
      <div class="card mb-16"><div class="card-head"><h3>What we are watching</h3></div>
        ${renderTimeline(signals.map(s => ({
          title: s.label, source: (s.source || {}).name, date: s.observed_on,
          detail: s.detail, severity: s.severity,
        })))}
      </div>
      <div class="card"><div class="card-head"><h3>Exactly where we looked</h3></div>
        <table class="mt-8"><thead><tr><th>Source</th><th>Address we called</th><th>Result</th></tr></thead><tbody>
          ${(live.fetch_log || []).map(f => `<tr><td>${esc(f.source || "")}</td><td class="text-xs" style="font-family:var(--mono);word-break:break-all">${esc(f.url || "")}</td><td>${f.ok ? '<span class="tag tag-success">OK</span>' : `<span class="tag tag-danger">${esc(f.error || "no answer")}</span>`}</td></tr>`).join("")}
        </tbody></table></div>`;
}

/* ══════════════════════════════════════════════════════════════════════════
   WHAT'S NEW — the watching surface

   The one screen that exists because time passed. Every other screen answers "what is
   true about my policy right now"; this one answers "what changed while I was not
   looking", which is the only question a notification can honestly be about.

   Three things are deliberately on screen rather than in a footnote:
     * whether an email was actually SENT, and if not, why not
     * the exact message that was composed, readable in full
     * that a website is self-authored, so what it says is a flag and not a fact
   ══════════════════════════════════════════════════════════════════════════ */

/* The Overview strip. Shown only when there is genuinely something unread — a permanent
 * "0 new things" panel trains the eye to skip that part of the page, which is exactly where
 * the one that matters will eventually appear. */
function renderWhatsNewStrip(notes) {
  const unread = (notes || {}).unread || 0;
  if (!unread) return "";
  const items = ((notes || {}).notifications || []).filter(n => !n.read).slice(0, 2);
  const urgent = items.some(n => n.severity === "HIGH");
  return `<div class="insight ${urgent ? "critical" : ""} mb-16">
    <div class="insight-label">While you were away</div>
    <div class="insight-text">${unread} thing${unread === 1 ? "" : "s"} changed in your
      public information since you last looked.</div>
    <ul class="ntf__points">${items.map(n => `<li>${esc(n.title)}</li>`).join("")}</ul>
    <div class="insight-action">
      <button class="btn btn-sm btn-primary" data-act="nav" data-arg="sme-alerts">
        See what changed →</button></div>
  </div>`;
}

async function checkNow() {
  toast("Looking at your public information…");
  try {
    const r = await api("/api/notifications/check-now", { method: "POST" });
    if (!r) return;
    if (r.first_observation) {
      toast("First look recorded. From now on we can tell you what changes.", "ok");
    } else if (r.notifications_created > 0) {
      toast(`${r.notifications_created} new change${r.notifications_created === 1 ? "" : "s"} found`,
            "warn");
    } else {
      toast("Nothing has changed since the last check.", "ok");
    }
    await refreshUnread();
    render();
  } catch (e) {
    toast(e.message || "The check could not run.", "err");
  }
}

async function markNotificationRead(id) {
  try {
    await api(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
    await refreshUnread();
    render();
  } catch (e) { toast(e.message, "err"); }
}

async function markAllNotificationsRead() {
  try {
    const r = await api("/api/notifications/read-all", { method: "POST" });
    if (r) toast(r.marked_read ? `${r.marked_read} marked as read` : "Nothing unread", "ok");
    await refreshUnread();
    render();
  } catch (e) { toast(e.message, "err"); }
}

async function restartWatch() {
  try {
    const r = await api("/api/notifications/restart-watch", { method: "POST" });
    if (r) toast("Cleared. What your website says today is the new normal.", "ok");
    S.unread = 0;
    await refreshUnread();
    render();
  } catch (e) { toast(e.message, "err"); }
}

async function setNotificationPref(changes) {
  try {
    await api("/api/notifications/preferences", { method: "POST", body: changes });
    toast("Saved", "ok");
    render();
  } catch (e) { toast(e.message, "err"); }
}

/* `arg` arrives as "CODE:0" or "CODE:1" — the value to SET, computed when the button was
 * drawn. The button cannot read its own new state because the click was prevented. */
function setNotificationCode(arg) {
  const [code, on] = String(arg || "").split(":");
  if (!code) return;
  return setNotificationPref({ codes: { [code]: on === "1" } });
}

const _SEV_WORDS = { HIGH: "Worth doing now", MODERATE: "Worth knowing", LOW: "Minor" };
const _MAIL_WORDS = {
  SENT: ["tag-success", "Emailed to you"],
  NO_MAIL_SERVER: ["tag-warning", "Written to your outbox"],
  SUPPRESSED_BY_PREFERENCE: ["tag", "Not emailed, by your settings"],
  HELD_FOR_DIGEST: ["tag", "Saved for your daily summary"],
  FAILED: ["tag-danger", "Email failed"],
  NOT_ATTEMPTED: ["tag", "Not emailed"],
};

function renderNotification(n) {
  const sev = n.severity === "HIGH" ? "tag-danger"
    : n.severity === "MODERATE" ? "tag-warning" : "tag";
  const [mailCls, mailWord] = _MAIL_WORDS[n.email_status] || _MAIL_WORDS.NOT_ATTEMPTED;
  const ev = n.evidence || {};
  const points = (ev.supporting_points || []).slice(0, 3);
  /* WHO SENT THIS, made unmissable.
   *
   * Two senders now write to this inbox. VERIS reports what its own agents noticed; the
   * insurer asks the owner to do something. An owner deciding whether to act needs to know
   * which — a monitoring agent's observation and a request from the company that would pay
   * the claim are different kinds of message, and rendering them identically would waste the
   * whole point of the carrier feature.
   *
   * The flag comes from the notification's own evidence (`sent_by: CARRIER`, set by
   * /api/carrier/notify), not from guessing at the code prefix. */
  const fromInsurer = (ev.sent_by === "CARRIER");
  return `<div class="ntf ${n.read ? "ntf--read" : "ntf--unread"} ${fromInsurer ? "ntf--insurer" : ""}">
    ${fromInsurer ? `<div class="ntf__from">
      <span class="ntf__from-mark">✉</span>
      From your insurer${ev.source_name ? ` — ${esc(ev.source_name)}` : ""}
      <span class="ntf__from-note">not from Veris</span></div>` : ""}
    <div class="ntf__head">
      <span class="tag ${sev}">${esc(_SEV_WORDS[n.severity] || n.severity)}</span>
      <div class="ntf__title">${esc(n.title)}</div>
      ${n.read ? "" : `<button class="btn btn-ghost btn-sm" data-act="ntf-read"
         data-arg="${esc(n.id)}">Mark as read</button>`}
    </div>
    ${ev.subheadline ? `<p class="text-sm text-muted mb-8">${esc(ev.subheadline)}</p>` : ""}
    <div class="ntf__body">${esc(n.body)}</div>
    ${points.length ? `<ul class="ntf__points">${points.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
    ${n.what_to_do ? `<div class="ntf__todo"><b>What would help</b>${esc(n.what_to_do)}</div>` : ""}
    ${ev.caveat ? `<div class="ntf__caveat">${esc(ev.caveat)}</div>` : ""}
    <div class="ntf__meta">
      <span>${esc(n.code_label || n.code)}</span>
      ${ev.source_name ? `<span>Seen on ${esc(ev.source_name)}</span>` : ""}
      <span class="tag ${mailCls}">${esc(mailWord)}</span>
      <span>${n.wording_by === "MODEL" ? "Wording by AI" : "Wording from a template"}</span>
    </div>
    ${n.email_detail && n.email_status !== "SENT"
      ? `<p class="text-xs text-muted mt-8">${esc(n.email_detail)}</p>` : ""}
  </div>`;
}

function renderMailPreview(messages, selectedId) {
  if (!messages.length) {
    return `<div class="card"><div class="card-head"><h3>Emails we wrote</h3></div>
      <p class="text-sm">Nothing yet. When we find a change, the message we send you
      appears here in full so you can see exactly what went out.</p></div>`;
  }
  const chosen = messages.find(m => m.id === selectedId) || messages[0];
  const list = messages.map(m => `<div class="mail-list__item ${m.id === chosen.id ? "mail-list__item--on" : ""}"
      data-act="ntf-preview" data-arg="${esc(m.id)}">
      <span class="tag ${m.status === "SENT" ? "tag-success" : "tag-warning"}">${esc(m.status === "SENT" ? "sent" : "not sent")}</span>
      <span class="mail-list__subject">${esc(m.subject)}</span></div>`).join("");
  return `<div class="card"><div class="card-head"><h3>Emails we wrote</h3>
      <span class="tag">${messages.length}</span></div>
    <p class="text-sm text-muted mb-12">This is the real message, word for word. If no mail
      server is set up we still write it, and say so, rather than claiming it was sent.</p>
    ${messages.length > 1 ? `<div class="mail-list mb-12">${list}</div>` : ""}
    <div class="mail">
      <div class="mail__head">
        <div class="mail__subject">${esc(chosen.subject)}</div>
        <div class="mail__row"><span class="mail__k">To</span><span class="mail__v">${esc(chosen.to)}</span></div>
        <div class="mail__row"><span class="mail__k">From</span><span class="mail__v">${esc(chosen["from"])}</span></div>
        <div class="mail__row"><span class="mail__k">Status</span><span class="mail__v">${esc(chosen.status)} — ${esc(chosen.detail || "")}</span></div>
      </div>
      <div class="mail__body">${esc(chosen.text_body)}</div>
    </div></div>`;
}

function renderNotificationPrefs(prefs, available) {
  const sevBtn = (v, label) => `<button class="btn btn-sm ${prefs.minimum_severity === v ? "btn-primary" : "btn-secondary"}"
      data-act="ntf-sev" data-arg="${v}">${esc(label)}</button>`;
  const digBtn = (v, label) => `<button class="btn btn-sm ${prefs.digest === v ? "btn-primary" : "btn-secondary"}"
      data-act="ntf-digest" data-arg="${v}">${esc(label)}</button>`;
  const codes = (available || []).map(c => {
    const on = (prefs.codes || {})[c.code] !== false;
    return `<div class="pref"><div>
        <div class="pref__label">${esc(c.label)}</div>
        <div class="pref__hint">${esc(_SEV_WORDS[c.severity] || c.severity)}</div>
      </div>
      <div class="btn-group"><button class="btn btn-sm ${on ? "btn-primary" : "btn-secondary"}"
        data-act="ntf-pref" data-arg="${esc(c.code)}:${on ? "0" : "1"}">${on ? "On" : "Off"}</button></div>
    </div>`;
  }).join("");

  return `<div class="card"><div class="card-head"><h3>What we email you about</h3></div>
    <p class="text-sm text-muted mb-12">Turning something off here stops the email, not the
      check. We still find it, still show it here, and say why it was not sent.</p>
    <div class="pref"><div><div class="pref__label">Email me at all</div>
        <div class="pref__hint">Master switch</div></div>
      <div class="btn-group"><button class="btn btn-sm ${prefs.email_enabled ? "btn-primary" : "btn-secondary"}"
        data-act="ntf-mail" data-arg="${prefs.email_enabled ? "0" : "1"}">${prefs.email_enabled ? "On" : "Off"}</button></div></div>
    <div class="pref"><div><div class="pref__label">How important before you email me</div>
        <div class="pref__hint">Anything less important is still recorded here</div></div>
      <div class="btn-group">${sevBtn("LOW", "Everything")}${sevBtn("MODERATE", "Worth knowing")}${sevBtn("HIGH", "Only urgent")}</div></div>
    <div class="pref"><div><div class="pref__label">When</div>
        <div class="pref__hint">Straight away, or once a day in one email</div></div>
      <div class="btn-group">${digBtn("IMMEDIATE", "Straight away")}${digBtn("DAILY", "Once a day")}</div></div>
    ${codes}</div>`;
}

async function smeAlerts(el) {
  el.innerHTML = spinner("Checking what changed");
  const [d, prefs, box, watch] = await Promise.all([
    api("/api/notifications"),
    api("/api/notifications/preferences"),
    api("/api/notifications/outbox"),
    api("/api/notifications/watch"),
  ]);
  if (!d) return;
  const items = d.notifications || [];
  const counts = d.counts || {};
  const messages = (box || {}).messages || [];
  const w = (watch || {}).watchlist || {};
  const mail = d.mail || {};
  const lastChecked = d.last_checked
    ? new Date(d.last_checked).toLocaleString() : "not yet";

  el.innerHTML = pageTitle("What's new",
      "Changes we found in your public information since the last time we looked.")
    + `<div class="grid-2 mb-16">
        <div class="card">
          <div class="card-head"><h3>Watching for you</h3>
            ${renderDataBadge(true)}</div>
          <div class="v-stats mb-12">
            <div class="v-stat"><div class="v-stat__val">${d.unread || 0}</div>
              <div class="v-stat__label">not read yet</div></div>
            <div class="v-stat"><div class="v-stat__val">${counts.total || 0}</div>
              <div class="v-stat__label">found in total</div></div>
            <div class="v-stat"><div class="v-stat__val">${d.facts_watched || 0}</div>
              <div class="v-stat__label">things watched</div></div>
          </div>
          <p class="text-sm text-muted">Last checked: ${esc(lastChecked)}.
            We look again on our own every few minutes.</p>
          <div class="grid-2 mt-12">
            <button class="btn btn-primary" data-act="check-now">Check now</button>
            ${items.some(n => !n.read)
              ? '<button class="btn btn-secondary" data-act="ntf-read-all">Mark all as read</button>'
              : ""}
          </div>
          ${counts.total ? `<div class="pref mt-12"><div>
              <div class="pref__label">I've dealt with these</div>
              <div class="pref__hint">Clears this list and treats what your website says
                today as correct. Nothing on your policy or in your record changes.</div>
            </div>
            <div class="btn-group"><button class="btn btn-ghost btn-sm"
              data-act="ntf-restart">Start fresh</button></div></div>` : ""}
        </div>
        <div class="card"><div class="card-head"><h3>How this works</h3></div>
          <p class="text-sm">We read what your business publishes about itself — your
            website, and the government company register — and compare it with what your
            policy says. When the two stop matching, you hear about it.</p>
          <ul class="ntf__points mt-12">
            <li>The first look is just a starting point, so it never raises anything.</li>
            <li>We only raise things with a definite value: an address, a number of
                people, a registration status.</li>
            <li>Your own website tells us what you published, not what is true, so those
                are flags rather than proof.</li>
          </ul>
          <p class="text-xs text-muted mt-12">${esc(mail.notice || "")}</p>
        </div>
      </div>

      ${items.length
        ? `<h3 class="mb-12">${items.length} thing${items.length === 1 ? "" : "s"} we noticed</h3>
           ${items.map(renderNotification).join("")}`
        : emptyState("Nothing new",
            `We have looked at your public information and it still matches your policy.
             ${d.last_checked ? "" : "Press Check now to take the first look."}`,
            '<button class="btn btn-primary" data-act="check-now">Check now</button>')}

      <div class="grid-2 mt-16">
        ${renderMailPreview(messages, S.previewMessage)}
        ${renderNotificationPrefs((prefs || {}).preferences || {},
                                  (prefs || {}).available_codes || [])}
      </div>

      <p class="text-xs text-muted mt-16">${esc(w.notice || "")}
        ${esc((watch || {}).alertable_note || "")}</p>`;
}

/* ── Public records ─────────────────────────────────────────────────────── */
async function smeDiscovery(el) {
  el.innerHTML = spinner("Looking you up in public records");
  const d = await api("/api/discovery"); if (!d) return;
  const facts = d.facts || [];
  const isLive = d.demo_mode === false;
  const p = await getPresentation("discovery_summary", {
    verified_count: d.verified_count, sources_checked: d.sources_checked,
  });
  el.innerHTML = pageTitle("Public records",
      "What the government register says about you, checked against your policy.")
    + `<div class="grid-2 mb-16">
        <div class="card"><div class="card-head"><h3>Where we looked</h3>${renderDataBadge(isLive)}</div>
          <p class="text-sm">${isLive
            ? "Live — we searched Singapore's official company register just now."
            : "Example data. Set PROVEN_LIVE_SOURCES=1 to search the real register."}</p>
          <table class="mt-12"><tbody>
            ${(d.fetch_log || []).map(f => `<tr><td>${esc(f.source)}</td><td>${f.ok ? '<span class="tag tag-success">found</span>' : `<span class="tag">${esc(String(f.error || "not available").slice(0, 40))}</span>`}</td></tr>`).join("")}
          </tbody></table></div>
        <div>${renderAssessment(p?.pres, p?.mode)}</div>
      </div>
      ${renderHowWeRead(d.extraction, d.discarded)}
      ${facts.length ? `<div class="findings">${facts.map(f => `<div class="finding" data-act="toggle-detail">
          <div class="finding-head"><div class="finding-title">${esc(f.label || "")}</div>
            <span class="tag">${f.extraction === "MODEL" ? "AI spotted this" : "Rule spotted this"}</span>
            <span class="tag tag-${f.claim_scope === "DISCOVERY_VERIFIED" ? "success" : "warning"}">${f.claim_scope === "DISCOVERY_VERIFIED" ? "Confirmed by the register" : "Worth checking"}</span></div>
          <div class="finding-body">${esc(f.detail || "")}</div>
          <div class="finding-detail">
            <p class="text-sm">${f.grounded
              ? "We found these exact words in the page we fetched. If we could not, we would have thrown this away."
              : "We could not find this wording in the page, so we are only flagging it, not claiming it."}</p>
            ${f.ground_quote ? `<p class="text-sm mt-8"><strong>The words we found:</strong> &ldquo;${esc(String(f.ground_quote).slice(0, 220))}&rdquo;</p>` : ""}
          </div>
        </div>`).join("")}</div>`
      : emptyState("Nothing out of place", "Your public records match what your policy says.")}`;
}

/* How the facts above were pulled out of the pages, and what we refused to keep.
   The thrown-away pile is the point of this panel, not a footnote to it: anyone can show
   you what a model found, and showing what it got wrong is what makes the rest credible. */
function renderHowWeRead(x, discarded) {
  if (!x) return "";
  const thrown = discarded || [];
  return `<div class="card mb-16">
    <div class="card-head"><h3>How we read these pages</h3>
      <span class="tag">${x.model_used ? "AI + fixed rules" : "Fixed rules only"}</span></div>
    <p class="text-sm">Two readers go over every page. Fixed rules look for wording we already
      expect. ${x.model_used
        ? "Our AI reads the rest, in case a page is worded in a way we did not plan for."
        : "The AI reader is switched off right now, so you are seeing rules only."}
      Nothing either of them says is shown to you until we find those exact words back in the
      page itself.</p>
    <div class="v-stats mt-12">
      <div class="v-stat"><div class="v-stat__val">${x.pattern_facts ?? 0}</div>
        <div class="v-stat__label">found by fixed rules</div></div>
      <div class="v-stat"><div class="v-stat__val">${x.model_facts ?? 0}</div>
        <div class="v-stat__label">found by AI</div></div>
      <div class="v-stat v-stat--warn"><div class="v-stat__val">${x.discarded_ungrounded ?? 0}</div>
        <div class="v-stat__label">thrown away</div></div>
    </div>
    ${thrown.length ? `<div class="mt-12">
      <p class="text-sm"><strong>What we threw away, and why:</strong></p>
      <table class="mt-8"><tbody>
        ${thrown.slice(0, 8).map(r => `<tr>
          <td class="text-sm">&ldquo;${esc(String(r.value || "").slice(0, 60))}&rdquo;</td>
          <td class="text-sm">${esc(r.reason || "")}</td></tr>`).join("")}
      </tbody></table></div>` : ""}
  </div>`;
}

/* ── Keeping up with costs ──────────────────────────────────────────────── */
async function smeDrift(el) {
  el.innerHTML = spinner();
  const d = await api("/api/drift"); if (!d) return;
  if (!d.available) {
    el.innerHTML = pageTitle("Keeping up with costs")
      + emptyState("Not enough to go on", esc(d.reason || ""));
    return;
  }
  const isLive = (d.live || {}).is_live;
  const p = await getPresentation("drift_summary", { crossed_on: d.crossed_on });
  el.innerHTML = pageTitle("Keeping up with costs",
      "What happens to your cover if you change nothing.")
    + `<div class="grid-2 mb-16">
        <div>${renderAssessment(p?.pres, p?.mode)}</div>
        <div class="card"><div class="card-head"><h3>The figures we used</h3>${renderDataBadge(isLive)}</div>
          <p class="text-sm">${isLive ? esc(d.source_presentation || "") + " — real published monthly figures."
            : esc(d.index_name || "") + " — sample figures. Set PROVEN_LIVE_SOURCES=1 for the live index."}</p>
        </div>
      </div>
      <div class="insight ${d.crossed_on ? "critical" : ""} mb-16">
        <div class="insight-label">${d.crossed_on ? "Your cover has fallen behind" : "Still keeping up"}</div>
        <div class="insight-text">${esc(d.headline || "")}</div></div>
      <div class="card"><div class="card-head"><h3>Over time</h3></div>
        ${renderTrendChart(d.observations, parseFloat(d.threshold_pct))}
        <p class="text-xs text-muted mt-12">${esc(d.assumption || "")} ${esc(d.caveat || "")}</p></div>`;
}

/* ── If you claim tomorrow ─────────────────────────────────────────────────
 * The screen that changes behaviour. "Your cover is 66.7% adequate" is a statistic.
 * "You would pay S$238,300 yourself" is the same arithmetic and a different feeling. */
let _scenarioData = null;

async function smeScenario(el) {
  el.innerHTML = spinner("Working out what a claim would pay");
  const d = await api("/api/scenario/presets"); if (!d) return;
  _scenarioData = d;
  if (d.abstained) {
    el.innerHTML = pageTitle("If you claim tomorrow")
      + `<div class="insight warn"><div class="insight-label">We can't work this out yet</div>
          <div class="insight-text">${esc(d.message || "")}</div></div>
        <p class="text-sm text-muted mt-12">We would rather say we don't know than put a made-up number on a screen about your money. Send the missing document and this becomes real.</p>
        <button class="btn btn-primary mt-16" data-act="nav" data-arg="sme-gaps">See what's missing</button>`;
    return;
  }
  const scenarios = d.scenarios || [];
  el.innerHTML = pageTitle("If you claim tomorrow",
      "Pick a loss size. We'll show you exactly what your policy would pay, and what you'd cover yourself.")
    + `<div class="card mb-16"><div class="card-head"><h3>How big a loss?</h3></div>
        <div class="grid-3" id="scenario-picker">
          ${scenarios.map((s, i) => `<button class="btn ${i === scenarios.length - 1 ? "btn-primary" : "btn-secondary"}" data-act="pick-scenario" data-arg="${i}">
            ${esc({ small: "A small one", typical: "A serious one", total: "Lose everything" }[s.size] || titleCase(s.size))}
            <br><span class="text-xs">${money(s.loss_amount)}</span></button>`).join("")}
        </div></div>
      <div id="scenario-detail"></div>`;
  window.pickScenario(scenarios.length - 1);
}

window.pickScenario = async function (i) {
  const s = (_scenarioData?.scenarios || [])[i];
  const cont = $("#scenario-detail");
  if (!s || !cont) return;
  const r = s.result;
  $$("#scenario-picker .btn").forEach((b, idx) => {
    b.className = "btn " + (idx === i ? "btn-primary" : "btn-secondary");
  });
  cont.innerHTML = spinner();
  const p = await getPresentation("scenario_explanation", {
    loss: r.loss, owner_shortfall: r.owner_shortfall,
    final_illustration: r.final_illustration, peril: r.peril,
    sum_insured: r.sum_insured, value_at_risk: r.value_at_risk,
  });
  cont.innerHTML = `
    ${renderHero("You would pay this yourself", money(r.owner_shortfall),
      `on a ${money(r.loss)} ${r.peril} loss · your insurer would pay ${money(r.final_illustration)}`, "HIGH")}
    ${renderAssessment(p?.pres, p?.mode)}
    <div class="card mb-16"><div class="card-head"><h3>How we get to that number</h3></div>
      ${renderWaterfall(r.steps, "What you lose", r.loss)}
      <p class="text-xs text-muted mt-12">Every line comes from a document. Open one to see the exact words.</p>
    </div>
    <div class="card mb-16"><div class="card-head"><h3>The proof</h3></div>
      ${renderEvidenceStack((r.steps || []).map(st => st.provenance).filter(x => x && x.quote))}
    </div>
    <div class="insight warn"><div class="insight-label">Worth knowing</div>
      <div class="insight-text">${esc(r.disclaimer || "")}</div></div>`;
};

/* ── Will it actually pay? ─────────────────────────────────────────────── */
async function smeWillItPay(el) {
  el.innerHTML = spinner("Reading the promises in your policy");
  const d = await api("/api/warranty"); if (!d) return;
  if (!d.available) {
    el.innerHTML = pageTitle("Will it actually pay?")
      + emptyState("Not available", esc(d.reason || ""));
    return;
  }
  const c = d.counts || {};
  const live = (d.register || []).filter(e => e.state !== "NOT_IN_POLICY");
  const setAside = (d.register || []).filter(e => e.state === "NOT_IN_POLICY");
  const unmet = c.BREACHED || 0;
  const p = await getPresentation("warranty_overview", {
    counts: c, obligations_in_policy: d.obligations_in_policy,
    conditions_precedent_breached: d.conditions_precedent_breached,
  });

  el.innerHTML = pageTitle("Will it actually pay?",
      "Having cover and getting paid are two different things. Your policy contains promises you agreed to keep.")
    + renderHero(unmet ? "Promises not being kept" : "Promises we can't confirm",
        String(unmet || c.UNVERIFIED || 0),
        `out of ${d.obligations_in_policy || 0} we found in your policy`,
        unmet ? "HIGH" : c.UNVERIFIED ? "ELEVATED" : "LOW")
    + renderAssessment(p?.pres, p?.mode)
    + (d.conditions_precedent_breached > 0 ? `<div class="insight critical mb-16">
        <div class="insight-label">Why this one matters most</div>
        <div class="insight-text">${d.conditions_precedent_breached} of these is the strict kind of promise. If it slips, an insurer may be able to turn down a claim <strong>even if the slip had nothing to do with what went wrong</strong> — a lapsed alarm certificate can affect a fire claim.</div></div>` : "")
    + `<div class="card mb-16"><div class="card-head"><h3>Every promise we found</h3></div>
        ${renderObligationMap(live)}</div>`
    + `<div class="findings mb-16">${live.map(e => `<div class="finding" data-act="toggle-detail">
        <div class="finding-head"><div class="finding-title">${esc(e.title)}</div>
          <span class="tag tag-${e.state === "BREACHED" ? "danger" : e.state === "UNVERIFIED" ? "warning" : "success"}">${esc(_OB_WORDS[e.state] || e.state)}</span></div>
        <div class="finding-body">${esc(e.detail || "")}</div>
        <div class="finding-detail">
          <p class="text-sm"><strong>Why it's there:</strong> ${esc(e.why_it_matters || "")}</p>
          ${e.clause_quote ? `<div class="v-evidence mt-12"><div class="v-evidence__quote">"${esc(e.clause_quote)}"</div><div class="v-evidence__src">Your policy, page ${e.clause_page} — we searched for "${esc(e.matched_phrase || "")}"</div></div>` : ""}
          ${renderEvidenceStack(e.evidence)}
          ${e.state === "UNVERIFIED" ? `<div class="insight warn mt-12"><div class="insight-label">How to clear this</div><div class="insight-text">Send us ${(e.verified_by || []).map(v => esc(v.replace(/_/g, " ").toLowerCase())).join(" or ")}.</div></div>` : ""}
        </div></div>`).join("")}</div>`
    + `<div class="card mb-16"><div class="card-head"><h3>What we checked and decided against</h3><span class="tag">${setAside.length}</span></div>
        <p class="text-sm text-muted">We show you what we looked for and didn't find. Where a word turned up but didn't actually create a promise, here's the wording and why we let it go — so you can disagree with us.</p>
        <table class="mt-12"><tbody>
          ${setAside.map(e => `<tr><td>${esc(e.title)}</td><td class="text-xs text-muted">${(e.phrases_set_aside || []).length
            ? `found "${esc(e.phrases_set_aside[0].phrase)}" on page ${e.phrases_set_aside[0].page} — ${esc(e.phrases_set_aside[0].reason)}`
            : "not in your policy at all"}</td></tr>`).join("")}
        </tbody></table></div>`
    + `<div class="insight warn"><div class="insight-label">Worth knowing</div><div class="insight-text">${esc(d.disclaimer || "")}</div></div>`;
}

/* ── If you can't trade ────────────────────────────────────────────────── */
async function smeBI(el) {
  el.innerHTML = spinner("Checking your cover for lost income");
  const d = await api("/api/bi"); if (!d) return;
  if (!d.available) {
    el.innerHTML = pageTitle("If you can't trade") + emptyState("Not available", esc(d.reason || ""));
    return;
  }
  if (d.abstained) {
    el.innerHTML = pageTitle("If you can't trade")
      + `<div class="insight warn"><div class="insight-label">We can't tell yet</div>
          <div class="insight-text">${esc(d.message || "")}</div></div>
        <p class="text-sm text-muted mt-12">${esc(d.reason || "")}</p>`;
    return;
  }
  const months = (d.recovery_benchmark || {}).months;
  const none = d.cover_present === false;
  const p = await getPresentation("bi_overview", {
    cover_present: d.cover_present, recovery_months: months,
  });
  el.innerHTML = pageTitle("If you can't trade",
      "Your policy pays to replace what you lost. This is about the money you don't earn while you rebuild.")
    + renderHero("Cover for lost income", none ? "NONE" : "In place",
        none ? `and it could take about ${months} months to trade normally again` : "worth checking the amount still fits",
        none ? "HIGH" : "LOW")
    + renderAssessment(p?.pres, p?.mode)
    + (none ? `<div class="card mb-16"><div class="card-head"><h3>What that gap looks like</h3></div>
        ${renderFlowchart([
          { text: "Something serious happens", type: "start" },
          { text: "Your policy pays to rebuild and replace stock", type: "ok" },
          { text: `You can't trade for around ${months} months`, type: "warn" },
          { text: "None of that lost income is covered", type: "bad" },
        ])}</div>` : "")
    + (d.findings || []).map(f => `<div class="finding mb-12" data-act="toggle-detail">
        <div class="finding-head"><div class="finding-title">${esc(f.headline)}</div>
          <span class="tag tag-${f.severity === "HIGH" ? "danger" : f.severity === "MODERATE" ? "warning" : "success"}">${esc(titleCase(f.severity))}</span></div>
        <div class="finding-body">${esc(f.detail)}</div>
        <div class="finding-detail">
          ${renderEvidenceStack(f.operands)}
          ${f.basis === "DECLARED_ASSUMPTION" ? `<div class="insight warn mt-12"><div class="insight-label">This part is an estimate</div><div class="insight-text">${esc((d.recovery_benchmark || {}).rationale || "")} We use it to raise the question, never to work out an amount.</div></div>` : ""}
        </div></div>`).join("")
    + ((d.abstentions || []).length ? `<div class="card mb-16"><div class="card-head"><h3>What we won't guess at</h3><span class="tag">${d.abstentions.length}</span></div>
        ${d.abstentions.map(a => `<div class="insight mt-8"><div class="insight-label">${esc(a.question)}</div><div class="insight-text">${esc(a.reason)}</div>${(a.resolved_by || []).length ? `<div class="text-xs text-muted mt-8">Send us: ${a.resolved_by.map(r => esc(r.replace(/_/g, " ").toLowerCase())).join(", ")}</div>` : ""}</div>`).join("")}
      </div>` : "")
    + `<div class="card mb-16"><div class="card-head"><h3>Why we look at this at all</h3></div>
        ${((d.evidence_base || {}).citations || []).map(ct => `<div class="v-evidence"><div class="v-evidence__quote">${esc(ct.finding)}</div><div class="v-evidence__src">${esc(ct.source)}</div></div>`).join("")}</div>
      <div class="insight warn"><div class="insight-label">Worth knowing</div><div class="insight-text">${esc(d.disclaimer || "")}</div></div>`;
}

/* ── What changed this year ────────────────────────────────────────────── */
async function smeRenewal(el) {
  el.innerHTML = spinner("Comparing this year's policy with last year's");
  const d = await api("/api/renewal/compare"); if (!d) return;
  if (!d.available) {
    el.innerHTML = pageTitle("What changed this year") + emptyState("Nothing to compare", esc(d.reason || ""));
    return;
  }
  const changes = d.changes || [];
  const material = changes.filter(c => c.materiality === "MATERIAL");
  const admin = changes.filter(c => c.materiality !== "MATERIAL");
  const p = await getPresentation("renewal_summary", {
    material_count: material.length, change_count: changes.length,
  });
  el.innerHTML = pageTitle("What changed this year",
      "A policy can renew at the same price with less inside it. Here's the comparison.")
    + renderHero("Changes that actually matter", String(material.length),
        `out of ${changes.length} difference${changes.length === 1 ? "" : "s"} we found`,
        material.length ? "HIGH" : "LOW")
    + renderAssessment(p?.pres, p?.mode)
    + (material.length ? `<h3 class="mb-8">Read these before you renew</h3>
        ${material.map(c => `<div class="card mb-12" style="border-left:4px solid var(--danger,#c5221f)">
          <div class="card-head"><h3>${esc(c.label || "")}</h3><span class="tag tag-danger">Matters</span></div>
          <p class="text-sm">${esc(c.materiality_reason || "")}</p>
          <div class="grid-2 mt-12">
            <div><div class="text-xs text-muted mb-8">Last year</div>
              ${c.prior_quote ? `<div class="v-evidence"><div class="v-evidence__quote">"${esc(c.prior_quote)}"</div><div class="v-evidence__src">page ${c.prior_page ?? "—"}</div></div>` : '<p class="text-sm text-muted">Wasn\'t there</p>'}</div>
            <div><div class="text-xs text-muted mb-8">This year</div>
              ${c.current_quote ? `<div class="v-evidence"><div class="v-evidence__quote">"${esc(c.current_quote)}"</div><div class="v-evidence__src">page ${c.current_page ?? "—"}</div></div>` : '<p class="text-sm text-muted">Gone</p>'}</div>
          </div></div>`).join("")}` : "")
    + (admin.length ? `<div class="card"><div class="card-head"><h3>Just admin</h3><span class="tag">${admin.length}</span></div>
        <ul class="text-sm">${admin.map(c => `<li>${esc(c.label || "")}</li>`).join("")}</ul></div>` : "")
    + `<p class="text-xs text-muted mt-16">${esc(d.notice || "")}</p>`;
}

/* ── What we checked ──────────────────────────────────────────────────── */
async function smeAgents(el) {
  el.innerHTML = spinner();
  const d = await api("/api/agents/activity"); if (!d) return;
  const rows = d.activity || [];
  el.innerHTML = pageTitle("What we checked",
      "Veris looks on its own schedule. You don't have to remember to ask.")
    + `<div class="stats mb-16">
        <div class="stat"><div class="val">${d.count || 0}</div><div class="lbl">Checks run</div></div>
        <div class="stat"><div class="val">${rows.filter(r => r.is_live).length}</div><div class="lbl">Using live data</div></div>
        <div class="stat amber"><div class="val">${d.total_rejected || 0}</div><div class="lbl">Claims we threw away</div></div>
      </div>
      <div class="insight mb-16"><div class="insight-label">Why that last number matters</div>
        <div class="insight-text">When something we read can't be found word-for-word in the source, we discard it rather than show it to you. Anyone can list findings. This is the count of things we refused to say.</div></div>
      <div class="findings">${rows.map(r => `<div class="finding" data-act="toggle-detail">
        <div class="finding-head"><div class="finding-title">${esc(titleCase(r.agent))} · ${esc(r.result || r.summary || "")}</div>${renderDataBadge(r.is_live)}</div>
        <div class="finding-body">${esc(r.planned_check || "")}</div>
        <div class="finding-meta">
          <span class="text-xs text-muted">${esc(String(r.timestamp || "").replace("T", " ").slice(0, 19))}</span>
          <span class="tag">${r.facts_extracted ?? 0} found</span>
          <span class="tag tag-success">${r.facts_grounded ?? 0} proven</span>
          ${r.facts_rejected ? `<span class="tag tag-danger">${r.facts_rejected} discarded</span>` : ""}
        </div>
        <div class="finding-detail">
          <table class="mt-8"><thead><tr><th>Address called</th><th>Result</th></tr></thead><tbody>
            ${(r.calls || []).map(c => `<tr><td class="text-xs" style="font-family:var(--mono);word-break:break-all">${esc(c.url || "")}</td><td>${esc(c.status || "")}</td></tr>`).join("") || '<tr><td colspan="2" class="text-xs text-muted">no outside calls on this run</td></tr>'}
          </tbody></table></div>
      </div>`).join("")}</div>
      <p class="text-xs text-muted mt-16">${esc(d.notice || "")}</p>`;
}

/* ── Share with adviser ─────────────────────────────────────────────────
 *
 * The checkboxes name DOCUMENTS, and that is a correctness requirement rather than a
 * wording preference. The consent gate resolves each finding to the documents it rests on
 * and compares those against the granted list, so a grant of "findings" / "facts" /
 * "score" — which is what this screen used to post — matched no document and withheld
 * everything. The owner saw "Shared", the adviser saw an empty case, and nothing reported
 * a problem. The list now comes from `/api/consent/status.shareable`, which is derived
 * from the documents actually ingested.
 */
async function smeConsent(el) {
  el.innerHTML = spinner();
  const st = await api("/api/consent/status"); if (!st) return;
  const shareable = st.shareable || [];
  const recipient = st.adviser_recipient || "Licensed adviser";

  el.innerHTML = pageTitle("Share with your adviser",
      "Nothing leaves this workspace unless you send it. You choose what, and to whom.")
    + `<div class="card mb-16">
        <div class="card-head"><h3>${st.granted ? "You are sharing" : "Not sharing anything yet"}</h3>
          <span class="tag tag-${st.granted ? "success" : ""}">${st.granted ? "Shared" : "Private"}</span></div>
        ${st.granted ? `<p class="text-sm">Your adviser can see what you granted below. You can stop this at any time.</p>
          <ul class="text-sm mt-8">${(st.disclosures || []).map(x => `<li><b>${esc(x.recipient || "")}</b> — ${(x.fields || []).map(f => `<span class="tag">${esc(titleCase(f))}</span>`).join(" ") || "nothing"}</li>`).join("")}</ul>
          <div class="btn-group mt-16">
            <button class="btn btn-secondary" id="crevoke">Stop sharing</button>
            <button class="btn btn-ghost" id="cedit">Change what they can see</button>
          </div>`
        : shareable.length
          ? `<p class="text-sm mb-12">Tick the documents your adviser may read. They will only see a finding if they were given every document it rests on — anything held back is counted for them, so they can ask, but they cannot read it.</p>
            <div class="form-group"><label>Who should see it</label>
              <input type="text" id="crecip" value="${esc(recipient)}" maxlength="120"></div>
            <div class="form-group"><label>Which documents they can read</label>
              <div class="consent-list">
                ${shareable.map(k => `<label class="consent-row">
                  <input type="checkbox" class="cf" value="${esc(k.kind)}" checked>
                  <span class="consent-row__l">${esc(k.label)}
                    <span class="consent-row__m">${(k.filenames || []).map(f => esc(f)).join(", ") || `${esc(k.count)} document(s)`}</span>
                  </span></label>`).join("")}
              </div>
              <div class="btn-group mt-8">
                <button type="button" class="btn btn-ghost btn-sm" id="call">Select all</button>
                <button type="button" class="btn btn-ghost btn-sm" id="cnone">Select none</button>
              </div></div>
            <button class="btn btn-primary mt-16" id="cgrant">Share with adviser</button>`
          : `<div class="insight warn"><div class="insight-label">Nothing to share yet</div>
              <div class="insight-text">We have not read any documents for this business, so there is nothing an adviser could be given.</div>
              <div class="insight-action"><button class="btn btn-sm btn-primary" data-act="open" data-arg="sme-docs-hub|docs|add">Add documents →</button></div></div>`}
        <div id="cresult"></div>
      </div>
      <div class="card"><div class="card-head"><h3>Why this is a button and not a setting</h3></div>
        <p class="text-sm text-muted">Permission you can't take back isn't permission. Stopping sharing removes their access immediately.</p>
        <p class="text-xs text-muted mt-8">${esc(st.notice || "")}</p></div>`;

  const grant = $("#cgrant");
  if (grant) grant.onclick = async () => {
    const to = $("#crecip").value.trim() || recipient;
    const fields = $$(".cf").filter(c => c.checked).map(c => c.value);
    if (!fields.length) {
      $("#cresult").innerHTML = `<div class="insight warn mt-12"><div class="insight-text">Choose at least one document. Sharing nothing is what "Private" already means.</div></div>`;
      return;
    }
    try {
      await api("/api/consent", { method: "POST", body: { recipient: to, fields } });
      toast("Shared with " + to);
      nav8("sme-consent");
    } catch (err) {
      $("#cresult").innerHTML = `<div class="insight critical mt-12"><div class="insight-text">${esc(err.message)}</div></div>`;
    }
  };
  const all = $("#call");
  if (all) all.onclick = () => $$(".cf").forEach(c => { c.checked = true; });
  const none = $("#cnone");
  if (none) none.onclick = () => $$(".cf").forEach(c => { c.checked = false; });
  const revoke = $("#crevoke");
  if (revoke) revoke.onclick = async () => {
    await api("/api/consent/revoke", { method: "POST", body: {} });
    toast("Sharing stopped");
    nav8("sme-consent");
  };
  // Changing the grant is revoke-then-regrant rather than an edit, because the disclosure
  // row is the audit record of what was released and when. Mutating it in place would
  // rewrite history; revoking writes a REVOKE row and the new grant writes its own.
  const edit = $("#cedit");
  if (edit) edit.onclick = async () => {
    await api("/api/consent/revoke", { method: "POST", body: {} });
    nav8("sme-consent");
  };
}

/* ── Your record ─────────────────────────────────────────────────────── */
async function smeRecord(el) {
  el.innerHTML = spinner();
  const d = await api("/api/record"); if (!d) return;
  el.innerHTML = pageTitle("Your record",
      "The facts we established, in order, each one sealed so it can't be edited later.")
    + `<div class="card mb-16"><div class="card-head"><h3>${(d.facts || []).length} established facts</h3></div>
        <table><thead><tr><th>What</th><th>Value</th><th>Where it came from</th></tr></thead><tbody>
          ${(d.facts || []).map(f => `<tr><td>${esc(titleCase(f.attribute || ""))}</td>
            <td style="font-weight:600">${esc(String(f.value || ""))}${f.unit ? " " + esc(f.unit) : ""}</td>
            <td class="text-xs text-muted">${esc(titleCase(f.author_class || ""))}</td></tr>`).join("")}
        </tbody></table></div>
      <div class="grid-2 mb-16">
        <button class="btn btn-secondary" data-act="export-record">Download my record</button>
        <button class="btn btn-ghost" data-act="delete-case">Delete everything</button>
      </div>
      <div class="card"><div class="card-head"><h3>What "sealed" means</h3></div>
        <p class="text-sm text-muted">Each fact carries a fingerprint of the one before it. If anything were changed after the fact, the chain wouldn't line up — and anyone can check that, including you, using the downloaded file.</p></div>`;
}

window.exportRecord = async function () {
  const doc = await api("/api/record/export");
  const v = await api("/api/record/verify", { method: "POST", body: doc });
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "veris-record.json";
  a.click();
  URL.revokeObjectURL(a.href);
  alert(v && v.valid
    ? "Downloaded. We checked the chain and it lines up."
    : "Downloaded.");
};

window.deleteCase = async function () {
  sessionStorage.removeItem(EXAMPLE_FLAG);
  if (!confirm("Delete everything we found? Your downloaded record still works. This can't be undone.")) return;
  await api("/api/case", { method: "DELETE" });
  nav8("sme-home");
};

/* ══════════════════════════════════════════════════════════════════════════
   EXPOSURE SURFACES

   Five screens for the five things the problem statement actually says: that owners
   don't know what they don't know; that cyber, supply chain and asset gaps go
   unnoticed; that nobody finds out until a claim is denied; that gaps compound as the
   business grows; and that the answer has to fit the stage the business is at.

   These share one rule that the rest of the product does not need. Their subject is an
   ABSENCE, and an absence has three states rather than two: covered, nothing responds,
   and we could not tell. The third must never be drawn like the second. Colouring an
   unknown red would be the visual form of the claim the backend refuses to make, and it
   would also destroy the thing that makes the other two believable.
   ══════════════════════════════════════════════════════════════════════════ */

/* Shared: map a backend verdict to the knowledge palette in styles.css. One function so
 * a state cannot mean one colour on the cyber screen and another on dependencies. */
function kClass(verdict) {
  return ({
    ASSESSED: "is-assessed", PARTIAL: "is-partial", NOT_ASSESSED: "is-unknown",
    NOTHING: "is-gap", UNKNOWN: "is-unknown", REVIEW: "is-partial",
  })[verdict] || "is-unknown";
}

function evidenceBadge(cls) {
  const key = String(cls || "").toUpperCase();
  const mod = key === "PROVEN" ? "" : key === "DECLARED" ? "declared"
    : key === "MARKET_CONVENTION" ? "convention" : "unestablished";
  const label = key === "MARKET_CONVENTION" ? "Market convention" : titleCase(key);
  return `<span class="ev-badge ${mod}">${esc(label || "Unestablished")}</span>`;
}

/* ── What we did not check ────────────────────────────────────────────────
 *
 * The opening screen, and the argument for the whole product. It reports the boundary of
 * its own assessment: how many risk areas exist, how many we can speak to, and what the
 * score leaves out. Every other dashboard shows what it found; the gap between "we found
 * nothing" and "we could not look" is where an SME's real exposure lives, and it renders
 * identically everywhere else as an absence of red.
 */
async function smeBlindSpots(el) {
  el.innerHTML = spinner("Working out what we could not check");
  const d = await api("/api/blindspots"); if (!d) return;
  if (d.available === false && d.deleted) {
    el.innerHTML = pageTitle("What we haven't checked") + emptyState(
      "Nothing to report", esc(d.reason));
    return;
  }

  const cov = d.coverage || {};
  const segs = (d.areas || []).map(a =>
    `<div class="cov__seg ${a.state === "ASSESSED" ? "on" : a.state === "PARTIAL" ? "part" : ""}"></div>`
  ).join("");

  const areas = (d.areas || []).map(a => `
    <div class="area k-state ${kClass(a.state)}">
      <div class="area__head">
        <div class="area__name">${esc(a.label)}</div>
        <span class="area__pill">${esc(a.state_label)}</span>
      </div>
      <div class="area__plain">${esc(a.plain)}</div>
      ${a.checked && a.checked.length ? `<div class="area__meta">
        <b>We checked</b>
        <ul class="area__list">${a.checked.slice(0, 3).map(c => `<li>${esc(c)}</li>`).join("")}</ul>
      </div>` : ""}
      ${a.could_not_check && a.could_not_check.length ? `<div class="area__meta">
        <b>We could not check</b>
        <ul class="area__list">${a.could_not_check.slice(0, 3).map(c => `<li>${esc(c)}</li>`).join("")}</ul>
      </div>` : ""}
    </div>`).join("");

  const silent = (d.silent_gaps || []).map(g => `
    <div class="silent">
      <div class="silent__q">${esc(g.what_we_could_not_check)}</div>
      <div class="silent__why">${esc(g.why_quiet_is_not_safe)}</div>
      <div class="silent__fix"><b>${esc(g.resolved_by)}</b> would establish ${esc(g.resolving_establishes)}</div>
    </div>`).join("");

  const caveat = d.score_caveat || {};
  el.innerHTML = pageTitle("What we haven't checked",
    "The most useful screen we can give you, because it is the one every other dashboard leaves out.")
    + `<div class="cov mb-16">
      <div class="cov__top">
        <div>
          <div class="cov__label">Areas we can speak to</div>
          <div class="cov__fig">${cov.areas_we_can_speak_to ?? "—"}<small> of ${cov.areas_total ?? "—"}</small></div>
        </div>
        <div><div class="cov__label">What that means</div>
          <div class="cov__say">${esc(cov.statement || "")}</div></div>
      </div>
      <div class="cov__track">${segs}</div>
      <div class="cov__legend">
        <span><i style="background:var(--success)"></i>Checked</span>
        <span><i style="background:var(--warning)"></i>Partly checked</span>
        <span><i style="background:var(--border)"></i>Not checked</span>
      </div>
      ${caveat.applies ? `<div class="caveat">
        <div class="caveat__t">About your score</div>
        <p>${esc(caveat.statement)}</p>
        ${caveat.why_not_zero ? `<p>${esc(caveat.why_not_zero)}</p>` : ""}
      </div>` : ""}
    </div>
    <div class="sub-head">Every area of your protection</div>
    <div class="areas mb-24">${areas}</div>
    ${silent ? `<div class="sub-head">Where quiet does not mean safe</div>${silent}` : ""}
    <div class="honest"><b>Why this screen exists.</b> ${esc(d.why_this_screen_exists || "")}
      <br><br>${esc(d.notice || "")}</div>`;
}

/* ── Cyber and data ───────────────────────────────────────────────────────
 *
 * The screen the problem statement asks for first, and the one with the strongest
 * evidence in the product: the carrier's own exclusion, quoted verbatim at a page
 * number. Nothing here is predictive — no breach probability, no estimated penalty, no
 * network scan — because none of that can be evidenced from a document.
 */
async function smeCyber(el) {
  el.innerHTML = spinner("Reading what your policy says about data");
  const d = await api("/api/cyber"); if (!d) return;

  if (d.available === false) {
    el.innerHTML = pageTitle("Cyber and data") + emptyState(
      "We are not going to guess", esc(d.reason),
      `<button class="btn btn-primary" data-act="nav" data-arg="sme-upload">Add documents</button>`);
    return;
  }

  const holdings = (d.holdings || []).map(h => `
    <div class="dep">
      <div class="dep__head">
        <span class="dep__kind">${esc(h.subject)}</span>
        ${evidenceBadge(h.evidence_class)}
        <span class="text-xs text-muted">${esc(h.document_kind)}</span>
      </div>
      <div class="dep__why">${esc(h.basis)}</div>
      ${h.quote ? `<div class="quote-src">${esc(h.quote)}</div>` : ""}
    </div>`).join("");

  const heads = (d.cost_heads || []).map(c => {
    const gap = c.responds === "NOTHING";
    return `<div class="head k-state ${kClass(c.responds)} ${gap ? "is-gap" : ""} ${c.responds === "UNKNOWN" ? "is-unknown" : ""}">
      <div>
        <div class="head__n">${esc(c.head)}</div>
        <div class="head__p">${esc(c.plain)}</div>
        <div class="head__w">${esc(c.why)}</div>
      </div>
      <span class="head__r">${gap ? "Nothing responds" : c.responds === "UNKNOWN" ? "Can't tell" : c.responds === "REVIEW" ? "Needs a review" : titleCase(c.responds)}</span>
    </div>`;
  }).join("");

  const st = d.statutory || {};
  const ex = d.exclusion;

  el.innerHTML = pageTitle("Cyber and data",
    "You hold personal data. This is what your policy says about losing it.")
    + `<div class="big ${d.gap_open ? "is-gap" : ""}">
      <div class="big__l">Your position</div>
      <div class="big__v">${esc(d.cover_label)}</div>
      <div class="big__s">${d.gap_open
        ? `Of the ${(d.cost_heads || []).length} bills a data breach creates, <b>${d.uncovered_count}</b> have nothing in your policy that responds.`
        : "A cyber section is on your schedule. What it covers still needs reading with your adviser."}</div>
    </div>

    ${ex ? `<div class="sub-head">Your insurer's own words</div>
      <div class="verbatim mb-16">
        <div class="verbatim__tag"><i></i>Verbatim from your policy — nothing paraphrased</div>
        <div class="verbatim__q">${esc(ex.quote)}</div>
        <div class="verbatim__src">
          <span><b>Document</b> ${esc(titleCase(ex.document_kind || ""))}</span>
          <span><b>Page</b> ${esc(ex.page_no)}</span>
          <span><b>Written by</b> ${esc(titleCase(ex.author_class || ""))}</span>
          <span><b>Evidence</b> ${esc(ex.evidence_class)}</span>
        </div>
        <div class="verbatim__so">${esc(ex.why_it_matters)}</div>
      </div>` : ""}

    <div class="sub-head">Why the law applies to you</div>
    ${holdings}

    <div class="sub-head">What a breach costs, and what responds</div>
    <div class="heads mb-24">${heads}</div>

    <div class="sub-head">What the law requires</div>
    <div class="card mb-16">
      <div class="card-head"><h3>${esc(st.regime || "")}</h3></div>
      <p class="text-sm mb-12">${esc(st.notification_duty || "")}</p>
      <div class="stats mb-12">
        <div class="stat"><div class="val">${money(st.penalty_ceiling_sgd)}</div>
          <div class="lbl">Statutory maximum penalty</div>
          <div class="sub">Not a prediction</div></div>
        <div class="stat"><div class="val">${esc(st.notifiable_scale)}</div>
          <div class="lbl">People affected before a breach must be reported</div></div>
      </div>
      <p class="text-xs text-muted">${esc(st.penalty_ceiling_basis || "")}</p>
      <div class="caveat"><div class="caveat__t">Read this before you read the figure</div>
        <p>${esc(st.not_a_prediction || "")}</p>
        <p>${esc(st.which_branch_applies || "")}</p></div>
      <p class="quote-src mt-12">${esc(st.authority || "")}</p>
    </div>
    <div class="honest">${esc(d.notice || "")}</div>`;
}

/* ── Who you depend on ────────────────────────────────────────────────────
 *
 * The screen that has to argue against itself. Every dependency shown was read from a
 * document, so the map is real — and it can never be complete, because the dependencies
 * that matter most never appear in a document. The partial-map notice is therefore given
 * as much visual weight as the findings, not tucked into a footnote.
 */
async function smeDependencies(el) {
  el.innerHTML = spinner("Mapping what your income depends on");
  const d = await api("/api/supply-chain"); if (!d) return;

  const vis = d.visibility || {};
  const partialBlock = `<div class="partial">
      <div class="partial__t">This map is not complete, and that is the point</div>
      <div class="partial__s">${esc(vis.statement || "")}<br><br>${esc(vis.why_it_matters || "")}</div>
      ${(vis.what_would_complete_it || []).length ? `<div class="partial__grid">
        ${(vis.what_would_complete_it || []).map(i =>
          `<div class="partial__i"><b>${esc(i.document)}</b><span>${esc(i.establishes)}</span></div>`).join("")}
      </div>` : ""}
    </div>`;

  if (d.available === false) {
    el.innerHTML = pageTitle("Who you depend on") + emptyState(
      "Nothing established yet", esc(d.reason),
      `<button class="btn btn-primary" data-act="nav" data-arg="sme-upload">Add documents</button>`)
      + `<div class="mt-16">${partialBlock}</div>`;
    return;
  }

  const byDep = {};
  (d.exposure_matrix || []).forEach(e => {
    (byDep[e.dependency] = byDep[e.dependency] || []).push(e);
  });

  const deps = (d.dependencies || []).map(dep => `
    <div class="dep">
      <div class="dep__head">
        <span class="dep__kind">${esc(titleCase(dep.kind))}</span>
        <span class="dep__name">${esc(dep.name)}</span>
        ${evidenceBadge(dep.evidence_class)}
      </div>
      <div class="dep__why">${esc(dep.why)}</div>
      ${dep.quote ? `<div class="quote-src">${esc(dep.quote)}</div>` : ""}
      <div class="dep__modes">
        ${(byDep[dep.name] || []).map(e => `
          <div class="dep__mode ${e.responds === "NOTHING" ? "is-gap" : ""}">
            <span>${esc(e.mode_label)}</span>
            <b>${e.responds === "NOTHING" ? "Nothing responds" : e.responds === "UNKNOWN" ? "Can't tell" : "Needs a review"}</b>
          </div>`).join("")}
      </div>
    </div>`).join("");

  const how = d.how_cbi_works || {};
  el.innerHTML = pageTitle("Who you depend on",
    "Your policy draws a line around your address. Your income does not.")
    + `<div class="big ${d.gap_open ? "is-gap" : ""}">
      <div class="big__l">Supplier and dependency cover</div>
      <div class="big__v">${esc(d.cbi_label)}</div>
      <div class="big__s">We found <b>${(d.counts || {}).dependencies}</b> things outside your business that your income relies on, and
        <b>${(d.counts || {}).uncovered_paths}</b> of the ${(d.counts || {}).failure_paths} ways they could fail have nothing in your policy that responds.</div>
    </div>
    <div class="sub-head">What you depend on</div>
    ${deps}
    <div class="sub-head">How this cover normally works</div>
    <div class="card mb-16">
      <div class="card-head"><h3>Three things worth knowing</h3>${evidenceBadge(how.basis_class)}</div>
      <p class="text-sm mb-8"><b>It is an extension, not a policy.</b> ${esc(how.structure || "")}</p>
      <p class="text-sm mb-8"><b>Suppliers are usually named.</b> ${esc(how.named_basis || "")}</p>
      <p class="text-sm mb-12"><b>It usually needs physical damage.</b> ${esc(how.physical_damage_basis || "")}</p>
      <div class="caveat"><div class="caveat__t">What this is based on</div>
        <p>${esc(how.basis_caveat || "")}</p></div>
    </div>
    ${(d.concentrations || []).length ? `<div class="sub-head">Where you are concentrated</div>
      <p class="tab-lead">A supplier register tells you who you have a contract with. It does
        not tell you who that supplier cannot function without. These are the concentrations
        your own documents evidence.</p>
      ${(d.concentrations || []).map(c => `<div class="dep">
        <div class="dep__head">
          <span class="dep__kind">${esc(titleCase(c.kind))}</span>
          <span class="dep__name">${esc(c.subject)}</span>
          ${evidenceBadge(c.evidence_class)}
        </div>
        <div class="dep__why">${esc(c.reading)}</div>
        <div class="ev__fix mt-12"><b>Why it bites:</b> ${esc(c.why_it_bites)}</div>
      </div>`).join("")}` : ""}

    ${d.sub_tier ? `<div class="sub-head">What we cannot see, and will not guess</div>
      <div class="partial mb-16">
        <div class="partial__t">${esc(d.sub_tier.statement)}</div>
        <div class="partial__s">${esc(d.sub_tier.why_we_do_not_estimate_it)}</div>
        <div class="partial__grid">
          <div class="partial__i"><b>What would reveal it</b>
            <span>${esc(d.sub_tier.what_would_reveal_it)}</span></div>
        </div>
      </div>` : ""}

    <div class="sub-head">The limits of this map</div>
    ${partialBlock}
    <div class="honest">${esc(d.notice || "")}</div>`;
}

/* ── Protection for your stage ────────────────────────────────────────────
 *
 * The only screen that names a protection the owner does NOT hold, which makes it the
 * only one that can shade into selling. The whole design rests on one distinction being
 * impossible to miss: STATUTORY is law, MARKET_CONVENTION is a habit. They get different
 * badges, separate counts, and a caveat that says a convention is a question worth
 * answering rather than a failure.
 */
async function smeRoadmap(el) {
  el.innerHTML = spinner("Working out what stage your business is at");
  const d = await api("/api/stages"); if (!d) return;

  if (d.available === false) {
    el.innerHTML = pageTitle("Protection for your stage") + emptyState(
      "We could not place your business", esc(d.reason),
      `<button class="btn btn-primary" data-act="nav" data-arg="sme-upload">Add documents</button>`);
    return;
  }

  const here = (d.stage || {}).ordinal ?? -1;
  const ladder = (d.ladder || []).map(s => {
    const cls = s.ordinal === here ? "here" : s.ordinal < here ? "done" : "";
    return `<div class="rung ${cls}">
      ${s.ordinal === here ? `<span class="rung__you">You are here</span>` : ""}
      <div class="rung__n">Stage ${s.ordinal + 1}</div>
      <div class="rung__l">${esc(s.label)}</div>
      <div class="rung__d">${esc(s.describes)}</div>
    </div>`;
  }).join("");

  const heldSet = new Set(d.held || []);
  const absentSet = new Set(d.absent || []);
  const order = e => heldSet.has(e.protection) ? 2 : absentSet.has(e.protection) ? 0 : 1;
  const expectations = [...(d.expectations || [])].sort((a, b) => order(a) - order(b));

  const prot = expectations.map(e => {
    const held = heldSet.has(e.protection);
    const absent = absentSet.has(e.protection);
    const state = held ? "ASSESSED" : absent ? "NOTHING" : "UNKNOWN";
    const mark = held ? "✓" : absent ? "✕" : "?";
    return `<div class="pro k-state ${kClass(state)} ${absent ? "is-gap" : ""}">
      <div class="pro__mark">${mark}</div>
      <div>
        <div class="pro__l">${esc(e.label)}</div>
        <div class="pro__p">${esc(e.plain)}</div>
        <div class="pro__b">${held ? "<b>On your schedule.</b> " : absent ? "<b>Not on your schedule.</b> " : "<b>Your schedule cannot tell us either way.</b> "}${esc(e.because)}</div>
        ${e.authority ? `<div class="quote-src">${esc(e.authority)}</div>` : ""}
      </div>
      <span class="pro__basis ${e.basis === "STATUTORY" ? "law" : "conv"}">${e.basis === "STATUTORY" ? "Law" : "Common"}</span>
    </div>`;
  }).join("");

  const evidence = (d.evidence || []).map(v => `
    <div class="stat"><div class="val">${esc(v.value)}</div>
      <div class="lbl">${esc(v.signal)}</div>
      <div class="sub">${esc(v.source || "")}</div></div>`).join("");

  const counts = d.counts || {};
  el.innerHTML = pageTitle("Protection for your stage",
    "Read from your documents, not from a questionnaire you filled in.")
    + `<div class="ladder">${ladder}</div>
    <div class="big">
      <div class="big__l">Where you are</div>
      <div class="big__v">${esc((d.stage || {}).label || "")}</div>
      <div class="big__s">${esc((d.stage || {}).describes || "")}
        ${d.next_stage ? ` Next comes <b>${esc(d.next_stage.label)}</b> — ${esc(d.next_stage.describes)}` : ""}</div>
    </div>
    <div class="sub-head">What put you here</div>
    <div class="stats mb-24">${evidence}</div>
    <div class="sub-head">What businesses at your stage usually hold</div>
    <div class="stats mb-16">
      <div class="stat green"><div class="val">${counts.held ?? 0}</div><div class="lbl">You hold</div></div>
      <div class="stat red"><div class="val">${counts.absent ?? 0}</div><div class="lbl">Not on your schedule</div></div>
      <div class="stat"><div class="val">${counts.indeterminate ?? 0}</div><div class="lbl">We can't tell</div></div>
    </div>
    <div class="prot mb-16">${prot}</div>
    <div class="caveat"><div class="caveat__t">Law versus habit — the difference matters</div>
      <p>${esc(d.basis_notice || "")}</p></div>
    <div class="honest">${esc(d.notice || "")}</div>`;
}

/* ── How this crept up ────────────────────────────────────────────────────
 *
 * The compounding screen. Reports DAYS, never dollars: exposure crystallises on loss
 * rather than accruing daily, so a running cost would be fabricated, while a day count
 * is the distance between two dates in the owner's own documents.
 *
 * It also shows the change they DID act on. A timeline of nothing but failures reads as a
 * sales pitch; crediting the one they closed is what makes the rest credible.
 */
async function smeCompounding(el) {
  el.innerHTML = spinner("Lining up what changed, and when");
  const d = await api("/api/compounding"); if (!d) return;

  if (d.available === false) {
    el.innerHTML = pageTitle("How this crept up") + emptyState(
      "No timeline yet", esc(d.reason));
    return;
  }

  const period = S.timePeriod || "all";
  const shown = (d.timeline || []).filter(c => timelineWithin(period, c.on, d.as_at));
  const hidden = (d.timeline || []).length - shown.length;

  const timeline = shown.map(c => {
    const cls = c.kind === "POLICY_CHANGE" ? "policy"
      : c.status === "CLOSED" ? "closed" : "open";
    return `<div class="ev ${cls}">
      <div class="ev__dot"></div>
      <div class="ev__when">${esc(c.on)}</div>
      <div class="ev__l">${esc(c.label)}</div>
      <div class="ev__d">${esc(c.detail)}</div>
      <div class="ev__tags">
        <span class="ev__tag ${cls}">${esc(c.status_label)}</span>
        ${evidenceBadge(c.evidence_class)}
        ${c.status === "OPEN" && c.days_open != null
          ? `<span class="ev__days">${c.days_open} days open</span>` : ""}
        ${c.status === "CLOSED" && c.days_open != null
          ? `<span class="text-xs text-muted">closed in ${c.days_open} day(s) by ${esc(c.closed_by || "")}</span>` : ""}
      </div>
      ${c.what_would_close_it ? `<div class="ev__fix"><b>What would close it:</b> ${esc(c.what_would_close_it)}</div>` : ""}
    </div>`;
  }).join("");

  const counts = d.counts || {};
  el.innerHTML = pageTitle("How this crept up",
    "Nothing here went wrong all at once. That is what makes it hard to notice.")
    + `<div class="big ${counts.open ? "is-gap" : ""}">
      <div class="big__l">The pattern</div>
      <div class="big__v">${counts.closed} of ${counts.business_changes} changes followed through</div>
      <div class="big__s">${esc(d.compounding_statement || "")}</div>
    </div>
    <div class="stats mb-24">
      <div class="stat"><div class="val">${counts.business_changes ?? 0}</div><div class="lbl">Changes in your business</div></div>
      <div class="stat green"><div class="val">${counts.closed ?? 0}</div><div class="lbl">Followed by a policy update</div></div>
      <div class="stat red"><div class="val">${counts.open ?? 0}</div><div class="lbl">Still open</div></div>
      <div class="stat amber"><div class="val">${d.longest_open_days ?? 0}</div><div class="lbl">Days the oldest has been open</div></div>
    </div>
    <div class="sub-head">Your timeline</div>
    <div class="btn-group mb-16">
      ${TIME_PERIODS.map(p => `<button class="btn btn-sm ${
        p.id === period ? "btn-primary" : "btn-secondary"}"
        data-act="tl-period" data-arg="${p.id}">${esc(p.label)}</button>`).join("")}
    </div>
    ${hidden ? `<p class="text-xs text-muted mb-12">${hidden} earlier entr${hidden === 1 ? "y" : "ies"} hidden by this filter.
      "This year" means the twelve months before ${esc(d.as_at)} — the latest date your
      documents evidence, not today, so this reads the same every time.</p>` : ""}
    <div class="tl2 mb-24">${timeline}</div>
    <div class="card mb-16">
      <div class="card-head"><h3>Why we count days and not dollars</h3></div>
      <p class="text-sm">${esc(d.why_days_not_dollars || "")}</p>
    </div>
    <div class="caveat"><div class="caveat__t">There may be nothing wrong here</div>
      <p>${esc(d.not_an_adjudication || "")}</p>
      <ul class="area__list">${(d.innocent_explanations || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    </div>
    <p class="text-xs text-muted mt-12">Dated as at ${esc(d.as_at)}. ${esc(d.as_at_basis || "")}</p>`;
}

/* ── Gap snapshot ─────────────────────────────────────────────────────────
 *
 * The screen that had to resist one specific temptation: counting everything unresolved as
 * a gap and putting one big red number at the top. That is a better demo and a dishonest
 * product, so the three categories are rendered as three genuinely different things —
 * evidenced, unconfirmed, unexamined — and the third is grey.
 *
 * Status never rides on colour alone. Every row carries an icon and a written label as well,
 * because a colour-only status is unreadable to a colour-blind viewer and vanishes in the
 * screenshot somebody pastes into an email.
 */
async function smeGapSnapshot(el) {
  el.innerHTML = spinner("Pulling everything together");
  const d = await api("/api/gap-summary"); if (!d) return;
  if (d.available === false) {
    el.innerHTML = pageTitle("Your position") + emptyState("Nothing to show", esc(d.reason));
    return;
  }

  const row = i => `<div class="head k-state ${kClass(
      i.category === "ACTION_REQUIRED" ? "NOTHING"
      : i.category === "NEEDS_VERIFICATION" ? "REVIEW" : "NOT_ASSESSED")}
      ${i.category === "ACTION_REQUIRED" ? "is-gap" : ""}">
    <div>
      <div class="head__n"><span class="gap__icon">${esc(i.icon)}</span> ${esc(i.title)}</div>
      ${i.why ? `<div class="head__p">${esc(i.why)}</div>` : ""}
      ${i.resolved_by ? `<div class="head__w"><b>What would settle it:</b> ${esc(i.resolved_by)}</div>` : ""}
    </div>
    <div style="text-align:right">
      <span class="head__r">${esc(i.category_label)}</span>
      ${i.age_days ? `<div class="ev__days mt-8">${i.age_days} days open</div>` : ""}
      ${i.evidence_class ? `<div class="mt-8">${evidenceBadge(i.evidence_class)}</div>` : ""}
      ${i.source === "Your documents" ? `<button class="btn btn-ghost btn-sm mt-8"
        data-act="gap-why" data-arg="${esc(i.key)}">Show me why</button>` : ""}
    </div>
  </div>`;

  const next = d.best_next_action || {};
  el.innerHTML = pageTitle("Your position",
    "Everything we found, grouped by how sure we are. Three different things, not one red number.")
    + `<div class="big ${d.counts.ACTION_REQUIRED ? "is-gap" : ""}">
      <div class="big__l">In short</div>
      <div class="big__v">${esc(d.executive_summary)}</div>
      <div class="big__s"><b>Best next step:</b> ${esc(next.what || "")}
        ${next.because ? `<br><span class="text-sm text-muted">${esc(next.because)}</span>` : ""}</div>
    </div>

    <div class="stats mb-24">
      ${(d.categories || []).map(c => `<div class="stat ${
        c.category === "ACTION_REQUIRED" ? "red" : c.category === "NEEDS_VERIFICATION" ? "amber" : ""}">
        <div class="val">${c.count}</div>
        <div class="lbl">${esc(c.icon)} ${esc(c.label)}</div>
        <div class="sub">${esc(c.plain)}</div></div>`).join("")}
    </div>

    ${(d.categories || []).map(c => c.count ? `
      <div class="sub-head">${esc(c.icon)} ${esc(c.label)} — ${c.count}</div>
      <p class="tab-lead">${esc(c.plain)}</p>
      <div class="heads mb-24">${c.items.map(row).join("")}</div>` : "").join("")}

    <div class="honest">
      <b>How this screen is built.</b> ${esc(d.notice || "")}
      <br><br><b>${esc((d.language_rules || {}).uncertain_is_not_a_gap || "")}</b>
      <br>${esc((d.language_rules || {}).unassessed_is_not_uncovered || "")}
    </div>`;
}

/* ── The evidence drawer ──────────────────────────────────────────────────
 *
 * "Show me why" is the question this whole product exists to answer, so it must not be a
 * navigation event. Clicking a gap opens the quotation over the current screen, and the
 * screen underneath is still there when it closes.
 *
 * It fetches nothing new. The finding, its state, its class and its spans are already in the
 * Brief the screen loaded, so the drawer is a projection of data in hand — which also means
 * it cannot show a citation the engine did not verify.
 */
async function openEvidenceDrawer(ruleId) {
  S.drawer = { ruleId, loading: true };
  paintDrawer();
  try {
    const brief = await api("/api/brief");
    const finding = ((brief && brief.findings) || [])
      .find(f => f.rule_id === ruleId) || null;
    let plain = null;
    try {
      const explained = await api("/api/ai/explain", {
        method: "POST", body: { rule_id: ruleId } });
      plain = explained || null;
    } catch (_) { /* explanation is a bonus; the citation is the point */ }
    S.drawer = { ruleId, loading: false, finding, plain, page: null };
    paintDrawer();
    // The page image is fetched AFTER the drawer is on screen, not before. Rendering a
    // 28-page wording at 144 dpi takes a moment, and making the quotation wait behind a
    // picture of itself would be the wrong trade — the words are the evidence.
    await loadDrawerPage(0);
    return;
  } catch (err) {
    S.drawer = { ruleId, loading: false, error: err.message || String(err) };
  }
  paintDrawer();
}

/* Fetch and show the source page behind span number `i` of the open finding. */
async function loadDrawerPage(i) {
  const d = S.drawer;
  if (!d || !d.finding) return;
  const spans = d.finding.spans || [];
  const span = spans[i];
  if (!span || !span.document_id) return;
  d.spanIndex = i;
  d.page = { loading: true };
  paintDrawer();
  try {
    const q = `?span_id=${encodeURIComponent(span.span_id || "")}`;
    d.page = await api(`/api/source/${encodeURIComponent(span.document_id)}`
      + `/page/${encodeURIComponent(span.page_no)}${q}`);
  } catch (err) {
    d.page = { available: false, reason: err.message || String(err) };
  }
  paintDrawer();
}
window.loadDrawerPage = loadDrawerPage;

/* Full screen. A 440px drawer is the right size for reading a quotation and the wrong
 * size for reading a policy page, so the same page is re-fetched at print resolution and
 * shown over everything. Re-fetched rather than scaled up: enlarging a 144 dpi bitmap
 * would show the reader a blurrier version of the evidence at the exact moment they
 * decided to look closely. */
async function openPageFullscreen() {
  const d = S.drawer;
  if (!d || !d.finding) return;
  const span = (d.finding.spans || [])[d.spanIndex || 0];
  if (!span) return;
  S.pageFull = { loading: true };
  paintPageFullscreen();
  try {
    const q = `?span_id=${encodeURIComponent(span.span_id || "")}&full=true`;
    S.pageFull = await api(`/api/source/${encodeURIComponent(span.document_id)}`
      + `/page/${encodeURIComponent(span.page_no)}${q}`);
  } catch (err) {
    S.pageFull = { available: false, reason: err.message || String(err) };
  }
  paintPageFullscreen();
}
window.openPageFullscreen = openPageFullscreen;

function paintPageFullscreen() {
  document.getElementById("veris-pagefull")?.remove();
  const p = S.pageFull;
  if (!p) return;
  const host = document.createElement("div");
  host.id = "veris-pagefull";
  const body = p.loading
    ? spinner("Rendering the page at full size")
    : p.available && p.image
      ? `<img src="${esc(p.image)}" alt="Page ${esc(p.page_no)} of ${esc(p.filename || "the source document")}, with the quoted passage highlighted">`
      : `<div class="insight warn"><div class="insight-label">Cannot show the page</div>
          <div class="insight-text">${esc(p.reason || "")}</div></div>`;
  host.innerHTML = `<div class="pf__bar">
      <div class="pf__t">${esc(p.filename || "Source document")}${p.page_no
        ? ` — page ${esc(p.page_no)}${p.page_count ? " of " + esc(p.page_count) : ""}` : ""}</div>
      <button class="btn btn-sm btn-secondary" data-act="pagefull-close">Close</button>
    </div>
    <div class="pf__body">${body}</div>`;
  document.body.appendChild(host);
}

/* The page pane. FIRST thing in the drawer, above "What we found", because it is the
 * evidence and everything below it is commentary on the evidence.
 *
 * Renders in three states and never in a fourth: the page with the quotation marked, the
 * page unmarked with a line saying the quotation could not be located, or a named reason
 * there is no page at all. It does not substitute a different document's page when the
 * cited one has none — a page image is the most complete disclosure this product makes of
 * a document, and showing the wrong one under a quotation is a fabricated citation.
 */
function drawerPagePane(d) {
  const spans = (d.finding && d.finding.spans) || [];
  const withDoc = spans.filter(s => s.document_id);

  // A finding with no citation at all. Say so here rather than rendering nothing: an
  // absent panel reads as a missing feature, and this is a deliberate refusal — the
  // reason the finding is UNESTABLISHED is precisely that no document supports it.
  if (!withDoc.length) {
    return `<div class="pv-block">
      <div class="pv-block__h">The page it came from</div>
      <div class="pv pv--none">
        <p class="pv__note">No document supports this one, so there is no page to show.
          That is the finding, not a gap in the viewer: it is reported as unestablished
          precisely because nothing in your paperwork evidences it.</p>
        <button class="btn btn-sm btn-secondary" data-act="open"
          data-arg="sme-docs-hub|docs|add">Add the document →</button>
      </div></div>`;
  }

  const p = d.page;
  const active = d.spanIndex || 0;
  const picker = withDoc.length > 1
    ? `<div class="pv__tabs" role="group" aria-label="Which citation to show">
        ${spans.map((s, i) => s.document_id ? `<button class="pv__tab ${i === active ? "on" : ""}"
          data-act="drawer-page" data-arg="${i}">Page ${esc(s.page_no)}</button>` : "").join("")}
      </div>` : "";

  let inner;
  if (!p || p.loading) {
    inner = `<div class="pv__frame pv__frame--busy">${spinner("Opening the page")}</div>`;
  } else if (p.available && p.image) {
    const h = p.highlight || {};
    // The full-screen control is an ICON in the bottom-right of the page itself, so it
    // reads as "expand this" rather than as another row of interface below it.
    inner = `<div class="pv__frame">
        <img src="${esc(p.image)}" alt="Page ${esc(p.page_no)} of ${esc(p.filename || "the source document")}${h.found ? ", with the quoted passage highlighted" : ""}">
        <button class="pv__full" data-act="pagefull-open" title="Open full screen"
          aria-label="Open page ${esc(p.page_no)} full screen">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path
            d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" fill="none"
            stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="pv__meta">
        <span class="pv__file">${esc(p.filename || "")}</span>
        <span>page ${esc(p.page_no)}${p.page_count ? " of " + esc(p.page_count) : ""}</span>
        <span class="pv__hl ${h.found ? (h.method === "EXACT" ? "ok" : "part") : "no"}">${h.found
          ? `Highlighted${h.rect_count > 1 ? ` in ${esc(h.rect_count)} places` : ""}`
          : "Not highlighted"}</span>
      </div>
      ${h.method === "EXACT" ? "" : `<p class="pv__note">${esc(h.note || "")}</p>`}`;
  } else {
    inner = `<div class="pv--none">
      <p class="pv__note">${esc((p && p.reason) || "This page cannot be shown.")}</p>
      ${(p && p.reason || "").indexOf("demo data") >= 0 ? `<button class="btn btn-sm btn-secondary"
        data-act="load-example">Load the example business →</button>` : ""}</div>`;
  }

  return `<div class="pv-block">
    <div class="pv-block__h">The page it came from</div>
    ${picker}
    <div class="pv">${inner}</div>
  </div>`;
}

function paintDrawer() {
  document.getElementById("veris-drawer")?.remove();
  const d = S.drawer;
  if (!d) return;
  const host = document.createElement("div");
  host.id = "veris-drawer";

  let body;
  if (d.loading) {
    body = spinner("Fetching the evidence");
  } else if (d.error) {
    body = `<div class="insight critical"><div class="insight-text">${esc(d.error)}</div></div>`;
  } else if (!d.finding) {
    body = `<div class="v-empty">This finding is not in the case you can read.</div>`;
  } else {
    const f = d.finding;
    body = `
      ${drawerPagePane(d)}
      <div class="v-drawer__section">
        <h4>What we found</h4>
        <p class="text-sm">${esc(f.headline)}</p>
        <div class="ev__tags mt-8">
          <span class="ev__tag ${f.state === "DOCUMENTED" ? "open" : "policy"}">${esc(f.state_label || f.state)}</span>
          ${evidenceBadge(f.class)}
        </div>
      </div>
      ${d.plain && d.plain.text ? `<div class="v-drawer__section">
        <h4>In plain words</h4>
        <p class="text-sm">${esc(d.plain.text)}</p>
        <p class="quote-src">${esc(d.plain.mode || "")}</p>
      </div>` : ""}
      <div class="v-drawer__section">
        <h4>The words it rests on</h4>
        ${(f.spans || []).length
          ? (f.spans || []).map(s => `<div class="verbatim mb-12">
              <div class="verbatim__tag"><i></i>Verbatim — re-read at these offsets</div>
              <div class="verbatim__q">${esc(s.quote || "")}</div>
              <div class="verbatim__src">
                <span><b>Page</b> ${esc(s.page_no)}</span>
                <span><b>Offsets</b> ${esc(s.char_start)}–${esc(s.char_end)}</span>
              </div></div>`).join("")
          : `<p class="text-sm text-muted">No quotation supports this one — which is
               exactly why it is reported as unestablished rather than as a finding
               about your cover.</p>`}
      </div>`;
  }

  host.innerHTML = `<div class="v-drawer-overlay" data-act="drawer-close"></div>
    <aside class="v-drawer" role="dialog" aria-modal="true" aria-label="Evidence">
      <button class="v-drawer__close" data-act="drawer-close" aria-label="Close">✕</button>
      <h3 class="mb-12">Show me why</h3>
      ${body}
    </aside>`;
  document.body.appendChild(host);
}

/* ── Page quality ─────────────────────────────────────────────────────────
 *
 * The weakest part of the pipeline, turned into the most trustworthy thing the product says
 * about itself: here are the pages we could not read, and we refuse to grade a finding
 * PROVEN on any of them.
 */
async function smePageQuality(el) {
  el.innerHTML = spinner("Checking how well we read your documents");
  const d = await api("/api/page-quality"); if (!d) return;
  if (d.available === false) {
    el.innerHTML = pageTitle("How well we read your files") + emptyState("Nothing to check", esc(d.reason));
    return;
  }

  const docs = (d.documents || []).map(doc => `<div class="card mb-16">
    <div class="card-head"><h3>${esc(titleCase(doc.document_kind || "Document"))}</h3>
      <span class="tag ${doc.pages_needing_attention.length ? "tag-HIGH" : "tag-success"}">
        ${doc.pages_read_cleanly}/${doc.pages_total} clean</span></div>
    <p class="text-sm mb-12">${esc(doc.summary)}</p>
    ${doc.pages_needing_attention.length ? `
      <div class="heads">${doc.pages_needing_attention.map(p => `
        <div class="head is-gap">
          <div><div class="head__n">Page ${p.page_no} — ${esc(p.verdict_label)}</div>
            <div class="head__p">${esc(p.reason)}</div></div>
          <span class="head__r">Capped at ${esc(p.class_ceiling)}</span>
        </div>`).join("")}</div>`
      : `<p class="text-sm text-muted">Every page is usable as evidence.</p>`}
  </div>`).join("");

  el.innerHTML = pageTitle("How well we read your files",
      "We tell you which pages we could not read, and we refuse to base a finding on them.")
    + `<div class="stats mb-24">
      <div class="stat"><div class="val">${d.pages_total}</div><div class="lbl">Pages read</div></div>
      <div class="stat ${d.pages_needing_attention ? "amber" : "green"}">
        <div class="val">${d.pages_needing_attention}</div>
        <div class="lbl">Pages we could not read confidently</div></div>
    </div>
    ${docs}
    <div class="caveat"><div class="caveat__t">Why this limits what we will claim</div>
      <p>${esc(d.class_ceiling_rule || "")}</p>
      <p>${esc(d.why_page_level || "")}</p></div>
    <div class="honest">${esc(d.notice || "")}</div>`;
}

/* ── Getting started ─────────────────────────────────────────────────────
 *
 * Two documents, not fourteen. The completeness figure is read from the blind-spot register
 * rather than counted here, because two sources for one number is how a product starts
 * contradicting itself.
 */
async function smeOnboarding(el) {
  el.innerHTML = spinner("Working out what you still need");
  const d = await api("/api/onboarding"); if (!d) return;
  if (d.available === false) {
    el.innerHTML = pageTitle("Getting started") + emptyState("Nothing to show", esc(d.reason));
    return;
  }
  const c = d.completeness || {};
  const prefill = d.identity_prefill || {};

  el.innerHTML = pageTitle("Getting started",
      "You need two documents to begin. Everything else is asked for one at a time.")
    + `<div class="big ${d.ready_to_assess ? "" : "is-gap"}">
      <div class="big__l">Where you are</div>
      <div class="big__v">${esc(c.statement || "")}</div>
      <div class="big__s">${d.ready_to_assess
        ? "You have the two documents we cannot work without. Everything below only makes the picture sharper."
        : "We are missing something we cannot work without — see below."}</div>
    </div>

    <div class="sub-head">The two we cannot work without</div>
    <div class="prot mb-24">
      ${(d.mandatory || []).map(m => `<div class="pro k-state ${m.held ? "is-assessed" : "is-gap"} ${m.held ? "" : "is-gap"}">
        <div class="pro__mark">${m.held ? "✓" : "!"}</div>
        <div><div class="pro__l">${esc(titleCase(m.kind))}</div>
          <div class="pro__p">${esc(m.why)}</div></div>
        <span class="pro__basis ${m.held ? "law" : "conv"}">${m.held ? "Held" : "Needed"}</span>
      </div>`).join("")}
    </div>

    ${(d.next_documents || []).length ? `<div class="sub-head">What to send next, in order of what it settles</div>
      <div class="heads mb-24">${(d.next_documents || []).map((n, i) => `
        <div class="head">
          <div><div class="head__n">${i + 1}. ${esc(n.document || "")}</div>
            <div class="head__p">${esc(n.unlocks || "")}</div></div>
          <div style="text-align:right">
            ${n.settles_share ? `<span class="head__r">settles ${esc(n.settles_share)}</span>` : ""}
            ${n.becomes_class ? `<div class="mt-8">${evidenceBadge(n.becomes_class)}</div>` : ""}
          </div>
        </div>`).join("")}</div>
      <button class="btn btn-primary mb-24" data-act="open" data-arg="sme-docs-hub|docs|add">Add documents</button>` : ""}

    <div class="card mb-16">
      <div class="card-head"><h3>Prefilling your company details</h3>
        <span class="tag">${prefill.available ? "Available" : "Not wired"}</span></div>
      <p class="text-sm mb-8">${esc(prefill.what_it_would_replace || "")}</p>
      <p class="text-sm text-muted">${esc(prefill.status || "")}</p>
      <p class="text-xs text-muted mt-8">Sources: ${(prefill.sources || []).map(esc).join(" · ")}</p>
    </div>
    <div class="honest"><b>${esc((c.why_not_counted_here) || "")}</b><br><br>${esc(d.notice || "")}</div>`;
}

/* ── Connected systems ───────────────────────────────────────────────────
 *
 * The accounting connector, and the one place this product used to overclaim. The screen has
 * to be equally clear in three states: no app configured, configured but not authorised, and
 * genuinely connected — because only the third may show anything as live.
 */
async function smeConnected(el) {
  el.innerHTML = spinner("Checking your connected systems");
  const [status, feed] = await Promise.all([
    api("/api/xero/status"), api("/api/signals"),
  ]);
  if (!status) return;
  const live = (feed && feed.live) || {};

  el.innerHTML = pageTitle("Connected systems",
      "Reading your accounting system directly, so a change reaches us without you typing it.")
    + `<div class="big ${status.connected ? "" : "is-gap"}">
      <div class="big__l">Xero</div>
      <div class="big__v">${status.connected ? esc(status.tenant_name || "Connected")
        : status.configured ? "Not yet authorised" : "Not configured"}</div>
      <div class="big__s">${esc(status.notice || "")}</div>
    </div>

    <div class="stats mb-24">
      <div class="stat ${live.any_live ? "green" : ""}"><div class="val">${live.live_count ?? 0}</div>
        <div class="lbl">Rows read live</div></div>
      <div class="stat"><div class="val">${live.fixture_count ?? 0}</div>
        <div class="lbl">Rows from the labelled fixture</div></div>
    </div>

    <div class="card mb-16">
      <div class="card-head"><h3>What we would read</h3>${evidenceBadge("DECLARED")}</div>
      <p class="text-sm mb-8">Read-only, and only these:</p>
      <ul class="area__list">${(status.scopes || []).map(s => `<li>${esc(s)}</li>`).join("")}</ul>
      <p class="text-xs text-muted mt-12">A feed is not a document. An accounting figure can
        raise a question and name the document that would settle it; it can never on its own
        produce a proven finding.</p>
      <div class="grid-2 mt-16">
        ${status.connected
          ? `<button class="btn btn-secondary" id="xero-off">Disconnect</button>`
          : `<button class="btn btn-primary" id="xero-on" ${status.configured ? "" : "disabled"}>
               ${status.configured ? "Connect to Xero" : "Needs configuration"}</button>`}
      </div>
      <div id="xero-out" class="mt-12"></div>
    </div>

    ${!status.configured ? `<div class="partial">
      <div class="partial__t">What this deployment is missing</div>
      <div class="partial__s">No Xero app is registered, so the accounting feed runs on its
        labelled fixture. Nothing on this screen is pretending otherwise.</div>
      <div class="partial__grid">
        <div class="partial__i"><b>PROVEN_XERO_CLIENT_ID</b><span>From a free app at developer.xero.com</span></div>
        <div class="partial__i"><b>PROVEN_XERO_CLIENT_SECRET</b><span>Never stored in the repository</span></div>
      </div>
    </div>` : ""}
    <div class="honest">${esc(status.credentials_never_served || "")}</div>`;

  const on = $("#xero-on");
  if (on) on.onclick = async () => {
    const out = $("#xero-out");
    const d = await api("/api/xero/connect");
    if (!d) return;
    out.innerHTML = d.available
      ? `<div class="insight"><div class="insight-text">Opening Xero to ask for your
           permission. You will come back here afterwards.</div></div>`
      : `<div class="insight warn"><div class="insight-label">Not configured</div>
           <div class="insight-text">${esc(d.reason)}</div></div>`;
    if (d.available && d.authorize_url) window.location.href = d.authorize_url;
  };
  const off = $("#xero-off");
  if (off) off.onclick = async () => {
    await api("/api/xero/disconnect", { method: "POST" });
    nav8(S.view);
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   ADVISER WORKSPACE
   ══════════════════════════════════════════════════════════════════════════ */

/* ── The adviser's file note ──────────────────────────────────────────────
 *
 * The one screen where a model's prose becomes a durable artefact somebody relies on later.
 * So the interface has to make three things unmissable: what the grounding check found,
 * which of the three states the note is in, and that nothing here is sent anywhere.
 *
 * A rejected draft is shown WITH the invented token rather than hidden. A hallucination
 * caught in the act is the most reassuring thing this screen can display — it is the proof
 * that the check runs at all.
 */
async function advNote(el) {
  el.innerHTML = spinner("Opening the file note");
  let d = await api("/api/adviser/note");
  if (!d) return;

  if (d.available === false) {
    el.innerHTML = pageTitle("File note",
        "A record of the basis on which you advised. Drafted for you, approved by you.")
      + emptyState("No note yet", esc(d.reason),
        `<button class="btn btn-primary" id="note-draft">Draft the note</button>`);
    wireDraft();
    return;
  }
  paint(d);

  function paint(note) {
    const g = note.grounding || {};
    const approved = note.state === "ADVISER_APPROVED";
    el.innerHTML = pageTitle("File note",
        "A record of the basis on which you advised. Drafted for you, approved by you.")
      + `<div class="big ${approved ? "" : "is-gap"}">
        <div class="big__l">Status</div>
        <div class="big__v">${esc(note.state_label)}</div>
        <div class="big__s">${approved
          ? "This is a record. It cannot be edited any further."
          : "This is a draft. It carries no authority until you approve it."}</div>
      </div>

      <div class="card mb-16">
        <div class="card-head"><h3>Grounding check</h3>
          <span class="tag ${g.accepted === false ? "tag-HIGH" : g.accepted ? "tag-success" : ""}">
            ${g.checked ? (g.accepted ? "Draft accepted" : "Draft rejected") : "Not model-drafted"}</span></div>
        ${g.accepted === false ? `
          <p class="text-sm mb-8">${esc(g.reason || "")}</p>
          <div class="heads">${(g.problems || []).map(p => `
            <div class="head is-gap"><div><div class="head__p">${esc(p)}</div></div>
              <span class="head__r">Rejected</span></div>`).join("")}</div>`
        : `<p class="text-sm text-muted">${esc(g.reason
            || "Every reference in this note was checked against the disclosed evidence.")}</p>`}
        ${(g.adviser_edit_warnings || []).length ? `
          <div class="caveat mt-16"><div class="caveat__t">In your own edit</div>
            <ul class="area__list">${g.adviser_edit_warnings.map(w => `<li>${esc(w)}</li>`).join("")}</ul>
            <p>Recorded, not blocked — you may legitimately need to quote a term.</p></div>` : ""}
      </div>

      <div class="sub-head">The note</div>
      <div class="card mb-16">
        <textarea id="note-text" ${approved ? "readonly" : ""} rows="22"
          style="width:100%;font-family:var(--mono);font-size:12.5px;line-height:1.65;
                 padding:16px;border:1px solid var(--border);border-radius:var(--radius-sm);
                 background:${approved ? "var(--surface-alt)" : "var(--surface)"}"
        >${esc(note.text)}</textarea>
        <div class="btn-group mt-12">
          ${approved ? "" : `
            <button class="btn btn-secondary" id="note-save">Save my edits</button>
            <button class="btn btn-primary" id="note-approve">Approve — this becomes a record</button>
            <button class="btn btn-ghost" id="note-draft">Redraft</button>`}
        </div>
        <div id="note-out" class="mt-12"></div>
      </div>

      <div class="sub-head">History</div>
      <div class="card mb-16"><table><thead><tr><th>When</th><th>State</th><th>By</th><th>What</th></tr></thead>
        <tbody>${(note.history || []).map(h => `<tr>
          <td class="text-xs text-muted">${esc(String(h.at).slice(0, 16).replace("T", " "))}</td>
          <td><span class="tag">${esc(h.state)}</span></td>
          <td class="text-xs">${esc(h.by)}</td>
          <td class="text-sm">${esc(h.what)}</td></tr>`).join("")}</tbody></table></div>

      <div class="honest"><b>Nothing here is sent.</b> ${esc(note.never_sent || "")}</div>`;

    wireDraft();
    const save = $("#note-save");
    if (save) save.onclick = async () => {
      const r = await api("/api/adviser/note/edit",
        { method: "POST", body: { text: $("#note-text").value } });
      if (r) paint(r);
    };
    const approve = $("#note-approve");
    if (approve) approve.onclick = async () => {
      if (!confirm("Approve this note? It becomes a record and cannot be edited afterwards."))
        return;
      const r = await api("/api/adviser/note/approve", { method: "POST" });
      if (r) paint(r);
    };
  }

  function wireDraft() {
    const btn = $("#note-draft");
    if (!btn) return;
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        const r = await api("/api/adviser/note/draft", { method: "POST" });
        if (r) paint(r);
      } catch (err) {
        el.insertAdjacentHTML("beforeend",
          `<div class="insight critical mt-12"><div class="insight-label">Could not draft</div>
            <div class="insight-text">${esc(err.message || String(err))}</div></div>`);
      } finally { btn.disabled = false; }
    };
  }
}

function renderAdviser() {
  if (!S.view || !S.view.startsWith("adv")) S.view = "adv-queue";
  shell("ADVISER", [
    { section: "Cases" },
    { id: "adv-queue", label: "Review Queue", icon: "≡" },
    { id: "adv-review", label: "Current Review", icon: "▣" },
    { section: "Act on it" },
    { id: "adv-actions", label: "Requests to action", icon: "→" },
    { id: "adv-requests", label: "Information Requests", icon: "?" },
    { section: "Your record" },
    { id: "adv-note", label: "File note", icon: "▤" },
  ]);
  const m = $("#main");
  const advViews = { "adv-queue": advQueue, "adv-review": advReview,
                     "adv-actions": advActions,
                     "adv-requests": advRequests, "adv-note": advNote };
  mount(advViews[S.view] || advQueue, m);
}

async function advQueue(el) {
  el.innerHTML = `<div class="loading"><div class="spinner"></div>Loading</div>`;
  const d = await api("/api/adviser/queue"); if (!d) return;
  const cases = d.cases || [];
  const live = cases.filter(c => !c.demo);
  el.innerHTML = `<div class="page-title"><h1>Review Queue</h1>
      <p>${cases.length} case(s) · ${d.live_case_count ?? live.length} live, ${cases.length - live.length} demonstration</p></div>
    ${d.awaiting_consent ? `<div class="insight warn mb-16"><div class="insight-label">Waiting on consent</div><div class="insight-text">No live case has been disclosed to you yet. A case reaches this queue only when the business grants disclosure — that is the boundary working, not a fault. Sign in as the owner, open <strong>Share with Adviser</strong> and grant consent, then return here.</div></div>` : ""}
    <div class="card"><table><thead><tr><th>Client</th><th>Priority</th><th>Why it is here</th><th>Findings</th><th>Needs review</th><th>Score</th><th>Status</th><th></th></tr></thead><tbody>
      ${cases.map(c => `<tr>
        <td class="td-name">${esc(c.business_name || "")}${c.demo ? ' <span class="tag">demo</span>' : ' <span class="tag tag-success">live</span>'}</td>
        <td><span class="tag tag-${esc(c.priority || "")}">${esc(c.priority || "")}</span></td>
        <td class="text-xs">${esc((c.source || "").replace(/_/g, " ").toLowerCase())}</td>
        <td>${c.finding_count ?? 0}</td>
        <td>${c.needs_review_count ?? 0}</td>
        <td>${c.score ?? "—"}</td>
        <td class="text-xs">${esc(c.status || "")}</td>
        <td>${c.demo ? '<span class="text-xs text-muted">no documents behind it</span>' : '<button class="btn btn-sm btn-secondary" data-act="nav" data-arg="adv-review">Review</button>'}</td>
      </tr>`).join("")}
    </tbody></table></div>
    <p class="text-xs text-muted mt-12">${esc(d.notice || "")}</p>`;
}

async function advReview(el) {
  el.innerHTML = `<div class="loading"><div class="spinner"></div>Loading</div>`;
  // A missing disclosure is a 403 CONSENT_REQUIRED. That is the consent boundary doing its
  // job, not a failure, so it gets an explanatory empty state rather than an error banner —
  // and rather than leaving the screen stuck on a spinner, which is what happened before.
  let d;
  try {
    d = await api("/api/adviser/review");
  } catch (err) {
    el.innerHTML = `<div class="page-title"><h1>Review Brief</h1></div>
      <div class="insight warn"><div class="insight-label">Nothing disclosed to you yet</div>
        <div class="insight-text">${esc(err.message || "The business has not granted disclosure.")}</div></div>
      <p class="text-sm text-muted mt-12">This is the consent boundary, not a fault. The business decides what leaves its workspace and names the recipient. Sign in as the owner, open <strong>Share with Adviser</strong>, grant consent, then come back.</p>
      <button class="btn btn-ghost mt-16" data-act="nav" data-arg="adv-queue">← Back to Queue</button>`;
    return;
  }
  if (!d) return;
  // The disclosed brief carries what the OWNER released and, just as importantly, what was
  // withheld. The previous version read action_required / review_needed / score / decisions,
  // none of which are on this response — so three stat tiles always showed 0 and the
  // withheld counts, which are the whole point of a consent-scoped brief, were never shown.
  const shown = d.findings || [];
  el.innerHTML = `<div class="page-title"><h1>Review Brief — ${esc(d.business || "")}</h1>
      <p>${esc(d.carrier || "")} · disclosed to ${esc(d.recipient || "you")}</p></div>
    <div class="stats">
      <div class="stat"><div class="val">${shown.length}</div><div class="lbl">Findings Disclosed</div></div>
      <div class="stat amber"><div class="val">${d.findings_withheld_count ?? 0}</div><div class="lbl">Withheld</div><div class="sub">Not shared by the owner</div></div>
      <div class="stat"><div class="val">${(d.disclosed_fields || []).length}</div><div class="lbl">Fields Granted</div></div>
      <div class="stat"><div class="val">${(d.withheld_pending_documents || []).length}</div><div class="lbl">Pending Documents</div></div>
    </div>
    <div class="card mb-16"><div class="card-head"><h3>Scope of this disclosure</h3></div>
      <p class="text-sm">The owner granted: ${(d.disclosed_fields || []).map(f => `<span class="tag">${esc(f)}</span>`).join(" ") || "—"}</p>
      ${d.accounting_withheld ? '<p class="text-sm text-muted mt-8">Accounting detail was withheld.</p>' : ""}
      ${(d.withheld_pending_documents || []).length ? `<p class="text-sm text-muted mt-8">Withheld pending documents: ${(d.withheld_pending_documents || []).map(x => esc(String(x))).join(", ")}</p>` : ""}
      <p class="text-xs text-muted mt-8">${esc(d.notice || "")}</p>
    </div>
    ${shown.length
      ? `<div class="sub-head">Findings in scope</div>
         ${shown.map(f => advFindingCard(f)).join("")}`
      : `<div class="empty"><h3>No findings in scope</h3><p>Either the owner granted documents that carry no findings, or every finding rests on a document they held back. The withheld count above tells you which.</p></div>`}
    ${(d.withheld_pending_documents && Object.keys(d.withheld_pending_documents).length) ? `
      <div class="card mt-16"><div class="card-head"><h3>Ask for a wider grant</h3></div>
        <p class="text-sm mb-12">These document kinds are behind findings you cannot read. Naming one in a request tells the owner exactly what to release.</p>
        <div class="btn-group">${Object.keys(d.withheld_pending_documents).map(k => `
          <button class="btn btn-sm btn-secondary" data-act="adv-ask"
            data-arg="DISCLOSURE|${esc(k)}">Request ${esc(titleCase(k))}</button>`).join("")}</div></div>` : ""}
    ${(d.searched || []).length ? `<div class="card mt-16"><div class="card-head"><h3>What was searched</h3></div><ul class="text-sm">${d.searched.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
      ${(d.not_searched || []).length ? `<div class="card-head mt-12"><h3>What was NOT searched</h3></div><ul class="text-sm">${d.not_searched.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}</div>` : ""}
    <div class="btn-group mt-16">
      <button class="btn btn-ghost" data-act="nav" data-arg="adv-queue">← Back to Queue</button>
      <button class="btn btn-secondary" data-act="nav" data-arg="adv-actions">Requests to action →</button>
    </div>`;
}

/* One disclosed finding, with the two things an adviser can actually do to it: read the
 * evidence, and ask the client for what would settle it.
 *
 * `renderDecision` is not reused here because it renders an ORCHESTRATOR decision
 * (`interest_label`, `decision`, `current_state`) and the disclosed brief carries
 * FINDINGS (`rule_id`, `headline`, `state_label`, `class`, `spans`). Feeding one to the
 * other is why this screen previously showed blank titles and no state.
 */
function advFindingCard(f) {
  const cls = f.state === "DOCUMENTED" ? "MONITOR"
    : f.state === "INFORMATION_MISSING" ? "REVIEW" : "ACTION_REQUIRED";
  return `<div class="finding ${cls}">
    <div class="finding-head">
      <div class="finding-title">${esc(f.headline || f.rule_id || "")}</div>
      <span class="tag tag-${cls}">${esc(f.state_label || f.state || "")}</span>
    </div>
    <div class="finding-meta">
      <span class="tag">${esc(f.class_label || f.class || "")}</span>
      <span class="tag tag-info">${esc(f.rule_id || "")}</span>
      ${(f.spans || []).length ? `<span class="tag">${esc((f.spans || []).length)} citation(s)</span>` : ""}
    </div>
    ${(f.spans || []).length ? `<div class="mt-8">${(f.spans || []).map(s => `
      <div class="v-evidence"><div class="text-sm">${esc(s.quote || "")}</div>
        <div class="v-evidence__src">page ${esc(s.page_no)} · offsets ${esc(s.char_start)}–${esc(s.char_end)}</div>
      </div>`).join("")}</div>` : ""}
    <div class="btn-group mt-12">
      <button class="btn btn-sm btn-ghost" data-act="gap-why" data-arg="${esc(f.rule_id || "")}">Show me why</button>
      <button class="btn btn-sm btn-secondary" data-act="adv-ask" data-arg="${esc(f.rule_id || "")}">Request information</button>
    </div>
  </div>`;
}

/* Ask the client for something, against a named finding.
 *
 * A prompt() rather than an inline form on purpose: the request is one sentence, and the
 * screen it is raised from is a list. It posts to the existing
 * /api/adviser/request-information, which records the question and — deliberately — does
 * NOT move the finding's state or evidence class. An adviser's question is not evidence.
 */
async function adviserAsk(arg) {
  const raw = String(arg || "");
  let ruleId = raw, suggestion = "";
  if (raw.startsWith("DISCLOSURE|")) {
    const kind = raw.slice("DISCLOSURE|".length);
    ruleId = "DISCLOSURE-SCOPE";
    suggestion = `Please also share your ${titleCase(kind)} so the findings that rest on it can be reviewed.`;
  } else {
    suggestion = "Please provide the supporting document for this finding so the position can be established rather than estimated.";
  }
  const message = prompt("What do you need from the client?", suggestion);
  if (message === null) return;
  if (!message.trim()) { toast("A request needs a message.", "err"); return; }
  try {
    await api("/api/adviser/request-information",
      { method: "POST", body: { rule_id: ruleId, message: message.trim() } });
    toast("Request recorded against " + ruleId);
    nav8("adv-requests");
  } catch (err) {
    toast(err.message || String(err), "err");
  }
}
window.adviserAsk = adviserAsk;

/* ── Requests to action ───────────────────────────────────────────────────
 *
 * The action loop, from the adviser's side. Every button here is a transition
 * `actions.py` already reserves to the actor "adviser" — ADVISER_REVIEWING,
 * INFORMATION_REQUESTED, QUOTE_RECEIVED, BOUND, DECLINED, NOT_REQUIRED. The buttons are
 * rendered FROM `allowed_moves` rather than from a list hardcoded here, so the interface
 * cannot offer a move the state machine would refuse, and a change to the transition
 * table shows up in the UI without an edit.
 *
 * Moves belonging to the owner are shown greyed with who they belong to, rather than
 * hidden: an adviser waiting on a client should be able to see that they are waiting.
 */
async function advActions(el) {
  el.innerHTML = spinner("Loading the requests raised on this case");
  let d;
  try {
    d = await api("/api/actions");
  } catch (err) {
    el.innerHTML = pageTitle("Requests to action")
      + `<div class="insight warn"><div class="insight-label">Nothing disclosed to you yet</div>
          <div class="insight-text">${esc(err.message || "")}</div></div>
        <p class="text-sm text-muted mt-12">A correction request is derived from the Brief, so it sits behind the same consent gate. Sign in as the owner, open <strong>Share with adviser</strong>, grant disclosure, then come back.</p>
        <button class="btn btn-ghost mt-16" data-act="nav" data-arg="adv-queue">← Back to Queue</button>`;
    return;
  }
  if (!d) return;
  if (d.available === false) {
    el.innerHTML = pageTitle("Requests to action")
      + emptyState("Nothing to action", esc(d.reason || ""));
    return;
  }

  const all = d.actions || [];
  const mine = all.filter(a => (a.allowed_moves || []).some(m => m.by === "adviser"));
  const waiting = all.filter(a => !mine.includes(a) && !a.is_terminal);
  const closed = all.filter(a => a.is_terminal);
  const out = await api("/api/outcomes").catch(() => null);

  el.innerHTML = pageTitle("Requests to action",
      `${all.length} request(s) on this case. ${mine.length} waiting on you.`)
    + (out && out.available !== false ? `<div class="stats mb-24">
        <div class="stat"><div class="val">${mine.length}</div><div class="lbl">Waiting on you</div></div>
        <div class="stat amber"><div class="val">${money(out.exposure_pending_sgd)}</div><div class="lbl">Exposure in flight</div></div>
        <div class="stat green"><div class="val">${money(out.exposure_closed_sgd)}</div><div class="lbl">Exposure closed</div><div class="sub">Counted on BOUND only</div></div>
        <div class="stat"><div class="val">${money(out.exposure_identified_sgd)}</div><div class="lbl">Exposure identified</div></div>
      </div>` : "")
    + (mine.length ? `<div class="sub-head">Waiting on you</div>
        ${mine.map(advActionCard).join("")}` : "")
    + (waiting.length ? `<div class="sub-head">Waiting on the client</div>
        ${waiting.map(advActionCard).join("")}` : "")
    + (closed.length ? `<div class="sub-head">Closed</div>
        ${closed.map(advActionCard).join("")}` : "")
    + (all.length ? "" : emptyState("No requests raised",
        "The engine raises a request when a finding quantifies a gap. This case has none."))
    + `<div class="honest mt-16">${esc(d.premium_notice || "")}</div>`;
}

function advActionCard(a) {
  const mine = (a.allowed_moves || []).filter(m => m.by === "adviser");
  const theirs = (a.allowed_moves || []).filter(m => m.by !== "adviser");
  return `<div class="action-card mb-8">
    <div class="action-head">
      <div class="action-title">${esc(a.title || a.action_label || "")}</div>
      <span class="tag ${a.closes_exposure ? "tag-success" : a.is_terminal ? "" : "tag-REVIEW"}">${esc(a.state_label || a.state)}</span>
    </div>
    <div class="action-body">
      <p class="text-sm mb-8"><b>What you are being asked to do.</b> ${esc(a.asks || "")}</p>
      <div class="finding-meta mb-8">
        <span class="tag tag-info">${esc(a.action_label || "")}</span>
        <span class="tag">${esc(titleCase(a.interest || ""))}</span>
        ${a.evidence_class ? `<span class="tag">${esc(a.evidence_class)}</span>` : ""}
        ${a.source_rule_id ? `<span class="tag">${esc(a.source_rule_id)}</span>` : ""}
      </div>
      ${a.is_quantified ? `<p class="text-sm"><b>Exposure it would close:</b> ${money(a.exposure_sgd)}
        <span class="text-xs text-muted">— ${esc(a.exposure_basis || "")}</span></p>`
        : `<p class="text-sm text-muted">No money figure: this one is measured in people or documents, not dollars.</p>`}
      ${(a.documents_requested || []).length ? `<p class="text-sm mt-8"><b>Documents named:</b> ${(a.documents_requested || []).map(x => esc(String(x))).join(", ")}</p>` : ""}
      ${a.adviser_note ? `<div class="v-evidence mt-8"><div class="text-sm">${esc(a.adviser_note)}</div>
        <div class="v-evidence__src">your last note on this request</div></div>` : ""}
      ${mine.length ? `<div class="btn-group mt-12">${mine.map(m => `
        <button class="btn btn-sm ${m.to === "BOUND" ? "btn-primary" : "btn-secondary"}"
          data-act="adv-move" data-arg="${esc(a.id)}|${esc(m.to)}">${esc(m.label)}</button>`).join("")}</div>`
        : theirs.length ? `<p class="text-xs text-muted mt-12">Waiting on the ${esc(theirs[0].by)}: ${theirs.map(m => esc(m.label)).join(", ")}.</p>`
        : `<p class="text-xs text-muted mt-12">This request is closed. Nothing further can move it.</p>`}
    </div>
  </div>`;
}

/* Advance one action. The target state is sent; the ACTOR is not, and cannot be — the
 * server reads it from the session, which is what keeps the exposure-closed figure from
 * being self-reported. A refused move comes back 409 with the permitted moves listed. */
async function adviserMove(arg) {
  const [id, to] = String(arg || "").split("|");
  if (!id || !to) return;
  let note = "";
  if (to === "BOUND" || to === "DECLINED" || to === "NOT_REQUIRED") {
    const answer = prompt(
      to === "BOUND"
        ? "Confirming the contract actually changed. What was bound?"
        : "Why? This is recorded on the request.", "");
    if (answer === null) return;
    note = answer.trim();
  }
  try {
    await api(`/api/actions/${encodeURIComponent(id)}/advance`,
      { method: "POST", body: { to_state: to, note } });
    toast("Moved to " + titleCase(to));
    nav8("adv-actions");
  } catch (err) {
    toast(err.message || String(err), "err");
  }
}
window.adviserMove = adviserMove;

async function advRequests(el) {
  el.innerHTML = spinner("Loading your information requests");
  const d = await api("/api/adviser/requests"); if (!d) return;
  const rows = d.requests || [];
  // Field names read from the response the server actually sends: rule_id, message,
  // requested_by, adviser_organisation, state. The previous version read document /
  // title / status / reason, none of which exist, so every card rendered blank.
  el.innerHTML = pageTitle("Information Requests",
      `${rows.length} request(s) raised against this case. The owner sees these too.`)
    + (rows.length ? rows.map(r => `<div class="action-card mb-8">
        <div class="action-head">
          <div class="action-title">${esc(r.rule_id || "")}</div>
          <span class="tag tag-REVIEW">${esc(titleCase(r.state || ""))}</span>
        </div>
        <div class="action-body">
          <p class="text-sm">${esc(r.message || "")}</p>
          <p class="text-xs text-muted mt-8">Raised by ${esc(r.requested_by || "you")}${r.adviser_organisation ? ", " + esc(r.adviser_organisation) : ""}</p>
        </div></div>`).join("")
      : emptyState("No requests yet",
          "Open <strong>Current Review</strong> and use <em>Request information</em> on a finding to ask the client for what would settle it."))
    + `<div class="honest mt-16">A request records a question. It does not change the finding's state or its evidence class — a question is not evidence.</div>`;
}

/* ══════════════════════════════════════════════════════════════════════════
   CARRIER WORKSPACE
   ══════════════════════════════════════════════════════════════════════════ */

function renderCarrier() {
  if (!S.view || !S.view.startsWith("car")) S.view = "car-triage";
  // Ordered as an underwriter's day, not as a data model. The work queue is first
  // because "what should I look at now" is the only question they open the tool with.
  // The read-only portfolio screens keep their place below; nothing was removed.
  shell("CARRIER", [
    { section: "My work" },
    { id: "car-triage", label: "Work queue", icon: "≡" },
    { id: "car-inbox", label: "Needs attention", icon: "◍" },
    { id: "car-decisions", label: "Decision log", icon: "▤" },
    { section: "The book" },
    { id: "car-analyses", label: "Coverage Gap Analysis", icon: "▣" },
    { id: "car-patterns", label: "Book patterns", icon: "⧉" },
    { id: "car-portfolio", label: "Overview", icon: "◈" },
    { id: "car-premium", label: "Exposure at Risk", icon: "⚠" },
    { id: "car-matrix", label: "Attention Matrix", icon: "▦" },
    { id: "car-accounts", label: "Priority accounts", icon: "◉" },
  ]);
  const m = $("#main");
  const carViews = {
    "car-triage": carTriage,
    "car-inbox": carInbox,
    "car-decisions": carDecisions,
    "car-patterns": carPatterns,
    "car-detail": carDetail,
    "car-analyses": carAnalyses,
    "car-portfolio": carPortfolio,
    "car-premium": carPremium,
    "car-matrix": carMatrix,
    "car-accounts": carAccounts,
  };
  mount(carViews[S.view] || carTriage, m);
}

/* ── The underwriter's work queue (B4) ────────────────────────────────────
 *
 * Deterministically ranked server-side, with the weight table returned alongside so the
 * ranking can be argued with rather than trusted. That matters more here than on any SME
 * screen: an underwriter who cannot see why an account is top of their queue will either
 * ignore the order or follow it blindly, and both are worse than a visible rule.
 */
async function carTriage(el) {
  el.innerHTML = spinner("Ranking the book");
  const d = await api("/api/carrier/renewal-triage"); if (!d) return;
  if (d.available === false) { el.innerHTML = noBookState(d); return; }
  const rows = d.ranked || [];

  el.innerHTML = `<div class="synthetic-banner">DEMO PORTFOLIO — SYNTHETIC DATA. Not real customer information.</div>
    ${pageTitle("Work queue", `${d.count} account(s), ranked by what needs attention first.`)}
    <div class="card"><table>
      <thead><tr><th>#</th><th>Account</th><th>Why it is here</th><th>Attention</th>
        <th>Last reviewed</th><th>Decision</th><th></th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td class="text-xs text-muted">${r.rank}</td>
        <td class="td-name">${esc(r.business_name || "")}
          <div class="text-xs text-muted">${esc(r.industry || "")}</div></td>
        <td class="text-sm">${esc(r.reason_line || "")}</td>
        <td><span class="tag ${r.attention >= 60 ? "tag-HIGH" : ""}">${r.attention}</span></td>
        <td class="text-xs text-muted">${esc(r.last_reviewed || "—")}</td>
        <td class="text-xs">${r.decision ? esc(r.decision) : '<span class="text-muted">none yet</span>'}</td>
        <td style="text-align:right"><button class="btn btn-sm btn-secondary"
          data-act="car-open" data-arg="${esc(r.account_id)}">Open</button></td>
      </tr>`).join("")}</tbody>
    </table></div>
    <div class="card mt-16"><div class="card-head"><h3>How this order was decided</h3></div>
      <p class="text-sm mb-12">${esc(d.basis || "")}</p>
      <table><thead><tr><th>Signal</th><th>Weight</th></tr></thead><tbody>
        ${Object.entries(d.weights || {}).map(([k, v]) =>
          `<tr><td>${esc(titleCase(k))}</td><td>${v}</td></tr>`).join("")}
      </tbody></table>
      <div class="caveat mt-16"><div class="caveat__t">Read the weights as judgements</div>
        <p>${esc(d.weights_are_judgements || "")}</p>
        <p>${esc(d.not_a_rating || "")}</p></div>
    </div>`;
}

/* ── Needs attention (A2) ────────────────────────────────────────────────
 *
 * Every row states what the book evidences AND what only a disclosure would reveal. The
 * second half is the honest part: a carrier can see that a business changed without being
 * entitled to know what changed, and saying so is better than filling the gap with a
 * plausible guess.
 */
async function carInbox(el) {
  el.innerHTML = spinner("Reading your book");
  const d = await api("/api/carrier/inbox"); if (!d) return;
  if (d.available === false) { el.innerHTML = noBookState(d); return; }
  const items = d.items || [];
  el.innerHTML = `<div class="synthetic-banner">DEMO PORTFOLIO — SYNTHETIC DATA</div>
    ${pageTitle("Needs attention", `${d.count} item(s) your book flags for an underwriter.`)}
    ${items.length === 0 ? emptyState("Nothing flagged",
      "No account on this book currently flags a high internal change or unevidenced items.") : ""}
    ${items.map(i => `<div class="dep">
      <div class="dep__head">
        <span class="dep__kind">${esc(titleCase(i.kind))}</span>
        <span class="dep__name">${esc(i.business_name || "")}</span>
      </div>
      <div class="head__n mb-8">${esc(i.headline)}</div>
      <div class="dep__modes">
        <div class="dep__mode"><span>What your book shows</span><b>${esc(i.what_we_can_say)}</b></div>
        <div class="dep__mode is-gap"><span>What it cannot show</span><b>${esc(i.what_we_cannot_say)}</b></div>
      </div>
      <div class="ev__fix mt-12"><b>Next step:</b> ${esc(i.next_step)}
        ${i.adviser ? ` · adviser: ${esc(i.adviser)}` : " · no adviser assigned"}</div>
      <button class="btn btn-sm btn-secondary mt-12" data-act="car-open" data-arg="${esc(i.account_id)}">Open account</button>
    </div>`).join("")}
    <div class="honest">${esc(d.notice || "")}</div>`;
}

/* ── Account detail (A1) ─────────────────────────────────────────────────
 *
 * The screen where the boundary is visible rather than merely enforced. Two panels: what
 * the carrier's own book evidences, and what the business has disclosed to them. The
 * second is usually empty, and the empty state explains why instead of looking broken.
 */
async function carDetail(el) {
  const id = S.carAccount;
  if (!id) { nav8("car-triage"); return; }
  el.innerHTML = spinner("Opening account");
  const d = await api(`/api/carrier/account/${encodeURIComponent(id)}`); if (!d) return;
  const book = d.from_your_book || {};
  const detail = d.case_detail;

  el.innerHTML = `<div class="synthetic-banner">DEMO PORTFOLIO — SYNTHETIC DATA</div>
    <button class="btn btn-ghost btn-sm mb-12" data-act="nav" data-arg="car-triage">← Back to queue</button>
    ${pageTitle(d.account.business_name || "Account", `${esc(d.account.industry || "")} · ${esc(d.account.account_id)}`)}

    <div class="sub-head">From your own book</div>
    <div class="stats mb-16">
      <div class="stat"><div class="val">${esc(book.priority || "—")}</div><div class="lbl">Priority</div></div>
      <div class="stat red"><div class="val">${esc(book.unestablished_count ?? "—")}</div><div class="lbl">Unevidenced items</div></div>
      <div class="stat amber"><div class="val">${esc(book.internal_change || "—")}</div><div class="lbl">Internal change</div></div>
      <div class="stat purple"><div class="val">${esc(book.external_risk || "—")}</div><div class="lbl">External risk</div></div>
    </div>
    <div class="card mb-16">
      <div class="card-head"><h3>What surfaced it</h3></div>
      <p class="text-sm">${esc(book.lead_reason || "")}</p>
      <p class="text-xs text-muted mt-8">Adviser: ${esc(book.adviser || "none assigned")}
        · Last reviewed: ${esc(book.last_reviewed || "—")}</p>
    </div>

    <div class="sub-head">What the engine concluded, by insured interest</div>
    <div id="car-decisions">${spinner("Reconciling internal and external signals")}</div>

    <div class="sub-head">The business's own case</div>
    ${detail ? `<div class="card mb-16">
        <div class="card-head"><h3>Disclosed to you</h3><span class="tag tag-success">${esc(detail.disclosed_fields?.length || 0)} document kinds</span></div>
        <p class="text-sm mb-12">${esc(d.case_detail_notice)}</p>
        ${(detail.findings || []).slice(0, 8).map(f => renderFinding(f)).join("")}
        ${detail.findings_withheld_count ? `<p class="text-xs text-muted mt-12">${detail.findings_withheld_count} finding(s) withheld — the documents behind them were not disclosed.</p>` : ""}
      </div>`
    : `<div class="partial mb-16">
        <div class="partial__t">Not disclosed to you</div>
        <div class="partial__s">${esc(d.case_detail_notice)}</div>
      </div>`}

    <div class="sub-head">Record what you decided</div>
    <div class="card mb-16">
      <div class="form-group"><label>Decision</label>
        <select id="cdec" style="width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);font:inherit">
          <option value="REVIEWED">Reviewed, no action</option>
          <option value="ACCEPTED_AS_IS">Accepted as it stands</option>
          <option value="NEEDS_ENDORSEMENT">Needs an endorsement</option>
          <option value="REFERRED_TO_ADVISER">Referred to the adviser</option>
        </select></div>
      <div class="form-group"><label>Note</label>
        <input type="text" id="cnote" maxlength="600" placeholder="What you observed, and what you decided about the account"></div>
      <button class="btn btn-primary" id="cdecbtn">Record decision</button>
      <div id="cdecout" class="mt-12"></div>
      <p class="text-xs text-muted mt-12">Append-only. A note may not state a claim outcome — record what you observed.</p>
    </div>

    <div class="sub-head">History</div>
    <div class="card"><div id="cdechist">${carDecisionRows(d.decisions)}</div></div>`;

  /* The orchestrator's reconciliation, rendered with the SAME component the owner sees.
   *
   * Deliberately the same `renderDecision()` rather than an underwriter-specific variant. The
   * product's claim is that all three roles read ONE set of facts; two renderers for one
   * decision is how the carrier's view and the owner's view start quietly diverging, and then
   * nobody can tell which is authoritative.
   *
   * It reconciles internal signals against external ones and reports where both point the same
   * way — which is exactly the judgement an underwriter is making by hand, and it carries no
   * premium and no risk score. */
  (async () => {
    const host = $("#car-decisions");
    if (!host) return;
    try {
      const o = await api("/api/orchestrator/evaluate");
      const decisions = (o && o.decisions) || [];
      host.innerHTML = decisions.length
        ? `<div class="findings">${decisions.map(renderDecision).join("")}</div>
           ${o.highest ? `<p class="text-xs text-muted mt-12">Highest attention:
             ${esc(humanDecision(o.highest))}. ${esc(o.notice || "")}</p>` : ""}`
        : `<p class="text-sm text-muted">The orchestrator reconciled nothing for this
             account — there is no internal or external signal to weigh.</p>`;
    } catch (err) {
      host.innerHTML = `<div class="insight warn"><div class="insight-text">${esc(
        err.message || String(err))}</div></div>`;
    }
  })();

  const btn = $("#cdecbtn");
  if (btn) btn.onclick = async () => {
    const out = $("#cdecout");
    btn.disabled = true;
    try {
      const r = await api("/api/carrier/decision", { method: "POST", body: {
        account_id: id, decision: $("#cdec").value, note: $("#cnote").value } });
      if (r && r.ok) {
        $("#cdechist").innerHTML = carDecisionRows(r.decisions);
        $("#cnote").value = "";
        out.innerHTML = `<div class="insight"><div class="insight-text">${esc(r.notice)}</div></div>`;
      }
    } catch (err) {
      out.innerHTML = `<div class="insight critical"><div class="insight-label">Refused</div>
        <div class="insight-text">${esc(err.message || String(err))}</div></div>`;
    } finally { btn.disabled = false; }
  };
}

function carDecisionRows(rows) {
  if (!rows || !rows.length) return `<p class="text-sm text-muted">Nothing recorded yet.</p>`;
  return `<table><thead><tr><th>When</th><th>Decision</th><th>Note</th><th>By</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td class="text-xs text-muted">${esc(String(r.at).slice(0, 16).replace("T", " "))}</td>
      <td><span class="tag">${esc(r.decision_label)}</span></td>
      <td class="text-sm">${esc(r.note || "—")}</td>
      <td class="text-xs">${esc(r.by)}</td></tr>`).join("")}
  </tbody></table>`;
}

/* ── Decision log (A4) ───────────────────────────────────────────────────── */
async function carDecisions(el) {
  el.innerHTML = spinner();
  const d = await api("/api/carrier/decisions"); if (!d) return;
  el.innerHTML = pageTitle("Decision log",
      `${d.count} record(s). Append-only — nothing here can be edited or removed.`)
    + `<div class="card">${carDecisionRows(d.decisions)}</div>
    <div class="honest">${esc(d.notice || "")}</div>`;
}

/* ── Book patterns (B5) ──────────────────────────────────────────────────
 *
 * A pattern is a count against a stated threshold, not an inference. The threshold is
 * shown because "a third of your book" and "we detected a pattern" are very different
 * claims and only one of them can be checked.
 */
async function carPatterns(el) {
  el.innerHTML = spinner("Counting across the book");
  const d = await api("/api/carrier/patterns"); if (!d) return;
  if (d.available === false) { el.innerHTML = noBookState(d); return; }
  const found = d.patterns || [];
  el.innerHTML = `<div class="synthetic-banner">DEMO PORTFOLIO — SYNTHETIC DATA</div>
    ${pageTitle("Book patterns",
      `Concentrations affecting at least ${d.thresholds.minimum_share_pct}% of the book.`)}
    ${found.length === 0 ? emptyState("No concentration found",
      `Nothing on this book reaches the ${d.thresholds.minimum_share_pct}% threshold.`) : ""}
    ${found.map(p => `<div class="dep">
      <div class="dep__head">
        <span class="dep__kind">${esc(titleCase(p.kind))}</span>
        <span class="dep__name">${esc(p.label)}</span>
        <span class="tag tag-HIGH">${p.count} of ${p.of} · ${p.share_pct}%</span>
      </div>
      <div class="dep__why">${esc(p.reading)}</div>
      <ul class="area__list mt-8">${(p.accounts || []).map(a => `<li>${esc(a)}</li>`).join("")}</ul>
    </div>`).join("")}
    <div class="honest"><b>How these were found.</b> ${esc(d.basis || "")}<br><br>${esc(d.notice || "")}</div>`;
}

/* ── Coverage Gap Analysis — the list-first carrier landing ─────────────────
 *
 * A book-of-business list, one row per account, in the shape underwriters expect: who,
 * what surfaced, status, how many items are still unestablished, who owns it, when it was
 * last looked at. Every column is a REAL field from /api/carrier/portfolio — no fabricated
 * "coverage type" or invented source filenames. The portfolio is synthetic demo data and
 * says so in the banner.
 *
 * "Create new analysis" is deliberately honest: an analysis begins when a business uploads
 * its documents, so the button explains that rather than pretending to spawn one. The
 * keyword filter is real and runs client-side over the rows already loaded.
 */
const _CAR_STATUS = {
  ADVISER_REVIEWING: { label: "In review", tone: "success" },
  INFORMATION_REQUESTED: { label: "Information requested", tone: "warning" },
  UNASSIGNED: { label: "Unassigned", tone: "" },
};
function carStatus(state) {
  return _CAR_STATUS[state] || { label: titleCase(state || ""), tone: "" };
}

async function carAnalyses(el) {
  el.innerHTML = `<div class="loading"><div class="spinner"></div>Loading analyses</div>`;
  const d = await api("/api/carrier/portfolio"); if (!d) return;
  const accounts = d.accounts || [];

  // Columns follow the REAL account shape. `priority`, `lead_reason`, `adviser`,
  // `last_reviewed` and `industry` were per-row invented labels on the old fixture and no
  // longer exist; what a real case carries is its finding counts by evidence class and by
  // output state, which is what an underwriter can actually act on.
  const rowHtml = a => {
    const kw = `${a.business_name || ""} ${a.carrier || ""}`.toLowerCase();
    const cls = a.by_evidence_class || {};
    return `<tr data-kw="${esc(kw)}">
      <td class="td-name">${esc(a.business_name || "")}
        <div class="text-xs text-muted">${esc(a.carrier || "")}${a.documents_are_synthetic ? " · example documents" : ""}</div></td>
      <td>${a.findings_total ?? 0}</td>
      <td><span class="tag tag-success">${cls.PROVEN ?? 0}</span></td>
      <td>${cls.UNESTABLISHED ?? 0}</td>
      <td>${a.needs_authorised_review ?? 0}</td>
      <td>${a.information_missing ?? 0}</td>
      <td>${a.abstained ?? 0}</td>
    </tr>`;
  };

  el.innerHTML = `
    <div class="page-title" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
      <div><h1>Coverage gap analysis</h1><p>${accounts.length} case(s) held · every column computed, none authored</p></div>
    </div>
    ${accounts.length === 0 ? emptyState("No case to analyse",
        esc(d.honest_statement || "") + " A carrier holds no individual business's documents unless that business discloses them, which is the role boundary working rather than a fault.",
        `<button class="btn btn-sm btn-primary" data-act="nav" data-arg="car-portfolio">Open the wording portfolio →</button>`) : `
    <div class="card" style="padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <input type="search" id="car-filter" placeholder="Filter by keyword…" aria-label="Filter analyses by keyword" style="flex:1;min-width:220px;padding:8px 12px">
      <span class="text-xs text-muted" id="car-count">${accounts.length} shown</span>
    </div>
    <div class="card"><table>
      <thead><tr>
        <th>Business</th><th>Findings</th><th>PROVEN</th><th>Unestablished</th>
        <th>Needs a human</th><th>Missing a document</th><th>Abstained</th>
      </tr></thead>
      <tbody id="car-rows">${accounts.map(rowHtml).join("")}</tbody>
    </table></div>`}
    <p class="text-sm text-muted">${esc(d.notice || "")} Every column is a count the engine produced: how many findings rest on third-party or authority documents, how many could not be established at all, how many turn on a judgement software may not make, and how many the engine declined to answer. There is no breach, violation or risk-score column — by design.</p>`;

  // Real client-side keyword filter over the rows already loaded.
  const input = $("#car-filter"), count = $("#car-count");
  if (input) input.oninput = () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    $$("#car-rows tr").forEach(tr => {
      const hit = !q || (tr.dataset.kw || "").includes(q);
      tr.style.display = hit ? "" : "none";
      if (hit) shown += 1;
    });
    if (count) count.textContent = `${shown} shown`;
  };

  // Honest "create" affordance: an analysis starts from a business's uploaded documents.
  const newBtn = $("#car-new");
  if (newBtn) newBtn.onclick = () => toast(
    "An analysis begins when a business uploads its documents. This book reflects analyses already run — nothing is fabricated here.", "");
}

/* THE CARRIER'S FLAGSHIP SCREEN, REBUILT ON REAL OUTPUT.
 *
 * What this replaced: four stat tiles and a 3x3 grid computed from six invented
 * businesses whose `internal_change` and `external_risk` were hand-typed per row. The
 * grid looked like a measurement and measured the fixture.
 *
 * What is here instead answers a question an underwriter actually has and that published
 * documents can answer: what does my wording do to an insured, and how does it compare
 * with the wording the competitor across the street is using? Chubb cuts payment below
 * 85% adequacy. MSIG cuts from the first dollar short. Liberty carries three provisions
 * on different settlement bases. Nothing in the market tells an underwriter that, and
 * every cell here is traceable to a page in a document in this repository.
 */
const SEVERITY_COPY = {
  HARSHEST: { tag: "danger", label: "Harshest on the insured" },
  SPLIT: { tag: "warn", label: "Depends on settlement basis" },
  CUSHIONED: { tag: "success", label: "Tolerates a shortfall" },
  HARSHEST_UNCONFIRMED: { tag: "danger", label: "Harshest (unconfirmed)" },
  SPLIT_UNCONFIRMED: { tag: "warn", label: "Split (unconfirmed)" },
  CUSHIONED_UNCONFIRMED: { tag: "success", label: "Cushioned (unconfirmed)" },
};

function severityTag(sev) {
  if (!sev) return `<span class="tag">Not located</span>`;
  const c = SEVERITY_COPY[sev] || { tag: "", label: sev };
  return `<span class="tag tag-${c.tag}">${esc(c.label)}</span>`;
}

function provisionCell(m) {
  if (!m || m.state !== "ALIGNED") {
    return `<span class="text-xs text-muted">not located</span>`;
  }
  return (m.provisions || []).map(p => {
    const v = p.values || {};
    const thr = v.threshold_pct ? `below ${esc(v.threshold_pct)}%` : "first dollar short";
    const basis = v.settlement_basis
      ? ` · ${esc(String(v.settlement_basis).toLowerCase().replace(/_/g, " "))}` : "";
    return `<div class="text-xs">${esc(p.called || "clause")} — p.${p.page_no ?? "?"}<br>
      <strong>${thr}</strong>${basis}</div>`;
  }).join(`<div style="height:6px"></div>`);
}

async function carPortfolio(el) {
  el.innerHTML = spinner("Aligning published wordings");
  const d = await api("/api/carrier/portfolio"); if (!d) return;
  const wp = d.wording_portfolio || {};
  const counts = wp.counts || {};
  const div = wp.divergence || {};
  const sg = (wp.wordings || []).filter(w => w.jurisdiction === "SG");
  const other = (wp.wordings || []).filter(w => w.jurisdiction !== "SG");

  el.innerHTML = `
    ${pageTitle("Wording portfolio",
      "What each published wording does to an insured, read from the document.")}

    <div class="stats">
      <div class="stat"><div class="val">${counts.wordings ?? 0}</div>
        <div class="lbl">Wordings read</div><div class="sub">${counts.pages_read ?? 0} pages</div></div>
      <div class="stat red"><div class="val">${div.diverging ?? 0}/${div.compared ?? 0}</div>
        <div class="lbl">Mechanisms that diverge</div><div class="sub">Cannot be hardcoded</div></div>
      <div class="stat amber"><div class="val">${counts.never_hand_mapped ?? 0}</div>
        <div class="lbl">Never hand-mapped</div><div class="sub">Found by structure alone</div></div>
      <div class="stat"><div class="val">${d.totals ? d.totals.accounts : 0}</div>
        <div class="lbl">Accounts held</div><div class="sub">Real count, not a projection</div></div>
    </div>

    <div class="insight mb-16"><div class="insight-label">Why this matters commercially</div>
      <div class="insight-text">${esc((div.what_it_means) || "")}</div></div>

    <div class="card mb-16">
      <div class="card-head"><h3>Singapore wordings, side by side</h3></div>
      <table><thead><tr>
        <th>Carrier</th><th>Under-insurance</th><th>Unoccupancy</th>
        <th>Premium warranty</th><th>Compliance condition</th><th>Effect on insured</th>
      </tr></thead><tbody>
        ${sg.map(w => `<tr>
          <td class="td-name">${esc(w.carrier)}<br><span class="text-xs text-muted">${esc(w.product || "")}${w.published ? " · " + esc(w.published) : ""}</span></td>
          <td>${provisionCell((w.mechanisms || {})["ADEQ.PROPORTIONATE_REDUCTION"])}</td>
          <td>${provisionCell((w.mechanisms || {})["COND.UNOCCUPANCY"])}</td>
          <td>${provisionCell((w.mechanisms || {})["COND.PREMIUM_PAYMENT_WARRANTY"])}</td>
          <td>${provisionCell((w.mechanisms || {})["COND.DECLARATION_CLAUSE_GENERAL"])}</td>
          <td>${severityTag(w.severity_for_insured)}<br><span class="text-xs text-muted">${esc(w.severity_because || "")}</span></td>
        </tr>`).join("")}
      </tbody></table>
    </div>

    <div class="card mb-16">
      <div class="card-head"><h3>Does the method travel? ${counts.never_hand_mapped ?? 0} wordings nobody read</h3></div>
      <p class="text-sm">No clause map exists for these, so anything found was found from the structure of the text alone. This is the scaling claim, measured rather than asserted.</p>
      <table><thead><tr><th>Wording</th><th>Pages</th><th>Proposals</th><th>Bound</th><th>Rejected</th><th>Effect on insured</th></tr></thead><tbody>
        ${other.map(w => `<tr>
          <td class="td-name">${esc(w.carrier)}<br><span class="text-xs text-muted">${esc(w.product || "")}</span></td>
          <td>${w.pages}</td>
          <td>${(w.alignment || {}).proposals ?? 0}</td>
          <td>${(w.alignment || {}).verified ?? 0}</td>
          <td>${(w.alignment || {}).rejected ?? 0}
            <span class="text-xs text-muted">(${Math.round(((w.alignment || {}).rejection_rate || 0) * 100)}%)</span></td>
          <td>${severityTag(w.severity_for_insured)}</td>
        </tr>`).join("")}
      </tbody></table>
      <p class="text-sm text-muted mt-12">A high rejection rate is the verifier working, not failing. A proposal is only bound when every mandatory structural element matches and no disqualifying one does, so most candidates are correctly thrown away.</p>
    </div>

    <div class="card mb-16">
      <div class="card-head"><h3>Accounts held</h3></div>
      <p class="text-sm">${esc(d.honest_statement || "")}</p>
      ${(d.accounts || []).length ? `<table><thead><tr><th>Business</th><th>Carrier</th><th>Findings</th><th>PROVEN</th><th>Needs review</th></tr></thead><tbody>
        ${(d.accounts || []).map(a => `<tr>
          <td class="td-name">${esc(a.business_name || "")}</td>
          <td>${esc(a.carrier || "")}</td>
          <td>${a.findings_total ?? 0}</td>
          <td>${(a.by_evidence_class || {}).PROVEN ?? 0}</td>
          <td>${a.needs_authorised_review ?? 0}</td>
        </tr>`).join("")}</tbody></table>` : ""}
    </div>

    <p class="text-sm text-muted">${esc(d.notice || "")}</p>`;
}

async function carPremium(el) {
  el.innerHTML = `<div class="loading"><div class="spinner"></div>Computing premium at risk</div>`;
  const d = await api("/api/carrier/premium-at-risk"); if (!d) return;
  if (d.available === false) { el.innerHTML = noBookState(d); return; }
  const gaps = d.gaps || [];
  el.innerHTML = `<div class="synthetic-banner">DEMONSTRATION — SYNTHETIC PORTFOLIO DATA. Rates are illustrative market averages, not quotations.</div>
    <div class="page-title"><h1>Premium at Risk</h1><p>The revenue absent from the book — not a risk judgement, not a quotation.</p></div>
    <div class="card mb-16 text-center" style="padding:32px">
      <h2 style="font-size:36px;font-weight:800;color:var(--danger);letter-spacing:-0.02em">${money(d.total_premium_at_risk_sgd)}<span style="font-size:16px;font-weight:500;color:var(--text-3)"> /year</span></h2>
      <p class="text-sm text-muted mt-8">${esc(d.headline)}</p>
    </div>
    <div class="stats">
      <div class="stat red"><div class="val">${d.accounts_drifted}</div><div class="lbl">Accounts Drifted</div><div class="sub">${esc(d.drift_rate_pct)} of book</div></div>
      <div class="stat amber"><div class="val">${money(d.total_exposure_gap_sgd)}</div><div class="lbl">Total Exposure Gap</div><div class="sub">Documented value minus insured value</div></div>
      <div class="stat"><div class="val">${d.accounts_total}</div><div class="lbl">Total Accounts</div></div>
    </div>
    <div class="card mb-16"><div class="card-head"><h3>By Insured Interest</h3></div>
      <table><thead><tr><th>Interest</th><th>Exposure Gap</th><th>Implied Premium</th><th>Accounts</th></tr></thead><tbody>
        ${Object.entries(d.by_interest || {}).map(([k, v]) => `<tr><td class="td-name">${esc(titleCase(k))}</td><td>${money(v.gap_sgd)}</td><td style="font-weight:700;color:var(--danger)">${money(v.premium_sgd)}</td><td>${v.count}</td></tr>`).join("")}
      </tbody></table>
    </div>
    <div class="card"><div class="card-head"><h3>Largest Gaps</h3></div>
      <table><thead><tr><th>Account</th><th>Interest</th><th>Exposure Gap</th><th>Implied Premium</th><th>Basis</th></tr></thead><tbody>
        ${gaps.slice(0, 10).map(g => `<tr><td class="td-name">${esc(g.business_name)}</td><td>${esc(titleCase(g.interest))}</td><td>${money(g.gap_sgd)}</td><td style="font-weight:700;color:var(--danger)">${money(g.implied_premium_sgd)}</td><td class="text-sm text-muted">${esc(g.basis)}</td></tr>`).join("")}
      </tbody></table>
    </div>
    <div class="insight warn mt-16"><div class="insight-label">Rate notice</div><div class="insight-text">${esc(d.rate_notice)}</div></div>`;
}

/* The attention matrix is a 3x3 grid keyed grid[internal][external] over LOW/MED/HIGH,
   plus a priority_cell naming the worst occupied cell. It was previously read as a 2x2 of
   high_high / high_low / low_high / low_low — keys that do not exist on the response, so
   every cell silently rendered 0 and the most important screen in the carrier view showed
   an empty matrix. */
const _MX_ROWS = ["HIGH", "MED", "LOW"];
const _MX_COLS = ["LOW", "MED", "HIGH"];

function matrixHtml(am) {
  const grid = (am || {}).grid || {};
  const pc = (am || {}).priority_cell || {};
  const axes = (am || {}).axes || {};
  const rows = _MX_ROWS.map(internal => {
    const cells = _MX_COLS.map(external => {
      const n = ((grid[internal] || {})[external]) ?? 0;
      const hot = pc.internal === internal && pc.external === external;
      const bg = hot ? "var(--danger-light,#fce8e6)" : (n > 0 ? "var(--surface-2,#f5f5f5)" : "transparent");
      const bd = hot ? "var(--danger,#c5221f)" : "var(--border-subtle,#e5e5e5)";
      return `<td style="text-align:center;padding:12px;background:${bg};border:1px solid ${bd}">
        <div style="font-size:1.6rem;font-weight:700;line-height:1">${n}</div>
        ${hot ? '<div class="text-xs" style="color:var(--danger,#c5221f);font-weight:700;margin-top:4px">PRIORITY</div>' : ""}
      </td>`;
    }).join("");
    return `<tr><th style="text-align:right;padding-right:10px;font-size:11px;font-weight:700;color:var(--text-4)">${internal}</th>${cells}</tr>`;
  }).join("");
  return `<table style="width:100%;border-collapse:collapse">
      <thead><tr><th></th>${_MX_COLS.map(c => `<th style="font-size:11px;font-weight:700;color:var(--text-4);padding-bottom:6px">${c}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="text-xs text-muted mt-8">Rows: ${esc(axes.y || "Internal business change")} &nbsp;·&nbsp; Columns: ${esc(axes.x || "External risk")}</div>`;
}

async function carMatrix(el) {
  const d = await api("/api/carrier/portfolio"); if (!d) return;
  // The matrix is gone with the invented rows that fed it. Both of its axes were
  // hand-typed per fictional account, so the grid was a strong visual claim about
  // businesses that do not exist. It returns when there is a book to plot.
  if (!d.attention_matrix) {
    el.innerHTML = noBookState({
      operation: "attention_matrix",
      reason: "The attention matrix plotted business drift against environmental risk "
            + "across the book. Both axes were hand-typed per invented account, so the "
            + "grid measured the fixture rather than anything real. It has been removed "
            + "rather than left to look like a measurement.",
      would_need: "A book of real cases, each with a documented change history and a "
                + "located premises, so both axes can be computed instead of authored.",
      what_is_real_today: "The wording portfolio compares four coverage mechanisms "
                        + "across seven published wordings, all read from the documents.",
    });
    return;
  }
  const mx = d.attention_matrix || {};
  el.innerHTML = `<div class="synthetic-banner">DEMO PORTFOLIO — SYNTHETIC DATA</div>
    <div class="page-title"><h1>Protection Attention Matrix</h1><p>Internal business drift × External risk environment</p></div>
    <div class="card"><div style="max-width:500px;margin:0 auto">
      <div style="text-align:center;margin-bottom:8px;font-size:11px;font-weight:700;color:var(--text-4)">EXTERNAL RISK →</div>
      <div style="display:flex;align-items:center;gap:16px">
        <div style="writing-mode:vertical-lr;transform:rotate(180deg);font-size:11px;font-weight:700;color:var(--text-4)">INTERNAL DRIFT →</div>
        <div style="flex:1">${matrixHtml(mx)}</div>
      </div>
    </div></div>
    <p class="text-xs text-muted mt-16">Attention, not adjudication. Both axes are observations. There is no breach or violation column.</p>`;
}

async function carAccounts(el) {
  const d = await api("/api/carrier/portfolio"); if (!d) return;
  // `internal_change` and `external_risk` were per-row invented labels and are gone, so
  // there is nothing left to filter on. Real accounts are ranked by findings that need an
  // authorised human, which is a property the engine actually computes.
  const accounts = (d.accounts || [])
    .slice()
    .sort((a, b) => (b.needs_authorised_review ?? 0) - (a.needs_authorised_review ?? 0))
    .slice(0, 20);
  if (!accounts.length) {
    el.innerHTML = noBookState({
      operation: "priority_accounts",
      reason: (d.honest_statement || "")
            + " Ranking accounts requires accounts; this screen previously ranked six "
            + "invented businesses by two hand-typed labels.",
      would_need: "At least one disclosed case, or a carrier-initiated pilot over an "
                + "in-force book. The ranking itself is already implemented and tested.",
      what_is_real_today: "The wording portfolio needs no book and is computed live over "
                        + "the published wordings in this repository.",
    });
    return;
  }
  el.innerHTML = `
    ${pageTitle("Accounts needing a human",
      `${accounts.length} account(s), ranked by findings a licensed adviser must resolve.`)}
    <div class="card"><table><thead><tr>
      <th>Business</th><th>Carrier</th><th>Findings</th><th>PROVEN</th>
      <th>Needs authorised review</th><th>Information missing</th>
    </tr></thead><tbody>
      ${accounts.map(a => `<tr>
        <td class="td-name">${esc(a.business_name || "")}</td>
        <td>${esc(a.carrier || "")}</td>
        <td>${a.findings_total ?? 0}</td>
        <td>${(a.by_evidence_class || {}).PROVEN ?? 0}</td>
        <td>${a.needs_authorised_review ?? 0}</td>
        <td>${a.information_missing ?? 0}</td>
      </tr>`).join("")}
    </tbody></table></div>
    <p class="text-sm text-muted">Ranked on a computed property — how many findings turn on a judgement software may not make — rather than on a severity label. There is no breach, violation or risk-score column here or anywhere in the schema.</p>`;
}

/* ── Init ─────────────────────────────────────────────────────────────── */
render();
