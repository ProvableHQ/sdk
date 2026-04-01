# @provablehq/provablekit

Shared, platform-agnostic contracts and orchestration primitives for Provable SDK engines.

Install:

```bash
npm install @provablehq/provablekit
```

## Highlights

- `ProvableKit.init({ engine, env })` unified initialization entrypoint.
- Engine contract (`ProvableEngine`) for runtime-specific implementations.
- Shared utilities for retries/JSON parsing and base network clients.
