import type { HybridObject } from "react-native-nitro-modules";

export interface Program extends HybridObject<{ ios: "c++"; android: "c++" }> {
  fromString(source: string): Program;
  clone(): Program;

  hasFunction(functionName: string): boolean;
  getFunctions(): string[];
  getFunctionInputs(functionName: string): string;
  getMappings(): string;
  getRecordMembers(recordName: string): string;
  getStructMembers(structName: string): string;
  getImports(): string[];
  id(): string;
  address(): string;
  isEqual(other: Program): boolean;
  getCreditsProgram(): void;
}
