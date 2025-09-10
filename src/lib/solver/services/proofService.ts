import type { IRule } from '../../rules/IRule';
import { ProofHandler } from '../../../prolog/queries/ProofHandler';
import { get } from 'svelte/store';
import { solverContent } from '../../../stores/solverStore';
import type { TheoremData } from '../../../types/TheoremData';
import { theorems } from '../../../stores/theoremsStore';
import { Node } from '../../syntax-checker/Node';
import { ProofTable } from '../../../prolog/queries/ProofTable';
import { ArgsTable } from '../../../prolog/queries/ArgsTable';
import { addProofToStore } from '../utils/proofUtils';
import { showToast } from '../../utils/showToast';
import type { TreeRuleType } from '../../../types/TreeRuleType';

export async function provePrologLines(selected: number[], rule: IRule, params: string[]) {
	// get results
	const resultsPFL: string[] = await ProofHandler.proveLines(selected, rule, params);

	// no results
	if (resultsPFL.length === 0) {
		if (rule.short === 'IU') {
			showToast('Universal Introduction not applicable', 'error');
		}
		return;
	}

	// add to proof
	await addProof(resultsPFL, rule.short, selected, params);
}

/**
 * Proves the selected row the user selected using the Prolog engine
 * @param premises - the premises used from the proof
 * @param rule - the rule used
 * @param selected - the selected rows
 * @param params - the parameters used
 */
export async function proveProlog(
	premises: string[],
	rule: IRule,
	selected: number[],
	params: string[]
) {
	console.log(premises, rule, selected, params);

	// get results
	const resultsPFL: string[] = await ProofHandler.prove(premises, rule, params);

	// no results
	if (resultsPFL.length === 0) {
		if (rule.short === 'IU') {
			showToast('Universal Introduction not applicable', 'error');
		}
		return;
	}

	// add to proof
	await addProof(resultsPFL, rule.short, selected, params);
}

/**
 * Verifies the proof the user wrote using the Prolog engine
 * @param premises - the premises used from the proof
 * @param rule - the rule used
 * @param params - the parameters used
 * @param result - the result to verify
 */
export async function verifyProlog(
	premises: string[],
	rule: IRule,
	params: string[],
	result: Node
) {
	// get results
	const resultsPFL: string[] = await ProofHandler.prove(premises, rule, params);

	// no results
	if (resultsPFL.length === 0) return false;

	// check if exists
	const tmp = result.toPrologFormat();
	return resultsPFL.includes(tmp);
}

/**
 * Checks for usable rows in the proof for the highlighted row and rule
 * @param rule - the rule to check
 * @param row - the row to check
 */
export async function usable(
	rule: IRule,
	row: number
): Promise<{ highlighted: number[]; applicable: boolean }> {
	const proof = get(solverContent).proof;
	const indices: number[] = [];

	if (rule.inputSize === 1) {
		// special case for quantifier rules
		if (['EU', 'EEX'].includes(rule.short)) {
			return usableQuantifier(rule, row);
		}

		return { applicable: true, highlighted: [] };
	}

	for (let i = 0; i < proof.length; i++) {
		if (i === row - 1) continue;

		const results = await ProofHandler.proveLines([row, i + 1], rule, []);
		if (results.length === 0) continue;

		indices.push(i + 1);
	}

	return { applicable: !!indices.length, highlighted: indices };
}

// special case for quantifier elimination rules, helper function for usable
async function usableQuantifier(
	rule: IRule,
	selected: number
): Promise<{ highlighted: number[]; applicable: boolean }> {
	const res = await ProofHandler.proveLines([selected], rule, ['var(Y)', 'Z']);

	if (res.length === 0) {
		return { applicable: false, highlighted: [] };
	}

	return { applicable: true, highlighted: [] };
}

/**
 * Substitutes the theorem variables with the user's input using the Prolog engine
 * @param theoremData - the theorem data
 * @param newVars - the new variables to be added
 */
export async function substitute(theoremData: TheoremData, newVars: string[]) {
	const theorem = get(theorems)[theoremData.theoremId];
	const theoremPFL = theorem.solution.whole.tree?.toPrologFormat() ?? '';
	const parsed = await ProofHandler.substitute(theoremPFL, Array.from(theoremData.vars), newVars);

	await addProof([parsed], theorem.solution.name, []);
}

/**
 * Adds a proof to the solver content and updates the Prolog tables
 * @param results - the results of the proof
 * @param rule - the rule used for the proof
 * @param lines - the lines of the proof
 * @param replacements - the replacements used in the proof (optional)
 * @param trees - the trees used in the proof (optional)
 */
export async function addProof(
	results: string[],
	rule: string,
	lines: number[],
	replacements: string[] = [],
	trees?: Node[] | null
) {
	addProofToStore(results, rule, lines, replacements, trees);

	for (const r of results) {
		await ProofTable.write(r, rule, lines, replacements);
		await ArgsTable.write(r);
	}

	await ProofTable.print();
	// await ArgsTable.print();
}

/**
 * Checks if a row can be deleted from the proof
 * @param line - the line to check
 * @param proof - proof passed for recomputation
 */
export function canDeleteRow(line: number, proof: TreeRuleType[]) {
	return ProofTable.canDeleteRow(line);
}

/**
 * Checks if existential elimination is valid in the current proof
 */
export async function isExistentialEliminationValid() {
	return await ProofTable.isExistentialEliminationValid();
}

export async function getSuggestionsForTerm(term: string) {
	return await ArgsTable.getMatching(term);
}
