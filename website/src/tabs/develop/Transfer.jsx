import { useState, useEffect } from "react";
import {Button, Card, Col, Dropdown, Form, Input, Row, Result, Space, Spin, Switch} from "antd";
import { DownOutlined } from "@ant-design/icons";
import axios from "axios";

export const Transfer = () => {
    const [transferFeeRecord, setTransferFeeRecord] = useState(null);
    const [amountRecord, setAmountRecord] = useState(null);
    const [transferUrl, setTransferUrl] = useState("https://api.explorer.aleo.org/v1");
    const [transferAmount, setTransferAmount] = useState("1.0");
    const [transferFee, setTransferFee] = useState("1.0");
    const [privateFee, setPrivateFee] = useState(true);
    const [recipient, setRecipient] = useState(null);
    const [loading, setLoading] = useState(false);
    const [privateKey, setPrivateKey] = useState(null);
    const [transferError, setTransferError] = useState(null);
    const [status, setStatus] = useState("");
    const [transactionID, setTransactionID] = useState(null);
    const [visibility, setVisibility] = useState("private");
    const [worker, setWorker] = useState(null);

    function spawnWorker() {
        let worker = new Worker(
            new URL("../../workers/worker.js", import.meta.url),
            { type: "module" },
        );
        worker.addEventListener("message", (ev) => {
            if (ev.data.type == "TRANSFER_TRANSACTION_COMPLETED") {
                const transactionId = ev.data.transferTransaction;
                setLoading(false);
                setTransferError(null);
                setTransactionID(transactionId);
            } else if (ev.data.type == "ERROR") {
                setTransferError(ev.data.errorMessage);
                setLoading(false);
                setTransactionID(null);
            }
        });
        return worker;
    }

    useEffect(() => {
        if (worker === null) {
            const spawnedWorker = spawnWorker();
            setWorker(spawnedWorker);
            return () => {
                spawnedWorker.terminate();
            };
        }
    }, []);

    const transfer = async () => {
        setLoading(true);
        setTransactionID(null);
        setTransferError(null);

        const feeAmount = parseFloat(feeString());
        if (isNaN(feeAmount)) {
            setTransferError("Fee is not a valid number");
            setLoading(false);
            return;
        } else if (feeAmount <= 0) {
            setTransferError("Fee must be greater than 0");
            setLoading(false);
            return;
        }

        const amount = parseFloat(amountString());
        if (isNaN(amount)) {
            setTransferError("Amount is not a valid number");
            setLoading(false);
            return;
        } else if (amount <= 0) {
            setTransferError("Amount must be greater than 0");
            setLoading(false);
            return;
        }

        let amountRecord = amountRecordString();
        if (visibilityString() === "public" || visibilityString() === "publicToPrivate") {
            amountRecord = undefined;
        }

        await postMessagePromise(worker, {
            type: "ALEO_TRANSFER",
            privateKey: privateKeyString(),
            amountCredits: amount,
            transfer_type: visibilityString(),
            recipient: recipientString(),
            amountRecord: amountRecord,
            fee: feeAmount,
            privateFee: privateFee,
            feeRecord: feeRecordString(),
            url: peerUrl(),
        });
    };

    function postMessagePromise(worker, message) {
        return new Promise((resolve, reject) => {
            worker.onmessage = (event) => {
                resolve(event.data);
            };
            worker.onerror = (error) => {
                setTransferError(error);
                setLoading(false);
                setTransactionID(null);
                reject(error);
            };
            worker.postMessage(message);
        });
    }

    const onUrlChange = (event) => {
        if (event.target.value !== null) {
            setTransferUrl(event.target.value);
        }
        return transferUrl;
    };

    const onAmountChange = (event) => {
        if (event.target.value !== null) {
            setTransferAmount(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return transferAmount;
    };

    const onTransferFeeChange = (event) => {
        if (event.target.value !== null) {
            setTransferFee(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return transferFee;
    };

    const onAmountRecordChange = (event) => {
        if (event.target.value !== null) {
            setAmountRecord(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return amountRecord;
    };

    const onTransferFeeRecordChange = (event) => {
        if (event.target.value !== null) {
            setTransferFeeRecord(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return transferFeeRecord;
    };

    const onRecipientChange = (event) => {
        if (event.target.value !== null) {
            setRecipient(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return recipient;
    };

    const onPrivateKeyChange = (event) => {
        if (event.target.value !== null) {
            setPrivateKey(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return privateKey;
    };

    const onClick = ({ key }) => {
        setTransactionID(null);
        setTransferError(null);
        console.log("Visibility changed to: ", key);
        setVisibility(key);
        if (key === "public" || key === "publicToPrivate") {
            setAmountRecord(null);
        }
    };

    const items = [
        {
            label: 'private',
            key: 'private',
        },
        {
            label: 'privateToPublic',
            key: 'privateToPublic',
        },
        {
            label: 'public',
            key: 'public',
        },
        {
            label: 'publicToPrivate',
            key: 'publicToPrivate',
        },
    ];

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };
    const feeString = () => (transferFee !== null ? transferFee : "");
    const amountString = () => (transferAmount !== null ? transferAmount : "");
    const recipientString = () => (recipient !== null ? recipient : "");
    const privateKeyString = () => (privateKey !== null ? privateKey : "");
    const feeRecordString = () =>
        transferFeeRecord !== null ? transferFeeRecord : "";
    const amountRecordString = () =>
        amountRecord !== null ? amountRecord : "";
    const transactionIDString = () =>
        transactionID !== null ? transactionID : "";
    const transferErrorString = () =>
        transferError !== null ? transferError : "";
    const peerUrl = () => (transferUrl !== null ? transferUrl : "");
    const visibilityString = () => (visibility !== null ? visibility : "private");

    return (
        <Card
            title="Transfer"
            style={{ width: "100%"}}
            extra={
            <Dropdown menu={{ items, onClick }}>
                <a onClick={(e) => e.preventDefault()}>
                    <Button>{visibilityString()}</Button>
                </a>
            </Dropdown>}
        >
            <Form {...layout}>
                <Form.Item
                    label="Recipient Address"
                    colon={false}
                    validateStatus={status}
                >
                    <Input.TextArea
                        name="recipient"
                        size="middle"
                        placeholder="Transfer recipient address"
                        allowClear
                        onChange={onRecipientChange}
                        value={recipientString()}
                    />
                </Form.Item>
                <Form.Item label="Amount" colon={false} validateStatus={status}>
                    <Input.TextArea
                        name="amount"
                        size="large"
                        placeholder="Amount"
                        allowClear
                        onChange={onAmountChange}
                        value={amountString()}
                    />
                </Form.Item>
                {
                    (visibilityString() === "privateToPublic" || visibilityString() === "private") &&
                    <Form.Item
                        label="Amount Record"
                        colon={false}
                        validateStatus={status}
                    >
                        <Input.TextArea
                            name="Amount Record"
                            size="small"
                            placeholder="Record used to pay transfer amount"
                            allowClear
                            onChange={onAmountRecordChange}
                            value={amountRecordString()}
                        />
                    </Form.Item>
                }
                <Form.Item label="Fee" colon={false} validateStatus={status}>
                    <Input.TextArea
                        name="Fee"
                        size="small"
                        placeholder="Fee"
                        allowClear
                        onChange={onTransferFeeChange}
                        value={feeString()}
                    />
                </Form.Item>
                <Form.Item
                    label="Private Fee"
                    name="private_fee"
                    valuePropName="checked"
                    initialValue={true}
                >
                    <Switch onChange={setPrivateFee} />
                </Form.Item>
                <Form.Item
                    label="Fee Record"
                    colon={false}
                    validateStatus={status}
                    hidden={!privateFee}
                >
                    <Input.TextArea
                        name="Fee Record"
                        size="small"
                        placeholder="Record used to pay transfer fee"
                        allowClear
                        onChange={onTransferFeeRecordChange}
                        value={feeRecordString()}
                    />
                </Form.Item>
                <Form.Item
                    label="Private Key"
                    colon={false}
                    validateStatus={status}
                >
                    <Input.TextArea
                        name="private_key"
                        size="small"
                        placeholder="Private Key"
                        allowClear
                        onChange={onPrivateKeyChange}
                        value={privateKeyString()}
                    />
                </Form.Item>
                <Form.Item
                    label="Peer Url"
                    colon={false}
                    validateStatus={status}
                >
                    <Input.TextArea
                        name="Peer URL"
                        size="middle"
                        placeholder="Aleo Network Node URL"
                        allowClear
                        onChange={onUrlChange}
                        value={peerUrl()}
                    />
                </Form.Item>
                <Row justify="center">
                    <Col justify="center">
                        <Button
                            type="primary"
                            
                            size="middle"
                            onClick={transfer}
                        >
                            Transfer
                        </Button>
                    </Col>
                </Row>
            </Form>
            <Row
                justify="center"
                gutter={[16, 32]}
                style={{ marginTop: "48px" }}
            >
                {loading === true && (
                    <Spin tip="Creating Transfer..." size="large" />
                )}
                {transactionID !== null && (
                    <Result
                        status="success"
                        title="Transfer Successful!"
                        subTitle={"Transaction ID: " + transactionIDString()}
                    />
                )}
                {transferError !== null && (
                    <Result
                        status="error"
                        title="Transfer Error"
                        subTitle={"Error: " + transferErrorString()}
                    />
                )}
            </Row>
        </Card>
    );
};
