import React, {useState} from "react";
import {Card, Divider, Form, Input} from "antd";
import axios from "axios";
import {CopyButton} from "../../components/CopyButton";

export const GetBlockByHash = () => {
    const [hash, setHash] = useState(null);
    const [blockByBash, setBlockByBash] = useState(null);

    const onChange = (event) => {
        setHash(null);
        try {
            setHash(event.target.value);
            tryRequest(event.target.value);
        } catch (error) {
            console.error(error);
        }
    }

    const tryRequest = (hash) => {
        setBlockByBash(null);
        try {
            if (hash) {
                axios.get(`https://vm.aleo.org/api/testnet3/block/${hash}`)
                    .then(response => setBlockByBash(JSON.stringify(response.data, null, 2)));
            }
        } catch (error) {
            console.error(error);
        }
    }

    const layout = {labelCol: {span: 3}, wrapperCol: {span: 21}};

    const blockString = () => blockByBash !== null ? blockByBash.toString() : "";

    return <Card title="Get Block By Hash" style={{width: "100%", borderRadius: "20px"}} bordered={false}>
        <Form {...layout}>
            <Form.Item label="Block Hash" colon={false}>
                <Input name="hash" size="large" placeholder="Block Hash" allowClear onChange={onChange}
                       style={{borderRadius: '20px'}}/>
            </Form.Item>
        </Form>
        {
            (blockByBash !== null) ?
                <Form {...layout}>
                    <Divider/>
                    <Form.Item label="Block" colon={false}>
                        <Input.TextArea size="large" rows={15} placeholder="Block" value={blockString()}
                                        addonAfter={<CopyButton data={blockString()} style={{borderRadius: '20px'}}/>} disabled/>
                    </Form.Item>
                </Form>
                : null
        }
    </Card>
}