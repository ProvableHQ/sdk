import type { HybridObject } from "react-native-nitro-modules";

type NetworkName = "mainnet" | "testnet";

// Crypto bridge interface - handles cryptographic operations including hash functions and key generation
export interface Network extends HybridObject<{ ios: "c++"; android: "c++" }> {
  getNetwork(): NetworkName;
  setNetwork(network: NetworkName): void;
}
