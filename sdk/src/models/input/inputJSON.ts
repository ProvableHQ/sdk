/**
 * Object representation of an Input as raw JSON returned from a SnarkOS node.
 */
export type InputJSON = {
    type: string;
    id: string;
    tag?: string;
    origin?: Origin;
    value?: string;
}
export type Origin = {
    commitment: string;
}
