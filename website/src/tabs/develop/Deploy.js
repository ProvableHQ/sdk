import React, { useState } from "react";
import {Button, Card, Col, Divider, Form, Input, Row, Result} from "antd";
import { DevelopmentClient } from "@aleohq/sdk";

export const Deploy = () => {
    const client = new DevelopmentClient("http://0.0.0.0:4040");
    const [deployPrivateKey, setDeployPrivateKey] = useState(null);
    const [deployProgram, setDeployProgram] = useState(null);
    const [deployTransactionId, setDeployTransactionId] = useState(null);
    const [fee, setFee] = useState(null);
    const demo_program = 'program hello.aleo;\n\nfunction main:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n'

    const deploy = async (event) => {
        try {
            console.log("Starting deployment transaction...");
            let transaction = await client.deployProgram(programString(), Number(feeString())*1000000, privateKeyString());
            setDeployTransactionId(transaction);
        } catch (error) {
            setDeployTransactionId("Error");
            console.error(error);
        }
    }

    const demo = async (event) => {
        setDeployProgram(demo_program);
        setFee("1");
    }

    const onPrivateKeyChange = (event) => {
        if (event.target.value !== null) {
            setDeployPrivateKey(event.target.value);
        }
        setDeployTransactionId(null);
        return deployPrivateKey;
    }

    const onFeeChange = (event) => {
        if (event.target.value !== null) {
            setFee(event.target.value);
        }
        setDeployTransactionId(null);
        return fee;
    }

    const onDeployProgramChange = (event) => {
        if (event.target.value !== null) {
            setDeployProgram(event.target.value);
        }
        setDeployTransactionId(null);
        return deployProgram;
    }

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };
    const deploymentTransactionString = () => deployTransactionId !== null ? deployTransactionId : "";
    const feeString = () => fee !== null ? fee : "";
    const privateKeyString = () => deployPrivateKey !== null ? deployPrivateKey : "";
    const programString = () => deployProgram !== null ? deployProgram : "";


    return <Card title="Deploy Program"
                 style={{width: "100%", borderRadius: "20px"}}
                 bordered={false}
                 extra={<Button type="primary" shape="round" size="middle"
                                onClick={demo}>Demo</Button>}>
        <Form {...layout}>
            <Divider/>
                <Form.Item label="Aleo Instruction" colon={false}>
                    <Input.TextArea size="large" rows={10} placeholder="Program" style={{whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}
                                    value={programString()} onChange={onDeployProgramChange} />
                </Form.Item>
            <Divider/>
                <Form.Item label="Fee"
                           colon={false}
                >
                    <Input.TextArea name="inputs"
                                    size="middle"
                                    placeholder="Inputs"
                                    allowClear
                                    onChange={onFeeChange}
                                    value={feeString()}
                                    style={{borderRadius: '20px'}}/>
                </Form.Item>
                <Form.Item label="Private Key"
                           colon={false}
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
                    <Button type="primary" shape="round" size="middle" onClick={deploy}
                    >Deploy</Button>
                </Row>
        </Form>
        {
            (deployTransactionId !== null) ?
                (deployTransactionId !== "Error") ?
                <Result
                    status="success"
                    title="Deployment Successful!"
                    subTitle={"Transaction ID: " + deploymentTransactionString()}
                /> :
                    <Result
                        status="error"
                        title="Deployment Failed"
                    /> : null

        }
    </Card>
}