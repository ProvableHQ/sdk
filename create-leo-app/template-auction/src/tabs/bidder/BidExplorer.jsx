import React from 'react';
import { Tabs, Card } from 'antd';
import { OpenBids } from './components/OpenBids';
import { PastBids } from './components/PastBids';

export const BidExplorer = () => {
    return (
        <Card style={{ width: '100%', height: '100%' }}>
            <Tabs
                defaultActiveKey="1"
                items={[
                    {
                        key: '1',
                        label: 'My Open Bids',
                        children: <OpenBids />,
                    },
                    {
                        key: '2',
                        label: 'Past Bids',
                        children: <PastBids />,
                    },
                ]}
            />
        </Card>
    );
};