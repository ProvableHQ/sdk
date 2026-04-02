import { Address } from "./address";
import { getNitroClassNetworkAware } from "./current-network";
import { Field } from "./field";
import { Group } from "./group";
import { Plaintext } from "./plaintext";
import { PrivateKey } from "./private-key";
import { Program } from "./program";
import { ProvingRequest } from "./proving-request";
import type {
  Account as AccountNitro,
  RecordCiphertext as RecordCiphertextNitro,
  RecordPlaintext as RecordPlaintextNitro,
  ViewKey as ViewKeyNitro,
} from "./specs/account.nitro";
import type { ProgramManager as ProgramManagerNitro } from "./specs/program-manager.nitro";
import { Transaction } from "./transaction";
import { parseNativeAmount, parseRecordCiphertext } from "./utilities";
import { ViewKey } from "./view-key";

const createAccountHybrid = (): AccountNitro => getNitroClassNetworkAware<AccountNitro>("Account");
const createProgramManagerHybrid = (): ProgramManagerNitro =>
  getNitroClassNetworkAware<ProgramManagerNitro>("ProgramManager");

function resolveViewKey(viewKey: ViewKey | string): ViewKey {
  if (viewKey instanceof ViewKey) {
    return viewKey;
  }
  return ViewKey.fromString(viewKey);
}

export class RecordCiphertext {
  private readonly _nitroRecord: RecordCiphertextNitro;

  private constructor(nitroRecord: RecordCiphertextNitro) {
    this._nitroRecord = nitroRecord;
  }

  static fromString(ciphertext: string): RecordCiphertext {
    const nitroAccount = createAccountHybrid();
    const nitroRecord = nitroAccount.recordCiphertextFromString(ciphertext);
    return new RecordCiphertext(nitroRecord);
  }

  toString(): string {
    return this._nitroRecord.asString();
  }

  isOwner(viewKey: ViewKey | string): boolean {
    const resolvedViewKey = resolveViewKey(viewKey);
    return this._nitroRecord.isOwner(resolvedViewKey.nitro);
  }

  decrypt(viewKey: ViewKey | string): RecordPlaintext {
    const resolvedViewKey = resolveViewKey(viewKey);
    const plaintextNitro = resolvedViewKey.decrypt(this.toString());
    return new RecordPlaintext(plaintextNitro, this, resolvedViewKey.nitro);
  }

  get nitro(): RecordCiphertextNitro {
    return this._nitroRecord;
  }
}

export class RecordPlaintext {
  private readonly _nitroPlaintext: RecordPlaintextNitro;
  private readonly _ciphertext?: RecordCiphertext;
  private readonly _viewKey?: ViewKeyNitro;

  constructor(
    nitroPlaintext: RecordPlaintextNitro,
    ciphertext?: RecordCiphertext,
    viewKey?: ViewKeyNitro
  ) {
    this._nitroPlaintext = nitroPlaintext;
    this._ciphertext = ciphertext;
    this._viewKey = viewKey;
  }

  static fromString(plaintext: string): RecordPlaintext {
    const nitroAccount = createAccountHybrid();
    const nitroPlainText = nitroAccount.recordPlaintextFromString(plaintext);
    return new RecordPlaintext(nitroPlainText);
  }

  toString(): string {
    return this._nitroPlaintext.asString();
  }

  nonce(): string {
    const parsed = parseRecordCiphertext(this.toString());
    return parsed.nonce;
  }

  recordViewKey(viewKey?: ViewKey | string): Field {
    const nitroAccount = createAccountHybrid();
    const resolved = viewKey != null ? resolveViewKey(viewKey).nitro : this._viewKey;
    if (!resolved || !this._ciphertext) {
      throw new Error(
        "recordViewKey requires ciphertext and view key context; obtain a RecordPlaintext instance via RecordCiphertext.decrypt(viewKey) instead."
      );
    }
    const nitroField = nitroAccount.generateRecordViewKey(resolved, this._ciphertext.nitro);
    return Field.fromNitro(nitroField);
  }

  microcredits(): bigint {
    const amountString = parseNativeAmount(this.toString());
    const digits = amountString.replace(/[^0-9]/g, "");
    if (!digits) {
      return BigInt(0);
    }
    return BigInt(digits);
  }

  serialNumberString(
    privateKey: PrivateKey | string,
    programId: string,
    recordName: string,
    recordViewKey: string
  ): string {
    const resolvedKey =
      privateKey instanceof PrivateKey ? privateKey : PrivateKey.fromString(privateKey);
    const nitroProgramManager = createProgramManagerHybrid();
    return nitroProgramManager.recordPlaintextToSerialNumber(
      this.toString(),
      resolvedKey.nitro,
      programId,
      recordName,
      recordViewKey
    );
  }

  /**
   * Get the record entry matching a key.
   *
   * @param {string} input The key to retrieve the value in the record data field.
   *
   * @returns {Plaintext} The plaintext value corresponding to the key.
   */
  getMember(input: string): Plaintext {
    const nitroPlaintext = this._nitroPlaintext.getMember(input);
    return new Plaintext(nitroPlaintext);
  }
}

export { Address, Plaintext, Program, ProvingRequest, PrivateKey, Transaction, Field, Group };
