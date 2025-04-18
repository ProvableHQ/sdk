import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { PROGRAM_ID } from '../../core/constants.js';
import { removeVisbilityModifiers, parseAleoStyle } from '../../core/processing.js';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useAuctionState } from '../../components/AuctionState.jsx';
import { AleoNetworkClient } from '@provablehq/sdk';
import { AuctionCard } from '../../components/AuctionCard.jsx';
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";

const { Text } = Typography;

export const OpenAuctions = () => {
    const { connected, requestRecords } = useWallet();
    const { auctionState, setAuctioneerState } = useAuctionState();
    const [loading, setLoading] = useState(false);
    const [auctionData, setAuctionData] = useState({});
    const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");

    const fetchAuctionData = async () => {
        setLoading(true);
        try {
            // Fetch all necessary data in parallel
            const [records, publicBidsRes] = await Promise.all([
                requestRecords(PROGRAM_ID),
                fetch(`https://api.testnet.aleoscan.io/v2/mapping/list_program_mapping_values/${PROGRAM_ID}/public_bids`)
            ]);

            // Process public bids
            const publicBidsData = await publicBidsRes.json();
            const publicBidsByAuction = {};
            publicBidsData.result.forEach(entry => {
                const bid = parseAleoStyle(entry.value);
                const auctionId = bid.auction_id;
                if (!publicBidsByAuction[auctionId]) {
                    publicBidsByAuction[auctionId] = [];
                }
                publicBidsByAuction[auctionId].push({
                    amount: parseInt(bid.amount.replace('u64', '')),
                    id: entry.key,
                    bidder: bid.bid_public_key
                });
            });

            // Process private bids
            const privateBids = records
                .filter(record => record.recordName === "PrivateBid")
                .map(record => {
                    record = removeVisbilityModifiers(record);
                    return {
                        auctionId: record.data.bid.auction_id,
                        amount: parseInt(record.data.bid.amount.replace('u64', '')),
                        id: record.data.bid_id,
                        bidder: record.data.bid.bid_public_key
                    };
                });

            // Process auction tickets
            const auctionTickets = records.filter(record =>
                record.recordName === "AuctionTicket" && !record.spent
            );

            const processedData = {};
            for (const ticketRecord of auctionTickets) {
                const ticket = removeVisbilityModifiers(structuredClone(ticketRecord));
                const auctionId = ticket.data.auction_id;
                const isPublic = ticket.data.settings.auction_privacy !== '0field';
                const auctioneerAddress = ticket.owner;

                // Get highest bid and total bids from network
                let highestBid = 0, totalBids = 0;
                try {
                    const highestBidRes = await networkClient.getProgramMappingPlaintext(
                        PROGRAM_ID,
                        'highest_bids',
                        auctionId
                    );
                    highestBid = parseInt(highestBidRes.replace('u64', ''));
                } catch (e) {
                    console.warn(`Error fetching highest bid for auction ${auctionId}:`, e);
                }

                try {
                    const totalBidsRes = await networkClient.getProgramMappingPlaintext(
                        PROGRAM_ID,
                        'bid_count',
                        auctionId
                    );
                    totalBids = parseInt(totalBidsRes.replace('u64', ''));
                } catch (e) {
                    console.warn(`Error fetching bid count for auction ${auctionId}:`, e);
                }

                // Combine all bids for this auction
                const auctionPublicBids = publicBidsByAuction[auctionId] || [];
                const auctionPrivateBids = privateBids.filter(bid => bid.auctionId === auctionId);

                processedData[auctionId] = {
                    ticketRecord,
                    ticket,
                    auctionId,
                    isPublic,
                    auctioneerAddress,
                    highestBid: highestBid || 0,
                    totalBids: totalBids || 0,
                    publicBids: auctionPublicBids,
                    privateBids: auctionPrivateBids
                };
            }

            setAuctionData(processedData);
        } catch (error) {
            console.error('Error fetching auction data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (connected) {
            fetchAuctionData().then(() => console.log("Auction data fetched."));
        }
    }, [connected]);

    return (
        <Card
            title="My Open Auctions"
            extra={
                <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchAuctionData}
                    loading={loading}
                    disabled={!connected}
                >
                    Refresh
                </Button>
            }
            style={{ width: '100%' }}
        >
            {!connected ? (
                <>
                    <WalletMultiButton />
                    <Text>Please connect your wallet to view your auctions</Text>
                </>
            ) : (
                <List
                    dataSource={Object.entries(auctionData)}
                    renderItem={([auctionId, data]) => (
                        <AuctionCard auctionId={auctionId} data={data} loading={loading} />
                    )}
                    locale={{ emptyText: 'No open auctions found' }}
                />
            )}
        </Card>
    );
};
