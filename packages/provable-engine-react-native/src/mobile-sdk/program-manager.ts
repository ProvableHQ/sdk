import type { Int64 } from "react-native-nitro-modules";
import { Account } from "./account";
import type { Address } from "./address";
import {
  AleoKeyProvider,
  type FunctionKeyPair,
  type FunctionKeyProvider,
} from "./aleo-key-provider";
import type { KeySearchParams } from "./aleo-key-provider-params";
import { Authorization } from "./authorization";
import { getNitroClassNetworkAware } from "./current-network";
import type { RecordSearchParams } from "./models/record-provider/recordSearchParams";
import { AleoNetworkClient, type ProgramImports } from "./network-client";
import type { RecordProvider } from "./network-record-provider";
import { OfflineQuery } from "./offline-query";
import type { PrivateKey } from "./private-key";
import { Program } from "./program";
import type { ProvingKey } from "./proving-key";
import { ProvingRequest } from "./proving-request";
import type {
  PrivateKey as PrivateKeyNitro,
  RecordPlaintext,
} from "./specs/account.nitro";
import type { Program as ProgramNitro } from "./specs/program.nitro";
import type { ProgramManager as ProgramManagerNitro } from "./specs/program-manager.nitro";
import { Transaction } from "./transaction";
import { logAndThrow, validateProgramName } from "./utils";
import type { VerifyingKey } from "./verifying-key";

/**
 * Fee estimate options.
 *
 * @property {string} programName - The name of the program containing the function to estimate the fee for.
 * @property {string} functionName - The name of the function to execute within the program to estimate the fee for.
 * @property {string} [program] - Program source code to use for the fee estimate.
 * @property {ProgramImports} [imports] - Programs that the program imports.
 * @property {number} [edition] - Edition of the program to estimate the fee for.
 * @property {Authorization} authorization - An authorization to estimate the fee for.
 */
interface FeeEstimateOptions {
  programName: string;
  functionName?: string;
  program?: string | Program;
  imports?: ProgramImports;
  edition?: number;
  authorization?: Authorization;
}

/**
 * Options for building an Authorization for a function.
 */
export interface AuthorizationOptions {
  /** Name of the program containing the function to build the authorization for */
  programName: string;
  /** Name of the function name to build the authorization for */
  functionName: string;
  /** The inputs to the function */
  inputs: string[];
  /** The optional source code for the program to build an execution for */
  programSource?: string;
  /** Optional private key to use to build the authorization */
  privateKey?: PrivateKey;
  /** The other programs the program imports */
  programImports?: Record<string, string>;
  /** Edition of the program (optional) */
  edition?: number;
}

/**
 * Options for executing a fee authorization.
 */
export interface FeeAuthorizationOptions {
  /** The id of a previously built Execution or Authorization */
  deploymentOrExecutionId: string;
  /** The number of Aleo Credits to pay for the base fee */
  baseFeeCredits: Int64;
  /** The number of Aleo Credits to pay for the priority fee */
  priorityFeeCredits: Int64;
  /** Optional private key to use for the fee authorization */
  privateKey?: PrivateKey;
  /** Optional fee record to use for the transaction */
  feeRecord?: string;
}

/**
 * Options for building an execution transaction.
 */
export interface ExecuteOptions {
  /** The name of the program containing the function to be executed */
  programName: string;
  /** The name of the function to execute within the program */
  functionName: string;
  /** The priority fee to be paid for the transaction */
  priorityFee: Int64;
  /** If true, uses a private record to pay the fee; otherwise, uses the account's public credit balance */
  privateFee: boolean;
  /** The inputs to the function being executed */
  inputs: string[];
  /** Optional fee record to use for the transaction */
  feeRecord?: string | RecordPlaintext;
  /** Optional private key to use for the transaction */
  privateKey?: PrivateKey;
  /** Optional program source code to use for the transaction */
  program?: string | Program;
  /** Optional programs that the program being executed imports */
  imports?: ProgramImports;
  /** Edition of the program (optional) */
  edition?: number;
  /** Optional record search parameters to use for the transaction */
  recordSearchParams?: RecordSearchParams;
  /** Optional key search parameters to use for the transaction */
  keySearchParams?: KeySearchParams;
  /** Optional fee record to use for the transaction */
  provingKey?: ProvingKey;
  /** Optional verifying key to use for the transaction */
  verifyingKey?: VerifyingKey;
  /** Optional offline query to use for the transaction */
  offlineQuery?: OfflineQuery;
}

/**
 * Options for creating a ProgramManager instance.
 */
export interface ProgramManagerOptions {
  /** Host URI for the Aleo API */
  host?: string;
  /** Account to use for transaction building */
  account?: Account;
  /** Record provider to use for the program manager */
  recordProvider?: RecordProvider;
  /** Network client to use for the program manager */
  keyProvider?: FunctionKeyProvider;
}

/**
 * Represents the options for executing a transaction in the Aleo network.
 * This interface is used to specify the parameters required for building and submitting an execution transaction.
 *
 * @property {string} programName - The name of the program containing the function to be executed.
 * @property {string} functionName - The name of the function to execute within the program.
 * @property {Int64} [baseFee] - The base fee to be paid for the transaction.
 * @property {Int64} priorityFee - The optional priority fee to be paid for the transaction.
 * @property {boolean} privateFee - If true, uses a private record to pay the fee; otherwise, uses the account's public credit balance.
 * @property {string[]} inputs - The inputs to the function being executed.
 * @property {RecordSearchParams} [recordSearchParams] - Optional parameters for searching for a record to pay the execution transaction fee.
 * @property {string | RecordPlaintext} [feeRecord] - Optional fee record to use for the transaction.
 * @property {PrivateKey} [privateKey] - Optional private key to use for the transaction.
 * @property {string | Program} [program] - Optional program source code to use for the transaction.
 * @property {string} uri - The URI send the ProvingRequest to.
 * @property {ProgramImports} [imports] - Optional programs that the program being executed imports.
 * @property {boolean} broadcast - Whether to broadcast the Transaction generated by the remove prover to the Aleo network.
 * @property {boolean} unchecked - Whether to execute the transaction without checking the validity of the authorization (faster but may fail).
 * @property {number} [edition] - Edition of the program to execute the function in.
 * @property {boolean} [useFeeMaster] - Whether to use the FeeMaster account to execute the transaction.
 */
export interface ProvingRequestOptions {
  programName: string;
  functionName: string;
  priorityFee: Int64;
  privateFee: boolean;
  inputs: string[];
  baseFee?: Int64;
  recordSearchParams?: RecordSearchParams;
  feeRecord?: string | RecordPlaintext;
  privateKey?: PrivateKey;
  programSource?: string | Program;
  programImports?: ProgramImports;
  broadcast?: boolean;
  unchecked?: boolean;
  edition?: number;
  useFeeMaster?: boolean;
}

/**
 * ProgramManager class for building Aleo program transactions in React Native applications.
 *
 * The ProgramManager class provides methods to build authorization objects, fee authorizations,
 * and complete execution transactions for Aleo programs. It acts as the primary interface for
 * creating transactions that can be submitted to the Aleo network.
 *
 * @example
 * import { ProgramManager, Account } from "@provablehq/shield-mobile-sdk";
 *
 * const account = new Account();
 * const programManager = new ProgramManager({
 *   host: "https://api.explorer.provable.com/v1",
 *   account: account
 * });
 *
 * // Build an authorization
 * const authorization = programManager.buildAuthorization({
 *   programName: "hello.aleo",
 *   functionName: "main",
 *   inputs: ["1u32", "2u32"]
 * });
 */
export class ProgramManager {
  private _nitroProgramManager: ProgramManagerNitro;
  private _account?: Account;
  private _host: string;
  private _networkClient: AleoNetworkClient;
  private _recordProvider?: RecordProvider;
  private _keyProvider?: FunctionKeyProvider;
  private _inclusionKeysLoaded: boolean = false;

  constructor(options: ProgramManagerOptions = {}) {
    this._nitroProgramManager =
      getNitroClassNetworkAware<ProgramManagerNitro>("ProgramManager");
    this._host = options.host || "https://api.explorer.provable.com/v1";
    this._networkClient = new AleoNetworkClient(this._host);
    this._account = options.account;
    this._recordProvider = options.recordProvider;
    this._keyProvider = options.keyProvider
      ? options.keyProvider
      : new AleoKeyProvider();
  }

  /**
   * Set the account to use for transaction building
   * @param {Account} account The account to use
   *
   * @example
   * import { ProgramManager, Account } from "@provablehq/shield-mobile-sdk";
   *
   * const programManager = new ProgramManager();
   * const account = new Account();
   * programManager.setAccount(account);
   */
  setAccount(account: Account): void {
    this._account = account;
  }

  /**
   * Get the current account
   * @returns {Account | undefined} The current account or undefined if not set
   */
  getAccount(): Account | undefined {
    return this._account;
  }

  /**
   * Get the current host URI
   * @returns {string} The host URI
   */
  getHost(): string {
    return this._host;
  }

  /**
   * Estimate the minimum execution fee (in microcredits) for a program function.
   *
   * @param program The program source code or a program ID (e.g., "token_registry.aleo")
   * @param functionName The function to estimate
   * @param imports Optional program imports as name->source map
   * @param edition Optional program edition
   * @returns number Microcredits (as a JS number)
   */
  async estimateExecutionFee(options: FeeEstimateOptions): Promise<Int64> {
    const { programName, functionName, program, imports, edition } = options;
    if (!functionName) {
      throw new Error("Function name must be specified when estimating fee.");
    }
    const programSource = program
      ? program.toString()
      : await this._networkClient.getProgram(programName, edition);
    const programImports = imports
      ? imports
      : await this._networkClient.getProgramImports(programSource);
    if (Object.keys(programImports)) {
      const resolvedProgramImports: Record<string, string> = Object.fromEntries(
        Object.entries(programImports).map(([k, v]) => [k, v.toString()])
      );
      const resolvedEdition =
        edition ??
        (await this._networkClient.getLatestProgramEdition(programName)) ??
        1;
      return this._nitroProgramManager.estimateExecutionFee(
        programSource,
        functionName,
        resolvedProgramImports,
        resolvedEdition
      );
    }
    const resolvedProgramImports: Record<string, string> = Object.fromEntries(
      Object.entries(programImports).map(([k, v]) => [k, v.toString()])
    );
    // Otherwise, treat the input as raw source (or credits.aleo) and pass-through.
    return this._nitroProgramManager.estimateExecutionFee(
      programSource,
      functionName,
      resolvedProgramImports,
      edition
    );
  }

  async estimateFeeForAuthorization(
    programName: string,
    program: string,
    authorization?: Authorization,
    imports?: Record<string, string>,
    edition?: number
  ): Promise<Int64> {
    if (!authorization) {
      throw new Error(
        "Authorization must be provided if estimating fee for Authorization."
      );
    }
    const programSource = program
      ? program.toString()
      : await this._networkClient.getProgram(programName, edition);
    const programImports = imports
      ? imports
      : Object.fromEntries(
          Object.entries(
            await this._networkClient.getProgramImports(programSource)
          ).map(([key, value]) => [key, value.toString()])
        );
    if (Object.keys(programImports)) {
      return this._nitroProgramManager.estimateFeeForAuthorization(
        programSource,
        authorization._nitroAuthorization,
        programImports,
        edition
      );
    }

    return this._nitroProgramManager.estimateFeeForAuthorization(
      programSource,
      authorization._nitroAuthorization,
      imports,
      edition
    );
  }

  /**
   * Build an authorization for a program function execution.
   *
   * @param {AuthorizationOptions} options Configuration options for building the authorization
   * @returns {Authorization} The built authorization object
   *
   * @example
   * import { ProgramManager } from "@provablehq/shield-mobile-sdk";
   *
   * const programManager = new ProgramManager();
   * const authorization = programManager.buildAuthorization({
   *   programName: "credits.aleo",
   *   functionName: "transfer_public",
   *   inputs: [
   *     "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
   *     "10000000u64",
   *   ],
   * });
   */
  async buildAuthorization(
    options: AuthorizationOptions
  ): Promise<Authorization> {
    try {
      validateProgramName(options.programName);
      const program =
        options.programSource ??
        <string>await this._networkClient.getProgram(options.programName);
      const programName =
        options.programName ?? Program.fromString(program).id();
      const edition =
        options.edition ??
        (await this._networkClient.getLatestProgramEdition(programName)) ??
        1;
      const privateKeyNitro =
        options.privateKey?.nitro ?? this._account?.privateKey();
      let imports = options.programImports ?? {};

      if (!privateKeyNitro) {
        logAndThrow("Private key is required for building authorization");
      }

      if (!programName) {
        logAndThrow("Program name is required for building authorization");
      }

      const numberOfImports = Program.fromString(program).getImports().length;
      if (numberOfImports > 0 && Object.keys(imports).length === 0) {
        try {
          const programImports = await this._networkClient.getProgramImports(
            programName
          );
          imports = Object.fromEntries(
            Object.entries(programImports).map(([key, value]) => [
              key,
              value.toString(),
            ])
          );
        } catch (e: unknown) {
          const err = e as Error;
          logAndThrow(
            `Error finding program imports. Network response: '${err.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`
          );
        }
      }

      const result = this._nitroProgramManager.buildAuthorization(
        programName,
        options.functionName,
        options.inputs,
        privateKeyNitro,
        program,
        imports,
        edition
      );

      return new Authorization({ nitroAuthorization: result });
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(`Failed to build authorization: ${err.message}`);
    }
  }

  /**
   * Builds a `ProvingRequest` for submission to a prover for execution.
   *
   * @param {ProvingRequestOptions} options - The options for building the proving request
   * @returns {Promise<ProvingRequest>} - A promise that resolves to the transaction or an error.
   *
   * @example
   * /// Import the mainnet version of the sdk.
   * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
   *
   * // Create a new NetworkClient, KeyProvider, and RecordProvider.
   * const keyProvider = new AleoKeyProvider();
   * const recordProvider = new NetworkRecordProvider(account, networkClient);
   * keyProvider.useCache(true);
   *
   * // Initialize a ProgramManager with the key and record providers.
   * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
   *
   * // Build the proving request.
   * const provingRequest = await programManager.provingRequest({
   *   programName: "credits.aleo",
   *   functionName: "transfer_public",
   *   priorityFee: 0,
   *   privateFee: false,
   *   inputs: [
   *     "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
   *     "10000000u64",
   *   ],
   *   broadcast: false,
   * });
   */
  async provingRequest(
    options: ProvingRequestOptions
  ): Promise<ProvingRequest> {
    const {
      functionName,
      priorityFee,
      privateFee,
      inputs,
      recordSearchParams,
      broadcast = false,
      unchecked = false,
    } = options;

    const baseFee = options.baseFee ? options.baseFee : 0n;
    const privateKey = options.privateKey;
    const useFeeMaster = options.useFeeMaster ? options.useFeeMaster : false;
    let program = options.programSource;
    let programName = options.programName;
    let feeRecord = options.feeRecord;
    let imports = options.programImports;
    let edition = options.edition;

    if (program === undefined) {
      // Ensure the function exists on the network.
      try {
        program = <string>await this._networkClient.getProgram(programName);
      } catch (e: any) {
        logAndThrow(
          `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`
        );
      }
    } else if (program instanceof Program) {
      program = program.toString();
    }

    if (programName === undefined) {
      // Get the program name if it is not provided in the parameters.
      programName = Program.fromString(program).id();
    }

    if (edition === undefined) {
      try {
        edition = await this._networkClient.getLatestProgramEdition(
          programName
        );
      } catch (e: any) {
        console.warn(
          `Error finding edition for ${programName}. Network response: '${e.message}'. Assuming edition 0.`
        );
        edition = 0;
      }
    }

    // Get the private key from the account if it is not provided in the parameters.
    let executionPrivateKey = privateKey?.nitro;
    if (
      typeof privateKey === "undefined" &&
      typeof this._account !== "undefined"
    ) {
      executionPrivateKey = this._account.privateKey();
    }

    if (typeof executionPrivateKey === "undefined") {
      throw "No private key provided and no private key set in the ProgramManager";
    }

    // Resolve the program imports if they exist.
    const numberOfImports = Program.fromString(program).getImports().length;
    if (numberOfImports > 0 && !imports) {
      try {
        imports = <ProgramImports>(
          await this._networkClient.getProgramImports(programName)
        );
      } catch (e: any) {
        logAndThrow(
          `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`
        );
      }
    }

    // Get the fee record from the account if it is not provided in the parameters
    try {
      if (privateFee && !useFeeMaster) {
        let fee = priorityFee;
        // If a fee record wasn't provided, estimate the fee that needs to be paid.
        if (!feeRecord) {
          const baseFee = await this.estimateExecutionFee({
            programName,
            functionName,
            program: program.toString(),
            imports,
          });
          fee = baseFee + priorityFee;
        }

        // Get a credits.aleo record for the fee.
        feeRecord = await this.getCreditsRecord(
          fee,
          [],
          feeRecord,
          recordSearchParams
        );
      } else {
        // If it's specified NOT to use a privateFee, use a public fee.
        feeRecord = undefined;
      }
    } catch (e: any) {
      logAndThrow(
        `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`
      );
    }

    const resolvedImports: Record<string, string> = imports
      ? Object.fromEntries(
          Object.entries(imports).map(([k, v]) => [k, v.toString()])
        )
      : {};

    // Build and return the `ProvingRequest`.
    const nitroProvingRequest =
      await this._nitroProgramManager.buildProvingRequest(
        executionPrivateKey,
        program,
        functionName,
        inputs,
        baseFee,
        priorityFee,
        feeRecord,
        resolvedImports,
        broadcast,
        unchecked,
        edition,
        useFeeMaster
      );
    return new ProvingRequest({ nitroProvingRequest });
  }

  /**
   * Build a fee authorization for paying transaction fees.
   *
   * @param {FeeAuthorizationOptions} options Configuration options for building the fee authorization
   * @returns {Authorization} The built fee authorization object
   *
   * @example
   * import { ProgramManager } from "@provablehq/shield-mobile-sdk";
   *
   * const programManager = new ProgramManager();
   * const feeAuthorization = programManager.buildFeeAuthorization({
   *   deploymentOrExecutionId: "at1...",
   *   baseFeeCredits: 10000,
   *   priorityFeeCredits: 1000
   * });
   */
  buildFeeAuthorization(options: FeeAuthorizationOptions): Authorization {
    try {
      let privateKeyNitro: PrivateKeyNitro;

      if (options.privateKey) {
        privateKeyNitro = options.privateKey.nitro;
      } else if (this._account) {
        // Get private key from account wrapper
        privateKeyNitro = this._account.privateKey();
      } else {
        throw new Error("Private key is required for fee authorization");
      }

      const result = this._nitroProgramManager.buildFeeAuthorization(
        options.deploymentOrExecutionId,
        options.baseFeeCredits,
        options.priorityFeeCredits,
        privateKeyNitro,
        options.feeRecord || ""
      );

      return new Authorization({ nitroAuthorization: result });
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(`Failed to build fee authorization: ${err.message}`);
    }
  }

  /**
   * Build an execution transaction that can be submitted to the network.
   *
   * @param {ExecuteOptions} options Configuration options for building the execution transaction
   * @returns {string} The built transaction as a string representation
   *
   * @example
   * import { ProgramManager } from "@provablehq/shield-mobile-sdk";
   *
   * const programManager = new ProgramManager();
   * const transaction = programManager.buildExecutionTransaction({
   *   programName: "hello_hello.aleo",
   *   functionName: "hello_hello",
   *   priorityFee: 0.0,
   *   privateFee: false,
   *   inputs: ["5u32", "5u32"],
   * });
   *
   * // The transaction can now be submitted to the network
   * console.log(transaction);
   */
  // buildExecutionTransaction(options: ExecuteOptions): string {
  //   try {
  //     let privateKeyNitro: PrivateKeyNitro;

  //     if (options.privateKey) {
  //       privateKeyNitro = options.privateKey.nitro;
  //     } else if (this._account) {
  //       // Get private key from account wrapper
  //       privateKeyNitro = this._account.privateKey();
  //     } else {
  //       throw new Error("Private key is required for execution transaction");
  //     }

  //     const result = this._nitroProgramManager.buildExecutionTransaction(
  //       options.programName,
  //       options.functionName,
  //       options.inputs,
  //       options.priorityFee || 0,
  //       options.privateFee || false,
  //       privateKeyNitro,
  //       options.feeRecord || "",
  //       options.program || "",
  //       options.imports || {},
  //       options.edition || 0
  //     );

  //     return result;
  //   } catch (error: unknown) {
  //     const err = error as Error;
  //     throw new Error(`Failed to build execution transaction: ${err.message}`);
  //   }
  // }
  async buildExecutionTransaction(
    options: ExecuteOptions
  ): Promise<Transaction> {
    const {
      functionName,
      priorityFee,
      privateFee,
      inputs,
      recordSearchParams,
      keySearchParams,
      privateKey,
      offlineQuery,
    } = options;

    let feeRecord = options.feeRecord;
    let provingKey = options.provingKey;
    let verifyingKey = options.verifyingKey;
    let program = options.program;
    let programName = options.programName;
    let imports = options.imports;
    let edition = options.edition;

    // Ensure the function exists on the network
    validateProgramName(programName);
    if (program === undefined) {
      try {
        program = <string>await this._networkClient.getProgram(programName);
      } catch (e: any) {
        logAndThrow(
          `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`
        );
      }
    } else if (program instanceof Program) {
      program = program.toString();
    }

    // Get the program name if it is not provided in the parameters.
    if (programName === undefined) {
      programName = Program.fromString(program).id();
    }

    if (edition === undefined) {
      try {
        edition = await this._networkClient.getLatestProgramEdition(
          programName
        );
      } catch (e: any) {
        console.warn(
          `Error finding edition for ${programName}. Network response: '${e.message}'. Assuming edition 1.`
        );
        edition = 1;
      }
    }

    // Get the private key from the account if it is not provided in the parameters
    let executionPrivateKey = privateKey?.nitro;
    if (
      typeof executionPrivateKey === "undefined" &&
      typeof this._account !== "undefined"
    ) {
      executionPrivateKey = this._account.privateKey();
    }

    if (typeof executionPrivateKey === "undefined") {
      logAndThrow(
        "No private key provided and no private key set in the ProgramManager"
      );
    }

    // Get the fee record from the account if it is not provided in the parameters

    try {
      if (privateFee) {
        let totalFee = priorityFee;
        if (!feeRecord) {
          const nitroImportsForEstimate: Record<string, string> =
            Object.fromEntries(
              Object.entries(imports || {}).map(([k, v]) => [
                k,
                typeof v === "string" ? v : v.toString(),
              ])
            );
          const baseFee = this._nitroProgramManager.estimateExecutionFee(
            program as string,
            functionName,
            nitroImportsForEstimate,
            edition
          );
          totalFee = baseFee + priorityFee;
        }
        feeRecord = await this.getCreditsRecord(
          totalFee,
          [],
          feeRecord,
          recordSearchParams
        );
      } else {
        feeRecord = undefined;
      }
    } catch (e: any) {
      logAndThrow(
        `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`
      );
    }

    const feeRecordStr = feeRecord ? await feeRecord.asString() : "";
    const feeRecordFromNative = feeRecord
      ? {
          name: feeRecordStr,
          asString: feeRecord.asString,
          getMember: feeRecord.getMember,
        }
      : undefined;

    if (!this._keyProvider) {
      logAndThrow("ProgramManager: No key provider provided");
    }

    // Get the fee proving and verifying keys from the key provider
    let feeKeys: FunctionKeyPair;
    try {
      feeKeys = privateFee
        ? <FunctionKeyPair>await this._keyProvider.feePrivateKeys()
        : <FunctionKeyPair>await this._keyProvider.feePublicKeys();
    } catch (e: any) {
      logAndThrow(
        `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`
      );
    }
    const [feeProvingKey, feeVerifyingKey] = feeKeys;

    // If the function proving and verifying keys are not provided, attempt to find them using the key provider
    if (!provingKey || !verifyingKey) {
      try {
        [provingKey, verifyingKey] = <FunctionKeyPair>(
          await this._keyProvider.functionKeys(keySearchParams)
        );
      } catch (e) {
        console.log(
          `Function keys not found. Key finder response: '${e}'. The function keys will be synthesized`
        );
      }
    }

    // Resolve the program imports if they exist
    const numberOfImports = Program.fromString(program).getImports().length;
    if (numberOfImports > 0 && !imports) {
      try {
        imports = <ProgramImports>(
          await this._networkClient.getProgramImports(programName)
        );
      } catch (e: any) {
        logAndThrow(
          `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`
        );
      }
    }

    if (offlineQuery && !this._inclusionKeysLoaded) {
      try {
        const inclusionKeys = await this._keyProvider.inclusionKeys();
        const inclusionProvingKey = inclusionKeys[0];
        this._nitroProgramManager.loadInclusionProver(
          inclusionProvingKey.nitro
        );
        this._inclusionKeysLoaded = true;
        console.log("Successfully loaded inclusion key");
      } catch {
        logAndThrow(
          `Inclusion key bytes not loaded, please ensure the program manager is initialized with a KeyProvider that includes the inclusion key.`
        );
      }
    }

    const nitroImports: Record<string, string | ProgramNitro> =
      Object.fromEntries(
        Object.entries(imports || {}).map(([k, v]) => [
          k,
          typeof v === "string" ? v : v.nitro,
        ])
      );

    // Auto-create OfflineQuery if not provided
    // For private fee transactions, automatically fetch and add fee record state path
    // TODO: For private executions with record inputs (not just fee), implement state path fetching
    let resolvedOfflineQuery = offlineQuery;
    if (!resolvedOfflineQuery) {
      const stateRoot = await this._networkClient.getStateRoot();
      const blockHeight = await this._networkClient.getLatestHeight();
      const offlineQueryJson = JSON.stringify({
        block_height: blockHeight,
        state_root: stateRoot,
        state_paths: {},
      });
      resolvedOfflineQuery = OfflineQuery.fromString(offlineQueryJson);

      // If using private fee, add fee record state path
      if (privateFee && feeRecord) {
        try {
          // Get view key from private key
          const viewKey = executionPrivateKey.toViewKey();

          // Get fee record string (async)
          const feeRecordStr = await feeRecord.asString();

          // Compute commitment for fee record
          // TODO: For general record inputs (not fee), parse program to get program ID and record name from function signature
          // Note: Fee records are always credits.aleo/credits (hardcoded in Aleo protocol)
          const commitment =
            this._nitroProgramManager.recordPlaintextToCommitment(
              feeRecordStr,
              "credits.aleo",
              "credits",
              viewKey
            );

          // Fetch state path for the commitment
          const statePath = await this._networkClient.getStatePath(commitment);

          // Add state path to OfflineQuery
          resolvedOfflineQuery.addStatePath(commitment, statePath);
          console.log(
            `Added state path for fee record commitment: ${commitment}`
          );
        } catch (e: any) {
          logAndThrow(
            `Error fetching state path for fee record: ${e.message}. Please ensure you're connected to a valid Aleo network.`
          );
        }
      }
    }

    // Handle record inputs that need state paths
    const recordInputs = inputs
      .map((input, index) => ({ input, index }))
      .filter(({ input }) => input.includes("_nonce"));

    if (recordInputs.length > 0) {
      try {
        // Parse program to get function input types
        const programObject = Program.fromString(program);
        const functionInputs = programObject.getFunctionInputs(
          functionName
        ) as any[];
        const programId = programObject.id();

        // Get view key from private key
        const viewKey = executionPrivateKey.toViewKey();

        // Process each record input
        for (const { input: recordInput, index } of recordInputs) {
          const inputType = functionInputs[index];
          if (!inputType) {
            console.warn(`No input type found for input at index ${index}`);
            continue;
          }

          let recordProgramId: string;
          let recordName: string;

          // Determine program ID and record name from input type
          if (inputType.type === "external_record" && inputType.locator) {
            // External record: locator format is "program_id/record_name"
            const [progId, recName] = inputType.locator.split("/");
            recordProgramId = progId;
            recordName = recName;
          } else if (inputType.type === "record" || inputType.name) {
            // Regular record: use current program ID
            // For regular records, the record name might be in different fields
            // Try to extract from the input type structure
            recordProgramId = programId;
            // The record name might be in inputType.name, or we might need to parse it differently
            // For now, try common field names
            recordName =
              inputType.name ||
              inputType.record ||
              inputType.identifier ||
              "credits";
            console.log(
              `Using record name: ${recordName} for program: ${recordProgramId}`
            );
          } else {
            console.warn(
              `Could not determine program/record for input at index ${index}, inputType:`,
              inputType
            );
            continue;
          }

          // Compute commitment for record input
          const commitment =
            this._nitroProgramManager.recordPlaintextToCommitment(
              recordInput,
              recordProgramId,
              recordName,
              viewKey
            );

          // Fetch state path for the commitment
          const statePath = await this._networkClient.getStatePath(commitment);

          // Add state path to OfflineQuery
          resolvedOfflineQuery.addStatePath(commitment, statePath);
        }
      } catch (e: any) {
        console.warn(
          `Error fetching state paths for record inputs: ${e.message}. Some records may be missing state paths.`
        );
      }
    }

    const transaction =
      await this._nitroProgramManager.buildExecutionTransaction(
        executionPrivateKey,
        program,
        functionName,
        inputs,
        priorityFee,
        feeRecordFromNative,
        this._host,
        nitroImports,
        provingKey?.nitro,
        verifyingKey?.nitro,
        feeProvingKey?.nitro,
        feeVerifyingKey?.nitro,
        resolvedOfflineQuery?.nitro,
        edition
      );

    return new Transaction(transaction);
  }

  // Internal utility function for getting a credits.aleo record
  async getCreditsRecord(
    amount: Int64,
    nonces: string[],
    record?: RecordPlaintext | string,
    params?: RecordSearchParams
  ): Promise<RecordPlaintext> {
    if (record) {
      try {
        if (record instanceof Account.recordPlaintextFromString) {
          return record as RecordPlaintext;
        }
        return Account.recordPlaintextFromString(record as string);
      } catch (e: any) {
        logAndThrow(`Record '${record}' could not be parsed, please ensure a valid credits.aleo record
                is passed prior to trying again. Error: ${e.message}`);
      }
    } else {
      try {
        const recordProvider = <RecordProvider>this._recordProvider;
        const record = await recordProvider.findCreditsRecord(amount, {
          ...params,
          unspent: true,
          nonces,
        });
        console.log("record", record);
        if (record.record_plaintext) {
          return Account.recordPlaintextFromString(record.record_plaintext);
        } else {
          logAndThrow(
            "Failed to deserialize record returned from record provider"
          );
        }
      } catch (e: any) {
        logAndThrow(
          `Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`
        );
      }
    }
  }

  /**
   * Builds a deployment transaction for submission to the Aleo network.
   *
   * @param {string} program Program source code
   * @param {Int64} priorityFee The optional priority fee to be paid for that transaction.
   * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
   * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for searching for a record to use pay the deployment fee
   * @param {string | RecordPlaintext | undefined} feeRecord Optional Fee record to use for the transaction
   * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
   * @returns {string} The transaction id of the deployed program or a failure message from the network
   *
   * @example
   * /// Import the mainnet version of the sdk.
   * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
   *
   * // Create a new NetworkClient, KeyProvider, and RecordProvider
   * const keyProvider = new AleoKeyProvider();
   * const recordProvider = new NetworkRecordProvider(account, networkClient);
   * keyProvider.useCache(true);
   *
   * // Initialize a program manager with the key provider to automatically fetch keys for deployments
   * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
   * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
   * programManager.setAccount(Account);
   *
   * // Define a fee in credits
   * const priorityFee = 0.0;
   *
   * // Create the deployment transaction.
   * const tx = await programManager.buildDeploymentTransaction(program, fee, false);
   * await programManager.networkClient.submitTransaction(tx);
   *
   * // Verify the transaction was successful
   * setTimeout(async () => {
   *  const transaction = await programManager.networkClient.getTransaction(tx.id());
   *  assert(transaction.id() === tx.id());
   * }, 20000);
   */
  async buildDeploymentTransaction(
    program: string,
    priorityFee: Int64,
    privateFee: boolean,
    recordSearchParams?: RecordSearchParams,
    feeRecord?: string | RecordPlaintext,
    privateKey?: PrivateKey | PrivateKeyNitro
  ): Promise<Transaction> {
    // Ensure the program is valid.
    let programObject: Program;
    try {
      programObject = Program.fromString(program);
    } catch (e: any) {
      logAndThrow(
        `Error parsing program: '${e.message}'. Please ensure the program is valid.`
      );
    }

    // Ensure the program is valid and does not exist on the network
    try {
      await this._networkClient.getProgram(programObject.id());
      // If we get here, the program exists on the network
      throw new Error(
        `Program ${programObject.id()} already exists on the network, please rename your program`
      );
    } catch (e: any) {
      // Check if this is our intentional "already exists" error - if so, re-throw it
      if (e?.message?.includes("already exists on the network")) {
        throw e;
      }
      // Otherwise, it's a network error (program doesn't exist), which is expected
      console.log(
        `Program ${programObject.id()} does not exist on the network, deploying...`
      );
    }

    // Get the private key from the account if it is not provided in the parameters
    let deploymentPrivateKey: PrivateKeyNitro | undefined;
    if (privateKey) {
      // Check if it's the TypeScript wrapper (has .nitro) or already the Nitro interface
      if (
        "nitro" in privateKey &&
        typeof (privateKey as any).nitro !== "undefined"
      ) {
        deploymentPrivateKey = (privateKey as any).nitro;
      } else {
        // It's already the Nitro interface
        deploymentPrivateKey = privateKey as PrivateKeyNitro;
      }
    }

    if (
      typeof deploymentPrivateKey === "undefined" &&
      typeof this._account !== "undefined"
    ) {
      deploymentPrivateKey = this._account.privateKey();
    }

    if (typeof deploymentPrivateKey === "undefined") {
      throw "No private key provided and no private key set in the ProgramManager";
    }

    // Get the fee record from the account if it is not provided in the parameters
    try {
      if (privateFee) {
        let fee = priorityFee;
        // If a private fee is specified, but no fee record is provided, estimate the fee and find a matching record.
        if (!feeRecord) {
          console.log(
            "Private fee specified, but no private fee record provided, estimating fee and finding a matching fee record."
          );
          const programString = programObject.toString();
          const imports = await this._networkClient.getProgramImports(
            programString
          );
          const baseFee = this._nitroProgramManager.estimateDeploymentFee(
            programString,
            imports as Record<string, string> //TODO: check if this works
          );
          fee = baseFee + priorityFee;
        }
        // Get a credits.aleo record for the fee.
        feeRecord = await this.getCreditsRecord(
          fee,
          [],
          feeRecord,
          recordSearchParams
        );
      } else {
        // If it's specified NOT to use a privateFee, use a public fee.
        feeRecord = undefined;
      }
    } catch (e: any) {
      logAndThrow(
        `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`
      );
    }
    // Get the proving and verifying keys from the key provider
    let feeKeys: FunctionKeyPair;
    try {
      feeKeys = privateFee
        ? <FunctionKeyPair>await this._keyProvider?.feePrivateKeys()
        : <FunctionKeyPair>await this._keyProvider?.feePublicKeys();
    } catch (e: any) {
      logAndThrow(
        `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`
      );
    }
    const [feeProvingKey, feeVerifyingKey] = feeKeys;

    // Resolve the program imports if they exist
    let imports: ProgramImports;
    try {
      imports = await this._networkClient.getProgramImports(program);
    } catch (e: any) {
      logAndThrow(
        `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`
      );
    }

    const nitroImports: Record<string, string | ProgramNitro> =
      Object.fromEntries(
        Object.entries(imports).map(([k, v]) => [
          k,
          typeof v === "string" ? v : v.nitro,
        ])
      );

    // Auto-fetch state root and block height to create OfflineQuery if not provided
    // This enables online inclusion queries by fetching data and creating an offline query
    let offlineQuery: OfflineQuery | undefined;
    try {
      const stateRoot = await this._networkClient.getStateRoot();
      const blockHeight = await this._networkClient.getLatestHeight();
      const offlineQueryJson = JSON.stringify({
        block_height: blockHeight,
        state_root: stateRoot,
        state_paths: {},
      });
      offlineQuery = OfflineQuery.fromString(offlineQueryJson);
    } catch (e: any) {
      logAndThrow(
        `Error fetching state root and block height for offline query: ${e.message}. Please ensure you're connected to a valid Aleo network.`
      );
    }

    // Build a deployment transaction
    const nitroTransaction =
      await this._nitroProgramManager.buildDeploymentTransaction(
        deploymentPrivateKey,
        program,
        priorityFee,
        feeRecord,
        this._host,
        nitroImports,
        feeProvingKey.nitro,
        feeVerifyingKey.nitro,
        offlineQuery?.nitro
      );
    return new Transaction(nitroTransaction);
  }

  /**
   * Deploy an Aleo program to the Aleo network
   *
   * @param {string} program Program source code
   * @param {Int64} priorityFee The optional fee to be paid for the transaction
   * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
   * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for searching for a record to used pay the deployment fee
   * @param {string | RecordPlaintext | undefined} feeRecord Optional Fee record to use for the transaction
   * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
   * @returns {string} The transaction id of the deployed program or a failure message from the network
   *
   * @example
   * /// Import the mainnet version of the sdk.
   * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
   *
   * // Create a new NetworkClient, KeyProvider, and RecordProvider.
   * const keyProvider = new AleoKeyProvider();
   * const recordProvider = new NetworkRecordProvider(account, networkClient);
   * keyProvider.useCache(true);
   *
   * // Initialize a program manager with the key provider to automatically fetch keys for deployments
   * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
   * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
   *
   * // Define a fee in credits
   * const priorityFee = 0.0;
   *
   * // Deploy the program
   * const tx_id = await programManager.deploy(program, fee, false);
   *
   * // Verify the transaction was successful
   * setTimeout(async () => {
   *  const transaction = await programManager.networkClient.getTransaction(tx_id);
   *  assert(transaction.id() === tx_id);
   * }, 20000);
   */
  async deploy(
    program: string,
    priorityFee: Int64,
    privateFee: boolean,
    recordSearchParams?: RecordSearchParams,
    feeRecord?: string | RecordPlaintext,
    privateKey?: PrivateKey
  ): Promise<string> {
    const tx = <Transaction>(
      await this.buildDeploymentTransaction(
        program,
        priorityFee,
        privateFee,
        recordSearchParams,
        feeRecord,
        privateKey
      )
    );

    let feeAddress: Address;

    if (typeof privateKey !== "undefined") {
      feeAddress = await privateKey.toAddress();
    } else if (this._account !== undefined) {
      feeAddress = this._account?.address();
    } else {
      throw Error(
        "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key."
      );
    }

    // Check if the account has sufficient public balance to pay for the transaction
    if (!privateFee) {
      try {
        await this.checkFee(feeAddress.toString(), tx.feeAmount());
      } catch (e: any) {
        logAndThrow(
          `Error checking fee. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the transaction is valid.`
        );
      }
    }

    try {
      return await this._networkClient.submitTransaction(tx);
    } catch (e: any) {
      logAndThrow(
        `Error submitting deployment transaction. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the transaction is valid.`
      );
    }
    return tx.id();
  }

  /**
   * Check if the fee is sufficient to pay for the transaction
   */
  async checkFee(address: string, feeAmount: Int64) {
    const balance = BigInt(await this._networkClient.getPublicBalance(address));
    if (feeAmount > balance) {
      throw Error(
        `The desired execution requires a fee of ${feeAmount} microcredits, but the account paying the fee has ${balance} microcredits available.`
      );
    }
  }

  async estimateDeploymentFee(
    program: string,
    imports: Record<string, string>
  ): Promise<Int64> {
    try {
      return this._nitroProgramManager.estimateDeploymentFee(program, imports);
    } catch (e: any) {
      throw new Error(`Failed to estimate deployment fee: ${e.message}`);
    }
  }
}
