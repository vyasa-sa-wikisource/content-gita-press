# Purāṇa category survey (English)

Generated from `puranas.json` (2026-10-11). This run used **`--candidates-category "वर्गः:पुराणानि"`** — every work listed under the Wikisource “purāṇas” category, **not** “everything Gita Press on the site.” For **search-based** Gita Press discovery (only ~21 roots today — mostly English blurbs, not purāṇas):

```bash
bun run survey -- --catalog --discover-only
bun run survey -- --catalog --write data/survey/catalog.json
```

To **union** search hits with every purāṇa-category tree (still not proof of GP edition):

```bash
bun run survey -- --catalog --candidates-category "वर्गः:पुराणानि" --write data/survey/catalog-plus-puranas.json
```

Wikisource URLs: `https://sa.wikisource.org/wiki/<root>` (encode the Devanagari title).

**Columns:** *real* = subpages above the stub threshold (800 bytes); *stub* = thin/placeholder pages; *MB* = total subpage wikitext size.

| Rank | English name | real | stub | subpages | MB | Notes |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Skanda Purāṇa | 1815 | 1020 | 2835 | 36.0 | Huge; many stubs; multi-khaṇḍa |
| 2 | Lakṣmī Nārāyaṇa Saṃhitā | 1258 | 5 | 1263 | 33.9 | Not one of the 18 Mahāpurāṇas; very complete on WS |
| 3 | Padma Purāṇa | 711 | 292 | 1003 | 12.9 | Many stubs |
| 4 | Śiva Purāṇa | 484 | 41 | 525 | 6.9 | Saṃhitā/khaṇḍa structure |
| 5 | Viṣṇu Dharmottara Purāṇa | 304 | 60 | 364 | 6.5 | |
| 6 | Brahmavaivarta Purāṇa | 284 | 94 | 378 | 5.8 | |
| 7 | Devī Bhāgavata Purāṇa | 335 | 3 | 338 | 5.0 | |
| 8 | Śrīmad Bhāgavata Purāṇa | 363 | 60 | 423 | 4.6 | **Overlap:** `content-puranas` has a different Bhāgavata line |
| 9 | Harivaṃśa Purāṇa | 328 | 10 | 338 | 4.6 | Often classed with Mahābhārata |
| 10 | Brahma Purāṇa | 246 | 0 | 246 | 4.0 | Clean chapter list |
| 11 | Brahmāṇḍa Purāṇa | 159 | 41 | 200 | 3.8 | |
| 12 | Garuḍa Purāṇa | 322 | 0 | 322 | 3.8 | |
| 13 | Matsya Purāṇa | 291 | 11 | 302 | 3.7 | **In `content-puranas`** (separate GP edition) |
| 14 | Agni Purāṇa | 383 | 1 | 384 | 3.6 | **In `content-puranas`**; only root with `{{गीताप्रेस}}` tag in this list |
| 15 | Varāha Purāṇa | 220 | 18 | 238 | 3.1 | **In `content-puranas`** |
| 16 | Kālikā Purāṇa | 90 | 0 | 90 | 2.3 | Upapurāṇa |
| 17 | Mārkaṇḍeya Purāṇa | 43 | 12 | 55 | 2.0 | Messy chapter naming; **partial in `content-puranas`** |
| 18 | Vāmana Purāṇa | 101 | 11 | 112 | 1.6 | Many ordinals instead of `अध्यायः #` |
| 19 | Kalki Purāṇa | 39 | 0 | 39 | 1.2 | |
| 20 | Bhaviṣya Purāṇa | 6 | 78 | 84 | 0.3 | Mostly stubs — not ingest-ready |
| 21 | Liṅga Purāṇa | 1 | 0 | 1 | 0.01 | Index page only |
| 22 | Viṣṇu Purāṇa (GP tree) | 0 | 7 | 7 | 0.001 | Empty chapter shells |
| 23 | Kurma Purāṇa | 0 | 0 | 0 | 0 | Category only — no subpages |
| 24 | Nārada Purāṇa | 0 | 0 | 0 | 0 | Category only |
| 25 | Bhīṣma stuti | 0 | 0 | 0 | 0 | Short standalone; bytes on root page only |
| 26 | Mārkaṇḍeya racanās | 0 | 0 | 0 | 0 | Empty |

## Devanagari root titles (for copy/paste)

| English | Wikisource root |
| --- | --- |
| Skanda | स्कन्दपुराणम् |
| Lakṣmī Nārāyaṇa Saṃhitā | लक्ष्मीनारायणसंहिता |
| Padma | पद्मपुराणम् |
| Śiva | शिवपुराणम् |
| Viṣṇu Dharmottara | विष्णुधर्मोत्तरपुराणम् |
| Brahmavaivarta | ब्रह्मवैवर्तपुराणम् |
| Devī Bhāgavata | देवीभागवतपुराणम् |
| Bhāgavata | श्रीमद्भागवतपुराणम् |
| Harivaṃśa | हरिवंशपुराणम् |
| Brahma | ब्रह्मपुराणम् |
| Brahmāṇḍa | ब्रह्माण्डपुराणम् |
| Garuḍa | गरुडपुराणम् |
| Matsya | मत्स्यपुराणम् |
| Agni | अग्निपुराणम् |
| Varāha | वराहपुराणम् |
| Kālikā | कालिकापुराणम् |
| Mārkaṇḍeya | मार्कण्डेयपुराणम् |
| Vāmana | वामनपुराणम् |
| Kalki | कल्किपुराणम् |
| Bhaviṣya | भविष्यपुराणम् |
| Liṅga | लिङ्गपुराणम् |
| Viṣṇu | श्रीविष्णुपुराणम् |
| Kurma | कूर्मपुराणम् |
| Nārada | नारदपुराणम् |
| Bhīṣma stuti | भीष्मस्तुतिः |
| Mārkaṇḍeya racanās | मार्कण्डेयरचनाः |

## Suggested ingest tiers (Gita Press repo)

1. **Probe with `--catalog` first** — only works whose chapters carry the Gita Press colophon should be in scope for this repo.
2. **High volume, likely GP** — Agni (tagged), Matsya, Varāha, Garuḍa, Brahma, Śiva, Padma (verify colophon counts).
3. **Skip or defer** — Bhaviṣya (stubs), Viṣṇu/Liṅga/Kurma/Nārada shells, empty racanās category.
4. **Do not duplicate blindly** — works already in `content-puranas` need a deliberate “Gita Press edition” id and diff, not a second copy of the same catalog work without metadata.
