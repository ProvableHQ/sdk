import React, {useState, useEffect} from "react";
import {Card, Divider, Form, Input, Button } from "antd";
const { TextArea } = Input;
import {useAleoWASM} from "../../aleo-wasm-hook";
import {downloadAndStoreFiles, getSavedFile} from '../../db';

const worker = new Worker("./worker.js");

export const SendCredits = () => {
    const [privateKey, setPrivateKey] = useState("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6");
    const [toAddress, setToAddress] = useState("aleo184tj0fllfuzqzpmw5jt6l2ptx0avhjxh95u9llcr6ypf6fx3hvrsref0ju");
    const [amount, setAmount] = useState(50);
    const [plaintext, setPlaintext] = useState(`{
      owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,
      gates: 1159017656332810u64.private,
      _nonce: 1635890755607797813652478911794003479783620859881520791852904112255813473142group.public
    }`);
    const [transaction, setTransaction] = useState(null);
    const aleo = useAleoWASM();

    useEffect(() => {
        worker.addEventListener("message", ev => {
            setTransaction(ev.data.transaction);
          });
    }, []);

    const safeStateUpdate = (update, event) => {
      try { update(event.target.value) }
      catch (error) { console.error(error)}
    }

    const buildTransaction = async () => {
      try {
        // Download files
        let startTime = performance.now();
        await downloadAndStoreFiles();
        console.log(`Download Completed: ${performance.now() - startTime} ms`);
        startTime = performance.now();

        // Get transfer prover from IndexedDB
        const transferProver = await getSavedFile('TransferProver');
        console.log(transferProver);
        console.log(`Fetching Transfer Prover from IndexedDb Completed: ${performance.now() - startTime} ms`);
        startTime = performance.now();

        // Build transaction
        worker.postMessage({privateKey, transferProverBytes: transferProver.bytes, amount, toAddress, plaintext})
        console.log('Called web worker');
      } catch (error) { console.error(error) }
    }

    const layout = {labelCol: {span: 4}, wrapperCol: {span: 21}};

    if (aleo !== null) {
        return <Card title="Send Credits" style={{width: "100%", borderRadius: "20px"}} bordered={false}>
            <Form {...layout}>
                <Form.Item label="Private Key" colon={false}>
                    <Input name="privateKey" size="large" placeholder="Private Key" allowClear value={privateKey} onChange={(evt) => safeStateUpdate(setPrivateKey, evt)}
                          style={{borderRadius: '20px'}}/>
                </Form.Item>
                <Form.Item label="To Address" colon={false}>
                    <Input name="toAddress" size="large" placeholder="To Address" allowClear value={toAddress} onChange={(evt) => safeStateUpdate(setToAddress, evt)}
                          style={{borderRadius: '20px'}}/>
                </Form.Item>
                <Form.Item label="Amount" colon={false}>
                    <Input name="amount" size="large" placeholder="Amount" allowClear value={amount} onChange={(evt) => safeStateUpdate(setAmount, evt)}
                          style={{borderRadius: '20px'}}/>
                </Form.Item>
                <Form.Item label="Record (Plain Text)" colon={false}>
                    <TextArea rows={5} name="recordPlainText" size="large" placeholder="Record (Plain Text)" allowClear value={plaintext} onChange={(evt) => safeStateUpdate(setPlaintext, evt)}
                          style={{borderRadius: '20px'}}/>
                </Form.Item>
                <Button onClick={() => buildTransaction()}>
                  Create Transaction
                </Button>
            </Form>
            {
                (transaction !== null) ?
                    <Form {...layout}>
                        <Divider/>
                        <Form.Item label="Transaction" colon={false}>
                            <TextArea rows={7} size="large" placeholder="Transaction" value={transaction} readOnly={true} />
                        </Form.Item>
                    </Form>
                    : null
            }
        </Card>
    } else {
        return <h3>
            <center>Loading...</center>
        </h3>
    }
}