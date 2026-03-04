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

// --- Shared Error Config ---
const PROLOG_ERRORS: Record<string, string> = {
	IU: 'Universal Introduction not applicable.',
	EEX: 'The constant is not fresh! It already appears in the proof.'
};

/**
 * Unified handler for Prolog proof steps.
 * @param fetchStrategy - A function that returns the specific promise (lines vs premises)
 * @param rule - The rule object
 * @param onSuccess - Callback to execute on successful proof
 */
async function runPrologStep(
	fetchStrategy: () => Promise<string[]>,
	rule: IRule,
	onSuccess: (results: string[]) => Promise<void>
) {
	const results = await fetchStrategy();

	if (results.length === 0) {
		const msg = PROLOG_ERRORS[rule.short];
		if (msg) showToast(msg, 'error');
		return;
	}

	await onSuccess(results);
}

// --- Exported Actions ---

/**
 * Proves the selected lines the user selected using the Prolog engine
 * @param selected - the selected rows
 * @param rule - the rule used
 * @param params - the parameters used
 */
export async function provePrologLines(selected: number[], rule: IRule, params: string[]) {
	await runPrologStep(
		() => ProofHandler.proveLines(selected, rule, params),
		rule,
		(results) => addProof(results, rule.short, selected, params)
	);
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
	await runPrologStep(
		() => ProofHandler.prove(premises, rule, params),
		rule,
		(results) => addProof(results, rule.short, selected, params)
	);
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
): Promise<boolean> {
	const results = await ProofHandler.prove(premises, rule, params);

	if (results.length === 0) {
		const msg = PROLOG_ERRORS[rule.short];
		if (msg) showToast(msg, 'error');
		return false;
	}

	return results.includes(result.toPrologFormat());
}

/**
 * Adds a proof to the store AND updates the Prolog Tables (Side Effects)
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
	// update svelte store (Sync)
	const acceptedResults = addProofToStore(results, rule, lines, replacements, trees);

	// update Prolog database (Async)
	for (const r of acceptedResults) {
		await ProofTable.write(r, rule, lines, replacements);
		await ArgsTable.write(r);
	}

	await ProofTable.print();
	// await ArgsTable.print();
}

/**
 * Substitutes the theorem variables with the user's input using the Prolog engine
 * @param theoremData - the theorem data
 * @param newVars - the new variables to be added
 */
export async function substitute(theoremData: TheoremData, newVars: string[]) {
	const theorem = get(theorems)[theoremData.theoremId];
	const theoremPFL = theorem.solution.whole.tree?.toPrologFormat() ?? '';

	const parsed = await ProofHandler.substitute(
		theoremPFL,
		Array.from(theoremData.vars.map((v) => v.prologString)),
		newVars
	);

	await addProof([parsed], theorem.solution.name, []);
}

// --- Queries ---

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

		if (['IU', 'IEX'].includes(rule.short)) {
			return { applicable: true, highlighted: [] };
		}
	}

	for (let i = 0; i < proof.length; i++) {
		if (i === row - 1) continue;

		const results = await ProofHandler.proveLines([row, i + 1], rule, []);
		if (results.length === 0) continue;

		indices.push(i + 1);
	}

	return { applicable: !!indices.length, highlighted: indices };
}

/**
 * Checks for usable quantifier elimination rules in the proof
 * @param rule - the rule to check
 * @param selected - the selected row
 */
async function usableQuantifier(
	rule: IRule,
	selected: number
): Promise<{ highlighted: number[]; applicable: boolean }> {
	const res = await ProofHandler.proveLines([selected], rule, ['var(Y)', 'Z']);

	return { applicable: !!res.length, highlighted: [] };
}

/**
 * Checks if a row can be deleted from the proof
 * @param line - the line to check
 * @param proof - proof passed for recomputation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canDeleteRow(line: number, proof: TreeRuleType[]) {
	return ProofTable.canDeleteRow(line);
}

/**
 * Checks if existential elimination is valid in the current proof
 */
export async function isExistentialEliminationValid() {
	return await ProofTable.isExistentialEliminationValid();
}

/**
 * Gets suggestions for a term from the ArgsTable
 * @param term - the term to get suggestions for
 */
export async function getSuggestionsForTerm(term: string) {
	return await ArgsTable.getMatching(term);
}

/**
 * Validates if the substitution was done correctly by checking if the expected variable is free in the expression
 * @param expr - the expression to check
 * @param expectedVar - the expected free variable
 */
export function validateSubstitution(expr: Node, expectedVar: string): boolean {
	const free = expr.getFreeVars(); // e.g., returns ['x', 'y']
	return free.has(expectedVar);
}
