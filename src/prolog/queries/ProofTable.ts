import { PrologController } from '../PrologController';
import type { BooleanResult, ProofTableResult } from '../../types/prolog/PrologResult';
import { compoundToString } from '../../types/prolog/Compound';

const Queries = {
	GET_ALL: `proof_table_get_all_rows(X).`,
	WRITE: (term: string, rule: string, lines: number[], replacements: string[] = []) =>
		`proof_table_add(${term}, '${rule}', [${lines.join(',')}], [${replacements.join(',')}]).`,
	REMOVE: (line: number) => `proof_table_remove(${line}).`,
	GET: (line: number) => `proof_table_get(${line}, X).`,
	CLEAR: `proof_table_clear.`,
	PRINT: `proof_table_print.`,
	CAN_DELETE_ROW: (line: number) => `proof_table_can_delete_row(${line}).`,
	EXISTENTIAL_ELIMINATION_VALID: `proof_table_existential_elimination_valid.`
};

export const ProofTable = {
	async getAll() {
		const result = await PrologController.queryOnce<ProofTableResult[]>(Queries.GET_ALL);

		return result?.map((r) => compoundToString(PrologController.parsePrologCompound(r.X)));
	},

	/**
	 * Writes a term to the proof_table in Prolog
	 * @param term - the term to write
	 * @param rule - the rule that was used to derive the term
	 * @param lines - the line numbers of the proof
	 * @param replacements - the replacements made in the proof (optional)
	 */
	async write(term: string, rule: string, lines: number[], replacements: string[] = []) {
		await PrologController.queryOnce(Queries.WRITE(term, rule, lines, replacements));
	},

	/**
	 * Removes a line from the proof_table in Prolog
	 * @param line - the line number to remove
	 */
	async remove(line: number) {
		await PrologController.queryOnce(Queries.REMOVE(line));
	},

	/**
	 * Retrieves a proof from the proof_table in Prolog
	 * @param line - the line number of the proof to retrieve
	 */
	async get(line: number) {
		const result = await PrologController.queryOnce<ProofTableResult>(Queries.GET(line));

		if (!result) {
			console.warn(`No proof found for line ${line}`);
			return null;
		}

		return compoundToString(PrologController.parsePrologCompound(result.X));
	},

	/**
	 * Clears the proof_table in Prolog
	 */
	async clear() {
		await PrologController.queryOnce(Queries.CLEAR);
	},

	/**
	 * Prints the proof_table from Prolog
	 */
	async print() {
		await PrologController.queryOnce(Queries.PRINT);
	},

	/**
	 * Checks if a row can be deleted from the proof_table in Prolog
	 * @param line - the line number to check
	 */
	async canDeleteRow(line: number) {
		const result = await PrologController.queryOnce<BooleanResult>(Queries.CAN_DELETE_ROW(line));
		if (!result) return false;

		return result.success;
	},

	/**
	 * Checks if the existential elimination rule is valid in the current proof_table
	 */
	async isExistentialEliminationValid() {
		const result = await PrologController.queryOnce<BooleanResult>(
			Queries.EXISTENTIAL_ELIMINATION_VALID
		);

		if (!result) return false;

		return result.success;
	}
};
