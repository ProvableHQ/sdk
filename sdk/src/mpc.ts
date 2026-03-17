import {
    Address,
    ExecutionRequest,
    Field,
    Group,
    Signature,
    ViewKey,
} from "./wasm.js";
import { ExternalSigningInput, ExternalSigningOptions } from "./models/ExternalSigningInputs.js";
import { logAndThrow } from "./utils.js";

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
// Wrapper functions
// ---------------------------------------------------------------------------

/**
 * Build an ExecutionRequest from externally signed data with explicit
 * record_view_keys and gammas.
 */
export function buildRequestFromExternallySignedData(
    programId: string,
    functionName: string,
    inputs: string[],
    inputTypes: string[],
    signature: SignatureLike,
    tvk: FieldLike,
    signer: AddressLike,
    skTag: FieldLike,
    recordViewKeys?: FieldLike[],
    gammas?: GroupLike[],
): ExecutionRequest {
    return ExecutionRequest.fromExternallySignedData(
        programId,
        functionName,
        inputs,
        inputTypes,
        toSignature(signature),
        toField(tvk),
        toAddress(signer),
        toField(skTag),
        recordViewKeys ? recordViewKeys.map(toField) : undefined,
        gammas ? gammas.map(toGroup) : undefined,
    );
}

/**
 * Build an ExecutionRequest from externally signed data using a ViewKey
 * to derive record_view_keys internally.
 */
export function buildRequestFromExternallySignedDataWithViewKey(
    programId: string,
    functionName: string,
    inputs: string[],
    inputTypes: string[],
    signature: SignatureLike,
    tvk: FieldLike,
    signer: AddressLike,
    skTag: FieldLike,
    viewKey: ViewKeyLike,
    gammas?: GroupLike[],
): ExecutionRequest {
    return ExecutionRequest.fromExternallySignedDataWithViewKey(
        programId,
        functionName,
        inputs,
        inputTypes,
        toSignature(signature),
        toField(tvk),
        toAddress(signer),
        toField(skTag),
        toViewKey(viewKey),
        gammas ? gammas.map(toGroup) : undefined,
    );
}

/**
 * Build an ExecutionRequest from externally signed data with pre-computed
 * input IDs. Each input ID is either a Field (public/private/constant) or
 * a [Field, Group, Field, Field, Field] tuple (record).
 */
export function buildRequestFromExternallySignedDataWithInputIds(
    programId: string,
    functionName: string,
    inputs: string[],
    inputTypes: string[],
    signature: SignatureLike,
    tvk: FieldLike,
    signer: AddressLike,
    skTag: FieldLike,
    inputIds: InputID[],
): ExecutionRequest {
    const convertedIds = inputIds.map((id) => {
        if (Array.isArray(id)) {
            return [toField(id[0]), toGroup(id[1]), toField(id[2]), toField(id[3]), toField(id[4])] as [Field, Group, Field, Field, Field];
        }
        return toField(id);
    });
    return ExecutionRequest.fromExternallySignedDataWithInputIds(
        programId,
        functionName,
        inputs,
        inputTypes,
        toSignature(signature),
        toField(tvk),
        toAddress(signer),
        toField(skTag),
        convertedIds,
    );
}

// ---------------------------------------------------------------------------
// computeExternalSigningInputs (moved from ProgramManager)
// ---------------------------------------------------------------------------

/**
 * Computes the function ID and serialized input data for a program function call.
 * Used by external signing wallets and other applications that need publicly computable inputs
 * for building a signed execution request (e.g. before calling {@link ExecutionRequest.sign}).
 *
 * @param {ExternalSigningOptions} options - Program name, function name, inputs, input_types, root flag, an optional program checksum, and an optional view key.
 * @throws Throws if parsing the program ID, function name, or inputs fails or if the inputs do not match the type signatures passed in the input_types parameter.
 *
 * @example
 * const externalSigningInputs = await computeExternalSigningInputs({
 *   programName: "credits.aleo",
 *   functionName: "transfer_public",
 *   inputs: ["aleo1...", "100u64"],
 *   inputTypes: ["address.public", "u64.public"],
 *   isRoot: true,
 * });
 *
 * @returns {ExternalSigningInput} A JSON object for inputs to external signing algorithms.
 */
export async function computeExternalSigningInputs(options: ExternalSigningOptions): Promise<ExternalSigningInput> {
    const { programName, functionName, inputs, inputTypes, isRoot, checksum, viewKey } = options;
    try {
        const raw = <ExternalSigningInput & { signer?: Address; skTag?: Field }>(await ExecutionRequest.computeExternalSigningInputs(programName, functionName, inputs, inputTypes, isRoot, checksum ?? null, viewKey ?? null));
        // Normalize to ExternalSigningInput (camelCase): WASM may return function_id
        const functionId = (raw as { functionId?: string }).functionId ?? (raw as { function_id?: string }).function_id;
        return {
            functionId: functionId!,
            isRoot: raw.isRoot,
            requestInputs: raw.requestInputs,
            checksum: raw.checksum ?? undefined,
            signer: raw.signer,
            skTag: raw.skTag,
        };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        logAndThrow(`Error computing public message payload: ${msg}`);
    }
}
