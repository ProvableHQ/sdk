import { useState } from "react";
import { Button, Card, Col, Divider, Form, Input, Result, Row } from "antd";
import axios from "axios";
import { CopyButton } from "../../components/CopyButton";

export const GetMappingValue = () => {
    const [programID, setProgramID] = useState(null);
    const [mappingName, setMappingName] = useState(null);
    const [mappingKey, setMappingKey] = useState(null);
    const [mappingValue, setMappingValue] = useState(null);
    const [mappingError, setMappingError] = useState(null);

    // Returns the program id if the user changes it or the "Demo" button is clicked.
    const onProgramIDChange = (event) => {
        setProgramID(null);
        try {
            setProgramID(event.target.value);
        } catch (error) {
            console.error(error);
        }
    };

    const onMappingNameChange = (event) => {
        setMappingName(null);
        try {
            setMappingName(event.target.value);
        } catch (error) {
            console.error(error);
        }
    };
    const onMappingKeyChange = (event) => {
        setMappingKey(null);
        try {
            setMappingKey(event.target.value);
        } catch (error) {
            console.error(error);
        }
    };

    const setDefaultRequest = (id, name, key) => {
        setProgramID(id);
        setMappingName(name);
        setMappingKey(key);
    };

    const mappingErrorString = () =>
        mappingError !== null ? mappingError : "";

    // Attempts to request the program bytecode with the given program id.
    const tryRequest = () => {
        setMappingError(null);

        try {
            if (programID && mappingName && mappingKey) {
                axios
                    .get(
                        `https://api.explorer.aleo.org/v1/testnet3/program/${programID}/mapping/${mappingName}/${mappingKey}`,
                    )
                    .then((response) => {
                        if (response.data === null) {
                            setMappingValue("Key Not Found");
                        } else {
                            setMappingValue(response.data);
                        }
                    })
                    .catch((error) => {
                        // Reset the mapping text to `null` if the program id does not exist.
                        setMappingValue(null);
                        setMappingError(error.response?.data);
                        console.error(error);
                    });
            } else {
                // Reset the mapping text if the user clears the search bar.
                setMappingValue(null);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };
    const programIDString = () => (programID !== null ? programID : "");
    const mappingNameString = () => (mappingName !== null ? mappingName : "");
    const mappingKeyString = () => (mappingKey !== null ? mappingKey : "");
    const mappingValueString = () =>
        mappingValue !== null ? mappingValue : "";

    return (
        <Card
            title="Get Mapping Value"
            style={{ width: "100%" }}
            extra={
                <Button
                    type="primary"
                    
                    size="middle"
                    onClick={() => {
                        setDefaultRequest(
                            "credits.aleo",
                            "account",
                            "aleo1q6qstg8q8shwqf5m6q5fcenuwsdqsvp4hhsgfnx5chzjm3secyzqt9mxm8",
                        );
                    }}
                >
                    Demo
                </Button>
            }
        >
            <Form {...layout}>
                <Form.Item label="Program ID" colon={false}>
                    <Input
                        name="programID"
                        size="large"
                        placeholder="Program ID"
                        value={programIDString()}
                        allowClear={true}
                        onChange={onProgramIDChange}
                    />
                </Form.Item>
                <Form.Item label="Mapping Name" colon={false}>
                    <Input
                        name="mappingName"
                        size="large"
                        placeholder="Mapping Name"
                        value={mappingNameString()}
                        allowClear={true}
                        onChange={onMappingNameChange}
                    />
                </Form.Item>
                <Form.Item label="Mapping Key" colon={false}>
                    <Input
                        name="mappingKey"
                        size="large"
                        placeholder="Mapping Key"
                        value={mappingKeyString()}
                        allowClear={true}
                        onChange={onMappingKeyChange}
                    />
                </Form.Item>
            </Form>
            <Row justify="center">
                <Col>
                    <Button
                        type="primary"
                        
                        size="middle"
                        onClick={tryRequest}
                    >
                        Get Mapping Value
                    </Button>
                </Col>
            </Row>
            {mappingValue !== null ? (
                <Form {...layout}>
                    <Divider />
                    <Row align="middle">
                        <Col span={23}>
                            <Form.Item label="Mapping Value" colon={false}>
                                <Input.TextArea
                                    size="large"
                                    rows={3}
                                    placeholder="Value"
                                    style={{
                                        whiteSpace: "pre-wrap",
                                        overflowWrap: "break-word",
                                    }}
                                    value={mappingValueString()}
                                    disabled
                                />
                            </Form.Item>
                        </Col>
                        <Col span={1} align="middle">
                            <CopyButton data={mappingValueString()} />
                        </Col>
                    </Row>
                </Form>
            ) : null}
            {mappingError !== null && (
                <Result
                    status="error"
                    title="Mapping Error"
                    subTitle={"Error: " + mappingErrorString()}
                />
            )}
        </Card>
    );
};
