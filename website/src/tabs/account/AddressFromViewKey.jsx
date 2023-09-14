import { useState } from "react";
import { Card, Divider, Form, Input } from "antd";
import { CopyButton } from "../../components/CopyButton";
import { useAleoWASM } from "../../aleo-wasm-hook";

export const AddressFromViewKey = () => {
    const [addressFromViewKey, setAddressFromViewKey] = useState(null);
    const [aleo] = useAleoWASM();

    const onChange = (event) => {
        setAddressFromViewKey(null);
        try {
            setAddressFromViewKey(aleo.ViewKey.from_string(event.target.value));
        } catch (error) {
            console.error(error);
        }
    };

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };

    if (aleo !== null) {
        const address = () =>
            addressFromViewKey !== null
                ? addressFromViewKey.to_address().to_string()
                : "";

        return (
            <Card
                title="Load Address from View Key"
                style={{ width: "100%" }}
            >
                <Form {...layout}>
                    <Form.Item label="View Key" colon={false}>
                        <Input
                            name="viewKey"
                            size="large"
                            placeholder="View Key"
                            allowClear
                            onChange={onChange}
                        />
                    </Form.Item>
                </Form>
                {addressFromViewKey !== null ? (
                    <Form {...layout}>
                        <Divider />
                        <Form.Item label="Address" colon={false}>
                            <Input
                                size="large"
                                placeholder="Address"
                                value={address()}
                                addonAfter={
                                    <CopyButton
                                        data={address()}
                                    />
                                }
                                disabled
                            />
                        </Form.Item>
                    </Form>
                ) : null}
            </Card>
        );
    } else {
        return (
            <h3>
                <center>Loading...</center>
            </h3>
        );
    }
};
