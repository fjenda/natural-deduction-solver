import type { IRule } from '../../lib/rules/IRule';
import { PrologController } from '../PrologController';
import type {
	ContradictionResult,
	ProveResult,
	SubstitutionResult
} from '../../types/prolog/PrologResult';
import { compoundToString } from '../../types/prolog/Compound';
import { get } from 'svelte/store';
import { solverContent } from '../../stores/solverStore';

const Queries = {
	PROVE_LINES: (premises: number[], rule: IRule, params: string[]) =>
		`prove([${premises.join(',')}], X, '${rule.short}', [${params.join(',')}]).`,
	PROVE: (premises: string[], rule: IRule, params: string[]) =>
		`prove_handler([${premises.join(',')}], X, '${rule.short}', [${params.join(',')}]).`,
	CONFLICT: (proofPFL: string[]) => `conflict_handler([${proofPFL}], X, Y, Z).`,
	SUBSTITUTE: (theoremPFL: string, oldVars: string[], newVars: string[]) =>
		`substitute(${theoremPFL}, [${oldVars.join(',')}], [${newVars.join(',')}], X).`
};

export const ProofHandler = {
	/**
	 * Proves a row using the given lines, rule, and parameters.
	 * @param lines - Array of line numbers to use for the proof
	 * @param rule - The rule to apply for the proof
	 * @param params - Array of parameters to use with the rule
	 */
	async proveLines(lines: number[], rule: IRule, params: string[]) {
		const results = await PrologController.queryAll<ProveResult>(
			Queries.PROVE_LINES(lines, rule, params)
		);

		return results.map((r) => compoundToString(PrologController.parsePrologCompound(r.X)));
	},

	/**
	 * Proves a row using the given premises, rule, and parameters.
	 * @param premises - Array of premises to use for the proof
	 * @param rule - The rule to apply for the proof
	 * @param params - Array of parameters to use with the rule
	 */
	async prove(premises: string[], rule: IRule, params: string[]) {
		const results = await PrologController.queryAll<ProveResult>(
			Queries.PROVE(premises, rule, params)
		);

		return results.map((r) => compoundToString(PrologController.parsePrologCompound(r.X)));
	},

	/**
	 * Checks if the current proof has a contradiction.
	 */
	async hasContradiction() {
		const proofPFL = get(solverContent).proof.map((p) => p.tree?.toPrologFormat() ?? '');

		const result = await PrologController.queryOnce<ContradictionResult>(
			Queries.CONFLICT(proofPFL)
		);

		if (!result) return false;

		if (typeof result.Z === 'string') {
			result.Z = result.Z === 'true';
		}

		return result.Z as boolean;
	},

	async substitute(theoremPFL: string, oldVars: string[], newVars: string[]) {
		const result = await PrologController.queryOnce<SubstitutionResult>(
			Queries.SUBSTITUTE(theoremPFL, oldVars, newVars)
		);

		if (!result) return '';

		return compoundToString(PrologController.parsePrologCompound(result.X));
	}
};
