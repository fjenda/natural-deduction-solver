import { NodeType } from '../lib/syntax-checker/NodeType';

/**
 * TheoremData
 * Type used in substitution of the theorem variables
 */
export type TheoremData = {
	theoremId: number;
	vars: { varName: string; prologString: string; type: NodeType }[];
	varInputs: string[];
};
