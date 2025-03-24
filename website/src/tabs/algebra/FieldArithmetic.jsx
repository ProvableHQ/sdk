import {useMemo, useState} from "react";
import { Card, Divider, Form, Input, Select, Radio, Button } from "antd";
import { CopyButton } from "../../components/CopyButton";
import { useAleoWASM } from "../../aleo-wasm-hook";

export const FieldArithmetic = () => {
    const [fieldValueOne, setFieldValueOne] = useState("");
    const [fieldValueTwo, setFieldValueTwo] = useState("");
    const [operation, setOperation] = useState("add");
    const [result, setResult] = useState("");
    const [wasm] = useAleoWASM();

    const generateRandomField = () => {
        try {
            const randomField = wasm.Field.random();
            return randomField.toString();
        } catch (error) {
            console.error("Error generating random field:", error);
            return "";
        }
    };

    const operations = [
        { value: "add", label: "Add (+)" },
        { value: "sub", label: "Subtract (-)" },
        { value: "mul", label: "Multiply (×)" },
        { value: "div", label: "Divide (÷)" },
        { value: "pow", label: "Power (x^y)" },
        { value: "inv", label: "Additive Inverse (-x)" },
        { value: "mulinv", label: "Multiplicative Inverse (1/x)"},
        { value: "equals", label: "Equals (==)" },
    ];

    const onFirstNumberChange = (event) => {
        setFieldValueOne(event.target.value);
        calculateResult(event.target.value, fieldValueTwo, operation);
    };

    const onSecondNumberChange = (event) => {
        setFieldValueTwo(event.target.value);
        calculateResult(fieldValueOne, event.target.value, operation);
    };

    const onOperationChange = (value) => {
        setOperation(value);
        calculateResult(fieldValueOne, fieldValueTwo, value);
    };

    const calculateResult = (num1, num2, op) => {
        if (((op === "inv" || op === "mulinv") && num1 === "") ||
            ((op !== "inv" && op !== "mulinv") && (num1 === "" || num2 === ""))) {
            setResult("");
            return;
        }

        try {
            let field1Text = num1;
            if (!field1Text.includes("field")) {
                field1Text = field1Text + "field";
            }
            const field1 = wasm.Field.fromString(field1Text);
            let resultField;

            if (op === "inv") {
                resultField = field1.inverse();
            } else if (op === "mulinv") {
                resultField = field1.divide(field1).divide(field1)
            } else {
                let field2Text = num2;
                if (!field2Text.includes("field")) {
                    field2Text = field2Text + "field"
                }
                const field2 = wasm.Field.fromString(field2Text);

                switch (op) {
                    case "add":
                        resultField = field1.add(field2);
                        break;
                    case "sub":
                        resultField = field1.subtract(field2);
                        break;
                    case "mul":
                        resultField = field1.multiply(field2);
                        break;
                    case "div":
                        if (field2.toString() === "0") {
                            setResult("Cannot divide by zero");
                            return;
                        }
                        resultField = field1.divide(field2);
                        break;
                    case "pow":
                        resultField = field1.pow(field2);
                        break;
                    case "equals":
                        resultField = field1.equals(field2);
                        break;
                    default:
                        resultField = field1.add(field2);
                }
            }

            setResult(resultField.toString());
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
            title="Finite Field Arithmetic"
            style={{ width: "100%" }}
        >
            <Form {...layout}>
                <Form.Item 
                    label={<span style={{ whiteSpace: 'nowrap' }}>Field Element 1</span>}
                    colon={false}
                    style={{ marginBottom: '24px' }}
                >
                    <Input.Group compact>
                        <Input
                            name="firstNumber"
                            size="large"
                            placeholder="Enter first number"
                            allowClear
                            value={fieldValueOne}
                            onChange={onFirstNumberChange}
                            style={{ width: 'calc(100% - 110px)' }}
                        />
                        <Button 
                            size="large"
                            onClick={() => onFirstNumberChange({target:{value:generateRandomField()}})}
                            style={{ width: '110px' }}
                        >
                            Random
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

                {operation !== "inv" && operation !== "mulinv" && (
                    <Form.Item 
                        label={<span style={{ whiteSpace: 'nowrap' }}>Field Element 2</span>}
                        colon={false}
                        style={{ marginBottom: '24px' }}
                    >
                        <Input.Group compact>
                            <Input
                                name="elementTwo"
                                size="large"
                                placeholder="Enter second number"
                                value={fieldValueTwo}
                                allowClear={true}
                                onChange={onSecondNumberChange}
                                style={{ width: 'calc(100% - 110px)' }}
                            />
                            <Button 
                                size="large"
                                onClick={() => onSecondNumberChange({target:{value:generateRandomField()}})}
                                style={{ width: '110px' }}
                            >
                                Random
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
