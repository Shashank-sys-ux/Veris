# Finalized idea — errors and verification against the hackathon rules

**Checked:** `finalized-idea.md` against `03-sessions/session-1.md`, the governing T&C (`2026 Hackcelerate TnC (2025 05 25).pdf`, extracted in full to `01-competition/tnc-fulltext.txt`), and live sources.
**Method:** the T&C PDF was parsed with pypdf rather than trusted from a search snippet — the same standard the finalized idea claims to hold itself to. All 11 pages read.

**Verdict up front:** the deadline is resolved and it is good news. Two factual errors were found in the finalized idea's own regulatory section, both fixable and neither fatal. One clause materially strengthens a compliance claim already made. One open item from `03-sessions/session-1.md` remains genuinely open.

---

## 1. RESOLVED: registration deadline is 14 August 2026, 2359 SGT

`03-sessions/session-1.md` flagged this as unconfirmed, and my own prior turns kept finding the T&C page unreadable via `web_fetch` (it returns raw PDF binary or a JS shell). Resolved two ways this session:

**From the T&C itself, clause 7.3 (verbatim from the parsed PDF):**
> "Registration for this Competition closes on 14 August 2026, 2359 (Singapore Time) ('Closing Date')."

**Independently corroborated** by a live, dynamically-rendered countdown on a third-party listing (youthop.com), read today: *"Application Deadline: August 14, 2026 (2 Days Remaining)."* A dynamic countdown that still shows the deadline in the future is strong evidence the date has not passed and has not been extended past it.

**The `24 July 2026` date on `defunct.fintechfestival.sg` is confirmed stale.** That subdomain is a pre-launch staging build (it still carries 2025 FAQ content and placeholder investor logos, as flagged in earlier sessions). The governing T&C — the actual legally binding document — says 14 August, and it is dated 2025-05-25, predating the stray 24 July figure. **Trust the T&C.**

**Action for the team:** registration closes tonight/tomorrow depending on time zone read. This is no longer an open question — it is a countdown. If the roster (Chithsukhi, Shashank) isn't decided, decide it now; clause 7.5 (below) is unforgiving.

---

## 2. ERROR in `finalized-idea.md` §12: FAA/Insurance Act structure is not sourced to the T&C

This is not a T&C problem — it's a citation-provenance problem, and it's the same class of error as the *Grace Electrical* mistake caught earlier this session.

**What `finalized-idea.md` §12 claims:**
> "A tool that reads a business's own general insurance documents and states findings sits outside the Financial Advisers Act... Brokers acting for policyholders register with MAS under the Insurance Act; general insurance agents acting for insurers register with the General Insurance Association of Singapore."

**What I checked:** the governing T&C (`2026 Hackcelerate TnC (2025 05 25).pdf`) says **nothing** about the FAA, the Insurance Act, or GIA registration. It is silent on Singapore financial-services licensing entirely, because it is a competition-participation contract, not a regulatory framework. That's expected and correct — but §12 of `finalized-idea.md` presents this regulatory analysis in the same document and same register as its T&C-derived claims, without distinguishing the source.

**This is not necessarily wrong as law** — it traces back to `05-research/zurich-regulatory-singapore.md`, which cites Baker McKenzie's practitioner guide. But `finalized-idea.md` itself doesn't carry that citation forward into §12; it states the FAA/Insurance Act position as if self-evident. Given that the *Grace Electrical* error happened exactly this way — a claim repeated without the reader tracing it back to the primary or even secondary source in the document making the claim — this is worth flagging as the same failure mode, caught before it repeats.

**Fix:** §12 should carry an inline footnote pointing to `05-research/zurich-regulatory-singapore.md §B1` (Baker McKenzie) rather than stating the FAA/Insurance Act split as if it were established independently. Low severity, easy fix, but consistent with the standard the document sets for itself in §18 item 13 ("re-verify every case and clause citation").

---

## 3. ERROR: `finalized-idea.md` cites T&C clauses correctly in substance but two numbers need a second look

Cross-checked every clause number `finalized-idea.md` and `03-sessions/session-1.md` cite against the actual parsed text.

| Claim in `finalized-idea.md` / `03-sessions/session-1.md` | T&C text found | Verdict |
|---|---|---|
| "Clause 4.1 — open to anyone 18+ with a market-ready solution" | 4.1: "open to interested parties with a market-ready solution... Participants must be aged 18 and above" | **Correct** |
| "Clause 5.1 is the real bar: demonstrable ability and track record" | 5.1: "demonstrate... ability and track record of developing scalable technology solutions" | **Correct** |
| "Teams up to 10 (Clause 5.2), roster frozen after 14 August (Clause 7.5)" | 5.2: "not more than 10 members." **7.5, exact text: "Except with the prior written consent of GFTN SERVICES, no amendments shall be made to any registrations (including the composition of any team) after the Closing Date."** | **Correct, and worth emphasising**: this is not a soft norm, it's an absolute bar subject only to GFTN's discretionary written consent. `finalized-idea.md` §15 and §18 treat this correctly as a hard freeze. |
| "Anti-duplication (Clause 12.1(o)(iii))" | 12.1(o)(iii), exact text: "substantially duplicate's another submitted Project or Solution previously entered in the Portal **or otherwise any other Competition** (by you or another Participant)" | **Correct**, and confirms the RDTII-AEGIS exposure is real — "any other Competition" is not limited to this Portal. |
| "12.1(q) makes violations grounds for immediate disqualification" | 12.1(q): "Any violations related to the above will result in immediate disqualification." | **Correct** |
| "Clause 14.2 protects IP created before and during the competition" | 14.2: "You will retain ownership over any IP... developed, created or generated by you prior to and during the Competition." | **Correct.** Note the licence granted back is explicitly "non-commercial" — `finalized-idea.md` §18's "present prior work as background IP" framing is consistent with this. |
| "S$20,000 stipend... S$80,000 prize... per team" (session-1, §4) | 10.1: stipend "before tax". 10.2: "SGD 80,000 before tax... three (3) Problem Statements, bringing the total prize pool to SGD 240,000." | **Correct**, though session-1 doesn't quote the "before tax and any additional charges" qualifier on both — minor completeness gap in session-1, not in finalized-idea.md, which doesn't repeat the money clauses. |
| "8.5: up to 20 shortlisted teams" | 8.4/8.5: confirmed, panel decision "final and binding. No appeal shall be entertained." | **Correct** |
| "8.3: reclassification to a different Problem Statement" | 8.3, exact text: "The Organisers may, in their sole discretion, decide that a submitted Solution to a certain Problem Statement be reclassified or reassigned to another Problem Statement." | **Correct**, and this is the clause `finalized-idea.md` §17 red-team item references correctly re: Zurich reassignment risk. |
| "21.3 — Ambiguity resolves in GFTN's favour" | 21.3, exact text: "such conflict, inconsistency or ambiguity shall be resolved in favour of GFTN SERVICES and the provision or interpretation which is more favourable to GFTN SERVICES shall prevail." | **Correct, and understated if anything** — worth noting for the team that this is not a passive tiebreaker; GFTN also gets sole discretion to *decide what counts as* more favourable to itself. |

**No clause-number errors found.** `03-sessions/session-1.md`'s clause citations are accurate against the primary document, which is reassuring given they were sourced from a summary per its own admission. The one gap is §12 of `finalized-idea.md` not tracing its regulatory claims back through the chain, per item 2 above.

---

## 4. NEW FINDING: clause 9.6 (open source declaration) is more specific than `finalized-idea.md` credits

`finalized-idea.md` §13 cites clause 9.6 in passing ("declarable under clause 9.6"). The actual text is more demanding than a passing citation implies:

> "9.6. You are permitted to use open source materials... provided that you (a) comply fully with all applicable terms and conditions of the Open Source Materials, (b) have the requisite rights and permission to use the Open Source Materials in your Solutions and the Competition, and (c) **clearly indicate the specific Open Source Materials used as part of your Solutions and what role or part such Open Source Materials plays in your Solutions.**"

Part (c) is a per-component role disclosure, not a blanket licence list. `finalized-idea.md`'s evidence plan (§13) names specific corpora (LMA model wordings, ContractNLI, CUAD) and flags InsuranceQA and LegalBench as unsuitable — that discipline is good and should be extended explicitly to code dependencies (pypdf, any OCR library, any ML framework) with a stated role for each, not just data. **Not currently in the document. Add a short open-source appendix before submission**, listing each dependency and the specific role it plays, per 9.6(c)'s literal wording.

---

## 5. NEW FINDING: clause 9.2 sharpens an open item already flagged

`finalized-idea.md` §18 item 1 already flags the artefact deadline as unresolved and recommends confirming in writing with gfh@gftn.com. The T&C text makes clear *why* this cannot be resolved from the T&C alone, and confirms `03-sessions/session-1.md`'s reading was right:

> "9.2. The final submission must be registered and made available to the Panel via the Portal **before the deadline published on the Hackcelerator website.**"

The T&C explicitly punts the artefact deadline to the website, and clause 8.1 makes tracking it "solely" the participant's responsibility, with the Organiser bearing no responsibility for "misunderstanding... or failure to review" published information. This is a genuinely open item, correctly identified as open in both `03-sessions/session-1.md` and `finalized-idea.md §18 item 1`. **No error — confirms the existing open item is real and cannot be closed from documents already in hand.** The email to gfh@gftn.com remains the only path to closing it, and given item 1 above (registration closes imminently), that email should go out today regardless of registration status.

---

## 6. NEW FINDING: clause 11.4(a)/12.1(p)(i) — a technical risk not previously flagged

Neither `03-sessions/session-1.md` nor `finalized-idea.md` mention this, and it's relevant to the evidence-plan and demo build:

> "12.1(p)(i): uses manual or automated software, devices, scripts robots, or other means or processes to access, 'scrape,' 'crawl' or 'spider' the Website and/or Portal, or any related data or information" — prohibited, grounds for disqualification per 12.1(q).

This binds the **Portal and Website**, not third-party sources — it does not retroactively prohibit the wordings scraping already done in `06-evidence/policy-wordings/` (Chubb Select+, the Grace Electrical judgment, etc., none of which are the GFTN Portal or Website). **No conflict with work done so far.** Flagging only because the team's toolchain (Playwright, from the RDTII-AEGIS background) should not be pointed at `hackcelerator.gftn.co` or `forms.gftn.co` for any reason, including testing.

---

## 7. Confirmed: no conflict between `finalized-idea.md`'s anti-duplication posture and the T&C

`finalized-idea.md` §18 states: "New repository, new taxonomy... RDTII-AEGIS went to UN ESCAP... Present the prior work as background IP under clause 14.2. Port no code."

Checked against the full text of 12.1(o)(iii) and 14.2 above: this posture is **correct and necessary**, not merely cautious. 12.1(o)(iii)'s "or otherwise any other Competition" wording is broader than a narrower reading of "duplicate content on this Portal" would suggest — it is an absolute bar against resubmitting substance from *any* prior competition, and 14.2's IP-retention clause is exactly what makes "reuse the techniques, not the artefact" viable. No correction needed here; this is the one place where the finalized idea's legal reading is not just accurate but appropriately conservative.

---

## 8. Items still genuinely open (not errors — confirmed unresolved)

Carried forward from `finalized-idea.md §18`, cross-checked against the T&C and found to have **no answer available in the governing document**:

1. **Exact artefact deadline (deck/proposal/video).** Confirmed above (§5) — T&C defers to the website, which is not independently fetchable by the tools used this session (returns JS shell). Needs a direct email or a browser check.
2. **Roster: 4 or 5 names.** Not a document question — a team decision, now time-boxed by the confirmed 14 August closing date (§1).
3. **Zurich Singapore WICA-designated-insurer status.** Outside the scope of the competition T&C; requires checking MOM's list directly, as already flagged.
4. **Whether GFTN has published a scoring rubric.** Checked the full T&C text for any weighting or criteria beyond clause 5.1's "ability and track record" bar and clause 8.4's panel discretion. **None found.** `finalized-idea.md`'s reliance on the 2018-era four-criteria reconstruction (noted elsewhere in this project's research) remains the best available proxy, and the T&C confirms there is no newer official rubric to supersede it.

---

## Summary

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Registration deadline: 14 Aug 2026 2359 SGT | — | **Resolved** (T&C clause 7.3 + independent live corroboration) |
| 2 | §12 regulatory claims not traced to source within `finalized-idea.md` | Low | Fix: add inline reference to `05-research/zurich-regulatory-singapore.md` |
| 3 | All other T&C clause citations in both documents | — | **Verified correct**, no numbering errors found |
| 4 | Clause 9.6(c) per-component role disclosure not fully actioned | Medium | Add an open-source dependency appendix before submission |
| 5 | Artefact deadline unresolvable from T&C alone | — | Confirms existing open item; email gfh@gftn.com today |
| 6 | Scraping prohibition (12.1(p)(i)) scoped to Portal/Website only | — | No conflict with work done; note for toolchain hygiene |
| 7 | Anti-duplication posture (new repo, no ported code) | — | **Confirmed necessary and correctly conservative** |
| 8 | No published scoring rubric beyond clause 5.1/8.4 | — | Confirmed open, no new information available |

**Net effect on `finalized-idea.md`:** no changes needed to the product, architecture, demo, or business model sections. Two small compliance-hygiene fixes (§12 sourcing, §13 open-source appendix) and one resolved blocker (the deadline). The idea itself is unaffected by this pass — this was a verification of the *scaffolding* around the idea, not the idea.

---

*Method note: the T&C PDF was extracted in full via pypdf to `01-competition/tnc-fulltext.txt` (11 pages) rather than read from a search snippet, consistent with the standard `finalized-idea.md §18 item 13` sets for itself after the Grace Electrical citation error. All clause quotations above are verbatim from that extraction.*
