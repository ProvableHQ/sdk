import { Sealance } from "../src/integrations/sealance/merkle-tree.js";
import {ZERO_ADDRESS} from "../src/constants.js";
import { expect } from "chai";

const sealance = new Sealance();
describe("merkle_tree lib, buildTree", () => {
  it("should build a valid tree with 2 leaves", async () => {
    const leaves = ["1field", "2field"];
    const tree = sealance.buildTree(leaves);
    expect(tree).to.have.lengthOf(3);
  });

  it("should build a valid tree with 4 leaves", async () => {
    const leaves = ["1field", "2field", "3field", "4field"];
    const tree = sealance.buildTree(leaves);
    expect(tree).to.have.lengthOf(7);
  });

  it("should throw error for empty leaves", async () => {
    expect(() => sealance.buildTree([])).to.throw(`Leaves array cannot be empty`);
  });

  it("should throw error for odd number of leaves", async () => {
    expect(() => sealance.buildTree(["1field", "2field", "3field"])).to.throw(`Leaves array must have even number of elements`);
  });
});

describe("merkle_tree lib, generateLeaves", () => {
  it("should generate correct number of leaves from 1 leaf", () => {
    const leaves = ["aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"];
    const result = sealance.generateLeaves(leaves);
    expect(result).to.have.lengthOf(2);
  });

  it("should generate correct number of leaves from 2 leaves", () => {
    const leaves = [
      "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
      "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
    ];
    const result = sealance.generateLeaves(leaves);
    expect(result).to.have.lengthOf(2);
  });

  it("should generate correct number of leaves from 3 leaves", () => {
    const leaves = [
      "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
      "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
      "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
    ];
    const result = sealance.generateLeaves(leaves);
    expect(result).to.have.lengthOf(4);
  });

  it("should generate correct number of leaves from 5 leaves", () => {
    const leaves = Array(5).fill("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");
    const result = sealance.generateLeaves(leaves);
    expect(result).to.have.lengthOf(8);
  });

  it("should generate correct number of leaves from 9 leaves", () => {
    const leaves = Array(9).fill("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");
    const result = sealance.generateLeaves(leaves);
    expect(result).to.have.lengthOf(16);
  });

  it("should pad with 0field when needed", () => {
    const leaves = ["aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"];
    const result = sealance.generateLeaves(leaves);

    expect(result).to.have.lengthOf(2);
    expect(result.filter(x => x === "0field").length).to.equal(1);
  });

  it("should sort leaves correctly", () => {
    const leaves = [
      "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t",
      "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
    ];
    const result = sealance.generateLeaves(leaves);
    expect(result).to.have.lengthOf(2);
  expect(result[0]).to.not.equal(result[1]);
  expect(result[0]).to.equal("1295133970529764960316948294624974168921228814652993007266766481909235735940field");
});

  it("should pad with 0field when needed", () => {
    const leaves = ["aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"];
    const result = sealance.generateLeaves(leaves);
    expect(result).to.have.lengthOf(2);
    expect(result.filter(x => x === "0field").length).to.equal(1);
  });

  it("should filter ZERO_ADDRESS", () => {
    const leaves = [
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
    ];
    const result = sealance.generateLeaves(leaves);
    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.equal("0field");
    expect(result[1]).to.equal("3501665755452795161867664882580888971213780722176652848275908626939553697821field");
  });

  it("should throw error when exceeding max tree capacity", () => {
    const maxDepth = 15;
    const maxLeaves = 2 ** (maxDepth - 1);
    const tooManyAddresses = Array(maxLeaves + 1).fill(
      "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
    );

    expect(() => sealance.generateLeaves(tooManyAddresses, maxDepth)).to.throw("Leaves limit exceeded");
    });
});

describe("merkle_tree lib, getLeafIndices", () => {
  it("should handle address larger than all leaves in tree", () => {
    // Create a tree with a single address
    const addresses = ["aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"];
    const leaves = sealance.generateLeaves(addresses, 15);
    const tree = sealance.buildTree(leaves);

    // Use an address that's larger than all addresses in the tree
    // This is generated from (2^253 - 1), the maximum valid field value
    const largeAddress = "aleo1lllllllllllllllllllllllllllllllllllllllllllllllllu0snjvma4";

    const [leftIdx, rightIdx] = sealance.getLeafIndices(tree, largeAddress);

    // When address is larger than all leaves, both indices should point to the last leaf
    expect(leftIdx).to.equal(1);
    expect(rightIdx).to.equal(1);
  });
});

describe("merkle_tree lib, getSiblingPath", () => {
  it("should handle odd leaf index (test sibling calculation branch)", () => {
    // Create a tree with 4 leaves
    const leaves = ["1field", "2field", "3field", "4field"];
    const tree = sealance.buildTree(leaves);

    // Get sibling path for leaf index 1 (odd index)
    // This will test the "index - 1" branch of the sibling index calculation
    const proof = sealance.getSiblingPath(tree, 1, 15);

    expect(proof).to.not.be.undefined;
  expect(proof.leaf_index).to.equal(1);
  expect(proof.siblings).to.not.be.undefined;
  expect(proof.siblings).to.have.lengthOf(15); // Depth 15
  expect(proof.siblings[0]).to.equal(2n); // The leaf itself (index 1 = "2field")
  expect(proof.siblings[1]).to.equal(1n); // Its sibling (index 0 = "1field")
  });
});