---
id: appendix
title: SnarkVM and SnarkOS
sidebar_label: What is Aleo?
---

### Aleo Instructions - Languages for Private Programs
SnarkVM natively supports an imperative programming language called Aleo Instructions building programs with arbitrary
logic wherein any input or output to the program can be private. When a program is executed, its correct execution is
proven with a ZkSnark proof, which can be verified by any party without revealing who executed the program or the
program's private inputs or outputs.

#### The Leo Language

Provable provides a higher level language called **Leo** (separate from SnarkVM) which compiles to Aleo instructions.
The Leo Language provides a more developer friendly syntax and a higher level of abstraction for building private programs.

### ZkSnark proofs - Proofs of Correct Execution of Private Programs
When a program is run in SnarkVM, its execution is turned into a ZkSnark proof. This proof is often then sent via an
`Execution Transaction` to the Aleo Blockchain where it is verified and stored in the blockchain ledger. However
offchain verifiers can also verify the proof without needing to interact with the blockchain.

### Cryptographic Primitives - Building Blocks for Privacy
To support ZkSnark proofs, a suite of cryptographic primitives including, Finite Fields, Paring-Friendly Elliptic Curves,
Cryptographic Hash Functions, symmetric encryption algorithms.