import type { HybridObject, Int64 } from "react-native-nitro-modules";
import type { RecordCiphertext, RecordPlaintext, ViewKey } from "./account.nitro";
import type { Field, Field as FieldNitro } from "./field.nitro";
import type { Program } from "./program.nitro";

export interface TransactionRecord {
  commitment: Field;
  record: RecordCiphertext;
}

export interface TransactionVerifyingKey {
  program: string;
  function: string;
  verifyingKey: string;
  certificate: string;
}

export interface Transaction extends HybridObject<{ ios: "c++"; android: "c++" }> {
  fromString(transaction: string): Transaction;
  fromBytesLe(bytes: ArrayBuffer): void;
  clone(): Transaction;

  toBytesLe(): ArrayBuffer;
  containsSerialNumber(serialNumber: FieldNitro): boolean;
  containsCommitment(commitment: FieldNitro): boolean;
  findRecord(commitment: FieldNitro): RecordCiphertext | undefined;
  baseFeeAmount(): Int64;
  feeAmount(): Int64;
  priorityFeeAmount(): Int64;
  isDeploy(): boolean;
  isExecute(): boolean;
  isFee(): boolean;
  deployedProgram(): Program | undefined;
  ownedRecords(viewKey: ViewKey): RecordPlaintext[];
  records(): TransactionRecord[];
  summary(): string;
  id(): string;
  transactionType(): string;
  transitions(): string[];
  verifyingKeys(): TransactionVerifyingKey[];
}
