import React, { useState, useEffect } from "react";
import {Button, Card, Col, Divider, Form, Input, Row, Result, Spin} from "antd";
import axios from "axios";
import init, * as aleo from "@aleohq/wasm";

await init();

export const Execute = () => {
    const [executionFeeRecord, setExecutionFeeRecord] = useState(null);
    const [executeUrl, setExecuteUrl] = useState("http://localhost:3030");
    const [functionID, setFunctionID] = useState(null);
    const [executionFee, setExecutionFee] = useState(null);
    const [inputs, setInputs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [privateKey, setPrivateKey] = useState("APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH");
    const [program, setProgram] = useState(null);
    const [programResponse, setProgramResponse] = useState(null);
    const [executionError, setExecutionError] = useState(null);
    const [programID, setProgramID] = useState(null);
    const [status, setStatus] = useState("");
    const [transactionID, setTransactionID] = useState(null);

    const worker = new Worker("./worker.js");

    useEffect(() => {
        worker.addEventListener("message", ev => {
            if (ev.data.type === 'ALEO_EXECUTE_PROGRAM_LOCAL') {
                setLoading(false)
                setTransactionID(null);
                setExecutionError(null);
                setProgramResponse(ev.data.response.getOutputs());
            } else if (ev.data.type === 'EXECUTION_TRANSACTION_COMPLETED') {
                axios.post(peerUrl() + "/testnet3/transaction/broadcast", ev.data.executeTransaction.toString()).then(
                    (response) => {
                        setLoading(false)
                        setProgramResponse(null);
                        setExecutionError(null);
                        setTransactionID(response.data);
                    }
                )
            }
        });
    }, []);

    function postMessagePromise(worker, message) {
        setLoading(true)
        return new Promise((resolve, reject) => {
            worker.postMessage(message);
            worker.onmessage = event => {
                resolve(event.data);
            };
            worker.onerror = error => {
                setExecutionError(error);
                setLoading(false);
                setProgramResponse(null);
                setTransactionID(null);
                reject(error);
            };
        });
    }

    const run = async () => {
        console.log("---------------------Aleo Private Key from Main Thread:---------------------");
        let pkey = aleo.PrivateKey.from_string(privateKeyString());
        console.log(pkey);
        console.log("---------------------End Main Thread---------------------")

        let pm = aleo.ProgramManager.new();
        let response = pm.execute_local(programString(), functionIDString(), inputs.split(" "), pkey);
        return response;
    }
    const execute_local = async (event) => {
        setLoading(true)
        setProgramResponse(null);
        setTransactionID(null);
        setExecutionError(null);

        await postMessagePromise(worker, {
            type: 'ALEO_EXECUTE_PROGRAM_LOCAL',
            localProgram: programString(),
            aleoFunction: functionIDString(),
            inputs: inputs.split(" "),
            privateKey: privateKeyString(),
        });
    }

    const execute = async (event) => {
        setLoading(true)
        setProgramResponse(null);
        setTransactionID(null);
        setExecutionError(null);

        // Build transaction
        await postMessagePromise(worker, {
            type: 'ALEO_EXECUTE_PROGRAM_ON_CHAIN',
            remoteProgram: programString(),
            aleoFunction: functionIDString(),
            inputs: inputs.split(" "),
            privateKey: privateKeyString(),
            executionFee: getExecutionFee(),
            feeRecord: privateKeyString(),
            url: peerUrl()
        });
    }

    const demo = async (event) => {
        setLoading(false)
        setProgramResponse(null);
        setTransactionID(null);
        setExecutionError(null);
        setProgramID("hello.aleo");
        await tryRequest("hello.aleo");
        setInputs("5u32 5u32");
        setFunctionID("main");
    }

    // Returns the program id if the user changes it or the "Demo" button is clicked.
    const onChange = (event) => {
        if (event.target.value !== null) {
            setProgramID(event.target.value);
        }
        setTransactionID(null);
        return programID;
    }

    // Returns the program id if the user changes it or the "Demo" button is clicked.
    const onUrlChange = (event) => {
        if (event.target.value !== null) {
            setExecuteUrl(event.target.value);
        }
        return executeUrl;
    }

    const onFunctionChange = (event) => {
        if (event.target.value !== null) {
            setFunctionID(event.target.value);
        }
        setTransactionID(null);
        setProgramResponse(null);
        setExecutionError(null);
        return functionID;
    }

    const onInputsChange = (event) => {
        if (event.target.value !== null) {
            setInputs(event.target.value);
        }
        setTransactionID(null);
        setProgramResponse(null);
        setExecutionError(null);
        return inputs;
    }

    const onPrivateKeyChange = (event) => {
        if (event.target.value !== null) {
            setPrivateKey(event.target.value);
        }
        setTransactionID(null);
        setProgramResponse(null);
        setExecutionError(null);
        return privateKey;
    }

    // Calls `tryRequest` when the search bar input is entered.
    const onSearch = (value) => {
        setLoading(false);
        setProgramResponse(null);
        setTransactionID(null);
        setExecutionError(null);
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
    const feeRecordString = () => executionFeeRecord !== null ? executionFeeRecord : "";
    const transactionIDString = () => programID !== null ? transactionID : "";
    const executionErrorString = () => executionError.stack !== null ? executionError.stack : "";
    const outputString = () => programResponse !== null ? programResponse.toString() : "";
    const getExecutionFee = () => executionFee !== null ? fee : 0.0;
    const peerUrl = () => executeUrl !== null ? executeUrl : "";


    return <Card title="Execute Program"
                 style={{width: "100%", borderRadius: "20px"}}
                 bordered={false}
                 extra={<Button type="primary" shape="round" size="middle"
                                onClick={demo}>Demo</Button>}>
        <Form {...layout}>
            <Form.Item label="Program ID"
                       colon={false}
                       validateStatus={status}
            >
                <Input.Search name="program_id"
                              size="large"
                              placeholder="Program ID"
                              allowClear
                              onSearch={onSearch}
                              onChange={onChange}
                              value={programIDString()}
                              style={{borderRadius: '20px'}}/>
            </Form.Item>
        </Form>
        <Form {...layout}>
            <Divider/>
            <Form.Item label="Program Bytecode" colon={false}>
                <Input.TextArea size="large" rows={10} placeholder="Program" style={{whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}
                                value={programString()}
                                disabled/>
            </Form.Item>
            <Divider/>
            <Form.Item label="Function"
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
            <Form.Item label="Inputs"
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
                <Col justify="center" span={3}>
                <Button type="primary" shape="round" size="middle" onClick={execute}
                >Execute On Chain</Button>
                </Col>
                <Col justify="center" span={3}>
                    <Button type="primary" shape="round" size="middle" onClick={execute_local}
                    >Execute Locally</Button>
                </Col>
            </Row>
        </Form>
        <Row justify="center" gutter={[16, 32]}>
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
            (programResponse !== null) &&
                    <Result
                        status="success"
                        title="Local Execution Successful!"
                        subTitle={"Outputs: " + outputString()}
                    />
        }
        {
            (executionError !== null) &&
            <Result
                status="error"
                title="Function Execution Error"
                subTitle={"Error: " + executionErrorString()}
            />
        }
        </Row>
    </Card>
}