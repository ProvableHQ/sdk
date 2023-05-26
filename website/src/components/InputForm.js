import React from 'react';
import { Form, Input, Typography } from 'antd';
const { Title } = Typography;
const nameOrIndex = (field, index) => {
    if (field.name) {
        return field.name;
    }
    return index + 1;
};

const createFormField = (field, index) => (
    <Form.Item label={nameOrIndex(field, index)} name={nameOrIndex(field, index)} key={index}>
        <Input placeholder={field.type} />
    </Form.Item>
);

export const FormGenerator = ({ formData }) => {
    const renderFormFields = (fields) => {
        return fields.map((field, index) => {
            console.log("field", field);
            if (field.members) {
                return (
                    <div key={index}>
                        <Title level={4}>{nameOrIndex(field, index)}</Title>
                        {renderFormFields(field.members)}
                    </div>
                );
            }
            return createFormField(field, index);
        });
    };

    return (
        <div>
            {formData.map((funcData, index) => (
                <div key={index}>
                    <Title level={3}>{"function: " + funcData.functionID}</Title>
                    <Form>
                        {renderFormFields(funcData.inputs)}
                    </Form>
                </div>
            ))}
        </div>
    );
};