import { InputID} from "./inputID";

export interface RequestJSON {
    signer: string;
    network: string;
    program: string;
    method: string;
    input_ids: InputID[];
    inputs: string[];
    signature: string;
    sk_tag: string;
    tvk: string;
    tcm: string;
    scm: string;
}