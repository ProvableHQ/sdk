export type Input = {
    type: string;
    id: string;
    tag?: string;
    origin?: Origin;
    value?: string;
};
export type Origin = {
    commitment: string;
};
