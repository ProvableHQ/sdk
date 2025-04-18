import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { PROGRAM_ID } from '../../core/constants.js';
import { removeVisbilityModifiers } from '../../core/processing.js';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useAuctionState } from '../../components/AuctionState.jsx';
import { AleoNetworkClient } from '@provablehq/sdk';
import { AuctionCard } from '../../components/AuctionCard.jsx';

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
            const privateBids = records.filter(record =>
                record.recordName === "PrivateBid"
            ).map(record => (removeVisbilityModifiers(record)));

            const processedData = {};
            for (let ticket of auctionTickets) {
                ticket = removeVisbilityModifiers(ticket);
                const auctionId = ticket.data.auction_id;
                console.log(ticket);

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

            setAuctionData(removeVisbilityModifiers(processedData));
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
                <Text>Please connect your wallet to view your auctions</Text>
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
