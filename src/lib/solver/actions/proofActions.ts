import {
	deductionRules,
	indirectSolving,
	logicMode,
	selectedRows,
	solverContent,
	theoremData
} from '../../../stores/solverStore';
import { endSession, pushHistory } from '../../../stores/historyStore';
import { PremiseParser } from '../parsers/PremiseParser';
import { ParseStrategy } from '../../../types/ParseStrategy';
import { get } from 'svelte/store';
import { DeductionRule, NDRule } from '../../rules/DeductionRule';
import { modals } from 'svelte-modals';
import FillVariablesModal from '../../modals/FillVariablesModal.svelte';
import { PrettySyntaxer } from '../parsers/PrettySyntaxer';
import { showToast } from '../../utils/showToast';
import { addProof, substitute, validateSubstitution } from '../services/proofService';
import { ProofTable } from '../../../prolog/queries/ProofTable';
import { ArgsTable } from '../../../prolog/queries/ArgsTable';
import { editState, solving } from '../../../stores/stateStore';
import { ProofHandler } from '../../../prolog/queries/ProofHandler';
import { EditState } from '../../../types/EditState';
import { theorems } from '../../../stores/theoremsStore';
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
 * Resets the solving state.
 * Clears the proof and ends the undo/redo session so
 * no history carries over to the next solution.
 */
export async function resetSolving() {
	endSession();
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
	pushHistory();
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

/**
 * Checks if the final proof is correct, updates the store and shows toasts.
 */
export async function checkProof() {
	const contradiction = await ProofHandler.hasContradiction();
	const isIndirect = get(indirectSolving);

	// contradiction logic
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

/**
 * Loads a starter example into the solver.
 * Switches logic mode if needed, sets premises and conclusion,
 * and re-parses all expressions.
 * @param example - the starter example to load
 */
export function loadExample(example: {
	name: string;
	premises: string[];
	conclusion: string;
	mode: ParseStrategy;
}) {
	// switch logic mode if needed
	if (get(logicMode) !== example.mode) {
		switchMode(example.mode);
	}

	// update solver content
	solverContent.update((sc) => {
		sc.name = example.name;
		sc.premises = example.premises.map((p) => ({ value: p, tree: null }));
		sc.conclusion = { value: example.conclusion, tree: null };
		sc.proof = [];
		sc.indirect = false;
		sc.contradiction = false;
		sc.whole = { value: '', tree: null };
		return sc;
	});

	// re-parse all premises and conclusion
	example.premises.forEach((premise, index) => {
		onChangePremise(premise, index);
	});
	onChangeConclusion(example.conclusion);
}
