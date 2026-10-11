# Catalog survey (English) — 2026-10-11

Source: `catalog.json` from `bun run survey -- --catalog --write data/survey/catalog.json`  
Verification: `catalog-verification.json` from `bun run verify-mentions` (publisher strings on the **root** page wikitext).

## Scope reminder

This repo ingests **non-purāṇa** works where wikitext **explicitly** names Gita Press / Gorakhpur. It is **not** `pur-gita-press` (GP’s copyrighted print) and **not** a second `content-puranas` line.

## Crawl assessment (2026-10-11)

| Result | Count |
| --- | ---: |
| **Ready to crawl (verified GP on root)** | **0** |
| Exclude (purāṇa — use `content-puranas`) | 1 |
| False positive (search hit, no publisher string on root) | 2 |
| Stub shell (root &lt; 800 bytes, no subpages) | 18 |

**Conclusion:** There is **no first ingest** from this catalog run. The only confirmed GP colophon on the site today is **अग्निपुराणम्/अध्यायः ८८** (subpage), which is out of scope here.

### Why search finds 21 roots but none qualify

MediaWiki full-text search is loose:

- `गीता-प्रेस` / `गीता प्रेस` match **भगवद्गीता** + unrelated **प्रेस** (“printing press”) inside large texts (e.g. कातन्त्रव्याकरणम्).
- `Gita Press` matches **Bhagavad Gita** + the English word “press” in drills (e.g. संस्कृतसंवादकृता वाक्याभ्यासाः).
- Most other hits are **~200–400 byte** root pages (bibliographic stubs) with **no** publisher string in fetched wikitext.

## Table (all catalog roots)

| Verdict | English gloss | Root bytes | Subpages | Discovery |
| --- | --- | ---: | ---: | --- |
| **exclude-purana** | Agni Purāṇa | 20 836 | 384 | `{{गीताप्रेस}}` tag; colophon on adhyāya 88 only |
| **false-positive** | Kātantra vyākaraṇa | 1 916 897 | 0 | `गीता-प्रेस` search; text is grammar, not GP edition |
| **false-positive** | Sanskrit conversation drills | 440 609 | 0 | `Gita Press` search; Bhagavad Gītā lessons + English “press” |
| **stub** | Kaṭhopaniṣad bhāṣya | 329 | 0 | `Gita Press` search |
| **stub** | Gītā-śāstrārthaviveka | 312 | 0 | `गीता-प्रेस` search |
| **stub** | Gauḍapāda kārikā (with English) | 278 | 0 | `Gita Press` search |
| **stub** | Tattvasaṅkhyāna (with ṭīkā) | 315 | 0 | `Gita Press` search |
| **stub** | Praśna Upaniṣad (Rāmānuja) | 425 | 0 | `Gita Press` search |
| **stub** | Brahmasiddhi (Mandana) | 361 | 0 | `Gita Press` search |
| **stub** | Bharatakosa vol. 1 | 308 | 0 | `Gita Press` search |
| **stub** | Vādāvalī | 299 | 0 | `Gita Press` search |
| **stub** | Viśiṣṭādvaitasiddhi | 304 | 0 | `Gita Press` search |
| **stub** | Vedāntasāra (with English) | 323 | 0 | `Gita Press` search |
| **stub** | Vedāntasāra (Sadānanda) | 342 | 0 | `Gita Press` search |
| **stub** | Bhagavad Gītā analytical dictionary | 395 | 0 | `Gita Press` search |
| **stub** | Lalitā-sahasranāma (Bhāskararāya ṭīkā) | 379 | 0 | `गीता-प्रेस` search |
| **stub** | Siddhasiddhāntapaddhati (etc.) | 406 | 0 | `Gita Press` search |
| **stub** | A Sanskrit primer | 260 | 0 | `Gita Press` search |
| **stub** | Āryabhaṭīya (English title) | 323 | 0 | `Gita Press` search |
| **stub** | Birds in Sanskrit literature | 264 | 0 | `Gita Press` search |
| **stub** | Sanskrit Introductory | 228 | 0 | `Gita Press` search |

Wikisource URL: `https://sa.wikisource.org/wiki/<root>` (URL-encode the title).

## Next steps when the site changes

1. Re-run `bun run survey -- --catalog --write data/survey/catalog.json`.
2. Re-run `bun run verify-mentions` (add `--deep` later to scan subpages for colophons).
3. Add the first `[[work]]` with `status = "accepted"` only when `verdict = verified` (or a documented subpage colophon on a non-purāṇa tree).
4. Purāṇa-category probes remain archived in `puranas.json` / `puranas-summary.md` — do not ingest here.
