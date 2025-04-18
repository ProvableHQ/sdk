import React from 'react';
import { Modal, Form, InputNumber, Button, Checkbox } from 'antd';
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import { PROGRAM_ID } from '../core/constants';
import { Scalar } from '@provablehq/sdk';

export const BidForm = ({ visible, onCancel, auctionData, bidType }) => {
    const [ showAddress, setShowAddress ] = React.useState(false);
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
                    auctionData.auctioneer,
                    "2group",
                    nonce,
                ];

                console.log("Inputs for Private Bid:", inputs);
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
                    values.publishAddress?.toString() || "false", // Optional: show bidder address
                ];
                console.log(values);
                console.log(bidType);
                
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
                        { type: 'number', min: auctionData.starting_bid, message: `Minimum bid is ${auctionData.starting_bid}` }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Enter bid amount in microcredits"
                    />
                </Form.Item>

                {bidType === 'public' && (
                    <Form.Item
                        name="publishAddress"
                        valuePropName="checked"
                    >
                        <Checkbox checked={showAddress} >
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