import React, { useState, useEffect } from "react";
import {Button, Card, Col, Divider, Form, Input, Row, Result, Spin, Switch} from "antd";
import axios from "axios";

export const Transfer = () => {
    const [transferFeeRecord, setTransferFeeRecord] = useState(null);
    const [executeUrl, setTransferUrl] = useState("https://vm.aleo.org/api");
    const [transferFee, setTransferFee] = useState("1");
    const [inputs, setInputs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [privateKey, setPrivateKey] = useState(null);
    const [transferResponse, setTransferResponse] = useState(null);
    const [transferError, setTransferError] = useState(null);
    const [programID, setProgramID] = useState(null);
    const [status, setStatus] = useState("");
    const [transactionID, setTransactionID] = useState(null);
    const [worker, setWorker] = useState(null);
    const [transferOnline, setTransferOnline] = useState(false);

    function spawnWorker() {
        let worker = new Worker("./worker.js");
        worker.addEventListener("message", ev => {
            if (ev.data.type == 'TRANSFER_TRANSACTION_COMPLETED') {
                axios.post(peerUrl() + "/testnet3/transaction/broadcast", ev.data.executeTransaction.toString()).then(
                    (response) => {
                        setLoading(false);
                        setTransferResponse(null);
                        setTransferError(null);
                        setTransactionID(response.data.executeTransaction);
                    }
                )
            }});
        return worker;
    }


    useEffect(() => {
        const worker = spawnWorker();
        setWorker(worker);
    }, []);

    function postMessagePromise(worker, message) {
        return new Promise((resolve, reject) => {
            worker.onmessage = event => {
                resolve(event.data);
            };
            worker.onerror = error => {
                setTransferError(error);
                setLoading(false);
                setTransferResponse(null);
                setTransactionID(null);
                reject(error);
            };
            worker.postMessage(message);
        });
    }

    // Returns the program id if the user changes it or the "Demo" button is clicked.
    const onUrlChange = (event) => {
        if (event.target.value !== null) {
            setTransferUrl(event.target.value);
        }
        return executeUrl;
    }

    const onFunctionChange = (event) => {
        if (event.target.value !== null) {
            setFunctionID(event.target.value);
        }
        setTransactionID(null);
        setTransferResponse(null);
        setTransferError(null);
        return functionID;
    }

    const onProgramChange = (event) => {
        if (event.target.value !== null) {
            setProgram(event.target.value);
        }
        setTransactionID(null);
        setTransferResponse(null);
        setTransferError(null);
        return program;
    }

    const onExecutionFeeChange = (event) => {
        if (event.target.value !== null) {
            setTransferFee(event.target.value);
        }
        setTransactionID(null);
        setTransferResponse(null);
        setTransferError(null);
        return transferFee;
    }

    const onExecutionFeeRecordChange = (event) => {
        if (event.target.value !== null) {
            setTransferFeeRecord(event.target.value);
        }
        setTransactionID(null);
        setTransferResponse(null);
        setTransferError(null);
        return transferFeeRecord;
    }

    const onInputsChange = (event) => {
        if (event.target.value !== null) {
            setInputs(event.target.value);
        }
        setTransactionID(null);
        setTransferResponse(null);
        setTransferError(null);
        return inputs;
    }

    const onPrivateKeyChange = (event) => {
        if (event.target.value !== null) {
            setPrivateKey(event.target.value);
        }
        setTransactionID(null);
        setTransferResponse(null);
        setTransferError(null);
        return privateKey;
    }

    // Calls `tryRequest` when the search bar input is entered.
    const onSearch = (value) => {
        setLoading(false);
        setTransferResponse(null);
        setTransactionID(null);
        setTransferError(null);
        try {
            tryRequest(value);
        } catch (error) {
            console.error(error);
        }
    };

    // Attempts to request the program bytecode with the given program id.
    const tryRequest = (id) => {
        setProgramID(id);
        try {
            if (id) {
                axios
                    .get( `${peerUrl()}/testnet3/program/${id}`)
                    .then((response) => {
                        setStatus("success");
                        setProgram(response.data);
                    })
                    .catch((error) => {
                        // Reset the program text to `null` if the program id does not exist.
                        setProgram(null);
                        setStatus("error");
                        console.error(error);
                    });
            } else {
                // Reset the program text if the user clears the search bar.
                setProgram(null);
                // If the search bar is empty reset the status to "".
                setStatus("");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };
    const functionIDString = () => functionID !== null ? functionID : "";
    const inputsString = () => inputs !== null ? inputs : "";
    const privateKeyString = () => privateKey !== null ? privateKey : "";
    const programString = () => program !== null ? program : "";
    const programIDString = () => programID !== null ? programID : "";
    const feeRecordString = () => transferFeeRecord !== null ? transferFeeRecord : "";
    const transactionIDString = () => programID !== null ? transactionID : "";
    const executionErrorString = () => transferError.stack !== null ? transferError.stack : "";
    const outputString = () => transferResponse !== null ? transferResponse.toString() : "";
    const getExecutionFee = () => transferFee !== null ? parseFloat(transferFee) : 0;
    const peerUrl = () => executeUrl !== null ? executeUrl : "";


    return <Card title="Transfer"
                 style={{width: "100%", borderRadius: "20px"}}
                 bordered={false}
                 extra={<Button type="primary" shape="round" size="middle"
                                onClick={demo}>Demo</Button>}>
        <Form {...layout}>
            <Form.Item label="Amount"
                       colon={false}
                       validateStatus={status}
            >
                <Input.TextArea name="function_id"
                                size="large"
                                placeholder="Function ID"
                                allowClear
                                onChange={onFunctionChange}
                                value={functionIDString()}
                                style={{borderRadius: '20px'}}/>
            </Form.Item>
            <Form.Item label="Recipient"
                       colon={false}
                       validateStatus={status}
            >
                <Input.TextArea name="inputs"
                                size="middle"
                                placeholder="Inputs"
                                allowClear
                                onChange={onInputsChange}
                                value={inputsString()}
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

            {
                (transferOnline === true) &&
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
            }
            {
                (transferOnline === true) &&
                <Form.Item label="Fee"
                           colon={false}
                           validateStatus={status}
                >
                    <Input.TextArea name="Fee"
                                    size="small"
                                    placeholder="Fee"
                                    allowClear
                                    onChange={onExecutionFeeChange}
                                    value={getExecutionFee()}
                                    style={{borderRadius: '20px'}}/>
                </Form.Item>
            }
            {
                (transferOnline === true) &&
                <Form.Item label="Fee Record"
                           colon={false}
                           validateStatus={status}
                >
                    <Input.TextArea name="Fee Record"
                                    size="small"
                                    placeholder="Record used to pay execution fee"
                                    allowClear
                                    onChange={onExecutionFeeRecordChange}
                                    value={feeRecordString()}
                                    style={{borderRadius: '20px'}}/>
                </Form.Item>
            }
            <Row justify="center">
                <Col justify="center">
                    <Button type="primary" shape="round" size="middle" onClick={execute}
                    >Execute</Button>
                </Col>
            </Row>
        </Form>
        <Row justify="center" gutter={[16, 32]} style={{ marginTop: '48px' }}>
            {
                (loading === true) &&
                <Spin tip="Executing Program..." size="large"/>
            }
            {
                (transactionID !== null) &&
                <Result
                    status="success"
                    title="On Chain Execution Successful!"
                    subTitle={"Transaction ID: " + transactionIDString()}
                />
            }
            {
                (transferResponse !== null) &&
                <Result
                    status="success"
                    title="Local Execution Successful!"
                    subTitle={"Outputs: " + outputString()}
                />
            }
            {
                (transferError !== null) &&
                <Result
                    status="error"
                    title="Function Execution Error"
                    subTitle={"Error: " + executionErrorString()}
                />
            }
        </Row>
    </Card>
}