import { Field, ViewKey } from "@provablehq/wasm";

/**
 * Type surrounding the input to a MPC request.
 *
 * @property {string} outputType - The type of output being requested.
 * @property {string} index - The index of the output being requested represented as an Ed/BLS-377 base field element.
 * @property {string[]} data - The data being requested represented as Ed/BLS-377 base field elements.
 * @property {string} [name] - The name of the record being requested.
 * @property {string} [h] - The h value of the record being requested represented as an Ed/BLS-377 base field element.
 * @property {string} [tag] - The tag of the record being requested represented as an Ed/BLS-377 base field element.
 */
export interface RequestSignInput {
    outputType: "constant" | "public" | "private" | "record" | "external_records";
    index: string;
    data: string[];
    name?: string; // the record name.
    h?: string // optional h (only used in case of a record.)
    tag?: string // optional tag (only used in case of a record.)
}

/**
 * Type representing the input to a MPC request.
 *
 * @property {string} functionId - The ID of the function the request is for serialized to Ed/BLS-377 base field elements.
 * @property {string} isRoot - Field representation of a boolean indicating whether this is a top-level transition (i.e. "0field" or "1field").
 * @property {RequestSignInput[]} requestInputs - The inputs to the function being executed.
 * @property {string} [checksum] - The Ed/BLS-377 base field representation of the program checksum (for programs that contain constructors).
 */
export interface MPCInput {
    functionId: string;
    isRoot: string;
    requestInputs: RequestSignInput[]
    checksum?: string;
}

/**
 * Type representing the options for pre-computing the inputs to an MPC request.
 *
 * @property {string} programName - The name of the program containing the function to execute.
 * @property {string} functionName - The name of the function to execute within the program.
 * @property {string[]} inputs - The inputs to the function being executed.
 * @property {string[]} inputTypes - The input types of the function (e.g. ["address.public", "u64.public"]).
 * @property {boolean} isRoot - Whether this transition is the first transition being executed in a transaction.
 * @property {string} [checksum] - The optional checksum of the program, used to verify the program source code on the network matches the program source code used to generate the proof.
 */
export interface MPCOptions {
    programName: string;
    functionName: string;
    inputs: string[];
    inputTypes: string[],
    isRoot: boolean;
    checksum?: Field | null;
    viewKey?: ViewKey;
}