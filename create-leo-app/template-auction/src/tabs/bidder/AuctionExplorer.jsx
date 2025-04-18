import React from 'react';
import { Tabs, Card } from 'antd';
import { PublicAuctions } from './components/PublicAuctions';
import { InvitedAuctions } from './components/InvitedAuctions';

export const AuctionExplorer = () => {
    return (
        <Card style={{ width: '100%', height: '100%' }}>
            <Tabs
                defaultActiveKey="1"
                items={[
                    {
                        key: '1',
                        label: 'Public Auctions',
                        children: <PublicAuctions />,
                    },
                    {
                        key: '2',
                        label: 'Invited Auctions',
                        children: <InvitedAuctions />,
                    },
                ]}
            />
        </Card>
    );
}; 