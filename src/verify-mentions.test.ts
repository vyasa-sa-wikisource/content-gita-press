import { describe, expect, test } from "bun:test";
import { PUBLISHER_MARKERS } from "./verify-mentions";

describe("verify-mentions", () => {
  test("publisher markers match explicit colophon text", () => {
    const sample = "… गीताप्रेस, गोरखपुर …";
    const hits = PUBLISHER_MARKERS.filter((m) => m.re.test(sample)).map((m) => m.id);
    expect(hits).toContain("gitapress-dev");
    expect(hits).toContain("gorakhpur");
  });

  test("does not treat Bhagavad Gita + press as Gita Press publisher", () => {
    const sample = "I study the Shrimad Bhagavad Gita. The press printed books.";
    const hits = PUBLISHER_MARKERS.filter((m) => m.re.test(sample)).map((m) => m.id);
    expect(hits).not.toContain("gita-press-en");
  });
});
