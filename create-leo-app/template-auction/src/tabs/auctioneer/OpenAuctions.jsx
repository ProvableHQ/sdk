import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { PROGRAM_ID } from '../../core/constants.js';
import { removeVisbilityModifiers } from '../../core/processing.js';
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

    const fetchAuctionData = async () => {
        setLoading(true);
        let networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");

        try {
            const records = await requestRecords(PROGRAM_ID);
            const auctionTickets = records.filter(record =>
                record.recordName === "AuctionTicket" && !record.spent
            );
            const privateBids = records
                .filter(record => record.recordName === "PrivateBid")
                .map(record => {
                    record = removeVisbilityModifiers(record);

                    const auctionId = record.data.bid.auction_id;
                    const amount = parseInt(
                        record.data.bid.amount.replace('u64', '')
                    );
                    const id = record.data.bid_id;
                    const bidPublicKey = record.data.bid_id;

                    return {
                        auctionId,
                        id,
                        amount,
                        bidPublicKey,
                    };
                });

            const processedData = {};
            for (const ticketRecord of auctionTickets) {
                const ticket = removeVisbilityModifiers(structuredClone(ticketRecord));
                const auctionId = ticket.data.auction_id;

                let isPublic = ticket.data.settings.auction_privacy !== '0field';
                // try {
                //     const publicAuctionData = (await networkClient.getProgramMappingPlaintext(
                //         PROGRAM_ID,
                //         'public_auctions',
                //         auctionId
                //     )).toObject();
                //     isPublic = !!publicAuctionData;
                // } catch (e) {
                //     console.warn(`Error checking public status for auction ${auctionId}:`, e);
                // }

                let auctioneerAddress = ticket.owner;

                let highestBid = 0;
                try {
                    highestBid = (await networkClient.getProgramMappingPlaintext(
                        PROGRAM_ID,
                        'highest_bids',
                        auctionId
                    )).toObject();
                } catch (e) {
                    console.warn(`Error fetching highest bid for auction ${auctionId}:`, e);
                }

                let totalBids = 0;
                try {
                    totalBids = (await networkClient.getProgramMappingPlaintext(
                        PROGRAM_ID,
                        'bid_count',
                        auctionId
                    )).toObject();
                } catch (e) {
                    console.warn(`Error fetching bid count for auction ${auctionId}:`, e);
                }

                const publicBids = await fetchPublicBids(auctionId);

                processedData[auctionId] = {
                    ticketRecord,
                    ticket,
                    auctionId,
                    isPublic,
                    auctioneerAddress,
                    highestBid: highestBid || 0,
                    totalBids: totalBids || 0,
                    publicBids,
                    privateBids: privateBids,
                };
            }

            setAuctionData(processedData);
        } catch (error) {
            console.error('Error fetching auction data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPublicBids = async (auctionId) => {
        return [];
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
