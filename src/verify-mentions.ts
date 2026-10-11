#!/usr/bin/env bun
/**
 * Verify that catalog roots contain an explicit Gita Press / Gorakhpur publisher string
 * in fetched wikitext (root page). Search hits alone are often false positives.
 *
 * Usage:
 *   bun run verify-mentions
 *   bun run verify-mentions -- --catalog data/survey/catalog.json --write data/survey/catalog-verification.json
 */

import { readFile } from "node:fs/promises";
import { fetchWikitext, sleep } from "./lib/mediawiki";

const DEFAULT_CATALOG = "data/survey/catalog.json";
const DEFAULT_WRITE = "data/survey/catalog-verification.json";
const DELAY_MS = 350;

export const PUBLISHER_MARKERS = [
  { id: "gitapress-dev", re: /गीताप्रेस/ },
  { id: "gitapress-hyphen", re: /गीता-प्रेस/ },
  { id: "gitapress-space", re: /गीता प्रेस/ },
  { id: "gita-press-en", re: /Gita Press/i },
  { id: "gorakhpur", re: /गोरखपुर/ },
] as const;

const PURANA_ROOT_SUFFIX = /पुराणम्$/;

export interface VerificationRow {
  root: string;
  rootBytes: number;
  subpages: number;
  sources: string[];
  wikitextChars: number;
  markers: string[];
  snippet: string | null;
  verdict: "verified" | "exclude-purana" | "false-positive-search" | "stub";
}

function snippetAround(wt: string, re: RegExp): string | null {
  const m = wt.match(re);
  if (!m || m.index === undefined) return null;
  const i = m.index;
  return wt.slice(Math.max(0, i - 48), i + 72).replace(/\s+/g, " ").trim();
}

function parseArgs(argv: string[]): { catalogPath: string; writePath: string } {
  let catalogPath = DEFAULT_CATALOG;
  let writePath = DEFAULT_WRITE;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--catalog") catalogPath = argv[++i] ?? catalogPath;
    if (argv[i] === "--write") writePath = argv[++i] ?? writePath;
  }
  return { catalogPath, writePath };
}

export async function verifyCatalogRoots(
  roots: Array<{ root: string; rootBytes: number; subpages: number; sources: string[] }>,
): Promise<VerificationRow[]> {
  const out: VerificationRow[] = [];
  for (const row of roots) {
    const wt = await fetchWikitext(row.root).catch(() => "");
    const markers = PUBLISHER_MARKERS.filter((m) => m.re.test(wt)).map((m) => m.id);
    const firstRe = PUBLISHER_MARKERS.find((m) => m.re.test(wt))?.re;
    let verdict: VerificationRow["verdict"];
    if (PURANA_ROOT_SUFFIX.test(row.root)) {
      verdict = "exclude-purana";
    } else if (markers.length > 0) {
      verdict = "verified";
    } else if (row.rootBytes < 800 && row.subpages === 0) {
      verdict = "stub";
    } else {
      verdict = "false-positive-search";
    }
    out.push({
      root: row.root,
      rootBytes: row.rootBytes,
      subpages: row.subpages,
      sources: row.sources,
      wikitextChars: wt.length,
      markers,
      snippet: firstRe ? snippetAround(wt, firstRe) : null,
      verdict,
    });
    await sleep(DELAY_MS);
  }
  return out;
}

async function main(): Promise<void> {
  const { catalogPath, writePath } = parseArgs(process.argv.slice(2));
  const catalog = JSON.parse(await readFile(catalogPath, "utf8")) as {
    generatedAt?: string;
    roots: Array<{ root: string; rootBytes: number; subpages: number; sources: string[] }>;
  };
  const rows = await verifyCatalogRoots(catalog.roots);
  const payload = {
    generatedAt: new Date().toISOString(),
    catalogFrom: catalog.generatedAt ?? null,
    catalogPath,
    note:
      "verdict=verified only when publisher strings appear on the root page. Subpage colophons (e.g. Agni adhyāya 88) require a future --deep pass.",
    rows,
    counts: {
      verified: rows.filter((r) => r.verdict === "verified").length,
      excludePurana: rows.filter((r) => r.verdict === "exclude-purana").length,
      falsePositiveSearch: rows.filter((r) => r.verdict === "false-positive-search").length,
      stub: rows.filter((r) => r.verdict === "stub").length,
    },
  };
  await Bun.write(writePath, JSON.stringify(payload, null, 2));
  const v = payload.counts.verified;
  console.log(`Wrote ${writePath}`);
  console.log(
    `verified=${v} exclude-purana=${payload.counts.excludePurana} false-positive=${payload.counts.falsePositiveSearch} stub=${payload.counts.stub}`,
  );
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
