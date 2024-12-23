import {writable} from "svelte/store";
import {EditState} from "../types/EditState";

export const editState = writable(EditState.SOLVER);
