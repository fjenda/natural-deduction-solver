import { writable, get } from 'svelte/store';
import { solverContent } from './solverStore';
import type { TreeRuleType } from '../types/TreeRuleType';
import { ProofTable } from '../prolog/queries/ProofTable';
import { ArgsTable } from '../prolog/queries/ArgsTable';
import { cloneAppliedRule } from '../types/AppliedRule';
import { appliedRuleToPrologReplacements } from '../lib/solver/utils/appliedRuleUtils';

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
		rule: cloneAppliedRule(row.rule)
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
 * Rebuilds the Prolog proof_table and args_table from the current Svelte store.
 * Must be called after any operation that restores proof rows without going
 * through the normal addProof path (e.g. undo/redo).
 */
async function syncPrologFromStore(): Promise<void> {
	await ProofTable.clear();
	await ArgsTable.clear();

	const proof = get(solverContent).proof;

	for (const row of proof) {
		const term = row.tree?.toPrologFormat() ?? '';
		const rule = row.rule.rule;
		const lines = row.rule.lines ?? [];

		const replacements = appliedRuleToPrologReplacements(row.rule) ?? [];

		await ProofTable.write(term, rule, lines, replacements);
	}

	await ArgsTable.rebuild();
}

/**
 * Undoes the last proof action by restoring the most recent history snapshot.
 * The current proof rows are pushed onto the redo stack.
 * Premises and conclusion are never affected.
 */
export async function undo(): Promise<void> {
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

	// sync Prolog database to match restored state
	await syncPrologFromStore();

	updateFlags();
}

/**
 * Redoes the last undone proof action by restoring the most recent redo snapshot.
 * The current proof rows are pushed back onto the undo stack.
 */
export async function redo(): Promise<void> {
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

	// sync Prolog database to match restored state
	await syncPrologFromStore();

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
