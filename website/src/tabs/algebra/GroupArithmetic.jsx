import {useMemo, useState} from "react";
import { Card, Divider, Form, Input, Select, Radio, Button } from "antd";
import { CopyButton } from "../../components/CopyButton";
import { useAleoWASM } from "../../aleo-wasm-hook";

export const GroupArithmetic = () => {
    const [groupValueOne, setGroupValueOne] = useState("");
    const [groupValueTwo, setGroupValueTwo] = useState("");
    const [scalarValue, setScalarValue] = useState("");
    const [operation, setOperation] = useState("add");
    const [result, setResult] = useState("");
    const [wasm] = useAleoWASM();

    const operations = [
        { value: "add", label: "Add (G1+G2)" },
        { value: "sub", label: "Subtract (G1+(-G2))" },
        { value: "scalar mul", label: "Scalar Multiply (a×G)" },
        { value: "double", label: "Double (2×G)" },
        { value: "neg", label: "Negate ((x, y) -> (-x, y))" },
        { value: "equals", label: "Equals (G1 == G2)" },
    ];

    const generateRandomGroup = () => {
        try {
            const randomGroup = wasm.Group.random();
            return randomGroup.toString();
        } catch (error) {
            console.error("Error generating random group:", error);
            return "";
        }
    };

    const generateGenerator = () => {
        try {
            const generator = wasm.Group.generator();
            return generator.toString();
        } catch (error) {
            console.error("Error generating generator:", error);
            return "";
        }
    };

    const generateRandomScalar = () => {
        try {
            const randomScalar = wasm.Scalar.random();
            return randomScalar.toString();
        } catch (error) {
            console.error("Error generating random scalar:", error);
            return "";
        }
    };

    const onFirstGroupChange = (event) => {
        setGroupValueOne(event.target.value);
        calculateResult(event.target.value, groupValueTwo, operation);
    };

    const onSecondGroupChange = (event) => {
        setGroupValueTwo(event.target.value);
        calculateResult(groupValueOne, event.target.value, operation);
    };

    const onOperationChange = (value) => {
        setOperation(value);
        calculateResult(groupValueOne, groupValueTwo, value);
    };

    const onScalarChange = (event) => {
        setScalarValue(event.target.value);
        calculateResult(groupValueOne, groupValueTwo, operation, event.target.value);
    };

    const calculateResult = (group1Str, group2Str, op, scalar = scalarValue) => {
        if ((op === "scalar mul" && (group1Str === "" || scalar === "")) || 
            (op !== "scalar mul" && op !== "neg" && op !== "double" && (group1Str === "" || group2Str === ""))) {
            setResult("");
            return;
        }

        try {
            const group1 = wasm.Group.fromString(group1Str);
            let resultGroup;

            switch (op) {
                case "add":
                    const group2 = wasm.Group.fromString(group2Str);
                    resultGroup = group1.add(group2);
                    break;
                case "sub":
                    const group2Sub = wasm.Group.fromString(group2Str);
                    resultGroup = group1.subtract(group2Sub);
                    break;
                case "scalar mul":
                    const scalarField = wasm.Scalar.fromString(scalar);
                    resultGroup = group1.mul(scalarField);
                    break;
                case "double":
                    resultGroup = group1.double();
                    break;
                case "neg":
                    resultGroup = group1.inverse();
                    break;
                default:
                    resultGroup = group1;
            }

            setResult(resultGroup.toString());
        } catch (error) {
            setResult("Invalid input");
            console.log(error);
        }
    };

    const layout = { 
        labelCol: { span: 6 }, 
        wrapperCol: { span: 18 },
        style: { marginBottom: '24px' }
    };

    return (
        <Card
            title="Group Arithmetic"
            style={{ width: "100%" }}
        >
            <Form {...layout}>
                <Form.Item 
                    label={<span style={{ whiteSpace: 'nowrap' }}>Group Element 1</span>}
                    colon={false}
                    style={{ marginBottom: '24px' }}
                >
                    <Input.Group compact>
                        <Input
                            name="groupElementOne"
                            size="large"
                            placeholder="Enter first group element"
                            allowClear
                            value={groupValueOne}
                            onChange={onFirstGroupChange}
                            style={{ width: 'calc(100% - 220px)' }}
                        />
                        <Button 
                            size="large"
                            onClick={() => setGroupValueOne(generateRandomGroup())}
                            style={{ width: '110px' }}
                        >
                            Random
                        </Button>
                        <Button 
                            size="large"
                            onClick={() => setGroupValueOne(generateGenerator())}
                            style={{ width: '110px' }}
                        >
                            Generator
                        </Button>
                    </Input.Group>
                </Form.Item>

                <Form.Item 
                    label={<span style={{ whiteSpace: 'nowrap' }}>Operation</span>}
                    colon={false}
                    style={{ marginBottom: '24px' }}
                >
                    <Radio.Group
                        value={operation}
                        onChange={(e) => onOperationChange(e.target.value)}
                        size="large"
                    >
                        {operations.map(op => (
                            <Radio.Button key={op.value} value={op.value}>
                                {op.label}
                            </Radio.Button>
                        ))}
                    </Radio.Group>
                </Form.Item>

                {operation === "scalar mul" ? (
                    <Form.Item 
                        label={<span style={{ whiteSpace: 'nowrap' }}>Scalar</span>}
                        colon={false}
                        style={{ marginBottom: '24px' }}
                    >
                        <Input.Group compact>
                            <Input
                                name="scalarValue"
                                size="large"
                                placeholder="Enter scalar value"
                                allowClear
                                value={scalarValue}
                                onChange={onScalarChange}
                                style={{ width: 'calc(100% - 110px)' }}
                            />
                            <Button 
                                size="large"
                                onClick={() => setScalarValue(generateRandomScalar())}
                                style={{ width: '110px' }}
                            >
                                Random
                            </Button>
                        </Input.Group>
                    </Form.Item>
                ) : (
                    <Form.Item 
                        label={<span style={{ whiteSpace: 'nowrap' }}>Group Element 2</span>}
                        colon={false}
                        style={{ marginBottom: '24px' }}
                    >
                        <Input.Group compact>
                            <Input
                                name="groupElementTwo"
                                size="large"
                                placeholder="Enter second group element"
                                value={groupValueTwo}
                                allowClear={true}
                                onChange={onSecondGroupChange}
                                style={{ width: 'calc(100% - 220px)' }}
                            />
                            <Button 
                                size="large"
                                onClick={() => setGroupValueTwo(generateRandomGroup())}
                                style={{ width: '110px' }}
                            >
                                Random
                            </Button>
                            <Button 
                                size="large"
                                onClick={() => setGroupValueTwo(generateGenerator())}
                                style={{ width: '110px' }}
                            >
                                Generator
                            </Button>
                        </Input.Group>
                    </Form.Item>
                )}

                <Divider />
                <Form.Item 
                    label={<span style={{ whiteSpace: 'nowrap' }}>Result</span>}
                    colon={false}
                    style={{ marginBottom: '24px' }}
                >
                    <Input
                        size="large"
                        placeholder="Result will appear here"
                        value={result}
                        addonAfter={
                            <CopyButton data={result} />
                        }
                        disabled
                    />
                </Form.Item>
            </Form>
        </Card>
    );
};
