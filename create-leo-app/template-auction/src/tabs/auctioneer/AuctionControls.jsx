import { useState, useEffect } from "react";
import { Card, Divider, Form, Input, Select, Radio, Button } from "antd";
import { useAuctionState } from "../../components/AuctionState.jsx";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction } from "@demox-labs/aleo-wallet-adapter-base";
import { encodeStringAsField } from "../../core/encoder.js";

export const AuctionControls = () => {
    const { auctionState, setWinningBid, addAuctioneerRecord } = useAuctionState();
    const [currentAuctionId, setCurrentAuctionId] = useState("");
    const [isAuctionSelected, setIsAuctionSelected] = useState(false);
    const [humanReadableAuctionId, setHumanReadableAuctionId] = useState("");
    const [loading, setLoading] = useState(false);
    const [operation, setOperation] = useState("resolve");
    const [recordOne, setRecordOne] = useState("");
    const [recordTwo, setRecordTwo] = useState("");
    const [selectedAuction, setSelectedAuction] = useState("");
    const { publicKey, requestTransaction, requestRecords, connected, disconnect, network, wallet } = useWallet();

    const operations = [
        { value: "resolve", label: "Compare Bids >>>" },
        { value: "finish", label: "Finish Auction ✓" },
    ];

    // Set the current auction ID.
    function handleSetAuctionId(auctionId) {
        try {
            if (!isAuctionSelected) {
                setCurrentAuctionId(encodeStringAsField(auctionId));
            }
            setIsAuctionSelected(isAuctionSelected => !isAuctionSelected);
        } catch (error) {
            console.error('Error converting auction ID:', error);
        }
    }

    function onAuctionIdChange(e) {
        setHumanReadableAuctionId(e.target.value);
    }

    function onFirstRecordChange(e) {
        setRecordOne(e.target.value);
    }

    function onSecondRecordChange(e) {
        setRecordTwo(e.target.value);
    }

    async function handleResolveBids(bidOne, bidTwo) {
        try {
            setLoading(true);
            
            // Build the transaction request
            const transaction = Transaction.createTransaction(
                publicKey,
                network,
                "private_auction.aleo",
                "resolve",
                [bidOne, bidTwo],
                0.05,
                false,
            );

            // Request the transaction from the wallet
            const txId = await requestTransaction(transaction);

            setRecordOne("");
            setRecordTwo("");
            
        } catch (error) {
            console.error('Error resolving bids:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleFinishAuction(winningBid) {
        try {
            setLoading(true);
            
            // Build the transaction request
            const transaction = Transaction.createTransaction(
                publicKey,
                network,
                "private_auction.aleo",
                "finish",
                [winningBid],
                0.05,
                false,
            );

            // Request the transaction from the wallet
            const txId = await requestTransaction(transaction);
            
            // Mark the bid as winning in our state
            setWinningBid({
                ...winningBid,
                txId,
            });

            setRecordOne("");
            
        } catch (error) {
            console.error('Error finishing auction:', error);
        } finally {
            setLoading(false);
        }
    }

    const onOperationChange = (value) => {
        setOperation(value);
    };

    const layout = {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
        style: { marginBottom: '24px' }
    };

    return (
        <Card
            title="Auctioneer Actions"
            style={{ width: "100%" }}
        >
            <Form {...layout}>
                <Form.Item
                    label={<span style={{ whiteSpace: 'nowrap' }}>Auction ID</span>}
                    colon={false}
                    style={{ marginBottom: '24px' }}
                >
                    <Input.Group compact>
                        <Input
                            name="AuctionID"
                            size="large"
                            placeholder="Enter the Auction ID"
                            value={humanReadableAuctionId}
                            allowClear={true}
                            disabled={isAuctionSelected}
                            onChange={onAuctionIdChange}
                            style={{ width: 'calc(100% - 110px)' }}
                        />
                        <Button
                            size="large"
                            onClick={() => handleSetAuctionId(humanReadableAuctionId)}
                            style={{ width: '110px' }}
                        >
                            {isAuctionSelected ? "Change" : "Select"}
                        </Button>
                    </Input.Group>
                </Form.Item>

                <Form.Item
                    label={<span style={{ whiteSpace: 'nowrap' }}>Operation</span>}
                    colon={false}
                    style={{ marginBottom: '24px' }}
                >
                    <Radio.Group
                        value={operation}
                        onChange={(e) => onOperationChange(e.target.value)}
                        size="large"
                    >
                        {operations.map(op => (
                            <Radio.Button key={op.value} value={op.value}>
                                {op.label}
                            </Radio.Button>
                        ))}
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    label={<span style={{ whiteSpace: 'nowrap' }}>First Bid</span>}
                    colon={false}
                    style={{ marginBottom: '24px' }}
                >
                    <Input.Group compact>
                        <Input
                            name="bid"
                            size="large"
                            placeholder="Enter bid ID"
                            allowClear
                            value={recordOne}
                            onChange={onFirstRecordChange}
                            style={{ width: 'calc(100% - 110px)' }}
                        />
                    </Input.Group>
                </Form.Item>

                {operation === "resolve" && (
                    <Form.Item
                        label={<span style={{ whiteSpace: 'nowrap' }}>Second Bid</span>}
                        colon={false}
                        style={{ marginBottom: '24px' }}
                    >
                        <Input.Group compact>
                            <Input
                                name="bidTwo"
                                size="large"
                                placeholder="Enter bid ID"
                                value={recordTwo}
                                allowClear={true}
                                onChange={onSecondRecordChange}
                                style={{ width: 'calc(100% - 110px)' }}
                            />
                        </Input.Group>
                    </Form.Item>
                )}

                {operation === "resolve" && (
                    <Form.Item
                        label={<span style={{ whiteSpace: 'nowrap' }}></span>}
                        colon={false}
                        style={{ marginBottom: '24px' }}
                    >
                        <Button
                            size="large"
                            onClick={() => handleResolveBids(recordOne, recordTwo)}
                            style={{ width: '110px' }}
                            >
                            Compare Bids
                        </Button>
                    </Form.Item>
                )}

                {operation === "finish" && (
                    <Form.Item
                        label={<span style={{ whiteSpace: 'nowrap' }}>Finish Auction</span>}
                        colon={false}
                        style={{ marginBottom: '24px' }}
                    >
                        <Button
                            size="large"
                            onClick={() => handleFinishAuction(recordOne)}
                            style={{ width: '110px' }}
                            >
                            Finish Auction
                        </Button>
                    </Form.Item>
                )}
            </Form>
        </Card>
    );
};
