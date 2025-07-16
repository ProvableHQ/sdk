import { AuthorizationJSON } from "./authorization";

export interface ProvingRequestJSON {
    authorization: AuthorizationJSON;
    fee_authorization?: AuthorizationJSON;
    broadcast: boolean;
}