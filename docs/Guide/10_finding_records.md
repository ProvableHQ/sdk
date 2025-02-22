---
id: finding-records
title: Finding Records
sidebar_label: Finding Records
---

Records are UTXO-like objects, and as in most Blockchains with UTXO objects, identifying those that belong to a specific
user can be a challenging exercise. 

Records are stored as outputs of transitions contained within execution transactions. To find records, implementors of 
web apps must:
* Scan the Aleo network for transitions that contain records.
* Check found records to see if the desired user is the owner of the record.
* Check to see if the record is "spent" or "unspent"
* Optionally decrypt the record if the data within it is desired.

```mermaidjs
graph TD
    subgraph BlockN+2
    end
    subgraph BlockN+1
    end
    subgraph BlockN
        subgraph Transaction1["Transaction 1"]
            subgraph Transition1["Transition 2"]
                Inputs1@{ shape: procs, label: "Inputs"}
                Outputs1@{ shape: procs, label: "Outputs:
                record"}
            end
            subgraph Transition2["Transition 1"]
                Inputs2@{ shape: procs, label: "Inputs"}
                Outputs2@{ shape: procs, label: "Outputs"}
            end
        end
        Transactions@{ shape: procs, label: "Transactions{2..N}"}
    end
    subgraph Scanner
        subgraph Checks
            CheckOwner[["Check Ownership 
            (View Key)"]]
            CheckSpent[["Check Unspent"]]
        end
        Owned@{ shape: procs, label: "Owned Records"}
        CheckOwner -.->Owned
    end
    BlockN-->BlockN+1-->BlockN+2
    Scanner <-."Scan Records 
    (Records Found!)"
    .-> Transition1
    Scanner -.Scan For Records.-> Transition2
    Scanner -.Scan For Records.-> Transactions
    Scanner -.Scan For Records.-> BlockN+1
    Scanner -.Scan For Records.-> BlockN+2

%% Styling (All text black)
    classDef default fill:#fff3e0,stroke:#ff9800,stroke-width:2px,color:#000;
    style BlockN+2 fill:#ffdbf0,stroke:#f229e0,stroke-width:2px,color:#000;
    style BlockN+1 fill:#ffdbf0,stroke:#f229e0,stroke-width:2px,color:#000;
    style BlockN fill:#ffdbf0,stroke:#f229e0,stroke-width:2px,color:#000;
    style Transaction1 fill:#ffdbf0,stroke:#f229e0,stroke-width:2px,color:#000;
    style Transition1 fill:#ffdbf0,stroke:#f229e0,stroke-width:2px,color:#000;
    style Transition2 fill:#ffdbf0,stroke:#f229e0,stroke-width:2px,color:#000;
```

## Optimizing Web Search
Using naive approaches such as scanning the entire Blockchain history can be a time-consuming process and degrade the
experience of a web app. Fortunately, strategies can be used to optimize the process.

#### Searching for Records After the User Account Creation
If the user of your web app has created an Aleo account with you, you can optimize the search for records by only scanning 
the records from the block height after which the account was created. 

#### Searching for A Specific Program's Records
If the records you are searching for are from a specific program, you can optimize the search by only scanning the 
records for a specific program.

#### Storing Records Created by Your Web App
If your web app has created a transaction, you have access to the records produced by that transaction and can store
them in a database for easy retrieval later.