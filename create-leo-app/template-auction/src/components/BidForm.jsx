import React from 'react';
import { Modal, Form, Input, InputNumber, Button, Checkbox } from 'antd';
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import { PROGRAM_ID } from '../core/constants';
import { Scalar } from '@provablehq/sdk';

export const BidForm = ({ visible, onCancel, auctionData, bidType }) => {
    const { publicKey, requestTransaction } = useWallet();
    const [form] = Form.useForm();

    const handleSubmit = async (values) => {
        try {
            // Generate a random nonce
            const nonce = Scalar.random().toString();
            
            let inputs = [];
            if (bidType === 'private') {
                inputs = [
                    values.amount.toString() + "u64",
                    auctionData.auctionId,
                    values.auctioneerAddress || auctionData.auctioneerAddress, // Use form input if no address provided
                    "2group",
                    nonce,
                ];
                console.log(inputs);
                const transaction = Transaction.createTransaction(
                    publicKey,
                    WalletAdapterNetwork.TestnetBeta,
                    PROGRAM_ID,
                    'bid_private',
                    inputs,
                    90000,
                    false,
                );
                
                await requestTransaction(transaction);
            } else {
                inputs = [
                    values.amount.toString() + "u64",
                    auctionData.auctionId,
                    nonce,
                    values.publishAddress.toString() || "false",
                ];
                console.log(inputs);
                
                const transaction = Transaction.createTransaction(
                    publicKey,
                    WalletAdapterNetwork.TestnetBeta,
                    PROGRAM_ID,
                    'bid_public',
                    inputs,
                    90000,
                    false,
                );
                
                await requestTransaction(transaction);
            }

            form.resetFields();
            onCancel();
        } catch (error) {
            console.error('Error submitting bid:', error);
        }
    };

    return (
        <Modal
            title={`Place ${bidType === 'private' ? 'Private' : 'Public'} Bid`}
            open={visible}
            onCancel={onCancel}
            footer={null}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    name="amount"
                    label="Bid Amount"
                    rules={[
                        { required: true, message: 'Please enter bid amount' },
                        { type: 'number', min: auctionData.startingBid, message: `Minimum bid is ${auctionData.startingBid}` }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Enter bid amount in microcredits"
                    />
                </Form.Item>

                {bidType === 'private' && !auctionData.auctioneerAddress && (
                    <Form.Item
                        name="auctioneerAddress"
                        label="Auctioneer Address"
                        rules={[
                            { required: true, message: 'Please enter the auctioneer address' },
                            { 
                                pattern: /^aleo1[a-z0-9]{58}$/i,
                                message: 'Please enter a valid Aleo address'
                            }
                        ]}
                    >
                        <Input placeholder="Enter auctioneer's Aleo address" />
                    </Form.Item>
                )}

                {bidType === 'public' && (
                    <Form.Item
                        name="publishAddress"
                        valuePropName="checked"
                    >
                        <Checkbox>
                            Show my address publicly
                        </Checkbox>
                    </Form.Item>
                )}

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Submit Bid
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}; 