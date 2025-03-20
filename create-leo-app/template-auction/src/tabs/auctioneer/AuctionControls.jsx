import { useState, useEffect } from "react";
import { Card, Dropdown, Form, Input, Select, Radio, Button } from "antd";
import { useAuctionState } from "../../components/AuctionState.jsx";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import { encodeStringAsField } from "../../core/encoder.js";

export const AuctionControls = () => {
    // Declare local state.
    const [isAuctionSelected, setIsAuctionSelected] = useState(false);
    const [humanReadableAuctionId, setHumanReadableAuctionId] = useState("");
    const [menuProps, setMenuProps] = useState({
        items: [],
        onClick: onFirstRecordChange,
    });
    const [secondMenuProps, setSecondMenuProps] = useState({
        items: [],
        onClick: onSecondRecordChange,
    });
    const [operation, setOperation] = useState("resolve");
    const [recordOne, setRecordOne] = useState("");
    const [recordTwo, setRecordTwo] = useState("");

    // Get all necessary state hooks for outer component scope.
    const { publicKey, requestTransaction } = useWallet();
    const { auctionState, setWinningBid, findAuctioneerRecordById, findAuctioneerRecordsByAuctionId, findAllUnspentAuctionRecords } = useAuctionState();

    // Define operations that represent the auction functions.
    const operations = [
        { value: "resolve", label: "Compare Bids >>>" },
        { value: "finish", label: "Finish Auction ✓" },
    ];

    // Set the current auction ID.
    function handleSetAuctionId(auctionId) {
        try {
            if (!isAuctionSelected) {
                let records = [];
                records = findAuctioneerRecordsByAuctionId(encodeStringAsField(auctionId));
                const items = records.map(record => {
                        return {
                            "label": record.id,
                            "key": record.id
                        }
                    });
                const newProps = {
                    ...menuProps,
                    items: items,
                }
                const secondNewProps = {
                    ...secondMenuProps,
                    items: items,
                }
                setMenuProps(newProps);
                setSecondMenuProps(secondNewProps);
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
        setRecordOne(e.key);
    }

    function onSecondRecordChange(e) {
        setRecordTwo(e.key);
    }

    function firstMenuText() {
        return recordOne ? recordOne : "Select Bid";
    }
    function secondMenuText() {
        return recordTwo ? recordTwo : "Select Bid";
    }

    useEffect(() => {
        if (!humanReadableAuctionId) {
            const records = findAllUnspentAuctionRecords();
            const items = records.map(record => {
                return {
                    "label": record.id,
                    "key": record.id
                }
            });
            const newProps = {
                ...menuProps,
                items: items,
            }
            const secondNewProps = {
                ...secondMenuProps,
                items: items,
            }
            setMenuProps(newProps);
            setSecondMenuProps(secondNewProps);
        }
    }, [auctionState]);

    async function handleResolveBids(bidIdOne, bidIdTwo) {
        try {
            const recordOne = findAuctioneerRecordById(bidIdOne);
            const recordTwo = findAuctioneerRecordById(bidIdTwo);
            
            // Build the transaction request
            const transaction = Transaction.createTransaction(
                publicKey,
                WalletAdapterNetwork.TestnetBeta,
                "private_auction.aleo",
                "resolve",
                [recordOne, recordTwo],
                30000,
                false,
            );

            // Request the transaction from the wallet
            await requestTransaction(transaction);

            setRecordOne("");
            setRecordTwo("");
            
        } catch (error) {
            console.error('Error resolving bids:', error);
        }
    }

    async function handleFinishAuction(winningBidId) {
        try {
            // Find the winning bid record.
            const recordOne = findAuctioneerRecordById(winningBidId);
            
            // Build the transaction request.
            const transaction = Transaction.createTransaction(
                publicKey,
                WalletAdapterNetwork.TestnetBeta,
                "private_auction.aleo",
                "finish",
                [recordOne],
                30000,
                false,
            );

            // Request the transaction from the wallet.
            const txId = await requestTransaction(transaction);

            // Find the winning bid record.
            console.log('Finished auction Tx:', txId);
            
            // Mark the bid as winning in our state.
            setWinningBid({
                ...winningBidId,
                txId,
            });

            // Clear the record field.
            setRecordOne("");
            
        } catch (error) {
            console.error('Error finishing auction:', error);
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
                    <Dropdown.Button menu={menuProps}>
                        {firstMenuText()}
                    </Dropdown.Button>
                </Form.Item>

                {operation === "resolve" && (
                    <Form.Item
                        label={<span style={{ whiteSpace: 'nowrap' }}>Second Bid</span>}
                        colon={false}
                        style={{ marginBottom: '24px' }}
                    >
                        <Dropdown.Button menu={secondMenuProps}>
                            {secondMenuText()}
                        </Dropdown.Button>
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
