import { Node } from '../lib/syntax-checker/Node';

/**
 * Represents a variant of a theorem.
 */
export interface TheoremVariant {
	premises: Node[];
	conclusion: Node;
}
