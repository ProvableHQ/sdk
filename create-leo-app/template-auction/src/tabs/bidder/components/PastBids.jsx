import React, { useState, useEffect } from 'react';
import { Card, List, Button, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { PROGRAM_ID } from '../../../core/constants';
import { AleoNetworkClient } from '@provablehq/sdk';
import { removeVisbilityModifiers } from '../../../core/processing';

const { Text } = Typography;

export const PastBids = () => {
    const { connected, requestRecords } = useWallet();
    const [loading, setLoading] = useState(false);
    const [pastBids, setPastBids] = useState([]);
    const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");

    const fetchPastBids = async () => {
        if (!connected) return;
        
        setLoading(true);
        try {
            const records = await requestRecords(PROGRAM_ID);
            const bids = records.filter(record => 
                record.recordName === "BidReceipt"
            ).map(removeVisbilityModifiers);

            // Check which auctions have winners
            const closedBids = await Promise.all(bids.map(async (bid) => {
                try {
                    const winner = await networkClient.getProgramMappingPlaintext(
                        PROGRAM_ID,
                        'winning_bids',
                        bid.auction_id
                    );
                    return winner ? bid : null;
                } catch {
                    return null;
                }
            }));

            setPastBids(closedBids.filter(bid => bid !== null));
        } catch (error) {
            console.error('Error fetching past bids:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (connected) {
            fetchPastBids();
        }
    }, [connected]);

    return (
        <Card
            title="Your Past Bids"
            extra={
                <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchPastBids}
                    loading={loading}
                    disabled={!connected}
                >
                    Refresh
                </Button>
            }
        >
            <List
                dataSource={pastBids}
                renderItem={(bid) => (
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Text strong>Auction ID: {bid.auction_id}</Text>
                        <Text>Bid Amount: {bid.bid.amount}</Text>
                        <Text>Bid ID: {bid.bid_id}</Text>
                        <Text type="secondary">Status: Auction Closed</Text>
                    </Card>
                )}
                locale={{ emptyText: connected ? 'No past bids found' : 'Please connect your wallet' }}
            />
        </Card>
    );
}; 