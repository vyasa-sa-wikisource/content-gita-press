#!/usr/bin/env bun
/**
 * Survey Sanskrit Wikisource works tagged as Gita Press (or related categories).
 *
 * Edit the constants below when Wikisource naming changes.
 *
 * Usage:
 *   bun run survey
 *   bun run survey -- --catalog --write data/survey/catalog.json
 *   bun run survey -- --candidates-category "वर्गः:पुराणानि"  (optional slice, not GP-wide)
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {
  getPageLengths,
  listCategoryMembers,
  listSubpages,
  listTransclusions,
  searchAllPages,
  searchPages,
  sleep,
} from "./lib/mediawiki";
import { groupPages, rootOf } from "./lib/probe-shape";

/** Category pages to list (वर्गः:…). */
export const GITA_PRESS_CATEGORIES = [
  "वर्गः:गीताप्रेस",
  "वर्गः:गीता प्रेस",
  "वर्गः:गीताप्रेस, गोरखपुर",
] as const;

/** Template titles for list=embeddedin (edit if site uses another namespace). */
export const GITA_PRESS_TEMPLATE_TITLES = [
  "साँचा:गीताप्रेस",
  "ढाँचा:गीताप्रेस",
  "Template:गीताप्रेस",
] as const;

/**
 * Searches that indicate tagging (template, category link), not body colophon text.
 * Bare full-text "गीताप्रेस" is in MENTION_SEARCH_QUERIES (--include-mentions).
 */
export const TAGGED_SEARCH_QUERIES = [
  'incategory:"गीताप्रेस"',
  'incategory:"गीता प्रेस"',
  'insource:"{{गीताप्रेस}}"',
  'insource:"[[वर्गः:गीताप्रेस]]"',
] as const;

export const MENTION_SEARCH_QUERIES = ["गीताप्रेस", "गीता प्रेस गोरखपुर", "गोरखपुर"] as const;

/**
 * Full-text searches for the usual Gita Press, Gorakhpur colophon. Each hit is counted
 * toward its work root (text before the first /). Use with --catalog for site-wide discovery.
 */
export const COLLOPHON_CATALOG_QUERIES = [
  'insource:"गीताप्रेस, गोरखपुर"',
  'insource:"गीताप्रेस" insource:"गोरखपुर"',
] as const;

/** Full-text searches that surface non-purāṇa GP titles (English blurbs, hyphenated name). */
export const CATALOG_EXTRA_SEARCH_QUERIES = [
  "Gita Press",
  "गीता-प्रेस",
  "गीता प्रेस",
] as const;

const DEFAULT_MIN_BYTES = 800;
const DELAY_MS = 400;
const COLLOPHON_SEARCH_MAX = 8000;

const HELP = `Usage:
  bun run survey -- --catalog --write data/survey/catalog.json
  bun run survey -- --catalog --discover-only
  bun run survey -- --candidates-category "वर्गः:पुराणानि"
  bun run survey -- --candidates-file data/survey/candidate-roots.txt

Discover works on sa.wikisource.org, then probe each root tree.

--catalog   Site-wide Gita Press discovery via colophon full-text search (not limited to purāṇas).
            Also runs empty-category checks, templates, and tagged searches.

Without --catalog, only tagged/template discovery runs (usually very few roots).

Options:
  --min-bytes <n>              Stub threshold (default ${DEFAULT_MIN_BYTES}).
  --max-roots <n>              Stop after N roots (0 = no limit).
  --discover-only              List roots without probing subpages.
  --root <title>               Probe one root only.
  --candidates-category <cat>  Also add roots from a वर्गः (optional slice).
  --candidates-file <path>     Also add one root title per line (# comments ok).
  --include-mentions           Add broad mention searches (noisy).
  --json / --write <path>
  --help
`;

export interface SurveyRootRow {
  root: string;
  sources: string[];
  subpages: number;
  subpageBytes: number;
  real: number;
  stubs: number;
  topShapes: string[];
  rootBytes: number;
}

export interface DiscoverOptions {
  includeMentions: boolean;
  candidatesCategory: string;
  candidatesFile: string;
  catalog: boolean;
}

export function parseSurveyArgs(argv: string[]): DiscoverOptions & {
  minBytes: number;
  maxRoots: number;
  discoverOnly: boolean;
  root: string;
  json: boolean;
  writePath: string;
} {
  let minBytes = DEFAULT_MIN_BYTES;
  let maxRoots = 0;
  let discoverOnly = false;
  let root = "";
  let json = false;
  let writePath = "";
  let includeMentions = false;
  let candidatesCategory = "";
  let candidatesFile = "";
  let catalog = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--catalog") {
      catalog = true;
      continue;
    }
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--discover-only") {
      discoverOnly = true;
      continue;
    }
    if (arg === "--include-mentions") {
      includeMentions = true;
      continue;
    }
    if (arg === "--min-bytes") {
      minBytes = Number(argv[++i]);
      continue;
    }
    if (arg === "--max-roots") {
      maxRoots = Number(argv[++i]);
      continue;
    }
    if (arg === "--root") {
      root = argv[++i] ?? "";
      continue;
    }
    if (arg === "--write") {
      writePath = argv[++i] ?? "";
      continue;
    }
    if (arg === "--candidates-category") {
      candidatesCategory = argv[++i] ?? "";
      continue;
    }
    if (arg === "--candidates-file") {
      candidatesFile = argv[++i] ?? "";
      continue;
    }
    throw new Error(`Unknown argument ${arg}\n${HELP}`);
  }
  if (!Number.isInteger(minBytes) || minBytes < 0) {
    throw new Error(`--min-bytes must be a non-negative integer.\n${HELP}`);
  }
  if (!Number.isInteger(maxRoots) || maxRoots < 0) {
    throw new Error(`--max-roots must be a non-negative integer.\n${HELP}`);
  }
  return {
    minBytes,
    maxRoots,
    discoverOnly,
    root,
    json,
    writePath,
    includeMentions,
    candidatesCategory,
    candidatesFile,
    catalog,
  };
}

/** Count search hits per work root for colophon-style Gita Press markers. */
export async function discoverColophonRootCounts(
  maxPagesPerQuery = COLLOPHON_SEARCH_MAX,
): Promise<Map<string, number>> {
  const seenTitles = new Set<string>();
  const counts = new Map<string, number>();
  for (const query of COLLOPHON_CATALOG_QUERIES) {
    const hits = await searchAllPages(query, maxPagesPerQuery);
    for (const title of hits) {
      if (seenTitles.has(title)) continue;
      seenTitles.add(title);
      const root = rootOf(title);
      counts.set(root, (counts.get(root) ?? 0) + 1);
    }
    await sleep(DELAY_MS);
  }
  return counts;
}

export function categoryNameToRoot(subcatTitle: string): string {
  const prefix = "वर्गः:";
  return subcatTitle.startsWith(prefix) ? subcatTitle.slice(prefix.length) : subcatTitle;
}

export async function loadCandidateRoots(filePath: string): Promise<string[]> {
  if (!existsSync(filePath)) return [];
  const text = await readFile(filePath, "utf8");
  return text
    .split("\n")
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter((line) => line.length > 0);
}

export async function discoverRoots(options: DiscoverOptions): Promise<Map<string, Set<string>>> {
  const roots = new Map<string, Set<string>>();

  const add = (title: string, source: string) => {
    const root = rootOf(title);
    const set = roots.get(root) ?? new Set<string>();
    set.add(source);
    roots.set(root, set);
  };

  for (const cmtitle of GITA_PRESS_CATEGORIES) {
    for (const cmtype of ["page", "subcat"] as const) {
      const members = await listCategoryMembers(cmtitle, cmtype);
      for (const member of members) {
        add(member.title, `category:${cmtitle}`);
      }
      await sleep(DELAY_MS);
    }
  }

  for (const templateTitle of GITA_PRESS_TEMPLATE_TITLES) {
    const hits = await listTransclusions(templateTitle, 500);
    for (const title of hits) add(title, `template:${templateTitle}`);
    await sleep(DELAY_MS);
  }

  for (const query of TAGGED_SEARCH_QUERIES) {
    const hits = await searchPages(query, 500);
    for (const title of hits) add(title, `tagged-search:${query}`);
    await sleep(DELAY_MS);
  }

  if (options.catalog) {
    const counts = await discoverColophonRootCounts();
    for (const [root, count] of counts) {
      add(root, `colophon-hits:${count}`);
    }
    for (const query of CATALOG_EXTRA_SEARCH_QUERIES) {
      const hits = await searchAllPages(query, COLLOPHON_SEARCH_MAX);
      for (const title of hits) add(title, `catalog-search:${query}`);
      await sleep(DELAY_MS);
    }
  }

  if (options.includeMentions) {
    for (const query of MENTION_SEARCH_QUERIES) {
      const hits = await searchPages(query, 500);
      for (const title of hits) add(title, `mention-search:${query}`);
      await sleep(DELAY_MS);
    }
  }

  if (options.candidatesCategory) {
    const pages = await listCategoryMembers(options.candidatesCategory, "page");
    for (const member of pages) add(member.title, `candidates-category:${options.candidatesCategory}`);
    const subcats = await listCategoryMembers(options.candidatesCategory, "subcat");
    for (const member of subcats) {
      add(categoryNameToRoot(member.title), `candidates-subcat:${member.title}`);
    }
    await sleep(DELAY_MS);
  }

  const filePath = options.candidatesFile;
  if (filePath) {
    for (const title of await loadCandidateRoots(filePath)) {
      add(title, `candidates-file:${filePath}`);
    }
  }

  return roots;
}

async function probeRoot(
  root: string,
  minBytes: number,
): Promise<Omit<SurveyRootRow, "sources">> {
  const subpages = await listSubpages(root);
  const shapes = groupPages(root, subpages, minBytes, 0);
  const real = shapes.reduce((n, g) => n + g.real, 0);
  const stubs = shapes.reduce((n, g) => n + g.stubs.length, 0);
  const subpageBytes = subpages.reduce((n, p) => n + p.length, 0);
  const topShapes = shapes.slice(0, 5).map((g) => `${g.shape} (${g.real})`);
  const lengths = await getPageLengths([root]);
  const rootBytes = lengths.get(root) ?? 0;
  return {
    root,
    subpages: subpages.length,
    subpageBytes,
    real,
    stubs,
    topShapes,
    rootBytes,
  };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP);
    return;
  }
  const opts = parseSurveyArgs(argv);
  const {
    minBytes,
    maxRoots,
    discoverOnly,
    root: singleRoot,
    json,
    writePath,
    includeMentions,
    candidatesCategory,
    candidatesFile,
    catalog,
  } = opts;

  const discoverOpts: DiscoverOptions = {
    includeMentions,
    candidatesCategory,
    candidatesFile,
    catalog,
  };

  const discovered = singleRoot
    ? new Map([[singleRoot, new Set(["--root"])]])
    : await discoverRoots(discoverOpts);

  const sortedRoots = [...discovered.keys()].sort((a, b) => a.localeCompare(b, "hi"));
  const limited = maxRoots > 0 ? sortedRoots.slice(0, maxRoots) : sortedRoots;

  const discoveryNote = opts.catalog
    ? "Catalog mode: colophon + Gita Press full-text queries + templates/categories. Most GP purāṇa chapters are not marked in wikitext; combine with --candidates-category or a curated list for coverage."
    : "Tagged-only discovery. Use --catalog for site-wide Gita Press works, or --candidates-category for a वर्गः slice.";

  if (discoverOnly) {
    const payload = {
      generatedAt: new Date().toISOString(),
      note: discoveryNote,
      categories: [...GITA_PRESS_CATEGORIES],
      taggedSearchQueries: [...TAGGED_SEARCH_QUERIES],
      mentionSearchQueries: includeMentions ? [...MENTION_SEARCH_QUERIES] : [],
      colophonCatalogQueries: catalog ? [...COLLOPHON_CATALOG_QUERIES] : [],
      catalogExtraSearchQueries: catalog ? [...CATALOG_EXTRA_SEARCH_QUERIES] : [],
      roots: limited.map((root) => ({
        root,
        sources: [...(discovered.get(root) ?? [])],
      })),
    };
    if (json) console.log(JSON.stringify(payload, null, 2));
    else {
      console.log(`roots: ${limited.length}`);
      console.log(`note: ${discoveryNote}`);
      for (const root of limited) {
        const sources = [...(discovered.get(root) ?? [])].join("; ");
        console.log(`${root}\n  ${sources}`);
      }
    }
    return;
  }

  const rows: SurveyRootRow[] = [];
  for (const root of limited) {
    const probed = await probeRoot(root, minBytes);
    rows.push({
      ...probed,
      sources: [...(discovered.get(root) ?? [])],
    });
    await sleep(DELAY_MS);
  }

  rows.sort((a, b) => b.subpageBytes - a.subpageBytes || b.real - a.real);

  const report = {
    generatedAt: new Date().toISOString(),
    note: discoveryNote,
    minBytes,
    catalog,
    includeMentions,
    candidatesCategory: candidatesCategory || null,
    candidatesFile: candidatesFile || null,
    colophonCatalogQueries: catalog ? [...COLLOPHON_CATALOG_QUERIES] : [],
    catalogExtraSearchQueries: catalog ? [...CATALOG_EXTRA_SEARCH_QUERIES] : [],
    categories: [...GITA_PRESS_CATEGORIES],
    taggedSearchQueries: [...TAGGED_SEARCH_QUERIES],
    roots: rows,
  };

  if (writePath) {
    await Bun.write(writePath, JSON.stringify(report, null, 2));
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`survey: ${rows.length} roots (min-bytes ${minBytes})`);
  if (!catalog && !candidatesCategory && !candidatesFile && rows.length <= 1) {
    console.log('hint: use --catalog for all Gita Press works on Wikisource (not only purāṇas).');
  }
  console.log("");
  console.log(
    "subpages".padStart(8) +
      "  real".padStart(6) +
      "  stub".padStart(6) +
      "     bytes".padStart(10) +
      "  root",
  );
  for (const row of rows) {
    console.log(
      `${String(row.subpages).padStart(8)}  ${String(row.real).padStart(6)}  ${String(row.stubs).padStart(6)}  ${String(row.subpageBytes).padStart(10)}  ${row.root}`,
    );
    if (row.topShapes.length) {
      console.log(`           shapes: ${row.topShapes.join("; ")}`);
    }
  }
  if (writePath) console.log(`\nWrote ${writePath}`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
