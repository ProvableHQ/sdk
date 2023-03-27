declare class DevelopmentClient {
    baseURL: string;
    constructor(baseURL: string);
    sendRequest<T>(path: string, request: any): Promise<T>;
    deployProgram(program: string, fee: number, privateKey?: string, password?: string, feeRecord?: string): Promise<string>;
    executeProgram(programId: string, programFunction: string, fee: number, inputs: string[], privateKey?: string, password?: string, feeRecord?: string): Promise<string>;
    transfer(amount: number, fee: number, recipient: string, privateKey?: string, password?: string, feeRecord?: string, amountRecord?: string): Promise<string>;
}
export default DevelopmentClient;
