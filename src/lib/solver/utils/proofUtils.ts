import { get } from 'svelte/store';
import { solverContent } from '../../../stores/solverStore';
import { showToast } from '../../utils/showToast';
import { FormulaComparer } from '../FormulaComparer';
import type { TreeRuleType } from '../../../types/TreeRuleType';
import { Node } from '../../syntax-checker/Node';
import { replacementFromProlog } from './appliedRuleUtils';

/**
 * Returns a boolean indicating if the formula already exists in the proof
 * @param formula - the formula to check
 * @returns {boolean} true if the formula exists in the proof, false otherwise
 */
export function existsInProof(formula: TreeRuleType): boolean {
	return get(solverContent).proof.findIndex((r) => FormulaComparer.compare(r, formula)) !== -1;
}

/**
 * Adds a proof to the solver content, checking if it already exists
 * @param results - the results to add
 * @param rule - the rule used
 * @param lines - the lines used
 * @param replacements - the replacements used (optional)
 * @param trees - the trees used (optional)
 */
export function addProofToStore(
	results: string[],
	rule: string,
	lines: number[] = [],
	replacements: string[] = [],
	trees?: Node[] | null
): string[] {
	const typedReplacements = replacements.map(replacementFromProlog);

	const acceptedResults: string[] = [];

	solverContent.update((sc) => {
		results.forEach((r, i) => {
			// use provided tree or parse from result
			const tree = trees?.[i] ?? Node.fromPrologFormat(r ?? '');

			const newRow = {
				line: sc.proof.length + 1,
				tree: tree.simplify().parenthesize(),
				value: Node.generateString(tree),
				rule: { rule, lines, replacements: typedReplacements }
			};

			if (!existsInProof(newRow)) {
				sc.proof.push(newRow);
				acceptedResults.push(r);
			} else {
				showToast('Formula already exists in the proof.', 'error');
			}
		});
		return sc;
	});

	return acceptedResults;
}
