import { React, useEffect, useMemo } from "react";
import { Card, List } from "antd";
import { useAuctionState, AuctionState } from "../../components/AuctionState.jsx";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import { useAleoWASM } from "../../aleo-wasm-hook.js";
import { convertFieldToString } from "../../core/encoder.js";

export const AuctioneerBids = () => {
    const { auctionState, setAuctioneerRecords } = useAuctionState();
    const { connected, decrypt, decryptPermission, requestRecords, requestRecordPlaintexts, publicKey } = useWallet();

    // Parse and transform the bid records
    const parsedBids = useMemo(() => {
        if (!auctionState?.auctioneerRecords || !publicKey) {
            return [];
        }

        try {
            return auctionState.auctioneerRecords
                .map(record => {
                    try {
                        console.log(record.data.id);
                        console.log(record.data.amount);
                        // Create the wrapper object with original record and transformed display data
                        return {
                            displayData: {
                                owner: record.owner,
                                bidder: record.data.bidder.replace('.private', ''),
                                auctionName: convertFieldToString(record.data.id.replace('.private', '')),
                                amount: parseInt(record.data.amount.replace('u64.private', '')),
                                isWinner: record.data.is_winner.replace('.private', '') === 'true',
                                bidId: record.id,
                            }
                        };
                    } catch (error) {
                        console.error('Error parsing record:', error);
                        return null;
                    }
                })
                .filter(bid => bid !== null && bid.displayData.owner === publicKey);
        } catch (error) {
            console.error('Error parsing bids:', error);
            return [];
        }
    }, [auctionState.auctioneerRecords, publicKey]);

    // Group bids by auction ID
    const groupedBids = useMemo(() => {
        console.log("Grouping bids");
        const groups = {};
        parsedBids.forEach(bid => {
            const auctionId = bid.displayData.auctionName;
            if (!groups[auctionId]) {
                groups[auctionId] = [];
            }
            groups[auctionId].push(bid);
        });
        console.log(groups);
        return groups;
    }, [parsedBids]);

    // Fetch records from chain
    const getBids = async () => {
        let records = [];
        if (connected) {
            try {
                const records = await requestRecords("private_auction.aleo");
                if (records && records.length > 0) {
                    setAuctioneerRecords(records);
                }
            } catch (error) {
                console.error("Error fetching records:", error);
            }
        }
        return records;
    };

    useEffect(() => {
        getBids().then(r => console.log('Fetched bids:', r));
    }, [connected]);

    return (
        <Card title="Auction Bids" style={{ width: "100%" }}>
            {!connected ? (
                <>
                    <WalletMultiButton />
                    <div>Please connect your wallet to view bids from outside bidders</div>
                </>
            ) : (
                <List
                    itemLayout="vertical"
                    dataSource={Object.entries(groupedBids)}
                    renderItem={([auctionId, bids]) => (
                        <List.Item key={auctionId}>
                            <Card 
                                type="inner" 
                                title={`Auction ID: ${auctionId}`}
                                extra={<span>Total Bids: {bids.length}</span>}
                            >
                                <List
                                    size="small"
                                    dataSource={bids}
                                    renderItem={bid => (
                                        <List.Item>
                                            <div style={{ width: '100%' }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center' 
                                                }}>
                                                    <div>
                                                        <p><strong>Bidder:</strong> {bid.displayData.bidder}</p>
                                                        <p><strong>Bid Id:</strong> {bid.displayData.bidId}</p>
                                                        <p><strong>Amount:</strong> {bid.displayData.amount}</p>
                                                    </div>
                                                    {bid.displayData.isWinner && (
                                                        <div style={{ 
                                                            color: '#52c41a',
                                                            fontWeight: 'bold',
                                                            border: '1px solid #52c41a',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px'
                                                        }}>
                                                            Winner
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.9em', color: '#888' }}>
                                                    Auction Name: {bid.displayData.auctionName}
                                                </div>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </List.Item>
                    )}
                    locale={{ emptyText: "No bids found" }}
                />
            )}
        </Card>
    );
};
