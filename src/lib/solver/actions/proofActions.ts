import {
	deductionRules,
	indirectSolving,
	logicMode,
	selectedRows,
	solverContent,
	theoremData
} from '../../../stores/solverStore';
import { PremiseParser } from '../parsers/PremiseParser';
import { ParseStrategy } from '../../../types/ParseStrategy';
import { get } from 'svelte/store';
import { DeductionRule } from '../../rules/DeductionRule';
import { modals } from 'svelte-modals';
import FillVariablesModal from '../../modals/FillVariablesModal.svelte';
import { PrettySyntaxer } from '../parsers/PrettySyntaxer';
import { showToast } from '../../utils/showToast';
import {
	isExistentialEliminationValid,
	substitute,
	validateSubstitution
} from '../services/proofService';
import { ProofTable } from '../../../prolog/queries/ProofTable';
import { ArgsTable } from '../../../prolog/queries/ArgsTable';
import { editState, solving } from '../../../stores/stateStore';
import { ProofHandler } from '../../../prolog/queries/ProofHandler';
import { EditState } from '../../../types/EditState';
import { theorems } from '../../../stores/theoremsStore';

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
export async function switchMode(mode: ParseStrategy) {
	if (get(solving) && get(editState) === EditState.THEOREM) {
		showToast('Cannot change mode while solving', 'error');
		return;
	}

	logicMode.update(() => mode);
	deductionRules.set(DeductionRule.rules);
	get(solverContent).premises.forEach((premise, i) => {
		onChangePremise(premise.value, i);
	});
	onChangeConclusion(get(solverContent).conclusion.value);
	onChangeTheorem(get(solverContent).whole.value);
}

export function fillVariables() {
	modals.open(FillVariablesModal, {
		title: 'Fill Variables',
		onConfirm: () => {
			const theorem = get(theorems)[get(theoremData).theoremId].solution.whole.tree;
			if (!theorem) return showToast('Theorem is invalid', 'error');

			// console.log(get(theorems)[get(theoremData).theoremId]);

			// get the lines selected
			const vars = get(theoremData).vars;
			const varInputs = get(theoremData).varInputs;

			let unfulfilledDep = false;
			let badFormula = false;
			const formulas = vars.map((v, i) => {
				const theoremFormula = PremiseParser.parsePremise(PrettySyntaxer.clean(v.varName));
				const formula = PremiseParser.parsePremise(PrettySyntaxer.clean(varInputs[i]));

				// console.log(theoremFormula, formula);

				if (!formula.tree) {
					badFormula = true;
					showToast('Invalid formula', 'error');
					return '';
				}

				const dependencies = theoremFormula.tree!.getFreeVars();
				// console.log(dependencies, theoremFormula);
				if (dependencies.size > 0) {
					dependencies.forEach((d) => {
						if (!validateSubstitution(formula.tree!, d)) {
							showToast(`${formula.value} has unfulfilled dependency for ${d}`, 'error');
							unfulfilledDep = true;
						}
					});
				}

				// console.log(formula);
				return formula.tree.toPrologFormat();
			});

			if (formulas.some((f) => f === '')) {
				showToast('Please fill in all variables correctly', 'warning');
			}

			theoremData.update((td) => {
				td.varInputs = [];
				return td;
			});

			// console.log(formulas);

			// replace the variables with the values
			if (!unfulfilledDep && !badFormula) substitute(get(theoremData), formulas);
		}
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

	// remove from the proof table
	await ProofTable.remove(index + 1);
	await ArgsTable.rebuild();

	// await ArgsTable.print();
	// await ProofTable.print();
}

/**
 * Checks if the final proof is correct, updates the store and shows toasts.
 */
export async function checkProof() {
	const contradiction = await ProofHandler.hasContradiction();
	const isIndirect = get(indirectSolving);
	const isPredicateLogic = get(logicMode) === ParseStrategy.PREDICATE;

	// ProofTable.print();

	if (isPredicateLogic) {
		const validProof = await isExistentialEliminationValid();
		if (!validProof) {
			showToast('Proof contains an invalid use of Existential Elimination', 'error');
			return;
		}
	}

	if (contradiction) {
		if (isIndirect) {
			showToast('Proof contains a contradiction, it is correct', 'success');
			solverContent.update((sc) => {
				sc.contradiction = true;
				return sc;
			});
			return;
		}

		showToast('Something went wrong, proof contains a contradiction', 'error');
		return;
	}

	if (isIndirect) {
		showToast('Proof does not contain a contradiction, it is incorrect', 'error');
		solverContent.update((sc) => {
			sc.contradiction = false;
			return sc;
		});
		return;
	}

	const exists = get(solverContent).complete;
	showToast(
		exists
			? 'Correct! Proof contains a valid row with the conclusion'
			: 'Proof does not contain a valid row with the conclusion',
		exists ? 'success' : 'error'
	);
}
