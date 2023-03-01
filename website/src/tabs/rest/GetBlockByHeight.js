import React, {useState} from "react";
import {Card, Divider, Form, Input, Row, Col} from "antd";
import axios from "axios";
import {CopyButton} from "../../components/CopyButton";

export const GetBlockByHeight = () => {
    const [blockByHeight, setBlockByHeight] = useState(null);
    const [status, setStatus] = useState("");

    // Calls `tryRequest` when the search bar input is entered
    const onSearch = (value) => {
        try {
            tryRequest(value);
        } catch (error) {
            console.error(error);
        }
    }

    const tryRequest = (height) => {
        setBlockByHeight(null);
        try {
            if (height) {
                axios.get(`https://vm.aleo.org/api/testnet3/block/${height}`)
                    .then(response => {
                        setBlockByHeight(JSON.stringify(response.data, null, 2));
                        setStatus("success");
                    }).catch( error => {
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

    const blockString = () => blockByHeight !== null ? blockByHeight.toString() : "";

    return <Card title="Get Block By Height" style={{width: "100%", borderRadius: "20px"}} bordered={false}>
        <Form {...layout}>
            <Form.Item label="Block Height"
                       colon={false}
                       validateStatus={status}
            >
                <Input.Search name="height"
                       size="large"
                       placeholder="Block Height"
                       allowClear
                       onSearch={onSearch}
                       style={{borderRadius: '20px'}}/>
            </Form.Item>
        </Form>
        {
            (blockByHeight !== null) ?
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