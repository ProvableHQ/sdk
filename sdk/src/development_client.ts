import axios from 'axios';

interface DeployRequest {
    program: string;
    private_key?: string;
    password?: string;
    fee: number;
    fee_record?: string;
}

interface ExecuteRequest {
    program_id: string;
    program_function: string;
    inputs: string[];
    private_key?: string;
    password?: string;
    fee: number;
    fee_record?: string;
}

interface TransferRequest {
    amount: number;
    fee: number;
    recipient: string;
    private_key?: string;
    password?: string;
    fee_record?: string;
    amount_record?: string;
}

const config = {
    headers: {
        "Content-type": "application/json; charset=UTF-8",
        "Referrer-Policy": "no-referrer"
    },
};

export class DevelopmentClient {
    baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async sendRequest<T>(path: string, request: any): Promise<T> {
        const response = await axios.post(`${this.baseURL}/testnet3${path}`, request, config);

        if (!(response.statusText = "200")) {throw new Error(`Error sending request: ${response.statusText}`);
        }

        return await response.data;
    }

    async deployProgram(
        program: string,
        fee: number,
        privateKey?: string,
        password?: string,
        feeRecord?: string
    ): Promise<string> {
        const request: DeployRequest = {
            program,
            private_key: privateKey,
            password,
            fee,
            fee_record: feeRecord,
        };
        return await this.sendRequest('/deploy', request);
    }

    async executeProgram(
        programId: string,
        programFunction: string,
        fee: number,
        inputs: string[],
        privateKey?: string,
        password?: string,
        feeRecord?: string
    ): Promise<string> {
        const request: ExecuteRequest = {
            program_id: programId,
            program_function: programFunction,
            inputs,
            private_key: privateKey,
            password,
            fee,
            fee_record: feeRecord
        }
        return await this.sendRequest('/execute', request);
    }

    async transfer(
        amount: number,
        fee: number,
        recipient: string,
        privateKey?: string,
        password?: string,
        feeRecord?: string,
        amountRecord?: string
    ): Promise<string> {
        const request: TransferRequest = {
            amount,
            fee,
            recipient,
            private_key: privateKey,
            password,
            fee_record: feeRecord,
            amount_record: amountRecord
        }
        return await this.sendRequest('/transfer', request);
    }
}

export default DevelopmentClient;