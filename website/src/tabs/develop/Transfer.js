import React, { useState, useEffect } from "react";
import {Button, Card, Col, Divider, Form, Input, Row, Result, Spin, Switch} from "antd";
import axios from "axios";

export const Transfer = () => {
    const [transferFeeRecord, setTransferFeeRecord] = useState(null);
    const [amountRecord, setAmountRecord] = useState(null);
    const [transferUrl, setTransferUrl] = useState("https://vm.aleo.org/api");
    const [transferAmount, setTransferAmount] = useState("1.0");
    const [transferFee, setTransferFee] = useState("1.0");
    const [recipient, setRecipient] = useState(null);
    const [loading, setLoading] = useState(false);
    const [privateKey, setPrivateKey] = useState(null);
    const [transferError, setTransferError] = useState(null);
    const [status, setStatus] = useState("");
    const [transactionID, setTransactionID] = useState(null);
    const [worker, setWorker] = useState(null);
    const [provingKey, setProvingKey] = useState(null);

    function spawnWorker() {
        let worker = new Worker("./worker.js");
        worker.addEventListener("message", ev => {
            if (ev.data.type == 'TRANSFER_TRANSACTION_COMPLETED') {
                let [transaction, url] = ev.data.transferTransaction
                axios.post(url + "/testnet3/transaction/broadcast", transaction, {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }).then(
                    (response) => {
                        setLoading(false);
                        setTransferError(null);
                        setTransactionID(response.data);
                    }
                )
            } else if (ev.data.type == 'ERROR') {
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
                spawnedWorker.terminate()
            };
        }
    }, []);

    const transfer = async (event) => {
        setLoading(true)
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

        await postMessagePromise(worker, {
            type: 'ALEO_TRANSFER',
            privateKey: privateKeyString(),
            amountCredits: amount,
            transfer_type: "private",
            recipient: recipientString(),
            amountRecord: amountRecordString(),
            fee: feeAmount,
            feeRecord: feeRecordString(),
            url: peerUrl(),
        });
    }

    function postMessagePromise(worker, message) {
        return new Promise((resolve, reject) => {
            worker.onmessage = event => {
                resolve(event.data);
            };
            worker.onerror = error => {
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
    }

    const onAmountChange = (event) => {
        if (event.target.value !== null) {
            setTransferAmount(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return transferAmount;
    }

    const onTransferFeeChange = (event) => {
        if (event.target.value !== null) {
            setTransferFee(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return transferFee;
    }

    const onAmountRecordChange = (event) => {
        if (event.target.value !== null) {
            setAmountRecord(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return amountRecord;
    }

    const onTransferFeeRecordChange = (event) => {
        if (event.target.value !== null) {
            setTransferFeeRecord(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return transferFeeRecord;
    }

    const onRecipientChange = (event) => {
        if (event.target.value !== null) {
            setRecipient(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return recipient;
    }

    const onPrivateKeyChange = (event) => {
        if (event.target.value !== null) {
            setPrivateKey(event.target.value);
        }
        setTransactionID(null);
        setTransferError(null);
        return privateKey;
    }

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };
    const feeString = () => transferFee !== null ? transferFee : "";
    const amountString = () => transferAmount !== null ? transferAmount : "";
    const recipientString = () => recipient !== null ? recipient : "";
    const privateKeyString = () => privateKey !== null ? privateKey : "";
    const feeRecordString = () => transferFeeRecord !== null ? transferFeeRecord : "";
    const amountRecordString = () => amountRecord !== null ? amountRecord : "";
    const transactionIDString = () => transactionID !== null ? transactionID : "";
    const transferErrorString = () => transferError !== null ? transferError : "";
    const peerUrl = () => transferUrl !== null ? transferUrl : "";


    return <Card title="Transfer"
                 style={{width: "100%", borderRadius: "20px"}}
                 bordered={false}>
        <Form {...layout}>
            <Form.Item label="Recipient Address"
                       colon={false}
                       validateStatus={status}
            >
                <Input.TextArea name="recipient"
                                size="middle"
                                placeholder="Transfer recipient address"
                                allowClear
                                onChange={onRecipientChange}
                                value={recipientString()}
                                style={{borderRadius: '20px'}}/>
            </Form.Item>
            <Form.Item label="Amount"
                       colon={false}
                       validateStatus={status}
            >
                <Input.TextArea name="amount"
                                size="large"
                                placeholder="Amount"
                                allowClear
                                onChange={onAmountChange}
                                value={amountString()}
                                style={{borderRadius: '20px'}}/>
            </Form.Item>
            <Form.Item label="Amount Record"
                       colon={false}
                       validateStatus={status}
            >
                <Input.TextArea name="Amount Record"
                                size="small"
                                placeholder="Record used to pay transfer amount"
                                allowClear
                                onChange={onAmountRecordChange}
                                value={amountRecordString()}
                                style={{borderRadius: '20px'}}/>
            </Form.Item>
            <Form.Item label="Fee"
                       colon={false}
                       validateStatus={status}
            >
                <Input.TextArea name="Fee"
                                size="small"
                                placeholder="Fee"
                                allowClear
                                onChange={onTransferFeeChange}
                                value={feeString()}
                                style={{borderRadius: '20px'}}/>
            </Form.Item>
            <Form.Item label="Fee Record"
                       colon={false}
                       validateStatus={status}
            >
                <Input.TextArea name="Fee Record"
                                size="small"
                                placeholder="Record used to pay transfer fee"
                                allowClear
                                onChange={onTransferFeeRecordChange}
                                value={feeRecordString()}
                                style={{borderRadius: '20px'}}/>
            </Form.Item>
            <Form.Item label="Private Key"
                       colon={false}
                       validateStatus={status}
            >
                <Input.TextArea name="private_key"
                                size="small"
                                placeholder="Private Key"
                                allowClear
                                onChange={onPrivateKeyChange}
                                value={privateKeyString()}
                                style={{borderRadius: '20px'}}/>
            </Form.Item>
            <Form.Item label="Peer Url"
                       colon={false}
                       validateStatus={status}
            >
                <Input.TextArea name="Peer URL"
                                size="middle"
                                placeholder="Aleo Network Node URL"
                                allowClear
                                onChange={onUrlChange}
                                value={peerUrl()}
                                style={{borderRadius: '20px'}}/>
            </Form.Item>
            <Row justify="center">
                <Col justify="center">
                    <Button type="primary" shape="round" size="middle" onClick={transfer}
                    >Transfer</Button>
                </Col>
            </Row>
        </Form>
        <Row justify="center" gutter={[16, 32]} style={{ marginTop: '48px' }}>
            {
                (loading === true) &&
                <Spin tip="Creating Transfer..." size="large"/>
            }
            {
                (transactionID !== null) &&
                <Result
                    status="success"
                    title="Transfer Successful!"
                    subTitle={"Transaction ID: " + transactionIDString()}
                />
            }
            {
                (transferError !== null) &&
                <Result
                    status="error"
                    title="Transfer Error"
                    subTitle={"Error: " + transferErrorString()}
                />
            }
        </Row>
    </Card>
}