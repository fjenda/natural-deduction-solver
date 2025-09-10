import { get, writable } from 'svelte/store';
import { Solution } from '../lib/solver/Solution';
import { indirectSolving, logicMode, solverBackup, solverContent } from './solverStore';
import { editState, solving } from './stateStore';
import { EditState } from '../types/EditState';
import { TheoremRegistry } from '../lib/rules/TheoremRegistry';
import { showToast } from '../lib/utils/showToast';
import { ParseStrategy } from '../types/ParseStrategy';

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
 * Saves a theorem to the theorem store.
 */
export const saveTheorem = (index: number): void => {
	// check for circular dependencies
	let isValid: boolean = true;
	theoremRegistry.update((registry) => {
		isValid = registry.registerTheorem(get(solverContent));
		return registry;
	});

	// if the theorem is not valid, show an error message
	if (!isValid) {
		showToast('The theorem contains circular dependencies.', 'error');
		return;
	}

	// save the new theorem to the theorems store
	theorems.update((theorems) => {
		// if the solver content name is empty, set it to "Unnamed Theorem"
		if (get(solverContent).name === '') {
			get(solverContent).name = 'Unnamed';
		}

		theorems[index] = { solution: get(solverContent), mode: get(logicMode) };
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
	solverBackup.set(get(solverContent));

	// set the solver content to the selected theorem
	solverContent.set(get(theorems)[index].solution);

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
