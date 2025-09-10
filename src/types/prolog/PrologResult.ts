/**
 * Result interfaces for typechecking
 */
export interface ProveResult {
	X: unknown;
}

export interface SubstitutionResult {
	X: unknown;
}

export interface ContradictionResult {
	X: unknown;
	Y: unknown;
	Z: unknown;
}

export interface TheoremTableResults {
	X: TheoremTableResult;
}

export interface TheoremTableResult {
	X: TheoremTableRow[];
}

interface TheoremTableRow {
	0: number; // line
	1: PrologCompound | string; // formula
	2: string; // rule
	3: number[]; // lines used
	4: string[]; // params used
}

export interface ProofTableResult {
	X: unknown;
}

export interface BooleanResult {
	success: boolean;
}

export interface ArgsTableResult {
	X: ArgsTableRow[];
}

export type ArgsTableRow = {
	0: PrologCompound;
	1: number;
	2: PrologCompound[];
};

export type PrologCompound = {
	$t: 't';
	functor: string;
	[key: string]: unknown;
};
