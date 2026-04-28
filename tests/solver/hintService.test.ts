import { beforeEach, describe, expect, it } from 'vitest';
import { Node } from '../../src/lib/syntax-checker/Node';
import { getHintRules, getTextHint } from '../../src/lib/solver/services/hintService';
import { solverContent, selectedRows } from '../../src/stores/solverStore';

function makeRow(line: number, formula: string, rule = 'PREM') {
	const tree = Node.fromPrologFormat(formula);
	return {
		line,
		value: Node.generateString(Node.fromPrologFormat(formula)),
		tree,
		rule: { rule, lines: [], replacements: [] }
	};
}

describe('hintService', () => {
	beforeEach(() => {
		selectedRows.set([]);
		solverContent.set({
			name: 'Hint test',
			premises: [],
			conclusion: {
				value: '',
				tree: null
			},
			proof: [],
			indirect: false,
			contradiction: false,
			whole: { value: '', tree: null }
		} as never);
	});

	it('prefers conjunction introduction when both conjuncts already exist', async () => {
		solverContent.update((solution) => {
			solution.conclusion = {
				value: 'P ∧ Q',
				tree: Node.fromPrologFormat('and(predicate(p), predicate(q))')
			};
			solution.proof = [
				makeRow(1, 'predicate(p)'),
				makeRow(2, 'predicate(q)')
			];
			return solution;
		});

		const hints = await getHintRules();

		expect(hints[0]?.rule.short).toBe('IC');
		expect(hints[0]?.applicableRows).toEqual([1, 2]);
		expect(hints[0]?.message).toContain('IC');
	});

	it('suggests modus ponens when implication and antecedent derive the goal', async () => {
		solverContent.update((solution) => {
			solution.conclusion = {
				value: 'Q',
				tree: Node.fromPrologFormat('predicate(q)')
			};
			solution.proof = [
				makeRow(1, 'imp(predicate(p), predicate(q))'),
				makeRow(2, 'predicate(p)')
			];
			return solution;
		});

		const hints = await getHintRules();

		expect(hints.some((hint) => hint.rule.short === 'MP')).toBe(true);
		expect(await getTextHint()).toContain('goal');
	});

	it('gives a strategy hint for implication goals when only the consequent exists', async () => {
		solverContent.update((solution) => {
			solution.conclusion = {
				value: 'P ⊃ Q',
				tree: Node.fromPrologFormat('imp(predicate(p), predicate(q))')
			};
			solution.proof = [makeRow(1, 'predicate(q)')];
			return solution;
		});

		const hints = await getHintRules();

		expect(hints[0]?.rule.short).toBe('II');
		expect(hints[0]?.message).toContain('consequent');
	});

	it('explains indirect proofs in terms of contradictions', async () => {
		solverContent.update((solution) => {
			solution.indirect = true;
			solution.conclusion = {
				value: 'Q',
				tree: Node.fromPrologFormat('predicate(q)')
			};
			solution.proof = [
				makeRow(1, 'predicate(p)'),
				makeRow(2, 'not(predicate(p))', 'CONC')
			];
			return solution;
		});

		const hintText = await getTextHint();

		expect(hintText.toLowerCase()).toContain('contradiction');
	});
});
