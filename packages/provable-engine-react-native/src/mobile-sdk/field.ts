import { getNitroClassNetworkAware } from "./current-network";
import type { Field as FieldNitro } from "./specs/field.nitro";

const createFieldHybrid = (): FieldNitro => getNitroClassNetworkAware<FieldNitro>("Field");

type FieldInput = string | Field | FieldNitro | { toString(): unknown };

function isFieldNitro(value: unknown): value is FieldNitro {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as FieldNitro;
  return (
    typeof candidate.clone === "function" &&
    typeof candidate.asString === "function" &&
    typeof candidate.toBitsLe === "function"
  );
}

export class Field {
  private readonly _nitroField: FieldNitro;

  private constructor(nitroField: FieldNitro) {
    this._nitroField = nitroField;
  }

  static fromString(value: FieldInput): Field {
    if (value instanceof Field) {
      return value.clone();
    }

    if (typeof value === "string") {
      const nitro = createFieldHybrid().fromString(value);
      return new Field(nitro);
    }

    if (isFieldNitro(value)) {
      return new Field(value.clone());
    }

    if (value && typeof value === "object" && typeof value.toString === "function") {
      const stringValue = value.toString();
      if (typeof stringValue === "string") {
        return Field.fromString(stringValue);
      }
    }

    throw new TypeError("Unsupported value passed to Field.fromString()");
  }

  static fromNitro(nitroField: FieldNitro): Field {
    return new Field(nitroField.clone());
  }

  static one(): Field {
    return Field.fromNitro(createFieldHybrid().one());
  }

  static newDomainSeparator(domain: string): Field {
    return Field.fromNitro(createFieldHybrid().newDomainSeparator(domain));
  }

  clone(): Field {
    return new Field(this._nitroField.clone());
  }

  multiply(other: Field): Field {
    return new Field(this._nitroField.multiply(other._nitroField));
  }

  toBitsLe(): Uint8Array {
    return new Uint8Array(this._nitroField.toBitsLe());
  }

  toString(): string {
    return this._nitroField.asString();
  }

  toNitro(): FieldNitro {
    return this._nitroField;
  }

  get nitro(): FieldNitro {
    return this._nitroField;
  }
}
