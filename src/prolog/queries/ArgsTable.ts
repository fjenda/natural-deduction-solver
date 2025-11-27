import { PrologController } from '../PrologController';
import type { ArgsTableResult, PrologCompound } from '../../types/prolog/PrologResult';
import { compoundToString } from '../../types/prolog/Compound';
import { Node } from '../../lib/syntax-checker/Node';

const Queries = {
	WRITE: (term: string) => `args_table_extract_from_term_and_add(${term}).`,
	REMOVE: (term: string, argsCount: number, args: string[]) =>
		`args_table_remove(${term}, ${argsCount}, [${args.join(',')}]).`,
	GET: (term: string) => `args_table_extract_from_term_and_get(${term}, X).`,
	CONSTANT_EXISTS: (constant: string) => `args_table_constant_exists(${constant}).`,
	CLEAR: `args_table_clear.`,
	PRINT: `args_table_print.`,
	REBUILD: `args_table_rebuild.`
};

export const ArgsTable = {
	/**
	 * Writes the term to the args_table in Prolog
	 * @param term - the term to write
	 */
	async write(term: string) {
		await PrologController.queryOnce(Queries.WRITE(term));
	},

	/**
	 * Removes a row from the args_table in Prolog
	 * @param term - the term to remove
	 * @param argsCount - the number of arguments to remove
	 * @param args - the arguments to remove
	 */
	async remove(term: string, argsCount: number, args: string[]) {
		await PrologController.queryOnce(Queries.REMOVE(term, argsCount, args));
	},

	/**
	 * Rebuilds the args_table in Prolog
	 */
	async rebuild() {
		await PrologController.queryOnce(Queries.REBUILD);
	},

	/**
	 * Retrieves all rows from the args_table in Prolog
	 * @param term - the functor to filter by
	 */
	async getMatching(term: string) {
		const results = await PrologController.queryOnce<ArgsTableResult>(Queries.GET(term));

		if (!results) {
			console.warn(`No results found for get_matching(${term})`);
			return null;
		}

		// parse results into a map
		// const parsedMap = new Map<string, string[]>();
		//
		// results.X.forEach((r) => {
		// 	const key = compoundToString(PrologController.parsePrologCompound(r['0']));
		// 	const values = r['2'].map((arg: PrologCompound) =>
		// 		compoundToString(PrologController.parsePrologCompound(arg))
		// 	);
		// 	parsedMap.set(key, values);
		// });
		//
		// console.log(parsedMap);

		const parsed = results.X.map((r) => {
			return r['2'].map((arg: PrologCompound) =>
				Node.fromPrologFormat(compoundToString(PrologController.parsePrologCompound(arg)))
			);
		});

		// normalize into 1d array
		return Array.from(new Set(parsed.flat().map((n) => Node.generateString(n))));
	},

	/**
	 * Checks if a constant exists in the args_table in Prolog
	 * @param constant - the constant to check
	 */
	async constantExists(constant: string) {
		const results = await PrologController.queryOnce<{ exists: 'true' | 'false' }>(
			Queries.CONSTANT_EXISTS(constant)
		);

		return results?.exists === 'true';
	},

	/**
	 * Clears the args_table in Prolog
	 */
	async clear() {
		await PrologController.queryOnce(Queries.CLEAR);
	},

	/**
	 * Prints the args_table from Prolog
	 */
	async print() {
		await PrologController.queryOnce(Queries.PRINT);
	}
};
