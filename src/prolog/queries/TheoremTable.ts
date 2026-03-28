import { PrologController } from '../PrologController';
import type { TheoremTableResult, TheoremTableResults } from '../../types/prolog/PrologResult';
import type { ParseStrategy } from '../../types/ParseStrategy';

const Queries = {
	ADD: (theorem: string, mode: ParseStrategy) => `theorem_table_add('${theorem}', '${mode}').`,
	REMOVE: (theorem: string, mode: ParseStrategy) =>
		`theorem_table_remove('${theorem}', '${mode}').`,
	LOOKUP: (theorem: string, mode: ParseStrategy) =>
		`theorem_table_lookup('${theorem}', '${mode}', X).`,
	GET_ALL: (mode: ParseStrategy) => `theorem_table_get_all(X, '${mode}').`,
	CLEAR: `theorem_table_clear.`,
	PRINT: `theorem_table_print.`
};

export const TheoremTable = {
	/**
	 * Adds a theorem to the theorem_table in Prolog
	 * @param theorem - the name of the theorem to add
	 * @param mode - the parse strategy (PROPOSITIONAL or PREDICATE)
	 */
	async add(theorem: string, mode: ParseStrategy) {
		await PrologController.queryOnce(Queries.ADD(theorem, mode));
	},

	/**
	 * Removes a theorem from the theorem_table in Prolog
	 * @param theorem - the name of the theorem to remove
	 * @param mode - the parse strategy (PROPOSITIONAL or PREDICATE)
	 */
	async remove(theorem: string, mode: ParseStrategy) {
		await PrologController.queryOnce(Queries.REMOVE(theorem, mode));
	},

	/**
	 * Looks up a theorem in the theorem_table in Prolog
	 * @param theorem - the name of the theorem to look up
	 * @param mode - the parse strategy (PROPOSITIONAL or PREDICATE)
	 * @returns the theorem table result or null if not found
	 */
	async lookup(theorem: string, mode: ParseStrategy) {
		const result = await PrologController.queryOnce<TheoremTableResult>(
			Queries.LOOKUP(theorem, mode)
		);

		if (!result) {
			console.warn(`No theorem found for ${theorem}`);
			return null;
		}

		return result.X;
	},

	/**
	 * Retrieves all theorems from the theorem_table in Prolog for a given mode
	 * @param mode - the parse strategy (PROPOSITIONAL or PREDICATE)
	 * @returns the theorem table results or null if none found
	 */
	async getAll(mode: ParseStrategy) {
		const result = await PrologController.queryOnce<TheoremTableResults>(Queries.GET_ALL(mode));

		if (!result) {
			console.warn(`No theorems found`);
			return null;
		}

		return result.X;
	},

	/**
	 * Clears the theorem_table in Prolog
	 */
	async clear() {
		await PrologController.queryOnce(Queries.CLEAR);
	},

	/**
	 * Prints the theorem_table from Prolog
	 */
	async print() {
		await PrologController.queryOnce(Queries.PRINT);
	}
};
