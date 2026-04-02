import { getNitroClassNetworkAware } from "./current-network";
import type { Group as GroupNitro } from "./specs/group.nitro";

const createGroupHybrid = (): GroupNitro => getNitroClassNetworkAware<GroupNitro>("Group");

type GroupInput = string | Group | GroupNitro | { toString(): unknown };

function isGroupNitro(value: unknown): value is GroupNitro {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as GroupNitro;
  return typeof candidate.clone === "function" && typeof candidate.toString === "function";
}

const ensureGroupString = (group: string): string => {
  const trimmed = group.trim();
  if (!trimmed) {
    throw new Error("Group cannot be an empty string");
  }
  if (!trimmed.endsWith("group")) {
    throw new Error("Group must end with the 'group' suffix");
  }
  return trimmed;
};

export class Group {
  private readonly _nitroGroup: GroupNitro;

  private constructor(nitroGroup: GroupNitro) {
    this._nitroGroup = nitroGroup;
  }

  static fromString(value: GroupInput): Group {
    if (value instanceof Group) {
      return value.clone();
    }

    if (typeof value === "string") {
      const normalized = ensureGroupString(value);
      const nitro = createGroupHybrid().fromString(normalized);
      return new Group(nitro);
    }

    if (isGroupNitro(value)) {
      return new Group(value.clone());
    }

    if (value && typeof value === "object" && typeof (value as any).toString === "function") {
      const stringValue = (value as any).toString();
      if (typeof stringValue === "string") {
        return Group.fromString(stringValue);
      }
    }

    throw new TypeError("Unsupported value passed to Group.fromString()");
  }

  static fromNitro(nitroGroup: GroupNitro): Group {
    return new Group(nitroGroup.clone());
  }

  clone(): Group {
    return new Group(this._nitroGroup.clone());
  }

  toString(): string {
    return this._nitroGroup.toString();
  }

  toNitro(): GroupNitro {
    return this._nitroGroup;
  }

  get nitro(): GroupNitro {
    return this._nitroGroup;
  }
}
