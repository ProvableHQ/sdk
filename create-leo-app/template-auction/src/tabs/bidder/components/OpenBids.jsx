import React, { useState, useEffect } from 'react';
import { Card, List, Button, Typography, Row, Col, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { PROGRAM_ID } from '../../../core/constants';
import { removeVisbilityModifiers } from '../../../core/processing';
import { parseAleoStyle } from '../../../core/processing';
import { fieldsToString } from '../../../core/encoder';

const { Text } = Typography;

export const OpenBids = () => {
    const { connected, requestRecords } = useWallet();
    const [loading, setLoading] = useState(false);
    const [openBids, setOpenBids] = useState([]);
    const [auctionMetadata, setAuctionMetadata] = useState({});

    const fetchAuctionMetadata = async () => {
        try {
            // Fetch both public auctions and records for auction invites
            const [publicAuctionsRes, records] = await Promise.all([
                fetch(`https://api.testnet.aleoscan.io/v2/mapping/list_program_mapping_values/${PROGRAM_ID}/public_auctions`),
                connected ? requestRecords(PROGRAM_ID) : Promise.resolve([])
            ]);

            const publicAuctionsData = await publicAuctionsRes.json();
            const metadata = {};

            // Process public auctions
            for (const auction of publicAuctionsData.result) {
                const auctionData = parseAleoStyle(auction.value);
                try {
                    const metadataUrl = fieldsToString(
                        auctionData.item.offchain_data.map(field => 
                            BigInt(field.replace('field', ''))
                        )
                    );
                    const metadataResponse = await fetch(metadataUrl);
                    const json = await JSON.parse(await metadataResponse.json());
                    metadata[auction.key] = {
                        name: auctionData.name,
                        image: json.image
                    };
                } catch (error) {
                    console.warn('Error fetching metadata for public auction:', auction.key, error);
                }
            }

            // Process auction invites
            const auctionInvites = records.filter(record => 
                record.recordName === "AuctionInvite" && !record.spent
            ).map(removeVisbilityModifiers);

            for (const invite of auctionInvites) {
                try {
                    const metadataUrl = fieldsToString(
                        invite.data.auction.item.offchain_data.map(field => 
                            BigInt(field.replace('field', ''))
                        )
                    );
                    const metadataResponse = await fetch(metadataUrl);
                    const json = await JSON.parse(await metadataResponse.json());
                    metadata[invite.data.auction_id] = {
                        name: invite.data.auction.name,
                        image: json.image
                    };
                } catch (error) {
                    console.warn('Error fetching metadata for invite auction:', invite.data.auction_id, error);
                }
            }

            setAuctionMetadata(metadata);
        } catch (error) {
            console.error('Error fetching auction metadata:', error);
        }
    };

    const fetchOpenBids = async () => {
        if (!connected) return;
        
        setLoading(true);
        try {
            const records = await requestRecords(PROGRAM_ID);
            const bids = records.filter(record => 
                record.recordName === "BidReceipt" && !record.spent
            ).map(removeVisbilityModifiers);
            setOpenBids(bids);
            await fetchAuctionMetadata();
        } catch (error) {
            console.error('Error fetching bid receipts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (connected) {
            fetchOpenBids();
        }
    }, [connected]);

    return (
        <Card
            title="Your Open Bids"
            extra={
                <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchOpenBids}
                    loading={loading}
                    disabled={!connected}
                >
                    Refresh
                </Button>
            }
        >
            <List
                dataSource={openBids}
                renderItem={(bid) => {
                    const auction = auctionMetadata[bid.data.auction_id];
                    const shortAuctionId = `${bid.data.auction_id.substring(0, 20)}...field`;

                    return (
                        <Card size="small" style={{ marginBottom: 16 }}>
                            <Row align="middle" gutter={16}>
                                {auction && (
                                    <Col span={4}>
                                        <img 
                                            src={auction.image} 
                                            alt="Auction item"
                                            style={{ 
                                                width: '50px',
                                                height: '50px',
                                                objectFit: 'cover',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </Col>
                                )}
                                <Col span={auction ? 20 : 24}>
                                    <Space direction="vertical" size={0}>
                                        <Text strong>
                                            Bid Amount: {parseInt(bid.data.bid.amount.replace('u64', '')) / 1_000_000} ALEO
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            Auction ID: {shortAuctionId}
                                        </Text>
                                        {auction && (
                                            <Text type="secondary">
                                                Auction: {auction.name}
                                            </Text>
                                        )}
                                    </Space>
                                </Col>
                            </Row>
                        </Card>
                    );
                }}
                locale={{ emptyText: connected ? 'No open bids found' : 'Please connect your wallet' }}
            />
        </Card>
    );
}; 