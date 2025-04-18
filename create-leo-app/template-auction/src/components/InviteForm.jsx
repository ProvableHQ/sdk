import React from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import { PROGRAM_ID } from '../core/constants';

export const InviteForm = ({ visible, onCancel, ticketRecord }) => {
    const { publicKey, requestTransaction, requestRecords } = useWallet();
    const [form] = Form.useForm();

    const handleSubmit = async (values) => {
        try {
            const transaction = Transaction.createTransaction(
                publicKey,
                WalletAdapterNetwork.TestnetBeta,
                PROGRAM_ID,
                'invite_to_auction',
                [ticketRecord, "aleo1cuu3zmcsrfnu9mk32nvzjhfjty9kjvxl0p6cty6ewefp95hgqvfqmhe5pl"],
                70000,
                false,
            );

            console.log(transaction);
            
            await requestTransaction(transaction);
            onCancel();
        } catch (error) {
            console.error('Error sending invite:', error);
        }
    };

    return (
        <Modal
            title="Invite to Bid"
            open={visible}
            onCancel={onCancel}
            footer={null}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    name="inviteeAddress"
                    label="Invitee Address"
                    rules={[
                        { required: true, message: 'Please enter the invitee address' },
                        { 
                            pattern: /^aleo1[a-z0-9]{58}$/i,
                            message: 'Please enter a valid Aleo address'
                        }
                    ]}
                >
                    <Input placeholder="Enter Aleo address to invite" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Send Invite
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}; 