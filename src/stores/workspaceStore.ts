import { writable, get } from 'svelte/store';
import { Solution } from '../lib/solver/Solution';
import { solverContent, indirectSolving } from './solverStore';
import { endSession, startSession } from './historyStore';
import { solving } from './stateStore';

/**
 * Represents a saved workspace containing a proof problem and its state.
 */
export interface Workspace {
	/** Unique identifier for the workspace */
	id: string;
	/** Display name shown in the tab */
	name: string;
	/** The solution state (premises, conclusion, proof rows) */
	solution: Solution;
	/** Whether this workspace was in solving mode when last saved */
	isSolving: boolean;
	/** Whether this workspace was using indirect proof */
	indirect: boolean;
}

/**
 * Counter for generating unique workspace IDs.
 */
let nextId = 1;

/**
 * Generates a unique workspace ID.
 * @returns A unique string ID.
 */
function generateId(): string {
	return `ws-${Date.now()}-${nextId++}`;
}

/**
 * Creates a deep clone of a Solution so workspaces have independent state.
 * @param source - the solution to clone
 * @returns A new Solution with copied data.
 */
function cloneSolution(source: Solution): Solution {
	const clone = new Solution(source.name);
	clone.premises = source.premises.map((p) => ({ value: p.value, tree: p.tree }));
	clone.conclusion = { value: source.conclusion.value, tree: source.conclusion.tree };
	clone.proof = source.proof.map((row) => ({
		line: row.line,
		value: row.value,
		tree: row.tree,
		rule: {
			rule: row.rule.rule,
			lines: row.rule.lines ? [...row.rule.lines] : [],
			replacements: row.rule.replacements ? [...row.rule.replacements] : []
		}
	}));
	clone.indirect = source.indirect;
	clone.contradiction = source.contradiction;
	clone.whole = { value: source.whole.value, tree: source.whole.tree };
	return clone;
}

/**
 * Generates a default name for a new workspace based on its content.
 * @param solution - the solution to derive a name from
 * @returns A display name string.
 */
function deriveName(solution: Solution): string {
	if (solution.name && solution.name !== 'Solution 1') return solution.name;
	const premises = solution.premises
		.filter((p) => p.value)
		.map((p) => p.value)
		.join(', ');
	const conclusion = solution.conclusion.value;
	if (premises && conclusion) return `${premises} ⊢ ${conclusion}`.slice(0, 40);
	if (conclusion) return `⊢ ${conclusion}`.slice(0, 40);
	return `Problem ${get(workspaces).length + 1}`;
}

/**
 * Store containing all open workspaces.
 */
export const workspaces = writable<Workspace[]>([]);

/**
 * Store tracking the index of the currently active workspace.
 */
export const activeWorkspaceIndex = writable<number>(0);

/**
 * Creates a new workspace from the current solver state.
 * Saves the current state to the active workspace first,
 * then creates a fresh blank workspace.
 */
export function createWorkspace(): void {
	// save current state into the active workspace
	saveCurrentWorkspace();

	const index = get(activeWorkspaceIndex);
	const currentSolution = get(solverContent);

	// derive a meaningful name for the current workspace
	const name = deriveName(currentSolution);

	workspaces.update((ws) => {
		// update the name of the current workspace
		if (ws[index]) {
			ws[index].name = name;
		}

		// create new blank workspace
		const newWs: Workspace = {
			id: generateId(),
			name: `Problem ${ws.length + 1}`,
			solution: new Solution('Problem ' + (ws.length + 1)),
			isSolving: false,
			indirect: false
		};

		return [...ws, newWs];
	});

	// switch to the new workspace
	const newIndex = get(workspaces).length - 1;
	activeWorkspaceIndex.set(newIndex);

	// load blank state into solver
	loadWorkspaceIntoSolver(get(workspaces)[newIndex]);
}

/**
 * Switches to a different workspace by index.
 * Saves the current workspace state, then loads the target workspace.
 * @param index - the index of the workspace to switch to
 */
export function switchWorkspace(index: number): void {
	const currentWsIndex = get(activeWorkspaceIndex);
	if (index === currentWsIndex) return;

	const wsList = get(workspaces);
	if (index < 0 || index >= wsList.length) return;

	// save current state into the active workspace
	saveCurrentWorkspace();

	// end current undo/redo session
	if (get(solving)) {
		endSession();
	}

	// update active index
	activeWorkspaceIndex.set(index);

	// load the target workspace
	loadWorkspaceIntoSolver(get(workspaces)[index]);
}

/**
 * Deletes a workspace by index.
 * Cannot delete the last remaining workspace.
 * If deleting the active workspace, switches to the adjacent workspace.
 * @param index - the index of the workspace to delete
 */
export function deleteWorkspace(index: number): void {
	const wsList = get(workspaces);
	if (wsList.length <= 1) return; // keep at least one workspace

	workspaces.update((ws) => {
		const updated = [...ws];
		updated.splice(index, 1);
		return updated;
	});

	const activeIndex = get(activeWorkspaceIndex);

	if (index === activeIndex) {
		// we deleted the active workspace, switch to adjacent one
		const newIndex = Math.min(index, get(workspaces).length - 1);
		activeWorkspaceIndex.set(newIndex);
		loadWorkspaceIntoSolver(get(workspaces)[newIndex]);
	} else if (index < activeIndex) {
		// deleted workspace was before active, shift index down
		activeWorkspaceIndex.set(activeIndex - 1);
	}
}

/**
 * Renames a workspace.
 * @param index - the index of the workspace to rename
 * @param name - the new name for the workspace
 */
export function renameWorkspace(index: number, name: string): void {
	workspaces.update((ws) => {
		const updated = [...ws];
		if (updated[index]) {
			updated[index] = { ...updated[index], name };
		}
		return updated;
	});
}

/**
 * Saves the current solver state into the active workspace.
 * Call this before switching away from a workspace.
 */
export function saveCurrentWorkspace(): void {
	const index = get(activeWorkspaceIndex);
	const solution = cloneSolution(get(solverContent));
	const isSolving = get(solving);
	const indirect = get(indirectSolving);

	workspaces.update((ws) => {
		if (ws[index]) {
			ws[index] = {
				...ws[index],
				solution,
				isSolving,
				indirect
			};
		}
		return ws;
	});
}

/**
 * Loads a workspace's state into the solver stores.
 * @param workspace - the workspace to load
 */
function loadWorkspaceIntoSolver(workspace: Workspace): void {
	solverContent.set(cloneSolution(workspace.solution));
	solving.set(workspace.isSolving);
	indirectSolving.set(workspace.indirect);

	// restart undo/redo session if the workspace was in solving mode
	if (workspace.isSolving) {
		startSession();
	}
}

/**
 * Initializes the workspace store with a single workspace from the current solver state.
 * Call this once on app startup.
 */
export function initializeWorkspaces(): void {
	const currentSolution = get(solverContent);
	const currentSolving = get(solving);
	const currentIndirect = get(indirectSolving);

	const initialWorkspace: Workspace = {
		id: generateId(),
		name: deriveName(currentSolution),
		solution: cloneSolution(currentSolution),
		isSolving: currentSolving,
		indirect: currentIndirect
	};

	workspaces.set([initialWorkspace]);
	activeWorkspaceIndex.set(0);
}

/**
 * Restores workspaces from persisted state.
 * @param persistedWorkspaces - the persisted workspace data
 */
export function restoreWorkspaces(persistedWorkspaces: Workspace[]): void {
	if (persistedWorkspaces.length === 0) {
		initializeWorkspaces();
		return;
	}

	workspaces.set(persistedWorkspaces);
	activeWorkspaceIndex.set(0);

	// load the first workspace into the solver
	loadWorkspaceIntoSolver(persistedWorkspaces[0]);
}
