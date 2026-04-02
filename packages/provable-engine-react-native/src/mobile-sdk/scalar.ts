import { NitroModules } from "react-native-nitro-modules";
import { getNitroClassNetworkAware } from "./current-network";
import type { Scalar as ScalarNitro } from "./specs/scalar.nitro";

const createScalarHybrid = (): ScalarNitro => getNitroClassNetworkAware<ScalarNitro>("Scalar");

type ScalarInput = string | Scalar | ScalarNitro | { toString(): unknown };

function isScalarNitro(value: unknown): value is ScalarNitro {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as ScalarNitro;
  return typeof candidate.clone === "function" && typeof candidate.toString === "function";
}

const ensureScalarString = (scalar: string): string => {
  const trimmed = scalar.trim();
  if (!trimmed) {
    throw new Error("Scalar cannot be an empty string");
  }
  if (!trimmed.endsWith("scalar")) {
    throw new Error("Scalar must end with the 'scalar' suffix");
  }
  return trimmed;
};

export class Scalar {
  private readonly _nitroScalar: ScalarNitro;

  private constructor(nitroScalar: ScalarNitro) {
    this._nitroScalar = nitroScalar;
  }

  static fromString(value: ScalarInput): Scalar {
    if (value instanceof Scalar) {
      return value.clone();
    }

    if (typeof value === "string") {
      const normalized = ensureScalarString(value);
      const nitro = createScalarHybrid().fromString(normalized);
      return new Scalar(nitro);
    }

    if (isScalarNitro(value)) {
      return new Scalar(value.clone());
    }

    if (value && typeof value === "object" && typeof (value as any).toString === "function") {
      const asString = (value as any).toString();
      if (typeof asString === "string") {
        return Scalar.fromString(asString);
      }
    }

    throw new TypeError("Unsupported value passed to Scalar.fromString()");
  }

  static fromNitro(nitroScalar: ScalarNitro): Scalar {
    return new Scalar(nitroScalar.clone());
  }

  clone(): Scalar {
    return new Scalar(this._nitroScalar.clone());
  }

  toString(): string {
    return this._nitroScalar.toString();
  }

  toNitro(): ScalarNitro {
    return this._nitroScalar;
  }

  get nitro(): ScalarNitro {
    return this._nitroScalar;
  }
}
