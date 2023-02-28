import React, { useState } from "react";
import {Button, Card, Col, Divider, Form, Input, Row} from "antd";
import axios from "axios";
import { CopyButton } from "../../components/CopyButton";

export const GetProgram = () => {
    const [program, setProgram] = useState(null);
    const [programID, setProgramID] = useState(null);
    const [programExists, setProgramExists] = useState(false);

    // Returns the program id if the user changes it or the "Demo" button is clicked.
    const onChange = (event) => {
        if (event.target.value !== null) {
            setProgramID(event.target.value);
        }
        return programID;
    }

    // Calls `tryRequest` when the search bar is triggered.
    const onSearch = (value) => {
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
                        setProgramExists(true);
                        setProgram(response.data);
                    })
                    .catch((error) => {
                        // Reset the program text to `null` if the program id does not exist.
                        setProgram(null);
                        console.error(error);
                    });

            } else {
                // Reset the program text if the user clears the search bar.
                setProgram(null);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Returns the `validateStatus` string to set the highlighting around the search bar.
    // ""        = grey
    // "success" = green
    // "error"   = red
    const validateStatusProgram = () => {
        return programExists ?
            program !== null ?
                "success"
                : "error"
            : "";
    }

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };
    const programString = () => program !== null ? program : "";
    const programIDString = () => programID !== null ? programID : "";

    return <Card title="Get Program"
                 style={{width: "100%", borderRadius: "20px"}}
                 bordered={false}
                 extra={<Button type="primary" shape="round" size="middle" onClick={() => {tryRequest("credits.aleo")}}
    >Demo</Button>}>
        <Form {...layout}>
            <Form.Item label="Program ID"
                       colon={false}
                       validateStatus={validateStatusProgram()}
            >
                <Input.Search name="id"
                              size="large"
                              placeholder="Program ID"
                              allowClear
                              onSearch={onSearch}
                              onChange={onChange}
                              value={programIDString()}
                              style={{borderRadius: '20px'}}/>
            </Form.Item>
        </Form>
        {
            (program !== null) ?
                <Form {...layout}>
                    <Divider/>
                    <Row align="middle">
                        <Col span={23}>
                            <Form.Item label="Program Bytecode" colon={false}>
                                <Input.TextArea size="large" rows={15} placeholder="Program" style={{whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}
                                                value={programString()}
                                                disabled/>
                            </Form.Item>
                        </Col>
                        <Col span={1} align="middle">
                            <CopyButton data={programString()}/>
                        </Col>
                    </Row>
                </Form>
                : null
        }
    </Card>
}