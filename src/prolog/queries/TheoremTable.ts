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
	async add(theorem: string, mode: ParseStrategy) {
		await PrologController.queryOnce(Queries.ADD(theorem, mode));
	},

	async remove(theorem: string, mode: ParseStrategy) {
		await PrologController.queryOnce(Queries.REMOVE(theorem, mode));
	},

	async lookup(theorem: string, mode: ParseStrategy) {
		const result = await PrologController.queryOnce<TheoremTableResult>(
			Queries.LOOKUP(theorem, mode)
		);

		if (!result) {
			console.warn(`No theorem found for ${theorem}`);
			return null;
		}

		console.log(result.X);
		return result.X;
	},

	async getAll(mode: ParseStrategy) {
		const result = await PrologController.queryOnce<TheoremTableResults>(Queries.GET_ALL(mode));

		if (!result) {
			console.warn(`No theorems found`);
			return null;
		}

		console.log(result.X);
		return result.X;
	},

	async clear() {
		await PrologController.queryOnce(Queries.CLEAR);
	},

	async print() {
		await PrologController.queryOnce(Queries.PRINT);
	}
};
