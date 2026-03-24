---
id: intro
title: Intro to Aleo via the Provable SDK
sidebar_label: Intro
---

Building private web applications with the SDK requires a few fundamental pieces
of knowledge about how Aleo enables privacy. This guide introduces these
concepts and provides on overview of the core building blocks of a "private
app".

# How does Aleo Create Privacy?

Aleo enables private apps through the use of `function privacy`. Functions
executed on Aleo can have private inputs or outputs and generate persistent
private state.

Program functions can have private inputs or outputs that are only visible to
the caller of the function (and in some cases, an intended receiver) and
encrypted for everyone else. This paradigm allows for building privacy
preserving protocls such as private transfers of assets, lending approvals which
do not require the lender to know the borrower's assets, private machine
learning inferences, and more.

```mermaid
graph
    subgraph PrivateValue["Private Value Transfers"]
        Sender(["Sender(Private)"])
        Amount(["Amount(Private)"])
        Receiver["Receiver(Private)"]
        transfer_private[["transfer_private"]]
        Sender -.- transfer_private -.-> Receiver
        Amount -.- transfer_private
    end
   classDef default fill:#fff3e0,stroke:#ff9800,stroke-width:2px,color:#000;
   style PrivateValue fill:#ffdbf0,stroke:#f229e0,stroke-width:2px,color:#000;
   linkStyle default stroke:#f229e0,stroke-width:2px;
```

```mermaid
graph LR
   subgraph PrivateLending["Private Lending"]
      Balance(["Balance(Private)"])
      Score(["Credit Score(Private)"])
      Accounts(["Number of Accounts(Private)"])
      Approval["Loan Approval(Public)"]
      zk_lender[["zkLendingApproval"]]
      Balance -.- zk_lender -.-> Approval
      Score -.- zk_lender
      Accounts -.- zk_lender
   end
   classDef default fill:#fff3e0,stroke:#ff9800,stroke-width:2px,color:#000;
   style PrivateLending fill:#ffdbf0,stroke:#f229e0,stroke-width:2px,color:#000;
   linkStyle default stroke:#f229e0,stroke-width:2px;
```

```mermaid
graph LR
   subgraph ZkML["ZkML"]
      Medication(["Medication Names(Private)"])
      Class(["Age (Private)"])
      Dosage(["Dosage(Private)"])
      Interaction["Interaction(Public)"]
      Warn["Risk Recommendation(Private)"]
      zkDecision[["medicalDecisionTree"]]
      Medication -.- zkDecision
      Class -.- zkDecision
      Dosage -.- zkDecision
      zkDecision -.-> Interaction
        zkDecision -.-> Warn
   end
   classDef default fill:#fff3e0,stroke:#ff9800,stroke-width:2px,color:#000;
   style ZkML fill:#ffdbf0,stroke:#f229e0,stroke-width:2px,color:#000;
   linkStyle default stroke:#f229e0,stroke-width:2px;
```

# What is Aleo?

Aleo is composed of two main components which are used and operated by the
`Aleo` community.

## SnarkVM - The Aleo zkVM

A zkVM called `snarkVM` which provides private Program execution via the Varuna
zkSnark as well and several libraries of cryptographic primitives such as hash
functions, field & elliptic curve arithmetic, and symmetric encryption tools.

`snarkVM` supports running executable programs that can have private inputs or
outputs, allowing programs to be run privately, producing a proof that the
execution was run correctly without revealing the private inputs or outputs.
These proofs can be verified by any party, with the most common verifier being
the Aleo Blockchain.

```mermaid
graph
    classDef main fill:#1E1E2E,stroke:#FFFFFF,stroke-width:2px,color:#FFFFFF,font-weight:bold,rx:10px,ry:10px;
    classDef sub fill:#4A90E2,stroke:#FFFFFF,stroke-width:1.5px,color:#FFFFFF,rx:10px,ry:10px;
    classDef leaf fill:#50C878,stroke:#FFFFFF,stroke-width:1.5px,color:#FFFFFF,rx:10px,ry:10px;

subgraph snarkVM["snarkVM (Simplified)"]
    subgraph Core["Core Libraries"]
        A["Aleo Program Model,
                Aleo Instructions,
        Aleo Types"]:::leaf
        D["Cryptographic Primitives & Algorithms"]:::leaf
        E["Ledger Data Structures"]:::leaf
    end
    subgraph VM
    F["Blockchain Store"]:::sub
    G["Puzzle"]:::sub
        subgraph process
            H["Programs (stored)
            [ProgramID, Code]"]:::sub
            I[[Methods:
            - execute
            - verify
            - prove
            .....
            ]]:::sub
        end
    end
end
```

## The Aleo Blockchain

A blockchain network operated through community operated `SnarkOS` nodes which
provide a decentralized network for executing private programs. The network is
secured by independent `validators` via a proof of stake consensus mechanism
called `Bullshark` that allows anyone to join or leave the validator set. An
audit and description of Aleo Bullshark can found in the
[Aleo Bullshark Audit](https://docs.leo-lang.org/sdk/audit/bullshark) by
zkSecurity.

# Building Private Programs on Aleo

### Build & Use Private Programs with the Leo Language and Provable SDK

Developers can build their own private programs and deploy them to the `Aleo`
network through the usage of the [Leo language](https://docs.leo-lang.org/leo).
Leo is a high-level, developer-friendly language for developing zero-knowledge
programs.

Developers can execute and interact with private programs via the
`Provable SDK`. The `Provable SDK` provides methods for executing programs and
interacting with public and private state on the `Aleo Network`. This guide
provides a detailed overview of how to use the `Provable SDK` to build private
full stack web applications.
