import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/rules/DeductionRule', () => ({
	DeductionRule: class {
		static rules = [];
	}
}));

vi.mock('../../src/lib/utils/showToast', () => ({
	showToast: vi.fn()
}));

import { get } from 'svelte/store';
import { Solution } from '../../src/lib/solver/Solution';
import { createPersistenceProvider } from '../../src/lib/context/persistenceProvider';
import {
	indirectSolving,
	logicMode,
	solverBackup,
	solverContent
} from '../../src/stores/solverStore';
import { EditState } from '../../src/types/EditState';
import { ParseStrategy } from '../../src/types/ParseStrategy';
import { editState, solving } from '../../src/stores/stateStore';
import { selectedTheorem, theoremRegistry, theorems } from '../../src/stores/theoremsStore';

const createMemoryStorage = () => {
	const state = new Map<string, string>();

	return {
		getItem(key: string): string | null {
			return state.has(key) ? state.get(key)! : null;
		},
		setItem(key: string, value: string): void {
			state.set(key, value);
		},
		removeItem(key: string): void {
			state.delete(key);
		}
	};
};

describe('persistenceProvider', () => {
	beforeEach(() => {
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

	it('persists solver and theorem changes to storage', () => {
		const storage = createMemoryStorage();
		const provider = createPersistenceProvider(storage);
		const stop = provider.start();

		solverContent.update((solution) => {
			solution.name = 'In progress';
			solution.premises = [{ value: 'A', tree: null }];
			solution.conclusion = { value: 'A', tree: null };
			solution.proof = [
				{
					line: 1,
					value: 'A',
					tree: null,
					rule: { rule: 'PREM', lines: [], replacements: [] }
				}
			];
			solution.indirect = true;
			return solution;
		});

		theorems.set([
			{
				solution: new Solution('Saved theorem', { value: 'B', tree: null }),
				mode: ParseStrategy.PROPOSITIONAL
			}
		]);
		logicMode.set(ParseStrategy.PROPOSITIONAL);

		const raw = storage.getItem('natural-deduction-solver:state:v1');
		expect(raw).toBeTruthy();
		expect(raw).toContain('In progress');
		expect(raw).toContain('Saved theorem');
		expect(raw).toContain('PROPOSITIONAL');
		expect(raw).toContain('"proof"');
		expect(raw).toContain('"PREM"');

		stop();
	});

	it('hydrates solver and theorem data from storage', () => {
		const storage = createMemoryStorage();
		storage.setItem(
			'natural-deduction-solver:state:v1',
			JSON.stringify({
				version: 1,
				logicMode: ParseStrategy.PROPOSITIONAL,
				indirectSolving: true,
				solver: {
					name: 'Draft',
					premises: ['A'],
					conclusion: 'A',
					whole: '',
					proof: [
						{ line: 1, value: 'A', rule: { rule: 'PREM', lines: [], replacements: [] } },
						{ line: 2, value: 'A', rule: { rule: 'MP', lines: [1], replacements: [] } },
						{ line: 3, value: 42, rule: { rule: 'PREM' } },
						{ line: 4, value: 'B', rule: { lines: [1] } }
					],
					indirect: true,
					contradiction: false
				},
				solverBackup: {
					name: 'Draft backup',
					premises: ['B'],
					conclusion: 'B',
					whole: '',
					indirect: false,
					contradiction: false
				},
				theorems: [
					{
						mode: ParseStrategy.PROPOSITIONAL,
						solution: {
							name: 'Theorem 1',
							premises: ['A'],
							conclusion: 'A',
							whole: 'A',
							indirect: false,
							contradiction: false
						}
					}
				]
			})
		);

		const provider = createPersistenceProvider(storage);
		const hydrated = provider.hydrate();

		expect(hydrated).toBe(true);
		expect(get(logicMode)).toBe(ParseStrategy.PROPOSITIONAL);
		expect(get(indirectSolving)).toBe(true);
		expect(get(solverContent).name).toBe('Draft');
		expect(get(solverContent).premises[0].value).toBe('A');
		expect(get(solverContent).proof).toHaveLength(2);
		expect(get(solverContent).proof[0].rule.rule).toBe('PREM');
		expect(get(solverContent).proof[0].tree).toBeTruthy();
		expect(get(solverContent).proof[1].rule.lines).toEqual([1]);
		expect(get(solverBackup).name).toBe('Draft backup');
		expect(get(theorems)).toHaveLength(1);
		expect(get(theorems)[0].solution.name).toBe('Theorem 1');
		expect(get(selectedTheorem)).toBe(-1);
		expect(get(editState)).toBe(EditState.SOLVER);
		expect(get(solving)).toBe(false);
	});

	it('clears persisted state', () => {
		const storage = createMemoryStorage();
		storage.setItem('natural-deduction-solver:state:v1', '{"version":1}');
		storage.removeItem('temporary');
		const provider = createPersistenceProvider(storage);

		provider.clear();

		expect(storage.getItem('natural-deduction-solver:state:v1')).toBeNull();
	});

	it('clears invalid payloads safely', () => {
		const storage = createMemoryStorage();
		storage.setItem('natural-deduction-solver:state:v1', '{bad-json}');
		const provider = createPersistenceProvider(storage);

		expect(provider.hydrate()).toBe(false);
		expect(storage.getItem('natural-deduction-solver:state:v1')).toBeNull();
	});
});
