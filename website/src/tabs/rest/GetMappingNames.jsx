import { useState } from "react";
import { Button, Card, Col, Divider, Form, Input, Row } from "antd";
import axios from "axios";
import { CopyButton } from "../../components/CopyButton";

export const GetMappingNames = () => {
    const [mapping, setMapping] = useState(null);
    const [programID, setProgramID] = useState(null);
    const [status, setStatus] = useState("");

    // Returns the program id if the user changes it or the "Demo" button is clicked.
    const onChange = (event) => {
        if (event.target.value !== null) {
            setProgramID(event.target.value);
        }
        return programID;
    };

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
                    .get(
                        `https://api.explorer.aleo.org/v1/testnet3/program/${id}/mappings`,
                    )
                    .then((response) => {
                        setStatus("success");
                        setMapping(response.data);
                    })
                    .catch((error) => {
                        // Reset the mapping text to `null` if the program id does not exist.
                        setMapping(null);
                        setStatus("error");
                        console.error(error);
                    });
            } else {
                // Reset the mapping text if the user clears the search bar.
                setMapping(null);
                // If the search bar is empty reset the status to "".
                setStatus("");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };
    const mappingString = () => (mapping !== null ? mapping : "");
    const programIDString = () => (programID !== null ? programID : "");

    return (
        <Card
            title="Get Mapping Names"
            style={{ width: "100%" }}
            extra={
                <Button
                    type="primary"
                    
                    size="middle"
                    onClick={() => {
                        tryRequest("credits.aleo");
                    }}
                >
                    Demo
                </Button>
            }
        >
            <Form {...layout}>
                <Form.Item
                    label="Program ID"
                    colon={false}
                    validateStatus={status}
                >
                    <Input.Search
                        name="id"
                        size="large"
                        placeholder="Program ID"
                        allowClear
                        onSearch={onSearch}
                        onChange={onChange}
                        value={programIDString()}
                    />
                </Form.Item>
            </Form>
            {mapping !== null ? (
                <Form {...layout}>
                    <Divider />
                    <Row align="middle">
                        <Col span={23}>
                            <Form.Item label="Mapping Names" colon={false}>
                                <Input.TextArea
                                    size="large"
                                    rows={5}
                                    placeholder="Names"
                                    style={{
                                        whiteSpace: "pre-wrap",
                                        overflowWrap: "break-word",
                                    }}
                                    value={mappingString()}
                                    disabled
                                />
                            </Form.Item>
                        </Col>
                        <Col span={1} align="middle">
                            <CopyButton data={mappingString()} />
                        </Col>
                    </Row>
                </Form>
            ) : null}
        </Card>
    );
};
