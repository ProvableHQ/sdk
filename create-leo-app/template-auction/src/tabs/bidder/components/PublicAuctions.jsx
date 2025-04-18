import React, { useState, useEffect } from 'react';
import { Card, List, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { PROGRAM_ID } from '../../../core/constants';
import { parseAleoStyle, removeVisbilityModifiers } from "../../../core/processing";
import { AuctionCard } from '../../../components/AuctionCard';
import { AleoNetworkClient } from "@provablehq/sdk";
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';

export const PublicAuctions = () => {
    const { requestRecords } = useWallet();
    const [loading, setLoading] = useState(false);
    const [publicAuctions, setPublicAuctions] = useState([]);
    const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");

    const fetchAuctionData = async () => {
        setLoading(true);
        try {
            const [records, publicAuctionsRes, publicBidsRes] = await Promise.all([
                requestRecords(PROGRAM_ID),
                fetch(`https://api.testnet.aleoscan.io/v2/mapping/list_program_mapping_values/${PROGRAM_ID}/public_auctions`),
                fetch(`https://api.testnet.aleoscan.io/v2/mapping/list_program_mapping_values/${PROGRAM_ID}/public_bids`),
            ]);

            // Process public auction mapping data
            const publicAuctionsRaw = (await publicAuctionsRes.json()).result.map(entry => ({
                id: entry.key.replace('field', ''),
                data: parseAleoStyle(entry.value),
            }));

            // Process public bid mapping data
            const publicBidsRaw = (await publicBidsRes.json()).result.map(entry => ({
                id: entry.key,
                data: parseAleoStyle(entry.value),
            }));

            // Organize public bids by auctionId
            const publicBidsByAuction = {};
            publicBidsRaw.forEach(bid => {
                const auctionId = bid.data.auction_id;
                if (!publicBidsByAuction[auctionId]) publicBidsByAuction[auctionId] = [];
                publicBidsByAuction[auctionId].push({
                    amount: parseInt(bid.data.amount.replace('u64', '')),
                    id: bid.id,
                    publicKey: bid.data.bid_public_key,
                });
            });

            // Process private data from records
            const auctionTickets = records.filter(r => r.recordName === "AuctionTicket" && !r.spent);
            const privateBids = records
                .filter(r => r.recordName === "PrivateBid")
                .map(record => {
                    record = removeVisbilityModifiers(record);
                    return {
                        auctionId: record.data.bid.auction_id,
                        amount: parseInt(record.data.bid.amount.replace('u64', '')),
                        id: record.data.bid_id,
                        publicKey: record.data.bid_id,
                    };
                });

            // Merge auctions (public or private) into a unified array
            const combinedAuctions = await Promise.all(
                auctionTickets.map(async (ticketRecord) => {
                    const ticket = removeVisbilityModifiers(structuredClone(ticketRecord));
                    const auctionId = ticket.data.auction_id;
                    const isPublic = ticket.data.settings.auction_privacy !== '0field';
                    const auctioneerAddress = ticket.owner;

                    const matchingPublic = publicAuctionsRaw.find(a => a.id === auctionId);
                    const publicBids = publicBidsByAuction[auctionId] || [];
                    const privateBidsForAuction = privateBids.filter(pb => pb.auctionId === auctionId);

                    let highestBid = 0, totalBids = 0;
                    try {
                        const res = await networkClient.getProgramMappingPlaintext(PROGRAM_ID, 'highest_bids', auctionId);
                        highestBid = parseInt(res.replace('u64', ''));
                    } catch (e) {
                        console.warn(`Failed highestBid for ${auctionId}`, e);
                    }

                    try {
                        const res = await networkClient.getProgramMappingPlaintext(PROGRAM_ID, 'bid_count', auctionId);
                        totalBids = parseInt(res.replace('u64', ''));
                    } catch (e) {
                        console.warn(`Failed bid count for ${auctionId}`, e);
                    }

                    return {
                        auctionId,
                        isPublic,
                        auctioneerAddress,
                        ticket,
                        publicBids,
                        privateBids: privateBidsForAuction,
                        highestBid,
                        totalBids,
                        data: matchingPublic?.data || ticket.data,
                    };
                })
            );

            setPublicAuctions(combinedAuctions);
        } catch (error) {
            console.error('Error fetching auctions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuctionData();
    }, []);

    return (
        <Card
            title="All Auctions"
            extra={
                <Button icon={<ReloadOutlined />} onClick={fetchAuctionData} loading={loading}>
                    Refresh
                </Button>
            }
        >
            <List
                dataSource={publicAuctions}
                renderItem={(auction) => (
                    <AuctionCard
                        key={auction.auctionId}
                        auctionId={auction.auctionId}
                        data={auction}
                        loading={loading}
                    />
                )}
                locale={{ emptyText: 'No auctions found' }}
            />
        </Card>
    );
};
