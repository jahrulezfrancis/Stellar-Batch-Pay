/**
 * Regression guard for #391.
 *
 * `app/demo/page.tsx` called `useEffect(...)` (session restore) while only
 * importing `{ useState }` from "react". With `ignoreBuildErrors` on, the
 * missing import slipped through and threw `ReferenceError: useEffect is not
 * defined` at runtime on repeat visits with saved session state.
 *
 * Mounting the client component would need jsdom + testing-library; instead we
 * statically assert that every React built-in hook the file *calls* is also
 * *imported* from "react". This pins the exact failure mode without new deps.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const DEMO_PAGE = path.join(process.cwd(), "app", "demo", "page.tsx");
const SOURCE = readFileSync(DEMO_PAGE, "utf8");

// React 19 built-in hooks. Hooks not in this set (useToast, useBatchHistory,
// useFreighter, useRouter, …) come from other modules and are out of scope.
const REACT_HOOKS = new Set([
  "use",
  "useState",
  "useEffect",
  "useLayoutEffect",
  "useRef",
  "useMemo",
  "useCallback",
  "useReducer",
  "useContext",
  "useTransition",
  "useDeferredValue",
  "useId",
  "useImperativeHandle",
  "useSyncExternalStore",
  "useDebugValue",
  "useInsertionEffect",
  "useOptimistic",
  "useActionState",
  "useFormStatus",
]);

/** Names brought in via `import { a, b as c } from "react"`. */
function reactNamedImports(src: string): Set<string> {
  const names = new Set<string>();
  const re = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']react["']/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src)) !== null) {
    for (const part of match[1].split(",")) {
      const original = part.trim().split(/\s+as\s+/)[0].trim();
      if (original) names.add(original);
    }
  }
  return names;
}

/** Distinct `useX(` call sites in the file. */
function calledHooks(src: string): Set<string> {
  const hooks = new Set<string>();
  const re = /\b(use[A-Z][A-Za-z0-9]*)\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src)) !== null) hooks.add(match[1]);
  return hooks;
}

describe("app/demo/page.tsx React hook imports (#391)", () => {
  test("useEffect is imported from react", () => {
    expect(reactNamedImports(SOURCE).has("useEffect")).toBe(true);
  });

  test("every React built-in hook it calls is imported from react", () => {
    const imported = reactNamedImports(SOURCE);
    const namespaceImport = /import\s+\*\s+as\s+\w+\s+from\s+["']react["']/.test(SOURCE);

    const missing = [...calledHooks(SOURCE)].filter(
      (hook) => REACT_HOOKS.has(hook) && !imported.has(hook) && !namespaceImport,
    );

    expect(missing).toEqual([]);
  });
});
