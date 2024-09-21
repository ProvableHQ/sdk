import { useEffect, useRef, useState } from "react";
import { Card, Form, Input } from "antd";
import { useAleoWASM } from "../../aleo-wasm-hook";

export const VerifyMessage = () => {
    const [inputAddress, setInputAddress] = useState(null);
    const [verified, setVerified] = useState(false);
    const [signatureInput, setSignatureInput] = useState(null);
    const [messageInput, setMessageInput] = useState(null);
    const didMount = useRef(false);
    const [aleo] = useAleoWASM();
    const textEncoder = new TextEncoder();

    const attemptVerify = () => {
        if (
            messageInput !== null &&
            signatureInput !== null &&
            inputAddress !== null
        ) {
            try {
                let messageBytes = textEncoder.encode(messageInput);
                let signature = aleo.Signature.from_string(signatureInput);
                let isVerified = inputAddress.verify(messageBytes, signature);
                setVerified(isVerified);
            } catch (error) {
                console.warn(error);
                setVerified(false);
            }
        }
    };
    const onAddressChange = (event) => {
        try {
            setInputAddress(aleo.Address.from_string(event.target.value));
        } catch (error) {
            setInputAddress(null);
            console.warn(error);
        } finally {
            setVerified(false);
            setMessageInput(null);
            setSignatureInput(null);
        }
    };
    const onMessageChange = (event) => {
        setMessageInput(event.target.value);
    };
    const onSignatureChange = (event) => {
        setSignatureInput(event.target.value);
    };

    const validateStatusSignature = () => {
        return signatureInput !== null ? (verified ? "success" : "error") : "";
    };

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };
    useEffect(() => {
        if (didMount.current) {
            attemptVerify();
        } else {
            didMount.current = true;
        }
    }, [messageInput, signatureInput, inputAddress, verified]);
    if (aleo !== null) {
        const messageString = () =>
            messageInput !== null ? messageInput.toString() : "";
        const signatureString = () =>
            signatureInput !== null ? signatureInput.toString() : "";
        return (
            <Card
                title="Verify a Message"
                style={{ width: "100%"}}
            >
                <Form {...layout}>
                    <Form.Item label="Address" colon={false}>
                        <Input
                            name="address"
                            size="large"
                            placeholder="Address"
                            allowClear
                            onChange={onAddressChange}
                        />
                    </Form.Item>
                    <Form.Item label="Message" colon={false}>
                        <Input
                            name="Message"
                            size="large"
                            placeholder="Message"
                            value={messageString()}
                            onChange={onMessageChange}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Signature"
                        colon={false}
                        hasFeedback
                        validateStatus={validateStatusSignature()}
                    >
                        <Input
                            name="Signature"
                            size="large"
                            placeholder="Signature"
                            value={signatureString()}
                            onChange={onSignatureChange}
                        />
                    </Form.Item>
                </Form>
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
