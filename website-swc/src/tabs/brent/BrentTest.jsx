import React, {useState} from "react";
import {Button, Card, Form, Input} from "antd";
import {useAleoWASM} from "../../aleo-wasm-hook";

export const BrentTest = () => {
    const [program, setProgram] = useState(null);
    const aleo = useAleoWASM();

    const creditsCode = "program credits.aleo;\n" +
        "\n" +
        "record credits:\n" +
        "    owner as address.private;\n" +
        "    microcredits as u64.private;\n" +
        "    bop as u64.private;\n" +
        "\n" +
        "function mint:\n" +
        "    input r0 as address.public;\n" +
        "    input r1 as u64.public;\n" +
        "    cast r0 r1 into r2 as credits.record;\n" +
        "    output r2 as credits.record;\n" +
        "\n" +
        "function transfer:\n" +
        "    input r0 as credits.record;\n" +
        "    input r1 as address.private;\n" +
        "    input r2 as u64.private;\n" +
        "    sub r0.microcredits r2 into r3;\n" +
        "    cast r1 r2 into r4 as credits.record;\n" +
        "    cast r0.owner r3 into r5 as credits.record;\n" +
        "    output r4 as credits.record;\n" +
        "    output r5 as credits.record;\n" +
        "\n" +
        "function join:\n" +
        "    input r0 as credits.record;\n" +
        "    input r1 as credits.record;\n" +
        "    add r0.microcredits r1.microcredits into r2;\n" +
        "    cast r0.owner r2 into r3 as credits.record;\n" +
        "    output r3 as credits.record;\n" +
        "\n" +
        "function split:\n" +
        "    input r0 as credits.record;\n" +
        "    input r1 as u64.private;\n" +
        "    sub r0.microcredits r1 into r2;\n" +
        "    cast r0.owner r1 into r3 as credits.record;\n" +
        "    cast r0.owner r2 into r4 as credits.record;\n" +
        "    output r3 as credits.record;\n" +
        "    output r4 as credits.record;\n" +
        "\n" +
        "function fee:\n" +
        "    input r0 as credits.record;\n" +
        "    input r1 as u64.public;\n" +
        "    assert.neq r1 0u64 ;\n" +
        "    sub r0.microcredits r1 into r2;\n" +
        "    cast r0.owner r2 into r3 as credits.record;\n" +
        "    output r3 as credits.record;"

    const populateForm = async () => {
        const creditsProgram = aleo.Program.fromString(creditsCode)
        setProgram(creditsProgram);
    }
    const renderInput = (input, inputIndex) => {
        console.log(input)
        if (input.type === "record") {
            return input.members.map((member, memberIndex) => (
                <Form.Item
                    key={`${inputIndex}-${memberIndex}`}
                    label={`r${inputIndex} as ${member.name}`}
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

    const layout = {labelCol: {span: 4}, wrapperCol: {span: 21}};

    if (aleo !== null) {
        return <Card title="Credits Aleo Form"
                     style={{width: "100%", borderRadius: "20px"}}
                     bordered={false}
                     extra={<Button type="primary" shape="round" size="middle"
                                    onClick={populateForm}>Demo</Button>}>
            {
                (program) ?
                    <div>
                        {program.getFunctions().map((func, index) => {
                            const inputs = program.getFunctionInputs(func);
                            console.log(inputs)
                            return (
                                <Form {...layout} key={index} onFinish={onFinish}>
                                    <h3>{func}</h3>
                                    {inputs.map(renderInput)}
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit">
                                            Submit
                                        </Button>
                                    </Form.Item>
                                </Form>
                            );
                        })}
                    </div> : null
            }
        </Card>
    } else {
        return <h3>
            <center>Loading...</center>
        </h3>
    }
}