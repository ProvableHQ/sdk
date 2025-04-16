import { React, useMemo, useEffect, useState } from "react";
import { Card, List, Button } from "antd";
import { PROGRAM_ID } from "../../core/constants.js";
import { useAuctionState } from "../../components/AuctionState.jsx";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import { convertFieldToString } from "../../core/encoder.js";
import { ReloadOutlined } from "@ant-design/icons";

export const Bids = () => {
    const { auctionState, setAuctioneerRecords, setBidderRecords } = useAuctionState();
    const { connected, requestRecords, publicKey } = useWallet();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch records from chain
    const getBids = async () => {
        if (!connected) return;
        
        setIsRefreshing(true);
        try {
            const records = await requestRecords(PROGRAM_ID);
            setBidderRecords([...records].filter(record => record.data.is_winner === "true.private"));
            setAuctioneerRecords(records);
        } catch (error) {
            console.error("Error fetching records:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Scan for records periodically
    useEffect(() => {
        if (auctionState.bidderRecords.length === 0) {
            getBids().then(() => { console.log("Fetched new winning records") });
        }
    }, [connected]);

    // Get winning bids from records
    const winningBids = useMemo(() => {
        if (!auctionState?.bidderRecords || !publicKey) {
            return [];
        }

        try {
            return auctionState.bidderRecords
                .map(record => {
                    try {
                        if (record.spent) {
                            return null;
                        }
                        const auctionId = convertFieldToString(record.data.id.replace('.private', ''));
                        return {
                            auctionId,
                            bidder: record.data.bidder.replace('.private', ''),
                            amount: parseInt(record.data.amount.replace('u64.private', '')),
                            bidId: record.id,
                            isWinner: record.data.is_winner.replace('.private', '') === 'true',
                            isRecord: true,
                        };
                    } catch (error) {
                        console.error('Error parsing record:', error);
                        return null;
                    }
                })
                .filter(bid =>
                    bid !== null &&
                    bid.bidder === publicKey &&
                    bid.isWinner
                );
        } catch (error) {
            console.error('Error parsing winning bids:', error);
            return [];
        }
    }, [auctionState.bidderRecords, publicKey]);

    // Get active bids from transaction history
    const activeBids = useMemo(() => {
        if (!auctionState?.bidderState || !publicKey || !auctionState.bidderState[publicKey]) {
            return [];
        }

        return (auctionState.bidderState[publicKey].bids || []).map(bid => ({
            auctionId: convertFieldToString(bid.id),
            amount: bid.amount,
            auctioneer: bid.auctioneer,
            txId: bid.txId,
            isWinner: false,
            isRecord: false
        }));
    }, [auctionState.bidderState, publicKey]);

    // Group all bids by auction ID
    const groupedBids = useMemo(() => {
        const groups = {};
        [...activeBids, ...winningBids].forEach(bid => {
            if (!groups[bid.auctionId]) {
                groups[bid.auctionId] = [];
            }
            groups[bid.auctionId].push(bid);
        });
        return groups;
    }, [activeBids, winningBids]);

    const BidsList = ({ bids, emptyText }) => (
        <List
            itemLayout="vertical"
            dataSource={Object.entries(bids)}
            renderItem={([auctionId, auctionBids]) => (
                <List.Item key={auctionId}>
                    <Card
                        type="inner"
                        title={`Auction ID: ${auctionId}`}
                        extra={<span>Total Bids: {auctionBids.length}</span>}
                    >
                        <List
                            size="small"
                            dataSource={auctionBids}
                            renderItem={bid => (
                                <List.Item>
                                    <div style={{ width: '100%' }}>
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }}>
                                            <div>
                                                <p><strong>Amount:</strong> {bid.amount}</p>
                                                {!bid.isRecord && (
                                                    <>
                                                        <p><strong>Auctioneer:</strong> {bid.auctioneer}</p>
                                                        <p><strong>Transaction ID:</strong> {bid.txId}</p>
                                                    </>
                                                )}
                                                {bid.isRecord && (
                                                    <>
                                                        <p><strong>Auction Id:</strong> {bid.auctionId}</p>
                                                        <p><strong>Bid Id:</strong> {bid.bidId}</p>
                                                        <p><strong>Bidder:</strong> {publicKey}</p>
                                                    </>
                                                )}
                                        </div>
                                        {bid.isWinner && (
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
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>
                </List.Item>
            )}
            locale={{ emptyText }}
        />
    );

    return (
        <Card
            title="My Bids"
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
                    <div>Please connect your wallet to view your bids</div>
                </>
            ) : (
                <BidsList 
                    bids={groupedBids} 
                    emptyText="No bids found" 
                />
            )}
        </Card>
    );
};
