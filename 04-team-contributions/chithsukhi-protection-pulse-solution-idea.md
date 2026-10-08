# Protection Pulse — Broker-Connected SME Protection Review

**Solution idea by:** Chithsukhi CV  
**Challenge:** Zurich Insurance — Closing the SME Protection Gap

## The idea

Protection Pulse is not another chatbot that gives an SME a vague insurance answer. It is a shared workspace for an SME and an authorised insurance broker/adviser.

It helps an SME notice when its business has changed, compare that change against evidence in its current insurance documents, and securely send a structured **Coverage Review Brief** to the broker who can take the next step.

The core problem is not simply that SMEs lack insurance. Many have a policy, but the policy was purchased when the business was smaller or operated differently. As the business adds online sales, a warehouse, costly equipment, employees or dependency on a major supplier, its risks change quietly. The owner usually does not know whether the old policy still fits.

Protection Pulse turns that hidden change into an actionable review.

```text
Business changes
        ↓
SME confirms the change in Protection Pulse
        ↓
Platform compares the changed exposure with policy evidence
        ↓
Potential mismatch is explained with document/page citations
        ↓
SME explicitly shares a Coverage Review Brief
        ↓
Existing broker or authorised adviser reviews and responds
```

## Example: Maya's Bakery

Maya owns a bakery. She originally had one shop and bought a basic business policy. Over the year, she starts accepting online orders, stores customer contact information, buys expensive refrigeration equipment and opens a second location.

Her insurance may still be valid, but it may no longer be adequate. She does not know whether:

- the new location is listed in the policy schedule;
- her equipment and stock are insured up to their current value;
- cyber protection exists for online payments and customer data;
- business interruption protection reflects her increased dependency on digital orders or key suppliers.

Maya opens Protection Pulse and records the relevant changes. She uploads, or selects, her policy pack: base policy, policy schedule and endorsement. The system identifies the facts it can verify and creates a short review brief.

Instead of telling Maya, “You are not covered,” it says:

> “You added online payments and customer data handling. The reviewed documents do not clearly confirm relevant cyber protection. This requires authorised review. See Policy Schedule, page 2, and Cyber clause, page 14.”

Maya can then share this exact case with her existing broker. If she does not have a broker, she can request an authorised review through the platform.

## Why the broker connection matters

A gap-report product without a path to action creates a dead end. It tells the SME that something may be wrong, but leaves the owner to find an expert, explain their business again and forward confusing insurance documents manually.

The broker connection closes this loop.

### For the SME

- The SME sees insurance issues in simple language rather than legal wording.
- The SME does not need to understand policy clauses before asking for help.
- The SME controls whether its information is shared.
- The SME has one visible status for the case: shared, needs more information, under review or resolved.

### For the broker/adviser

- The broker receives a prepared case instead of an unstructured email and several attachments.
- The business changes, policy evidence and missing information are already organised.
- The broker can spend time on judgement and advice rather than finding clauses manually.
- The broker can request only the information needed to complete the review.

### For Zurich or an insurer partner

- The platform can create earlier and more relevant protection-review conversations.
- It can help service teams handle lower-complexity SME reviews more efficiently.
- It supports better customer engagement at moments when risk actually changes, rather than only at annual renewal.
- It keeps a traceable record of what was flagged, why it was flagged and how the case was resolved.

## How the product works

### 1. SME profile and business-change capture

The SME provides a focused profile rather than filling a long insurance form. The first version should target one business segment, such as small e-commerce retailers.

Example inputs:

- business type and locations;
- online sales and online-payment use;
- customer/business data handled;
- value of stock and equipment;
- key supplier dependence;
- new location, new asset, new sales channel or renewal date.

The product should also offer simple change-event buttons:

```text
+ Started selling online
+ Opened a new location
+ Bought costly equipment
+ Added a key supplier
+ Hiring / headcount expansion
```

A selected change triggers only the questions that matter to that change.

### 2. Policy evidence capture

The SME supplies its authorised policy pack. For the MVP, use clearly labelled synthetic documents or documents for which the team has explicit permission.

The system identifies a small, controlled set of information:

- policy period;
- insured business/location;
- asset or stock limit;
- confirmed or unconfirmed cyber protection;
- business-interruption position;
- exclusions, conditions and endorsements relevant to the chosen scenarios.

Schedules and endorsements must take priority over general policy wording when the documented facts conflict.

### 3. Potential-mismatch engine

The system uses transparent rules to compare the SME's declared business reality with the extracted policy evidence.

| SME situation | Policy evidence | Safe output |
|---|---|---|
| New equipment/stock is valued at S$150,000 | Policy schedule lists a S$100,000 contents limit | “Declared asset value exceeds documented limit; review required.” |
| SME adds a warehouse | Schedule lists only the original shop | “New location is not confirmed in reviewed documents.” |
| SME begins online payments | Cyber protection is absent or unclear in reviewed evidence | “Cyber protection is not confirmed; authorised review required.” |

The output must never invent policy facts. If a document is incomplete, unreadable or ambiguous, the correct outcome is **Information missing** or **Requires authorised review**.

### 4. Coverage Review Brief

The platform creates a short, shareable case rather than a long AI report.

Each item contains:

- the business change or exposure that triggered the review;
- the potential mismatch;
- source document, page and exact supporting evidence;
- confidence level;
- missing information, if any;
- recommended next action.

The brief is designed for a human adviser, not as autonomous insurance advice.

### 5. SME-controlled broker hand-off

The SME chooses one of two paths:

- **I already have a broker/adviser** — select or invite that person, then share the case.
- **I need an authorised review** — submit a review request to an approved adviser/service workflow.

Before sharing, the platform presents explicit consent:

> “I authorise Protection Pulse to share this Coverage Review Brief and selected policy evidence with my chosen authorised adviser for review.”

No report should be automatically shared without this affirmative action.


### 6. Broker workspace

The broker sees a clean case dashboard, not just a PDF attachment.

```text
SME: Maya's Bakery
Status: Review requested
Priority: High

Recent changes:
• Started online orders and payments
• Opened second location
• Added refrigeration equipment

Review items:
1. Cyber protection not confirmed
2. New location requires confirmation
3. Asset limit may be insufficient

Evidence:
• Policy Schedule — Page 2
• Endorsement — Page 1
• Cyber Clause — Page 14
```

The broker can select:

- `Request more information`
- `Review in progress`
- `Not applicable`
- `Review completed`
- `Resolved`

A broker comment returns to the SME workspace. For example: “Please confirm estimated annual online sales and whether you hold a separate cyber policy.”

## Platform features

### Essential MVP features

| Feature | What it does | Why it matters |
|---|---|---|
| SME business-change form | Captures a focused business profile and growth events | Gives the system real context instead of only a policy PDF. |
| Policy-pack upload/selection | Handles base policy, schedule and endorsement | Makes the analysis grounded in the SME's actual documents. |
| Evidence extraction | Pulls a limited set of coverage facts with source/page references | Makes each result explainable and auditable. |
| Rule-based mismatch checks | Compares known risks against known policy evidence | Produces predictable, safe outcomes for the prototype. |
| Protection dashboard | Shows high priority, review needed and information-missing items | Gives the SME an understandable summary. |
| Coverage Review Brief | Summarises each issue, evidence and next action | Converts analysis into a broker-ready case. |
| Consent-based report sharing | Lets the SME choose when to share with a broker | Protects sensitive policy and business information. |
| Broker dashboard | Lets the broker review, comment and update case status | Completes the path from detection to action. |
| Evidence drawer | Opens document/page/text behind each flag | Proves that the system is not making unsupported claims. |

### Strong additions if time remains

- a timeline of business changes and protection reviews;
- renewal reminder and pre-renewal review trigger;
- a simple asset-limit calculator based on declared value minus documented limit;
- a `What information is missing?` checklist for the SME;
- a risk-prevention resource link for the broker to share after review;
- an audit trail showing who viewed, shared and resolved a case.

## MVP boundaries: what we will not claim or build

Protection Pulse should be deliberately narrow in the first prototype.

We will **not** claim to:

- replace an insurance broker, licensed adviser or underwriter;
- provide definitive insurance advice or guarantee whether a claim will be paid;
- automatically recommend the best insurance product or calculate a premium;
- connect to live insurer systems, bank accounts, accounting platforms or government registries;
- match SMEs with real brokers without an authorised and verified partner directory;
- analyse every insurance type, every jurisdiction or every document format.

The product's role is to prepare a traceable review. The authorised human decides the appropriate protection action.

## MVP proposal for the two-day build

### Chosen target segment

**Small e-commerce retailers** are the recommended demo segment. Their risks are easy to explain: online payments, customer information, stock, delivery, suppliers and physical assets.

### Demo data

Create a clearly labelled synthetic case: **Luna Home**, a small online home-decor retailer.

Use three controlled documents:

1. a base business policy;
2. a policy schedule showing a S$100,000 contents limit and one listed location;
3. an endorsement or clause that leaves cyber protection unclear or excludes the controlled demo scenario.

The business profile declares:

- S$150,000 in stock/equipment;
- a new warehouse;
- online orders and payments;
- customer contact-data handling.

### Three demo outcomes

1. **Asset-limit review:** S$150,000 declared assets versus S$100,000 documented limit.
2. **Location review:** the warehouse is not listed in the schedule.
3. **Cyber review:** online payment/data-handling exposure exists, while cyber protection is not confirmed in the reviewed evidence.

Include one visible safe behaviour: an incomplete document causes the system to say **“Information missing — authorised review required.”**

### Build architecture

```text
React interface
      ↓
FastAPI / Python backend
      ↓
Simple deterministic mismatch rules
      ↓
JSON or SQLite case and evidence store
      ↓
Synthetic policy text / limited PDF extraction
```

AI may help classify/extract text and produce plain-language explanations, but the final mismatch results should come from controlled rules and documented evidence. If AI output is unstable, use a well-written template instead.

### MVP roles

| Team member | Main responsibility |
|---|---|
| Preran | Evidence model, policy-document precedence, mismatch rules and citations |
| Shreya | Policy-pack ingestion, structured evidence extraction, test data and validation |
| Shamanth | SME exposure questions, risk taxonomy and simple impact/limit calculations |
| Shashank | SME/broker dashboards, case-sharing flow, evidence viewer and demo video |
| Chithsukhi CV | Product workflow, user journey, SME-to-broker hand-off, consent language, feature prioritisation and pitch narrative |

## Demonstration story

The demo should be only three to four minutes.

1. **Show the change:** Luna Home begins online sales, opens a warehouse and increases inventory.
2. **Show the evidence:** The SME profile and policy pack are analysed.
3. **Show the dashboard:** Three clear review items appear.
4. **Open one item:** Show the business fact, exact policy evidence, page citation and safe explanation.
5. **Share for review:** Luna Home explicitly chooses its broker and consents to sharing the case.
6. **Switch to broker view:** The broker sees the ready-made review case, requests one additional fact and marks the review as in progress.
7. **Close with the value:** Protection Pulse changes a confusing policy document into a timely, evidence-backed broker conversation.

## Pitch statement

> **Protection Pulse turns an SME's business change into a broker-ready, evidence-backed protection review.**

It does not replace the broker. It gives the SME a clear view of what may need attention and gives the authorised adviser the structured evidence needed to act quickly and safely.

## Why this is the right first version

The strongest part of the idea is not that it uses AI. It is that it links four things that are usually disconnected:

1. what changed in the SME's real business;
2. what the insurance documents actually say;
3. what requires attention and why; and
4. the authorised human who can help the SME take action.

A two-day prototype can prove this complete journey with one business segment, three evidence-backed scenarios and a simple broker dashboard. That is more credible than claiming a universal AI insurance platform.
