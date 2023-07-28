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
import { useEffect, useState } from "react";
import axios from "axios";

const layout = { labelCol: { span: 4 }, wrapperCol: { span: 18 } };

export const Execute = () => {
    const [form] = Form.useForm();
    const aleoWASM = useAleoWASM();

    const demoSelect = (value) => {
        console.log(`selected ${value}`);
    };

    const [worker, setWorker] = useState(null);

    useEffect(() => {
        if (worker === null) {
            const spawnedWorker = spawnWorker();
            setWorker(spawnedWorker);
            return () => {
                spawnedWorker.terminate();
            };
        }
    }, []);

    const execute = async (values) => {
        const { program, functionName, inputs, private_key } = values;
        await postMessagePromise(worker, {
            type: "ALEO_EXECUTE_PROGRAM_LOCAL",
            localProgram: program,
            aleoFunction: functionName,
            inputs: JSON.parse(inputs),
            privateKey: private_key,
        });
    };

    function postMessagePromise(worker, message) {
        return new Promise((resolve, reject) => {
            worker.onmessage = (event) => {
                resolve(event.data);
            };
            worker.onerror = (error) => {
                reject(error);
            };
            worker.postMessage(message);
        });
    }

    function spawnWorker() {
        let worker = new Worker(
            new URL("../../../workers/worker.js", import.meta.url),
            { type: "module" },
        );
        worker.addEventListener("message", (ev) => {
            if (ev.data.type == "OFFLINE_EXECUTION_COMPLETED") {
                // setFeeLoading(false);
                // setLoading(false);
                // setTransactionID(null);
                // setExecutionError(null);
                // setProgramResponse(ev.data.outputs);
                // setTip("Executing Program...");
                console.log("Offline execution complete " + ev.data.outputs);
            } else if (ev.data.type == "EXECUTION_TRANSACTION_COMPLETED") {
                let [transaction, url] = ev.data.executeTransaction;
                axios
                    .post(
                        url + "/testnet3/transaction/broadcast",
                        transaction,
                        {
                            headers: {
                                "Content-Type": "application/json",
                            },
                        },
                    )
                    .then((response) => {
                        // setFeeLoading(false);
                        // setLoading(false);
                        // setProgramResponse(null);
                        // setExecutionError(null);
                        // setTip("Executing Program...");
                        // setTransactionID(response.data);
                    });
            } else if (ev.data.type == "EXECUTION_FEE_ESTIMATION_COMPLETED") {
                // let fee = ev.data.executionFee;
                // setFeeLoading(false);
                // setLoading(false);
                // setProgramResponse(null);
                // setExecutionError(null);
                // setTransactionID(null);
                // setTip("Executing Program...");
                // setExecutionFee(fee.toString());
            } else if (ev.data.type == "ERROR") {
                // setFeeLoading(false);
                // setLoading(false);
                // setProgramResponse(null);
                // setTransactionID(null);
                // setTip("Executing Program...");
                // setExecutionError(ev.data.errorMessage);
            }
        });
        return worker;
    }

    const [program, setProgram] = useState(null);
    const [functions, setFunctions] = useState([]);
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
            <Form.Provider
                onFormFinish={(name, info) => {
                    if (name !== "execute") {
                        form.setFieldValue("functionName", name);
                        form.setFieldValue(
                            "inputs",
                            JSON.stringify(info.values.inputs),
                        );
                        form.submit();
                    }
                }}
            >
                <Form
                    form={form}
                    name="execute"
                    {...layout}
                    onFinish={execute}
                    autoComplete="off"
                    scrollToFirstError="true"
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
                                message:
                                    "Private key required to execute program",
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
                        initialValue={false}
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
                        {({ getFieldValue }) => (
                            <>
                                <Form.Item
                                    label="Peer URL"
                                    name="peer_url"
                                    hidden={!getFieldValue("execute_onchain")}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item
                                    label="Fee"
                                    name="fee"
                                    hidden={!getFieldValue("execute_onchain")}
                                >
                                    <Input.Search enterButton="Estimate Fee" />
                                </Form.Item>
                                <Form.Item
                                    label="Fee Record"
                                    name="fee_record"
                                    hidden={!getFieldValue("execute_onchain")}
                                >
                                    <Input.TextArea />
                                </Form.Item>
                            </>
                        )}
                    </Form.Item>
                    <Divider dashed />
                    <Form.Item
                        label="Manual Input"
                        name="manual_input"
                        valuePropName="checked"
                        initialValue={false}
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                            prevValues.manual_input !==
                            currentValues.manual_input
                        }
                    >
                        {({ getFieldValue }) => (
                            <>
                                <Form.Item
                                    label="Function"
                                    name="functionName"
                                    hidden={!getFieldValue("manual_input")}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item
                                    label="Inputs"
                                    name="inputs"
                                    hidden={!getFieldValue("manual_input")}
                                >
                                    <Input.TextArea />
                                </Form.Item>
                            </>
                        )}
                    </Form.Item>
                </Form>
                <Divider dashed>Program Functions</Divider>
                {functions.length > 0 ? (
                    <Collapse bordered={false} items={functions} />
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
            </Form.Provider>
        </Card>
    );
};

const renderInput = (input, inputIndex, nameArray = []) => {
    if (input.members) {
        const members = input.members;
        return (
            <div key={inputIndex}>
                <Divider orientation="left" dashed plain>
                    {input.struct_id} {input.name || input.register}:
                </Divider>
                {members.map((member, memberIndex) =>
                    renderInput(
                        member,
                        memberIndex,
                        [].concat(nameArray).concat(input.name || inputIndex),
                    ),
                )}
            </div>
        );
    } else {
        return (
            <Form.Item
                key={inputIndex}
                label={input.name ? input.name : input.register}
                name={[].concat(nameArray).concat(input.name || inputIndex)}
                rules={[{ required: true, message: "Please input a value" }]}
            >
                <Input placeholder={`${input.type}`} />
            </Form.Item>
        );
    }
};

const functionForm = (func, funcInputs) => {
    return (
        <Form
            name={func}
            autoComplete="off"
            scrollToFirstError="true"
            {...layout}
        >
            {funcInputs.length > 0 ? (
                funcInputs.map((input, inputIndex) =>
                    renderInput(input, inputIndex, ["inputs"]),
                )
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
};
