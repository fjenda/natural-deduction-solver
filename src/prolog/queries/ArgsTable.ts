import { PrologController } from '../PrologController';
import type { ArgsTableResult, PrologCompound } from '../../types/prolog/PrologResult';
import { compoundToString } from '../../types/prolog/Compound';

const Queries = {
	WRITE: (term: string) => `args_table_extract_from_term_and_add(${term}).`,
	REMOVE: (term: string, argsCount: number, args: string[]) =>
		`args_table_remove(${term}, ${argsCount}, [${args.join(',')}]).`,
	GET: (functor: string, argsCount: number) => `args_table_get(${functor}, ${argsCount}, X).`,
	CLEAR: `args_table_clear.`,
	PRINT: `args_table_print.`
};

export const ArgsTable = {
	/**
	 * Writes the term to the args_table in Prolog
	 * @param term - the term to write
	 */
	async write(term: string) {
		(await PrologController.query(Queries.WRITE(term))).once();
	},

	/**
	 * Removes a row from the args_table in Prolog
	 * @param term - the term to remove
	 * @param argsCount - the number of arguments to remove
	 * @param args - the arguments to remove
	 */
	async remove(term: string, argsCount: number, args: string[]) {
		(await PrologController.query(Queries.REMOVE(term, argsCount, args))).once();
	},

	/**
	 * Retrieves all rows from the args_table in Prolog
	 * @param functor - the functor to filter by
	 * @param argsCount - the number of arguments to filter by
	 */
	async getMatching(functor: string, argsCount: number) {
		const results = (
			await PrologController.query(Queries.GET(functor, argsCount))
		).once() as ArgsTableResult;

		if (!results) {
			console.warn(`No results found for get_matching(${functor}, ${argsCount})`);
			return null;
		}

		// parse results into a more readable format
		const parsed = results.X.map((r) =>
			r['2'].map((arg: PrologCompound) =>
				compoundToString(PrologController.parsePrologCompound(arg))
			)
		);

		console.log(parsed);
		// return results.X ? results.X : null;
	},

	/**
	 * Clears the args_table in Prolog
	 */
	async clear() {
		(await PrologController.query(Queries.CLEAR)).once();
	},

	/**
	 * Prints the args_table from Prolog
	 */
	async print() {
		(await PrologController.query(Queries.PRINT)).once();
	}
};
