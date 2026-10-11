#!/usr/bin/env bun
/**
 * List a Sanskrit Wikisource subpage tree and group titles by shape.
 *
 * Usage:
 *   bun run probe -- --root शिवपुराणम्
 *   bun run probe -- --root वराहपुराणम् --sample 1
 */

import {
  fetchWikitext,
  listSubpages,
  sleep,
  type ListedPage,
} from "./lib/mediawiki";
import { groupPages, shapeOf } from "./lib/probe-shape";

const DEFAULT_MIN_BYTES = 800;

const HELP = `Usage:
  bun run probe -- --root <wiki title>
  bun run probe -- --root शिवपुराणम् --sample 1
  bun run probe -- --root वराहपुराणम् --min-bytes 800 --json

Lists subpages of a sa.wikisource.org title. Read-only.

Options:
  --root <title>     Root page. Required unless --title is set.
  --min-bytes <n>    Stub threshold (default ${DEFAULT_MIN_BYTES}).
  --sample <n>       Wikitext samples per shape (default 0). Head and tail.
  --title <page>     Print the first and last lines of one page. Repeatable.
  --json             Print one JSON object instead of text.
  --help             Show this help.
`;

export { shapeOf } from "./lib/probe-shape";

export function parseArgs(argv: string[]): {
  root: string;
  minBytes: number;
  sample: number;
  json: boolean;
  titles: string[];
} {
  let root = "";
  let minBytes = DEFAULT_MIN_BYTES;
  let sample = 0;
  let json = false;
  const titles: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--root") {
      root = argv[++i] ?? "";
      continue;
    }
    if (arg === "--title") {
      const title = argv[++i] ?? "";
      if (!title) throw new Error(`--title needs a page title.\n${HELP}`);
      titles.push(title);
      continue;
    }
    if (arg === "--min-bytes") {
      minBytes = Number(argv[++i]);
      continue;
    }
    if (arg === "--sample") {
      sample = Number(argv[++i]);
      continue;
    }
    throw new Error(`Unknown argument ${arg}\n${HELP}`);
  }
  if (!root && titles.length === 0) {
    throw new Error(`Missing --root.\n  bun run probe -- --root शिवपुराणम्`);
  }
  if (!Number.isInteger(minBytes) || minBytes < 0) {
    throw new Error(`--min-bytes must be a non-negative integer.\n${HELP}`);
  }
  if (!Number.isInteger(sample) || sample < 0) {
    throw new Error(`--sample must be a non-negative integer.\n${HELP}`);
  }
  return { root, minBytes, sample, json, titles };
}

function lineWindow(text: string, count: number): { head: string[]; tail: string[] } {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  return {
    head: lines.slice(0, count),
    tail: lines.slice(Math.max(0, lines.length - count)),
  };
}

function clip(text: string, edge: number): { head: string; tail: string } {
  const flat = text.replace(/\s+/g, " ").trim();
  return {
    head: flat.slice(0, edge),
    tail: flat.slice(Math.max(0, flat.length - edge)),
  };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
    console.log(HELP);
    return;
  }
  const { root, minBytes, sample, json, titles } = parseArgs(argv);
  if (titles.length && !root) {
    for (const title of titles) {
      const text = await fetchWikitext(title);
      const window = lineWindow(text, 12);
      console.log(`title: ${title}`);
      console.log("head:");
      for (const line of window.head) console.log(`  ${line}`);
      console.log("tail:");
      for (const line of window.tail) console.log(`  ${line}`);
      console.log("");
      await sleep(1500);
    }
    return;
  }
  const pages = await listSubpages(root);
  const shapes = groupPages(root, pages, minBytes, sample);
  const samples: Array<{ title: string; head: string; tail: string }> = [];
  if (sample > 0) {
    for (const group of shapes) {
      for (const title of group.sampleTitles) {
        const text = await fetchWikitext(title);
        samples.push({ title, ...clip(text, 280) });
        await sleep(1500);
      }
    }
  }
  const report = {
    root,
    pages: pages.length,
    bytes: pages.reduce((sum, page) => sum + page.length, 0),
    minBytes,
    shapes: shapes.map((group) => ({
      shape: group.shape,
      count: group.count,
      real: group.real,
      stubs: group.stubs.length,
      bytes: group.bytes,
      stubTitles: group.stubs.map((page) => ({ title: page.title, length: page.length })),
    })),
    samples,
  };
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(`root: ${report.root}`);
  console.log(`pages: ${report.pages}`);
  console.log(`bytes: ${report.bytes}`);
  console.log(`min-bytes: ${report.minBytes}`);
  console.log("");
  for (const shape of report.shapes) {
    console.log(
      `${String(shape.real).padStart(4)} real  ${String(shape.stubs).padStart(3)} stub  ${String(shape.bytes).padStart(8)} B  ${shape.shape}`,
    );
    for (const stub of shape.stubTitles) {
      console.log(`       stub ${stub.length} B  ${stub.title}`);
    }
  }
  for (const samplePage of report.samples) {
    console.log("");
    console.log(`sample: ${samplePage.title}`);
    console.log(`  head: ${samplePage.head}`);
    console.log(`  tail: ${samplePage.tail}`);
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
