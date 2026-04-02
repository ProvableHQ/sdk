export interface SolutionsJSON {
  version: bigint;
  solutions?: SolutionJSON[];
}

export interface SolutionJSON {
  partial_solution: PartialSolutionJSON;
  target: bigint;
}

export interface PartialSolutionJSON {
  solution_id: string;
  epoch_hash: string;
  address: string;
  counter: bigint;
}
