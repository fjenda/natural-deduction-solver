import {
  deductionRules,
  indirectSolving,
  logicMode,
  selectedRows,
  solverContent,
  theoremData,
} from "../../../stores/solverStore";
import { PremiseParser } from "../parsers/PremiseParser";
import { ParseStrategy } from "../../../types/ParseStrategy";
import { get } from "svelte/store";
import { DeductionRule } from "../../rules/DeductionRule";
import { modals } from "svelte-modals";
import FillVariablesModal from "../../modals/FillVariablesModal.svelte";
import { PrettySyntaxer } from "../parsers/PrettySyntaxer";
import { showToast } from "../../utils/showToast";
import { substitute } from "../services/proofService";
import { ProofTable } from "../../../prolog/queries/ProofTable";
import { ArgsTable } from "../../../prolog/queries/ArgsTable";
import { solving } from "../../../stores/stateStore";
import { ProofHandler } from "../../../prolog/queries/ProofHandler";

/**
 * Parses the premise and adds it to the solver content
 * @param value - the premise to parse
 * @param index - the index of the premise
 */
export function onChangePremise(value: string, index: number) {
  solverContent.update((sc) => {
    sc.premises[index] = PremiseParser.parsePremise(value);
    return sc;
  });
}

/**
 * Parses the conclusion and adds it to the solver content
 * @param value - the conclusion to parse
 */
export function onChangeConclusion(value: string) {
  solverContent.update((sc) => {
    sc.conclusion = PremiseParser.parsePremise(value);
    return sc;
  });
}

/**
 * Parses the theorem and adds it to the solver content
 * @param value - the theorem to parse
 */
export function onChangeTheorem(value: string) {
  solverContent.update((sc) => {
    sc.whole = PremiseParser.parsePremise(value);
    return sc;
  });
}

/**
 * Switches the mode between propositional and predicate logic
 */
export function switchMode() {
  logicMode.update((mode) =>
    mode === ParseStrategy.PROPOSITIONAL
      ? ParseStrategy.PREDICATE
      : ParseStrategy.PROPOSITIONAL,
  );
  deductionRules.set(DeductionRule.rules);
  get(solverContent).premises.forEach((premise, i) => {
    onChangePremise(premise.value, i);
  });
  onChangeConclusion(get(solverContent).conclusion.value);
}

export function fillVariables() {
  modals.open(FillVariablesModal, {
    title: "Fill Variables",
    onConfirm: () => {
      // get the lines selected
      const formulas = get(theoremData).varInputs.map((v) => {
        const formula = PremiseParser.parsePremise(PrettySyntaxer.clean(v));
        if (!formula.tree) {
          showToast("Invalid formula", "error");
          return "";
        }

        return formula.tree.toPrologFormat();
      });
      theoremData.update((td) => {
        td.varInputs = [];
        return td;
      });

      // replace the variables with the values
      substitute(get(theoremData), formulas);
    },
  });
}

/**
 * Resets the solving state
 */
export async function resetSolving() {
  selectedRows.set([]);
  solverContent.update((sc) => {
    sc.proof = [];
    return sc;
  });

  await ProofTable.clear();
  await ArgsTable.clear();
  solving.set(false);
}

export async function removeRow(index: number) {
  solverContent.update((content) => {
    content.proof.splice(index, 1);
    return content;
  });

  // remove from args table
  const row = await ProofTable.get(index + 1);
  // await // remove from proof table
  await ProofTable.remove(index + 1);
}

/**
 * Checks if the final proof is correct, updates store and shows toasts.
 */
export async function checkProof() {
  const contradiction = await ProofHandler.hasContradiction();
  const isIndirect = get(indirectSolving);

  if (contradiction) {
    if (isIndirect) {
      showToast("Proof contains a contradiction, it is correct", "success");
      solverContent.update((sc) => {
        sc.contradiction = true;
        return sc;
      });
      return;
    }

    showToast("Something went wrong, proof contains a contradiction", "error");
    return;
  }

  if (isIndirect) {
    showToast(
      "Proof does not contain a contradiction, it is incorrect",
      "error",
    );
    solverContent.update((sc) => {
      sc.contradiction = false;
      return sc;
    });
    return;
  }

  const exists = get(solverContent).complete;
  showToast(
    exists
      ? "Correct! Proof contains a valid row with the conclusion"
      : "Proof does not contain a valid row with the conclusion",
    exists ? "success" : "error",
  );
}
