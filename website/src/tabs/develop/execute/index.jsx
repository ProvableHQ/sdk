import {
    Alert,
    Button,
    Card,
    Collapse,
    Divider,
    Empty,
    Form,
    Input,
    Select,
    Switch,
} from "antd";
import { LoadProgram } from "./LoadProgram.jsx";
import { CodeEditor } from "./CodeEditor.jsx";
import { useAleoWASM } from "../../../aleo-wasm-hook";
import { useState } from "react";

const layout = { labelCol: { span: 4 }, wrapperCol: { span: 18 } };

export const Execute = () => {
    const [form] = Form.useForm();

    const aleoWASM = useAleoWASM();

    const onFinish = (values) => {
        console.log("Success:", values);
    };
    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };

    const demoSelect = (value) => {
        console.log(`selected ${value}`);
    };

    const [program, setProgram] = useState(null);
    const [functions, setFunctions] = useState([
        {
            type: "u8",
            register: "r0",
            visibility: "private",
        },
        {
            type: "u8",
            register: "r1",
            visibility: "private",
        },
        {
            type: "u8",
            register: "r2",
            visibility: "private",
        },
        {
            type: "struct",
            name: "Board",
            register: "r3",
            members: [
                {
                    type: "struct",
                    name: "Row",
                    register: "r1",
                    members: [
                        {
                            register: "c1",
                            type: "u8",
                        },
                        {
                            register: "c2",
                            type: "u8",
                        },
                        {
                            register: "c3",
                            type: "u8",
                        },
                    ],
                },
                {
                    type: "struct",
                    name: "Row",
                    register: "r2",
                    members: [
                        {
                            register: "c1",
                            type: "u8",
                        },
                        {
                            register: "c2",
                            type: "u8",
                        },
                        {
                            register: "c3",
                            type: "u8",
                        },
                    ],
                },
                {
                    type: "struct",
                    name: "Row",
                    register: "r3",
                    members: [
                        {
                            register: "c1",
                            type: "u8",
                        },
                        {
                            register: "c2",
                            type: "u8",
                        },
                        {
                            register: "c3",
                            type: "u8",
                        },
                    ],
                },
            ],
            visibility: "private",
        },
    ]);
    const onLoadProgram = async (value) => {
        if (value) {
            form.setFieldsValue({
                program: value,
            });
            await onProgramChange(value);
        }
    };
    const onProgramEdit = async (value) => {
        await onProgramChange(value);
    };

    const onProgramChange = async (value) => {
        let processedProgram;
        try {
            processedProgram = await aleoWASM.Program.fromString(value);
            setProgram(processedProgram);
        } catch (e) {
            console.log(e);
            setProgram(null);
            setFunctions([]);
            return;
        }
        const functionNames = processedProgram.getFunctions();
        const functionItems = functionNames.map((func, index) => {
            const functionInputs = processedProgram.getFunctionInputs(func);

            // const functionInputs = [
            //     {
            //         type: "u8",
            //         register: "r0",
            //         visibility: "private",
            //     },
            //     {
            //         type: "u8",
            //         register: "r1",
            //         visibility: "private",
            //     },
            //     {
            //         type: "u8",
            //         register: "r2",
            //         visibility: "private",
            //     },
            //     {
            //         type: "struct",
            //         name: "Board",
            //         register: "r3",
            //         members: [
            //             {
            //                 type: "struct",
            //                 name: "Row",
            //                 register: "r1",
            //                 members: [
            //                     {
            //                         register: "c1",
            //                         type: "u8",
            //                     },
            //                     {
            //                         register: "c2",
            //                         type: "u8",
            //                     },
            //                     {
            //                         register: "c3",
            //                         type: "u8",
            //                     },
            //                 ],
            //             },
            //             {
            //                 type: "struct",
            //                 name: "Row",
            //                 register: "r2",
            //                 members: [
            //                     {
            //                         register: "c1",
            //                         type: "u8",
            //                     },
            //                     {
            //                         register: "c2",
            //                         type: "u8",
            //                     },
            //                     {
            //                         register: "c3",
            //                         type: "u8",
            //                     },
            //                 ],
            //             },
            //             {
            //                 type: "struct",
            //                 name: "Row",
            //                 register: "r3",
            //                 members: [
            //                     {
            //                         register: "c1",
            //                         type: "u8",
            //                     },
            //                     {
            //                         register: "c2",
            //                         type: "u8",
            //                     },
            //                     {
            //                         register: "c3",
            //                         type: "u8",
            //                     },
            //                 ],
            //             },
            //         ],
            //         visibility: "private",
            //     },
            // ];
            console.log(functionInputs);
            return {
                key: index,
                label: func,
                children: functionForm(func, functionInputs),
            };
        });
        setFunctions(functionItems);
    };

    return (
        <Card
            title="Execute Program"
            extra={
                <Select
                    placeholder="Select a demo"
                    onChange={demoSelect}
                    options={[
                        {
                            value: "hello",
                            label: "hello_hello.aleo",
                        },
                        {
                            value: "credits",
                            label: "credits.aleo",
                        },
                    ]}
                />
            }
        >
            <Form
                form={form}
                name="execute"
                {...layout}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <LoadProgram onResponse={onLoadProgram} />
                <Form.Item
                    label="Program"
                    name="program"
                    rules={[
                        {
                            required: true,
                            message: "Please input or load an Aleo program",
                        },
                    ]}
                >
                    <CodeEditor onChange={onProgramEdit} />
                </Form.Item>
                <Divider dashed />
                <Form.Item
                    label="Private Key"
                    name="private_key"
                    rules={[
                        {
                            required: true,
                            message: "Private key required to execute program",
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Divider dashed />
                <Form.Item
                    label="Execute On-Chain"
                    name="execute_onchain"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>
                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                        prevValues.execute_onchain !==
                        currentValues.execute_onchain
                    }
                >
                    {({ getFieldValue }) =>
                        getFieldValue("execute_onchain") === true ? (
                            <>
                                <Form.Item label="Peer URL" name="peer_url">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Fee" name="fee">
                                    <Input.Search enterButton="Estimate Fee" />
                                </Form.Item>
                                <Form.Item label="Fee Record" name="fee_record">
                                    <Input.TextArea />
                                </Form.Item>
                            </>
                        ) : null
                    }
                </Form.Item>
            </Form>
            <Divider dashed>Program Functions</Divider>
            {functions.length > 0 ? (
                <Collapse bordered={false} items={functions} />
            ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
        </Card>
    );
};

const renderInput = (input, inputIndex, nameArray = []) => {
    if (input.members) {
        const members = input.members;
        return (
            <div key={inputIndex}>
                <Divider orientation="left" dashed plain>
                    {input.name}
                </Divider>
                input.nameArray.push(input.register)cccccbgjvjlgecltfrbtnuitfucbchdvjlbbecbvdevb
                {members.map((member, memberIndex) =>
                    renderInput(member, memberIndex, nameArray),
                )}
            </div>
        );
    } else {
        return (
            <Form.Item
                key={inputIndex}
                label={`${input.name ? input.name : `${input.register}`}`}
                name={["inputs", nameArray]}
                rules={[{ required: true, message: "Please input a value" }]}
            >
                <Input placeholder={`${input.type}`} />
            </Form.Item>
        );
    }
};

const functionForm = (func, funcInputs) => (
    <Form
        name={func}
        onFinish={(values) => console.log("Success:", values)}
        onFinishFailed={() => console.log("on failed")}
        autoComplete="off"
        {...layout}
    >
        {funcInputs.length > 0 ? (
            funcInputs.map(renderInput)
        ) : (
            <Form.Item
                wrapperCol={{
                    xs: {
                        offset: 0,
                    },
                    sm: {
                        offset: 4,
                        span: 18,
                    },
                }}
            >
                <Alert
                    message={`The \`${func}\` function does not take any inputs.`}
                    type="info"
                    showIcon
                />
            </Form.Item>
        )}
        <Form.Item
            wrapperCol={{
                xs: {
                    offset: 0,
                },
                sm: {
                    offset: 4,
                },
            }}
        >
            <Button type="primary" htmlType="submit">
                Run
            </Button>
        </Form.Item>
    </Form>
);
