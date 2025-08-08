import { get } from "svelte/store";
import { indirectSolving, solverContent } from "../../../stores/solverStore";
import { showToast } from "../../utils/showToast";
import { NDRule } from "../../rules/DeductionRule";
import { editState } from "../../../stores/stateStore";
import { EditState } from "../../../types/EditState";
import { FormulaComparer } from "../FormulaComparer";
import type { TreeRuleType } from "../../../types/TreeRuleType";
import type { Solution } from "../Solution";
import { Node } from "../../syntax-checker/Node";
import { addProof } from "../services/proofService";

/**
 * Returns a boolean indicating if the formula already exists in the proof
 * @param formula - the formula to check
 * @returns {boolean} true if the formula exists in the proof, false otherwise
 */
export function existsInProof(formula: TreeRuleType): boolean {
  return (
    get(solverContent).proof.findIndex((r) =>
      FormulaComparer.compare(r, formula),
    ) !== -1
  );
}

/**
 * Adds all the existing premises to the proof and checks if they are valid
 * @returns {boolean} true if all premises are valid, false otherwise
 */
async function initializeProof(): Promise<boolean> {
  // check if premises in proof are all valid
  const invalidPremise = get(solverContent).premises.some((p, i) => !p.tree);
  if (invalidPremise) {
    showToast("One or more premises are not valid", "error");
    return false;
  }

  // add the premises to the proof
  const premises = get(solverContent).premises.map((p) =>
    p.tree?.toPrologFormat(),
  );

  if (premises.some((p) => !p)) return false;
  await addProof(
    premises.filter((p): p is string => !!p),
    NDRule.PREM,
    [],
  );

  return true;
}

/**
 * Sets up the proof by adding the premises and the negated conclusion if we're solving indirectly
 * @returns {boolean} true if the proof was set up successfully, false otherwise
 */
export async function setupProof(): Promise<boolean> {
  if (!(await initializeProof())) return false;

  const isIndirect = get(indirectSolving);
  if (get(editState) === EditState.THEOREM) {
    // if any of the premises isn't valid
    if (!get(solverContent).premises.every((p) => p.tree)) {
      showToast("Failed to parse left side of the theorem", "error");
      return false;
    }

    solverContent.update((sc) => {
      sc.indirect = isIndirect;
      return sc;
    });

    if (isIndirect) {
      const right = get(solverContent).conclusion.tree;
      if (!right) {
        showToast("Failed to parse right side of the theorem", "error");
        return false;
      }

      const neg = right.negate();
      await addProof([neg.toPrologFormat()], NDRule.CONC, [], [], [neg]);
    }

    return true;
  }

  if (isIndirect) {
    // @ts-ignore
    const neg = get(solverContent).conclusion.tree.negate();
    await addProof([neg.toPrologFormat()], NDRule.CONC, [], [], [neg]);
  }

  return true;
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
  trees?: Node[] | null,
) {
  const replacementsString = replacements
    .map((r) => Node.fromPrologFormat(r).value)
    .filter((r): r is string => r !== undefined);

  solverContent.update((sc) => {
    results.forEach((r, i) => {
      // const tree = Node.fromPrologFormat(r ?? "");
      const tree = trees?.[i] ?? Node.fromPrologFormat(r ?? "");
      const tmp = {
        line: sc.proof.length + 1,
        tree: tree.simplify().parenthesize(),
        value: Node.generateString(tree),
        rule: { rule: rule, lines: lines, replacements: replacementsString },
      };

      if (!existsInProof(tmp)) {
        sc.proof.push(tmp);
      }
    });
    return sc;
  });
}
