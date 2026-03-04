import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { Solution } from '../../src/lib/solver/Solution';
import { TheoremRegistry } from '../../src/lib/rules/TheoremRegistry';
import {
	addPremise,
	indirectSolving,
	logicMode,
	solverBackup,
	solverContent
} from '../../src/stores/solverStore';
import { editState, solving } from '../../src/stores/stateStore';
import {
	addTheorem,
	editTheorem,
	removeTheorem,
	saveTheorem,
	selectedTheorem,
	theoremRegistry,
	theorems
} from '../../src/stores/theoremsStore';
import { EditState } from '../../src/types/EditState';
import { ParseStrategy } from '../../src/types/ParseStrategy';

vi.mock('../../src/lib/rules/DeductionRule', () => ({
	DeductionRule: class {
		static rules = [];
	}
}));
vi.mock('../../src/lib/utils/showToast', () => ({
	showToast: vi.fn()
}));

import { showToast } from '../../src/lib/utils/showToast';

const showToastMock = vi.mocked(showToast);

describe('theoremsStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		theorems.reset();
		theoremRegistry.reset();
		solverContent.set(new Solution('Current'));
		solverBackup.set(new Solution('Backup'));
		selectedTheorem.set(-1);
		editState.set(EditState.SOLVER);
		solving.set(false);
		indirectSolving.set(false);
		logicMode.set(ParseStrategy.PREDICATE);
	});

	it('adds a theorem with current logic mode', () => {
		logicMode.set(ParseStrategy.PROPOSITIONAL);

		addTheorem();

		const items = get(theorems);
		expect(items).toHaveLength(1);
		expect(items[0].solution.name).toBe('Unnamed');
		expect(items[0].mode).toBe(ParseStrategy.PROPOSITIONAL);
	});

	it('does not save theorem when circular dependency is detected', () => {
		theoremRegistry.set({
			registerTheorem: vi.fn().mockReturnValue(false)
		} as unknown as TheoremRegistry);
		addTheorem();

		saveTheorem(0);

		expect(showToastMock).toHaveBeenCalledWith(
			'The theorem contains circular dependencies.',
			'error'
		);
		expect(get(theorems)[0].solution.name).toBe('Unnamed');
	});

	it('saves theorem and restores solver from backup', () => {
		theoremRegistry.set({
			registerTheorem: vi.fn().mockReturnValue(true)
		} as unknown as TheoremRegistry);
		addTheorem();

		const backup = new Solution('Restored');
		backup.indirect = true;
		solverBackup.set(backup);

		solverContent.update((sc) => {
			sc.name = '';
			sc.indirect = false;
			return sc;
		});

		saveTheorem(0);

		expect(get(theorems)[0].solution.name).toBe('Unnamed');
		expect(get(selectedTheorem)).toBe(-1);
		expect(get(editState)).toBe(EditState.SOLVER);
		expect(get(solving)).toBe(false);
		expect(get(solverContent).name).toBe('Restored');
		expect(get(indirectSolving)).toBe(true);
	});

	it('edits theorem and moves editor to theorem mode', () => {
		const current = new Solution('BeforeEdit');
		addPremise();
		solverContent.set(current);

		const theorem = new Solution('Thm');
		theorem.whole = { value: 'A -> A', tree: null };
		theorem.indirect = true;
		theorems.set([{ solution: theorem, mode: ParseStrategy.PREDICATE }]);

		editTheorem(0);

		expect(get(selectedTheorem)).toBe(0);
		expect(get(editState)).toBe(EditState.THEOREM);
		expect(get(solverContent).name).toBe('Thm');
		expect(get(indirectSolving)).toBe(true);
		expect(get(solving)).toBe(true);
		expect(get(solverBackup).name).toBe('BeforeEdit');
	});

	it('removes selected theorem and restores backup solution', () => {
		const backup = new Solution('BackupAfterRemove');
		solverBackup.set(backup);
		theorems.set([
			{ solution: new Solution('T0'), mode: ParseStrategy.PREDICATE },
			{ solution: new Solution('T1'), mode: ParseStrategy.PREDICATE },
			{ solution: new Solution('T2'), mode: ParseStrategy.PREDICATE }
		]);
		selectedTheorem.set(1);
		editState.set(EditState.THEOREM);

		removeTheorem(1);

		expect(get(theorems)).toHaveLength(2);
		expect(get(selectedTheorem)).toBe(-1);
		expect(get(solverContent).name).toBe('BackupAfterRemove');
		expect(get(editState)).toBe(EditState.SOLVER);
	});
});
