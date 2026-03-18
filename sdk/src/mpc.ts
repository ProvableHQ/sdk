import {
    Address,
    ExecutionRequest,
    Field,
    Group,
} from "./wasm.js";
import { logAndThrow } from "./utils.js";
import {
    toField,
    toGroup,
    toViewKey,
    toSignature,
    toAddress,
    isViewKeyStrategy,
    isInputIdStrategy,
    isRecordViewKeyStrategy,
} from "./models/mpc.js";
import type {
    ExternalSigningInput,
    ExternalSigningOptions,
    ExecutionRequestParams,
    InputStrategy,
    OutputFormat,
    RequestSignInput,
} from "./models/mpc.js";

// Re-export everything from models/mpc for consumers
export * from "./models/mpc.js";

// ---------------------------------------------------------------------------
// buildExecutionRequestFromExternallySignedData
// ---------------------------------------------------------------------------

/**
 * Build an ExecutionRequest from externally signed data.
 *
 * The `strategy` parameter determines how record input IDs are resolved:
 * - `{ recordViewKeys?, gammas? }` — explicit record view keys and gammas
 * - `{ viewKey, gammas? }` — derive record view keys from a ViewKey
 * - `{ inputIds }` — pre-computed input IDs (Field or [Field, Group, Field, Field, Field] tuples)
 *
 * @throws {Error} If `strategy` is not a valid `InputStrategy` variant.
 *
 * @example
 * // With explicit record view keys
 * buildExecutionRequestFromExternallySignedData(
 *   { programId, functionName, inputs, inputTypes, signature, tvk, signer, skTag },
 *   { recordViewKeys: [...], gammas: [...] },
 * );
 *
 * // With a view key
 * buildExecutionRequestFromExternallySignedData(
 *   { programId, functionName, inputs, inputTypes, signature, tvk, signer, skTag },
 *   { viewKey: "AViewKey1..." },
 * );
 *
 * // With pre-computed input IDs
 * buildExecutionRequestFromExternallySignedData(
 *   { programId, functionName, inputs, inputTypes, signature, tvk, signer, skTag },
 *   { inputIds: [...] },
 * );
 */
export function buildExecutionRequestFromExternallySignedData(
    params: ExecutionRequestParams,
    strategy: InputStrategy = {},
): ExecutionRequest {
    const { programId, functionName, inputs, inputTypes, signature, tvk, signer, skTag } = params;
    const sig = toSignature(signature);
    const tvkField = toField(tvk);
    const signerAddr = toAddress(signer);
    const skTagField = toField(skTag);

    if (isInputIdStrategy(strategy)) {
        const convertedIds = strategy.inputIds.map((id) => {
            if (Array.isArray(id)) {
                return [toField(id[0]), toGroup(id[1]), toField(id[2]), toField(id[3]), toField(id[4])] as [Field, Group, Field, Field, Field];
            }
            return toField(id);
        });
        return ExecutionRequest.fromExternallySignedDataWithInputIds(
            programId, functionName, inputs, inputTypes,
            sig, tvkField, signerAddr, skTagField,
            convertedIds,
        );
    }

    if (isViewKeyStrategy(strategy)) {
        return ExecutionRequest.fromExternallySignedDataWithViewKey(
            programId, functionName, inputs, inputTypes,
            sig, tvkField, signerAddr, skTagField,
            toViewKey(strategy.viewKey),
            strategy.gammas ? strategy.gammas.map(toGroup) : undefined,
        );
    }

    if (isRecordViewKeyStrategy(strategy)) {
        return ExecutionRequest.fromExternallySignedData(
            programId, functionName, inputs, inputTypes,
            sig, tvkField, signerAddr, skTagField,
            strategy.recordViewKeys ? strategy.recordViewKeys.map(toField) : undefined,
            strategy.gammas ? strategy.gammas.map(toGroup) : undefined,
        );
    }

    throw new Error(
        "buildExecutionRequestFromExternallySignedData: strategy must be a RecordViewKeyStrategy ({ recordViewKeys?, gammas? }), "
        + "ViewKeyStrategy ({ viewKey, gammas? }), or InputIdStrategy ({ inputIds }). "
        + `Received: ${JSON.stringify(strategy)}`,
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
 * The optional `outputFormat` field controls how field elements are returned:
 * - `"string"` (default) — human-readable strings like `"123field"`
 * - `"bytes"` — raw little-endian `Uint8Array`s
 *
 * @param {ExternalSigningOptions} options - Program name, function name, inputs, input_types, root flag, an optional program checksum, an optional view key, and an optional output format.
 * @throws Throws if parsing the program ID, function name, or inputs fails or if the inputs do not match the type signatures passed in the input_types parameter.
 *
 * @example
 * // String output (default)
 * const result = await computeExternalSigningInputs({
 *   programName: "credits.aleo",
 *   functionName: "transfer_public",
 *   inputs: ["aleo1...", "100u64"],
 *   inputTypes: ["address.public", "u64.public"],
 *   isRoot: true,
 * });
 * result.functionId; // string
 *
 * @example
 * // Bytes output
 * const result = await computeExternalSigningInputs({
 *   programName: "credits.aleo",
 *   functionName: "transfer_public",
 *   inputs: ["aleo1...", "100u64"],
 *   inputTypes: ["address.public", "u64.public"],
 *   isRoot: true,
 *   outputFormat: "bytes",
 * });
 * result.functionId; // Uint8Array
 *
 * @returns {ExternalSigningInput} A JSON object for inputs to external signing algorithms.
 */
export async function computeExternalSigningInputs(
    options: ExternalSigningOptions & { outputFormat: "bytes" },
): Promise<ExternalSigningInput<"bytes">>;
export async function computeExternalSigningInputs(
    options: ExternalSigningOptions & { outputFormat?: "string" },
): Promise<ExternalSigningInput<"string">>;
export async function computeExternalSigningInputs(
    options: ExternalSigningOptions,
): Promise<ExternalSigningInput<OutputFormat>> {
    const { programName, functionName, inputs, inputTypes, isRoot, checksum, viewKey, outputFormat = "string" } = options;

    // Convert FieldLike/ViewKeyLike to WASM types (or null)
    const checksumField = checksum != null ? toField(checksum) : null;
    const viewKeyObj = viewKey != null ? toViewKey(viewKey) : null;

    try {
        const raw = <{ functionId?: string; function_id?: string; isRoot: string; requestInputs: RequestSignInput<"string">[]; checksum?: string; signer?: Address; skTag?: Field }>(
            await ExecutionRequest.computeExternalSigningInputs(programName, functionName, inputs, inputTypes, isRoot, checksumField, viewKeyObj)
        );
        // Normalize camelCase: WASM may return function_id
        const functionIdStr = (raw.functionId ?? raw.function_id)!;
        const isRootBool = raw.isRoot === "1field";

        if (outputFormat === "bytes") {
            return {
                functionId: fieldStringToBytes(functionIdStr),
                isRoot: isRootBool,
                requestInputs: raw.requestInputs.map(serializeRequestSignInputToBytes),
                checksum: raw.checksum ? fieldStringToBytes(raw.checksum) : undefined,
                signer: raw.signer ? raw.signer.to_string() : undefined,
                skTag: raw.skTag ? raw.skTag.toString() : undefined,
            } as ExternalSigningInput<OutputFormat>;
        }

        return {
            functionId: functionIdStr,
            isRoot: isRootBool,
            requestInputs: raw.requestInputs,
            checksum: raw.checksum ?? undefined,
            signer: raw.signer ? raw.signer.to_string() : undefined,
            skTag: raw.skTag ? raw.skTag.toString() : undefined,
        } as ExternalSigningInput<OutputFormat>;
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        logAndThrow(`Error computing public message payload: ${msg}`);
    }
}

// ---------------------------------------------------------------------------
// Bytes conversion helpers
// ---------------------------------------------------------------------------

/** Convert a field-element string (e.g. `"123field"`) to little-endian bytes. */
function fieldStringToBytes(s: string): Uint8Array {
    return Field.fromString(s).toBytesLe();
}

/** Convert a {@link RequestSignInput<"string">} to its bytes-serialised equivalent. */
function serializeRequestSignInputToBytes(input: RequestSignInput<"string">): RequestSignInput<"bytes"> {
    return {
        outputType: input.outputType,
        index: fieldStringToBytes(input.index),
        data: input.data.map(fieldStringToBytes),
        name: input.name,
        h: input.h ? fieldStringToBytes(input.h) : undefined,
        tag: input.tag ? fieldStringToBytes(input.tag) : undefined,
        recordViewKey: input.recordViewKey ? fieldStringToBytes(input.recordViewKey) : undefined,
    };
}
