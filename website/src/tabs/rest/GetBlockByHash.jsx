import React, {useState} from "react";
import {Card, Divider, Form, Input, Row, Col} from "antd";
import axios from "axios";
import {CopyButton} from "../../components/CopyButton";

export const GetBlockByHash = () => {
    const [blockByHash, setBlockByHash] = useState(null);
    const [status, setStatus] = useState("");

    // Calls `tryRequest` when the search bar input is entered.
    const onSearch = (value) => {
        try {
            tryRequest(value);
        } catch (error) {
            console.error(error);
        }
    }

    const tryRequest = (hash) => {
        setBlockByHash(null);
        try {
            if (hash) {
                axios.get(`https://vm.aleo.org/api/testnet3/block/${hash}`)
                    .then(response => {
                        setBlockByHash(JSON.stringify(response.data, null, 2));
                        setStatus("success");
                    })
                    .catch( error => {
                        setStatus("error");
                        console.error(error);
                    });
            } else {
                // If the search bar is empty reset the status to "".
                setStatus("");
            }
        } catch (error) {
            console.error(error);
        }
    }

    const layout = {labelCol: {span: 3}, wrapperCol: {span: 21}};

    const blockString = () => blockByHash !== null ? blockByHash.toString() : "";

    return <Card title="Get Block By Hash" style={{width: "100%", borderRadius: "20px"}} bordered={false}>
        <Form {...layout}>
            <Form.Item label="Block Hash"
                       colon={false}
                       validateStatus={status}>
                <Input.Search name="hash"
                       size="large"
                       placeholder="Block Hash"
                       allowClear
                       onSearch={onSearch}
                       style={{borderRadius: '20px'}}/>
            </Form.Item>
        </Form>
        {
            (blockByHash !== null) ?
                <Form {...layout}>
                    <Divider/>
                    <Row align="middle">
                        <Col span={23}>
                            <Form.Item label="Block" colon={false}>
                                <Input.TextArea size="large" rows={15} placeholder="Block" value={blockString()} disabled/>
                            </Form.Item>
                        </Col>
                        <Col span={1} align="middle">
                            <CopyButton data={blockString()}/>
                        </Col>
                    </Row>
                </Form>
                : null
        }
    </Card>
}