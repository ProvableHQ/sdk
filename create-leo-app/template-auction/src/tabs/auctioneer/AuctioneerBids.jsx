import { React, useEffect, useMemo, useState } from "react";
import { Card, List, Button, Space } from "antd";
import { useAuctionState } from "../../components/AuctionState.jsx";
import { PROGRAM_ID } from "../../core/constants.js";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import { convertFieldToString } from "../../core/encoder.js";
import { ReloadOutlined } from "@ant-design/icons";

export const AuctioneerBids = () => {
    const { auctionState, setAuctioneerRecords, setBidderRecords } = useAuctionState();
    const { connected, requestRecords, publicKey } = useWallet();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Parse and transform the bid records
    const parsedBids = useMemo(() => {
        if (!auctionState?.auctioneerRecords || !publicKey) {
            return [];
        }

        try {
            return auctionState.auctioneerRecords
                .map(record => {
                    try {
                        if (record.spent) {
                            return null
                        } else {
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
                        }
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
        setIsRefreshing(true);
        try {
            const records = await requestRecords(PROGRAM_ID);
            if (records && records.length > 0) {
                const bidder_records = [...records].filter(record => (record.data.is_winner === "true.private"));
                setAuctioneerRecords(records);
                setBidderRecords(bidder_records);
            }
        } catch (error) {
            console.error("Error fetching records:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (auctionState.auctioneerRecords.length === 0) {
            getBids().then(r => console.log('Fetched bids:', r));
            console.log("Auction State", auctionState);
        }
    }, [connected]);

    return (
        <Card 
            title="Auction Bids" 
            style={{ width: "100%" }}
            extra={
                <Button 
                    icon={<ReloadOutlined />}
                    onClick={getBids}
                    loading={isRefreshing}
                    disabled={!connected}
                >
                    Refresh
                </Button>
            }
        >
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
