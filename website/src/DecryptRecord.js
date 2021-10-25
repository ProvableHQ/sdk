import {Card, Form, Input} from "antd";
import React, {useState} from "react";
import {useAleoWASM} from "./aleo-wasm-hook";

const DecryptRecord = () => {
    const layout = {labelCol: {span: 2}, wrapperCol: {span: 20}};
    const aleo = useAleoWASM();
    const [viewKey, setViewKey] = useState();
    const [record, setRecord] = useState();
    const [error, setError] = useState();

    const onChangeViewKey = (event) => {
        setViewKey(event.target.value);
    }

    const onChangeRecordCiphertext = (event) => {
        try {
            let recordCiphertext = aleo.RecordCiphertext.new(event.target.value);
            let decryptedRecord = recordCiphertext.decrypt(viewKey);
            setRecord(decryptedRecord);
            setError();
        } catch (e) {
            console.error(e);
            setError(e);
        }
    }

    return <>
        <Card title="Decrypt Record with View Key" style={{width: "100%", borderRadius: "20px"}}
              bordered={false}>
            <Form {...layout}>
                <Form.Item label="View Key" colon={false}>
                    <Input name="viewKey" size="large" placeholder="View Key" allowClear onChange={onChangeViewKey}
                           style={{borderRadius: '20px'}}/>
                </Form.Item>
                <Form.Item label="Record Ciphertext" colon={false}>
                    <Input name="recordCiphertext" size="large" placeholder="Record Ciphertext" allowClear
                           onChange={onChangeRecordCiphertext}
                           style={{borderRadius: '20px'}}/>
                </Form.Item>
            </Form>
        </Card>
        <Card title="Decrypted Record" style={{width: "100%", borderRadius: "20px", "margin-top": "8px"}}
              bordered={false}>
            {
                record &&
                <pre>{JSON.stringify(JSON.parse(record.to_string()), null, 4)}</pre>
            }
            {
                !record && !error &&
                    <h3>Provide a View Key and Record Ciphertext to decrypt</h3>
            }
            {
                error &&
                    <h3 style={{color: "red"}}>{error.toString()}</h3>
            }
        </Card>
    </>;
}

export default DecryptRecord;