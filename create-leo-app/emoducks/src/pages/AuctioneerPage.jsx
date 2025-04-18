import { Card, Form, Input, Button, List, Typography, message } from 'antd';
import { useState } from 'react';
import { AleoWorker } from "../workers/AleoWorker";

const aleoWorker = AleoWorker();

export const AuctioneerPage = () => {
    const [receivedBids, setReceivedBids] = useState([]);
    const [loading, setLoading] = useState(false);
    const [resolveForm] = Form.useForm();
    const [finishForm] = Form.useForm();

    const layout = {
        labelCol: { span: 6 },
        wrapperCol: { span: 16 },
    };

    const handleResolveBids = async (values) => {
        try {
            setLoading(true);
            const result = await aleoWorker.resolveBids(values.bid1, values.bid2);
            message.success('Bids resolved successfully');
            resolveForm.resetFields();
        } catch (error) {
            console.error('Error resolving bids:', error);
            message.error('Failed to resolve bids');
        } finally {
            setLoading(false);
        }
    };

    const handleFinishAuction = async (values) => {
        try {
            setLoading(true);
            const result = await aleoWorker.finishAuction(values.winningBid);
            message.success('Auction finished successfully');
            finishForm.resetFields();
        } catch (error) {
            console.error('Error finishing auction:', error);
            message.error('Failed to finish auction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <Typography.Title level={2}>Auction Management</Typography.Title>
            
            <Card 
                title={<Typography.Title level={4}>Current Auction Bids</Typography.Title>}
                style={{ marginBottom: '24px' }}
            >
                <List
                    dataSource={receivedBids}
                    renderItem={(bid) => (
                        <List.Item>
                            <Typography.Text>
                                Bid ID: {bid.id} - Amount: {bid.amount}
                            </Typography.Text>
                        </List.Item>
                    )}
                    locale={{ 
                        emptyText: <Typography.Text type="secondary">No bids received yet</Typography.Text> 
                    }}
                />
            </Card>

            <Card 
                title={<Typography.Title level={4}>Compare and Resolve Bids</Typography.Title>}
                style={{ marginBottom: '24px' }}
            >
                <Form 
                    {...layout}
                    form={resolveForm}
                    onFinish={handleResolveBids}
                >
                    <Form.Item 
                        label="First Bid Record"
                        name="bid1"
                        tooltip="Enter the record of the first bid to compare"
                        rules={[{ required: true, message: 'Please enter the first bid record' }]}
                    >
                        <Input.TextArea
                            placeholder="Enter the complete bid record"
                            rows={3}
                        />
                    </Form.Item>
                    <Form.Item 
                        label="Second Bid Record"
                        name="bid2"
                        tooltip="Enter the record of the second bid to compare"
                        rules={[{ required: true, message: 'Please enter the second bid record' }]}
                    >
                        <Input.TextArea
                            placeholder="Enter the complete bid record"
                            rows={3}
                        />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
                        <Button 
                            type="primary" 
                            htmlType="submit"
                            loading={loading}
                        >
                            Compare and Resolve Bids
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Card 
                title={<Typography.Title level={4}>Finalize Auction</Typography.Title>}
            >
                <Form 
                    {...layout}
                    form={finishForm}
                    onFinish={handleFinishAuction}
                >
                    <Form.Item 
                        label="Winning Bid Record"
                        name="winningBid"
                        tooltip="Enter the record of the winning bid"
                        rules={[{ required: true, message: 'Please enter the winning bid record' }]}
                    >
                        <Input.TextArea
                            placeholder="Enter the complete winning bid record"
                            rows={3}
                        />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
                        <Button 
                            type="primary" 
                            htmlType="submit"
                            loading={loading}
                        >
                            Finalize Auction with Winner
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};
