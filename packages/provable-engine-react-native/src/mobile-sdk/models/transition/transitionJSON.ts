import type { InputJSON } from "../input/inputJSON.ts";
import type { OutputJSON } from "../output/outputJSON.ts";

export interface TransitionJSON {
  id: string;
  program: string;
  function: string;
  inputs?: InputJSON[];
  outputs?: OutputJSON[];
  proof: string;
  tpk: string;
  tcm: string;
  scm: string;
  fee: bigint;
}
