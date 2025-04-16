import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Image, Statistic, Row, Col, Tabs, Button } from 'antd';
import { PROGRAM_ID } from "../../core/constants.js";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { useAuctionState } from "../../components/AuctionState.jsx";
import { ReloadOutlined } from "@ant-design/icons";
import { convertFieldToString } from "../../core/encoder.js";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const OpenAuctions = () => {
    const { connected, requestRecords } = useWallet();
    const { auctionState, setAuctionTickets } = useAuctionState();
    const [loading, setLoading] = useState(false);
    const [auctionData, setAuctionData] = useState({});

    // Fetch auction tickets and related data
    const fetchAuctionData = async () => {
        setLoading(true);
        try {
            // Get AuctionTicket records
            const records = await requestRecords(PROGRAM_ID);
            const auctionTickets = records.filter(record => 
                record.type === "AuctionTicket" && !record.spent
            );
            setAuctionTickets(auctionTickets);

            // Process each auction ticket
            const processedData = {};
            for (const ticket of auctionTickets) {
                const auctionId = ticket.data.auction_id;
                
                // Get highest bid for this auction
                const highestBid = await window.aleo.getMapping(
                    'private_auction.aleo',
                    'highest_bids',
                    auctionId
                );

                // Get bid counts
                const totalBids = await window.aleo.getMapping(
                    'private_auction.aleo',
                    'bid_count',
                    auctionId
                );

                // Get public bids for this auction
                const publicBids = await fetchPublicBids(auctionId);
                
                processedData[auctionId] = {
                    ticket,
                    highestBid: highestBid || 0,
                    totalBids: totalBids || 0,
                    publicBids,
                    privateBids: [], // Will be populated from PrivateBid records
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
        // This would need to be implemented based on your contract's public bid storage
        // Return structure should match your bid data structure
        return [];
    };

    useEffect(() => {
        if (connected) {
            fetchAuctionData();
        }
    }, [connected]);

    const renderAuctionCard = (auctionId, data) => {
        const { ticket, highestBid, totalBids, publicBids, privateBids } = data;
        const auctionName = convertFieldToString(ticket.data.auction.name);
        const itemData = ticket.data.auction.item;
        const bidTypesAccepted = ticket.data.settings.bid_types_accepted;

        return (
            <Card
                key={auctionId}
                title={auctionName}
                style={{ width: '100%', marginBottom: '16px' }}
                loading={loading}
            >
                <Row gutter={[16, 16]}>
                    <Col span={8}>
                        <Image
                            src={itemData.image}
                            alt={itemData.name}
                            style={{ width: '100%', borderRadius: '8px' }}
                        />
                        <Title level={5} style={{ marginTop: '8px', textAlign: 'center' }}>
                            {itemData.name}
                        </Title>
                    </Col>
                    <Col span={16}>
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Statistic 
                                    title="Highest Bid" 
                                    value={highestBid} 
                                    suffix="credits"
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic 
                                    title="Total Bids" 
                                    value={totalBids}
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic 
                                    title="Bid Types" 
                                    value={getBidTypeLabel(bidTypesAccepted)}
                                />
                            </Col>
                        </Row>

                        <Tabs defaultActiveKey="1" style={{ marginTop: '16px' }}>
                            <TabPane tab="Private Bids" key="1">
                                <List
                                    dataSource={privateBids}
                                    renderItem={bid => (
                                        <Card size="small" style={{ marginBottom: '8px' }}>
                                            <Row justify="space-between">
                                                <Col>Bid Amount: {bid.amount}</Col>
                                                <Col>Bid ID: {bid.bid_id}</Col>
                                            </Row>
                                        </Card>
                                    )}
                                    locale={{ emptyText: 'No private bids yet' }}
                                />
                            </TabPane>
                            <TabPane tab="Public Bids" key="2">
                                <List
                                    dataSource={publicBids}
                                    renderItem={bid => (
                                        <Card size="small" style={{ marginBottom: '8px' }}>
                                            <Row justify="space-between">
                                                <Col>Bid Amount: {bid.amount}</Col>
                                                <Col>Bidder: {bid.bidder}</Col>
                                            </Row>
                                        </Card>
                                    )}
                                    locale={{ emptyText: 'No public bids yet' }}
                                />
                            </TabPane>
                        </Tabs>
                    </Col>
                </Row>
            </Card>
        );
    };

    const getBidTypeLabel = (bidType) => {
        switch (bidType) {
            case '0':
                return 'Private Only';
            case '1':
                return 'Public Only';
            case '2':
                return 'Mixed';
            default:
                return 'Unknown';
        }
    };

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
                    renderItem={([auctionId, data]) => renderAuctionCard(auctionId, data)}
                    locale={{ emptyText: 'No open auctions found' }}
                />
            )}
        </Card>
    );
}; 