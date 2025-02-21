/* tslint:disable */
/* eslint-disable */
/**
 * Verify an execution with a single function and a single transition. Executions with multiple
 * transitions or functions will fail to verify. Also, this does not verify that the state root of
 * the execution is included in the Aleo Network ledger.
 *
 * @param {Execution} execution The function execution to verify
 * @param {VerifyingKey} verifying_key The verifying key for the function
 * @param {Program} program The program that the function execution belongs to
 * @param {String} function_id The name of the function that was executed
 * @returns {boolean} True if the execution is valid, false otherwise
 */
export function verifyFunctionExecution(execution: Execution, verifying_key: VerifyingKey, program: Program, function_id: string): boolean;
export function runRayonThread(receiver: number): void;
export function initThreadPool(url: URL, num_threads: number): Promise<void>;
/**
 * Public address of an Aleo account
 */
export class Address {
  private constructor();
  free(): void;
  /**
   * Derive an Aleo address from a private key
   *
   * @param {PrivateKey} private_key The private key to derive the address from
   * @returns {Address} Address corresponding to the private key
   */
  static from_private_key(private_key: PrivateKey): Address;
  /**
   * Derive an Aleo address from a view key
   *
   * @param {ViewKey} view_key The view key to derive the address from
   * @returns {Address} Address corresponding to the view key
   */
  static from_view_key(view_key: ViewKey): Address;
  /**
   * Derive an Aleo address from a compute key.
   *
   * @param {ComputeKey} compute_key The compute key to derive the address from
   */
  static from_compute_key(compute_key: ComputeKey): Address;
  /**
   * Create an aleo address object from a string representation of an address
   *
   * @param {string} address String representation of an addressm
   * @returns {Address} Address
   */
  static from_string(address: string): Address;
  /**
   * Get a string representation of an Aleo address object
   *
   * @param {Address} Address
   * @returns {string} String representation of the address
   */
  to_string(): string;
  /**
   * Verify a signature for a message signed by the address
   *
   * @param {Uint8Array} Byte array representing a message signed by the address
   * @returns {boolean} Boolean representing whether or not the signature is valid
   */
  verify(message: Uint8Array, signature: Signature): boolean;
}
/**
 * SnarkVM Ciphertext object. A Ciphertext represents an symmetrically encrypted plaintext. This
 * object provides decryption methods to recover the plaintext from the ciphertext (given the
 * api consumer has the proper decryption materials).
 */
export class Ciphertext {
  private constructor();
  free(): void;
  /**
   * Decrypt the ciphertext using the given view key.
   *
   * @param {ViewKey} The view key of the account that encrypted the ciphertext.
   * @param {Group} The nonce used to encrypt the ciphertext.
   *
   * @returns {Plaintext} The decrypted plaintext.
   */
  decrypt(view_key: ViewKey, nonce: Group): Plaintext;
  /**
   * Decrypts a ciphertext into plaintext using the given transition view key.
   *
   * @param {Field} transition_view_key The transition view key that was used to encrypt the ciphertext.
   *
   * @returns {Plaintext} The decrypted plaintext.
   */
  decryptSymmetric(transition_view_key: Field): Plaintext;
  /**
   * Deserialize a left endian byte array into a Ciphertext.
   *
   * @param {Uint8Array} bytes The byte array representing the Ciphertext.
   *
   * @returns {Ciphertext} The Ciphertext object.
   */
  static fromBytesLe(bytes: Uint8Array): Ciphertext;
  /**
   * Deserialize a Ciphertext string into a Ciphertext object.
   *
   * @param {string} ciphertext A string representation of the ciphertext.
   *
   * @returns {Ciphertext} The Ciphertext object.
   */
  static fromString(ciphertext: string): Ciphertext;
  /**
   * Serialize a Ciphertext object into a byte array.
   *
   * @returns {Uint8Array} The serialized Ciphertext.
   */
  toBytes(): Uint8Array;
  /**
   * Serialize a Ciphertext into a js string.
   *
   * @returns {string} The serialized Ciphertext.
   */
  toString(): string;
}
export class ComputeKey {
  private constructor();
  free(): void;
  /**
   * Create a new compute key from a private key.
   *
   * @param {PrivateKey} private_key Private key
   *
   * @returns {ComputeKey} Compute key
   */
  static from_private_key(private_key: PrivateKey): ComputeKey;
  /**
   * Get the address from the compute key.
   *
   * @returns {Address}
   */
  address(): Address;
  /**
   * Get the sk_prf of the compute key.
   *
   * @returns {Scalar} sk_prf
   */
  sk_prf(): Scalar;
  /**
   * Get the pr_tag of the compute key.
   *
   * @returns {Group} pr_tag
   */
  pk_sig(): Group;
  /**
   * Get the pr_sig of the compute key.
   *
   * @returns {Group} pr_sig
   */
  pr_sig(): Group;
}
/**
 * Execution of an Aleo program.
 */
export class Execution {
  private constructor();
  free(): void;
  /**
   * Returns the string representation of the execution.
   *
   * @returns {string} The string representation of the execution.
   */
  toString(): string;
  /**
   * Creates an execution object from a string representation of an execution.
   *
   * @returns {Execution | Error} The wasm representation of an execution object.
   */
  static fromString(execution: string): Execution;
  /**
   * Returns the global state root of the execution.
   *
   * @returns {Execution | Error} The global state root used in the execution.
   */
  globalStateRoot(): string;
  /**
   * Returns the proof of the execution.
   *
   * @returns {string} The execution proof.
   */
  proof(): string;
  /**
   * Returns the transitions present in the execution.
   *
   * @returns Array<Transition> the array of transitions present in the execution.
   */
  transitions(): Array<any>;
}
/**
 * Webassembly Representation of an Aleo function execution response
 *
 * This object is returned by the execution of an Aleo function off-chain. It provides methods for
 * retrieving the outputs of the function execution.
 */
export class ExecutionResponse {
  private constructor();
  free(): void;
  /**
   * Get the outputs of the executed function
   *
   * @returns {Array} Array of strings representing the outputs of the function
   */
  getOutputs(): Array<any>;
  /**
   * Returns the execution object if present, null if otherwise.
   *
   * @returns {Execution | undefined} The execution object if present, null if otherwise
   */
  getExecution(): Execution | undefined;
  /**
   * Returns the program keys if present
   */
  getKeys(): KeyPair;
  /**
   * Returns the proving_key if the proving key was cached in the Execution response.
   * Note the proving key is removed from the response object after the first call to this
   * function. Subsequent calls will return null.
   *
   * @returns {ProvingKey | undefined} The proving key
   */
  getProvingKey(): ProvingKey | undefined;
  /**
   * Returns the verifying_key associated with the program
   *
   * @returns {VerifyingKey} The verifying key
   */
  getVerifyingKey(): VerifyingKey;
  /**
   * Returns the function identifier
   */
  getFunctionId(): string;
  /**
   * Returns the program
   */
  getProgram(): Program;
}
/**
 * Field element.
 */
export class Field {
  private constructor();
  free(): void;
  /**
   * Creates a field object from a string representation of a field.
   */
  static fromString(field: string): Field;
  /**
   * Create a plaintext element from a group element.
   */
  toPlaintext(): Plaintext;
  /**
   * Returns the string representation of the field.
   */
  toString(): string;
  /**
   * Generate a random field element.
   */
  static random(): Field;
  /**
   * Add two field elements.
   */
  add(other: Field): Field;
  /**
   * Subtract two field elements.
   */
  subtract(other: Field): Field;
  /**
   * Multiply two field elements.
   */
  multiply(other: Field): Field;
  /**
   * Divide two field elements.
   */
  divide(other: Field): Field;
  /**
   * Power of a field element.
   */
  pow(other: Field): Field;
  /**
   * Invert the field element.
   */
  inverse(): Field;
  /**
   * Get the zero element of the field.
   */
  static zero(): Field;
  /**
   * Get the one element of the field.
   */
  static one(): Field;
  /**
   * Double the field element.
   */
  double(): Field;
  /**
   * Check if one field element equals another.
   */
  equals(other: Field): boolean;
}
export class GraphKey {
  private constructor();
  free(): void;
  /**
   * Create a new graph key from a view key.
   *
   * @param {ViewKey} view_key View key
   * @returns {GraphKey} Graph key
   */
  static from_view_key(view_key: ViewKey): GraphKey;
  /**
   * Create a new graph key from a string representation of a graph key
   *
   * @param {string} graph_key String representation of a graph key
   * @returns {GraphKey} Graph key
   */
  static from_string(graph_key: string): GraphKey;
  /**
   * Get a string representation of a graph key
   *
   * @returns {string} String representation of a graph key
   */
  to_string(): string;
  /**
   * Get the sk_tag of the graph key. Used to determine ownership of records.
   */
  sk_tag(): Field;
}
/**
 * Elliptic curve element.
 */
export class Group {
  private constructor();
  free(): void;
  /**
   * Creates a group object from a string representation of a group.
   */
  static fromString(group: string): Group;
  /**
   * Returns the string representation of the group.
   */
  toString(): string;
  /**
   * Get the x-coordinate of the group element.
   */
  toXCoordinate(): Field;
  /**
   * Create a plaintext element from a group element.
   */
  toPlaintext(): Plaintext;
  /**
   * Generate a random group element.
   */
  static random(): Group;
  /**
   * Add two group elements.
   */
  add(other: Group): Group;
  /**
   * Subtract two group elements (equivalently: add the inverse of an element).
   */
  subtract(other: Group): Group;
  /**
   * Multiply a group element by a scalar element.
   */
  scalarMultiply(scalar: Scalar): Group;
  /**
   * Double the group element.
   */
  double(): Group;
  /**
   * Get the inverse of the group element. This is the reflection of the point about the axis
   * of symmetry i.e. (x,y) -> (x, -y).
   */
  inverse(): Group;
  /**
   * Check if one group element equals another.
   */
  equals(other: Group): boolean;
  /**
   * Get the group identity element under the group operation (i.e. the point at infinity.)
   */
  static zero(): Group;
  /**
   * Get the generator of the group.
   */
  static generator(): Group;
}
/**
 * Key pair object containing both the function proving and verifying keys
 */
export class KeyPair {
  free(): void;
  /**
   * Create new key pair from proving and verifying keys
   *
   * @param {ProvingKey} proving_key Proving key corresponding to a function in an Aleo program
   * @param {VerifyingKey} verifying_key Verifying key corresponding to a function in an Aleo program
   * @returns {KeyPair} Key pair object containing both the function proving and verifying keys
   */
  constructor(proving_key: ProvingKey, verifying_key: VerifyingKey);
  /**
   * Get the proving key. This method will remove the proving key from the key pair
   *
   * @returns {ProvingKey}
   */
  provingKey(): ProvingKey;
  /**
   * Get the verifying key. This method will remove the verifying key from the key pair
   *
   * @returns {VerifyingKey}
   */
  verifyingKey(): VerifyingKey;
}
export class Metadata {
  private constructor();
  free(): void;
  static baseUrl(): string;
  static bond_public(): Metadata;
  static bond_validator(): Metadata;
  static claim_unbond_public(): Metadata;
  static fee_private(): Metadata;
  static fee_public(): Metadata;
  static inclusion(): Metadata;
  static join(): Metadata;
  static set_validator_state(): Metadata;
  static split(): Metadata;
  static transfer_private(): Metadata;
  static transfer_private_to_public(): Metadata;
  static transfer_public(): Metadata;
  static transfer_public_as_signer(): Metadata;
  static transfer_public_to_private(): Metadata;
  static unbond_public(): Metadata;
  name: string;
  locator: string;
  prover: string;
  verifier: string;
  verifyingKey: string;
}
/**
 * An offline query object used to insert the global state root and state paths needed to create
 * a valid inclusion proof offline.
 */
export class OfflineQuery {
  free(): void;
  /**
   * Creates a new offline query object. The state root is required to be passed in as a string
   */
  constructor(block_height: number, state_root: string);
  /**
   * Add a new block height to the offline query object.
   */
  addBlockHeight(block_height: number): void;
  /**
   * Add a new state path to the offline query object.
   *
   * @param {string} commitment: The commitment corresponding to a record inpout
   * @param {string} state_path: The state path corresponding to the commitment
   */
  addStatePath(commitment: string, state_path: string): void;
  /**
   * Get a json string representation of the offline query object
   */
  toString(): string;
  /**
   * Create an offline query object from a json string representation
   */
  static fromString(s: string): OfflineQuery;
}
/**
 * SnarkVM Plaintext object. Plaintext is a fundamental monadic type used to represent Aleo
 * primitive types (boolean, field, group, i8, i16, i32, i64, i128, u8, u16, u32, u64, u128,
 * scalar, and signature), struct types, and array types.
 *
 * In the context of a web or NodeJS application, this type is useful for turning an Aleo type into
 * a JS value, object, or array that might be necessary for performing computations within the
 * application.
 *
 * @example
 * // Get the bond state of an existing address.
 * const bondState = await fetch(https://api.explorer.provable.com/v1/mainnet/program/credits.aleo/mapping/bond_state/aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f);
 * // Convert the bond state to a Plaintext object.
 * const bondStatePlaintext = Plaintext.fromString(bond_state);
 * // Convert the Plaintext object to a JS object.
 * const bondStateObject = bond_state_plaintext.toObject();
 * // Check if the bond state matches the expected object.
 * const expectedObject = { validator: "aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f", microcredits: 100000000u64 };
 * assert( JSON.stringify(bondStateObject) === JSON.stringify(expectedObject) );
 */
export class Plaintext {
  private constructor();
  free(): void;
  /**
   * Find plaintext member if the plaintext is a struct. Returns `null` if the plaintext is not
   * a struct or the member does not exist.
   *
   * @param {string} name The name of the plaintext member to find.
   *
   * @returns {Plaintext} The plaintext member.
   */
  find(name: string): Plaintext;
  /**
   * Encrypt a plaintext with an address and randomizer.
   */
  encrypt(address: Address, randomizer: Scalar): Ciphertext;
  /**
   * Encrypt a plaintext with a transition view key.
   */
  encryptSymmetric(transition_view_key: Field): Ciphertext;
  /**
   * Creates a plaintext object from a string representation of a plaintext.
   *
   * @param {string} plaintext The string representation of the plaintext.
   *
   * @returns {Plaintext} The plaintext object.
   */
  static fromString(plaintext: string): Plaintext;
  /**
   * Get a plaintext object from a series of bytes.
   *
   * @param {Uint8Array} bytes A left endian byte array representing the plaintext.
   *
   * @returns {Plaintext} The plaintext object.
   */
  static fromBytesLe(bytes: Uint8Array): Plaintext;
  /**
   * Generate a random plaintext element from a series of bytes.
   *
   * @param {Uint8Array} bytes A left endian byte array representing the plaintext.
   */
  toBytesLe(): Uint8Array;
  /**
   * Returns the string representation of the plaintext.
   *
   * @returns {string} The string representation of the plaintext.
   */
  toString(): string;
  /**
   * Gives the type of the plaintext.
   *
   * @returns {string} The type of the plaintext.
   */
  plaintextType(): string;
  /**
   * Attempt to convert the plaintext to a JS object.
   *
   * @returns {Object} The JS object representation of the plaintext.
   */
  toObject(): any;
}
/**
 * Private key of an Aleo account
 */
export class PrivateKey {
  free(): void;
  /**
   * Generate a new private key using a cryptographically secure random number generator
   *
   * @returns {PrivateKey}
   */
  constructor();
  /**
   * Get a private key from a series of unchecked bytes
   *
   * @param {Uint8Array} seed Unchecked 32 byte long Uint8Array acting as the seed for the private key
   * @returns {PrivateKey}
   */
  static from_seed_unchecked(seed: Uint8Array): PrivateKey;
  /**
   * Get a private key from a string representation of a private key
   *
   * @param {string} seed String representation of a private key
   * @returns {PrivateKey}
   */
  static from_string(private_key: string): PrivateKey;
  /**
   * Get a string representation of the private key. This function should be used very carefully
   * as it exposes the private key plaintext
   *
   * @returns {string} String representation of a private key
   */
  to_string(): string;
  /**
   * Get the view key corresponding to the private key
   *
   * @returns {ViewKey}
   */
  to_view_key(): ViewKey;
  /**
   * Get the address corresponding to the private key
   *
   * @returns {Address}
   */
  to_address(): Address;
  /**
   * Sign a message with the private key
   *
   * @param {Uint8Array} Byte array representing a message signed by the address
   * @returns {Signature} Signature generated by signing the message with the address
   */
  sign(message: Uint8Array): Signature;
  /**
   * Get a new randomly generated private key ciphertext using a secret. The secret is sensitive
   * and will be needed to decrypt the private key later, so it should be stored securely
   *
   * @param {string} secret Secret used to encrypt the private key
   * @returns {PrivateKeyCiphertext} Ciphertext representation of the private key
   */
  static newEncrypted(secret: string): PrivateKeyCiphertext;
  /**
   * Encrypt an existing private key with a secret. The secret is sensitive and will be needed to
   * decrypt the private key later, so it should be stored securely
   *
   * @param {string} secret Secret used to encrypt the private key
   * @returns {PrivateKeyCiphertext} Ciphertext representation of the private key
   */
  toCiphertext(secret: string): PrivateKeyCiphertext;
  /**
   * Get private key from a private key ciphertext and secret originally used to encrypt it
   *
   * @param {PrivateKeyCiphertext} ciphertext Ciphertext representation of the private key
   * @param {string} secret Secret originally used to encrypt the private key
   * @returns {PrivateKey} Private key
   */
  static fromPrivateKeyCiphertext(ciphertext: PrivateKeyCiphertext, secret: string): PrivateKey;
}
/**
 * Private Key in ciphertext form
 */
export class PrivateKeyCiphertext {
  private constructor();
  free(): void;
  /**
   * Encrypt a private key using a secret string. The secret is sensitive and will be needed to
   * decrypt the private key later, so it should be stored securely
   *
   * @param {PrivateKey} private_key Private key to encrypt
   * @param {string} secret Secret to encrypt the private key with
   * @returns {PrivateKeyCiphertext} Private key ciphertext
   */
  static encryptPrivateKey(private_key: PrivateKey, secret: string): PrivateKeyCiphertext;
  /**
   * Decrypts a private ciphertext using a secret string. This must be the same secret used to
   * encrypt the private key
   *
   * @param {string} secret Secret used to encrypt the private key
   * @returns {PrivateKey} Private key
   */
  decryptToPrivateKey(secret: string): PrivateKey;
  /**
   * Returns the ciphertext string
   *
   * @returns {string} Ciphertext string
   */
  toString(): string;
  /**
   * Creates a PrivateKeyCiphertext from a string
   *
   * @param {string} ciphertext Ciphertext string
   * @returns {PrivateKeyCiphertext} Private key ciphertext
   */
  static fromString(ciphertext: string): PrivateKeyCiphertext;
}
/**
 * Webassembly Representation of an Aleo program
 */
export class Program {
  private constructor();
  free(): void;
  /**
   * Create a program from a program string
   *
   * @param {string} program Aleo program source code
   * @returns {Program} Program object
   */
  static fromString(program: string): Program;
  /**
   * Get a string representation of the program
   *
   * @returns {string} String containing the program source code
   */
  toString(): string;
  /**
   * Determine if a function is present in the program
   *
   * @param {string} functionName Name of the function to check for
   * @returns {boolean} True if the program is valid, false otherwise
   */
  hasFunction(function_name: string): boolean;
  /**
   * Get javascript array of functions names in the program
   *
   * @returns {Array} Array of all function names present in the program
   *
   * @example
   * const expected_functions = [
   *   "mint",
   *   "transfer_private",
   *   "transfer_private_to_public",
   *   "transfer_public",
   *   "transfer_public_to_private",
   *   "join",
   *   "split",
   *   "fee"
   * ]
   *
   * const credits_program = aleo_wasm.Program.getCreditsProgram();
   * const credits_functions = credits_program.getFunctions();
   * console.log(credits_functions === expected_functions); // Output should be "true"
   */
  getFunctions(): Array<any>;
  /**
   * Get a javascript object representation of the function inputs and types. This can be used
   * to generate a web form to capture user inputs for an execution of a function.
   *
   * @param {string} function_name Name of the function to get inputs for
   * @returns {Array} Array of function inputs
   *
   * @example
   * const expected_inputs = [
   *     {
   *       type:"record",
   *       visibility:"private",
   *       record:"credits",
   *       members:[
   *         {
   *           name:"microcredits",
   *           type:"u64",
   *           visibility:"private"
   *         }
   *       ],
   *       register:"r0"
   *     },
   *     {
   *       type:"address",
   *       visibility:"private",
   *       register:"r1"
   *     },
   *     {
   *       type:"u64",
   *       visibility:"private",
   *       register:"r2"
   *     }
   * ];
   *
   * const credits_program = aleo_wasm.Program.getCreditsProgram();
   * const transfer_function_inputs = credits_program.getFunctionInputs("transfer_private");
   * console.log(transfer_function_inputs === expected_inputs); // Output should be "true"
   */
  getFunctionInputs(function_name: string): Array<any>;
  /**
   * Get a the list of a program's mappings and the names/types of their keys and values.
   *
   * @returns {Array} - An array of objects representing the mappings in the program
   * @example
   * const expected_mappings = [
   *    {
   *       name: "account",
   *       key_name: "owner",
   *       key_type: "address",
   *       value_name: "microcredits",
   *       value_type: "u64"
   *    }
   * ]
   *
   * const credits_program = aleo_wasm.Program.getCreditsProgram();
   * const credits_mappings = credits_program.getMappings();
   * console.log(credits_mappings === expected_mappings); // Output should be "true"
   */
  getMappings(): Array<any>;
  /**
   * Get a javascript object representation of a program record and its types
   *
   * @param {string} record_name Name of the record to get members for
   * @returns {Object} Object containing the record name, type, and members
   *
   * @example
   *
   * const expected_record = {
   *     type: "record",
   *     record: "Credits",
   *     members: [
   *       {
   *         name: "owner",
   *         type: "address",
   *         visibility: "private"
   *       },
   *       {
   *         name: "microcredits",
   *         type: "u64",
   *         visibility: "private"
   *       }
   *     ];
   *  };
   *
   * const credits_program = aleo_wasm.Program.getCreditsProgram();
   * const credits_record = credits_program.getRecordMembers("Credits");
   * console.log(credits_record === expected_record); // Output should be "true"
   */
  getRecordMembers(record_name: string): object;
  /**
   * Get a javascript object representation of a program struct and its types
   *
   * @param {string} struct_name Name of the struct to get members for
   * @returns {Array} Array containing the struct members
   *
   * @example
   *
   * const STRUCT_PROGRAM = "program token_issue.aleo;
   *
   * struct token_metadata:
   *     network as u32;
   *     version as u32;
   *
   * struct token:
   *     token_id as u32;
   *     metadata as token_metadata;
   *
   * function no_op:
   *    input r0 as u64;
   *    output r0 as u64;"
   *
   * const expected_struct_members = [
   *    {
   *      name: "token_id",
   *      type: "u32",
   *    },
   *    {
   *      name: "metadata",
   *      type: "struct",
   *      struct_id: "token_metadata",
   *      members: [
   *       {
   *         name: "network",
   *         type: "u32",
   *       }
   *       {
   *         name: "version",
   *         type: "u32",
   *       }
   *     ]
   *   }
   * ];
   *
   * const program = aleo_wasm.Program.fromString(STRUCT_PROGRAM);
   * const struct_members = program.getStructMembers("token");
   * console.log(struct_members === expected_struct_members); // Output should be "true"
   */
  getStructMembers(struct_name: string): Array<any>;
  /**
   * Get the credits.aleo program
   *
   * @returns {Program} The credits.aleo program
   */
  static getCreditsProgram(): Program;
  /**
   * Get the id of the program
   *
   * @returns {string} The id of the program
   */
  id(): string;
  /**
   * Get a unique address of the program
   *
   * @returns {Address} The address of the program
   */
  address(): Address;
  /**
   * Determine equality with another program
   *
   * @param {Program} other The other program to compare
   * @returns {boolean} True if the programs are equal, false otherwise
   */
  isEqual(other: Program): boolean;
  /**
   * Get program_imports
   *
   * @returns {Array} The program imports
   *
   * @example
   *
   * const DOUBLE_TEST = "import multiply_test.aleo;
   *
   * program double_test.aleo;
   *
   * function double_it:
   *     input r0 as u32.private;
   *     call multiply_test.aleo/multiply 2u32 r0 into r1;
   *     output r1 as u32.private;";
   *
   * const expected_imports = [
   *    "multiply_test.aleo"
   * ];
   *
   * const program = aleo_wasm.Program.fromString(DOUBLE_TEST_PROGRAM);
   * const imports = program.getImports();
   * console.log(imports === expected_imports); // Output should be "true"
   */
  getImports(): Array<any>;
}
export class ProgramManager {
  private constructor();
  free(): void;
  /**
   * Deploy an Aleo program
   *
   * @param private_key The private key of the sender
   * @param program The source code of the program being deployed
   * @param imports A javascript object holding the source code of any imported programs in the
   * form \{"program_name1": "program_source_code", "program_name2": "program_source_code", ..\}.
   * Note that all imported programs must be deployed on chain before the main program in order
   * for the deployment to succeed
   * @param fee_credits The amount of credits to pay as a fee
   * @param fee_record The record to spend the fee from
   * @param url The url of the Aleo network node to send the transaction to
   * @param imports (optional) Provide a list of imports to use for the program deployment in the
   * form of a javascript object where the keys are a string of the program name and the values
   * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
   * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
   * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
   * @returns {Transaction}
   */
  static buildDeploymentTransaction(private_key: PrivateKey, program: string, fee_credits: number, fee_record?: RecordPlaintext | null, url?: string | null, imports?: object | null, fee_proving_key?: ProvingKey | null, fee_verifying_key?: VerifyingKey | null, offline_query?: OfflineQuery | null): Promise<Transaction>;
  /**
   * Estimate the fee for a program deployment
   *
   * Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
   *
   * @param program The source code of the program being deployed
   * @param imports (optional) Provide a list of imports to use for the deployment fee estimation
   * in the form of a javascript object where the keys are a string of the program name and the values
   * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
   * @returns {u64}
   */
  static estimateDeploymentFee(program: string, imports?: object | null): Promise<bigint>;
  /**
   * Estimate the component of the deployment cost which comes from the fee for the program name.
   * Note that this cost does not represent the entire cost of deployment. It is additional to
   * the cost of the size (in bytes) of the deployment.
   *
   * Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
   *
   * @param name The name of the program to be deployed
   * @returns {u64}
   */
  static estimateProgramNameCost(name: string): bigint;
  /**
   * Execute an arbitrary function locally
   *
   * @param {PrivateKey} private_key The private key of the sender
   * @param {string} program The source code of the program being executed
   * @param {string} function The name of the function to execute
   * @param {Array} inputs A javascript array of inputs to the function
   * @param {boolean} prove_execution If true, the execution will be proven and an execution object
   * containing the proof and the encrypted inputs and outputs needed to verify the proof offline
   * will be returned.
   * @param {boolean} cache Cache the proving and verifying keys in the Execution response.
   * If this is set to 'true' the keys synthesized will be stored in the Execution Response
   * and the `ProvingKey` and `VerifyingKey` can be retrieved from the response via the `.getKeys()`
   * method.
   * @param {Object | undefined} imports (optional) Provide a list of imports to use for the function execution in the
   * form of a javascript object where the keys are a string of the program name and the values
   * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
   * @param {ProvingKey | undefined} proving_key (optional) Provide a verifying key to use for the function execution
   * @param {VerifyingKey | undefined} verifying_key (optional) Provide a verifying key to use for the function execution
   */
  static executeFunctionOffline(private_key: PrivateKey, program: string, _function: string, inputs: Array<any>, prove_execution: boolean, cache: boolean, imports?: object | null, proving_key?: ProvingKey | null, verifying_key?: VerifyingKey | null, url?: string | null, offline_query?: OfflineQuery | null): Promise<ExecutionResponse>;
  /**
   * Execute Aleo function and create an Aleo execution transaction
   *
   * @param private_key The private key of the sender
   * @param program The source code of the program being executed
   * @param function The name of the function to execute
   * @param inputs A javascript array of inputs to the function
   * @param fee_credits The amount of credits to pay as a fee
   * @param fee_record The record to spend the fee from
   * @param url The url of the Aleo network node to send the transaction to
   * If this is set to 'true' the keys synthesized (or passed in as optional parameters via the
   * `proving_key` and `verifying_key` arguments) will be stored in the ProgramManager's memory
   * and used for subsequent transactions. If this is set to 'false' the proving and verifying
   * keys will be deallocated from memory after the transaction is executed.
   * @param imports (optional) Provide a list of imports to use for the function execution in the
   * form of a javascript object where the keys are a string of the program name and the values
   * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
   * @param proving_key (optional) Provide a verifying key to use for the function execution
   * @param verifying_key (optional) Provide a verifying key to use for the function execution
   * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
   * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
   * @returns {Transaction}
   */
  static buildExecutionTransaction(private_key: PrivateKey, program: string, _function: string, inputs: Array<any>, fee_credits: number, fee_record?: RecordPlaintext | null, url?: string | null, imports?: object | null, proving_key?: ProvingKey | null, verifying_key?: VerifyingKey | null, fee_proving_key?: ProvingKey | null, fee_verifying_key?: VerifyingKey | null, offline_query?: OfflineQuery | null): Promise<Transaction>;
  /**
   * Estimate Fee for Aleo function execution. Note if "cache" is set to true, the proving and
   * verifying keys will be stored in the ProgramManager's memory and used for subsequent
   * program executions.
   *
   * Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
   *
   * @param private_key The private key of the sender
   * @param program The source code of the program to estimate the execution fee for
   * @param function The name of the function to execute
   * @param inputs A javascript array of inputs to the function
   * @param url The url of the Aleo network node to send the transaction to
   * @param imports (optional) Provide a list of imports to use for the fee estimation in the
   * form of a javascript object where the keys are a string of the program name and the values
   * are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
   * @param proving_key (optional) Provide a verifying key to use for the fee estimation
   * @param verifying_key (optional) Provide a verifying key to use for the fee estimation
   * @returns {u64} Fee in microcredits
   */
  static estimateExecutionFee(private_key: PrivateKey, program: string, _function: string, inputs: Array<any>, url?: string | null, imports?: object | null, proving_key?: ProvingKey | null, verifying_key?: VerifyingKey | null, offline_query?: OfflineQuery | null): Promise<bigint>;
  /**
   * Estimate the finalize fee component for executing a function. This fee is additional to the
   * size of the execution of the program in bytes. If the function does not have a finalize
   * step, then the finalize fee is 0.
   *
   * Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
   *
   * @param program The program containing the function to estimate the finalize fee for
   * @param function The function to estimate the finalize fee for
   * @returns {u64} Fee in microcredits
   */
  static estimateFinalizeFee(program: string, _function: string): bigint;
  /**
   * Join two records together to create a new record with an amount of credits equal to the sum
   * of the credits of the two original records
   *
   * @param private_key The private key of the sender
   * @param record_1 The first record to combine
   * @param record_2 The second record to combine
   * @param fee_credits The amount of credits to pay as a fee
   * @param fee_record The record to spend the fee from
   * @param url The url of the Aleo network node to send the transaction to
   * @param join_proving_key (optional) Provide a proving key to use for the join function
   * @param join_verifying_key (optional) Provide a verifying key to use for the join function
   * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
   * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
   * @returns {Transaction} Transaction object
   */
  static buildJoinTransaction(private_key: PrivateKey, record_1: RecordPlaintext, record_2: RecordPlaintext, fee_credits: number, fee_record?: RecordPlaintext | null, url?: string | null, join_proving_key?: ProvingKey | null, join_verifying_key?: VerifyingKey | null, fee_proving_key?: ProvingKey | null, fee_verifying_key?: VerifyingKey | null, offline_query?: OfflineQuery | null): Promise<Transaction>;
  /**
   * Split an Aleo credits record into two separate records. This function does not require a fee.
   *
   * @param private_key The private key of the sender
   * @param split_amount The amount of the credit split. This amount will be subtracted from the
   * value of the record and two new records will be created with the split amount and the remainder
   * @param amount_record The record to split
   * @param url The url of the Aleo network node to send the transaction to
   * @param split_proving_key (optional) Provide a proving key to use for the split function
   * @param split_verifying_key (optional) Provide a verifying key to use for the split function
   * @returns {Transaction} Transaction object
   */
  static buildSplitTransaction(private_key: PrivateKey, split_amount: number, amount_record: RecordPlaintext, url?: string | null, split_proving_key?: ProvingKey | null, split_verifying_key?: VerifyingKey | null, offline_query?: OfflineQuery | null): Promise<Transaction>;
  /**
   * Send credits from one Aleo account to another
   *
   * @param private_key The private key of the sender
   * @param amount_credits The amount of credits to send
   * @param recipient The recipient of the transaction
   * @param transfer_type The type of the transfer (options: "private", "public", "private_to_public", "public_to_private")
   * @param amount_record The record to fund the amount from
   * @param fee_credits The amount of credits to pay as a fee
   * @param fee_record The record to spend the fee from
   * @param url The url of the Aleo network node to send the transaction to
   * @param transfer_verifying_key (optional) Provide a verifying key to use for the transfer
   * function
   * @param fee_proving_key (optional) Provide a proving key to use for the fee execution
   * @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
   * @returns {Transaction}
   */
  static buildTransferTransaction(private_key: PrivateKey, amount_credits: number, recipient: string, transfer_type: string, amount_record: RecordPlaintext | null | undefined, fee_credits: number, fee_record?: RecordPlaintext | null, url?: string | null, transfer_proving_key?: ProvingKey | null, transfer_verifying_key?: VerifyingKey | null, fee_proving_key?: ProvingKey | null, fee_verifying_key?: VerifyingKey | null, offline_query?: OfflineQuery | null): Promise<Transaction>;
  /**
   * Synthesize proving and verifying keys for a program
   *
   * @param program {string} The program source code of the program to synthesize keys for
   * @param function_id {string} The function to synthesize keys for
   * @param inputs {Array} The inputs to the function
   * @param imports {Object | undefined} The imports for the program
   */
  static synthesizeKeyPair(private_key: PrivateKey, program: string, function_id: string, inputs: Array<any>, imports?: object | null): Promise<KeyPair>;
}
/**
 * Proving key for a function within an Aleo program
 */
export class ProvingKey {
  private constructor();
  free(): void;
  /**
   * Verify if the proving key is for the bond_public function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("bond_public_proving_key.bin");
   * provingKey.isBondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the bond_public function, false if otherwise
   */
  isBondPublicProver(): boolean;
  /**
   * Verify if the proving key is for the bond_validator function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("bond_validator_proving_key.bin");
   * provingKey.isBondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the bond_validator function, false if otherwise
   */
  isBondValidatorProver(): boolean;
  /**
   * Verify if the proving key is for the claim_unbond function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("claim_unbond_proving_key.bin");
   * provingKey.isClaimUnbondProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the claim_unbond function, false if otherwise
   */
  isClaimUnbondPublicProver(): boolean;
  /**
   * Verify if the proving key is for the fee_private function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("fee_private_proving_key.bin");
   * provingKey.isFeePrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the fee_private function, false if otherwise
   */
  isFeePrivateProver(): boolean;
  /**
   * Verify if the proving key is for the fee_public function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("fee_public_proving_key.bin");
   * provingKey.isFeePublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the fee_public function, false if otherwise
   */
  isFeePublicProver(): boolean;
  /**
   * Verify if the proving key is for the inclusion function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("inclusion_proving_key.bin");
   * provingKey.isInclusionProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the inclusion function, false if otherwise
   */
  isInclusionProver(): boolean;
  /**
   * Verify if the proving key is for the join function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("join_proving_key.bin");
   * provingKey.isJoinProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the join function, false if otherwise
   */
  isJoinProver(): boolean;
  /**
   * Verify if the proving key is for the set_validator_state function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("set_validator_set_proving_key.bin");
   * provingKey.isSetValidatorStateProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the set_validator_state function, false if otherwise
   */
  isSetValidatorStateProver(): boolean;
  /**
   * Verify if the proving key is for the split function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("split_proving_key.bin");
   * provingKey.isSplitProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the split function, false if otherwise
   */
  isSplitProver(): boolean;
  /**
   * Verify if the proving key is for the transfer_private function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("transfer_private_proving_key.bin");
   * provingKey.isTransferPrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the transfer_private function, false if otherwise
   */
  isTransferPrivateProver(): boolean;
  /**
   * Verify if the proving key is for the transfer_private_to_public function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("transfer_private_to_public_proving_key.bin");
   * provingKey.isTransferPrivateToPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the transfer_private_to_public function, false if otherwise
   */
  isTransferPrivateToPublicProver(): boolean;
  /**
   * Verify if the proving key is for the transfer_public function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("transfer_public_proving_key.bin");
   * provingKey.isTransferPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the transfer_public function, false if otherwise
   */
  isTransferPublicProver(): boolean;
  /**
   * Verify if the proving key is for the transfer_public_as_signer function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("transfer_public_as_signer_proving_key.bin");
   * provingKey.isTransferPublicAsSignerProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the transfer_public function, false if otherwise
   */
  isTransferPublicAsSignerProver(): boolean;
  /**
   * Verify if the proving key is for the transfer_public_to_private function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("transfer_public_to_private_proving_key.bin");
   * provingKey.isTransferPublicToPrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the transfer_public_to_private function, false if otherwise
   */
  isTransferPublicToPrivateProver(): boolean;
  /**
   * Verify if the proving key is for the unbond_public function
   *
   * @example
   * const provingKey = ProvingKey.fromBytes("unbond_public.bin");
   * provingKey.isUnbondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
   *
   * @returns {boolean} returns true if the proving key is for the unbond_public_prover function, false if otherwise
   */
  isUnbondPublicProver(): boolean;
  /**
   * Return the checksum of the proving key
   *
   * @returns {string} Checksum of the proving key
   */
  checksum(): string;
  /**
   * Create a copy of the proving key
   *
   * @returns {ProvingKey} A copy of the proving key
   */
  copy(): ProvingKey;
  /**
   * Construct a new proving key from a byte array
   *
   * @param {Uint8Array} bytes Byte array representation of a proving key
   * @returns {ProvingKey}
   */
  static fromBytes(bytes: Uint8Array): ProvingKey;
  /**
   * Create a proving key from string
   *
   * @param {string} String representation of the proving key
   */
  static fromString(string: string): ProvingKey;
  /**
   * Return the byte representation of a proving key
   *
   * @returns {Uint8Array} Byte array representation of a proving key
   */
  toBytes(): Uint8Array;
  /**
   * Get a string representation of the proving key
   *
   * @returns {string} String representation of the proving key
   */
  toString(): string;
}
/**
 * Encrypted Aleo record
 */
export class RecordCiphertext {
  private constructor();
  free(): void;
  /**
   * Create a record ciphertext from a string
   *
   * @param {string} record String representation of a record ciphertext
   * @returns {RecordCiphertext} Record ciphertext
   */
  static fromString(record: string): RecordCiphertext;
  /**
   * Return the string reprensentation of the record ciphertext
   *
   * @returns {string} String representation of the record ciphertext
   */
  toString(): string;
  /**
   * Decrypt the record ciphertext into plaintext using the view key. The record will only
   * decrypt if the record was encrypted by the account corresponding to the view key
   *
   * @param {ViewKey} view_key View key used to decrypt the ciphertext
   * @returns {RecordPlaintext} Record plaintext object
   */
  decrypt(view_key: ViewKey): RecordPlaintext;
  /**
   * Determines if the account corresponding to the view key is the owner of the record
   *
   * @param {ViewKey} view_key View key used to decrypt the ciphertext
   * @returns {boolean}
   */
  isOwner(view_key: ViewKey): boolean;
  /**
   * Get the tag of the record using the graph key.
   *
   * @param {GraphKey} graph key of the account associatd with the record.
   * @param {Field} commitment of the record.
   *
   * @returns {Field} tag of the record.
   */
  static tag(graph_key: GraphKey, commitment: Field): Field;
}
/**
 * Plaintext representation of an Aleo record
 */
export class RecordPlaintext {
  private constructor();
  free(): void;
  commitment(program_id: string, record_name: string): Field;
  /**
   * Return a record plaintext from a string.
   *
   * @param {string} record String representation of a plaintext representation of an Aleo record
   * @returns {RecordPlaintext} Record plaintext
   */
  static fromString(record: string): RecordPlaintext;
  getMember(input: string): Plaintext;
  /**
   * Get the owner of the record.
   */
  owner(): Address;
  /**
   * Get a representation of a record as a javascript object for usage in client side
   * computations. Note that this is not a reversible operation and exists for the convenience
   * of discovering and using properties of the record.
   *
   * The conversion guide is as follows:
   * - u8, u16, u32, i8, i16 i32 --> Number
   * - u64, u128, i64, i128 --> BigInt
   * - Address, Field, Group, Scalar --> String.
   *
   * Address, Field, Group, and Scalar will all be converted to their bech32 string
   * representation. These string representations can be converted back to their respective wasm
   * types using the fromString method on the Address, Field, Group, and Scalar objects in this
   * library.
   *
   * @example
   * # Create a wasm record from a record string.
   * let record_plaintext_wasm = RecordPlainext.from_string("{
   *   owner: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
   *   metadata: {
   *     player1: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
   *     player2: aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6.private,
   *     nonce: 660310649780728486489183263981322848354071976582883879926426319832534836534field.private
   *   },
   *   id: 1953278585719525811355617404139099418855053112960441725284031425961000152405field.private,
   *   positions: 50794271u64.private,
   *   attempts: 0u64.private,
   *   hits: 0u64.private,
   *   _nonce: 5668100912391182624073500093436664635767788874314097667746354181784048204413group.public
   * }");
   *
   * let expected_object = {
   *   owner: "aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48",
   *   metadata: {
   *     player1: "aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48",
   *     player2: "aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6",
   *     nonce: "660310649780728486489183263981322848354071976582883879926426319832534836534field"
   *   },
   *   id: "1953278585719525811355617404139099418855053112960441725284031425961000152405field",
   *   positions: 50794271,
   *   attempts: 0,
   *   hits: 0,
   *   _nonce: "5668100912391182624073500093436664635767788874314097667746354181784048204413group"
   * };
   *
   * # Create the expected object
   * let record_plaintext_object = record_plaintext_wasm.to_js_object();
   * assert(JSON.stringify(record_plaintext_object) == JSON.stringify(expected_object));
   *
   * @returns {Object} Javascript object representation of the record
   */
  toJsObject(): object;
  /**
   * Returns the record plaintext string
   *
   * @returns {string} String representation of the record plaintext
   */
  toString(): string;
  /**
   * Returns the amount of microcredits in the record
   *
   * @returns {u64} Amount of microcredits in the record
   */
  microcredits(): bigint;
  /**
   * Returns the nonce of the record. This can be used to uniquely identify a record.
   *
   * @returns {string} Nonce of the record
   */
  nonce(): string;
  /**
   * Attempt to get the serial number of a record to determine whether or not is has been spent
   *
   * @param {PrivateKey} private_key Private key of the account that owns the record
   * @param {string} program_id Program ID of the program that the record is associated with
   * @param {string} record_name Name of the record
   *
   * @returns {string} Serial number of the record
   */
  serialNumberString(private_key: PrivateKey, program_id: string, record_name: string): string;
  /**
   * Get the tag of the record using the graph key.
   */
  tag(graph_key: GraphKey, commitment: Field): Field;
}
/**
 * Scalar field element.
 */
export class Scalar {
  private constructor();
  free(): void;
  /**
   * Returns the string representation of the group.
   */
  toString(): string;
  /**
   * Create a plaintext element from a group element.
   */
  toPlaintext(): Plaintext;
  /**
   * Creates a group object from a string representation of a group.
   */
  static fromString(group: string): Scalar;
  /**
   * Generate a random group element.
   */
  static random(): Scalar;
  /**
   * Add two scalar elements.
   */
  add(other: Scalar): Scalar;
  /**
   * Subtract two scalar elements.
   */
  subtract(other: Scalar): Scalar;
  /**
   * Multiply two scalar elements.
   */
  multiply(other: Scalar): Scalar;
  /**
   * Divide two scalar elements.
   */
  divide(other: Scalar): Scalar;
  /**
   * Double the scalar element.
   */
  double(): Scalar;
  /**
   * Power of a scalar element.
   */
  pow(other: Scalar): Scalar;
  /**
   * Invert the scalar element.
   */
  inverse(): Scalar;
  /**
   * Creates a one valued element of the scalar field.
   */
  static one(): Scalar;
  /**
   * Creates a zero valued element of the scalar field
   */
  static zero(): Scalar;
  /**
   * Check if one scalar element equals another.
   */
  equals(other: Scalar): boolean;
}
/**
 * Cryptographic signature of a message signed by an Aleo account
 */
export class Signature {
  private constructor();
  free(): void;
  /**
   * Sign a message with a private key
   *
   * @param {PrivateKey} private_key The private key to sign the message with
   * @param {Uint8Array} message Byte representation of the message to sign
   * @returns {Signature} Signature of the message
   */
  static sign(private_key: PrivateKey, message: Uint8Array): Signature;
  /**
   * Get an address from a signature.
   *
   * @returns {Address} Address object
   */
  to_address(): Address;
  /**
   * Get the challenge of a signature.
   */
  challenge(): Scalar;
  /**
   * Get the response of a signature.
   */
  response(): Scalar;
  /**
   * Verify a signature of a message with an address
   *
   * @param {Address} address The address to verify the signature with
   * @param {Uint8Array} message Byte representation of the message to verify
   * @returns {boolean} True if the signature is valid, false otherwise
   */
  verify(address: Address, message: Uint8Array): boolean;
  /**
   * Get a signature from a string representation of a signature
   *
   * @param {string} signature String representation of a signature
   * @returns {Signature} Signature
   */
  static from_string(signature: string): Signature;
  /**
   * Get a string representation of a signature
   *
   * @returns {string} String representation of a signature
   */
  to_string(): string;
}
/**
 * Webassembly Representation of an Aleo transaction
 *
 * This object is created when generating an on-chain function deployment or execution and is the
 * object that should be submitted to the Aleo Network in order to deploy or execute a function.
 */
export class Transaction {
  private constructor();
  free(): void;
  /**
   * Create a transaction from a string
   *
   * @param {string} transaction String representation of a transaction
   * @returns {Transaction}
   */
  static fromString(transaction: string): Transaction;
  /**
   * Create a transaction from a Uint8Array of left endian bytes.
   *
   * @param {Uint8Array} Uint8Array of left endian bytes encoding a Transaction.
   * @returns {Transaction}
   */
  static fromBytesLe(bytes: Uint8Array): Transaction;
  /**
   * Get the transaction as a string. If you want to submit this transaction to the Aleo Network
   * this function will create the string that should be submitted in the `POST` data.
   *
   * @returns {string} String representation of the transaction
   */
  toString(): string;
  /**
   * Get the transaction as a Uint8Array of left endian bytes.
   *
   * @returns {Uint8Array} Uint8Array representation of the transaction
   */
  toBytesLe(): Uint8Array;
  /**
   * Returns true if the transaction contains the given serial number.
   *
   * @param {boolean} True if the transaction contains the given serial number.
   */
  constainsSerialNumber(serial_number: Field): boolean;
  /**
   * Returns true if the transaction contains the given commitment.
   *
   * @param {boolean} True if the transaction contains the given commitment.
   */
  constainsCommitment(commitment: Field): boolean;
  /**
   * Find a record in the transaction by the record's commitment.
   */
  findRecord(commitment: Field): RecordCiphertext | undefined;
  /**
   * Returns the transaction's base fee.
   */
  baseFeeAmount(): bigint;
  /**
   * Returns the transaction's total fee.
   */
  feeAmount(): bigint;
  /**
   * Returns the transaction's priority fee.
   *
   * returns {bigint} The transaction's priority fee.
   */
  priorityFeeAmount(): bigint;
  /**
   * Returns true if the transaction is a deployment transaction.
   *
   * @returns {boolean} True if the transaction is a deployment transaction
   */
  isDeploy(): boolean;
  /**
   * Returns true if the transaction is an execution transaction.
   *
   * @returns {boolean} True if the transaction is an execution transaction
   */
  isExecute(): boolean;
  /**
   * Returns true if the transaction is a fee transaction.
   *
   * @returns {boolean} True if the transaction is a fee transaction
   */
  isFee(): boolean;
  /**
   * Returns the program deployed within the transaction if the transaction is a deployment
   * transaction.
   *
   * @returns {Program | undefined} The program deployed within the transaction.
   */
  deployedProgram(): Program | undefined;
  /**
   * Returns the execution within the transaction (if present).
   *
   * @returns {Execution | undefined} The execution within the transaction.
   */
  execution(): Execution | undefined;
  /**
   * Get the record plaintext present in a transaction owned by a specific view key.
   *
   * @param {ViewKey} view_key View key used to decrypt the ciphertext
   *
   * @returns {Array<RecordPlaintext>} Array of record plaintext objects
   */
  ownedRecords(view_key: ViewKey): Array<any>;
  /**
   * Get the records present in a transaction and their commitments.
   *
   * @returns {Array<{commitment: Field, record: RecordCiphertext}>} Array of record ciphertext objects
   */
  records(): Array<any>;
  /**
   * Get a summary of the transaction within a javascript object.
   *
   * If the transaction is an execution transaction, this function will return a list of the
   * transitions and their inputs and outputs.
   *
   * If the transaction is a deployment transaction, this function will return the program id and
   * a list of the functions and their verifying keys, constraint, and variable counts.
   *
   * @param {boolean} convert_to_js If true the inputs and outputs will be converted to JS objects,
   * if false the inputs and outputs will be in wasm format.
   *
   * @returns {Object} Transaction summary
   */
  summary(convert_to_js: boolean): object;
  /**
   * Get the id of the transaction. This is the merkle root of the transaction's inclusion proof.
   *
   * This value can be used to query the status of the transaction on the Aleo Network to see
   * if it was successful. If successful, the transaction will be included in a block and this
   * value can be used to lookup the transaction data on-chain.
   *
   * @returns {string} TransactionId
   */
  id(): string;
  /**
   * Get the
   * Get the type of the transaction (will return "deploy" or "execute")
   *
   * @returns {string} Transaction type
   */
  transactionType(): string;
  /**
   * Get the transitions in a transaction.
   *
   * @returns {Array<Transition>} Array of transition objects
   */
  transitions(): Array<any>;
  /**
   * Get the verifying keys in a transaction.
   *
   * @returns {Array<Object>} Array of verifying keys.
   */
  verifyingKeys(): Array<any>;
}
export class Transition {
  private constructor();
  free(): void;
  /**
   * Get the transition ID
   *
   * @returns {string} The transition ID
   */
  id(): string;
  /**
   * Create a transition from a string
   *
   * @param {string} transition String representation of a transition
   * @returns {Transition}
   */
  static fromString(transition: string): Transition;
  /**
   * Create a transition from a Uint8Array of left endian bytes.
   *
   * @param {Uint8Array} Uint8Array of left endian bytes encoding a Transition.
   * @returns {Transition}
   */
  static fromBytesLe(bytes: Uint8Array): Transition;
  /**
   * Get the transition as a string. If you want to submit this transition to the Aleo Network
   * this function will create the string that should be submitted in the `POST` data.
   *
   * @returns {string} String representation of the transition
   */
  toString(): string;
  /**
   * Get the transition as a Uint8Array of left endian bytes.
   *
   * @returns {Uint8Array} Uint8Array representation of the transition
   */
  toBytesLe(): Uint8Array;
  /**
   * Get the program ID of the transition.
   */
  programId(): string;
  /**
   * Get the function name of the transition.
   */
  functionName(): string;
  /**
   * Returns true if the transition contains the given commitment.
   *
   * @param {boolean} True if the transition contains the given commitment.
   */
  containsCommitment(commitment: Field): boolean;
  /**
   * Check if the transition contains a serial number.
   *
   * @param {Field} serial_number The serial number to check for
   *
   * @returns {bool} True if the transition contains a serial number, false otherwise
   */
  containsSerialNumber(serial_number: Field): boolean;
  /**
   * Find a record in the transition by the record's commitment.
   */
  findRecord(commitment: Field): RecordCiphertext | undefined;
  /**
   * Get the record plaintext present in a transition owned by a specific view key.
   *
   * @param {ViewKey} view_key The view key of the record owner.
   *
   * @returns {Array<RecordPlaintext>} Array of record plaintext objects
   */
  ownedRecords(view_key: ViewKey): Array<any>;
  /**
   * Get the records present in a transition and their commitments.
   *
   * @returns {Array<{commitment: Field, record: RecordCiphertext}>} Array of record ciphertext objects
   */
  records(): Array<any>;
  /**
   * Get the inputs of the transition.
   *
   * @param {bool} convert_to_js If true the inputs will be converted to JS objects, if false
   * the inputs will be in wasm format.
   *
   * @returns {Array} Array of inputs
   */
  inputs(convert_to_js: boolean): Array<any>;
  /**
   * Get the outputs of the transition.
   *
   * @param {bool} convert_to_js If true the outputs will be converted to JS objects, if false
   * the outputs will be in wasm format.
   *
   * @returns {Array} Array of outputs
   */
  outputs(convert_to_js: boolean): Array<any>;
  /**
   * Get the transition public key of the transition.
   */
  tpk(): Group;
  /**
   * Get the transition commitment of the transition.
   */
  tcm(): Field;
  /**
   * Get the transition signer commitment of the transition.
   */
  scm(): Field;
}
/**
 * Verifying key for a function within an Aleo program
 */
export class VerifyingKey {
  private constructor();
  free(): void;
  /**
   * Returns the verifying key for the bond_public function
   *
   * @returns {VerifyingKey} Verifying key for the bond_public function
   */
  static bondPublicVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the bond_validator function
   *
   * @returns {VerifyingKey} Verifying key for the bond_validator function
   */
  static bondValidatorVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the claim_delegator function
   *
   * @returns {VerifyingKey} Verifying key for the claim_unbond_public function
   */
  static claimUnbondPublicVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the fee_private function
   *
   * @returns {VerifyingKey} Verifying key for the fee_private function
   */
  static feePrivateVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the fee_public function
   *
   * @returns {VerifyingKey} Verifying key for the fee_public function
   */
  static feePublicVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the inclusion function
   *
   * @returns {VerifyingKey} Verifying key for the inclusion function
   */
  static inclusionVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the join function
   *
   * @returns {VerifyingKey} Verifying key for the join function
   */
  static joinVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the set_validator_state function
   *
   * @returns {VerifyingKey} Verifying key for the set_validator_state function
   */
  static setValidatorStateVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the split function
   *
   * @returns {VerifyingKey} Verifying key for the split function
   */
  static splitVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the transfer_private function
   *
   * @returns {VerifyingKey} Verifying key for the transfer_private function
   */
  static transferPrivateVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the transfer_private_to_public function
   *
   * @returns {VerifyingKey} Verifying key for the transfer_private_to_public function
   */
  static transferPrivateToPublicVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the transfer_public function
   *
   * @returns {VerifyingKey} Verifying key for the transfer_public function
   */
  static transferPublicVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the transfer_public_as_signer function
   *
   * @returns {VerifyingKey} Verifying key for the transfer_public_as_signer function
   */
  static transferPublicAsSignerVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the transfer_public_to_private function
   *
   * @returns {VerifyingKey} Verifying key for the transfer_public_to_private function
   */
  static transferPublicToPrivateVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the unbond_public function
   *
   * @returns {VerifyingKey} Verifying key for the unbond_public function
   */
  static unbondPublicVerifier(): VerifyingKey;
  /**
   * Returns the verifying key for the bond_public function
   *
   * @returns {VerifyingKey} Verifying key for the bond_public function
   */
  isBondPublicVerifier(): boolean;
  /**
   * Returns the verifying key for the bond_validator function
   *
   * @returns {VerifyingKey} Verifying key for the bond_validator function
   */
  isBondValidatorVerifier(): boolean;
  /**
   * Verifies the verifying key is for the claim_delegator function
   *
   * @returns {bool}
   */
  isClaimUnbondPublicVerifier(): boolean;
  /**
   * Verifies the verifying key is for the fee_private function
   *
   * @returns {bool}
   */
  isFeePrivateVerifier(): boolean;
  /**
   * Verifies the verifying key is for the fee_public function
   *
   * @returns {bool}
   */
  isFeePublicVerifier(): boolean;
  /**
   * Verifies the verifying key is for the inclusion function
   *
   * @returns {bool}
   */
  isInclusionVerifier(): boolean;
  /**
   * Verifies the verifying key is for the join function
   *
   * @returns {bool}
   */
  isJoinVerifier(): boolean;
  /**
   * Verifies the verifying key is for the set_validator_state function
   *
   * @returns {bool}
   */
  isSetValidatorStateVerifier(): boolean;
  /**
   * Verifies the verifying key is for the split function
   *
   * @returns {bool}
   */
  isSplitVerifier(): boolean;
  /**
   * Verifies the verifying key is for the transfer_private function
   *
   * @returns {bool}
   */
  isTransferPrivateVerifier(): boolean;
  /**
   * Verifies the verifying key is for the transfer_private_to_public function
   *
   * @returns {bool}
   */
  isTransferPrivateToPublicVerifier(): boolean;
  /**
   * Verifies the verifying key is for the transfer_public function
   *
   * @returns {bool}
   */
  isTransferPublicVerifier(): boolean;
  /**
   * Verifies the verifying key is for the transfer_public_as_signer function
   *
   * @returns {bool}
   */
  isTransferPublicAsSignerVerifier(): boolean;
  /**
   * Verifies the verifying key is for the transfer_public_to_private function
   *
   * @returns {bool}
   */
  isTransferPublicToPrivateVerifier(): boolean;
  /**
   * Verifies the verifying key is for the unbond_public function
   *
   * @returns {bool}
   */
  isUnbondPublicVerifier(): boolean;
  /**
   * Get the checksum of the verifying key
   *
   * @returns {string} Checksum of the verifying key
   */
  checksum(): string;
  /**
   * Create a copy of the verifying key
   *
   * @returns {VerifyingKey} A copy of the verifying key
   */
  copy(): VerifyingKey;
  /**
   * Construct a new verifying key from a byte array
   *
   * @param {Uint8Array} bytes Byte representation of a verifying key
   * @returns {VerifyingKey}
   */
  static fromBytes(bytes: Uint8Array): VerifyingKey;
  /**
   * Create a verifying key from string
   *
   * @param {String} string String representation of a verifying key
   * @returns {VerifyingKey}
   */
  static fromString(string: string): VerifyingKey;
  /**
   * Create a byte array from a verifying key
   *
   * @returns {Uint8Array} Byte representation of a verifying key
   */
  toBytes(): Uint8Array;
  /**
   * Get a string representation of the verifying key
   *
   * @returns {String} String representation of the verifying key
   */
  toString(): string;
}
export class ViewKey {
  private constructor();
  free(): void;
  /**
   * Create a new view key from a private key
   *
   * @param {PrivateKey} private_key Private key
   * @returns {ViewKey} View key
   */
  static from_private_key(private_key: PrivateKey): ViewKey;
  /**
   * Create a new view key from a string representation of a view key
   *
   * @param {string} view_key String representation of a view key
   * @returns {ViewKey} View key
   */
  static from_string(view_key: string): ViewKey;
  /**
   * Get a string representation of a view key
   *
   * @returns {string} String representation of a view key
   */
  to_string(): string;
  /**
   * Get the address corresponding to a view key
   *
   * @returns {Address} Address
   */
  to_address(): Address;
  /**
   * Get the underlying scalar of a view key.
   */
  to_scalar(): Scalar;
  /**
   * Decrypt a record ciphertext with a view key
   *
   * @param {string} ciphertext String representation of a record ciphertext
   * @returns {string} String representation of a record plaintext
   */
  decrypt(ciphertext: string): string;
}