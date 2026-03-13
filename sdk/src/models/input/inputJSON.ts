/**
 * Object representation of an Input as raw JSON returned from a SnarkOS node.
 */
export interface InputJSON {
    type: string;
    id: string;
    tag?: string;
    value?: string;
}
