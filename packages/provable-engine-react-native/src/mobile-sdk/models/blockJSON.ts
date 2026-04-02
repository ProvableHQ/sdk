import type { ConfirmedTransactionJSON } from "./confirmed_transaction.ts";
import type { RatificationJSON } from "./ratification.ts";
import type { SolutionsJSON } from "./solution.ts";

export type BlockJSON = {
  block_hash: string;
  previous_hash: string;
  header: Header;
  transactions?: ConfirmedTransactionJSON[];
  signature: string;
  ratifications: RatificationJSON[];
  solutions: SolutionsJSON;
  aborted_solution_ids: string[];
  aborted_transaction_ids: string[];
};

export type Header = {
  previous_state_root: string;
  transactions_root: string;
  finalize_root: string;
  ratifications_root: string;
  solutions_root: string;
  subdag_root: string;
  metadata: Metadata;
};

export type Metadata = {
  network: bigint;
  round: bigint;
  height: bigint;
  coinbase_target: bigint;
  proof_target: bigint;
  timestamp: bigint;
  cumulative_weight: bigint;
  cumulative_proof_target: bigint;
};
