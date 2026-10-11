/**
 * Sanskrit Wikisource MediaWiki API helpers.
 * Edit USER_AGENT or ORIGIN here if the site policy changes.
 */

export const ORIGIN = "https://sa.wikisource.org";
export const USER_AGENT =
  "ProjectVyasa-CurationBot/1.0 (+https://github.com/vyasa-sa-wikisource; contact@project-vyasa.org)";

export interface ListedPage {
  title: string;
  length: number;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function api(params: Record<string, string>): Promise<unknown> {
  const body = new URLSearchParams({ format: "json", maxlag: "5", ...params });
  for (let attempt = 1; attempt <= 6; attempt++) {
    const response = await fetch(`${ORIGIN}/w/api.php`, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
    if (response.status === 429 || response.status === 503) {
      const wait = Number(response.headers.get("Retry-After") ?? "20");
      await sleep((Number.isFinite(wait) ? wait : 20) * 1000);
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    const json = (await response.json()) as { error?: { code?: string; info?: string } };
    if (json.error?.code === "maxlag") {
      await sleep(5000);
      continue;
    }
    if (json.error) throw new Error(json.error.info ?? json.error.code ?? "api error");
    return json;
  }
  throw new Error("MediaWiki API failed after retries");
}

export async function listSubpages(root: string): Promise<ListedPage[]> {
  const out: ListedPage[] = [];
  let cont: Record<string, string> | undefined;
  for (;;) {
    const params: Record<string, string> = {
      action: "query",
      generator: "allpages",
      gapprefix: `${root}/`,
      gapnamespace: "0",
      gaplimit: "100",
      prop: "info",
    };
    if (cont) Object.assign(params, cont);
    const data = (await api(params)) as {
      query?: { pages?: Record<string, { title: string; length?: number }> };
      continue?: Record<string, string>;
    };
    for (const page of Object.values(data.query?.pages ?? {})) {
      out.push({ title: page.title, length: page.length ?? 0 });
    }
    if (!data.continue) break;
    cont = data.continue;
    await sleep(400);
  }
  out.sort((a, b) => a.title.localeCompare(b.title, "hi"));
  return out;
}

export async function getPageLengths(titles: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const data = (await api({
      action: "query",
      titles: chunk.join("|"),
      prop: "info",
    })) as {
      query?: { pages?: Record<string, { title: string; length?: number; missing?: boolean }> };
    };
    for (const page of Object.values(data.query?.pages ?? {})) {
      if (!page.missing) out.set(page.title, page.length ?? 0);
    }
    await sleep(300);
  }
  return out;
}

export type CategoryMember = { title: string; ns: number };

export async function listCategoryMembers(
  cmtitle: string,
  cmtype: "page" | "subcat" | "file" = "page",
): Promise<CategoryMember[]> {
  const out: CategoryMember[] = [];
  let cmcontinue: string | undefined;
  for (;;) {
    const params: Record<string, string> = {
      action: "query",
      list: "categorymembers",
      cmtitle,
      cmlimit: "500",
      cmtype,
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;
    const data = (await api(params)) as {
      query?: { categorymembers?: CategoryMember[] };
      continue?: { cmcontinue?: string };
    };
    out.push(...(data.query?.categorymembers ?? []));
    cmcontinue = data.continue?.cmcontinue;
    if (!cmcontinue) break;
    await sleep(400);
  }
  return out;
}

/** Pages that transclude a template (namespace 10 title, e.g. साँचा:Foo). */
export async function listTransclusions(templateTitle: string, limit = 500): Promise<string[]> {
  const out: string[] = [];
  let eicontinue: string | undefined;
  while (out.length < limit) {
    const params: Record<string, string> = {
      action: "query",
      list: "embeddedin",
      eititle: templateTitle,
      einamespace: "0",
      eilimit: "500",
    };
    if (eicontinue) params.eicontinue = eicontinue;
    const data = (await api(params)) as {
      query?: { embeddedin?: Array<{ title: string }> };
      continue?: { eicontinue?: string };
    };
    const batch = data.query?.embeddedin ?? [];
    out.push(...batch.map((row) => row.title));
    eicontinue = data.continue?.eicontinue;
    if (!eicontinue || batch.length === 0) break;
    await sleep(400);
  }
  return out.slice(0, limit);
}

export async function searchPages(srsearch: string, limit = 500): Promise<string[]> {
  return searchAllPages(srsearch, limit);
}

/** Paginated full-text search in main namespace (MediaWiki caps apply). */
export async function searchAllPages(srsearch: string, max = 8000): Promise<string[]> {
  const out: string[] = [];
  let offset = 0;
  while (out.length < max) {
    const batch = Math.min(50, max - out.length);
    const data = (await api({
      action: "query",
      list: "search",
      srsearch,
      srlimit: String(batch),
      sroffset: String(offset),
      srnamespace: "0",
    })) as {
      query?: { search?: Array<{ title: string }> };
      continue?: { sroffset?: number };
    };
    const hits = data.query?.search ?? [];
    if (hits.length === 0) break;
    out.push(...hits.map((h) => h.title));
    const next = data.continue?.sroffset;
    if (next === undefined) break;
    offset = next;
    await sleep(400);
  }
  return out;
}

export async function fetchWikitext(title: string): Promise<string> {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "wikitext",
    format: "json",
    formatversion: "2",
  });
  const response = await fetch(`${ORIGIN}/w/api.php?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${title}`);
  const parsed = (await response.json()) as {
    parse?: { wikitext?: string };
    error?: { info?: string };
  };
  if (!parsed.parse?.wikitext) {
    throw new Error(parsed.error?.info ?? `no wikitext for ${title}`);
  }
  return parsed.parse.wikitext;
}
