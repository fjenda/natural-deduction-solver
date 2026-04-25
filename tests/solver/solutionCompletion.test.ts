import { describe, expect, it } from 'vitest';
import '../../src/stores/solverStore';
import { Solution } from '../../src/lib/solver/Solution';
import type { ParsedExpression } from '../../src/types/ParsedExpression';
import type { TreeRuleType } from '../../src/types/TreeRuleType';

function parsedExpression(value: string): ParsedExpression {
	return {
		value,
		tree: {
			toPrologFormat: () => value,
			simplify: () => ({ toPrologFormat: () => value }),
			equals: () => false
		} as ParsedExpression['tree']
	};
}

function proofRow(line: number, value: string, rule = 'PREM', prolog = value): TreeRuleType {
	return {
		line,
		value,
		tree: {
			toPrologFormat: () => prolog,
			simplify: () => ({ toPrologFormat: () => prolog }),
			equals: () => false
		} as NonNullable<TreeRuleType['tree']>,
		rule: { rule, lines: [], replacements: [] }
	};
}

describe('Solution proofReached / proofComplete', () => {
	it('marks a direct proof as reached when the conclusion appears earlier but not as complete', () => {
		const solution = new Solution('Direct reached', parsedExpression('Q(a)'));
		solution.proof = [proofRow(1, 'Q(a)'), proofRow(2, 'R(a)')];

		expect(solution.proofReached).toBe(true);
		expect(solution.proofComplete).toBe(false);
		expect(solution.complete).toBe(false);
	});

	it('marks a direct proof as complete only when the last row is the conclusion', () => {
		const solution = new Solution('Direct complete', parsedExpression('Q(a)'));
		solution.proof = [proofRow(1, 'P(a)'), proofRow(2, 'Q(a)', 'MP')];

		expect(solution.proofReached).toBe(true);
		expect(solution.proofComplete).toBe(true);
		expect(solution.complete).toBe(true);
	});

	it('marks an indirect proof as reached when a contradiction exists before the last row', () => {
		const solution = new Solution('Indirect reached', parsedExpression('Q(a)'));
		solution.indirect = true;
		solution.proof = [
			proofRow(1, 'P(a)', 'PREM', "predicate('P', [const(a)])"),
			proofRow(2, '¬P(a)', 'PREM', "not(predicate('P', [const(a)]))"),
			proofRow(3, 'R(a)', 'PREM', "predicate('R', [const(a)])")
		];

		expect(solution.proofReached).toBe(true);
		expect(solution.proofComplete).toBe(false);
		expect(solution.contradictionPairLines).toEqual([1, 2]);
	});

	it('marks an indirect proof as complete when the last row closes the contradiction', () => {
		const solution = new Solution('Indirect complete', parsedExpression('Q(a)'));
		solution.indirect = true;
		solution.proof = [
			proofRow(1, 'P(a)', 'PREM', "predicate('P', [const(a)])"),
			proofRow(2, 'R(a)', 'PREM', "predicate('R', [const(a)])"),
			proofRow(3, '¬P(a)', 'PREM', "not(predicate('P', [const(a)]))")
		];

		expect(solution.proofReached).toBe(true);
		expect(solution.proofComplete).toBe(true);
		expect(solution.contradictionPairLines).toEqual([1, 3]);
	});

	it('does not mark the proof as complete when the last row is invalid even if the target was reached earlier', () => {
		const solution = new Solution('Invalid ending', parsedExpression('Q(a)'));
		solution.proof = [
			proofRow(1, 'Q(a)'),
			{ line: 2, value: 'unfinished', tree: null, rule: { rule: 'x', lines: [], replacements: [] } }
		];

		expect(solution.valid).toBe(false);
		expect(solution.proofReached).toBe(true);
		expect(solution.proofComplete).toBe(false);
	});
});



