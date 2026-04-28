import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/rules/DeductionRule', () => ({
	DeductionRule: class {
		static rules = [];
	}
}));

vi.mock('../../src/stores/historyStore', async () => {
	const actual = await vi.importActual<typeof import('../../src/stores/historyStore')>(
		'../../src/stores/historyStore'
	);

	return {
		...actual,
	clearPrologProofState: vi.fn().mockResolvedValue(undefined),
	syncPrologFromStore: vi.fn().mockResolvedValue(undefined)
	};
});

import { get } from 'svelte/store';
import { Solution } from '../../src/lib/solver/Solution';
import * as historyStore from '../../src/stores/historyStore';
import { editState, solving } from '../../src/stores/stateStore';
import { EditState } from '../../src/types/EditState';
import {
	activeWorkspaceIndex,
	switchWorkspace,
	workspaces,
	type Workspace
} from '../../src/stores/workspaceStore';
import {
	highlightedRows,
	indirectSolving,
	selectedRows,
	solverContent
} from '../../src/stores/solverStore';
import { lastHovered } from '../../src/stores/lastHoveredStore';

const clearPrologProofStateMock = vi.mocked(historyStore.clearPrologProofState);
const syncPrologFromStoreMock = vi.mocked(historyStore.syncPrologFromStore);

function createWorkspaceWithProof(name: string, isSolving: boolean): Workspace {
	const solution = new Solution(name);
	solution.proof = [
		{
			line: 1,
			value: 'A',
			tree: { toPrologFormat: () => 'const(a)' } as never,
			rule: { rule: 'PREM', lines: [], replacements: [] }
		},
		{
			line: 2,
			value: 'A ⊃ B',
			tree: { toPrologFormat: () => 'imp(const(a),const(b))' } as never,
			rule: { rule: 'PREM', lines: [], replacements: [] }
		}
	];

	return {
		id: name,
		name,
		solution,
		isSolving,
		indirect: false
	};
}

describe('workspaceStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		solverContent.set(new Solution('Current'));
		solving.set(false);
		indirectSolving.set(false);
		selectedRows.set([1, 2]);
		highlightedRows.set([2]);
		lastHovered.set({ rule: 'MP', selected: [1], rows: [2] });
		activeWorkspaceIndex.set(0);
		editState.set(EditState.SOLVER);

		workspaces.set([
			{
				id: 'current',
				name: 'Current',
				solution: new Solution('Current'),
				isSolving: false,
				indirect: false
			},
			createWorkspaceWithProof('Saved proof', true)
		]);
	});

	it('rebuilds Prolog proof state when switching back to a saved solving workspace', () => {
		switchWorkspace(1);

		expect(get(activeWorkspaceIndex)).toBe(1);
		expect(get(solverContent).name).toBe('Saved proof');
		expect(get(solving)).toBe(true);
		expect(syncPrologFromStoreMock).toHaveBeenCalledTimes(1);
		expect(clearPrologProofStateMock).not.toHaveBeenCalled();
		expect(get(selectedRows)).toEqual([]);
		expect(get(highlightedRows)).toEqual([]);
		expect(get(lastHovered)).toEqual({ rule: '', selected: [], rows: [] });
	});

	it('clears Prolog proof state when switching to a non-solving workspace', () => {
		activeWorkspaceIndex.set(1);
		solverContent.set(createWorkspaceWithProof('Saved proof', true).solution);
		solving.set(true);

		switchWorkspace(0);

		expect(get(activeWorkspaceIndex)).toBe(0);
		expect(get(solverContent).name).toBe('Current');
		expect(get(solving)).toBe(false);
		expect(clearPrologProofStateMock).toHaveBeenCalledTimes(1);
		expect(syncPrologFromStoreMock).not.toHaveBeenCalled();
	});
});



