import { get, writable } from 'svelte/store';
import { Solution } from '../lib/solver/Solution';
import { indirectSolving, logicMode, solverBackup, solverContent } from './solverStore';
import { editState, solving } from './stateStore';
import { EditState } from '../types/EditState';
import { TheoremRegistry } from '../lib/rules/TheoremRegistry';
import { showToast } from '../lib/utils/showToast';
import { ParseStrategy } from '../types/ParseStrategy';
import type { ParsedExpression } from '../types/ParsedExpression';
import type { TreeRuleType } from '../types/TreeRuleType';
import { cloneAppliedRule } from '../types/AppliedRule';

/**
 * The theorems store.
 * This store is used to store the theorems that the user has saved.
 */
export const theorems = (function () {
	const { set, update, subscribe } = writable<{ solution: Solution; mode: ParseStrategy }[]>([]);

	const reset = () => {
		set([]);
	};

	return {
		set,
		update,
		subscribe,
		reset
	};
})();

/**
 * The TheoremRegistry store.
 * This store is used to store the theorems that the user has saved in a graph-like structure.
 * It's used to detect circular dependencies in the theorem proofs.
 */
export const theoremRegistry = (function () {
	const { set, update, subscribe } = writable<TheoremRegistry>(new TheoremRegistry());

	const reset = () => {
		set(new TheoremRegistry());
	};

	return {
		set,
		update,
		subscribe,
		reset
	};
})();

/**
 * The selected theorem store.
 * This store is used to store the index of the theorem that the user has selected.
 */
export const selectedTheorem = writable<number>(-1);

/**
 * Adds a new theorem to the theorems store.
 */
export const addTheorem = (): void => {
	theorems.update((theorems) => [
		...theorems,
		{ solution: new Solution('Unnamed', { value: '', tree: null }), mode: get(logicMode) }
	]);
};

/**
 * Creates a new theorem and immediately opens it in theorem edit mode.
 */
export const createTheorem = (): void => {
	const newIndex = get(theorems).length;
	addTheorem();
	editTheorem(newIndex);
};

function cloneParsedExpression(expr: ParsedExpression): ParsedExpression {
	return { value: expr.value, tree: expr.tree };
}

function cloneProof(proof: TreeRuleType[]): TreeRuleType[] {
	return proof.map((row) => ({
		line: row.line,
		value: row.value,
		tree: row.tree,
		rule: cloneAppliedRule(row.rule)
	}));
}

function cloneSolution(solution: Solution): Solution {
	const cloned = new Solution(solution.name);
	cloned.premises = solution.premises.map((premise) => cloneParsedExpression(premise));
	cloned.conclusion = cloneParsedExpression(solution.conclusion);
	cloned.proof = cloneProof(solution.proof);
	cloned.indirect = solution.indirect;
	cloned.contradiction = solution.contradiction;
	cloned.whole = cloneParsedExpression(solution.whole);
	return cloned;
}

function prepareTheoremForSave(previous: Solution | undefined, draft: Solution): Solution {
	const prepared = cloneSolution(draft);
	const isInitialPlaceholder =
		!!previous &&
		previous.whole.value.trim() === '' &&
		previous.proof.length === 0 &&
		!previous.contradiction;
	const changedWhole = previous ? previous.whole.value !== prepared.whole.value : false;

	// keep solved proof when first saving over the default empty theorem slot.
	if (changedWhole && !isInitialPlaceholder) {
		prepared.proof = [];
		prepared.contradiction = false;
	}

	if (prepared.name.trim() === '') {
		prepared.name = 'Unnamed';
	}

	return prepared;
}

/**
 * Saves a theorem to the theorem store.
 */
export const saveTheorem = (index: number): void => {
	const previous = get(theorems)[index]?.solution;
	const prepared = prepareTheoremForSave(previous, get(solverContent));

	// check for circular dependencies
	let isValid: boolean = true;
	theoremRegistry.update((registry) => {
		isValid = registry.registerTheorem(prepared);
		return registry;
	});

	// if the theorem is not valid, show an error message
	if (!isValid) {
		showToast('The theorem contains circular dependencies.', 'error');
		return;
	}

	// check the theorem elements to determine if it can be used in propositional logic

	// save the new theorem to the theorems store
	theorems.update((theorems) => {
		theorems[index] = {
			solution: prepared,
			mode: prepared.whole.tree?.logicMode || get(logicMode)
		};
		return theorems;
	});

	// set the selected theorem index to -1
	selectedTheorem.set(-1);

	// reset the solver content to the solver backup
	solverContent.set(get(solverBackup));

	// change the edit state to solver
	editState.set(EditState.SOLVER);

	// indirect solving
	indirectSolving.set(get(solverContent).indirect);

	// hide the proof
	solving.set(false);
};

/**
 * Edit a theorem from the theorem store.
 */
export const editTheorem = (index: number): void => {
	// save the current solver content to the solver backup
	solverBackup.set(cloneSolution(get(solverContent)));

	// set the solver content to the selected theorem
	solverContent.set(cloneSolution(get(theorems)[index].solution));

	// set the selected theorem index
	selectedTheorem.set(index);

	// change the edit state to theorem
	editState.set(EditState.THEOREM);

	// indirect solving
	indirectSolving.set(get(solverContent).indirect);

	// show the proof if the conclusion isn't empty
	solving.set(get(solverContent).whole.value.length !== 0);
};

/**
 * Remove a theorem from the theorems store.
 */
export const removeTheorem = (index: number): void => {
	// remove the theorem
	theorems.update((theorems) => theorems.filter((_, i) => i !== index));

	// if the theorem is selected, reset the solver content
	if (index === get(selectedTheorem)) {
		selectedTheorem.set(-1);
		solverContent.set(get(solverBackup));
	}

	// if the theorem is before the selected theorem, update the selected theorem index
	if (index < get(selectedTheorem)) {
		selectedTheorem.update((i) => i - 1);
	}

	// change the edit state to solver
	if (get(editState) === EditState.THEOREM) {
		editState.set(EditState.SOLVER);
	}
};
