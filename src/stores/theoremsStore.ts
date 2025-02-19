import {get, writable} from "svelte/store";
import {Solution} from "../lib/solver/Solution";
import {solverBackup, solverContent} from "./solverStore";
import { editState, solving } from "./stateStore";
import {EditState} from "../types/EditState";

/**
 * The theorems store.
 * This store is used to store the theorems that the user has saved.
 */
export const theorems = function () {
    const {set, update, subscribe} = writable<Solution[]>([]);

    const reset = () => {
        set([]);
    }

    return {
        set,
        update,
        subscribe,
        reset,
    }
}();

/**
 * The selected theorem store.
 * This store is used to store the index of the theorem that the user has selected.
 */
export const selectedTheorem = writable<number>(-1);

/**
 * Adds a new theorem to the theorems store.
 */
export const addTheorem = (): void => {
    theorems.update((theorems: Solution[]) =>
       [...theorems, new Solution("Unnamed", {value: "", tree: null})]
    );
}

/**
 * Saves a theorem to the theorems store.
 */
export const saveTheorem = (index: number): void => {
    // save the new theorem to the theorems store
    theorems.update((theorems: Solution[]) => {
        // if the solver content name is empty, set it to "Unnamed Theorem"
        if (get(solverContent).name === "") {
            get(solverContent).name = "Unnamed";
        }

        theorems[index] = get(solverContent);
        return theorems;
    });

    // set the selected theorem index to -1
    selectedTheorem.set(-1);

    // reset the solver content to the solver backup
    solverContent.set(get(solverBackup));

    // change the edit state to solver
    editState.set(EditState.SOLVER);

    // hide the proof
    // solving.set(false);
}

/**
 * Edit a theorem from the theorems store.
 */
export const editTheorem = (index: number): void => {
    // save the current solver content to the solver backup
    solverBackup.set(get(solverContent));

    // set the solver content to the selected theorem
    solverContent.set(get(theorems)[index]);

    // set the selected theorem index
    selectedTheorem.set(index);

    // change the edit state to theorem
    editState.set(EditState.THEOREM);

    // show the proof if conclusion isn't empty
    // if (get(solverContent).conclusion.value !== "") {
    //     solving.set(true);
    // }
}

/**
 * Remove a theorem from the theorems store.
 */
export const removeTheorem = (index: number): void => {
    // remove the theorem
    theorems.update(theorems => theorems.filter((_, i) => i !== index));

    // if the theorem is selected, reset the solver content
    if (index === get(selectedTheorem)) {
        selectedTheorem.set(-1);
        solverContent.set(get(solverBackup));
    }

    // if the theorem is before the selected theorem, update the selected theorem index
    if (index < get(selectedTheorem)) {
        selectedTheorem.update(i => i - 1);
    }

    // change the edit state to solver
    if (get(editState) === EditState.THEOREM) {
        editState.set(EditState.SOLVER);
    }
}