export enum Op {
    AND = 'AND',
    OR = 'OR',
    IMP = 'IMP',
    EQ = 'EQ',
    NOT = 'NOT',
}

export interface Premise {
    type: Op;
    left?: Premise;
    right?: Premise;
    value?: string;
}
