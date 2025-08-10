import type { IRule } from "../../rules/IRule";
import { ProofHandler } from "../../../prolog/queries/ProofHandler";
import { get } from "svelte/store";
import { solverContent } from "../../../stores/solverStore";
import type { TheoremData } from "../../../types/TheoremData";
import { theorems } from "../../../stores/theoremsStore";
import { Node } from "../../syntax-checker/Node";
import { ProofTable } from "../../../prolog/queries/ProofTable";
import { ArgsTable } from "../../../prolog/queries/ArgsTable";
import { addProofToStore } from "../utils/proofUtils";
import { showToast } from "../../utils/showToast";

/**
 * Proves the selected row the user selected using the Prolog engine
 * @param premises - the premises used from the proof
 * @param rule - the rule used
 * @param selected - the selected row
 * @param params - the parameters used
 */
export async function proveProlog(
  premises: string[],
  rule: IRule,
  selected: number[],
  params: string[],
) {
  // get results
  const resultsPFL: string[] = await ProofHandler.prove(premises, rule, params);

  // no results
  if (resultsPFL.length === 0) {
    if (rule.short === "IU") {
      showToast("Universal Introduction not applicable", "error");
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
 * @param result - the result to verify
 */
export async function verifyProlog(
  premises: string[],
  rule: IRule,
  result: Node,
) {
  // get results
  const resultsPFL: string[] = await ProofHandler.prove(premises, rule, []);

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
  row: number,
): Promise<{ highlighted: number[]; applicable: boolean }> {
  const proof = get(solverContent).proof;
  const selected: string = proof[row - 1].tree?.toPrologFormat() ?? "";
  const indices: number[] = [];

  if (rule.inputSize === 1) {
    return { applicable: true, highlighted: [] };
  }

  for (const r of proof) {
    const i = proof.indexOf(r);
    if (i === row - 1) continue;

    const other: string = r.tree?.toPrologFormat() ?? "";
    const results = await ProofHandler.prove([selected, other], rule, []);
    if (results.length === 0) continue;

    indices.push(r.line);
  }

  return { applicable: !!indices.length, highlighted: indices };
}

/**
 * Substitutes the theorem variables with the user's input using the Prolog engine
 * @param theoremData - the theorem data
 * @param newVars - the new variables to be added
 */
export async function substitute(theoremData: TheoremData, newVars: string[]) {
  const theorem = get(theorems)[theoremData.theoremId];
  const theoremPFL = theorem.whole.tree?.toPrologFormat() ?? "";
  const parsed = await ProofHandler.substitute(
    theoremPFL,
    Array.from(theoremData.vars),
    newVars,
  );

  await addProof([parsed], theorem.name, []);
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
  trees?: Node[] | null,
) {
  addProofToStore(results, rule, lines, replacements, trees);

  for (const r of results) {
    await ProofTable.write(r, rule, lines, replacements);
    await ArgsTable.write(r);
  }

  await ProofTable.print();
  await ArgsTable.print();
  await ArgsTable.getMatching("predicate(p)", 1);
}
