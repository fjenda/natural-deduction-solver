import {writable} from "svelte/store";
import {Solution} from "../lib/solver/Solution";


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