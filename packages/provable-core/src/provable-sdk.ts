import type { EngineCapabilities, ProvableEngine, ProvableKitEnv } from "./contracts.js";

export interface ProvableInitOptions {
  engine: ProvableEngine;
  env: ProvableKitEnv;
}

export class ProvableKit {
  private static activeEngine: ProvableEngine | undefined;
  private static capabilities: EngineCapabilities | undefined;
  private static env: ProvableKitEnv | undefined;

  static async init(options: ProvableInitOptions): Promise<EngineCapabilities> {
    const capabilities = await options.engine.init({ env: options.env });
    this.activeEngine = options.engine;
    this.env = options.env;
    this.capabilities = capabilities;
    return capabilities;
  }

  static getEngine(): ProvableEngine {
    if (!this.activeEngine) {
      throw new Error("ProvableKit has not been initialized");
    }
    return this.activeEngine;
  }

  static getEnv(): ProvableKitEnv {
    if (!this.env) {
      throw new Error("ProvableKit has not been initialized");
    }
    return this.env;
  }

  static getCapabilities(): EngineCapabilities {
    if (!this.capabilities) {
      throw new Error("ProvableKit has not been initialized");
    }
    return this.capabilities;
  }
}

/**
 * Backward alias retained temporarily while repo consumers migrate.
 */
export const ProvableSDK = ProvableKit;
