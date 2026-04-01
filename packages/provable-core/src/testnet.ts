export * from "@provablehq/sdk/testnet.js";

export class DynamicRecord {
  private readonly inner: unknown;

  private constructor(inner: unknown) {
    this.inner = inner;
  }

  static fromRecord(record: unknown): DynamicRecord {
    return new DynamicRecord(record);
  }

  static fromString(record: string): DynamicRecord {
    return new DynamicRecord(record);
  }

  owner(): unknown {
    return (this.inner as { owner?: () => unknown })?.owner?.();
  }

  toString(): string {
    return (this.inner as { toString?: () => string })?.toString?.() ?? "";
  }
}
