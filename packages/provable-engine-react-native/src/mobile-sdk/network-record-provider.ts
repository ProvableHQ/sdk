import type { Int64 } from "react-native-nitro-modules";
import type { Account } from "./account";
import type { EncryptedRecord } from "./models/record-provider/encryptedRecord";
import type { OwnedRecord } from "./models/record-provider/ownedRecord";
import type { RecordSearchParams } from "./models/record-provider/recordSearchParams";
import type { RecordsResponseFilter } from "./models/record-scanner/recordsResponseFilter";
import type { AleoNetworkClient } from "./network-client";
import { parseRecordCiphertext } from "./utilities";
import { logAndThrow, retryWithBackoff } from "./utils";
import { RecordCiphertext } from "./wasm";

export interface NetworkRecordProviderOptions {
  account: Account;
  networkClient: AleoNetworkClient;
}

export interface RecordProvider {
  account?: Account;
  encryptedRecords(
    recordsFilter: RecordSearchParams,
    responseFilter?: RecordsResponseFilter
  ): Promise<EncryptedRecord[]>;
  checkSerialNumbers(serialNumbers: string[]): Promise<Record<string, boolean>>;
  findCreditsRecord(
    microcredits: Int64,
    searchParameters: RecordSearchParams
  ): Promise<OwnedRecord>;
  findCreditsRecords(
    microcreditAmounts: Int64[],
    searchParameters: RecordSearchParams
  ): Promise<OwnedRecord[]>;
  findRecord(searchParameters: RecordSearchParams): Promise<OwnedRecord>;
  findRecords(searchParameters: RecordSearchParams): Promise<OwnedRecord[]>;
}

export class NetworkRecordProvider implements RecordProvider {
  account: Account;
  networkClient: AleoNetworkClient;

  constructor(options: NetworkRecordProviderOptions) {
    this.account = options.account;
    this.networkClient = options.networkClient;
    this.networkClient.setAccount(this.account);
  }

  setAccount(account: Account): void {
    this.account = account;
    this.networkClient.setAccount(account);
  }

  setNetworkClient(networkClient: AleoNetworkClient): void {
    this.networkClient = networkClient;
    this.networkClient.setAccount(this.account);
  }

  getAccount(): Account {
    return this.account;
  }

  getNetworkClient(): AleoNetworkClient {
    return this.networkClient;
  }

  async findCreditsRecords(
    microcredits: Int64[],
    searchParameters: RecordSearchParams
  ): Promise<OwnedRecord[]> {
    let startHeight = 0;
    let endHeight = 0;
    let maxAmount: Int64 | undefined;
    let amounts = microcredits;

    if (searchParameters) {
      if ("startHeight" in searchParameters && typeof searchParameters.startHeight === "number") {
        startHeight = searchParameters.startHeight;
      }

      if ("endHeight" in searchParameters && typeof searchParameters.endHeight === "number") {
        endHeight = searchParameters.endHeight;
      }

      if (
        "amounts" in searchParameters &&
        Array.isArray(searchParameters.amounts) &&
        searchParameters.amounts.every((item: unknown) => typeof item === "bigint")
      ) {
        amounts = searchParameters.amounts as Int64[];
      }

      if ("maxAmount" in searchParameters && typeof searchParameters.maxAmount === "bigint") {
        maxAmount = searchParameters.maxAmount as Int64;
      }
    }

    if (endHeight === 0) {
      endHeight = await this.networkClient.getLatestHeight();
    }

    if (startHeight >= endHeight) {
      logAndThrow("Start height must be less than end height");
    }

    const records = await this.networkClient.findRecords(
      startHeight,
      endHeight,
      searchParameters?.unspent ?? false,
      ["credits.aleo"],
      amounts,
      maxAmount,
      searchParameters?.nonces
    );

    return records.map((record) => {
      const plaintext = record.toString();
      const parsed = parseRecordCiphertext(plaintext);
      return {
        owner: parsed.owner,
        program_name: "credits.aleo",
        record_name: "credits",
        record_plaintext: plaintext,
      } as OwnedRecord;
    });
  }

  async findCreditsRecord(
    microcredits: Int64,
    searchParameters: RecordSearchParams
  ): Promise<OwnedRecord> {
    const records = await this.findCreditsRecords([microcredits], searchParameters);
    if (records.length > 0) {
      return records[0] as OwnedRecord;
    }

    throw new Error("Record not found");
  }

  async findRecord(searchParameters: RecordSearchParams): Promise<OwnedRecord> {
    const records = await this.findRecords(searchParameters);
    if (records.length > 0) {
      return records[0] as OwnedRecord;
    }

    throw new Error("Record not found");
  }

  async findRecords(searchParameters: RecordSearchParams): Promise<OwnedRecord[]> {
    let startHeight = 0;
    let endHeight = 0;
    let amounts: Int64[] | undefined;
    let maxAmount: Int64 | undefined;
    let programs: string[] | undefined;

    if (searchParameters) {
      if ("startHeight" in searchParameters && typeof searchParameters.startHeight === "number") {
        startHeight = searchParameters.startHeight;
      }

      if ("endHeight" in searchParameters && typeof searchParameters.endHeight === "number") {
        endHeight = searchParameters.endHeight;
      }

      if (
        "amounts" in searchParameters &&
        Array.isArray(searchParameters.amounts) &&
        searchParameters.amounts.every((item: unknown) => typeof item === "bigint")
      ) {
        amounts = searchParameters.amounts as Int64[];
      }

      if ("maxAmount" in searchParameters && typeof searchParameters.maxAmount === "bigint") {
        maxAmount = searchParameters.maxAmount as Int64;
      }

      if ("program" in searchParameters && typeof searchParameters.program === "string") {
        programs = [searchParameters.program];
      }

      if (
        "programs" in searchParameters &&
        Array.isArray(searchParameters.programs) &&
        searchParameters.programs.every((item: unknown) => typeof item === "string")
      ) {
        programs = searchParameters.programs as string[];
      }
    }

    if (endHeight === 0) {
      endHeight = await this.networkClient.getLatestHeight();
    }

    if (startHeight >= endHeight) {
      logAndThrow("Start height must be less than end height");
    }

    const records = await this.networkClient.findRecords(
      startHeight,
      endHeight,
      searchParameters?.unspent ?? false,
      programs,
      amounts,
      maxAmount,
      searchParameters?.nonces
    );

    return records.map((record) => {
      const plaintext = record.toString();
      return {
        record_plaintext: plaintext,
      } as OwnedRecord;
    });
  }

  async encryptedRecords(
    recordsFilter: RecordSearchParams,
    responseFilter?: RecordsResponseFilter
  ): Promise<EncryptedRecord[]> {
    let startHeight = 0;
    let endHeight = 0;
    let programs: string[] | undefined;

    if (recordsFilter) {
      if ("startHeight" in recordsFilter && typeof recordsFilter.startHeight === "number") {
        startHeight = recordsFilter.startHeight;
      }

      if ("endHeight" in recordsFilter && typeof recordsFilter.endHeight === "number") {
        endHeight = recordsFilter.endHeight;
      }

      if ("program" in recordsFilter && typeof recordsFilter.program === "string") {
        programs = [recordsFilter.program];
      }

      if (
        "programs" in recordsFilter &&
        Array.isArray(recordsFilter.programs) &&
        recordsFilter.programs.every((item: unknown) => typeof item === "string")
      ) {
        programs = recordsFilter.programs as string[];
      }
    }

    if (endHeight === 0) {
      endHeight = await this.networkClient.getLatestHeight();
    }

    if (startHeight >= endHeight) {
      logAndThrow("Start height must be less than end height");
    }

    const privateKey = this.account.privateKey();
    const viewKeyString = privateKey.toViewKey().toString();
    const privateKeyString = privateKey.toString();
    const nonces = recordsFilter?.nonces ?? [];
    const results: EncryptedRecord[] = [];
    let failures = 0;
    let end = endHeight;

    while (end > startHeight) {
      let start = end - 50;
      if (start < startHeight) {
        start = startHeight;
      }

      try {
        const blocks = await this.networkClient.getBlockRange(start, end);
        end = start;

        for (const block of blocks) {
          const blockHeight = Number(block.header.metadata.height);
          const blockTimestamp = Number(block.header.metadata.timestamp);
          const transactions = block.transactions;

          if (!transactions) {
            continue;
          }

          for (let txIdx = 0; txIdx < transactions.length; txIdx++) {
            const confirmedTx = transactions[txIdx];
            if (confirmedTx?.type !== "execute") {
              continue;
            }

            const transaction = confirmedTx.transaction;
            const transitions = transaction.execution?.transitions;
            if (!transitions) {
              continue;
            }

            for (let trIdx = 0; trIdx < transitions.length; trIdx++) {
              const transition = transitions[trIdx];
              if (!transition?.outputs) {
                continue;
              }

              if (programs && transition.program && !programs.includes(transition.program)) {
                continue;
              }

              const programName = transition.program;
              const functionName = transition.function;

              for (let outIdx = 0; outIdx < transition.outputs.length; outIdx++) {
                const output = transition.outputs[outIdx];
                if (output?.type !== "record") {
                  continue;
                }

                try {
                  const record = RecordCiphertext.fromString(output.value);
                  if (!record.isOwner(viewKeyString)) {
                    continue;
                  }

                  const recordPlaintext = record.decrypt(viewKeyString);
                  const nonce = recordPlaintext.nonce();
                  if (nonces.includes(nonce)) {
                    continue;
                  }

                  // If unspent filtering is requested, attempt to check spend status
                  if (recordsFilter?.unspent) {
                    try {
                      const recordViewKeyField = recordPlaintext
                        .recordViewKey(viewKeyString)
                        .toString();
                      // Record name is needed for serial number derivation but isn't
                      // available in transition outputs. We approximate it from the program
                      // name prefix (e.g. "credits" from "credits.aleo"). This is correct
                      // for single-record programs; for multi-record programs the guess may
                      // be wrong, producing an incorrect serial number → no transition match
                      // → the record is conservatively kept as "unspent".
                      const recordName = programName?.split(".")[0] ?? "";
                      const serialNumber = recordPlaintext.serialNumberString(
                        privateKeyString,
                        programName ?? "",
                        recordName,
                        recordViewKeyField
                      );
                      // If serial number derivation succeeded, check if it's spent
                      try {
                        await retryWithBackoff(() =>
                          this.networkClient.getTransitionId(serialNumber)
                        );
                        // Transition found, but record is spent; skip it
                        continue;
                      } catch (spentError) {
                        // Distinguish 404 from transport/server errors.
                        // A 404 means no transition consumed this serial number, so record is unspent.
                        // Any other error means the check is inconclusive; conservatively keep the
                        // record but log a warning so the caller is aware.
                        const msg =
                          spentError instanceof Error ? spentError.message : String(spentError);
                        if (!msg.includes("404")) {
                          console.warn(
                            "Spent check failed with non-404 error, including record as potentially unspent:",
                            msg
                          );
                        }
                        // Record is unspent (404) or status unknown (other error) — keep it
                      }
                    } catch (_serialError) {}
                  }

                  const parsed = parseRecordCiphertext(recordPlaintext.toString());

                  const encryptedRecord: EncryptedRecord = {
                    commitment: output.id,
                  };

                  if (!responseFilter || responseFilter.checksum) {
                    encryptedRecord.checksum = output.checksum;
                  }
                  if (!responseFilter || responseFilter.blockHeight) {
                    encryptedRecord.block_height = blockHeight;
                    encryptedRecord.block_timestamp = blockTimestamp;
                  }
                  if (!responseFilter || responseFilter.program_name) {
                    encryptedRecord.program_name = programName;
                  }
                  if (!responseFilter || responseFilter.function_name) {
                    encryptedRecord.function_name = functionName;
                  }
                  if (!responseFilter || responseFilter.output_index) {
                    encryptedRecord.output_index = outIdx;
                  }
                  if (!responseFilter || responseFilter.owner) {
                    encryptedRecord.owner = parsed.owner;
                  }
                  if (!responseFilter || responseFilter.record_ciphertext) {
                    encryptedRecord.record_ciphertext = output.value;
                  }
                  if (!responseFilter || responseFilter.record_name) {
                    // Best-effort: use the program prefix as record name (e.g. "credits" from "credits.aleo").
                    // This is only accurate for single-record-type programs; the actual record type name
                    // is defined in the program source and can't be reliably determined without fetching it.
                    encryptedRecord.record_name = programName?.split(".")[0];
                  }
                  if (!responseFilter || responseFilter.nonce) {
                    encryptedRecord.record_nonce = nonce;
                  }
                  if (!responseFilter || responseFilter.transaction_id) {
                    encryptedRecord.transaction_id = transaction.id;
                  }
                  if (!responseFilter || responseFilter.transition_id) {
                    encryptedRecord.transition_id = transition.id;
                  }
                  if (!responseFilter || responseFilter.transaction_index) {
                    encryptedRecord.transaction_index = txIdx;
                  }
                  if (!responseFilter || responseFilter.transition_index) {
                    encryptedRecord.transition_index = trIdx;
                  }

                  results.push(encryptedRecord);
                } catch (_error) {
                  // Skip records that can't be parsed or decrypted
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Error fetching blocks in range: ${start}-${end}`);
        console.warn("Error: ", error);
        failures += 1;
        if (failures > 10) {
          console.warn("10 failures fetching records reached. Returning records fetched so far");
          return results;
        }
      }
    }

    return results;
  }

  async checkSerialNumbers(serialNumbers: string[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};

    const checks = serialNumbers.map(async (serialNumber) => {
      try {
        await retryWithBackoff(() => this.networkClient.getTransitionId(serialNumber));
        result[serialNumber] = true;
      } catch (_error) {
        result[serialNumber] = false;
      }
    });

    await Promise.all(checks);
    return result;
  }
}

export class BlockHeightSearch implements RecordSearchParams {
  startHeight: number;
  endHeight: number;
  unspent: boolean;

  constructor(startHeight: number, endHeight: number, unspent?: boolean) {
    this.startHeight = startHeight;
    this.endHeight = endHeight;
    this.unspent = !!unspent;
  }
}
