import { describe, expect, test } from "bun:test";
import { rootOf } from "./lib/probe-shape";
import { categoryNameToRoot, GITA_PRESS_CATEGORIES, parseSurveyArgs } from "./survey";

describe("gita press survey", () => {
  test("rootOf takes the first path segment", () => {
    expect(rootOf("मत्स्यपुराणम्/अध्यायः १")).toBe("मत्स्यपुराणम्");
    expect(rootOf("मत्स्यपुराणम्")).toBe("मत्स्यपुराणम्");
  });

  test("parseSurveyArgs reads limits", () => {
    expect(parseSurveyArgs(["--max-roots", "3", "--json"]).maxRoots).toBe(3);
    expect(parseSurveyArgs(["--discover-only"]).discoverOnly).toBe(true);
    expect(parseSurveyArgs(["--catalog"]).catalog).toBe(true);
  });

  test("default categories are non-empty", () => {
    expect(GITA_PRESS_CATEGORIES.length).toBeGreaterThan(0);
  });

  test("categoryNameToRoot strips वर्गः:", () => {
    expect(categoryNameToRoot("वर्गः:अग्निपुराणम्")).toBe("अग्निपुराणम्");
  });
});
