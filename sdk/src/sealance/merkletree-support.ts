import { Field, Plaintext, Poseidon4 } from "../wasm.js";
import { bech32m } from "@scure/base";
import { ZERO_ADDRESS } from "../constants.js";

/**
 * Client library that encapsulates methods for constructing Merkle exclusion proofs for compliant stablecoin programs following the Sealance architecture.
 *

 * @example
 * // Construct a Merkle exclusion proof.

 */
class Sealance {
    private static hasher = new Poseidon4();
  
    /**
    * Converts an Aleo blockchain address to a field element.
    *
    * This function decodes a bech32m-encoded Aleo address and converts it to a field element
    * represented as a BigInt. The address format follows the Aleo protocol specification,
    * starting with the prefix "aleo1" followed by encoded data.
    *
    * @param address - The Aleo blockchain address (e.g., "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px")
    * @returns A BigInt representing the field element
    * @throws Error if the address is invalid or cannot be decoded
    *
    * @example
    * ```typescript
    * const address = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
    * const fieldValue = convertAddressToField(address);
    * console.log(fieldValue); // 123456789...n
    * ```
    */
    convertAddressToField(address: string): bigint {
        const { words } = bech32m.decode(address as `${string}1${string}`);
        const bytes = bech32m.fromWords(words);

        // Convert bytes to BigInt (little-endian)
        let fieldValue = BigInt(0);
        for (let i = 0; i < bytes.length; i++) {
            fieldValue |= BigInt(bytes[i]) << BigInt(i * 8);
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
        const arrayPlaintext = Plaintext.fromString(`[${fields.map(f => f.toString()).join(",")}]`);

        return Sealance.hasher.hash(arrayPlaintext.toFields());
    }

    /**
    * Builds a Merkle tree from given leaves
    * The tree is built bottom-up, hashing pairs of elements at each level
    *
    * @param leaves - Array of leaf elements (must have even number of elements)
    * @returns Array representing the complete Merkle tree as BigInts
    * @throws {Error} If leaves array is empty or has odd number of elements
    *
    * @example
    * ```typescript
    * const leaves = ["0field", "1field", "2field", "3field"];
    * const tree = buildTree(leaves);
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
                const left = currentLevel[i];
                const right = currentLevel[i + 1];
                const prefix = leaves.length === levelSize ? "1field" : "0field";
                const hash = this.hashTwoElements(prefix, left, right);
                nextLevel.push(hash.toString());
            }
            tree = [...tree, ...nextLevel];
            currentLevel = nextLevel;
            levelSize = currentLevel.length;
        }
        return tree.map(element => BigInt(element.slice(0, element.length - "field".length)));
    }

    /**
    * Converts Leo addresses to field elements, sorts them, pads with zero fields, and returns an array
    * This prepares addresses for Merkle tree construction
    *
    * @param addresses - Array of Aleo addresses
    * @param maxTreeDepth - Maximum depth of the Merkle tree (default: 15)
    * @returns Array of field elements ready for Merkle tree construction
    * @throws {Error} If the number of addresses exceeds the maximum capacity
    *
    * @example
    * ```typescript
    * const addresses = [
    *   "aleo1...",
    *   "aleo1..."
    * ];
    * const leaves = generateLeaves(addresses, 15);
    * const tree = buildTree(leaves);
    * ```
    */
    generateLeaves(addresses: string[], maxTreeDepth: number = 15): string[] {
        const maxNumLeaves = Math.floor(2 ** (maxTreeDepth - 1));

        // Filter out zero addresses
        addresses = addresses.filter(addr => addr !== ZERO_ADDRESS);

        let numLeaves = 0;
            if (addresses.length === 0 || addresses.length === 1) {
                numLeaves = 2;
              } else {
              numLeaves = Math.pow(2, Math.ceil(Math.log2(addresses.length)));
            }

        if (addresses.length > maxNumLeaves) {
            throw new Error(`Leaves limit exceeded. Max: ${maxNumLeaves}, provided: ${addresses.length}`);
        }

        // Convert addresses to fields
        const addressFields = addresses.map(addr => ({
            address: addr,
            field: this.convertAddressToField(addr),
        }));

        // Sort by field value
        const sortedFields = addressFields.sort((a, b) => (a.field < b.field ? -1 : 1)).map(item => item.field);

        // Convert to field strings
        const sortedFieldElements = sortedFields.map(field => field.toString() + "field");

        // Pad with zeros to reach power of 2
        const fullTree = Array(Math.max(numLeaves - sortedFieldElements.length, 0)).fill("0field");

        return fullTree.concat(sortedFieldElements);
    }


    /**
    * Finds the leaf indices for non-inclusion proof of an address
    * Returns the indices of the two adjacent leaves that surround the target address
    *
    * @param merkleTree - The complete Merkle tree as array of BigInts
    * @param address - The Aleo address to find indices for
    * @returns Tuple of [leftLeafIndex, rightLeafIndex]
    *
    * @example
    * ```typescript
    * const tree = buildTree(leaves);
    * const [leftIdx, rightIdx] = getLeafIndices(tree, "aleo1...");
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
    * @param tree - The complete Merkle tree
    * @param leafIndex - Index of the leaf to generate proof for
    * @param depth - Maximum depth of the tree
    * @returns Object containing siblings array and leaf_index
    *
    * @example
    * ```typescript
    * const tree = buildTree(leaves);
    * const proof = getSiblingPath(tree, 0, 15);
    * // proof = { siblings: [0n, 1n, ...], leaf_index: 0 }
    * ```
    */
    getSiblingPath(
        tree: bigint[],
        leafIndex: number,
        depth: number,
    ): { siblings: bigint[]; leaf_index: number } {
        let num_leaves = Math.floor((tree.length + 1) / 2);
        const siblingPath: bigint[] = [];

        let index = leafIndex;
        let parentIndex = num_leaves;
        siblingPath.push(tree[index]);
        let level = 1;
        while (parentIndex < tree.length) {
            let siblingIndex = index % 2 === 0 ? index + 1 : index - 1; // Get the sibling index
            siblingPath.push(tree[siblingIndex]);

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
}

export { Sealance };