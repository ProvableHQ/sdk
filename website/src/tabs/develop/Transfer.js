import React, { useState } from "react";
import {Button, Card, Col, Divider, Form, Input, Row, Result} from "antd";
import { DevelopmentClient } from "@aleohq/sdk";

export const Transfer = () => {
    const client = new DevelopmentClient("http://localhost:4040");
    const [transferTransactionId, setTransferTransactionId] = useState(null);
    const [recipient, setRecipient] = useState(null);
    const [transferAmount, setTransferAmount] = useState(null);
    const [transferPrivateKey, setTransferPrivateKey] = useState(null);

    const transfer = async (event) => {
        try {
            let transaction = await client.transfer(Number(transferAmount), 0, recipientString(), privateKeyString());
            setTransferTransactionId(transaction);
        } catch (error) {
            setTransferTransactionId("Error");
            console.error(error);
        }
    }

    const onAmountChange = (event) => {
        if (event.target.value !== null) {
            setTransferAmount(event.target.value);
        }
        setTransferTransactionId(null);
        return transferAmount;
    }

    const onPrivateKeyChange = (event) => {
        if (event.target.value !== null) {
            setTransferPrivateKey(event.target.value);
        }
        setTransferTransactionId(null);
        return transferPrivateKey;
    }

    const onRecipientChange = (event) => {
        if (event.target.value !== null) {
            setRecipient(event.target.value);
        }
        setTransferTransactionId(null);
        return recipient;
    }

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };
    const transferTransactionString = () => transferTransactionId !== null ? transferTransactionId : "";
    const transferAmountString = () => transferAmount !== null ? transferAmount : "";
    const privateKeyString = () => transferPrivateKey !== null ? transferPrivateKey : "";
    const recipientString = () => recipient !== null ? recipient : "";


    return <Card title="Send Credits"
                 style={{width: "100%", borderRadius: "20px"}}
                 bordered={false}>
        <Form {...layout}>
            <Form.Item label="Recipient Address"
                       colon={false}
            >
                <Input.TextArea name="recipient"
                                size="small"
                                placeholder="Recipient Address"
                                allowClear
                                onChange={onRecipientChange}
                                value={recipientString()}
                                style={{borderRadius: '20px'}}/>
            </Form.Item>
            <Form.Item label="Amount"
                       colon={false}
            >
                <Input.TextArea name="amount"
                                size="small"
                                placeholder="Transfer Amount"
                                allowClear
                                onChange={onAmountChange}
                                value={transferAmountString()}
                                style={{borderRadius: '20px'}}/>
            </Form.Item>
            <Form.Item label="Sender Private Key"
                       colon={false}
            >
                <Input.TextArea name="private_key"
                                size="small"
                                placeholder="Sender Private Key"
                                allowClear
                                onChange={onPrivateKeyChange}
                                value={privateKeyString()}
                                style={{borderRadius: '20px'}}/>
            </Form.Item>
            <Row justify="center">
                <Button type="primary" shape="round" size="middle" onClick={transfer}
                >Send Credits</Button>
            </Row>
        </Form>
        {
            (transferTransactionId !== null) ?
                (transferTransactionId !== "Error") ?
                <Result
                    status="success"
                    title="Transfer Successful!"
                    subTitle={"Transaction ID: " + transferTransactionString()}
                /> :
                    <Result
                        status="error"
                        title="Transfer Failed"
                    /> : null

        }
    </Card>
}