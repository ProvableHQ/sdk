import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Image, Statistic, Typography, Tabs, List, Button, Space, Tag } from 'antd';
import { convertFieldToString, fieldsToString } from '../core/encoder.js';
import { removeVisbilityModifiers } from '../core/processing.js';
import { BidForm } from './BidForm';
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { InviteForm } from './InviteForm';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const AuctionCard = ({ auctionId, data, loading }) => {
    const { ticket, highestBid, totalBids, publicBids, privateBids } = data;
    const auctionName = convertFieldToString(ticket.data.auction.name);
    const itemData = ticket.data.auction.item;
    const bidTypesAccepted = ticket.data.settings.bid_types_accepted;
    const startingBid = parseInt(removeVisbilityModifiers(ticket.data.auction.starting_bid).replace('u64', ''));
    const { publicKey } = useWallet();
    const isPublic = data.isPublic;
    const auctioneerAddress = data.auctioneerAddress;

    const [metadata, setMetadata] = useState({ image: '', name: '' });
    const [bidFormVisible, setBidFormVisible] = useState(false);
    const [bidType, setBidType] = useState(null);
    const [inviteFormVisible, setInviteFormVisible] = useState(false);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const metadataUrl = fieldsToString(
                    itemData.offchain_data.map(image =>
                        BigInt(removeVisbilityModifiers(image).replace('field', ''))
                    )
                );
                const res = await fetch(metadataUrl);
                const json = await JSON.parse(await res.json());
                setMetadata({ image: json.image, name: json.name });
            } catch (err) {
                console.warn('Error fetching metadata for auction', auctionId, err);
            }
        };
        fetchMetadata();
    }, [auctionId]);

    const getBidTypeLabel = (bidType) => {
        switch (bidType) {
            case '0field':
                return 'Private Only';
            case '1field':
                return 'Public Only';
            case '2field':
                return 'Mixed';
            default:
                return 'Unknown';
        }
    };

    const showBidForm = (type) => {
        setBidType(type);
        setBidFormVisible(true);
    };

    const handleBidFormCancel = () => {
        setBidFormVisible(false);
        setBidType(null);
    };

    const isOwner = () => {
        return publicKey && ticket.owner === publicKey;
    };

    const renderBidButtons = () => {
        return (
            <Space>
                {isOwner() && (
                    <Button 
                        type="primary"
                        onClick={() => setInviteFormVisible(true)}
                    >
                        Invite to Bid
                    </Button>
                )}
                {(bidTypesAccepted === '0field' || bidTypesAccepted === '2field') && (
                    <Button 
                        type="primary"
                        onClick={() => showBidForm('private')}
                    >
                        Bid Privately
                    </Button>
                )}
                {(bidTypesAccepted === '1field' || bidTypesAccepted === '2field') && (
                    <Button 
                        type="default"
                        onClick={() => showBidForm('public')}
                    >
                        Bid Publicly
                    </Button>
                )}
            </Space>
        );
    };

    return (
        <Card
            key={auctionId}
            title={
                <Space>
                    {auctionName}
                    <Tag color={isPublic ? '#1890ff' : '#f50'}>
                        {isPublic ? 'Public Auction' : 'Private Auction'}
                    </Tag>
                </Space>
            }
            style={{ width: '100%', marginBottom: '16px' }}
            loading={loading}
            extra={renderBidButtons()}
        >
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Image
                        src={metadata.image || null}
                        alt={metadata.name}
                        style={{ width: '100%', borderRadius: '8px' }}
                        fallback="https://via.placeholder.com/150"
                    />
                    <Title level={5} style={{ marginTop: '8px', textAlign: 'center' }}>
                        {metadata.name}
                    </Title>
                    {auctioneerAddress && (
                        <Typography.Text type="secondary" style={{ 
                            display: 'block', 
                            textAlign: 'center',
                            wordBreak: 'break-all',
                            marginTop: '8px'
                        }}>
                            Auctioneer: {auctioneerAddress}
                        </Typography.Text>
                    )}
                </Col>
                <Col span={16}>
                    <Row gutter={[16, 16]}>
                        <Col span={6}>
                            <Statistic title="Starting Bid" value={startingBid / 1_000_000.0} suffix="ALEO" />
                        </Col>
                        <Col span={6}>
                            <Statistic title="Highest Bid" value={highestBid / 1_000_000.0} suffix="ALEO" />
                        </Col>
                        <Col span={6}>
                            <Statistic title="Total Bids" value={totalBids} />
                        </Col>
                        <Col span={6}>
                            <Statistic title="Bid Types" value={getBidTypeLabel(bidTypesAccepted)} />
                        </Col>
                    </Row>

                    <Tabs defaultActiveKey="1" style={{ marginTop: '16px' }}>
                        <TabPane tab="Private Bids" key="1">
                            <List
                                dataSource={privateBids}
                                renderItem={bid => (
                                    <Card size="small" style={{ marginBottom: '8px' }}>
                                        <Row justify="space-between">
                                            <Col>Bid Amount: {bid.amount / 1_000_000}</Col>
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
                                            <Col>Bid Amount: {bid.amount / 1_000_000}</Col>
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

            <BidForm
                visible={bidFormVisible}
                onCancel={handleBidFormCancel}
                auctionData={data}
                bidType={bidType}
            />
            
            <InviteForm
                visible={inviteFormVisible}
                onCancel={() => setInviteFormVisible(false)}
                auctionTicket={ticket}
            />
        </Card>
    );
};
