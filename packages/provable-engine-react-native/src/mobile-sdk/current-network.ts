import { NitroModules } from "react-native-nitro-modules";

import type { HybridObject } from ".";
import type { Network } from "./specs/Network.nitro";

const DEFAULT_NETWORK = "mainnet";

// Helper to get the C++ Network object
function getNetworkObject(): Network {
  return getNitroClassNetworkAware<Network>("Network");
}

export type NetworkName = "mainnet" | "testnet" | (string & {});

class CurrentNetworkClass {
  private network: NetworkName = DEFAULT_NETWORK;

  constructor() {
    try {
      const nativeNetwork = DEFAULT_NETWORK;
      if (nativeNetwork) {
        this.network = nativeNetwork;
      }
    } catch {
      // Native network defaults to mainnet; ignore any initialization errors.
      this.network = DEFAULT_NETWORK;
    }
  }

  get(): NetworkName {
    return this.network;
  }

  set(network: NetworkName): void {
    if (typeof network !== "string" || network.length === 0) {
      throw new Error("Network must be a non-empty string");
    }

    // Normalize network string and ensure it's a supported value.
    const normalized = network.trim().toLowerCase() as NetworkName;
    if (normalized !== "mainnet" && normalized !== "testnet") {
      throw new Error(`Unsupported network '${network}'. Expected 'mainnet' or 'testnet'.`);
    }

    this.network = normalized;

    // Also update the C++ Network state so it's synchronized
    try {
      const networkObj = getNetworkObject();
      const cxxNetwork = normalized === "mainnet" ? "mainnet" : "testnet";
      networkObj.setNetwork(cxxNetwork as "mainnet" | "testnet");
    } catch (error) {
      // Log but don't fail if C++ network update fails
      console.warn("Failed to update C++ network state:", error);
    }
  }

  reset(): void {
    this.network = DEFAULT_NETWORK;
  }
}

const CurrentNetwork = new CurrentNetworkClass();

export const applyNetworkToHost = (baseHost: string): string => {
  const sanitized = baseHost.replace(/\/+$/, "");
  const network = CurrentNetwork.get();
  if (sanitized.endsWith(`/${network}`)) {
    return sanitized;
  }

  const withoutKnownNetwork = sanitized.replace(/\/(mainnet|testnet)$/, "");
  if (withoutKnownNetwork !== sanitized) {
    return `${withoutKnownNetwork}/${network}`;
  }

  return `${sanitized}/${network}`;
};

export const getNetwork = (): NetworkName => CurrentNetwork.get();
export const setNetwork = (network: NetworkName): void => CurrentNetwork.set(network);
export const resetNetwork = (): void => CurrentNetwork.reset();

// replacement for NitroModules.createHybridObject<AccountNitro>("Account");
// change first letter to uppercase
// if mainnet then leave network empty
export const getNitroClassNetworkAware = <T extends HybridObject<{}>>(className: string): T => {
  const network = CurrentNetwork.get();
  const capitalizedNetwork = network.charAt(0).toUpperCase() + network.slice(1);
  if (network === "mainnet") {
    return NitroModules.createHybridObject<T>(`${className}`);
  }
  return NitroModules.createHybridObject<T>(`${className}${capitalizedNetwork}`);
};

export { CurrentNetwork };
