import {writable} from "svelte/store";
import type {Solution} from "../lib/solver/Solution";

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