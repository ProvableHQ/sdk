import React, { useState } from "react";
import {Button, Card, Divider, Form, Input, Row, Result} from "antd";
import axios from "axios";
import { DevelopmentClient } from "@aleohq/sdk";

export const Execute = () => {
    const client = new DevelopmentClient("http://localhost:4321");
    const [functionID, setFunctionID] = useState(null);
    const [inputs, setInputs] = useState(null);
    const [privateKey, setPrivateKey] = useState(null);
    const [program, setProgram] = useState(null);
    const [programID, setProgramID] = useState(null);
    const [status, setStatus] = useState("");
    const [transactionID, setTransactionID] = useState(null);

    const execute = async (event) => {
        try {
            let inputs = inputsString().split(" ");
            let transaction = await client.executeProgram(programIDString(), functionIDString(), 0, inputs, privateKeyString());
            setTransactionID(transaction);
        } catch (error) {
            setTransactionID("Error");
            console.error(error);
        }
    }

    const demo = async (event) => {
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

    const onFunctionChange = (event) => {
        if (event.target.value !== null) {
            setFunctionID(event.target.value);
        }
        setTransactionID(null);
        return functionID;
    }

    const onInputsChange = (event) => {
        if (event.target.value !== null) {
            setInputs(event.target.value);
        }
        setTransactionID(null);
        return functionID;
    }

    const onPrivateKeyChange = (event) => {
        if (event.target.value !== null) {
            setPrivateKey(event.target.value);
        }
        setTransactionID(null);
        return privateKey;
    }

    // Calls `tryRequest` when the search bar input is entered.
    const onSearch = (value) => {
        setTransactionID(null);
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
                    .get(`https://vm.aleo.org/api/testnet3/program/${id}`)
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
    const transactionIDString = () => programID !== null ? transactionID : "";


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
                <Row justify="center">
                    <Button type="primary" shape="round" size="middle" onClick={execute}
                    >Execute</Button>
                </Row>
        </Form>
        {
            (transactionID !== null) ?
                (transactionID !== "Error") ?
                <Result
                    status="success"
                    title="Execution Successful!"
                    subTitle={"Transaction ID: " + transactionIDString()}
                /> :
                    <Result
                        status="error"
                        title="Execution Failed"
                    /> : null

        }
    </Card>
}