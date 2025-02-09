import { writable } from "svelte/store";
import { Solution } from "../lib/solver/Solution";
import { ParseStrategy } from "../types/ParseStrategy";
import { DeductionRule } from "../lib/solver/parsers/DeductionRules";

/**
 * Store for the logic mode
 */
export const logicMode = writable<ParseStrategy>(ParseStrategy.PROPOSITIONAL);

/**
 * Store that contains the deduction rules based on the logic mode
 */
export const deductionRules = writable<DeductionRule[]>([]);

/**
 * Store for the content of the solver
 * This store contains the solution that is displayed in the solver
 */
export const solverContent = function () {
    const {set, update, subscribe} = writable<Solution>(new Solution("Solution 1"));

    const reset = () => {
        set(new Solution("Solution 1"));
    }

    return {
        set,
        update,
        subscribe,
        reset,
    }
}();

/**
 * Add a premise to the solver
 */
export const addPremise = () => {
    solverContent.update(content => {
        content.premises = [...content.premises, { value: "", tree: null }];
        return content;
    });
}

/**
 * Remove a premise from the solver
 * @param index - the index of the premise to remove
 */
export const removePremise = (index: number) => {
    solverContent.update(content => {
        content.premises.splice(index, 1);
        return content;
    });
}

/**
 * Store for the backup solution
 * This store contains the solution that was last displayed in the solver
 * This is used to restore the solution after the user has made changes
 */
export const solverBackup = function () {
    const {set, update, subscribe} = writable<Solution>(new Solution("Backup Solution"));

    const reset = () => {
        set(new Solution("Backup Solution"));
    }

    return {
        set,
        update,
        subscribe,
        reset,
    }
}();

/**
 * Store that contains the rows that are applicable for the hovered rule
 */
export const highlightedRows = writable<number[]>([]);

/**
 * Store that contains the rows that are selected by the user
 */
export const selectedRows = writable<number[]>([]);