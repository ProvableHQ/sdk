import { bech32m } from "@scure/base";
import { ZERO_ADDRESS } from "./constants";
import { Poseidon4 } from "./crypto";
import { Field, Plaintext } from "./wasm";

/**
 * Client library that encapsulates methods for constructing Merkle exclusion proofs for compliant stablecoin programs following the Sealance architecture.
 *

 * @example
 * Construct a Merkle exclusion proof.
 *  ```typescript
 * const sealance = new SealanceMerkleTree();
 * const leaves = [
 *      "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
 *      "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
 *      "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
 *    ];
 * const result = sealance.generateLeaves(leaves); 
 * const tree = sealance.buildTree(result);
 * const [leftIdx, rightIdx] = sealance.getLeafIndices(tree, "aleo1kypwp5m7qtk9mwazgcpg0tq8aal23mnrvwfvug65qgcg9xvsrqgspyjm6n");
 * const proof_left = sealance.getSiblingPath(tree, leftIdx, 15);
 * const proof_right = sealance.getSiblingPath(tree, rightIdx, 15);
 * const exclusion_proof = [proof_left, proof_right];
 * const formatted_proof = sealance.formatMerkleProof(exclusion_proof);
 * ```
 */

class SealanceMerkleTree {
  private static hasher = new Poseidon4();

  /**
   * Converts an Aleo blockchain address to a field element.
   *
   * This function decodes a bech32m-encoded Aleo address and converts it to a field element
   * represented as a BigInt. The address format follows the Aleo protocol specification,
   * starting with the prefix "aleo1" followed by encoded data.
   *
   * @param address - The Aleo blockchain address (e.g., "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px")
   * @returns A BigInt representing the field element.
   * @throws Error if the address is invalid or cannot be decoded.
   *
   * @example
   * ```typescript
   * const sealance = new SealanceMerkleTree();
   * const address = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
   * const fieldValue = sealance.convertAddressToField(address);
   * console.log(fieldValue); // 123456789...n
   * ```
   */
  convertAddressToField(address: string): bigint {
    const { words } = bech32m.decode(address as `${string}1${string}`);
    const bytes = bech32m.fromWords(words);

    // Convert bytes to BigInt (little-endian)
    let fieldValue = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
      fieldValue |= BigInt(bytes[i] ?? 0) << BigInt(i * 8);
    }

    return fieldValue;
  }

  /**
   * Hashes two elements using Poseidon4 hash function
   * @param prefix - Prefix for the hash (e.g., "0field" for nodes, "1field" for leaves)
   * @param el1 - First element to hash
   * @param el2 - Second element to hash
   * @returns The hash result as a Field
   * @throws {Error} If inputs are empty or invalid
   */
  hashTwoElements(prefix: string, el1: string, el2: string): Field {
    if (!el1 || !el2) {
      throw new Error("Invalid inputs: elements cannot be empty");
    }
    const fields = [Field.fromString(prefix), Field.fromString(el1), Field.fromString(el2)];
    const arrayPlaintext = Plaintext.fromString(`[${fields.map((f) => f.toString()).join(",")}]`);

    return SealanceMerkleTree.hasher.hash(arrayPlaintext.toFields());
  }

  /**
   * Builds a Merkle tree from given leaves. The tree is built bottom-up, hashing pairs of elements at each level.
   *
   * @param leaves - Array of leaf elements (must have even number of elements).
   * @returns Array representing the complete Merkle tree as BigInts.
   * @throws {Error} If leaves array is empty or has odd number of elements.
   *
   * @example
   * ```typescript
   * const sealance = new SealanceMerkleTree();
   * const leaves = ["0field", "1field", "2field", "3field"];
   * const tree = sealance.buildTree(leaves);
   * const root = tree[tree.length - 1]; // Get the Merkle root
   * ```
   */
  buildTree(leaves: string[]): bigint[] {
    if (leaves.length === 0) {
      throw new Error("Leaves array cannot be empty");
    }
    if (leaves.length % 2 !== 0) {
      throw new Error("Leaves array must have even number of elements");
    }
    let currentLevel = leaves;
    let tree = [...currentLevel];
    let levelSize = currentLevel.length;

    while (levelSize > 1) {
      const nextLevel = [];
      for (let i = 0; i < levelSize; i += 2) {
        const left = currentLevel[i] ?? "";
        const right = currentLevel[i + 1] ?? "";
        const prefix = leaves.length === levelSize ? "1field" : "0field";
        const hash = this.hashTwoElements(prefix, left, right);
        nextLevel.push(hash.toString());
      }
      tree = [...tree, ...nextLevel];
      currentLevel = nextLevel;
      levelSize = currentLevel.length;
    }
    return tree.map((element) => BigInt(element.slice(0, element.length - "field".length)));
  }

  /**
   * Converts an array of decimal string representations of U256 numbers to an array of BigInts.
   *
   * @param tree - Array of decimal string representations of U256 numbers.
   * @returns Array of BigInts.
   *
   * @example
   * ```typescript
   * const treeStrings = ["0","4328470178059738374782465505490977516512210899136548187530607227309847251692","1741259420362056497457198439964202806733137875365061915996980524089960046336"];
   * const sealance = new SealanceMerkleTree();
   * const treeBigInts = sealance.convertTreeToBigInt(treeStrings);
   * console.log(treeBigInts); // [
   *   0,
   *   4328470178059738374782465505490977516512210899136548187530607227309847251692,
   *   1741259420362056497457198439964202806733137875365061915996980524089960046336
   *  ]
   * ```
   */
  convertTreeToBigInt(tree: string[]): bigint[] {
    return tree.map((element) => {
      try {
        // decimal string → native bigint
        return BigInt(element);
      } catch {
        throw new Error(`Invalid decimal U256 string: ${element}`);
      }
    });
  }

  /**
   * Converts Aleo addresses to field elements, sorts them, pads with zero fields, and returns an array. This prepares addresses for Merkle tree construction.
   *
   * @param addresses - Array of Aleo addresses.
   * @param maxTreeDepth - Maximum depth of the Merkle tree (default: 15).
   * @returns Array of field elements ready for Merkle tree construction.
   * @throws {Error} If the number of addresses exceeds the maximum capacity.
   *
   * @example
   * ```typescript
   * const addresses = [
   *    "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
   *    "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
   *    "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
   *  ];
   * const sealance = new SealanceMerkleTree();
   * const leaves = sealance.generateLeaves(addresses, 15);
   * console.log(leaves); // [
   *   "0field",
   *   "1295133970529764960316948294624974168921228814652993007266766481909235735940field",
   *   "1295133970529764960316948294624974168921228814652993007266766481909235735940field",
   *   "3501665755452795161867664882580888971213780722176652848275908626939553697821field"
   *  ]
   * ```
   */
  generateLeaves(addresses: string[], maxTreeDepth: number = 15): string[] {
    const maxNumLeaves = Math.floor(2 ** (maxTreeDepth - 1));

    // Filter out zero addresses
    addresses = addresses.filter((addr) => addr !== ZERO_ADDRESS);

    let numLeaves = 0;
    if (addresses.length === 0 || addresses.length === 1) {
      numLeaves = 2;
    } else {
      numLeaves = 2 ** Math.ceil(Math.log2(addresses.length));
    }

    if (addresses.length > maxNumLeaves) {
      throw new Error(`Leaves limit exceeded. Max: ${maxNumLeaves}, provided: ${addresses.length}`);
    }

    // Convert addresses to fields
    const addressFields = addresses.map((addr) => ({
      address: addr,
      field: this.convertAddressToField(addr),
    }));

    // Sort by field value
    const sortedFields = addressFields
      .sort((a, b) => (a.field < b.field ? -1 : 1))
      .map((item) => item.field);

    // Convert to field strings
    const sortedFieldElements = sortedFields.map((field) => `${field.toString()}field`);

    // Pad with zeros to reach power of 2
    const fullTree = Array(Math.max(numLeaves - sortedFieldElements.length, 0)).fill("0field");

    return fullTree.concat(sortedFieldElements);
  }

  /**
   * Finds the leaf indices for non-inclusion proof of an address and returns the indices of the two adjacent leaves that surround the target address.
   *
   * @param merkleTree - The complete Merkle tree as array of BigInts.
   * @param address - The Aleo address for which to find indices.
   * @returns Tuple of [leftLeafIndex, rightLeafIndex].
   *
   * @example
   * ```typescript
   * const addresses = [
   *    "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
   *    "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
   *    "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
   *  ];
   * const sealance = new SealanceMerkleTree();
   * const leaves = sealance.generateLeaves(addresses);
   * const tree = sealance.buildTree(leaves);
   * const [leftIdx, rightIdx] = sealance.getLeafIndices(tree, "aleo1...");
   * ```
   */
  getLeafIndices(merkleTree: bigint[], address: string): [number, number] {
    const num_leaves = Math.floor((merkleTree.length + 1) / 2);
    const addressBigInt = this.convertAddressToField(address);
    const leaves = merkleTree.slice(0, num_leaves);
    let rightLeafIndex = leaves.findIndex((leaf: bigint) => addressBigInt <= leaf);
    let leftLeafIndex = rightLeafIndex - 1;
    if (rightLeafIndex === -1) {
      rightLeafIndex = leaves.length - 1;
      leftLeafIndex = leaves.length - 1;
    }
    if (rightLeafIndex === 0) {
      leftLeafIndex = 0;
    }
    return [leftLeafIndex, rightLeafIndex];
  }

  /**
   * Generates the sibling path (Merkle proof) for a given leaf index
   *
   * @param tree - The complete Merkle tree.
   * @param leafIndex - Index of the leaf for which to generate the proof.
   * @param depth - Maximum depth of the tree.
   * @returns Object containing siblings array and leaf_index.
   *
   * @example
   * ```typescript
   * const addresses = [
   *    "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
   *    "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
   *    "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
   *  ];
   * const sealance = new SealanceMerkleTree();
   * const leaves = sealance.generateLeaves(addresses);
   * const tree = sealance.buildTree(leaves);
   * const [leftIdx, rightIdx] = sealance.getLeafIndices(tree, "aleo1...");
   * const proof = sealance.getSiblingPath(tree, leftIdx, 15);
   * // proof = { siblings: [0n, 1n, ...], leaf_index: leftIdx }
   * ```
   */
  getSiblingPath(
    tree: bigint[],
    leafIndex: number,
    depth: number
  ): { siblings: bigint[]; leaf_index: number } {
    const num_leaves = Math.floor((tree.length + 1) / 2);
    const siblingPath: bigint[] = [];

    let index = leafIndex;
    let parentIndex = num_leaves;
    siblingPath.push(tree[index] ?? 0n);
    let level = 1;
    while (parentIndex < tree.length) {
      const siblingIndex = index % 2 === 0 ? index + 1 : index - 1; // Get the sibling index
      siblingPath.push(tree[siblingIndex] ?? 0n);

      index = parentIndex + Math.floor(leafIndex / 2 ** level); // Move up to the parent node
      parentIndex += Math.floor(num_leaves / 2 ** level); // Halve the number of nodes for the next level
      level++;
    }

    while (level < depth) {
      siblingPath.push(0n);
      level++;
    }

    return { siblings: siblingPath, leaf_index: leafIndex };
  }

  /**
   * Generates a formatted exclusion proof suitable for Aleo transactions.
   *
   * @param proof - An array of two {sibling path, leafindex} objects.
   * @returns String representation of the exclusion proof.
   *
   * @example
   * ```typescript
   * const addresses = [
   *    "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
   *    "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
   *    "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
   *  ];
   * const sealance = new SealanceMerkleTree();
   * const leaves = sealance.generateLeaves(addresses);
   * const tree = sealance.buildTree(leaves);
   * const [leftIdx, rightIdx] = sealance.getLeafIndices(tree, "aleo1...");
   * const proof1 = getSiblingPath(tree, leftIdx, 15);
   * const proof2 = getSiblingPath(tree, rightIdx, 15);
   * const formattedProof = formatMerkleProof([proof1, proof2]);
   * // formattedProof = "[{ siblings: [0field, 1field, ...], leaf_index: 0u32 }, { siblings: [0field, 2field, ...], leaf_index: 1u32 }]"
   * ```
   */
  formatMerkleProof(proof: { siblings: bigint[]; leaf_index: number }[]): string {
    const formatted = proof
      .map((item) => {
        const siblings = item.siblings.map((s) => `${s}field`).join(", ");
        return `{siblings: [${siblings}], leaf_index: ${item.leaf_index}u32}`;
      })
      .join(", ");

    return `[${formatted}]`;
  }

  /**
   * Converts an array of decimal string representations of U256 numbers to an array of BigInts.
   *
   * @param tree - Array of decimal string representations of U256 numbers.
   * @returns Array of BigInts.
   *
   * @example
   */
  convertTreeToU256(tree: string[]): bigint[] {
    return tree.map((element) => {
      try {
        return BigInt(element);
      } catch {
        throw new Error(`Invalid decimal U256 string: ${element}`);
      }
    });
  }
}

export { SealanceMerkleTree };
