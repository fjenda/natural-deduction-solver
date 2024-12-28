import {get, writable} from "svelte/store";
import type {Solution} from "../lib/solver/Solution";
import {solverBackup, solverContent} from "./solverStore";
import {editState} from "./stateStore";
import {EditState} from "../types/EditState";

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

export const selectedTheorem = writable<number>(-1);

export const saveTheorem = (index: number): void => {
    theorems.update((theorems: Solution[]) => {
        if (get(solverContent).name === "") {
            get(solverContent).name = "Unnamed Theorem";
        }

        theorems[index] = get(solverContent);
        return theorems;
    });

    selectedTheorem.set(-1);
    solverContent.set(get(solverBackup));
    editState.set(EditState.SOLVER);
}

export const editTheorem = (index: number): void => {
    solverBackup.set(get(solverContent));
    solverContent.set(get(theorems)[index]);
    selectedTheorem.set(index);
    editState.set(EditState.THEOREM);
}

export const removeTheorem = (index: number): void => {
    theorems.update(theorems => theorems.filter((_, i) => i !== index));

    if (index === get(selectedTheorem)) {
        selectedTheorem.set(-1);
        solverContent.set(get(solverBackup));
    }

    if (index < get(selectedTheorem)) {
        selectedTheorem.update(i => i - 1);
    }

    if (get(editState) === EditState.THEOREM) {
        editState.set(EditState.SOLVER);
    }
}