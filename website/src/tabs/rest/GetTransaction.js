import React, {useState} from "react";
import {Card, Divider, Form, Input, Row, Col} from "antd";
import axios from "axios";
import {CopyButton} from "../../components/CopyButton";

export const GetTransaction = () => {
    const [transaction, setTransaction] = useState(null);
    const [status, setStatus] = useState("");

    // Calls `tryRequest` when the search bar input is entered.
    const onSearch = (value) => {
        try {
            tryRequest(value);
        } catch (error) {
            console.error(error);
        }
    };

    const tryRequest = (id) => {
        setTransaction(null);
        try {
            if (id) {
                axios
                    .get(`https://vm.aleo.org/api/testnet3/transaction/${id}`)
                    .then((response) => {
                        setTransaction(JSON.stringify(response.data, null, 2));
                        setStatus("success");
                    })
                    .catch(error => {
                        console.error(error);
                        setStatus("error");
                    });
            } else {
                // If the search bar is empty reset the status to "".
                setStatus("")
            }
        } catch (error) {
            console.error(error);
        }
    };

    const layout = {labelCol: {span: 3}, wrapperCol: {span: 21}};

    const transactionString = () =>
        transaction !== null ? transaction.toString() : "";

    return <Card title="Get Transaction" style={{width: "100%", borderRadius: "20px"}} bordered={false}>
        <Form {...layout}>
            <Form.Item label="Transaction ID"
                       colon={false}
                       validateStatus={status}>
                <Input.Search name="id"
                              size="large"
                              placeholder="Transaction ID"
                              allowClear
                              onSearch={onSearch}
                              style={{borderRadius: '20px'}}/>
            </Form.Item>
        </Form>
        {
            (transaction !== null) ?
                <Form {...layout}>
                    <Divider/>
                    <Row align="middle">
                        <Col span={23}>
                            <Form.Item label="Transaction" colon={false}>
                                <Input.TextArea size="large" rows={15} placeholder="Block" value={transactionString()}
                                                disabled/>
                            </Form.Item>
                        </Col>
                        <Col span={1} align="middle">
                            <CopyButton data={transactionString()}/>
                        </Col>
                    </Row>
                </Form>
                : null
        }
    </Card>
}