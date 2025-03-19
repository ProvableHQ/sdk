import { React, useMemo, useState } from "react";
import { Card, Divider, Form, Input, Select, Radio, Button, List } from "antd";
import { CopyButton } from "../../components/CopyButton";
import { useAleoWASM } from "../../aleo-wasm-hook";
import { useAuctionState } from "../../components/AuctionState.jsx";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import { WalletWrapper } from "../../components/WalletWrapper.jsx";

export const AuctioneerBids = () => {
    const { auctionState } = useAuctionState();
    const { publicKey, connected, requestRecordPlaintexts, disconnect, network, wallet } = useWallet();
    const [bidAmount, setBidAmount] = useState("");

    const myBids = [];

    const getWinningBids = () => {
        requestRecordPlaintexts("private_auction.aleo").then((records) => {

        });
    }

    return (
            <Card
                title="Open Bids"
                style={{ width: "100%" }}
            >
                <WalletMultiButton />
                {!connected ? (
                    <>
                        <div>Please connect your wallet to view bids from outside bidders</div>
                    </>
                ) : (
                    <List
                        itemLayout="vertical"
                        dataSource={myBids}
                        renderItem={bid => (
                            <List.Item key={bid.txId}>
                                <Card type="inner" title={`Auction ID: ${bid.id}`}>
                                    <p>Auctioneer: {bid.auctioneer}</p>
                                    <p>Bid Amount: {bid.amount}</p>
                                    <p>Transaction ID: {bid.txId}</p>
                                </Card>
                            </List.Item>
                        )}
                        locale={{ emptyText: "No bids found" }}
                    />
                )}
            </Card>
    );
};
