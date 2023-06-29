import React, { useState, useEffect } from "react";
import {Button, Card, Col, Divider, Form, Input, Row, Result, Spin, Switch} from "antd";
import {FormGenerator} from "../../components/InputForm";
import axios from "axios";
import init, * as aleo from '@aleohq/wasm';

await init();

export const Execute = () => {
    const [executionFeeRecord, setExecutionFeeRecord] = useState(null);
    const [executeUrl, setExecuteUrl] = useState("https://vm.aleo.org/api");
    const [functionID, setFunctionID] = useState(null);
    const [executionFee, setExecutionFee] = useState("1");
    const [inputs, setInputs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [privateKey, setPrivateKey] = useState(null);
    const [program, setProgram] = useState(null);
    const [programResponse, setProgramResponse] = useState(null);
    const [executionError, setExecutionError] = useState(null);
    const [programID, setProgramID] = useState(null);
    const [status, setStatus] = useState("");
    const [transactionID, setTransactionID] = useState(null);
    const [worker, setWorker] = useState(null);
    const [executeOnline, setExecuteOnline] = useState(false);
    const [programInputs, setProgramInputs] = useState(null);

    const getProgramInputs = (event) => {
        const programManifest = [];
        if (program) {
            try {
                const aleoProgram = aleo.Program.fromString(program);
                const functions = aleoProgram.getFunctions();
                for (let i = 0; i < functions.length; i++) {
                    const functionManifest = {"functionID": functions[i]}
                    try {
                        const functionInputs = aleoProgram.getFunctionInputs(functions[i]);
                        functionManifest["inputs"] = functionInputs;
                        programManifest.push(functionManifest);
                    } catch (e) {
                        console.error(e);
                    }
                }
                setProgramInputs(programManifest);
                return programManifest;
            } catch (e) {
                console.error(e);
            }
        }
    }

    function spawnWorker() {
        let worker = new Worker("./worker.js");
        worker.addEventListener("message", ev => {
            if (ev.data.type == 'OFFLINE_EXECUTION_COMPLETED') {
                setLoading(false);
                setTransactionID(null);
                setExecutionError(null);
                setProgramResponse(ev.data.outputs);
            } else if (ev.data.type == 'EXECUTION_TRANSACTION_COMPLETED') {
                let [transaction, url] = ev.data.executeTransaction;
                axios.post(url + "/testnet3/transaction/broadcast", transaction, {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }).then(
                    (response) => {
                        setLoading(false);
                        setProgramResponse(null);
                        setExecutionError(null);
                        setTransactionID(response.data);
                    }
                )
            } else if (ev.data.type == 'ERROR') {
                setLoading(false);
                setProgramResponse(null);
                setTransactionID(null);
                setExecutionError(ev.data.errorMessage);
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

    function postMessagePromise(worker, message) {
        return new Promise((resolve, reject) => {
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
            worker.postMessage(message);
        });
    }

    const execute = async (event) => {
        setLoading(true)
        setProgramResponse(null);
        setTransactionID(null);
        setExecutionError(null);

        const feeAmount = parseFloat(feeString());
        if (isNaN(feeAmount)) {
            setExecutionError("Fee is not a valid number");
            setLoading(false);
            return;
        } else if (feeAmount <= 0) {
            setExecutionError("Fee must be greater than 0");
            setLoading(false);
            return;
        }

        let functionInputs = []
        try {
            if (!!inputs) {
                functionInputs = inputs.split(" ");
            }
        } catch (e) {
            setExecutionError("Inputs are not valid");
            setLoading(false);
            return;
        }

        if (executeOnline) {
            await postMessagePromise(worker, {
                type: 'ALEO_EXECUTE_PROGRAM_ON_CHAIN',
                remoteProgram: programString(),
                aleoFunction: functionIDString(),
                inputs: functionInputs,
                privateKey: privateKeyString(),
                fee: feeAmount,
                feeRecord: feeRecordString(),
                url: peerUrl()
            });
        } else {
            await postMessagePromise(worker, {
                type: 'ALEO_EXECUTE_PROGRAM_LOCAL',
                localProgram: programString(),
                aleoFunction: functionIDString(),
                inputs: functionInputs,
                privateKey: privateKeyString(),
            });
        }
    }

    const demo = async (event) => {
        setLoading(false)
        setProgramResponse(null);
        setTransactionID(null);
        setExecutionError(null);
        setProgramID("hello_hello.aleo");
        setProgram("program hello_hello.aleo;\n" +
            "\n" +
            "function hello:\n" +
            "    input r0 as u32.public;\n" +
            "    input r1 as u32.private;\n" +
            "    add r0 r1 into r2;\n" +
            "    output r2 as u32.private;\n");
        setInputs("5u32 5u32");
        setFunctionID("hello");
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

    const onProgramChange = (event) => {
        if (event.target.value !== null) {
            setProgram(event.target.value);
        }
        setTransactionID(null);
        setProgramResponse(null);
        setExecutionError(null);
        return program;
    }

    const onExecutionFeeChange = (event) => {
        if (event.target.value !== null) {
            setExecutionFee(event.target.value);
        }
        setTransactionID(null);
        setProgramResponse(null);
        setExecutionError(null);
        return executionFee;
    }

    const onExecutionFeeRecordChange = (event) => {
        if (event.target.value !== null) {
            setExecutionFeeRecord(event.target.value);
        }
        setTransactionID(null);
        setProgramResponse(null);
        setExecutionError(null);
        return executionFeeRecord;
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
    const transactionIDString = () => transactionID !== null ? transactionID : "";
    const executionErrorString = () => executionError !== null ? executionError : "";
    const outputString = () => programResponse !== null ? programResponse.toString() : "";
    const feeString = () => executionFee !== null ? executionFee : "";
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
            <Form.Item label="Program" colon={false}>
                <Input.TextArea size="large" rows={10} placeholder="Program" style={{whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}
                                value={programString()} onChange={onProgramChange}/>
            </Form.Item>
            <Divider/>
            <Form.Item label="Execute On-Chain"
                       colon={false}
                       validateStatus={status}
            >
                <Switch label="Execute Online" onChange={() => {
                    executeOnline ? setExecuteOnline(false) : setExecuteOnline(true);
                    setProgramResponse(null);
                    setTransactionID(null);
                    setExecutionError(null);
                }} />
            </Form.Item>
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
            {
                Array.isArray(programInputs) &&
                <Form.Item label="Input List">
                    <FormGenerator formData={programInputs} />
                </Form.Item>
            }
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
                (executeOnline === true) &&
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
                (executeOnline === true) &&
                <Form.Item label="Fee"
                           colon={false}
                           validateStatus={status}
                >
                    <Input.TextArea name="Fee"
                                    size="small"
                                    placeholder="Fee"
                                    allowClear
                                    onChange={onExecutionFeeChange}
                                    value={feeString()}
                                    style={{borderRadius: '20px'}}/>
                </Form.Item>
            }
            {
                (executeOnline === true) &&
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
                (programResponse !== null) &&
                <Result
                    status="success"
                    title="Execution Successful!"
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