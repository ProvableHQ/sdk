import type { Field, Group } from "../../wasm.ts";
import type { InputObject } from "../input/inputObject.ts";
import type { OutputObject } from "../output/outputObject.ts";

export interface TransitionObject {
  id: string;
  program: string;
  function: string;
  inputs?: InputObject[];
  outputs?: OutputObject[];
  proof: string;
  tpk: string | Group;
  tcm: string | Field;
  scm: string | Field;
  fee: bigint;
}
