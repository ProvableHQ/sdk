import { Transaction } from "@demox-labs/aleo-wallet-adapter-base";

export class Bidder {
    constructor(address, networkID) {
        this.address = address;
        this.networkID = networkID;
        this.programID = "private_auction.aleo";
    }

    setAddress(address) {
        this.address = address;
    }

    setNetworkID(networkID) {
        this.networkID = networkID;
    }

    setProgramID(programID) {
        this.programID = programID;
    }

    createBid(
        amount,
        bidID,
        auctioneerAddress,
    ) {
        return Transaction.createTransaction(
            this.address,
            this.networkID,
            this.programID,
            "bid",
            [amount, bidID, auctioneerAddress],
            0.05,
            false,
        )
    }

}
