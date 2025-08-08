import { PrologController } from "../PrologController";
import type { ProofTableResult } from "../../types/prolog/PrologResult";
import { compoundToString } from "../../types/prolog/Compound";

const Queries = {
  WRITE: (
    term: string,
    rule: string,
    lines: number[],
    replacements: string[] = [],
  ) =>
    `proof_table_add(${term}, '${rule}', [${lines.join(",")}], [${replacements.join(",")}]).`,
  REMOVE: (line: number) => `proof_table_remove(${line}).`,
  GET: (line: number) => `proof_table_get(${line}, X).`,
  CLEAR: `proof_table_clear.`,
  PRINT: `proof_table_print.`,
};

export const ProofTable = {
  /**
   * Writes a term to the proof_table in Prolog
   * @param term - the term to write
   * @param rule - the rule that was used to derive the term
   * @param lines - the line numbers of the proof
   * @param replacements - the replacements made in the proof (optional)
   */
  async write(
    term: string,
    rule: string,
    lines: number[],
    replacements: string[] = [],
  ) {
    (
      await PrologController.query(
        Queries.WRITE(term, rule, lines, replacements),
      )
    ).once();
  },

  /**
   * Removes a line from the proof_table in Prolog
   * @param line - the line number to remove
   */
  async remove(line: number) {
    (await PrologController.query(Queries.REMOVE(line))).once();
  },

  /**
   * Retrieves a proof from the proof_table in Prolog
   * @param line - the line number of the proof to retrieve
   */
  async get(line: number) {
    const result = (
      await PrologController.query(Queries.GET(line))
    ).once() as ProofTableResult;

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
    (await PrologController.query(Queries.CLEAR)).once();
  },

  /**
   * Prints the proof_table from Prolog
   */
  async print() {
    (await PrologController.query(Queries.PRINT)).once();
  },
};
