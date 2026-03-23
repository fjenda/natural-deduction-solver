import { writable, get } from 'svelte/store';
import { solverContent } from './solverStore';
import type { TreeRuleType } from '../types/TreeRuleType';

/**
 * Maximum number of undo steps to keep in memory per solution.
 */
const MAX_HISTORY_SIZE = 50;

/**
 * Internal history stacks.
 * Each entry is a snapshot of only the proof rows (not premises/conclusion).
 * `past` holds previous states (most recent last).
 * `future` holds states that were undone (most recent last).
 */
const past: TreeRuleType[][] = [];
const future: TreeRuleType[][] = [];

/**
 * Whether the solver is actively in a proof session.
 * When false, pushHistory is a no-op and undo/redo are disabled.
 */
const sessionActive = writable(false);

/**
 * Store indicating whether undo is available.
 */
export const canUndo = writable(false);

/**
 * Store indicating whether redo is available.
 */
export const canRedo = writable(false);

/**
 * Creates a deep snapshot of only the proof rows from the current solver content.
 * Premises and conclusion are intentionally excluded so they cannot be undone.
 * @returns A cloned array of TreeRuleType rows.
 */
function snapshotProofRows(): TreeRuleType[] {
	const sc = get(solverContent);
	return sc.proof.map((row) => ({
		line: row.line,
		value: row.value,
		tree: row.tree,
		rule: {
			rule: row.rule.rule,
			lines: row.rule.lines ? [...row.rule.lines] : [],
			replacements: row.rule.replacements ? [...row.rule.replacements] : []
		}
	}));
}

/**
 * Pushes the current proof rows onto the history stack before a modification.
 * Only works when a proof session is active.
 * Call this before any proof-modifying action.
 */
export function pushHistory(): void {
	if (!get(sessionActive)) return;

	const snapshot = snapshotProofRows();
	past.push(snapshot);

	// limit history size
	if (past.length > MAX_HISTORY_SIZE) {
		past.shift();
	}

	// any new action clears the redo stack
	future.length = 0;
	updateFlags();
}

/**
 * Undoes the last proof action by restoring the most recent history snapshot.
 * The current proof rows are pushed onto the redo stack.
 * Premises and conclusion are never affected.
 */
export function undo(): void {
	if (past.length === 0 || !get(sessionActive)) return;

	// save current proof for redo
	const current = snapshotProofRows();
	future.push(current);

	// restore previous proof rows
	const previousProof = past.pop()!;
	solverContent.update((sc) => {
		sc.proof = previousProof;
		return sc;
	});
	updateFlags();
}

/**
 * Redoes the last undone proof action by restoring the most recent redo snapshot.
 * The current proof rows are pushed back onto the undo stack.
 */
export function redo(): void {
	if (future.length === 0 || !get(sessionActive)) return;

	// save current proof for undo
	const current = snapshotProofRows();
	past.push(current);

	// restore next proof rows
	const nextProof = future.pop()!;
	solverContent.update((sc) => {
		sc.proof = nextProof;
		return sc;
	});
	updateFlags();
}

/**
 * Starts a new undo/redo session.
 * Clears all previous history and enables undo/redo for the active proof.
 */
export function startSession(): void {
	past.length = 0;
	future.length = 0;
	sessionActive.set(true);
	updateFlags();
}

/**
 * Ends the current undo/redo session.
 * Clears all history and disables undo/redo.
 * Call this when a solution is reset or completed.
 */
export function endSession(): void {
	past.length = 0;
	future.length = 0;
	sessionActive.set(false);
	updateFlags();
}

/**
 * Clears all history and redo stacks without changing session state.
 */
export function clearHistory(): void {
	past.length = 0;
	future.length = 0;
	updateFlags();
}

/**
 * Updates the reactive store flags based on stack sizes and session state.
 */
function updateFlags(): void {
	const active = get(sessionActive);
	canUndo.set(active && past.length > 0);
	canRedo.set(active && future.length > 0);
}
