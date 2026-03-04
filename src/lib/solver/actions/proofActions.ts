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
import { DeductionRule, NDRule } from '../../rules/DeductionRule';
import { modals } from 'svelte-modals';
import FillVariablesModal from '../../modals/FillVariablesModal.svelte';
import { PrettySyntaxer } from '../parsers/PrettySyntaxer';
import { showToast } from '../../utils/showToast';
import {
	addProof,
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
import { isIn } from 'eslint-plugin-svelte/lib/utils/ast-utils';

// --- State Setters ---

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
 * @param mode - the mode to switch to
 */
export async function switchMode(mode: ParseStrategy) {
	if (get(solving) && get(editState) === EditState.THEOREM) {
		showToast('Cannot change mode while solving', 'error');
		return;
	}

	logicMode.set(mode);
	deductionRules.set(DeductionRule.rules);

	// refresh content parsing
	const sc = get(solverContent);
	sc.premises.forEach((p, i) => onChangePremise(p.value, i));
	onChangeConclusion(sc.conclusion.value);
	onChangeTheorem(sc.whole.value);
}

// --- Initialization / Orchestration ---

/**
 * Adds all the existing premises to the proof and checks if they are valid
 * @returns {boolean} true if all premises are valid, false otherwise
 */
export async function initializeProof(): Promise<boolean> {
	// check if premises in proof are all valid
	const invalidPremise = get(solverContent).premises.some((p) => !p.tree);
	if (invalidPremise) {
		showToast('One or more premises are not valid', 'error');
		return false;
	}

	// add the premises to the proof
	const premises = get(solverContent).premises.map((p) => p.tree?.toPrologFormat());

	if (premises.some((p) => !p)) return false;
	await addProof(
		premises.filter((p): p is string => !!p),
		NDRule.PREM,
		[]
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
	const content = get(solverContent);

	// case: Theorem Mode
	if (get(editState) === EditState.THEOREM) {
		if (!content.premises.every((p) => p.tree)) {
			showToast('Failed to parse left side of the theorem', 'error');
			return false;
		}

		solverContent.update((sc) => {
			sc.indirect = isIndirect;
			return sc;
		});

		if (isIndirect) {
			const right = content.conclusion.tree;
			if (!right) {
				showToast('Failed to parse right side of the theorem', 'error');
				return false;
			}
			const neg = right.negate();
			await addProof([neg.toPrologFormat()], NDRule.CONC, [], [], [neg]);
		}
		return true;
	}

	// case: Standard Mode
	if (isIndirect && content.conclusion.tree) {
		const neg = content.conclusion.tree.negate();
		await addProof([neg.toPrologFormat()], NDRule.CONC, [], [], [neg]);
	}
	return true;
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

/**
 * Removes a row from the proof at the given index
 * @param index - the index of the row to remove
 */
export async function removeRow(index: number) {
	solverContent.update((sc) => {
		sc.proof.splice(index, 1);
		return sc;
	});

	// remove from the proof table
	await ProofTable.remove(index + 1);
	await ArgsTable.rebuild();

	// await ArgsTable.print();
	// await ProofTable.print();
}

// --- Complex Action Logic ---

/**
 * Opens the fill variables modal and handles the variable substitution
 */
export function fillVariables() {
	modals.open(FillVariablesModal, {
		title: 'Fill Variables',
		onConfirm: () => handleFillVariablesConfirm()
	});
}

/**
 * Handles the confirm action in the fill variables modal
 */
function handleFillVariablesConfirm() {
	const td = get(theoremData);
	const theorem = get(theorems)[td.theoremId].solution.whole.tree;
	if (!theorem) return showToast('Theorem is invalid', 'error');

	const formulas: string[] = [];
	let hasErrors = false;

	// Validate all inputs
	td.vars.forEach((v, i) => {
		// if (hasErrors) return;

		const res = validateVariableInput(v.varName, td.varInputs[i]);
		if (!res.valid) {
			showToast(res.error!, 'error');
			hasErrors = true;
			return;
		}
		formulas.push(res.prolog!);
	});

	if (hasErrors) return;
	if (formulas.some((f) => f === '')) return showToast('Please fill in all variables', 'warning');

	// Success
	theoremData.update((d) => ({ ...d, varInputs: [] }));

	if (hasErrors) return;
	substitute(get(theoremData), formulas);
}

/**
 * Helper function for handleFillVariablesConfirm - validates variable input
 * @param varName - name of the variable
 * @param inputVal - value of the variable
 */
function validateVariableInput(
	varName: string,
	inputVal: string
): { valid: boolean; error?: string; prolog?: string } {
	const theoremFormula = PremiseParser.parsePremise(PrettySyntaxer.clean(varName));
	const formula = PremiseParser.parsePremise(PrettySyntaxer.clean(inputVal));

	if (!formula.tree) return { valid: false, error: 'Invalid formula' };

	const dependencies = theoremFormula.tree!.getFreeVars();
	for (const d of dependencies) {
		if (!validateSubstitution(formula.tree, d)) {
			return { valid: false, error: `${formula.value} has unfulfilled dependency for ${d}` };
		}
	}

	return { valid: true, prolog: formula.tree.toPrologFormat() };
}

// /**
//  * Opens the fill variables modal and handles the variable substitution
//  */
// export function fillVariables() {
// 	modals.open(FillVariablesModal, {
// 		title: 'Fill Variables',
// 		onConfirm: () => {
// 			const theorem = get(theorems)[get(theoremData).theoremId].solution.whole.tree;
// 			if (!theorem) return showToast('Theorem is invalid', 'error');
//
// 			// console.log(get(theorems)[get(theoremData).theoremId]);
//
// 			// get the lines selected
// 			const vars = get(theoremData).vars;
// 			const varInputs = get(theoremData).varInputs;
//
// 			let unfulfilledDep = false;
// 			let badFormula = false;
// 			const formulas = vars.map((v, i) => {
// 				const theoremFormula = PremiseParser.parsePremise(PrettySyntaxer.clean(v.varName));
// 				const formula = PremiseParser.parsePremise(PrettySyntaxer.clean(varInputs[i]));
//
// 				// console.log(theoremFormula, formula);
//
// 				if (!formula.tree) {
// 					badFormula = true;
// 					showToast('Invalid formula', 'error');
// 					return '';
// 				}
//
// 				const dependencies = theoremFormula.tree!.getFreeVars();
// 				// console.log(dependencies, theoremFormula);
// 				if (dependencies.size > 0) {
// 					dependencies.forEach((d) => {
// 						if (!validateSubstitution(formula.tree!, d)) {
// 							showToast(`${formula.value} has unfulfilled dependency for ${d}`, 'error');
// 							unfulfilledDep = true;
// 						}
// 					});
// 				}
//
// 				// console.log(formula);
// 				return formula.tree.toPrologFormat();
// 			});
//
// 			if (formulas.some((f) => f === '')) {
// 				showToast('Please fill in all variables correctly', 'warning');
// 			}
//
// 			theoremData.update((td) => {
// 				td.varInputs = [];
// 				return td;
// 			});
//
// 			// console.log(formulas);
//
// 			// replace the variables with the values
// 			if (!unfulfilledDep && !badFormula) substitute(get(theoremData), formulas);
// 		}
// 	});
// }

/**
 * Checks if the final proof is correct, updates the store and shows toasts.
 */
export async function checkProof() {
	const contradiction = await ProofHandler.hasContradiction();
	const isIndirect = get(indirectSolving);

	// TODO: Check if this is needed?
	// 1. predicate logic check
	// if (get(logicMode) === ParseStrategy.PREDICATE) {
	// 	if (!(await isExistentialEliminationValid())) {
	// 		showToast('Proof contains an invalid use of Existential Elimination', 'error');
	// 		return;
	// 	}
	// }

	// 2. contradiction logic
	if (contradiction) {
		if (isIndirect) {
			showToast('Proof contains a contradiction, it is correct', 'success');
			solverContent.update((sc) => {
				sc.contradiction = true;
				return sc;
			});
		} else {
			showToast('Something went wrong, proof contains a contradiction', 'error');
		}
		return;
	}

	// 3. indirect failure
	if (isIndirect) {
		showToast('Proof does not contain a contradiction, it is incorrect', 'error');
		solverContent.update((sc) => {
			sc.contradiction = false;
			return sc;
		});
		return;
	}

	// 4. standard success/fail
	const exists = get(solverContent).complete;
	showToast(
		exists
			? 'Correct! Proof contains a valid row with the conclusion'
			: 'Proof does not contain a valid row with the conclusion',
		exists ? 'success' : 'error'
	);
}
