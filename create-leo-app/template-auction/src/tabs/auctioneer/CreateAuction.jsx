import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Radio, Button, InputNumber, Table, Image, Typography, Space, Checkbox } from 'antd';
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import { encodeStringAsField } from "../../core/encoder.js";

const { Text, Paragraph } = Typography;

const PREDEFINED_ITEMS = [
    {
        id: 1,
        name: "Pink Stuffie",
        metadata: "https://raw.githubusercontent.com/iamalwaysuncomfortable/imagestorage/refs/heads/main/stuffie2.json"
    },
    {
        id: 2,
        name: "Bear stuffie",
        metadata: "https://raw.githubusercontent.com/iamalwaysuncomfortable/imagestorage/refs/heads/main/stuffie3.json"
    },
    {
        id: 3,
        name: "Mouse Stuffie",
        metadata: "https://raw.githubusercontent.com/iamalwaysuncomfortable/imagestorage/refs/heads/main/stuffie4.json"
    },
    {
        id: 4,
        name: "Purple Stuffie",
        metadata: "https://raw.githubusercontent.com/iamalwaysuncomfortable/imagestorage/refs/heads/main/stuffie5.json"
    },
    // Add more predefined items as needed
];

export const CreateAuction = () => {
    const { publicKey, requestTransaction } = useWallet();
    const [form] = Form.useForm();
    const [selectedItemData, setSelectedItemData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [auctionType, setAuctionType] = useState('private');

    // Add useEffect to load the first item on mount
    useEffect(() => {
        const firstItem = PREDEFINED_ITEMS[0];
        if (firstItem) {
            fetchItemMetadata(firstItem.metadata);
        }
    }, []);

    // Fetch and process item metadata
    const fetchItemMetadata = async (metadataUrl) => {
        try {
            setLoading(true);
            const response = await fetch(metadataUrl);
            const data = JSON.parse(await response.json());
            setSelectedItemData(data);
        } catch (error) {
            console.error('Error fetching item metadata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemSelect = (itemId) => {
        const selectedItem = PREDEFINED_ITEMS.find(item => item.id === itemId);
        if (selectedItem) {
            fetchItemMetadata(selectedItem.metadata);
        } else {
            setSelectedItemData(null);
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (!selectedItemData) {
                throw new Error('No item selected');
            }

            // Generate a random nonce (you might want to implement a more secure way)
            const nonce = Math.floor(Math.random() * 1000000);

            // Encode the auction name as a field
            const encodedName = encodeStringAsField(values.auctionName);

            // Encode the metadata URL as a field array (split into 4 parts)
            const selectedItem = PREDEFINED_ITEMS.find(item => item.id === values.itemId);
            const metadataUrl = selectedItem.metadata;
            const encodedMetadata = encodeStringAsField(metadataUrl);

            // Create the transaction inputs based on auction type
            const inputs = [
                values.bidTypesAccepted, // bid types accepted (0 = private, 1 = public, 2 = mix)
                encodeStringAsField(values.itemId.toString()), // item id
                encodedName, // auction name
                [encodedMetadata, encodedMetadata, encodedMetadata, encodedMetadata], // item offchain data (repeated to match [field; 4])
                values.startingBid, // starting bid
                nonce, // nonce
            ];

            // Add publishAddress parameter for public auctions
            if (values.auctionType === 'public') {
                inputs.push(values.publishAddress);
            }

            // Create the transaction
            const transaction = Transaction.createTransaction(
                publicKey,
                WalletAdapterNetwork.TestnetBeta,
                'private_auction.aleo',
                values.auctionType === 'public' ? 'create_public_auction' : 'create_private_auction',
                inputs,
                30000,
                false,
            );

            // Request the transaction
            await requestTransaction(transaction);

            // Reset form after successful submission
            form.resetFields();
            setSelectedItemData(null);

        } catch (error) {
            console.error('Error creating auction:', error);
        }
    };

    // Configure the attributes table
    const columns = [
        {
            title: 'Trait',
            dataIndex: 'trait_type',
            key: 'trait_type',
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
        },
    ];

    const handleAuctionTypeChange = (value) => {
        setAuctionType(value);
    };

    return (
        <Card title="Create New Auction">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    auctionType: 'private',
                    bidTypesAccepted: '0',
                    publishAddress: false,
                    itemId: PREDEFINED_ITEMS[0].id  // Set initial itemId
                }}
            >
                <Form.Item
                    name="auctionType"
                    label="Auction Type"
                    rules={[{ required: true }]}
                >
                    <Radio.Group onChange={(e) => handleAuctionTypeChange(e.target.value)}>
                        <Radio.Button value="private">Private Auction</Radio.Button>
                        <Radio.Button value="public">Public Auction</Radio.Button>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    name="auctionName"
                    label="Auction Name"
                    rules={[{ required: true, message: 'Please enter an auction name' }]}
                >
                    <Input placeholder="Enter auction name" />
                </Form.Item>

                {auctionType === 'public' && (
                    <Form.Item
                        name="publishAddress"
                        valuePropName="checked"
                    >
                        <Checkbox>
                            Hide Address
                        </Checkbox>
                    </Form.Item>
                )}

                <Form.Item
                    name="startingBid"
                    label="Starting Bid Amount"
                    rules={[{ required: true, message: 'Please enter a starting bid amount' }]}
                >
                    <InputNumber
                        min={1}
                        placeholder="Enter starting bid amount (microcredits)"
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                <Form.Item
                    name="bidTypesAccepted"
                    label="Accepted Bid Types"
                    rules={[{ required: true }]}
                >
                    <Select>
                        <Select.Option value="0">Private Bids Only</Select.Option>
                        <Select.Option value="1">Public Bids Only</Select.Option>
                        <Select.Option value="2">Both Public and Private Bids</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="itemId"
                    label="Select Item"
                    rules={[{ required: true, message: 'Please select an item' }]}
                >
                    <Select onChange={handleItemSelect}>
                        {PREDEFINED_ITEMS.map(item => (
                            <Select.Option key={item.id} value={item.id}>
                                {item.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                {selectedItemData && (
                    <div style={{ marginTop: '32px' }}>
                        <Typography.Title level={3} style={{ 
                            textAlign: 'center',
                            marginBottom: '24px',
                            borderBottom: '1px solid #f0f0f0',
                            paddingBottom: '16px'
                        }}>
                            Selected Item Details
                        </Typography.Title>
                        
                        <Card 
                            loading={loading} 
                            bordered={true}
                            style={{
                                borderRadius: '8px'
                            }}
                        >
                            <div style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                <Typography.Title 
                                    level={4} 
                                    style={{ 
                                        margin: 0,
                                        color: '#1890ff'
                                    }}
                                >
                                    {selectedItemData.name}
                                </Typography.Title>

                                <div style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}>
                                    <Image
                                        src={selectedItemData.image}
                                        alt={selectedItemData.name}
                                        style={{ 
                                            maxWidth: '100%',
                                            height: 'auto',
                                            borderRadius: '4px'
                                        }}
                                        preview={true}
                                    />
                                </div>

                                <div style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <Paragraph style={{
                                        fontSize: '16px',
                                        lineHeight: '1.6',
                                        margin: 0
                                    }}>
                                        {selectedItemData.description}
                                    </Paragraph>
                                </div>

                                <div style={{ width: '100%' }}>
                                    <Typography.Title 
                                        level={5} 
                                        style={{ 
                                            marginBottom: '16px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        Item Attributes
                                    </Typography.Title>
                                    <Table
                                        columns={columns}
                                        dataSource={selectedItemData.attributes.map((attr, index) => ({
                                            ...attr,
                                            key: index
                                        }))}
                                        pagination={false}
                                        size="middle"
                                        style={{
                                            borderRadius: '8px',
                                            overflow: 'hidden'
                                        }}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Create Auction
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}; 