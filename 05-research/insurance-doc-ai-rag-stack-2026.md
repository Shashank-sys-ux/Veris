# Production Stack: Document AI + Zero-Hallucination RAG for Commercial Insurance Policy Documents

**Research date: 15 August 2026.** All prices USD, pay-as-you-go, US regions unless stated.

**How to read the confidence markers:**
- `[FACT]` — read directly from vendor documentation, vendor pricing page, or a vendor/programmatic pricing API during this research. URL given.
- `[VENDOR CLAIM]` — a number the vendor publishes about itself (accuracy, benchmark wins). Not independently verified.
- `[THIRD PARTY]` — from a non-vendor source; treat as indicative.
- `[INFERENCE]` — my engineering judgement, not a documented fact.

---

## 0. Executive answer

For commercial insurance policy PDFs where a wrong number is financial liability, the shape that actually ships today:

1. **Parse with a citation-native engine, not a text-native one.** The non-negotiable requirement is that the extractor returns, per field: the value, the verbatim source substring, the page, a bounding box, and separate parse-confidence vs extract-confidence. As of Aug 2026 the engines that return all of that as a documented first-class API contract are **Reducto Extract** (`citations: true`), **Landing AI ADE Parse/Extract**, and **Azure Content Understanding** (grounding + confidence). Azure Document Intelligence custom-neural returns per-field confidence + polygons but not an LLM-style citation object.
2. **Never let the LLM emit the number.** Constrain the model to emit *span identifiers* into the parser output, then resolve the number from the parser output by lookup. This makes hallucinated digits structurally impossible rather than statistically unlikely. See §2.1.
3. **Verify twice, with different failure modes.** A semantic groundedness checker (Bedrock contextual grounding / Azure groundedness detection) catches paraphrase drift; a deterministic string+arithmetic check catches digit corruption; **Bedrock Automated Reasoning checks** (SMT-backed, GA Aug 2025) catches *logical* errors in clause interaction — which is where insurance actually breaks (warranties, average clauses, sub-limit precedence).
4. **Retrieval: hybrid BM25 + dense over contextualised chunks, then rerank.** On legal/contract text, lexical matching carries far more weight than in general RAG because defined terms are the index. Anthropic's Contextual Retrieval numbers are the best-published baseline.
5. **Durability: put the agent on a durable execution runtime, not a checkpointer.** For "runs for months, must never lose state", Temporal is the incumbent answer and now has a first-party LangGraph plugin (public preview).

---

## 1. Document AI / IDP platforms

### 1.1 Azure AI Document Intelligence (was Form Recognizer) — now part of Azure Content Understanding

- Product page: https://azure.microsoft.com/en-us/products/ai-foundry/tools/document-intelligence
- Layout docs: https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/layout?view=doc-intel-4.0.0
- RAG/markdown docs: https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept/retrieval-augmented-generation?view=doc-intel-4.0.0
- Custom generative extraction: https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept-custom-generative?view=doc-intel-4.0.0
- Model chooser: https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept/choose-model-feature

`[FACT]` Branding as of 2026: Document Intelligence is positioned as "now part of Azure Content Understanding in Foundry Tools". Microsoft's own model-selection doc frames DI as the *deterministic* high-accuracy extractor for structured documents, and Content Understanding as the LLM-powered analyzer layer for complex/unstructured/multimodal content. Both are live; they are not a rename of each other.

`[FACT]` Layout model, GA version `2024-11-30`. Returns text, tables, titles, paragraphs, section headings, selection marks, figures, with **Markdown output format** selectable — this is the feature people build RAG chunking on (`MarkdownHeaderTextSplitter` pattern is in Microsoft's own docs). Supports 309 printed + 12 handwritten languages. Single API call handles digital PDF, scanned PDF, images, docx/xlsx/pptx, HTML.

`[FACT]` Model families relevant to you:
| Model | What it is | Custom training | Notes for policy docs |
|---|---|---|---|
| `prebuilt-read` | OCR only | no | cheapest, no structure |
| `prebuilt-layout` | layout + tables + structure, Markdown out | no | the RAG workhorse |
| `prebuilt-document` | + generic key-value pairs | no | |
| `prebuilt-contract` | prebuilt contract model | no | contract-shaped, not policy-wording-shaped |
| Custom **template** | positional; needs consistent layout | 5 docs min | useless for policy wordings, fine for a single carrier's schedule form |
| Custom **neural** | deep model combining layout + language features | 5 docs min | the right tool for schedules/endorsements that vary in position |
| Custom **generative** | LLM + your schema, minimal labelling | few docs | fastest to stand up; Microsoft markets it for "any type of document" |
| **Query Fields** add-on | ad-hoc field extraction on top of prebuilt | none | good for "find the average clause" spot checks |
| Custom **classifier** | doc-type routing + splitting composite files | | essential: policy pack → wording / schedule / endorsement |

`[FACT]` **Pricing, S0 tier, East US, per 1,000 pages** — pulled live from the Azure Retail Prices API (`https://prices.azure.com/api/retail/prices`, `productName contains 'Document Intelligence'`), so these are the actual billing meters, not marketing rounding:

| Meter | Price |
|---|---|
| Read | **$1.50** (0–1M pages), **$0.60** (>1M) |
| Prebuilt (incl. Layout, Invoice, ID, Contract, Health insurance card) | **$10.00** |
| Custom extraction (template or neural) | **$30.00** |
| Custom **generative** extraction | **$30.00** |
| Document classifier | **$3.00** |
| Query Fields | **$10.00** |
| Add-on features (high-res, font, formula, barcode) | **$6.00** |
| Training | **$3.00 / hour** |
| Batch equivalents | same rates (Batch Read $1.50 / $0.60) |
| Free tier F0 | 500 pages/month |

Commitment tiers (monthly, East US): Prebuilt 20K pages = $190/mo ($9.50/1K overage); 100K = $900/mo ($9.00); 500K = $4,000/mo ($8.00); 1M = $7,500/mo ($7.50). Custom 20K = $540/mo ($27.00 overage) → 1M = $18,000/mo ($18.00). Disconnected containers are sold annually (e.g. Prebuilt 100K pages/mo projected = $8,640/yr).

`[FACT]` Custom neural training: free for the first 10 hours, then $3/hour. Custom template training is free.

`[FACT]` Confidence + geometry: DI returns per-field confidence scores and bounding polygons; the Studio surfaces them for visual verification. For custom generative, Microsoft explicitly markets grounding + confidence for human-review routing.

**Azure Content Understanding (the newer layer) — this is the one to look at hardest**

- Aug 2026 release notes: https://devblogs.microsoft.com/foundry/azure-content-understanding-updates-august-2026/

`[FACT]` Two live tracks as of Aug 2026: **CU 1.0 GA** (API version `2025-11-01`) and **CU 2.0 public preview** (`2026-06-01-preview`).

`[FACT]` CU 1.0 GA refresh brings: GPT-5 series support (5 through 5.5, standard/mini/nano); *"improved grounding efficiency ... merging extraction and grounding more effectively"* — Microsoft's internal evals report up to 28% fewer inference tokens and up to 3% better average accuracy for GPT-4.1 and GPT-5.2 `[VENDOR CLAIM]`; refreshed confidence model with AUROC improved up to 14% `[VENDOR CLAIM]`.

`[FACT]` CU 2.0 preview adds, in order of relevance to you:
- **Agentic mode for complex field extraction** — iterative extraction where evidence is spread across a long document. Microsoft's example list literally names *"long legal agreements, financial filings, insurance records"*. This is the closest thing a hyperscaler ships to "go find the sub-limit that is defined in the wording but modified by endorsement 7".
- **Semantic chunking** in `prebuilt-documentSearch`.
- **Advanced Contextualization** — labelled examples used as a knowledge source that stays in *your* Azure Storage rather than being copied into the analyzer. Reported up to 3.5% accuracy gain with up to 22% fewer LLM tokens `[VENDOR CLAIM]`.
- **Classification with in-page splitting + confidence** — matters because policy packs put the end of one endorsement and the start of the next on one physical page.
- **Signature detection + document metadata** in Layout.
- **Synchronous Read and Layout** APIs (no service-side temp storage).

`[FACT]` **Content Understanding pricing** (Azure Retail Prices API, East US, per 1,000 pages):

| Meter | Price |
|---|---|
| Doc Content Extraction — Minimal | **$0.01** |
| Doc Content Extraction — Basic | **$1.00** |
| Doc Content Extraction — Standard | **$5.00** |
| Add-On Layout | **$5.00** |
| Std Contextualization Tokens | **$0.001 / 1K tokens** |
| Audio content extraction | $0.36 / hour |
| Video content extraction | $1.00 / hour |

`[INFERENCE]` CU's page meters undercut DI Layout ($5 vs $10/1K pages) but CU field extraction consumes Foundry model tokens billed separately, so total cost is workload-dependent and can exceed DI for token-heavy schemas. Model this before committing.

**Verdict for insurance:** `[INFERENCE]` Strongest hyperscaler option, mainly because of the *combination* of (a) Markdown Layout output that survives nested schedule tables reasonably well, (b) a real custom-classifier for splitting policy packs, (c) CU 2.0 agentic mode aimed at exactly your document class, and (d) per-field confidence you can threshold for human review. Weakness: on the hardest merged-cell nested schedules, third-party benchmarks put it behind the specialist vendors (see §1.9).

---

### 1.2 AWS Textract

- Pricing: https://aws.amazon.com/textract/pricing/
- Layout response objects: https://docs.aws.amazon.com/textract/latest/dg/layoutresponse.html
- Queries response: https://docs.aws.amazon.com/textract/latest/dg/queryresponse.html
- Quotas: https://docs.aws.amazon.com/textract/latest/dg/limits-document.html
- SDK: `boto3` `textract` — `analyze_document`, `start_document_analysis`, `get_document_analysis`

`[FACT]` `AnalyzeDocument` takes a `FeatureTypes` list: `TABLES`, `FORMS`, `QUERIES`, `SIGNATURES`, `LAYOUT`. You compose and you pay per feature per page.

`[FACT]` **Layout** returns typed blocks with bounding box + confidence + child relationships, in implied reading order (multi-column handled left-column-top-to-bottom then next column): `LAYOUT_TITLE`, `LAYOUT_HEADER`, `LAYOUT_FOOTER`, `LAYOUT_SECTION_HEADER`, `LAYOUT_PAGE_NUMBER`, `LAYOUT_LIST`, `LAYOUT_FIGURE`, `LAYOUT_TABLE`, `LAYOUT_KEY_VALUE`, `LAYOUT_TEXT`.

`[FACT]` **Queries** — you send natural-language questions with an `Alias`; response is a `QUERY` block related to a `QUERY_RESULT` block carrying `Text`, `Confidence`, and geometry (location of the answer on the page). If no answer is found the element is left blank rather than fabricated. Limits: **15 queries/page synchronous, 30 queries/page asynchronous**.

`[FACT]` **Pricing, US West (Oregon), per page**, from AWS's own worked examples:

| Feature | First 1M pages/mo | Above 1M |
|---|---|---|
| DetectDocumentText (OCR) | $0.0015 | $0.0006 |
| Tables | $0.015 | $0.010 |
| Forms (key-value) | $0.050 | $0.040 |
| Queries | $0.015 | — |
| Tables + Queries | $0.020 | $0.015 |
| Tables + Forms + Queries | $0.070 | $0.055 |
| Custom Queries | $0.025 | $0.015 |
| Pretrained Forms + Custom Queries | $0.065 | $0.050 |
| Signatures | $0.0035 | $0.0014 |
| **Layout** | **free when used with Tables** | |
| AnalyzeExpense | $0.010 | $0.008 |
| AnalyzeID | $0.025 (≤100K) | $0.010 |
| AnalyzeLending | $0.070 | $0.055 |

`[FACT]` Layout being free alongside Tables is the pricing quirk worth exploiting: **Tables + Layout = $15/1,000 pages** with bounding boxes and reading order. That is the cheapest credible layout+table+geometry option among the three hyperscalers.

`[FACT]` Custom Queries (adapters) is the customisation path — you train an adapter on your own documents rather than a full custom model.

**Verdict:** `[INFERENCE]` Best cost/structure ratio for bulk ingest, and Queries gives you a cheap grounded spot-check path with confidence + geometry per answer. Weakest of the three on deeply nested schedule tables and on producing LLM-ready Markdown — you will write more post-processing. The 15/30 queries-per-page cap makes Queries a verification tool, not your primary extractor for a 40-field schema.

---

### 1.3 Google Document AI

- Product: https://cloud.google.com/document-ai
- Pricing: https://docs.cloud.google.com/document-ai/pricing
- Gemini layout parser: https://docs.cloud.google.com/document-ai/docs/layout-parse-chunk
- Enterprise Document OCR: https://cloud.google.com/document-ai/docs/document-ocr
- Form Parser: https://cloud.google.com/document-ai/docs/form-parser
- Response handling: https://docs.cloud.google.com/document-ai/docs/handle-response

`[FACT]` **Layout Parser is now "Gemini layout parser"** — Google's OCR models plus Gemini. Processor versions and dates, from the docs:

| Version | Backing model | Channel | Date |
|---|---|---|---|
| `pretrained-layout-parser-v1.0-2024-06-03` | — | Stable (default) | 2024-06-03 |
| `pretrained-layout-parser-v1.5-2025-08-25` | Gemini 2.5 Flash | RC | 2025-08-25 |
| `pretrained-layout-parser-v1.5-pro-2025-08-25` | Gemini 2.5 Pro | RC | 2025-08-25 |
| `pretrained-layout-parser-v1.6-pro-2025-12-01` | Gemini 3.0 Pro | RC | 2025-12-01 |
| `pretrained-layout-parser-v1.6-2026-01-13` | Gemini 3.0 Flash | RC | 2026-01-13 |

`[FACT]` Pipeline is three-stage: parse into a `DocumentLayout` hierarchy tree → annotate/verbalise figures, charts and tables into text descriptions (preview) → chunk with ancestral headings and table headers folded into each chunk. Google explicitly markets "layout-aware chunking" where a retrieved chunk carries its structural context.

`[FACT]` Google's docs make a direct pitch on hallucination: *"Unlike pure LLM-based parsers that try to read text that isn't there, Gemini layout parser's foundation in advanced OCR grounds it in the document's actual content."* They publish side-by-side examples on an Alphabet 10-K where an unnamed competitor mis-aligns columns and invents values. `[VENDOR CLAIM]` — no competitor named, no metric.

`[FACT]` Layout Parser limits: online ≤20 MB and ≤15 pages per PDF; batch ≤1 GB and ≤500 pages. **Tables spanning multiple pages may be split into two tables.** That last one is a direct hazard for insurance schedules of values.

`[FACT]` **Pricing per 1,000 pages** unless noted:

| Processor | Price |
|---|---|
| Enterprise Document OCR | first 1,000 free; **$1.50** to 5M; **$0.60** above 5M |
| OCR add-ons (v2 only) | **$6.00** |
| **Layout Parser** (includes initial chunking) | **$10.00** |
| **Custom Extractor** | **$30.00** to 1M; **$20.00** above |
| Form Parser | **$30.00** to 1M; **$20.00** above |
| Custom splitter / classifier | **$5.00** to 1M; **$3.00** above |
| Summarizer | **$0.025** |
| Re-chunking parsed documents | **$0.02** |
| Custom processor **hosting** | **$0.05 / hour** (≈$438/yr per deployed version) |
| Provisioned service tier | $0.410958904 / hour |

`[FACT]` Custom Extractor is generative-AI powered, usable zero-shot, and fine-tunable from **as few as 10 documents**. Cost is identical whether you use the generative version or a fine-tuned custom model.

`[FACT]` Form Parser extracts key-value pairs, tables, checkboxes, up to 11 generic entities — but Google's own docs say it handles *simple* tables (no cells spanning rows/columns) and that for trained table extraction you should use Custom Extractor with a parent field containing column child fields.

**Verdict:** `[INFERENCE]` The hosting fee ($438/yr per deployed custom processor version) is a real operational tax if you want a processor per carrier form. Layout Parser's multi-page-table splitting and the "simple tables only" caveat on Form Parser are meaningful risks for schedules. Strongest reason to pick Google: if you are already on Vertex AI and want the check-grounding API in the same trust boundary (§2.4).

---

### 1.4 Reducto

- Product: https://reducto.ai · Extract: https://reducto.ai/extract
- Pricing: https://reducto.ai/pricing · Credit table: https://docs.reducto.ai/reference/credit-usage
- **Citations: https://docs.reducto.ai/configs/extract/citations**
- **`/cite` endpoint: https://docs.reducto.ai/reference/cite**
- Per-page billing breakdown: https://docs.reducto.ai/reference/page-billing-breakdown
- RD-TableBench: https://github.com/reductoai/rd-tablebench

`[FACT]` Pricing: **$0.015 per credit** after the first 15,000 credits free. Credits per page:

| Operation | Credits/page |
|---|---|
| Parse — standard (text, layout, simple tables, OCR) | 1 → **$15/1K pages** |
| Parse — complex (merged cells, nested headers, KV regions, figures) | 2 → $30/1K |
| Parse — agentic on simple pages | 2 |
| Parse — agentic on complex pages | 4 → $60/1K |
| Advanced chart agent | +4 per chart |
| Extract — standard (schema-based) | 2 |
| Extract — Deep Extract (beta) | complexity-based; max 4/page + 0.1/field, min 30 credits/doc |
| Split — standard / Deep Split | 2 / 4 |
| Classify | 0.5/page of context; default reads 5 pages = 2.5 credits |
| Edit (beta) | 4 |
| Text files (HTML/TXT/RTF) | 0.5 |
| Spreadsheets | 1 per 1,000 cells (Accurate) or 1 per 5,000 (Fast) |

`[FACT]` **`queue_priority: "batch"` = 20% fewer credits** on all parse credit types, 12-hour completion guarantee. Reused Parse results via `jobid://` avoid double-charging Parse when you then Extract or Split.

`[FACT]` **This is the citation contract you want.** With `citations: true`, every extracted field becomes `{value, citations[]}` and each citation carries:
- `type` — block type (Text, Table, Key Value, …)
- `content` — **the verbatim source text**
- `bbox` — normalised 0–1 coordinates for PDFs/images; for spreadsheets, `left`=column (1-indexed), `top`=row, `page`=sheet
- `page` and `original_page` (differs when you used page ranges)
- `confidence` — categorical "high"/"low"
- `granular_confidence` — **`extract_confidence` and `parse_confidence`, both 0–1, separately**
- `parentBlock` — the larger Parse block for context

`[FACT]` Documented constraints, and these matter architecturally:
- **Citations disable chunking** — the document is processed as a single unit to preserve coordinate mapping.
- A field's `citations` array can be **empty** in two cases: the value was *inferred* rather than found, or (rarely) it was found but couldn't be localised. Reducto's guidance: for an inferred value, re-running won't produce a citation — change the schema or field description. For a localisation failure, re-running can recover it.

`[INFERENCE]` That empty-citations semantic is the single most useful thing in this whole research pass for your requirement. `citations == []` is a machine-readable "this number was reasoned, not read". Treat it as a hard reject in an insurance pipeline: no citation, no number.

`[FACT]` Separately, the **`/cite` endpoint** does reverse lookup — give it a text string and a parsed document, get back the bounding boxes where that text appears. That is the primitive for verifying that an LLM's quoted span is genuinely verbatim in the source.

`[FACT]` `parse_confidence` vs `extract_confidence` split lets you distinguish "the OCR was unsure" from "the model was unsure how to interpret it" — different remediations (rescan vs re-prompt vs escalate).

`[FACT]` Every Parse response includes `usage.page_billing_breakdown` showing which billable features hit each page. Enterprise plan features include ZDR agreement, BAA, EU/AU data residency, VPC and on-prem deployment, RBAC, SSO/SAML.

`[VENDOR CLAIM]` RD-TableBench (their own open benchmark, 1,000 complex tables, PhD-level human labels, Needleman–Wunsch alignment similarity): Reducto 90.2, Azure Document Intelligence 82.7, AWS Textract 80.9, Google 64.6. Also claimed: 99.24% extraction accuracy in a healthcare deployment, 4B+ pages processed, 99.9% uptime target.

**Verdict:** `[INFERENCE]` Best fit for your stated requirement, on the strength of the citation contract alone. Cost is 1.5–4× the hyperscalers per page, which is irrelevant next to one mis-stated limit. Main architectural constraint to plan for: citations force whole-document processing, so long policy wordings need page-range strategy or a two-pass design (cheap chunked parse for retrieval, citation-enabled extract for the fields you will report).

---

### 1.5 LlamaParse / LlamaExtract (LlamaIndex)

- Pricing: https://developers.llamaindex.ai/llamaparse/general/pricing/
- Platform: https://www.llamaindex.io / https://www.llamaindex.ai/enterprise
- ParseBench: https://llamaindex.ai/blog/parsebench

`[FACT]` **1,000 credits = $1.25** (North America and Europe). 10,000 free credits/month (~1,000 pages).

`[FACT]` Parse v2 tiers, credits/page → effective $/1,000 pages:

| Tier | Credits/page | $/1K pages |
|---|---|---|
| Fast (spatial text only, no markdown) | 1 | **$1.25** |
| Cost-effective | 3 | **$3.75** |
| Agentic | 10 | **$12.50** |
| Agentic Plus | 45 | **$56.25** |
| Layout extraction add-on | +3 | +$3.75 |

`[FACT]` Extract (v2) totals = extract tier + parse tier. Defaults: Agentic Plus extract 50 + Agentic parse 10 = **60 credits/page = $75/1K pages**. Agentic 15+10 = 25 → $31.25/1K. Cost-effective 5+3 = 8 → $10/1K. Turbo (preview) is all-in at 35 credits/page but **explicitly does not produce granular bounding boxes** — rule it out for your use case.

`[FACT]` Agentic Plus supports schemas up to 3,200 leaf fields, with credit multipliers above 200 fields (201–800 ×2, 801–1,600 ×3, 1,601–2,400 ×4, 2,401–3,200 ×5). A 40-row × 10-column table counts as 10 fields, not 400.

`[FACT]` Parsed files are cached 48 hours — re-parsing the same file in that window is free. Other meters: exported page 2 credits/page, retrieval query 1 credit, chat turn 100 credits, retained file storage 100 credits per GB per day.

`[VENDOR CLAIM]` ParseBench (their own benchmark, 14 methods): LlamaParse Agentic scored 84.9% overall and was the only method competitive across all five dimensions.

**Verdict:** `[INFERENCE]` Cheapest credible path to good Markdown at the Cost-effective tier, and the schema-size pricing is honest about nested tables. But the citation/bounding-box story is less crisply documented than Reducto's, and Turbo's explicit lack of granular boxes is a warning that box fidelity varies by tier. Good for the retrieval corpus; I would not make it the system of record for reported numbers without validating box fidelity on your own documents first.

### 1.6 Unstructured.io

- Pricing: https://unstructured.io/pricing
- High Res strategy: https://docs.unstructured.io/api-reference/workflow/nodes/partitioner/partitioner-high-res
- SCORE-Bench: https://unstructured.io/blog/introducing-score-bench-an-open-benchmark-for-document-parsing

`[FACT]` Four partitioning strategies: Fast (rule-based text extraction, cheapest), High Res (image-to-text, **supports bounding box coordinates for document elements**), VLM, and Auto (per-page runtime optimisation for quality-per-cost). The Partition endpoint now includes VLM partitioning and supersedes the older Serverless API.

`[THIRD PARTY]` A staging copy of the pricing page shows **$0.03/page after the first 15,000 free pages, with pages free above a $3,000 monthly bill up to 1M pages/month**. The production pricing page did not render its numbers during this research, so treat the exact figures as unconfirmed and get a quote.

`[FACT]` ~30 source connectors (S3, SharePoint, Azure Blob, GCS, Google Drive, Box, Confluence, Salesforce, Snowflake, Databricks Volumes, Postgres, MongoDB, Elasticsearch, Kafka, …) plus destination connectors. That ETL breadth is the real product.

**Verdict:** `[INFERENCE]` Pick it for ingestion plumbing across many document sources, not for maximum table fidelity on nested schedules. Bounding boxes only on High Res.

### 1.7 Docling (IBM) + Granite-Docling

- Repo: https://github.com/docling-project/docling · models: https://github.com/docling-project/docling-ibm-models
- Granite-Docling: https://www.ibm.com/granite/docs/models/docling and https://www.ibm.com/new/announcements/granite-docling-end-to-end-document-conversion

`[FACT]` MIT-licensed, runs on CPU, emits a structured `DoclingDocument`. Ships **TableFormer** (recognises table structure *and* bounding boxes of table content) and a layout model. Handles PDF, DOCX, PPTX, XLSX, HTML, images, email, audio. Structure-aware chunking is built in.

`[FACT]` **Granite-Docling-258M** is a ~258M-parameter open VLM doing end-to-end document conversion in one shot, preserving layout, tables, equations, code, lists. IBM's framing: conventional OCR-to-Markdown "loses connection to the source content", whereas Granite-Docling faithfully translates structural elements — pitched specifically as better for downstream RAG.

`[FACT]` Docling is not present on the public vendor accuracy leaderboards, so you benchmark it yourself. `[THIRD PARTY]`

**Verdict:** `[INFERENCE]` The obvious choice for on-prem / data-residency-constrained insurance work, and TableFormer's bbox output means you can build a citation layer yourself. Zero marginal cost per page. Expect to invest real engineering in the citation contract that Reducto gives you off the shelf.

### 1.8 Marker / Datalab, and Chunkr

- Datalab (Marker's commercial home): https://www.datalab.to · on-prem: https://www.datalab.to/onprem · docs: https://documentation.datalab.to
- Chunkr: https://chunkr.ai · docs: https://docs.chunkr.ai · repo: https://github.com/lumina-ai-inc/chunkr

`[FACT]` Datalab publishes an on-prem line at **$6 per 1,000 pages** for High Accuracy Mode / Structured Extraction / Track Changes / Spreadsheets, and states ~99.99% uptime for the API. Free open-source options exist for research, personal use, and early-stage startups. The hosted plan table did not render numeric detail during this research — get a quote.

`[FACT]` Chunkr describes itself as VLM + computer-vision models producing structured machine-readable output; hosted Chunkr Cloud plus self-hostable OSS. `[THIRD PARTY]` Aggregator sources describe tiered monthly plans bundling credits and included pages at roughly one credit per page, with overage roughly $0.005–$0.01/page depending on tier. Its Python SDK is documented as alpha.

**Verdict:** `[INFERENCE]` Marker/Datalab is a strong price/quality point and a genuine on-prem option. Chunkr is promising but the alpha SDK and aggregator-only pricing make it a second-tier bet for a liability-bearing pipeline in Aug 2026.

### 1.9 Landing AI — Agentic Document Extraction (ADE)

- Product: https://landing.ai · overview: https://docs.landing.ai/ade/ade-overview
- Pricing/credits: https://docs.landing.ai/dpt3/pricing · plans: https://landing.ai/pricing
- DPT-2 announcement: https://landing.ai/news/landingai-expands-agentic-document-intelligence-with-a-document-pre-trained-transformer

`[FACT]` Five APIs: **Parse** (required first step — Markdown + hierarchical JSON, *"identifies elements like text, tables, and form fields with exact page and coordinate references"*), **Extract** (schema-based field extraction), **Classify** (per-page labelling, no Parse needed), **Section** (hierarchical table of contents with section titles, levels, chunk references), **Split** (separate multi-document files).

`[FACT]` Marketing is explicit on traceability: page numbers and precise coordinates for each chunk, plus confidence scoring to surface results needing human review. Feature list includes "Visual Grounding".

`[FACT]` Model lineage: DPT-2 announced 30 Sep 2025; docs now sit under a `dpt3` path, i.e. a third-generation Document Pre-trained Transformer.

`[FACT]` **Credit consumption is complexity-aware, per the v2 APIs:**

| | Priority (sync + jobs) | Standard (jobs only) |
|---|---|---|
| Parse — per page | 1 credit | 0.5 credit |
| Parse — output chars | 0.5 / 1,000 chars | 0.25 / 1,000 chars |
| Extract — input chars | 1 / 2,500 chars | 1 / 5,000 chars |
| Extract — output chars | 1 / 500 chars | 1 / 1,000 chars |

Median typical business document ≈ 1.5 credits on standard tier. Totals round up to 0.1 credit. Response metadata shows every number used to compute the charge. **Zero Data Retention costs no extra credits.**

`[FACT]` The credit → dollar rate is not published on the docs or pricing pages; Explore plan buys credits pay-as-you-go, Team/Enterprise get monthly allotments. Also available via AWS Marketplace. `[INFERENCE]` You must get a quote to compare against Reducto's $0.015/credit.

**`Section` is the underrated API here.** `[INFERENCE]` Policy wordings are hierarchies — Section I Coverage, Section II Exclusions, Conditions, Warranties, Schedule, Endorsements. An API that hands you the ToC with levels and chunk references gives you section-scoped retrieval almost free, which is exactly what stops "General Exclusions" text being cited as if it were a Section II exclusion.

### 1.10 Which parser for insurance policy documents with dense tables and nested schedules?

`[INFERENCE]` My ranking for *this* document class and *this* liability profile:

1. **Reducto** — only engine whose documented response contract gives you verbatim `content` + `bbox` + `page` + split parse/extract confidence per field, plus the `/cite` reverse-lookup endpoint, plus an explicit "inferred, not found" signal via empty citations. Agentic-complex mode at $60/1K pages for the pages that need it.
2. **Landing AI ADE** — comparable grounding story, `Section` gives policy hierarchy natively, ZDR is free. Held back only by unpublished credit price.
3. **Azure Content Understanding (CU 2.0 agentic mode) / Document Intelligence custom neural** — best choice if you're Azure-committed or need commitment-tier economics, disconnected containers, or the classifier for splitting policy packs. Agentic mode explicitly targets insurance records.
4. **AWS Textract Tables + Layout at $15/1K** — best value for bulk ingest and geometry; use Queries as a cheap independent verifier, not the primary extractor.
5. **Docling / Granite-Docling** — the on-prem answer; TableFormer bboxes let you build the citation layer yourself.
6. **Google Document AI Gemini layout parser** — good chunking, but multi-page-table splitting and Form Parser's simple-tables-only caveat are direct hazards for schedules of values; custom processor hosting is a per-version annual fee.

**Benchmarks to know, all vendor-run — treat every leaderboard as marketing until you replicate it:**
- **RD-TableBench** (Reducto) — https://github.com/reductoai/rd-tablebench — 1,000 complex tables, human-labelled, Needleman–Wunsch similarity. The most useful published artefact because the data and scorer are open.
- **RealDoc-Bench** (Extend.ai) — https://www.extend.ai/resources/realdocbench — tests whether parsers preserve structure agents need, not just text.
- **SCORE-Bench** (Unstructured) — https://unstructured.io/blog/introducing-score-bench-an-open-benchmark-for-document-parsing — explicitly motivated by OCR-era metrics mis-scoring generative outputs as errors.
- **ParseBench** (LlamaIndex) — https://llamaindex.ai/blog/parsebench
- **OmniAI OCR benchmark** — https://github.com/getomni-ai/benchmark — text and JSON extraction accuracy across multimodal models.
- **DocParsingBench** — https://huggingface.co/datasets/SoMarkAI/DocParsingBench — 1,400 images from real business workflows.

`[INFERENCE]` The only benchmark that will decide your build is the one you make from ~200 of your own policy pages with human-labelled limits, sub-limits, deductibles and clause text. Every published number above is measured on documents that are not yours.

---

## 2. Hallucination prevention / grounding at production grade

### 2.1 The architectural move that matters most: don't let the model emit the number

`[INFERENCE]` Every managed grounding checker in this section is a *detector* — probabilistic, post-hoc, and scored 0–1. For "a wrong number = financial liability" you want the number to be structurally incapable of being wrong, with detectors as defence in depth rather than the primary control.

The pattern, which is buildable today on any of the parsers in §1 that return spans:

1. **Parse once, immutably.** Store the parser output (blocks with `id`, `page`, `bbox`, `content`) as the canonical artefact. Hash it. Everything downstream references block IDs.
2. **Constrain the LLM to emit references, not values.** Schema fields are `{block_id: string, char_start: int, char_end: int}` — never `{limit: number}`. Enforce with strict structured outputs (§2.5) so the model cannot emit a free-form number in that position at all.
3. **Resolve server-side.** Your code slices `content[char_start:char_end]` from the stored block and parses the number with a deterministic parser (currency symbol, thousands separators, "per occurrence", "in the aggregate", "each and every loss").
4. **Reject on any mismatch.** If the slice doesn't parse as a monetary amount, or the referenced block doesn't exist, or the citation array is empty — hard fail to human review. No fallback to the model's own guess.
5. **Round-trip verify.** Take the resolved verbatim span and reverse-look it up (Reducto `/cite`, or your own exact-match index over the parser output). If it doesn't appear verbatim on the claimed page, reject.
6. **Keep the evidence.** Persist `{field, value, verbatim_span, page, bbox, block_id, parser_version, model_version, doc_hash, confidences}` per reported number. This is the audit record, and it's also your regression fixture (§5).

`[INFERENCE]` Consequences worth stating plainly: the model's job collapses from "extract the limit" to "point at where the limit is". Locating is a much easier task than transcribing, and it fails *visibly* (wrong page) rather than *silently* (right shape, wrong digits). Two failure modes remain and you must handle them explicitly — the model points at the wrong span (caught by human review sampling + the logic checks in §2.3), and the value genuinely isn't a contiguous span because it's computed (e.g. a sub-limit expressed as "25% of the sum insured"). For the computed case, extract *both* operands as spans plus the operator, compute server-side, and store the derivation.

### 2.2 AWS Bedrock Guardrails — contextual grounding check

- Docs: https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-contextual-grounding-check.html
- API: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_GuardrailContextualGroundingFilter.html
- Product: https://aws.amazon.com/bedrock/guardrails/

`[FACT]` Two independent scores per response: **Grounding** (is the response factually supported by the source; any new information introduced counts as ungrounded) and **Relevance** (does it answer the query). Thresholds configurable **0 to 0.99** independently; 1.0 is rejected as invalid because it would block everything.

`[FACT]` Three required components: `grounding_source`, `query`, `content to guard`. Wired three ways — Invoke APIs use tag suffixes (`amazon-bedrock-guardrails-groundingSource_xyz`, `amazon-bedrock-guardrails-query_xyz`); Converse APIs use `qualifiers: ["grounding_source"] / ["query"] / ["guard_content"]`; **`ApplyGuardrail`** lets you run the check standalone with no model invocation, which is what you want for verifying an already-extracted value.

`[FACT]` Hard limits: **grounding source 100,000 chars, query 1,000 chars, response 5,000 chars.** Multiple `grounding_source` tags are concatenated and evaluated together, not separately.

`[FACT]` Documented gaps: **conversational QA / chatbot use cases are not supported**; supported use cases are summarization, paraphrasing, question answering. Relevance is computed per chunk and **if any one chunk is deemed relevant the whole response is considered relevant** — so a mostly-irrelevant answer with one relevant chunk passes. For streaming, an irrelevant response can reach the user and only be marked irrelevant after the full stream completes.

`[FACT]` Content inside `grounding_source` and `query` tags is excluded from all *other* guardrail policies (word/topic/content filters, PII detection, prompt-attack detection) unless you also nest it in `guardContent` / add the `guard_content` qualifier.

`[FACT]` Pricing: AWS's Dec 2024 announcement set content filters and denied topics at **$0.15 per 1,000 text units**. The current Bedrock pricing page (https://aws.amazon.com/bedrock/pricing/) renders its guardrail meters client-side and did not yield the contextual-grounding and Automated Reasoning line items during this research. `[INFERENCE]` Get the live figures from the AWS Pricing API or the console calculator before you model cost; do not assume grounding is priced the same as content filters.

`[INFERENCE]` The 100K-char grounding source cap is your binding constraint. A commercial policy wording plus schedule plus endorsements will exceed it. You must pass only the retrieved evidence spans as the grounding source, not the document — which is fine and arguably better, but means the check validates "did the model paraphrase these spans faithfully", not "is this true of the policy".

### 2.3 AWS Bedrock Guardrails — Automated Reasoning checks *(the one most people miss)*

- Docs: https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-automated-reasoning-checks.html
- Concepts: https://docs.aws.amazon.com/bedrock/latest/userguide/automated-reasoning-checks-concepts.html
- GA announcement: https://aws.amazon.com/about-aws/whats-new/2025/08/automated-reasoning-checks-amazon-bedrock-guardrails/
- Financial-services walkthrough: https://aws.amazon.com/blogs/machine-learning/build-verifiable-explainability-into-financial-services-workflows-with-automated-reasoning-checks-for-amazon-bedrock-guardrails/
- Source references update: https://aws.amazon.com/about-aws/whats-new/2026/02/automated-reasoning-policies-include-references

`[FACT]` **Generally available since 6 August 2025.** An *Automated Reasoning policy* is an AWS account resource containing formal logic rules, a schema of variables, and optional custom types, encoding business rules/regulations/guidelines that LLM responses are validated against. It uses mathematical proof search rather than another LLM.

`[VENDOR CLAIM]` *"up to 99% verification accuracy"*, described as "provable assurance", with **ambiguity detection** when a model output admits more than one interpretation.

`[FACT]` **February 2026: Automated Reasoning policies now include references to the source document.** That closes the loop for audit — the logical finding points back at the text it came from.

`[FACT]` June 2026: new policy-refinement workflows added (https://aws.amazon.com/about-aws/whats-new/2026/06/amazon-bedrock-guardrails/).

`[FACT]` PwC has published joint work with AWS on this: https://aws.amazon.com/blogs/machine-learning/pwc-and-aws-build-responsible-ai-with-automated-reasoning-on-amazon-bedrock/

`[INFERENCE]` This is the best-fit managed technology in the entire landscape for the *hard* half of your problem. Limits and deductibles are extraction. Warranties, average/coinsurance clauses, sub-limit precedence, and condition interaction are **logic**, and logic errors are what a groundedness scorer cannot see: "the sub-limit is £250,000" can be perfectly grounded in the wording and still wrong because endorsement 7 replaced it, or because the average clause reduces recovery, or because a warranty was breached. Encoding rules like "if a sub-limit exists for a peril, the peril's recovery is min(sub-limit, policy limit)" or "an unsatisfied warranty voids the affected cover from inception" as formal rules and *proving* the answer against them is qualitatively stronger than scoring it.

`[INFERENCE]` Cost of adoption is real: someone has to author the formal policy, and coverage is only as good as the rules encoded. Start with the 10–20 rules that produce the highest-severity errors (average clause, warranty breach, sub-limit precedence, aggregate vs each-and-every, deductible application order).

### 2.4 Azure and Google managed grounding

**Azure AI Content Safety — Groundedness detection**
- Concepts: https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/groundedness
- Quickstart: https://learn.microsoft.com/en-us/azure/ai-services/content-safety/quickstart-groundedness
- Foundry filter: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/content-filter-groundedness
- Pricing: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/content-safety/

`[FACT]` Two modes: **Non-Reasoning** (fast, binary grounded/ungrounded, for online use) and **Reasoning** (detailed explanations of which segments are ungrounded — for development and root-cause work). Domain selector: `Medical` or `Generic`. Task selector: `Summarization` or `QnA`. Request shape is `{domain, task, text, groundingSources[], qna:{query}}`.

`[FACT]` **Groundedness correction (preview)** returns a rewritten `Text` field with ungrounded content replaced by the grounded value. Microsoft's own examples are numeric: source says the interest rate is 4.5%, response says 5%, API returns the corrected "The interest rate is 4.5%."

`[FACT]` Documented limitations: **English only**; the feature is marked preview in the quickstart; region-limited; default query rate limits apply; max text length varies by mode.

`[FACT]` Content Safety pricing (Azure Retail Prices API, East US): **Standard Text Records $0.375 per 1,000**; Standard Images $0.75 per 1,000; commitment tier 1M text records $338/month with $0.338/1K overage. `[INFERENCE]` A "text record" is documented elsewhere in Content Safety as up to 1,000 characters; confirm the unit for the groundedness endpoint specifically, since it takes large grounding sources.

`[INFERENCE]` Auto-correction is tempting and I would **not** enable it for reported numbers. Silently rewriting a monetary amount destroys the audit trail and hides the fact that the pipeline was wrong. Use Reasoning mode to *detect and reject*, and keep the correction feature for non-liability-bearing prose like summaries.

**Google Vertex AI grounding + check-grounding API**
- Check grounding: https://cloud.google.com/generative-ai-app-builder/docs/check-grounding
- Sample: https://cloud.google.com/generative-ai-app-builder/docs/samples/genappbuilder-check-grounding
- Grounding overview: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/grounding/
- Grounding with Vertex AI Search: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-vertex-ai-search

`[FACT]` The **check grounding API returns an overall support score 0–1** indicating how much an answer candidate agrees with supplied facts, **plus citations to the facts supporting each claim** in the candidate. That per-claim citation output is the most directly useful shape of the three hyperscalers for a claim-level audit record.

`[FACT]` The `GroundingSupport` object in the Vertex AI API carries `confidenceScores` (0–1, one per `groundingChunkIndices` entry) — per-claim, per-chunk confidence.

`[FACT]` Grounding with Vertex AI Search supports a maximum of 10 data sources and can be combined with Grounding with Google Search. Web Grounding for Enterprise doesn't log customer data and supports VPC Service Controls.

`[INFERENCE]` If you want per-claim citations from a managed service rather than building them, Google's check-grounding is the closest fit. It is a separate call you make against your own facts, so it composes with any parser.

### 2.5 Constrained decoding / structured output with schema enforcement

`[FACT]` **OpenAI Structured Outputs** — https://developers.openai.com/api/docs/guides/structured-outputs/ and https://openai.com/index/introducing-structured-outputs-in-the-api/ — guarantees responses adhere to a supplied JSON Schema; also available on tools via `strict: true`. SDKs accept Pydantic (Python) and Zod (TS) schemas directly.

`[FACT]` **Anthropic Structured Outputs is generally available** on the Claude API — https://docs.anthropic.com/en/docs/build-with-claude/structured-outputs — usable two ways, with JSON (schema in the request) or with tools (output conforms to tool definitions). Also GA on Microsoft Foundry (requires a Hosted-on-Anthropic deployment). The Claude **Agent SDK** exposes structured outputs via an `output_format` option so an agent can use arbitrary tools and still return schema-valid JSON at the end — https://platform.claude.com/docs/en/agent-sdk/structured-outputs. `[THIRD PARTY]` Reported GA date 4 February 2026.

`[FACT]` **Google Gemini** exposes it via `response_schema`.

`[FACT]` Open source: **Outlines**, **LM Format Enforcer**, and **XGrammar** — XGrammar-2 shipped May 2026 (https://blog.mlc.ai/2026/05/04/xgrammar-2-fast-customizable-structured-generation), stating that the original XGrammar used constrained decoding to guarantee 100% structural correctness with near-zero overhead and has been adopted across many projects. vLLM, SGLang and Ollama have shipped grammar-constrained decoding for over a year. `[THIRD PARTY]`

`[FACT]` Research caveat worth reading before you trust schema compliance as accuracy: *Generating Structured Outputs from Language Models* (https://arxiv.org/html/2501.10868v1) notes that constrained-decoding frameworks have standardised on JSON Schema and mostly guarantee constraint compliance, but that there is **poor understanding of the effectiveness of these methods in practice**.

`[INFERENCE]` The distinction to hold onto: constrained decoding guarantees the *shape*, never the *content*. A 99.4% schema-validity rate `[THIRD PARTY]` says nothing about whether the number is right. Its value in your design is narrower but critical — it's what makes step 2 of §2.1 enforceable, because a schema of `{block_id, char_start, char_end}` with no `number` field means the model has no legal token sequence in which to emit a fabricated amount.

### 2.6 Open-source guardrails and evaluation frameworks

`[FACT]` **Guardrails AI** (https://www.guardrailsai.com) — validator-based input/output guarding with a hub of validators. **NVIDIA NeMo Guardrails** (https://github.com/NVIDIA/NeMo-Guardrails) — Colang-based programmable rails for dialogue flow, topical and safety rails.

`[FACT]` **Ragas** (https://docs.ragas.io) — reference-free RAG metrics: faithfulness, answer relevance, context precision/recall.

`[FACT]` **DeepEval** (https://deepeval.com) — unit-test-style LLM evaluation. Its **RAG triad** is answer relevancy + faithfulness + contextual relevancy (https://deepeval.com/guides/guides-rag-triad). Its **faithfulness** metric is LLM-as-judge over `actual_output` vs `retrieval_context` and is self-explaining — it returns a reason with the score (https://deepeval.com/docs/metrics-faithfulness).

`[FACT]` **TruLens** (https://www.trulens.org) — feedback functions oriented to continuous production monitoring; origin of the RAG-triad framing.

`[INFERENCE]` All four are LLM-as-judge at the core. For a liability pipeline they are the right tool for measuring *trend* across a corpus and for CI gating, and the wrong tool for gating an individual number — a judge model can be wrong about whether a judge-worthy claim is grounded. Use them on the eval suite (§5), not in the request path. Your request-path gate should be the deterministic span resolution from §2.1 plus a formal check from §2.3.

### 2.7 Current best practice when a wrong number is financial liability

`[INFERENCE]` Synthesising everything above, the controls I'd consider mandatory:

1. **No number without a verbatim span, page and bbox.** Empty citation = reject, never degrade to the model's value.
2. **Model emits span references; code resolves values.** Enforced by strict schema with no numeric fields.
3. **Deterministic numeric parsing with an explicit currency/basis model.** Parse "£1,000,000 any one occurrence and in the aggregate" into `{amount, currency, basis}` with a real grammar, not a regex, and fail loudly on unrecognised basis language.
4. **Two independent verifiers with different failure modes.** Semantic (Bedrock contextual grounding / Azure groundedness Reasoning mode / Vertex check-grounding) plus formal-logic (Bedrock Automated Reasoning) plus exact-string round-trip.
5. **Endorsement precedence as explicit state, not prose.** Model the policy as base wording + ordered endorsements, and make every reported value carry which document version it came from. Most real-world "wrong limit" incidents are stale-document incidents, not OCR incidents. `[INFERENCE]`
6. **Confidence-banded routing.** Use `parse_confidence` and `extract_confidence` separately: low parse → rescan/re-OCR; low extract → escalate to human; both high but logic check failed → escalate to underwriter, not to a retry.
7. **Abstention is a first-class answer.** The system must be able to return "not determinable from the supplied documents" and be *rewarded* for it in evals. Textract's behaviour of leaving a Queries answer blank rather than fabricating is the right model.
8. **Immutable audit record per reported number**, keyed by document hash + parser version + model version, so any figure can be reproduced and defended later.
9. **Never auto-correct a number.** Detect, reject, escalate. Azure's groundedness correction is genuinely useful for prose and genuinely dangerous for money.
10. **Human-in-the-loop with durable waits.** A review that takes three days must not hold a process open or lose state — this is why §4 matters to §2.

---

## 3. Retrieval at production grade

### 3.1 Hybrid search and reranking

`[FACT]` **Anthropic's Contextual Retrieval** — https://www.anthropic.com/news/contextual-retrieval, cookbook at https://platform.claude.com/cookbook/capabilities-contextual-embeddings-guide, appendix at https://assets.anthropic.com/m/1632cded0a125333/original/Contextual-Retrieval-Appendix-2.pdf. Two sub-techniques, Contextual Embeddings and Contextual BM25: prepend each chunk with a short model-generated summary anchoring it to the source document, then index both densely and lexically. Published results: top-20 retrieval failure rate reduced **35% with contextual embeddings alone, 49% with contextual embeddings + contextual BM25, 67% when reranking is added.** `[THIRD PARTY]` Several secondary sources render the 67% figure as 5.7% → 1.9% top-20 failure rate.

`[INFERENCE]` Contextual Retrieval is unusually well-suited to policy wordings, because the failure it fixes is precisely the policy-document failure: a chunk reading *"the limit under this section shall be £250,000 any one occurrence"* is meaningless without knowing which section, which endorsement, and which insured location. Prepending "This chunk is from Section III — Business Interruption, as amended by Endorsement 7 dated 2026-03-01, in policy XYZ" is the difference between a retrievable chunk and a landmine.

**Rerankers**

`[FACT]` **Cohere Rerank v4.0** shipped Dec 2025 — https://docs.cohere.com/changelog/rerank-v4.0. Two variants: `rerank-v4.0-pro` (SOTA quality, complex use cases) and `rerank-v4.0-fast` (low latency, high throughput). Both multilingual, both handle **semi-structured JSON documents**, **32K token context** (up from 4,096 in v3.5). Model list: https://docs.cohere.com/docs/rerank. Rerank is billed **per search**, not per token — https://docs.cohere.com/docs/how-does-cohere-pricing-work.

`[FACT]` Rerank pricing, per 1,000 searches, read live from the Azure Retail Prices API (Cohere Models in Azure AI Foundry, East US):

| Model | Global | Data-zone |
|---|---|---|
| Rerank v4 Pro | **$2.50** | $2.75 |
| Rerank v4 Fast | **$2.00** | $2.20 |

Also on the same meter list: Cohere **Embed v4** text **$0.12 per 1M tokens**, image **$0.47 per 1M tokens**; Azure AI Search's own **Semantic Reranker $1.00 per 1,000 queries**. `[INFERENCE]` These are Foundry-hosted prices; Cohere's direct platform prices may differ (their own pricing page renders client-side and did not yield figures). `[THIRD PARTY]` A secondary source quotes direct rerank pricing as $0.0025/search Pro, $0.002/search Fast, $0.001/search v3.5 — consistent with the Azure numbers.

`[FACT]` **Voyage AI** (now part of MongoDB) — https://docs.voyageai.com/docs/pricing. Rerankers billed on total processed tokens, computed as *(query tokens × number of documents) + sum of tokens in all documents*:

| Model | $/1M tokens | Est. $/request* | Free tokens |
|---|---|---|---|
| `rerank-2.5` | **$0.05** | $0.0025 | 200M |
| `rerank-2.5-lite` | **$0.02** | $0.001 | 200M |

*Voyage's own estimate assumes 100 documents and query+doc = 500 tokens.

`[FACT]` Voyage embeddings, $/1M tokens: `voyage-4-large` $0.12, `voyage-4` $0.06, `voyage-4-lite` $0.02, **`voyage-context-4` $0.12**, `voyage-code-4` $0.12; legacy domain models `voyage-law-2` and `voyage-finance-2` $0.12 (50M free). Multimodal `voyage-multimodal-3.5` $0.12/M text tokens + $0.60/B pixels. Batch API: 12-hour window, **33% discount** (free credits don't apply to batch). Files API storage $0.05/GB/month.

`[FACT]` **`rerank-2.5` supports instruction-following via natural-language steering and a 32K combined context per query–document pair, with up to 8K for the query.** `[VENDOR CLAIM]` Across 93 retrieval datasets, `rerank-2.5` claimed +7.94% accuracy over Cohere Rerank v3.5; `rerank-2.5-lite` claimed +7.16% over v3.5 and +10.36% on MAIR (Massive Instructed Retrieval Benchmark).

`[INFERENCE]` Two things here are directly valuable for policy text. **`voyage-context-4`** is a contextualised-chunk embedding model — it does at the model level what Anthropic's Contextual Retrieval does with an LLM preprocessing pass, at $0.12/M tokens instead of a generation call per chunk. And **instruction-following rerank** lets you steer with "prefer passages that state a monetary limit or deductible for the named peril" rather than relying on the query embedding alone.

`[FACT]` `voyage-law-2` exists as a legal-domain embedding model. `[INFERENCE]` Worth an A/B against `voyage-4-large` and `voyage-context-4` on your corpus, but it's a generation behind, so don't assume domain-tuning beats a newer general model.

`[FACT]` Other rerankers in production use: **BGE reranker** family (BAAI, open weights, self-hostable) and **Jina reranker** — both viable if you need on-prem or want to avoid per-search fees. `[INFERENCE]` Self-hosting a BGE/Jina reranker on a single GPU is usually cheaper than $2/1K searches above a few million searches/month, at the cost of running it.

### 3.2 Late interaction: ColBERT, ColPali, ColQwen

`[FACT]` **ColPali: Efficient Document Retrieval with Vision Language Models** — https://arxiv.org/abs/2407.01449, ICLR 2025 (https://openreview.net/forum?id=ogjBpZ8uSi), models/data/code/benchmarks at https://hf.co/vidore. A VLM producing multi-vector embeddings from **images of document pages**; combined with ColBERT-style late-interaction matching it *"largely outperforms modern document retrieval pipelines while being drastically simpler, faster and end-to-end trainable."* Indexes pages as images rather than OCR-derived text, represents each page as patch-level embeddings, and ranks pages by late interaction. The **ViDoRe** benchmark ships with it.

`[FACT]` **Reproducibility, Replicability, and Insights into Visual Document Retrieval with Late Interaction** — https://arxiv.org/html/2505.07730v1 — confirms late interaction yields considerable retrieval-effectiveness gains but **introduces computational inefficiencies at inference**.

`[FACT]` **A Comprehensive Evaluation of Retrieval Augmented Generation in Complex Real-World Scenarios** — https://arxiv.org/abs/2601.08620 (Jan 2026) — findings as stated in the abstract: **visual retrievers outperform textual ones; late-interaction models and textual reranking substantially improve performance; hybrid or purely visual contexts enhance answer generation quality.**

`[FACT]` OpenSearch has published a three-way benchmark of multimodal document search approaches including patch-level late interaction: https://opensearch.org/blog/benchmarking-multimodal-document-search-in-opensearch-three-approaches-compared/

`[FACT]` A relevant caution on visual grounding: an Aalto University paper argues that much of what is called a VLM "grounding" problem is an *interface* problem — when asked to output bounding-box coordinates as evidence, VLMs mostly fail. `[THIRD PARTY]` reported via https://aiweekly.co/alerts/aalto-paper-vlm-attribution-bottleneck-is-coordinates-not-skill

`[INFERENCE]` Implication for your design: use ColPali-class visual retrieval to *find the page*, and a dedicated document-AI parser to *ground the span*. Do not ask a VLM to hand you the bounding box of the limit. Visual retrieval earns its keep on scanned endorsements and stamped/handwritten schedule amendments where OCR text is unreliable but the page is visually distinctive. The inference cost of multi-vector indexes over a large policy corpus is the trade-off — budget for it or restrict visual retrieval to a rerank stage over the top-k pages from cheap text retrieval.

### 3.3 RAPTOR and GraphRAG

`[FACT]` **RAPTOR** (Recursive Abstractive Processing for Tree-Organized Retrieval) builds a hierarchical summary tree over chunks and retrieves across levels. **Microsoft GraphRAG** — https://github.com/microsoft/graphrag — builds an entity/relationship knowledge graph plus community summaries and answers global queries over them.

`[INFERENCE]` For your problem I'd rank these below hierarchy-aware chunking. A policy already *has* an authored hierarchy — sections, sub-sections, numbered clauses, the schedule, then endorsements in date order. Landing AI's `Section` API, Azure CU's semantic chunking, and Google's ancestral-heading chunking all give you that real hierarchy for free. RAPTOR's *inferred* tree of LLM-written summaries is strictly worse for citation purposes, because a summary node is not a verbatim span and cannot be cited. GraphRAG earns its place for a different question — cross-portfolio queries like "which policies in this book share this exclusion wording" or "trace how this sub-limit changed across three renewals" — where the entities are policies, perils, insureds and endorsements. Keep summary/graph structures strictly as *navigation* aids that route you to leaf spans; never cite them.

### 3.4 Vector databases

| Product | Licence/model | Hybrid (BM25 + dense) | Notes |
|---|---|---|---|
| **pgvector** | PostgreSQL extension, open source | via Postgres FTS (`tsvector`) | `[THIRD PARTY]` Postgres 17/18 improved HNSW indexing and parallel query execution and the extension had a major overhaul; described as fully production-grade under ~10M vectors with the simplest operational story. Vectors, metadata, joins and ACID in one database. |
| **Qdrant** | Apache-2.0 + cloud | yes, native sparse+dense fusion | `[THIRD PARTY]` fast, memory-efficient; one comparison claims 2.4× lower p99 latency than pgvector above 5M vectors on the same hardware. |
| **Weaviate** | BSD-3 + cloud | yes, strong hybrid + multi-tenancy | `[THIRD PARTY]` v1.37.x stable with v1.38 RC as of July 2026; has an agentic Query Agent. |
| **Turbopuffer** | managed, object-storage-native | yes | `[THIRD PARTY]` chosen when storage cost at massive scale is the real problem. |
| **LanceDB** | Apache-2.0, embedded + cloud | **native BM25 + vector hybrid, embeddable** | `[THIRD PARTY]` lowest-friction self-host with real hybrid built in. |
| **Vespa** | Apache-2.0 | **BM25 as a first-phase rank feature** | `[THIRD PARTY]` the only one framed as search-engine-grade lexical relevance, with BM25 cheap enough for first-phase ranking and multi-phase ranking natively. Also supports multi-vector/late-interaction ranking. Highest operational complexity. |

Sources: https://www.firecrawl.dev/blog/best-vector-databases · https://discuss.huggingface.co/t/vespa-vs-qdrant-vs-turbopuffer-for-large-scale-hybrid-search-bm25-text-image-vectors/171610/2 · https://huggingface.co/blog/ImranzamanML/pgvector-vs-elasticsearch-vs-qdrant-vs-pinecone-vs · https://d-central.tech/self-hosted-vector-databases/

`[INFERENCE]` All of the above are third-party comparisons with the usual problem — contradictory benchmarks and undisclosed tuning. Treat the table as a shortlist, not a ranking.

### 3.5 Best combination for precision on legal/contract text

`[INFERENCE]` What I would build, and why:

**Index:** one row per leaf clause/table-cell-group, each carrying `{doc_id, doc_version, section_path, clause_number, page, bbox, block_id, verbatim_text, contextual_prefix}`. The `contextual_prefix` is the Anthropic Contextual Retrieval summary, generated once at ingest, anchoring the chunk to policy, section, and endorsement state.

**Stage 1 — recall, run both:**
- BM25/lexical over `contextual_prefix + verbatim_text`. **Do not skip this and do not down-weight it.** Legal text is a controlled vocabulary: "Average", "Warranty", "each and every loss", "in the aggregate", "First Loss", "Coinsurance", "Sub-limit", "Deductible" are *defined terms*. Dense embeddings routinely conflate "deductible" with "excess" with "self-insured retention" — which are related but not identical, and the difference is money. Exact term matching is a feature here, not a legacy fallback.
- Dense over the same text with `voyage-context-4` (or `voyage-4-large` / Cohere `embed-v4`).
- Fuse with RRF.

**Stage 1b — optional visual recall** for scanned endorsements: ColPali/ColQwen page retrieval, merged into the candidate set.

**Stage 2 — rerank:** `rerank-2.5` with an instruction, or `rerank-v4.0-pro` if you need its JSON-document handling for schedule rows. Both give 32K context, so a whole clause plus its heading fits without truncation. `[INFERENCE]` The 32K context is the practical reason to prefer v4/2.5 over v3.5's 4,096 — insurance clauses are long and truncation at 4K silently drops the operative proviso.

**Stage 3 — section-scoped filtering:** hard filter by `section_path` and `doc_version` before generation, so General Exclusions can never be returned as a Section II exclusion and a superseded endorsement can never be cited as current.

**Vector store choice:** `[INFERENCE]` pgvector if you're under ~10M vectors and want one database for vectors, the immutable parser output, the audit trail and the ACID guarantees you need for a liability record — the operational simplicity is worth more than the latency delta at your scale. Vespa if you need genuine search-engine lexical ranking plus late-interaction in one engine and can staff it. Qdrant as the middle path above 10M vectors.

`[INFERENCE]` One more precision lever specific to this domain: index defined terms as a separate lookup. Policy wordings define their own vocabulary ("Damage", "Premises", "Period of Insurance", "Sum Insured"), and the definition is usually in a Definitions section far from the operative clause. Resolve defined terms at retrieval time and attach the definitions to the context. Without this, an LLM will apply the ordinary-English meaning of a capitalised defined term and be confidently wrong.

---

## 4. Agent orchestration for long-running autonomous agents

### 4.1 The core distinction: checkpointing is not durable execution

`[FACT]` Temporal's own framing, from the LangGraph plugin announcement (https://temporal.io/blog/temporal-langgraph-plugin-durable-execution): *"LangGraph checkpoints state, but checkpoints are not durable execution. A LangGraph run lives in a single process, so if that process dies then the run dies with it. The checkpoint preserves your data, not your execution: something has to detect the failure, decide where to re-enter the graph, and restart it."*

`[FACT]` Diagrid makes the same argument more broadly across LangGraph, CrewAI and Google ADK: https://www.diagrid.io/blog/checkpoints-are-not-durable-execution-why-langgraph-crewai-google-adk-and-others-fall-short-for-production-agent-workflows

`[INFERENCE]` This is the single most important thing to internalise for "an agent that runs for months and must never lose state". A checkpointer answers *what was the state*. A durable execution runtime answers *who notices the crash, decides where to resume, and re-enters*. You need the second, and if you don't buy it you will build it.

### 4.2 Temporal — with a first-party LangGraph plugin

- https://temporal.io · plugin post: https://temporal.io/blog/temporal-langgraph-plugin-durable-execution
- LangChain's own comparison: https://www.langchain.com/resources/langgraph-vs-temporal

`[FACT]` **Temporal's LangGraph integration for Python is in Public Preview** (as of the post, dated ~mid-2026), alongside LangSmith integrations for Python and TypeScript. Install: `uv add "temporalio[langgraph]"` and `uv add "temporalio[langsmith]"`.

`[FACT]` How it works: your LangGraph graph runs as a Temporal **Workflow**; each node can execute as a Temporal **Activity**; **execution is checkpointed at every node.** You add `metadata={"execute_in": "activity", "start_to_close_timeout": ...}` to nodes and register the graph with `LangGraphPlugin(graphs={...})` on the Worker. Your LangGraph code otherwise stays as-is.

`[FACT]` Supports both LangGraph APIs — Graph API (`StateGraph`) and Functional API (`@entrypoint`/`@task`) — plus `interrupt`, `Send`, and `continue-as-new`. Requires **Temporal Python SDK ≥ 1.27.0**, and Python 3.11+ for the Functional API.

`[FACT]` Human-in-the-loop: when a node calls `interrupt()`, the workflow pauses **durably** — no process held open, no compute burning. A Temporal signal resumes the graph exactly where it paused, and *"the pause is scoped to the branch that needs review; the rest of the graph keeps moving."* Temporal states plainly: *"That `wait_condition` is free whether it waits an hour or a month."*

`[FACT]` Long-running claims: *"There are production agents on Temporal that run for months right now. Some of these will keep running for years."* `[VENDOR CLAIM]` With `continue-as-new`, a workflow can run indefinitely without accumulating unbounded history. Large-payload support keeps growing state (conversation history, retrieved documents, generated artefacts) moving with the run instead of needing side-channel storage.

`[FACT]` Observability: the LangSmith integration **propagates trace context across Workflow and Activity boundaries so one agent run reads as one LangSmith trace**, regardless of how many machines it touched or how many steps were retried.

`[FACT]` Temporal also ships integrations with the **OpenAI Agents SDK, Google ADK, and AWS Strands**, and supports 8 SDK languages. Named users in the post: OpenAI, Cursor, Lovable, Block, Abridge, Hebbia. `[VENDOR CLAIM]`

`[FACT]` `[THIRD PARTY]` Licensing/ops summary from a comparison piece: Temporal is MIT-licensed open source, offers deterministic replay, and demands high operational investment plus some application re-architecture.

### 4.3 The alternatives

`[THIRD PARTY]` From https://www.workflowbuilder.io/blog/ai-orchestration-tools and https://www.spheron.network/blog/ai-agent-workflow-orchestration-temporal-inngest-restate-gpu-cloud/:

- **Inngest** (https://www.inngest.com) — event-driven step functions, strong DX, **no local workers required**, SSPL-licensed, well suited to serverless stacks, billed per function/step execution.
- **Restate** (https://restate.dev) — lightweight single-binary runtime for FaaS and low latency; **BSL-licensed server, MIT SDKs**. Its own positioning against Temporal (https://restate.dev/vs/temporal): *"Temporal makes individual workflows durable. Restate makes entire systems durable"* — a durable runtime for services and the interactions between them, rather than forcing everything into a workflow/activity shape. `[VENDOR CLAIM]`
- **AWS Step Functions** — managed, deep AWS integration, 1-year max execution for standard workflows. `[INFERENCE]` That ceiling matters if you literally mean "runs for months"; you'd chain executions.
- **Prefect** (https://www.prefect.io) — `[INFERENCE]` a data-pipeline orchestrator with retries and observability, not a durable-execution runtime with deterministic replay. Fine for scheduled batch re-ingest of a policy corpus; not the right tool for a months-long stateful agent.
- **LangGraph** (https://docs.langchain.com/oss/python/langgraph/durable-execution) — persistence via checkpointers and thread IDs gives memory across turns and sessions and lets an agent resume after interruption. Necessary, not sufficient, per §4.1.

### 4.4 Agent SDKs and MCP

`[FACT]` **MCP spec `2026-07-28`** is live — https://claude.com/blog/bringing-mcp-2026-07-28-to-claude. It is the **fifth** spec release, and it *"moves MCP to a stateless core, while hardening authorization and graduating official extensions."* Support rolling out across Claude products.

`[FACT]` **Claude Agent SDK** — https://platform.claude.com/docs/en/agent-sdk/ — runs on the same runtime as Claude Code, so you inherit built-in Read/Edit/Bash/Grep tools, a layered permission system gating what the agent can touch, automatic prompt caching, and direct access to the event stream for progress streaming or mid-run interception. Supports structured outputs via `output_format`. `[THIRD PARTY]` Claude Agent SDK usage began drawing from a separate monthly Agent SDK credit on 15 June 2026.

`[FACT]` **OpenAI Agents SDK** — https://openai.github.io/openai-agents-python/ and https://openai.com/index/the-next-evolution-of-the-agents-sdk/. The updated SDK targets agents that *"inspect files, run commands, edit code, and work on long-horizon tasks within controlled sandbox environments"*, coordinating across tools, files, memory, approvals and sandbox compute. Migration guides exist in both directions (https://developers.openai.com/cookbook/examples/agents_sdk/migrate-from-claude-agent-sdk/readme and https://platform.claude.com/cookbook/claude-agent-sdk-04-migrating-from-openai-agents-sdk).

`[FACT]` OpenAI Agents SDK works with MCP, so framework choice and tool protocol are independent decisions. `[THIRD PARTY]`

`[THIRD PARTY]` Other 2026 releases worth knowing: Microsoft Agent Framework 1.0 GA on 3 April 2026 (merging AutoGen and Semantic Kernel into one .NET and Python SDK), Google ADK 1.0 for Java and Go, CrewAI past 52,000 GitHub stars, plus Pydantic AI and smolagents. Source: https://www.morphllm.com/ai-agent-framework

### 4.5 How to build an agent that continuously monitors and must never lose state

`[INFERENCE]` The design I'd defend for a policy-monitoring agent:

1. **Durable execution runtime as the substrate.** Temporal, with the LangGraph plugin if you want LangGraph's authoring model. Every node an Activity with an explicit `start_to_close_timeout` and retry policy.
2. **`continue-as-new` on a cadence** (per monitoring cycle, or per N events) so history stays bounded while the logical run lives indefinitely. This is the specific mechanism that makes "runs for months" real rather than aspirational.
3. **Durable waits for everything external.** Underwriter review, broker response, a carrier publishing a revised wording — all Temporal signals/timers, which cost nothing while waiting. Never poll in a held-open process.
4. **State split by mutability.** Immutable facts (parser output, verbatim spans, doc hashes) go in Postgres/object storage and are referenced by ID from workflow state. Workflow state carries IDs and decisions, not blobs. This keeps replay cheap and makes the audit record independent of the orchestrator.
5. **Idempotency keys on every side effect.** Every LLM call, every parse job, every notification gets a deterministic key derived from `(workflow_id, node, attempt_input_hash)` so a replay after crash cannot double-charge a parse or double-send an alert.
6. **Deterministic workflow code.** No `datetime.now()`, no random, no direct network calls in workflow bodies — all of it in Activities. This is Temporal's hard constraint and the most common source of subtle bugs when teams port existing agent code.
7. **One trace per run.** LangSmith via Temporal's integration, or OTel spans propagated across Activity boundaries. A months-long agent whose trace fragments at every worker restart is unauditable.
8. **Versioning strategy from day one.** A workflow that runs for months *will* be deployed over mid-run. Use Temporal's versioning/patching so in-flight runs keep the old code path deterministically. `[INFERENCE]` This is the failure mode teams discover at month three.

---

## 5. LLM observability and evaluation

### 5.1 The platforms

| Platform | URL | Licence / hosting | Notes |
|---|---|---|---|
| **Langfuse** | https://langfuse.com · https://langfuse.com/pricing-self-host | **MIT core, free unlimited self-host** | `[FACT]` **Acquired by ClickHouse, announced 16 January 2026** alongside ClickHouse's $400M Series D — https://clickhouse.com/blog/clickhouse-acquires-langfuse-open-source-llm-observability and https://clickhouse.com/blog/clickhouse-raises-400-million-series-d-acquires-langfuse-launches-postgres. Langfuse's own post (https://langfuse.com/blog/joining-clickhouse) states it *stays open source and self-hostable with no planned licensing changes*. Backend already ran on ClickHouse (requires ≥ 24.3). `[THIRD PARTY]` ~$800M valuation, 2,000+ paying customers, 26M+ monthly SDK installs. `[THIRD PARTY]` ~$101/mo at 1M events cloud. |
| **LangSmith** | https://smith.langchain.com | proprietary SaaS | `[FACT]` Temporal ships a first-party LangSmith integration that keeps one durable agent run as one trace. `[THIRD PARTY]` ~$2,514/mo at 1M base traces; LangChain-first. |
| **Braintrust** | https://www.braintrust.dev | proprietary SaaS | `[THIRD PARTY]` Most generous free tier — 1M spans/month, 10K eval runs, unlimited users — and the strongest CI/CD eval-gated deployment workflow. Reported unicorn valuation, $150M → $800M in 16 months. |
| **Arize Phoenix** | https://phoenix.arize.com | open source, OTel-native | `[THIRD PARTY]` Lightest OTel-native self-host, **no event caps**; repeatedly called out as the strongest for serious RAG evaluation. |
| **W&B Weave** | https://wandb.ai/site/weave | proprietary SaaS | `[THIRD PARTY]` Solid if you're already on W&B for training. |
| **Comet Opik** | https://www.comet.com/site/products/opik/ | Apache-2.0, free self-host on ClickHouse | `[THIRD PARTY]` open-source eval + observability in one tool. |
| **Traceloop / OpenLLMetry** | https://www.traceloop.com | open source | `[THIRD PARTY]` the OTel-native instrumentation standard. |

`[INFERENCE]` For a liability-bearing insurance pipeline, self-hosting matters beyond cost: your traces contain policy wordings, insured names, and sums insured. Langfuse (MIT, self-host, now ClickHouse-backed and -owned) or Arize Phoenix (OTel-native, no caps) are the defensible choices. Braintrust's free tier is genuinely the best way to start systematic evaluation before you have budget, but check its data-residency terms against your own before real policy data goes in. Use OTel-native instrumentation so you aren't locked in — the platform you pick in month one is rarely the one you run in year two.

### 5.2 Building a regression eval suite for document extraction with human-labelled ground truth

`[INFERENCE]` This is the part most teams under-invest in, so specifics:

**Build the label set**
- **Label spans, not just values.** Ground truth per field is `{value, page, verbatim_span, block_id}`. A pipeline that gets £250,000 right by citing the wrong clause is a latent failure that will surface on a document where the coincidence doesn't hold. If you only label values, you cannot detect it.
- **Stratify deliberately.** Sample across: carrier/wording family; born-digital vs scanned vs photographed; document type (wording / schedule / endorsement / MTA); table complexity (flat schedule vs merged-cell nested schedule of values); and the awkward cases — nil deductibles, sub-limits expressed as percentages, "whichever is the greater", aggregate vs each-and-every, currency other than base, and endorsements that delete a clause entirely.
- **Include a hard negative set.** Documents where the field genuinely isn't present. The correct answer is abstention, and this is the only way to measure whether your pipeline invents values under pressure. `[INFERENCE]` I'd make this at least 15% of the suite.
- **Two labellers plus adjudication** on the initial set, and record inter-annotator agreement. Where two insurance people disagree about what the limit is, your model's "error" may be the document being ambiguous. Keep those cases in a separate `ambiguous` bucket and score them on whether the system flags ambiguity rather than on exact match.
- **Freeze and version the set.** Store as data (JSONL + the source PDFs, content-addressed by hash), in the repo or object storage, versioned. Ground truth that drifts silently invalidates every historical comparison.

**Metrics that actually gate a release**
- **Exact-value accuracy** per field type, with a normalisation function you own and test separately (currency, thousands separators, "1m" vs "1,000,000", basis).
- **Span-grounding accuracy** — is the cited span the labelled span (or overlapping it above an IoU/character threshold)? Report separately from value accuracy.
- **Page accuracy** — cheap, and catches whole classes of retrieval failure.
- **Hallucination rate** — proportion of returned values with no verbatim support. `[INFERENCE]` This is your headline number and its target is zero, not "low". Any non-zero value is a P1.
- **Abstention precision/recall** on the hard negative set. Penalise confident answers on absent fields far more than missed answers.
- **Escalation rate and escalation precision** — what fraction routes to human review, and of those, what fraction genuinely needed it. A pipeline that escalates everything is safe and useless.
- **Calibration** — bucket by reported confidence and check observed accuracy per bucket. If your 0.9-confidence bucket is 82% accurate, your thresholds are lies. Azure publishes AUROC for its confidence model precisely because this matters; measure your own end-to-end.
- **Cost and latency per document**, tracked alongside accuracy, so you can see the real trade when someone proposes moving from Agentic to Cost-effective tier.

**Wire it as CI, not as a notebook**
- Run the full suite on every change to prompt, schema, parser version, model version, chunking strategy or retrieval config. All six are inputs; a "prompt-only change" that regresses extraction is the most common surprise.
- **Gate on per-field thresholds, not an aggregate.** An aggregate F1 hides a 20% regression on `average_clause` behind a 2% gain on `policy_number`. Insurance fields are not fungible — deductible errors and limit errors have different severities and should have different gates.
- **Pin the judge.** If you use LLM-as-judge for anything (clause-condition equivalence, exclusion paraphrase), pin the judge model version and re-baseline explicitly when you change it, or you cannot distinguish a system regression from a judge shift.
- **Golden-set + shadow production.** The frozen suite catches regressions; sampling real production documents into the label queue catches distribution shift when a new carrier's wording arrives. Feed every human-review escalation and every human correction straight back into the label set — that's your highest-value labelling signal and it's free.
- **Track by document, not by field, for release decisions.** "97% field accuracy" across a 40-field schedule means the average document has ~1.2 wrong fields. Report *documents with zero errors* as well.

`[FACT]` Framework support: Braintrust and LangSmith both offer dataset + experiment + CI-gating primitives; Langfuse and Phoenix both support datasets and scored runs; DeepEval is explicitly unit-test-shaped (`assert`-style) and is the easiest to drop into an existing pytest suite; Ragas gives you reference-free RAG metrics when you don't have labels for a subset.

---

## 6. Insurance-specific AI

### 6.1 ACORD — standards and its own AI initiatives

- https://www.acord.org · implementation resources: https://www.acord.org/standards-architecture/implement-standards
- On AI and data standards: https://www.acord.org/ACORD-about/acord-news/2025/08/01/why-data-standards-are-the-unsung-hero-of-ai-in-insurance

`[FACT]` **ACORD Transcriber** — an ACORD Solutions Group product that *"facilitates data extraction from any structured or unstructured insurance document."* Integrated into **Salesforce Financial Services Cloud** for US P&C carriers and brokers, targeting ACORD P&C Forms specifically. Announced 9 October 2024: https://www.acord.org/ACORD-about/acord-news/2024/10/09/acord-solutions-group-expands-collaboration-with-salesforce-financial-services-cloud-to-drive-standardized-digital-data-exchange

`[FACT]` **ADEPT (ACORD Data Exchange Platform & Translator)** — real-time exchange of standardised data between brokers, insurers and reinsurers, directly or via any major placing platform. Carries **ACORD Global Reinsurance & Large Commercial (GRLC)** placing, accounting and claims messages, and is explicitly tied to London Market modernisation / **Blueprint Two** compliance. **ADEPT Placing** launched 20 November 2024 as a single gateway. **Aon completed its ADEPT integration, announced 20 May 2026**: https://www.acord.org/ACORD-about/acord-news/2026/05/20/aon-completes-transformative-integration-with-acord-solutions-group-s-adept-to-accelerate-seamless-placing-transactions

`[FACT]` **ACORD Next-Generation Digital Standards** are designed to work across any technology interface and support microservices and RESTful APIs, not just the legacy XML/EDI shapes.

`[FACT]` **ACORD IAAC** (Insurance Analytics and AI Council, per the formation press release) exists to advance digital communication and P&C market efficiency by ensuring data is consistent, high-quality and standardised: https://www.acord.org/docs/default-source/outreach-advocacy/iaac/press-release-announcing-formation-of-acord-iaac.pdf

`[FACT]` ACORD's own position on AI, from their Aug 2025 piece: AI models require structured, high-quality, interoperable data, and without it *"even the most sophisticated algorithms can produce biased, opaque, or unreliable results."*

`[FACT]` **ACORD Test Harness** — a live application for testing message implementation, after which organisations can claim an **ACORD System Certified** credential.

`[FACT]` On the Life/health side, ACORD Underwriting Data Standards were built to standardise medical underwriting inputs and explicitly *"enable the transition from passing PDFs to passing structured data"* end-to-end from vendor through distribution to carrier and reinsurer.

`[INFERENCE]` Concrete advice: make your extraction schema **ACORD-mappable from the start**, even if you never send an ACORD message. Two reasons. First, ACORD's data model has already resolved the taxonomy arguments you're about to have — what a limit is versus a sub-limit, how deductibles and retentions differ, how endorsements relate to a base policy. Reusing that taxonomy is free and defensible in an audit. Second, ADEPT/GRLC is the actual integration surface for London Market and large commercial, so if your system ever needs to exchange data rather than just read it, an ACORD-shaped internal model saves a migration. `[INFERENCE]` Note the strategic tension: ACORD Transcriber is a competitor to what you're building for the ACORD-forms slice, but ACORD forms are structured applications and certificates, not policy wordings — the dense-nested-schedule and clause-condition problem is not what Transcriber is aimed at.

### 6.2 Published research and benchmark datasets

`[FACT]` **INSEva + INS-S1** — *An Industrial-Scale Insurance LLM Achieving Verifiable Domain Mastery and Hallucination Control without Competence Trade-offs* — https://arxiv.org/abs/2603.14463 (HTML: https://arxiv.org/html/2603.14463). Releases **INSEva, described as the most comprehensive insurance benchmark to date at 39k+ samples.** INS-S1 claims SOTA on domain tasks, significantly outperforming DeepSeek-R1 and Gemini-2.5-Pro, while maintaining general capability and achieving **a record-low 0.6% hallucination rate measured by HHEM.** `[VENDOR CLAIM]` on the metrics; `[FACT]` that the benchmark is released.

`[INFERENCE]` This is the most directly relevant paper in the set, for two reasons: it is the largest public insurance benchmark, and it measures hallucination explicitly with HHEM (Vectara's Hughes Hallucination Evaluation Model) rather than only accuracy. HHEM is worth adopting as one of your own metrics because it's cheap, open, and gives you a comparable number.

`[FACT]` **World's First Insurance LLM Evaluation Benchmark** — https://arxiv.org/abs/2511.07794 — evaluated 11 mainstream LLMs and found general-purpose models suffer common bottlenecks including **weak actuarial capabilities and inadequate compliance adaptation.**

`[FACT]` **InsQABench** — https://arxiv.org/abs/2501.10943 (HTML: https://arxiv.org/html/2501.10943) — Chinese insurance-domain QA benchmark. Finding: LLMs *"struggle with domain-specific terminology and nuanced clause texts"*, and fine-tuning on InsQABench significantly improves performance. `[INFERENCE]` "Nuanced clause texts" is exactly your problem, and the finding argues against relying on a general model's unaided reading of policy language.

`[FACT]` **Benchmarking Large Language Models for Quebec Insurance: From Closed-Book to Retrieval-Augmented Generation** — https://arxiv.org/abs/2603.07825 — evaluates **51 LLMs** across closed-book and RAG paradigms over a specialised corpus of Quebec insurance documents. Reported conclusion: current architectures approach expert-level proficiency at roughly **79%**. `[INFERENCE]` Read that number as a warning, not a reassurance — 79% is nowhere near acceptable for a reported limit, which is precisely why the span-grounding architecture in §2.1 exists rather than a better prompt.

`[FACT]` **A Hybrid Architecture for Multi-Stage Claim Document Understanding** (Fullerton Health) — https://arxiv.org/pdf/2601.01897v1 — production system across nine Asian markets using PaddleOCR + logistic-regression classifier + Qwen2.5-VL-7B. Reported: **>95% document-type classification accuracy, ~87% field-level extraction accuracy, <2s average latency per document.**

`[FACT]` **Claim Automation using Large Language Model** — https://arxiv.org/html/2602.16836 — domain-specific fine-tuning substantially outperformed commercial general-purpose and prompt-based LLMs, with ~80% of evaluated cases achieving near-identical matches to ground-truth corrective actions.

`[INFERENCE]` What's missing from the literature, and it's a gap you should expect to fill yourself: there is **no public benchmark for commercial policy-wording extraction with span-level ground truth** — limits, sub-limits, deductibles, warranties, average clauses and exclusions labelled with page and verbatim span. INSEva is QA-shaped, InsQABench is QA-shaped and Chinese, the Quebec work is RAG-QA. Your labelled corpus (§5.2) will be a genuine asset, and if you ever want to publish, that's the contribution.

### 6.3 Products doing policy comparison and coverage-gap detection

`[FACT]` **FurtherAI** — https://www.furtherai.com/blog/policy-analysis-software-insurers — positions policy analysis software for commercial insurers around extracting data from quotes, binders and policies, comparing coverages and exclusions across documents, and validating decisions against underwriting and regulatory rules.

`[FACT]` **Patra** — https://www.patracorp.com/resources/blogs/the-new-standard-in-coverage-gap-analysis/ — describes an AI-powered Gap Analysis tool that automatically extracts and flags hidden exclusions, restrictive line-of-business language, and reduced coverage limits, framing the question as *"where is the client vulnerable"* rather than *"is the policy there"*.

`[FACT]` **Nomad Data** — https://www.nomad-data.com/blog/ai-insurance-policy-comparison-coverage-drift — frames the problem as **coverage drift at renewal**, and is explicit that AI should help identify differences across long inconsistent policy documents *while preserving the human judgement required to decide whether those differences matter.*

`[INFERENCE]` That last framing is the correct product posture for your build, and it's also the safest legal posture: surface the delta with citations, let a human decide materiality.

**A live, concrete example of why this matters right now:** `[FACT]` In January 2026 the Insurance Services Office introduced new endorsements — reported as **CG 40 47, CG 40 48 and CG 35 08** — that let carriers exclude generative-AI claims from standard commercial general liability policies. `[THIRD PARTY]` (https://www.businessinsuranceusa.com/blog/insurance/ai-coverage-gap-small-business-insurance-2026/ and https://lawandkoffee.substack.com/p/your-policy-renewed-your-ai-coverage). `[THIRD PARTY]` Related reporting says major carriers including Chubb, Travelers and Berkshire Hathaway sought and received state approval to add explicit AI exclusions to GL, D&O and E&O policies in late 2025 into 2026.

`[INFERENCE]` This is a textbook test case for your system and I'd build it as an acceptance test: a policy renews on materially the same terms, one endorsement form number changes, and the practical effect is an entire category of loss becoming uncovered. The failure mode is not extraction — the endorsement is plainly there. It's *detecting that a new form number is material* and surfacing it. That requires a form-number registry, endorsement-level diffing between renewal terms, and a materiality classifier — and it's the thing that distinguishes a policy-reading tool from a policy-*monitoring* agent. It also maps directly onto §4's requirement for an agent that runs for months: the value is in noticing the change at renewal N+1, not in reading renewal N well.

---

## 7. Consolidated cost model (per 1,000 pages, USD, list price)

`[FACT]` for each cited figure; `[INFERENCE]` for the composition.

| Layer | Option | $/1K pages |
|---|---|---|
| OCR only | AWS DetectDocumentText | 1.50 |
| | Google Enterprise Document OCR | 1.50 |
| | Azure DI Read | 1.50 |
| | LlamaParse Fast | 1.25 |
| Layout + tables + geometry | **AWS Tables + Layout** | **15.00** |
| | Azure CU Doc Content Extraction Standard | 5.00 (+5.00 Add-On Layout) |
| | Azure DI Layout / prebuilt | 10.00 |
| | Google Gemini Layout Parser (incl. chunking) | 10.00 |
| | LlamaParse Cost-effective (+layout) | 3.75 (+3.75) |
| | Reducto Parse standard / complex | 15.00 / 30.00 |
| High-fidelity / agentic parse | Reducto agentic complex | 60.00 |
| | LlamaParse Agentic / Agentic Plus | 12.50 / 56.25 |
| Schema extraction | Azure DI custom neural or custom generative | 30.00 |
| | Google Custom Extractor | 30.00 (+$0.05/hr hosting per version) |
| | AWS Custom Queries | 25.00 |
| | Reducto Extract standard | 30.00 |
| | LlamaExtract Agentic Plus default | 75.00 |
| Classification / splitting | Azure DI classifier | 3.00 |
| | Google custom splitter/classifier | 5.00 |
| | Reducto Classify (5-page context) | 37.50 |
| Rerank | Cohere Rerank v4 Pro / Fast | $2.50 / $2.00 per 1K searches |
| | Voyage rerank-2.5 / -lite | ~$2.50 / ~$1.00 per 1K requests |
| | Azure AI Search Semantic Reranker | $1.00 per 1K queries |
| Embeddings | Cohere Embed v4 text | $0.12 / 1M tokens |
| | voyage-4-large / voyage-context-4 | $0.12 / 1M tokens |
| | voyage-4-lite | $0.02 / 1M tokens |
| Grounding check | Azure Content Safety text records | $0.375 / 1K records |
| | Bedrock Guardrails content filters | $0.15 / 1K text units (grounding meter not confirmed) |
| On-prem / zero marginal | Docling + Granite-Docling-258M | 0.00 |
| | Datalab on-prem high-accuracy | 6.00 |

`[INFERENCE]` A defensible two-tier design: cheap parse for the retrieval corpus (AWS Tables+Layout at $15/1K, or Azure CU Standard+Layout at $10/1K, or Docling at zero), then citation-enabled agentic extract only on the pages that carry reportable numbers (Reducto agentic-complex + Extract). On a typical commercial policy pack, the pages carrying limits/deductibles/sub-limits are a small minority — schedule pages plus a handful of endorsement pages — so the expensive path applies to maybe 10–20% of pages. That keeps blended cost near the cheap tier while every reported number goes through the grounded path.

---

## 8. What I'd ship first

`[INFERENCE]` Ordered so each step de-risks the next:

1. **Label 200 pages before writing pipeline code.** Span-level ground truth across your worst carriers and both born-digital and scanned. This is the artefact everything else is measured against, and it's the one thing you cannot buy.
2. **Bake-off three parsers on that set**, measuring span-grounding accuracy and not just value accuracy: Reducto (citations on), Azure CU 2.0 agentic mode, and AWS Tables+Layout as the cost floor. One week, real numbers.
3. **Build the span-reference architecture (§2.1)** with strict structured outputs. Get to zero-hallucination-by-construction before tuning anything else. Resist the urge to let the model emit values "just for the easy fields".
4. **Hybrid retrieval with Contextual Retrieval prefixes**, RRF fusion, then `rerank-2.5` or `rerank-v4.0-pro`. Add section-path and doc-version hard filters. Store in pgvector alongside the immutable parser output.
5. **Add the second verifier.** Bedrock contextual grounding via `ApplyGuardrail` on extracted spans, plus exact-string round-trip. Measure how often they disagree with each other — that disagreement rate is a useful health signal in itself.
6. **Encode 10–20 formal rules in Bedrock Automated Reasoning** covering average/coinsurance, warranty breach, sub-limit precedence, aggregate vs each-and-every, and deductible application order. Start with whichever produces the highest-severity errors in your labelled set.
7. **Put it on Temporal** with the LangGraph plugin, `continue-as-new` per monitoring cycle, durable waits for underwriter review, and LangSmith or Langfuse tracing propagated across Activity boundaries.
8. **Wire the eval suite into CI** with per-field gates and a hard zero-tolerance gate on ungrounded values. Feed every human correction back into the label set.
9. **Map the schema to ACORD** so the data can leave the system later without a rewrite.

---

## 9. Open questions this research could not close

`[FACT]`/`[INFERENCE]` — things I could not verify and you should confirm directly before committing:

1. **Bedrock Guardrails contextual-grounding and Automated Reasoning per-unit prices.** The pricing page renders client-side; only the Dec 2024 content-filter/denied-topics figure ($0.15/1K text units) was retrievable. Query the AWS Pricing API or the console calculator.
2. **Landing AI's credit → dollar rate.** Credit *consumption* is fully documented; the price per credit is quote-only.
3. **Cohere's direct-platform rerank prices.** The Azure Foundry meters are confirmed ($2.50 / $2.00 per 1K searches); cohere.com/pricing did not render.
4. **Unstructured.io's current production pricing.** Only a staging page yielded numbers ($0.03/page after 15K free, free above $3,000/month up to 1M pages/month).
5. **Datalab's hosted plan tiers.** On-prem $6/1K pages is documented; the hosted table did not render.
6. **Whether Azure Content Safety's "text record" unit applies the same way to the groundedness endpoint**, which accepts large grounding sources. Material to cost at scale.
7. **Total Azure Content Understanding cost for your schema.** Page meters are cheap; field extraction consumes Foundry model tokens billed separately. Needs a modelled estimate on representative documents.
8. **Whether any vendor will contractually stand behind extraction accuracy.** None of the pricing or docs pages reviewed offered an accuracy SLA — uptime SLAs yes, accuracy no. `[INFERENCE]` Assume the liability stays with you, and design the human-review gate accordingly.
