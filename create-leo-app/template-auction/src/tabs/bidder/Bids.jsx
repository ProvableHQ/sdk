import { React, useMemo, useState } from "react";
import { Card, List } from "antd";
import { useAuctionState } from "../../components/AuctionState.jsx";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import { convertFieldToString } from "../../core/encoder.js";

export const Bids = () => {
    const { auctionState } = useAuctionState();
    const { publicKey, connected } = useWallet();

    const myBids = useMemo(() => {
        if (!auctionState?.bidderState || !publicKey || !auctionState.bidderState[publicKey]) {
            return [];
        }
        
        return auctionState.bidderState[publicKey].bids || [];
    }, [auctionState, publicKey]);

    return (
            <Card
                title="My Bids"
                style={{ width: "100%" }}
            >
                {!connected ? (
                    <>
                        <WalletMultiButton />
                        <div>Please connect your wallet to view your bids</div>
                    </>
                ) : (
                    <List
                        itemLayout="vertical"
                        dataSource={myBids}
                        renderItem={bid => (
                            <List.Item key={bid.txId}>
                                <Card type="inner" title={`Auction ID: ${convertFieldToString(bid.id)}`}>
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
