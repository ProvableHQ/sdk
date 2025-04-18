import React, { useState, useEffect } from 'react';
import { Card, List, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { AleoNetworkClient } from '@provablehq/sdk';
import { PROGRAM_ID } from '../../../core/constants';
import { AuctionCard } from '../../../components/AuctionCard';

export const PublicAuctions = () => {
    const [loading, setLoading] = useState(false);
    const [publicAuctions, setPublicAuctions] = useState([]);
    const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");

    const fetchPublicAuctions = async () => {
        setLoading(true);
        try {
            // Fetch the latest auctions from the mapping
            const auctions = await networkClient.getProgramMappings(
                PROGRAM_ID,
                'public_auctions'
            );
            setPublicAuctions(auctions);
        } catch (error) {
            console.error('Error fetching public auctions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPublicAuctions();
    }, []);

    return (
        <Card
            title="Latest Public Auctions"
            extra={
                <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchPublicAuctions}
                    loading={loading}
                >
                    Refresh
                </Button>
            }
        >
            <List
                dataSource={publicAuctions}
                renderItem={(auction) => (
                    <AuctionCard auctionData={auction} loading={loading} />
                )}
                locale={{ emptyText: 'No public auctions found' }}
            />
        </Card>
    );
}; 