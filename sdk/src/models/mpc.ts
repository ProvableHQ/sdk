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
