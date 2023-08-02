import { RecordPlaintext } from "./record-plaintext";
import { AleoNetworkClient } from "./aleo_network_client";
import {Account} from "./account";

interface RecordSearchParams {
    unspent: boolean;
    program_id?: string;
    nonces?: string[];

    [key: string]: any; // This allows for arbitrary keys with any type values
}

interface RecordProvider {
    account: Account
    findCreditsRecord(microcredits: number, unspent: boolean, nonces?: string[]): Promise<RecordPlaintext | Error>;

    findCreditsRecords(microcredits: number[], unspent: boolean, nonces?: string[]): Promise<RecordPlaintext[] | Error>;

    findRecord(params: RecordSearchParams): Promise<RecordPlaintext | Error>;

    findRecords(params: RecordSearchParams): Promise<RecordPlaintext[] | Error>;
}

export {RecordProvider};