// Axe assertion helper: runs axe-core against a rendered container
import { type AxeResults, configure, run, type RunOptions } from "axe-core";

const DEFAULT_DISABLED_RULES = ["color-contrast"];

export interface AccessibleOptions {
  disabledRules?: string[];
}

function describeViolations(violations: AxeResults["violations"]): string {
  return violations
    .map((violation) => {
      const impact = violation.impact ?? "unknown";
      return `${violation.id} (${impact}) — ${violation.help}\n${violation.helpUrl}\n${violation.nodes
        .map((node) => `  -> ${node.target.join(" ")}`)
        .join("\n")}`;
    })
    .join("\n\n");
}

export async function expectAccessible(
  container: HTMLElement,
  options: AccessibleOptions = {},
): Promise<void> {
  configure({});
  const disabledRules = [...DEFAULT_DISABLED_RULES, ...(options.disabledRules ?? [])];
  const runOptions: RunOptions = {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
    },
    rules: Object.fromEntries(disabledRules.map((id) => [id, { enabled: false }])),
  };
  const results = await run(container, runOptions);
  const violations = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  if (violations.length > 0) {
    throw new Error(`Accessibility violations found:\n${describeViolations(violations)}`);
  }
}
