import type { HybridObject } from "react-native-nitro-modules";

export interface Field extends HybridObject<{ ios: "c++"; android: "c++" }> {
  fromString(value: string): Field;
  asString(): string;
  clone(): Field;
  toBitsLe(): ArrayBuffer;
  multiply(rhs: Field): Field;
  one(): Field;
  newDomainSeparator(domain: string): Field;
}
