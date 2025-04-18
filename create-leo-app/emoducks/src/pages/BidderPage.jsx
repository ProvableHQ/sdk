import { Card, Form, Input, Button, List, Typography, message } from 'antd';
import { useState } from 'react';
import { AleoWorker } from "../workers/AleoWorker";

const aleoWorker = AleoWorker();

export const BidderPage = () => {
    const [account, setAccount] = useState(null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bidForm] = Form.useForm();

    const layout = {
        labelCol: { span: 4 },
        wrapperCol: { span: 20 },
    };

    const handleSetAccount = async (value) => {
        try {
            setLoading(true);
            await aleoWorker.setAccount(value);
            setAccount(value);
            message.success('Account set successfully');
        } catch (error) {
            console.error('Error setting account:', error);
            message.error('Failed to set account');
            setAccount(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceBid = async (values) => {
        if (!account) {
            message.error('Please set your account first');
            return;
        }

        try {
            setLoading(true);
            const result = await aleoWorker.placeBid(values.amount, values.auctionId);
            message.success('Bid placed successfully');
            bidForm.resetFields();
            
            // Add the new bid to the list
            setBids(prevBids => [...prevBids, {
                auctionId: values.auctionId,
                amount: values.amount,
                id: result.id // Assuming the worker returns a bid ID
            }]);
        } catch (error) {
            console.error('Error placing bid:', error);
            message.error('Failed to place bid');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <Card 
                title="Aleo Account" 
                style={{ marginBottom: '24px' }}
            >
                <Form {...layout}>
                    <Form.Item 
                        label="Private Key"
                        required
                        tooltip="Your Aleo private key is required to place bids"
                    >
                        <Input.Password
                            placeholder="Enter your Aleo private key"
                            onChange={(e) => handleSetAccount(e.target.value)}
                            value={account}
                            disabled={loading}
                        />
                    </Form.Item>
                    {account && (
                        <Form.Item wrapperCol={{ offset: 4 }}>
                            <Typography.Text type="success">
                                Account set ✓
                            </Typography.Text>
                        </Form.Item>
                    )}
                </Form>
            </Card>

            <Card 
                title="Place Bid" 
                style={{ marginBottom: '24px' }}
            >
                <Form 
                    {...layout}
                    form={bidForm}
                    onFinish={handlePlaceBid}
                >
                    <Form.Item 
                        label="Amount"
                        name="amount"
                        rules={[
                            { required: true, message: 'Please enter bid amount' },
                            { pattern: /^\d+$/, message: 'Please enter a valid number' }
                        ]}
                    >
                        <Input placeholder="Enter bid amount" disabled={!account || loading} />
                    </Form.Item>
                    <Form.Item 
                        label="Auction ID"
                        name="auctionId"
                        rules={[{ required: true, message: 'Please enter auction ID' }]}
                    >
                        <Input placeholder="Enter auction ID" disabled={!account || loading} />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 4 }}>
                        <Button 
                            type="primary" 
                            htmlType="submit"
                            loading={loading}
                            disabled={!account}
                        >
                            Submit Bid
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Card title="Open Bids">
                <List
                    dataSource={bids}
                    renderItem={(bid) => (
                        <List.Item>
                            <Typography.Text>
                                Auction ID: {bid.auctionId} - Amount: {bid.amount}
                            </Typography.Text>
                        </List.Item>
                    )}
                    locale={{ emptyText: 'No bids placed yet' }}
                />
            </Card>
        </div>
    );
};