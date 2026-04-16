import { AuthorizationJSON } from "./authorization.js";

export interface ProvingRequestJSON {
    authorization: AuthorizationJSON;
    fee_authorization?: AuthorizationJSON;
    broadcast: boolean;
}