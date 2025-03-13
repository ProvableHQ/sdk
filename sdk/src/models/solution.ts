export interface SolutionsJSON {
    version: BigInt;
    solutions?: SolutionJSON[];
}

export interface SolutionJSON {
    partial_solution: PartialSolutionJSON;
    target: BigInt;
}

export interface PartialSolutionJSON {
    solution_id: string;
    epoch_hash: string;
    address: string;
    counter: BigInt;
}