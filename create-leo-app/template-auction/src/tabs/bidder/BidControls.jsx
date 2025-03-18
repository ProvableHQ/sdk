import { useState, useEffect } from "react";
import { Card, Divider, Form, Input, Select, Radio, Button } from "antd";
import { useAuctionState } from "../../components/AuctionState.jsx";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction } from "@demox-labs/aleo-wallet-adapter-base";
import { encodeStringAsField } from "../../core/encoder.js";

export const BidControls = () => {
    const [bidAmount, setBidAmount] = useState("");
    const {auctionState, setAuctionState } = useAuctionState();
    const [auctioneerAddress, setAuctioneerAddress] = useState("");
    const [humanReadableAuctionId, setHumanReadableAuctionId] = useState("");
    const [currentAuctionId, setCurrentAuctionId] = useState("");
    const [isAuctionSelected, setIsAuctionSelected] = useState(false);
    const { publicKey, requestTransaction, connected, disconnect, network, wallet } = useWallet();

    // Update the auction state with the new bid.
    function addNewBid(amount, auctioneer, bidder, id, txId) {
        setAuctionState({
            ...auctionState,
            bidderState: {
                ...auctionState.bidderState,
                [bidder]: {
                    ...auctionState.bidderState[bidder],
                    bids: [
                        ...(auctionState.bidderState[bidder]?.bids || []),
                        {
                            amount,
                            auctioneer,
                            bidder,
                            id,
                            txId,
                        },
                    ],
                },
            },
        });
    }

    // Set the current auction ID.
    function handleSetAuctionId(auctionId) {
        try {
            setCurrentAuctionId(encodeStringAsField(auctionId));
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

        // Build the transaction request.
        const transaction = Transaction.createTransaction(
            publicKey,
            network,
            "private_auction.aleo",
            "place_bid",
            [bidder, auctioneer, id, amountInput],
            0.05,
            false,
        )

        // Request the transaction from the wallet.
        const txId = await requestTransaction(transaction);

    }

    const layout = {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
        style: { marginBottom: '24px' }
    };

    return (
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
                            onClick={() => handleSetAuctionId(currentAuctionId)}
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
    );
};
