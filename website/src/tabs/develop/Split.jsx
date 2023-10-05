import { useState, useEffect } from "react";
import { Button, Card, Col, Form, Input, Row, Result, Spin } from "antd";
import axios from "axios";

export const Split = () => {
    const [amountRecord, setAmountRecord] = useState(null);
    const [splitUrl, setSplitUrl] = useState("https://api.explorer.aleo.org/v1");
    const [splitAmount, setSplitAmount] = useState("1.0");
    const [loading, setLoading] = useState(false);
    const [privateKey, setPrivateKey] = useState(null);
    const [splitError, setSplitError] = useState(null);
    const [status, setStatus] = useState("");
    const [transactionID, setTransactionID] = useState(null);
    const [worker, setWorker] = useState(null);

    function spawnWorker() {
        let worker = new Worker(
            new URL("../../workers/worker.js", import.meta.url),
            { type: "module" },
        );
        worker.addEventListener("message", (ev) => {
            if (ev.data.type == "SPLIT_TRANSACTION_COMPLETED") {
                const transactionId = ev.data.splitTransaction;
                setLoading(false);
                setSplitError(null);
                setTransactionID(transactionId);
            } else if (ev.data.type == "ERROR") {
                setSplitError(ev.data.errorMessage);
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

    const split = async () => {
        setLoading(true);
        setTransactionID(null);
        setSplitError(null);

        const amount = parseFloat(amountString());
        if (isNaN(amount)) {
            setSplitError("Amount is not a valid number");
            setLoading(false);
            return;
        } else if (amount <= 0) {
            setSplitError("Amount must be greater than 0");
            setLoading(false);
            return;
        }

        await postMessagePromise(worker, {
            type: "ALEO_SPLIT",
            splitAmount: amount,
            record: amountRecordString(),
            privateKey: privateKeyString(),
            url: peerUrl(),
        });
    };

    function postMessagePromise(worker, message) {
        return new Promise((resolve, reject) => {
            worker.onmessage = (event) => {
                resolve(event.data);
            };
            worker.onerror = (error) => {
                setSplitError(error);
                setLoading(false);
                setTransactionID(null);
                reject(error);
            };
            worker.postMessage(message);
        });
    }

    const onUrlChange = (event) => {
        if (event.target.value !== null) {
            setSplitUrl(event.target.value);
        }
        return splitUrl;
    };

    const onAmountChange = (event) => {
        if (event.target.value !== null) {
            setSplitAmount(event.target.value);
        }
        setTransactionID(null);
        setSplitError(null);
        return splitAmount;
    };

    const onAmountRecordChange = (event) => {
        if (event.target.value !== null) {
            setAmountRecord(event.target.value);
        }
        setTransactionID(null);
        setSplitError(null);
        return amountRecord;
    };

    const onPrivateKeyChange = (event) => {
        if (event.target.value !== null) {
            setPrivateKey(event.target.value);
        }
        setTransactionID(null);
        setSplitError(null);
        return privateKey;
    };

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };
    const amountString = () => (splitAmount !== null ? splitAmount : "");
    const privateKeyString = () => (privateKey !== null ? privateKey : "");
    const amountRecordString = () =>
        amountRecord !== null ? amountRecord : "";
    const transactionIDString = () =>
        transactionID !== null ? transactionID : "";
    const splitErrorString = () => (splitError !== null ? splitError : "");
    const peerUrl = () => (splitUrl !== null ? splitUrl : "");

    return (
        <Card
            title="Split Record"
            style={{ width: "100%"}}
        >
            <Form {...layout}>
                <Form.Item
                    label="Split Amount"
                    colon={false}
                    validateStatus={status}
                >
                    <Input.TextArea
                        name="split amount"
                        size="large"
                        placeholder="Amount to split record into"
                        allowClear
                        onChange={onAmountChange}
                        value={amountString()}
                    />
                </Form.Item>
                <Form.Item label="Record" colon={false} validateStatus={status}>
                    <Input.TextArea
                        name="Record"
                        size="small"
                        placeholder="Record to split"
                        allowClear
                        onChange={onAmountRecordChange}
                        value={amountRecordString()}
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
                            onClick={split}
                        >
                            Split
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
                    <Spin tip="Creating Split..." size="large" />
                )}
                {transactionID !== null && (
                    <Result
                        status="success"
                        title="Split Successful!"
                        subTitle={"Transaction ID: " + transactionIDString()}
                    />
                )}
                {splitError !== null && (
                    <Result
                        status="error"
                        title="Split Error"
                        subTitle={"Error: " + splitErrorString()}
                    />
                )}
            </Row>
        </Card>
    );
};
