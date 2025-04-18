import React, { useState, useEffect } from 'react';
import { Card, List, Button, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { PROGRAM_ID } from '../../../core/constants';
import { removeVisbilityModifiers } from '../../../core/processing';

const { Text } = Typography;

export const OpenBids = () => {
    const { connected, requestRecords } = useWallet();
    const [loading, setLoading] = useState(false);
    const [openBids, setOpenBids] = useState([]);

    const fetchOpenBids = async () => {
        if (!connected) return;
        
        setLoading(true);
        try {
            const records = await requestRecords(PROGRAM_ID);
            const bids = records.filter(record => 
                record.recordName === "BidReceipt" && !record.spent
            ).map(removeVisbilityModifiers);
            setOpenBids(bids);
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
                renderItem={(bid) => (
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Text strong>Auction ID: {bid.auction_id}</Text>
                        <Text>Bid Amount: {bid.bid.amount}</Text>
                        <Text>Bid ID: {bid.bid_id}</Text>
                    </Card>
                )}
                locale={{ emptyText: connected ? 'No open bids found' : 'Please connect your wallet' }}
            />
        </Card>
    );
}; 