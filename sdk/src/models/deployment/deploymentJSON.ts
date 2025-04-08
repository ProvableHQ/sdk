export type VerifyingKeys = [string, [string, string]];

export interface DeploymentJSON {
    "edition" : number,
    "program" : string,
    "verifying_keys" : VerifyingKeys,
}