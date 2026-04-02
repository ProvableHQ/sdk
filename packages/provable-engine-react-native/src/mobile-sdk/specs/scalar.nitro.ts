import type { HybridObject } from "react-native-nitro-modules";

export interface Scalar extends HybridObject<{ ios: "c++"; android: "c++" }> {
  fromString(value: string): Scalar;
  clone(): Scalar;
}
