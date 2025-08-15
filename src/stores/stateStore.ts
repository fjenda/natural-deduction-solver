import { writable } from 'svelte/store';
import { EditState } from '../types/EditState';

/**
 * Stores for the current state of the editor.
 */
export const editState = writable(EditState.SOLVER);

/**
 * Stores if the solver is currently in solving mode.
 */
export const solving = writable(false);
