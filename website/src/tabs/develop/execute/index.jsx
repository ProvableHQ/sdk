import {
    Button,
    Card,
    Checkbox,
    Divider,
    Form,
    Input,
    Select,
    Space,
} from "antd";
import { LoadProgram } from "./LoadProgram.jsx";
import { CodeEditor } from "./CodeEditor.jsx";
import { useAleoWASM } from "../../../aleo-wasm-hook";
import { useState } from "react";

export const Execute = () => {
    const layout = { labelCol: { span: 4 }, wrapperCol: { span: 18 } };
    const [form] = Form.useForm();

    const aleo = useAleoWASM();

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
    const [functions, setFunctions] = useState(null);
    const onLoadProgram = (value) => {
        form.setFieldsValue({
            program: value,
        });
        onProgramChange(value);
    };

    const onProgramChange = async (value) => {
        const processedProgram = await aleo.Program.fromString(value);
        setProgram(processedProgram);
        const functionNames = processedProgram.getFunctions();
        const functionItems = functionNames.map((func, index) => {
            const functionInputs = processedProgram.getFunctionInputs(func);
            return {
                key: index,
                label: func,
                children: functionForm(func, functionInputs),
            };
        });
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
                    <CodeEditor onChange={onProgramChange} />
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
                    <Input.Password />
                </Form.Item>
                <Divider dashed />
                <Form.Item
                    label="Execute On-Chain"
                    name="execute_onchain"
                    valuePropName="checked"
                >
                    <Checkbox />
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
            <Divider />
            <>
                {program !== null
                    ? program.getFunctions().map((func, index) => {
                          const inputs = program.getFunctionInputs(func);
                          return (
                              <>
                                  <Form
                                      name={func}
                                      onFinish={onFinish}
                                      onFinishFailed={onFinishFailed}
                                      autoComplete="off"
                                      layout="vertical"
                                      labelCol={{
                                          xs: {
                                              offset: 0,
                                          },
                                          sm: {
                                              offset: 4,
                                          },
                                      }}
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
                                      <Divider orientation="left" dashed>
                                          {func}
                                      </Divider>
                                      {inputs.map(renderInput)}
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
                                          <Button
                                              type="primary"
                                              htmlType="submit"
                                          >
                                              Submit
                                          </Button>
                                      </Form.Item>
                                  </Form>
                              </>
                          );
                      })
                    : null}
            </>
        </Card>
    );
};

const renderInput = (input, inputIndex) => {
    console.log(input);
    if (input.type === "record") {
        return input.members.map((member, memberIndex) => (
            <Form.Item
                key={`${inputIndex}-${memberIndex}`}
                label={`r${inputIndex} as record (${member.name}.${member.visibility})`}
                name={`r${inputIndex}`}
                rules={[
                    { required: true, message: "Please input your value!" },
                ]}
            >
                <Input placeholder={`Enter a ${member.type}`} />
            </Form.Item>
        ));
    } else {
        return (
            <Form.Item
                key={inputIndex}
                label={`r${inputIndex} as ${input.type}.${input.visibility}`}
                name={`r${inputIndex}`}
                rules={[
                    { required: true, message: "Please input your value!" },
                ]}
            >
                <Input placeholder={`Enter a ${input.type}`} />
            </Form.Item>
        );
    }
};

const functionForm = (func, funcInputs) => (
    <Form
        name={func}
        onFinish={console.log("on finish")}
        onFinishFailed={console.log("on failed")}
        autoComplete="off"
        layout="vertical"
        labelCol={{
            xs: {
                offset: 0,
            },
            sm: {
                offset: 4,
            },
        }}
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
        <Divider orientation="left" dashed>
            {func}
        </Divider>
        {funcInputs.map(renderInput)}
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
                Submit
            </Button>
        </Form.Item>
    </Form>
);
