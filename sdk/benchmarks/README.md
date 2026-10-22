# SDK benchmarks

Two scripts, both run with plain `node` after `yarn build:all`:

| Script         | What it measures                                                                                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bench.mjs`    | Micro benchmark on a one-instruction program: authorization, fee authorization, key synthesis, proving, verification, and a few primitives. Quick (about a minute).                                               |
| `programs.mjs` | The production Shield Swap and bridge programs: per function, the time and the peak WebAssembly linear memory of authorization, circuit and key synthesis, and proving. About an hour for all cases on one build. |

Both take `--sdk <entry>` to pick a build and `--compare <entry>` to run two builds side by side in separate processes.

## Program benchmark

```bash
cd sdk
node benchmarks/programs.mjs --list
node benchmarks/programs.mjs                                  # all cases, wasm32 build
node benchmarks/programs.mjs --case claim_swap_output --reps 2
node benchmarks/programs.mjs --compare dist/wasm64/mainnet/node.js   # wasm32 vs Memory64
```

Cases (mainnet deployments, sources fetched once from the explorer API and cached under the OS temp directory):

- `swap`, `swap_multi_hop`, `swap_from_wrapped`: Shield Swap swaps (ETH, USDCx and ALEO pools).
- `claim_swap_output`: claiming a swap's output.
- `burn_public_as_signer`, `private_burn`: USDCx bridge withdrawals.
- `transfer_remote`: Hyperlane warp route transfer of ETH to Ethereum.

Each (build, case, repetition) runs in its own child process. WebAssembly memory never shrinks, so the size after a step is the peak the step needed, and a build that exhausts its memory takes only its own process down. The report marks such a step `OOM` and lists the cases per build, so a wasm32 run (4 GiB cap) can be compared with a Memory64 run.

Functions that consume a record (`swap`, `swap_multi_hop`, `swap_from_wrapped`, `private_burn`) stop after synthesis: the inclusion proof needs a ledger state path for the record, which an offline run cannot supply. Record-free functions are proven with an `OfflineQuery`, so timings exclude network I/O.

## CI

`.github/workflows/benchmarks.yml` runs both scripts weekly and on demand (`workflow_dispatch`, with optional case and repetition inputs), writes the tables to the job summary and uploads them as artifacts. When the checkout builds `sdk/dist/wasm64`, the program benchmark compares it against wasm32.
