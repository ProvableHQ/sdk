import React, { useState, useEffect } from 'react';
import { Card, List, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { PROGRAM_ID } from '../../../core/constants';
import { AuctionCard } from '../../../components/AuctionCard';
import { removeVisbilityModifiers } from '../../../core/processing';

export const InvitedAuctions = () => {
    const { connected, requestRecords } = useWallet();
    const [loading, setLoading] = useState(false);
    const [invitedAuctions, setInvitedAuctions] = useState([]);

    const fetchInvitedAuctions = async () => {
        if (!connected) return;
        
        setLoading(true);
        try {
            const records = await requestRecords(PROGRAM_ID);
            const invites = records.filter(record => 
                record.recordName === "AuctionInvite" && !record.spent
            ).map(removeVisbilityModifiers);
            setInvitedAuctions(invites);
        } catch (error) {
            console.error('Error fetching auction invites:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (connected) {
            fetchInvitedAuctions();
        }
    }, [connected]);

    return (
        <Card
            title="Auctions You're Invited To"
            extra={
                <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchInvitedAuctions}
                    loading={loading}
                    disabled={!connected}
                >
                    Refresh
                </Button>
            }
        >
            <List
                dataSource={invitedAuctions}
                renderItem={(invite) => (
                    <AuctionCard auctionData={invite.auction} loading={loading} />
                )}
                locale={{ emptyText: connected ? 'No auction invites found' : 'Please connect your wallet' }}
            />
        </Card>
    );
}; 