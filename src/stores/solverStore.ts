import {writable} from "svelte/store";
import {Solution} from "../lib/solver/Solution";
import type {TreeRuleType} from "../types/TreeRuleType";

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

export const addPremise = () => {
    solverContent.update(content => {
        content.premises = [...content.premises, ""];
        return content;
    });
}

export const removePremise = (index: number) => {
    solverContent.update(content => {
        content.premises.splice(index, 1);
        return content;
    });
}

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

export const highlightedRows = writable<number[]>([]);

export const parsedProof = writable<TreeRuleType[]>([]);
export const selectedRow = writable<number>(-1);