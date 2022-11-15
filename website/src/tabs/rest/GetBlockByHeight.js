import React, {useState} from "react";
import {Card, Divider, Form, Input} from "antd";
import axios from "axios";
import {CopyButton} from "../../components/CopyButton";

export const GetBlockByHeight = () => {
    const [height, setHeight] = useState(null);
    const [block, setBlock] = useState(null);

    const onChange = (event) => {
        setHeight(null);
        try {
            setHeight(event.target.value);
            tryRequest(event.target.value);
        } catch (error) {
            console.error(error);
        }
    }

    const tryRequest = (height) => {
        setBlock(null);
        try {
            if (height) {
                axios.get(`https://vm.aleo.org/api/testnet3/block/${height}`)
                    .then(response => setBlock(JSON.stringify(response.data, null, 2)));
            }
        } catch (error) {
            console.error(error);
        }
    }

    const layout = {labelCol: {span: 3}, wrapperCol: {span: 21}};

    const blockString = () => block !== null ? block.toString() : "";

    return <Card title="Get Block By Height" style={{width: "100%", borderRadius: "20px"}} bordered={false}>
        <Form {...layout}>
            <Form.Item label="Block Height" colon={false}>
                <Input name="height" size="large" placeholder="Block Height" allowClear onChange={onChange}
                       style={{borderRadius: '20px'}}/>
            </Form.Item>
        </Form>
        {
            (block !== null) ?
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