import axios from 'axios';
import { ResponseType } from "axios";

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

async function* readChunks(reader: ReadableStreamDefaultReader<Uint8Array>) {
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            yield value;
        }
    } finally {
        reader.releaseLock();
    }
}

const SSEconfig = {
    headers: {
        "Content-type": "application/json; charset=UTF-8",
        "Referrer-Policy": "no-referrer",
    },
    responseType: 'stream' as ResponseType,
};

export class DevelopmentClient {
    /**
     * Aleo Development Client for usage with an Aleo Development Server. This client is meant
     * to provide a typescript & javascript api for deploying and executing programs on the
     * Aleo Network using an Aleo Development Server. An Aleo Development Server is a rust-based
     * server which runs all the proving & verification operations needed to deploy and execute
     * programs and then posts program deployments and executions to the Aleo Network. This client
     * will send RESTful requests to that server and return the resulting transaction_id.
     *
     * It requires an Aleo Development Server to be running locally. If one is not running, this
     * client will not work.
     *
     * Information on how to run an Aleo Development Server can be found here:
     * https://github.com/AleoHQ/aleo/rust/develop/README.md
     */
    baseURL: string;

    /**
     * Creates a new DevelopmentClient to interact with an Aleo Development Server.
     *
     * @param {string} baseURL The URL of the Aleo Development Server
     */
    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }


    async sendSSERequest<T>(path: string, request: any): Promise<T> {
        console.debug("Sending SSE Request");
        return new Promise<T>(async (resolve, reject) => {
            try {
                const response = await fetch(`${this.baseURL}/testnet3${path}`, {
                    method: 'POST',
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                        "Referrer-Policy": "no-referrer",
                    },
                    body: JSON.stringify(request),
                });

                if (!response.ok) {
                    reject(new Error(`Request failed with status ${response.status}: ${response.statusText}`));
                    return;
                }

                if (!response.body) {
                    reject(new Error('No response body'));
                    return;
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                let eventType: string | null = null;

                for await (const chunk of readChunks(reader)) {
                    const decodedChunk = decoder.decode(chunk, { stream: true });
                    const lines = decodedChunk.split('\n');

                    for (const line of lines) {
                        console.debug("Line:", line);
                        if (line.startsWith('event:')) {
                            eventType = line.slice(6);
                            console.debug("Event Type:", eventType);
                        } else if (line.startsWith('data:') && eventType) {
                            const data = line.slice(6);
                            if (eventType === 'success') {
                                resolve(data as T);
                                return;
                            } else if (eventType === 'error' || eventType === 'timeout') {
                                console.debug("Error encountered");
                                reject(new Error(data));
                                return;
                            }

                            eventType = null;
                        }
                        if (eventType === 'error' || eventType === 'timeout') {
                            console.debug("Error encountered");
                            reject(new Error(eventType));
                            return;
                        }
                    }
                }
            } catch (error) {
                console.debug("Error: ", error);
                reject(error);
            }
        });
    }

    async sendRequest<T>(path: string, request: any): Promise<T> {
        const response = await axios.post(`${this.baseURL}/testnet3${path}`, request, config);

        if (!(response.statusText = "200")) {throw new Error(`Error sending request: ${response.statusText}`);
        }

        return await response.data;
    }

    /**
     * Deploys a program on the Aleo Network via an Aleo development server.
     * It requires an Aleo Development Server to be running remotely or locally.
     * If one is not running, this function will throw an error.
     *
     * Information on how to run an Aleo Development Server can be found here:
     * https://github.com/AleoHQ/aleo/rust/develop/README.md
     * @param {string} program Text representation of the program to be deployed
     * @param {number} fee Fee to be paid for the program deployment (REQUIRED)
     * @param {string | undefined} privateKey Optional private key of the user who is deploying the program
     * @param {string | undefined} password If the development server is started with an encrypted private key, the password is required
     * @param {string | undefined} feeRecord Optional record in text format to be used for the fee. If not provided, the server will search the network for a suitable record to pay the fee.
     * @returns {string | Error} The transaction_id of the deployment transaction if successful
     *
     * @example
     * const Program = 'program yourprogram.aleo;\n\nfunction main:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n';
     * const client = new DevelopmentClient("http://0.0.0.0:4040");
     * const transaction_id = await client.deployProgram(Program, 6000000, privateKeyString);
     */
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
        return await this.sendSSERequest('/deploy', request);
    }

    /**
     * Executes a program on the Aleo Network via an Aleo development server.
     * It requires an Aleo Development Server to be running remotely or locally.
     * If one is not running, this function will throw an error.
     *
     * Information on how to run an Aleo Development Server can be found here:
     * https://github.com/AleoHQ/aleo/rust/develop/README.md
     * @param {string} programId The program_id of the program to be executed (e.g. hello.aleo)
     * @param {string} programFunction The function to execute within the program (e.g. main)
     * @param {number} fee Optional Fee to be paid for the execution transaction, specify 0 for no fee
     * @param {string[]} inputs Array of inputs to be passed to the program
     * @param {string | undefined} privateKey Optional private key of the user who is executing the program
     * @param {string | undefined} password If the development server is started with an encrypted private key, the password is required
     * @param {string | undefined} feeRecord Optional record in text format to be used for the fee. If not provided, the server will search the network for a suitable record to pay the fee.
     * @returns {string | Error} The transaction_id of the execution transaction if successful
     *
     * @example
     * const privateKey = "your private key";
     * const client = new DevelopmentClient("http://0.0.0.0:4040");
     * const transaction_id = await client.executeProgram("hello.aleo", "main", 0, ["5u32", "5u32"], privateKeyString);
     */
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
        return await this.sendSSERequest('/execute', request);
    }

    /**
     * Sends an amount in credits to a specified recipient on the Aleo Network
     * via an Aleo development server. It requires an Aleo Development Server
     * to be running remotely or locally. If one is not running, this function
     * will throw an error.
     *
     * Information on how to run an Aleo Development Server can be found here:
     * https://github.com/AleoHQ/aleo/rust/develop/README.md
     * @param {string} amount The amount of credits to be sent (e.g. 1.5)
     * @param {number} fee Optional Fee to be paid for the transfer, specify 0 for no fee
     * @param {string} recipient The recipient of the transfer
     * @param {string | undefined} privateKey Optional private key of the user who is sending the transfer
     * @param {string | undefined} password If the development server is started with an encrypted private key, the password is required
     * @param {string | undefined} feeRecord Optional record in text format to be used for the fee. If not provided, the server will search the network for a suitable record to pay the fee.
     * @param {string | undefined} amountRecord Optional record in text format to be used to fund the transfer. If not provided, the server will search the network for a suitable record to fund the amount.
     * @returns {string | Error} The transaction_id of the execution transaction if successful
     *
     * @example
     * const privateKey = "your private key";
     * const recipient = "recipient's address";
     * const client = new DevelopmentClient("http://0.0.0.0:4040");
     * const transaction_id = await client.transfer(1.5, 0, recipient, privateKey);
     */
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
            amount: amount*1000000,
            fee,
            recipient,
            private_key: privateKey,
            password,
            fee_record: feeRecord,
            amount_record: amountRecord
        }
        return await this.sendSSERequest('/transfer', request);
    }
}

export default DevelopmentClient;