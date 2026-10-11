# content-gita-press

Non-purāṇa works on **sa.wikisource.org** whose **wikitext** explicitly cites **Gita Press / Gorakhpur**. Crawl and pack live here under Wikisource **CC BY-SA** — not GP’s copyrighted print line (`pur-gita-press` in `vyasa/notes/content-adoption.md`).

**Do not** re-ingest Mahāpurāṇas from this repo; use [`content-puranas`](../content-puranas).

## Survey and verification

```bash
# Discover + probe trees (search-based catalog)
bun run survey -- --catalog --write data/survey/catalog.json

# Require publisher strings on the root page (filters search noise)
bun run verify-mentions
```

English tables:

- `data/survey/catalog-summary.md` — current catalog + crawl readiness
- `data/survey/puranas-summary.md` — archived purāṇa-category probe (negative evidence)

As of **2026-10-11**, `verify-mentions` reports **0** verified non-purāṇa roots; see `catalog-summary.md` before starting a crawl.

## Probe one title

```bash
bun run probe -- --root <wiki title>
bun run probe -- --title "…/अध्यायः १"
```

## Tests

```bash
bun test src
```

## Registry

Add `[[work]]` entries to `data/wikisource-works.toml` only after verification. Register the slice in `publisher/data/sources.toml` (`role = "cloned"` once a work is packed).
