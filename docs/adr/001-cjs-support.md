# ADR-001: CommonJS Build Target

**Status:** Accepted  
**Date:** 2026-04-17  
**Review by:** 2027-04-17

## Context

A partner integration required `require()` support from a CommonJS codebase. Their stack cannot use ESM imports (including dynamic `await import()`), and the alternative was maintaining an internal fork of the SDK.

Shipping a CJS build target requires that we avoid top-level await (TLA) anywhere in the source tree that gets bundled into the Node CJS entry. Rollup's CJS output format does not support TLA and hard-fails the build if any is present.

## Decision

Ship CJS output alongside ESM for both `@provablehq/sdk` and `@provablehq/wasm`, with a 12-month review window.

### Constraints accepted

- **No TLA in the Node entry graph.** Any `await` at module scope in a source file reachable from `node.ts` will fail the CJS build. Enforced automatically by Rollup at build time (exit code 1).
- **`initSync` for WASM initialization in CJS.** The CJS entry uses wasm-bindgen's `initSync` with `fs.readFileSync` instead of the default async `init()`. This is a documented wasm-bindgen API ([synchronous instantiation](https://wasm-bindgen.github.io/wasm-bindgen/examples/synchronous-instantiation.html)), but its long-term availability is not guaranteed.
- **No TLA-dependent initialization patterns.** Any future startup initialization (metadata fetching, consensus config, etc.) must use explicit init functions (same pattern as `initThreadPool`) rather than TLA.

### What is unaffected

- ESM consumers get identical output. CJS files ship alongside and bundlers pick the format they need.
- Async functions (including `initThreadPool`) work normally from CJS when called inside async contexts.
- Browser builds are unchanged.
- Source code itself has no CJS-specific logic. All CJS concerns live in the build/packaging layer.

## Removal plan

CJS support is structured for clean removal. All CJS-specific code is additive:

| Component | What to remove |
|---|---|
| `wasm/build.js` | CJS entry template |
| `wasm/package.json` | `require` condition in exports map |
| `sdk/package.json` | `require`/`types.require` conditions, revert `main` field, remove `test:cjs*` scripts |
| `sdk/rollup.config.js` | CJS output entry |
| `sdk/tests/cjs-smoke/` | Entire directory |
| `.github/workflows/sdk.yml` | CJS CI jobs |

No source code changes required. Removing CJS is equivalent to reverting PR #1293.

## Review criteria (April 2027)

At the 12-month mark, evaluate:

1. **Is anyone using the CJS build?** Check npm download stats for `require` condition hits if available, or survey known consumers.
2. **Has the TLA constraint caused friction?** Review whether any feature or dependency was blocked or complicated by the no-TLA rule.
3. **Has `initSync` been deprecated upstream?** Check wasm-bindgen's status on synchronous instantiation.
4. **Has the Node/npm ecosystem moved further from CJS?** If major LTS versions or frameworks have dropped CJS support, the case for maintaining it weakens.

If usage is low and the constraint has caused friction, drop CJS support. If usage is meaningful, extend with a new review date.

## References

- PR #1293: CJS build target implementation
- PR #1295: Noble-sodium swap (removed `await sodium.ready` TLA, prerequisite for CJS)
- wasm-bindgen synchronous instantiation: https://wasm-bindgen.github.io/wasm-bindgen/examples/synchronous-instantiation.html
- wasm-bindgen initSync discussion: https://github.com/wasm-bindgen/wasm-bindgen/issues/1976
- W3C Service Worker / initSync context: https://github.com/w3c/ServiceWorker/issues/1499
