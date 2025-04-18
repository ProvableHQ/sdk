import React, { useState, useEffect } from 'react';
import { List, Card, Typography, Space, Skeleton, Row, Col } from 'antd';
import { PROGRAM_ID } from '../../../core/constants';
import { parseAleoStyle } from '../../../core/processing';
import { fieldsToString } from '../../../core/encoder';

const { Text, Title } = Typography;

export const ActiveBids = () => {
    const [loading, setLoading] = useState(true);
    const [bids, setBids] = useState([]);
    const [auctionMetadata, setAuctionMetadata] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch bids and auctions in parallel
            const [bidsResponse, auctionsResponse] = await Promise.all([
                fetch(`https://api.testnet.aleoscan.io/v2/mapping/list_program_mapping_values/${PROGRAM_ID}/public_bids`),
                fetch(`https://api.testnet.aleoscan.io/v2/mapping/list_program_mapping_values/${PROGRAM_ID}/public_auctions`)
            ]);

            const bidsData = await bidsResponse.json();
            const auctionsData = await auctionsResponse.json();

            // Process auctions first to create a metadata lookup
            const auctionsMetadata = {};
            for (const auction of auctionsData.result) {
                const auctionData = parseAleoStyle(auction.value);
                const metadataUrl = fieldsToString(
                    auctionData.item.offchain_data.map(field => 
                        BigInt(field.replace('field', ''))
                    )
                );

                try {
                    const metadataResponse = await fetch(metadataUrl);
                    const metadata = await JSON.parse(await metadataResponse.json());
                    auctionsMetadata[auction.key] = {
                        name: auctionData.name,
                        image: metadata.image,
                        auctionId: auction.key
                    };
                } catch (error) {
                    console.warn('Error fetching metadata for auction:', auction.key, error);
                }
            }
            setAuctionMetadata(auctionsMetadata);

            // Process bids
            const processedBids = bidsData.result
                .map(bid => {
                    const bidData = parseAleoStyle(bid.value);
                    return {
                        id: bid.key,
                        amount: parseInt(bidData.amount.replace('u64', '')),
                        auctionId: bidData.auction_id,
                    };
                })
                .slice(0, 100); // Limit to 100 bids

            setBids(processedBids);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <List
            grid={{ gutter: 16, column: 1 }}
            dataSource={bids}
            loading={loading}
            style={{ 
                maxHeight: '600px', 
                overflowY: 'auto',
                scrollBehavior: 'smooth'
            }}
            renderItem={bid => {
                const auction = auctionMetadata[bid.auctionId];
                const shortAuctionId = `${bid.auctionId.substring(0, 20)}...field`;

                return (
                    <List.Item>
                        <Card size="small">
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
                                            Bid Amount: {bid.amount / 1_000_000} ALEO
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
                    </List.Item>
                );
            }}
        />
    );
}; 