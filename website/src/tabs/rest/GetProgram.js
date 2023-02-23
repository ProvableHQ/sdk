import React, { useState } from "react";
import {Button, Card, Col, Divider, Form, Input, Row} from "antd";
import axios from "axios";
import { CopyButton } from "../../components/CopyButton";

export const GetProgram = () => {
    const [program, setProgram] = useState(null);
    const [programName, setProgramName] = useState(null);

    const onChange = (event) => {
        try {
            tryRequest(event.target.value);
        } catch (error) {
            console.error(error);
        }
    };

    const tryRequest = (id) => {
        setProgramName(id);
        try {
            if (id) {
                axios
                    .get(`https://vm.aleo.org/api/testnet3/program/${id}`)
                    .then((response) =>
                        setProgram(response.data)
                    );
            }
        } catch (error) {
            console.error(error);
        }
    };


    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };
    const programString = () => program !== null ? program : "";
    const programNameString = () => programName !== null ? programName : "";

    return <Card title="Get Program"
                 style={{width: "100%", borderRadius: "20px"}}
                 bordered={false}
                 extra={<Button type="primary" shape="round" size="middle" onClick={() => {tryRequest("credits.aleo")}}
    >Demo</Button>}>
        <Form {...layout}>
            <Form.Item label="Program Name" colon={false}>
                <Input name="id" size="large" placeholder="Program Name" allowClear onChange={onChange}
                       value={programNameString()} style={{borderRadius: '20px'}}/>
            </Form.Item>
        </Form>
        {
            (program !== null) ?
                <Form {...layout}>
                    <Divider/>
                    <Form.Item label="Program" colon={false}>
                        <Input.TextArea size="large" rows={15} placeholder="Program" style={{whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}
                                        value={programString()}
                                        disabled/>
                    </Form.Item>
                    <Row justify="center">
                        <CopyButton data={programString()}/>
                        <Divider/>
                    </Row>
                </Form>
                :
                <Row justify="center">
                    <Col></Col>
                </Row>
        }
    </Card>
}