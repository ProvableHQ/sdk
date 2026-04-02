import type { Int64 } from "react-native-nitro-modules";
import { Account } from "./account";
import { getNitroClassNetworkAware } from "./current-network";
import { Field } from "./field";
import { Program } from "./program";
import type { RecordCiphertext, RecordPlaintext, ViewKey } from "./specs/account.nitro";
import type { Program as ProgramNitro } from "./specs/program.nitro";
import type {
  Transaction as TransactionNitro,
  TransactionVerifyingKey,
} from "./specs/transaction.nitro";

export interface TransactionRecord {
  commitment: Field;
  record: RecordCiphertext;
}

const createFactory = (): TransactionNitro =>
  getNitroClassNetworkAware<TransactionNitro>("Transaction");

const asArrayBuffer = (bytes: ArrayBuffer | Uint8Array): ArrayBuffer => {
  if (bytes instanceof Uint8Array) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  }
  return bytes;
};

export class Transaction {
  private readonly _nitroTransaction: TransactionNitro;

  constructor(transaction: TransactionNitro) {
    this._nitroTransaction = transaction;
  }

  static fromString(transaction: string): Transaction {
    const nitroTransaction = createFactory().fromString(transaction);
    return new Transaction(nitroTransaction);
  }

  static fromBytes(bytes: ArrayBuffer | Uint8Array): Transaction {
    const nitroTransaction = createFactory();
    nitroTransaction.fromBytesLe(asArrayBuffer(bytes));
    return new Transaction(nitroTransaction);
  }

  clone(): Transaction {
    return new Transaction(this._nitroTransaction.clone());
  }

  toString(): string {
    return this._nitroTransaction.toString();
  }

  toBytesLe(): Uint8Array {
    return new Uint8Array(this._nitroTransaction.toBytesLe());
  }

  containsSerialNumber(serialNumber: string | Field): boolean {
    const serialField =
      typeof serialNumber === "string" ? Field.fromString(serialNumber) : serialNumber;
    return this._nitroTransaction.containsSerialNumber(serialField.toNitro());
  }

  containsCommitment(commitment: string | Field): boolean {
    const commitmentField =
      typeof commitment === "string" ? Field.fromString(commitment) : commitment;
    return this._nitroTransaction.containsCommitment(commitmentField.toNitro());
  }

  findRecord(commitment: string | Field): RecordCiphertext | undefined {
    const commitmentField =
      typeof commitment === "string" ? Field.fromString(commitment) : commitment;
    const result = this._nitroTransaction.findRecord(commitmentField.toNitro());
    return result ?? undefined;
  }

  baseFeeAmount(): Int64 {
    return this._nitroTransaction.baseFeeAmount();
  }

  feeAmount(): Int64 {
    return this._nitroTransaction.feeAmount();
  }

  priorityFeeAmount(): Int64 {
    return this._nitroTransaction.priorityFeeAmount();
  }

  isDeploy(): boolean {
    return this._nitroTransaction.isDeploy();
  }

  isExecute(): boolean {
    return this._nitroTransaction.isExecute();
  }

  isFee(): boolean {
    return this._nitroTransaction.isFee();
  }

  deployedProgram(): Program | undefined {
    const program: ProgramNitro | undefined = this._nitroTransaction.deployedProgram();
    return program ? new Program(program) : undefined;
  }

  execution(): unknown {
    const summary = this.summary(true) as Record<string, unknown> | undefined;
    return summary?.execution;
  }

  ownedRecords(viewKey: ViewKey | string): RecordPlaintext[] {
    const nitroViewKey = typeof viewKey === "string" ? Account.viewKeyFromString(viewKey) : viewKey;
    return this._nitroTransaction.ownedRecords(nitroViewKey);
  }

  records(): TransactionRecord[] {
    return this._nitroTransaction.records().map((record) => ({
      ...record,
      commitment: Field.fromNitro(record.commitment),
    }));
  }

  summary(convertToJs = true): unknown {
    const summaryJson = this._nitroTransaction.summary();
    if (!convertToJs) {
      return summaryJson;
    }

    try {
      return JSON.parse(summaryJson) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`Failed to parse transaction summary: ${error}`);
    }
  }

  id(): string {
    return this._nitroTransaction.id();
  }

  transactionType(): string {
    return this._nitroTransaction.transactionType();
  }

  transitions(): string[] {
    return this._nitroTransaction.transitions();
  }

  verifyingKeys(): TransactionVerifyingKey[] {
    return this._nitroTransaction.verifyingKeys();
  }

  get nitro(): TransactionNitro {
    return this._nitroTransaction;
  }
}
