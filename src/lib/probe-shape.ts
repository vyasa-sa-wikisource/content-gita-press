import type { ListedPage } from "./mediawiki";

export function shapeOf(title: string, root: string): string {
  const prefix = `${root}/`;
  const rest = title.startsWith(prefix) ? title.slice(prefix.length) : title;
  return rest.replace(/[०-९0-9]+/g, "#");
}

export function rootOf(title: string): string {
  const slash = title.indexOf("/");
  return slash === -1 ? title : title.slice(0, slash);
}

export interface ShapeGroup {
  shape: string;
  count: number;
  bytes: number;
  real: number;
  stubs: ListedPage[];
  sampleTitles: string[];
}

export function groupPages(
  root: string,
  pages: ListedPage[],
  minBytes: number,
  sample: number,
): ShapeGroup[] {
  const groups = new Map<string, ShapeGroup>();
  for (const page of pages) {
    const shape = shapeOf(page.title, root);
    const group = groups.get(shape) ?? {
      shape,
      count: 0,
      bytes: 0,
      real: 0,
      stubs: [],
      sampleTitles: [],
    };
    group.count += 1;
    group.bytes += page.length;
    if (page.length < minBytes) group.stubs.push(page);
    else {
      group.real += 1;
      if (group.sampleTitles.length < sample) group.sampleTitles.push(page.title);
    }
    groups.set(shape, group);
  }
  return [...groups.values()].sort((a, b) => b.real - a.real || b.bytes - a.bytes);
}
