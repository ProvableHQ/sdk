import { NitroModules } from "react-native-nitro-modules";
import { Address } from "./address";
import { getNitroClassNetworkAware } from "./current-network";
import type { Program as ProgramNitro } from "./specs/program.nitro";

const createFactory = (): ProgramNitro => getNitroClassNetworkAware<ProgramNitro>("Program");

export class Program {
  private readonly _nitroProgram: ProgramNitro;

  constructor(nitroProgram: ProgramNitro) {
    this._nitroProgram = nitroProgram;
  }

  static fromString(source: string): Program {
    const nitro = createFactory().fromString(source);
    return new Program(nitro);
  }

  static getCreditsProgram(): Program {
    const program = createFactory();
    program.getCreditsProgram();
    return new Program(program);
  }

  clone(): Program {
    return new Program(this._nitroProgram.clone());
  }

  toString(): string {
    return this._nitroProgram.toString();
  }

  hasFunction(functionName: string): boolean {
    return this._nitroProgram.hasFunction(functionName);
  }

  getFunctions(): string[] {
    return this._nitroProgram.getFunctions();
  }

  getFunctionInputs(functionName: string): unknown {
    return JSON.parse(this._nitroProgram.getFunctionInputs(functionName));
  }

  getMappings(): unknown {
    return JSON.parse(this._nitroProgram.getMappings());
  }

  getRecordMembers(recordName: string): unknown {
    return JSON.parse(this._nitroProgram.getRecordMembers(recordName));
  }

  getStructMembers(structName: string): unknown {
    return JSON.parse(this._nitroProgram.getStructMembers(structName));
  }

  getImports(): string[] {
    return this._nitroProgram.getImports();
  }

  id(): string {
    return this._nitroProgram.id();
  }

  address(): Address {
    const addressString = this._nitroProgram.address();
    return Address.fromString(addressString);
  }

  isEqual(other: Program): boolean {
    return this._nitroProgram.isEqual(other._nitroProgram);
  }

  get nitro(): ProgramNitro {
    return this._nitroProgram;
  }
}
