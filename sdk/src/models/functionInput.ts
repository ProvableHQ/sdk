export interface FunctionInput {
    type: string;
    visibility: string;
    record?: string;
    register?: string;
    members?: FunctionInput[];
}
