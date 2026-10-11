# Survey notes (2026-10-10)

## Your `latest.json` run (1 root)

| Field | Value |
| :--- | :--- |
| Root | अग्निपुराणम् |
| Subpages | 384 (383 real, 1 stub) |
| Bytes | ~3.6 MB under the root |
| Shapes | `अध्यायः #` (382), `विषयानुक्रमणिका` (1) |
| Discovery source | `search:गीताप्रेस` only |

### Why only one root?

On Sanskrit Wikisource today:

- `वर्गः:गीताप्रेस` has **no member pages** (category exists but is empty).
- Explicit tagging is rare: `insource:"{{गीताप्रेस}}"` matches **one** page (`अग्निपुराणम्/अध्यायः ८८`), not a work index.
- A bare full-text search for `गीताप्रेस` mostly hits **chapter colophons** inside Agni (and similar mentions elsewhere), so every hit shares the root अग्निपुराणम्.

So the run correctly probed the Agni tree, but it is **not** a catalog of all Gita Press editions on the site.

### Agni vs `content-puranas`

The org Agni crawl (non–Gita Press Wikisource tree) kept **382** adhyāya files and skips stub **186**. This Gita Press–linked tree shows **382** real `अध्यायः` pages plus an index page — same scale, different snapshot/edition. Treat as a separate edition line, not a duplicate of the purāṇa slice until you diff sources.

## What to run next for prioritization

Probe many candidates, then sort by `subpageBytes` / `real`:

```bash
bun run survey -- --candidates-category "वर्गः:पुराणानि" --write data/survey/puranas.json
```

or

```bash
bun run survey -- --candidates-file data/survey/candidate-roots.txt --write data/survey/candidates.json
```

Default discovery (no flags) now uses **tagged** queries only; add `--include-mentions` only if you accept the Agni-heavy noise.

## `--catalog` (2026-10-11)

`bun run survey -- --catalog --discover-only` unions:

- Colophon `insource` queries (today **one** page: `अग्निपुराणम्/अध्यायः ८८`)
- `Gita Press`, `गीता-प्रेस`, `गीता प्रेस` full-text (mostly non-purāṇa works + English blurbs)
- Empty GP categories + `{{गीताप्रेस}}` template search

**Most scanned purāṇas on the site do not contain searchable “गीताप्रेस” text** even when they are Gita Press printings. There is no machine-readable GP catalog on sa.wikisource.org yet. For large Sanskrit trees, use `--candidates-category` or maintain `candidate-roots.txt`, then filter by hand or after a crawl samples colophons.

English table for the purāṇa-category probe: `puranas-summary.md`.

## Catalog + verify (2026-10-11)

- `catalog.json` — 21 roots from `--catalog` (one purāṇa + 20 others).
- `catalog-verification.json` — **0** non-purāṇa roots with GP publisher strings on the root page; **2** large false positives (Kātantra, conversation drills); **18** stubs.
- Only on-site GP colophon found earlier: `अग्निपुराणम्/अध्यायः ८८` (purāṇa → `content-puranas`).
- See `catalog-summary.md` for the English table and crawl verdict.
