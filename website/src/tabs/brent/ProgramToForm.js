import React, { useState } from "react";
import {Button, Card, Col, Divider, Form, Input, Row} from "antd";
import axios from "axios";
import { CopyButton } from "../../components/CopyButton";
import {useAleoWASM} from "../../aleo-wasm-hook";

export const ProgramToForm = () => {
    const [program, setProgram] = useState(null);
    const [programID, setProgramID] = useState(null);
    const [status, setStatus] = useState("");
    const aleo = useAleoWASM();

    // Returns the program id if the user changes it or the "Demo" button is clicked.
    const onChange = (event) => {
        if (event.target.value !== null) {
            setProgramID(event.target.value);
        }
        return programID;
    }

    // Calls `tryRequest` when the search bar input is entered.
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
                        setStatus("success");
                        // setProgram(response.data);
                        const program = aleo.Program.fromString(response.data)
                        setProgram(program);
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

    const layout = {labelCol: {span: 6}, wrapperCol: {span: 21}};
    const programString = () => program !== null ? program : "";
    const programIDString = () => programID !== null ? programID : "";

    const renderInput = (input, inputIndex) => {
        console.log(input)
        if (input.type === "record") {
            return input.members.map((member, memberIndex) => (
                <Form.Item
                    key={`${inputIndex}-${memberIndex}`}
                    label={`r${inputIndex} as record (${member.name}.${member.visibility})`}
                    name={`r${inputIndex}`}
                    rules={[{required: true, message: 'Please input your value!'}]}
                >
                    <Input placeholder={`Enter a ${member.type}`}/>
                </Form.Item>
            ));
        } else {
            return (
                <Form.Item
                    key={inputIndex}
                    label={`r${inputIndex} as ${input.type}.${input.visibility}`}
                    name={`r${inputIndex}`}
                    rules={[{required: true, message: 'Please input your value!'}]}
                >
                    <Input placeholder={`Enter a ${input.type}`}/>
                </Form.Item>
            );
        }
    };

    const onFinish = (values) => {
        console.log('Success:', values);
    };

    return <Card title="Program To Form"
                 style={{width: "100%", borderRadius: "20px"}}
                 bordered={false}
                 extra={<Button type="primary" shape="round" size="middle" onClick={() => {tryRequest("credits.aleo")}}
    >Demo</Button>}>
        <Form {...layout}>
            <Form.Item label="Program ID"
                       colon={false}
                       validateStatus={status}
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
                <>
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
                    <>
                        {program.getFunctions().map((func, index) => {
                            const inputs = program.getFunctionInputs(func);
                            console.log(inputs)
                            return (
                                <>
                                <Divider/>
                                    <Form {...layout} key={index} onFinish={onFinish}>
                                        <h3>{func}</h3>
                                        {inputs.map(renderInput)}
                                        <Form.Item wrapperCol={{ offset: 6, span: 21 }}>
                                            <Button type="primary" htmlType="submit">
                                                Submit
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </>
                            );
                        })}
                    </>
                </>
                : null
        }
    </Card>
}