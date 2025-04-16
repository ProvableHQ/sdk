import { useState } from "react";
import { encodeStringAsField } from "../../core/encoder.js";
import { Card, Form, Input, Button, InputNumber, Modal, Typography } from "antd";
import { PROGRAM_ID } from "../../core/constants.js";
import { useAuctionState } from "../../components/AuctionState.jsx";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction } from "@demox-labs/aleo-wallet-adapter-base";
import { WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { QuestionCircleOutlined } from "@ant-design/icons";

export const BidControls = () => {
    const [bidAmount, setBidAmount] = useState("");
    const { addNewBid } = useAuctionState();
    const { publicKey, requestTransaction, connected, disconnect, network, wallet } = useWallet()
    const [auctioneerAddress, setAuctioneerAddress] = useState("");
    const [humanReadableAuctionId, setHumanReadableAuctionId] = useState("");
    const [currentAuctionId, setCurrentAuctionId] = useState("");
    const [isAuctionSelected, setIsAuctionSelected] = useState(false);
    const [isInstructionsVisible, setIsInstructionsVisible] = useState(false);

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

    // Handle the auction ID change in the auction ID text field.
    function onAuctionIdChange(e) {
        setHumanReadableAuctionId(e.target.value);
    }

    function onAuctioneerAddressChange(e) {
        setAuctioneerAddress(e.target.value);
    }

    function onBidAmountChange(e) {
        setBidAmount(e.target.value);
    }

    async function handleMakeBid(
        bidder,
        auctioneer,
        id,
        amount,
    ) {
        const amountInput = amount.toString() + "u64";

        try {
            // Build the transaction request
            const transaction = Transaction.createTransaction(
                publicKey,
                WalletAdapterNetwork.TestnetBeta,
                PROGRAM_ID,
                "place_bid",
                [bidder, auctioneer, id, amountInput],
                30000,
                false,
            );

            console.log(`Network ${network}, publicKey ${publicKey}`);
            console.log(`Transaction {"address": ${transaction.address}, "chainID": ${transaction.chainId}, "fee": ${transaction.fee}, "transitions": ${transaction.transitions}}`);

            // Request the transaction from the wallet
            const txId = await requestTransaction(transaction);

            // Add the bid to our state management
            addNewBid(
                amount,
                auctioneer,
                bidder,
                id,
                txId,
            );
            
            // Clear form
            setBidAmount("");
            setAuctioneerAddress("");
        } catch (error) {
            console.error('Error making bid:', error);
        }
    }

    const layout = {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
        style: { marginBottom: '24px' }
    };

    const InstructionsModal = () => (
        <Modal
            title="How to Place a Bid"
            open={isInstructionsVisible}
            onOk={() => setIsInstructionsVisible(false)}
            onCancel={() => setIsInstructionsVisible(false)}
            width={600}
        >
            <Typography.Title level={4}>Steps to Place a Bid:</Typography.Title>
            <Typography.Paragraph>
                1. Enter the Auction ID you want to bid on
            </Typography.Paragraph>
            <Typography.Paragraph>
                2. Enter your bid amount (must be greater than 0)
            </Typography.Paragraph>
            <Typography.Paragraph>
                3. Click "Place Bid" to submit your bid
            </Typography.Paragraph>

            <Typography.Title level={4} style={{ marginTop: '20px' }}>Important Notes:</Typography.Title>
            <Typography.Paragraph>
                • Make sure your wallet is connected
            </Typography.Paragraph>
            <Typography.Paragraph>
                • Your bid will be private and encrypted
            </Typography.Paragraph>
            <Typography.Paragraph>
                • You can place multiple bids on the same auction
            </Typography.Paragraph>
            <Typography.Paragraph>
                • The auctioneer will compare bids and determine the winner
            </Typography.Paragraph>
        </Modal>
    );

    return (
        <>
            <Button
                type="primary"
                size="large"
                icon={<QuestionCircleOutlined />}
                onClick={() => setIsInstructionsVisible(true)}
                style={{
                    marginBottom: '20px',
                    width: '100%',
                    height: '50px',
                    fontSize: '18px'
                }}
            >
                How to Place a Bid
            </Button>

            <Card
                title="Bidder Actions"
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
                        label={<span style={{ whiteSpace: 'nowrap' }}>Auctioneer Address</span>}
                        colon={false}
                        style={{ marginBottom: '24px' }}
                    >
                        <Input.Group compact>
                            <Input
                                name="bid"
                                size="large"
                                placeholder="Enter auctioneer address"
                                allowClear
                                value={auctioneerAddress}
                                onChange={onAuctioneerAddressChange}
                                style={{ width: 'calc(100% - 110px)' }}
                            />
                        </Input.Group>
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ whiteSpace: 'nowrap' }}>Bid Amount</span>}
                        colon={false}
                        style={{ marginBottom: '24px' }}
                    >
                        <Input.Group compact>
                            <Input
                                name="amount"
                                size="large"
                                placeholder="Enter bid amount"
                                allowClear
                                value={bidAmount}
                                onChange={onBidAmountChange}
                                style={{ width: 'calc(100% - 110px)' }}
                            />
                        </Input.Group>
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ whiteSpace: 'nowrap' }}></span>}
                        colon={false}
                        style={{ marginBottom: '24px' }}
                    >
                        <Button
                            size="large"
                            onClick={() => handleMakeBid(
                                publicKey,
                                auctioneerAddress,
                                currentAuctionId,
                                bidAmount,
                            )}
                            style={{ width: '110px' }}
                        >
                            Make Bid
                        </Button>
                    </Form.Item>

                </Form>
            </Card>

            <InstructionsModal />
        </>
    );
};
