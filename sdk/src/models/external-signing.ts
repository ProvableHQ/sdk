import {
    Address,
    Field,
    Group,
    Signature,
    ViewKey,
} from "../wasm.js";

// ---------------------------------------------------------------------------
// Flexible deserialization types
// ---------------------------------------------------------------------------

/** A Field, a string representation, or raw LE bytes. */
export type FieldLike = Field | string | Uint8Array;
/** A Group, a Field (x-coordinate), a string representation, or raw LE bytes. */
export type GroupLike = Group | Field | string | Uint8Array;
/** A ViewKey, a string representation, or raw LE bytes. */
export type ViewKeyLike = ViewKey | string | Uint8Array;
/** A Signature, a string representation, or raw LE bytes. */
export type SignatureLike = Signature | string | Uint8Array;
/** An Address, a string representation, or raw LE bytes. */
export type AddressLike = Address | string | Uint8Array;
/** An input ID is either a single Field-like (public/private) or a 5-tuple (record) with flexible deserialization. */
export type InputID = FieldLike | [FieldLike, GroupLike, FieldLike, FieldLike, FieldLike];

// ---------------------------------------------------------------------------
// Converters
// ---------------------------------------------------------------------------

export function toField(value: FieldLike): Field {
    if (value instanceof Field) return value;
    if (typeof value === "string") return Field.fromString(value);
    if (value instanceof Uint8Array) return Field.fromBytesLe(value);
    throw new Error("toField: expected Field, string, or Uint8Array");
}

export function toGroup(value: GroupLike): Group {
    if (value instanceof Group) return value;
    if (value instanceof Field) return Group.fromField(value);
    if (typeof value === "string") {
        // If the string contains "field", treat it as an x-coordinate
        if (value.includes("field")) return Group.fromFieldString(value);
        return Group.fromString(value);
    }
    if (value instanceof Uint8Array) {
        // Try group deserialization first, fall back to field-to-group
        try {
            return Group.fromBytesLe(value);
        } catch {
            return Group.fromField(Field.fromBytesLe(value));
        }
    }
    throw new Error("toGroup: expected Group, Field, string, or Uint8Array");
}

export function toViewKey(value: ViewKeyLike): ViewKey {
    if (value instanceof ViewKey) return value;
    if (typeof value === "string") return ViewKey.from_string(value);
    if (value instanceof Uint8Array) return ViewKey.fromBytesLe(value);
    throw new Error("toViewKey: expected ViewKey, string, or Uint8Array");
}

export function toSignature(value: SignatureLike): Signature {
    if (value instanceof Signature) return value;
    if (typeof value === "string") return Signature.from_string(value);
    if (value instanceof Uint8Array) return Signature.fromBytesLe(value);
    throw new Error("toSignature: expected Signature, string, or Uint8Array");
}

export function toAddress(value: AddressLike): Address {
    if (value instanceof Address) return value;
    if (typeof value === "string") return Address.from_string(value);
    if (value instanceof Uint8Array) return Address.fromBytesLe(value);
    throw new Error("toAddress: expected Address, string, or Uint8Array");
}

// ---------------------------------------------------------------------------
// computeExternalSigningInputs types
// ---------------------------------------------------------------------------

/** Output format discriminant for `computeExternalSigningInputs`. */
export type OutputFormat = "string" | "bytes";

/** Maps an {@link OutputFormat} to the concrete field-element representation. */
export type FieldOutput<F extends OutputFormat> = F extends "bytes" ? Uint8Array : string;

/**
 * Type surrounding the input to an external signing request.
 *
 * The generic parameter `F` controls whether field elements are serialised as
 * human-readable strings (`"string"`, the default) or raw little-endian bytes
 * (`"bytes"`).
 *
 * @property {string} signingInputType - The type of signing input being requested.
 * @property {FieldOutput<F>} index - The index of the output represented as an Ed/BLS-377 base field element.
 * @property {FieldOutput<F>[]} data - The data represented as Ed/BLS-377 base field elements.
 * @property {string} [name] - The name of the record being requested.
 * @property {FieldOutput<F>} [h] - The h value of the record represented as an Ed/BLS-377 base field element.
 * @property {FieldOutput<F>} [tag] - The tag of the record represented as an Ed/BLS-377 base field element.
 * @property {FieldOutput<F>} [recordViewKey] - The record view key (present for record inputs when viewKey was provided).
 */
export interface RequestSignInput<F extends OutputFormat = "string"> {
    signingInputType: "constant" | "public" | "private" | "record" | "external_record";
    index: FieldOutput<F>;
    data: FieldOutput<F>[];
    name?: string;
    h?: FieldOutput<F>;
    tag?: FieldOutput<F>;
    recordViewKey?: FieldOutput<F>;
}

/**
 * Type representing the output of an external signing request.
 *
 * The generic parameter `F` controls whether field elements are serialised as
 * human-readable strings (`"string"`, the default) or raw little-endian bytes
 * (`"bytes"`).
 *
 * @property {FieldOutput<F>} functionId - The function ID as Ed/BLS-377 base field element(s).
 * @property {boolean} isRoot - Whether this is a top-level transition.
 * @property {RequestSignInput<F>[]} requestInputs - The inputs to the function being executed.
 * @property {FieldOutput<F>} [checksum] - The Ed/BLS-377 base field representation of the program checksum.
 * @property {string} [signer] - The signer address string (present when viewKey was provided).
 * @property {string} [skTag] - The tag secret key string (present when viewKey was provided).
 */
export interface ExternalSigningInput<F extends OutputFormat = "string"> {
    functionId: FieldOutput<F>;
    isRoot: boolean;
    requestInputs: RequestSignInput<F>[];
    checksum?: FieldOutput<F>;
    signer?: string;
    skTag?: string;
}

/**
 * Type representing the options for pre-computing the inputs to an external signing request.
 *
 * @property {string} programName - The name of the program containing the function to execute.
 * @property {string} functionName - The name of the function to execute within the program.
 * @property {string[]} inputs - The inputs to the function being executed.
 * @property {string[]} inputTypes - The input types of the function (e.g. ["address.public", "u64.public"]).
 * @property {boolean} isRoot - Whether this transition is the first transition being executed in a transaction.
 * @property {FieldLike} [checksum] - The optional checksum of the program.
 * @property {ViewKeyLike} [viewKey] - The optional view key used to derive signer and skTag.
 * @property {OutputFormat} [outputFormat] - Controls whether field elements are serialised as strings (default) or Uint8Arrays.
 */
export interface ExternalSigningOptions {
    programName: string;
    functionName: string;
    inputs: string[];
    inputTypes: string[];
    isRoot: boolean;
    checksum?: FieldLike | null;
    viewKey?: ViewKeyLike | null;
    outputFormat?: OutputFormat;
}

// ---------------------------------------------------------------------------
// ExecutionRequest builder types
// ---------------------------------------------------------------------------

/** Common parameters shared by all `buildExecutionRequest` variants. */
export interface ExecutionRequestParams {
    programId: string;
    functionName: string;
    inputs: string[];
    inputTypes: string[];
    signature: SignatureLike;
    tvk: FieldLike;
    signer: AddressLike;
    skTag: FieldLike;
}

/** Provide explicit record view keys and gammas. */
export interface RecordViewKeyStrategy {
    recordViewKeys?: FieldLike[];
    gammas?: GroupLike[];
}

/** Provide a view key to derive record view keys internally. */
export interface ViewKeyStrategy {
    viewKey: ViewKeyLike;
    gammas?: GroupLike[];
}

/** Provide pre-computed input IDs directly. */
export interface InputIdStrategy {
    inputIds: InputID[];
}

/** Determines how record input IDs are resolved when building an ExecutionRequest. */
export type InputStrategy = RecordViewKeyStrategy | ViewKeyStrategy | InputIdStrategy;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

/** Returns `true` if the strategy provides a `viewKey` for deriving record view keys. */
export function isViewKeyStrategy(r: InputStrategy): r is ViewKeyStrategy {
    return r != null && "viewKey" in r;
}

/** Returns `true` if the strategy provides pre-computed `inputIds`. */
export function isInputIdStrategy(r: InputStrategy): r is InputIdStrategy {
    return r != null && "inputIds" in r;
}

/** Returns `true` if the strategy provides explicit `recordViewKeys` (or is the default empty variant). */
export function isRecordViewKeyStrategy(r: InputStrategy): r is RecordViewKeyStrategy {
    if (r == null || isViewKeyStrategy(r) || isInputIdStrategy(r)) return false;
    const keys = Object.keys(r);
    return keys.length === 0 || keys.every((k) => k === "recordViewKeys" || k === "gammas");
}
