import type { EngineCapabilities, ProvableEngine, ProvableSdkEnv } from "./contracts.js";

export interface ProvableInitOptions {
  engine: ProvableEngine;
  env: ProvableSdkEnv;
}

export class ProvableSDK {
  private static activeEngine: ProvableEngine | undefined;
  private static capabilities: EngineCapabilities | undefined;
  private static env: ProvableSdkEnv | undefined;

  static async init(options: ProvableInitOptions): Promise<EngineCapabilities> {
    const capabilities = await options.engine.init({ env: options.env });
    this.activeEngine = options.engine;
    this.env = options.env;
    this.capabilities = capabilities;
    return capabilities;
  }

  static getEngine(): ProvableEngine {
    if (!this.activeEngine) {
      throw new Error("ProvableSDK has not been initialized");
    }
    return this.activeEngine;
  }

  static getEnv(): ProvableSdkEnv {
    if (!this.env) {
      throw new Error("ProvableSDK has not been initialized");
    }
    return this.env;
  }

  static getCapabilities(): EngineCapabilities {
    if (!this.capabilities) {
      throw new Error("ProvableSDK has not been initialized");
    }
    return this.capabilities;
  }
}
