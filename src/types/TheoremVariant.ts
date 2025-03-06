import { Node } from '../lib/syntax-checker/Node';

export interface TheoremVariant {
    premises: Node[];
    conclusion: Node;
}