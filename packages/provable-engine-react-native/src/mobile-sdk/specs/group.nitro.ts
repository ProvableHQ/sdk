import type { HybridObject } from "react-native-nitro-modules";

export interface Group extends HybridObject<{ ios: "c++"; android: "c++" }> {
  fromString(value: string): Group;
  clone(): Group;
}
