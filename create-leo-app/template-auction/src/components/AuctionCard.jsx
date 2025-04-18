import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Image, Statistic, Typography, Tabs, List, Button, Space, Tag, Divider } from 'antd';
import { convertFieldToString, fieldsToString } from '../core/encoder.js';
import { removeVisbilityModifiers } from '../core/processing.js';
import { BidForm } from './BidForm';
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { InviteForm } from './InviteForm';
import { Transaction } from '@demox-labs/aleo-wallet-adapter-base';
import { PROGRAM_ID } from '../core/constants';


const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const AuctionCard = ({ auctionId, data, loading }) => {
    const { ticketRecord, ticket, highestBid, totalBids, publicBids, privateBids } = data;
    const auctionName = convertFieldToString(ticket.data.auction.name);
    const itemData = ticket.data.auction.item;
    const bidTypesAccepted = ticket.data.settings.bid_types_accepted;
    const startingBid = parseInt(removeVisbilityModifiers(ticket.data.auction.starting_bid).replace('u64', ''));
    const { publicKey, requestTransaction } = useWallet();
    const isPublic = data.isPublic;
    const auctioneerAddress = data.auctioneerAddress;
    const matchingPrivateBids = privateBids.filter(bid => bid.auctionId === auctionId);

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
        if (!isOwner()) {
            return (
                <Row gutter={[8, 8]} justify="end">
                    {(bidTypesAccepted === '0field' || bidTypesAccepted === '2field') && (
                        <Col>
                            <Button 
                                type="primary"
                                onClick={() => showBidForm('private')}
                            >
                                Bid Privately
                            </Button>
                        </Col>
                    )}
                    {(bidTypesAccepted === '1field' || bidTypesAccepted === '2field') && (
                        <Col>
                            <Button 
                                type="default"
                                onClick={() => showBidForm('public')}
                            >
                                Bid Publicly
                            </Button>
                        </Col>
                    )}
                </Row>
            );
        }
        return null;
    };

    const renderOwnerButtons = () => {
        if (isOwner()) {
            return (
                <Button 
                    type="primary"
                    block
                    onClick={() => setInviteFormVisible(true)}
                >
                    Invite to Bid
                </Button>
            );
        }
        return null;
    };

    const findHighestBidAmount = () => {
        let highestAmount = 0;
        
        // Check public bids
        publicBids.forEach(bid => {
            const amount = parseInt(bid.amount);
            if (amount > highestAmount) {
                highestAmount = amount;
            }
        });

        // Check private bids
        matchingPrivateBids.forEach(bid => {
            const amount = parseInt(bid.amount);
            if (amount > highestAmount) {
                highestAmount = amount;
            }
        });

        return highestAmount;
    };

    const handleSelectWinner = async (bid, isPrivate) => {
        try {
            const inputs = isPrivate ? 
                // Inputs for private winner selection
                [
                    ticketRecord,     // Use original AuctionTicket record
                    bid.originalRecord, // Use original PrivateBid record
                ] :
                // Inputs for public winner selection
                [
                    ticketRecord,     // Use original AuctionTicket record
                    bid,
                    bid.id,          // winning_bid_id
                ];
            
            console.log('Inputs:', inputs);

            const transaction = Transaction.createTransaction(
                publicKey,
                PROGRAM_ID,
                isPrivate ? 'select_winner_private' : 'select_winner_public',
                inputs,
                0.276, // Fee in credits
            );

            const result = await requestTransaction(transaction);
            console.log(`${isPrivate ? 'Private' : 'Public'} winner selection transaction:`, result);
        } catch (error) {
            console.error('Error selecting winner:', error);
        }
    };

    const renderBidCard = (bid, isPrivate = true) => {
        const bidAmount = parseInt(bid.amount);
        const isHighestBid = bidAmount === findHighestBidAmount();

        console.log('Bid:', bid);
        console.log('Is private:', isPrivate);
        
        return (
            <Card size="small" style={{ marginBottom: '8px' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Space direction="vertical" size={0}>
                            <Text>Bid Amount: {bidAmount / 1_000_000} ALEO</Text>
                            <Text type="secondary">
                                Bid ID: {bid.id.substring(0, 21)}..
                            </Text>
                            {isHighestBid && (
                                <Tag color="#87d068">Highest Bid</Tag>
                            )}
                        </Space>
                    </Col>
                    <Col>
                        {isOwner() && isHighestBid && (
                            <Button 
                                type="primary"
                                size="small"
                                onClick={() => handleSelectWinner(bid, isPrivate)}
                            >
                                Select Winner
                            </Button>
                        )}
                    </Col>
                </Row>
            </Card>
        );
    };

    const renderStatusTags = () => (
        <Space>
            <Tag color={isPublic ? '#1890ff' : '#f50'}>
                {isPublic ? 'Public Auction' : 'Private Auction'}
            </Tag>
            {isOwner() && (
                <Tag color="#52c41a">Your Auction</Tag>
            )}
        </Space>
    );

    return (
        <Card
            key={auctionId}
            style={{ width: '100%', marginBottom: '16px' }}
            loading={loading}
        >
            <Row align="middle" style={{ marginBottom: 8 }}>
                <Col flex="auto">
                    <Space size="middle" align="center">
                        <Title level={4} style={{ margin: 0 }}>{auctionName}</Title>
                        {renderStatusTags()}
                    </Space>
                </Col>
            </Row>
            <Divider style={{ margin: '0 0 16px 0' }} />

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
                    <div style={{ marginTop: '16px' }}>
                        {renderOwnerButtons()}
                    </div>
                </Col>
                <Col span={16}>
                    <Row gutter={[16, 16]}>
                        <Col span={18}>
                            <Row gutter={[16, 16]}>
                                <Col span={8}>
                                    <Statistic title="Starting Bid" value={startingBid / 1_000_000.0} suffix="ALEO" />
                                </Col>
                                <Col span={8}>
                                    <Statistic 
                                        title="Highest Bid" 
                                        value={findHighestBidAmount() / 1_000_000} 
                                        suffix="ALEO" 
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic title="Total Bids" value={totalBids} />
                                </Col>
                            </Row>
                        </Col>
                        <Col span={6}>
                            <Statistic title="Bid Types" value={getBidTypeLabel(bidTypesAccepted)} />
                        </Col>
                    </Row>
                    
                    <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                        {renderBidButtons()}
                    </div>

                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Private Bids" key="1">
                            <List
                                dataSource={matchingPrivateBids}
                                renderItem={bid => renderBidCard(bid, true)}
                                locale={{ emptyText: 'No private bids yet' }}
                            />
                        </TabPane>
                        <TabPane tab="Public Bids" key="2">
                            <List
                                dataSource={publicBids}
                                renderItem={bid => renderBidCard(bid, false)}
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
                ticketRecord={ticketRecord}
            />
        </Card>
    );
};
