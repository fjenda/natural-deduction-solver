/**
 * TheoremData
 * Type used in substitution of the theorem variables
 */
export type TheoremData = {
	theoremId: number;
	vars: Set<string>;
	varInputs: string[];
};
