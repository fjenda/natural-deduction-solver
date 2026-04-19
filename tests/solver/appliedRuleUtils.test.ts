import { beforeEach, describe, expect, it } from 'vitest';
import { appliedRuleFromString, appliedRuleToString } from '../../src/types/AppliedRule';
import {
	appliedRuleToPrologReplacements,
	inferQuantifierReplacements
} from '../../src/lib/solver/utils/appliedRuleUtils';
import { PremiseParser } from '../../src/lib/solver/parsers/PremiseParser';
import { logicMode } from '../../src/stores/solverStore';
import { ParseStrategy } from '../../src/types/ParseStrategy';

describe('applied rule helpers', () => {
	beforeEach(() => {
		logicMode.set(ParseStrategy.PREDICATE);
	});

	it('parses and formats explicit typed quantifier substitutions', () => {
		const rule = appliedRuleFromString('IU 3 const(a)/var(x)');

		expect(rule).toEqual({
			rule: 'IU',
			lines: [3],
			replacements: [
				{ value: 'a', kind: 'constant' },
				{ value: 'x', kind: 'variable' }
			]
		});
		expect(appliedRuleToString(rule)).toBe('IU 3 const(a)/var(x)');
	});

	it('converts structured quantifier substitutions to prolog terms', () => {
		const replacements = appliedRuleToPrologReplacements({
			rule: 'EU',
			lines: [1],
			replacements: [
				{ value: 'x', kind: 'variable' },
				{ value: 'a', kind: 'constant' }
			]
		});

		expect(replacements).toEqual(['var(x)', 'const(a)']);
	});

	it('supports explicit variable substitution for universal elimination', () => {
		const replacements = appliedRuleToPrologReplacements({
			rule: 'EU',
			lines: [1],
			replacements: [
				{ value: 'x', kind: 'variable' },
				{ value: 'y', kind: 'variable' }
			]
		});

		expect(replacements).toEqual(['var(x)', 'var(y)']);
	});

	it('infers legacy quantifier replacement kinds when metadata is missing', () => {
		const existentialElimination = appliedRuleToPrologReplacements({
			rule: 'EEX',
			lines: [1],
			replacements: [{ value: 'x' }, { value: 'a' }]
		});
		const universalIntroduction = appliedRuleToPrologReplacements({
			rule: 'IU',
			lines: [2],
			replacements: [{ value: 'a', kind: 'constant' }, { value: 'x' }]
		});

		expect(existentialElimination).toEqual(['var(x)', 'const(a)']);
		expect(universalIntroduction).toEqual(['const(a)', 'var(x)']);
	});

	it('infers universal elimination substitutions from the cited row and target formula', () => {
		const result = inferQuantifierReplacements(
			'EU',
			PremiseParser.parsePremise('∀x [P(x)]').tree,
			PremiseParser.parsePremise('P(f(a))').tree
		);

		expect(result).toEqual({
			status: 'inferred',
			replacements: [
				{ value: 'x', kind: 'variable' },
				{ value: 'f(a)', kind: 'term' }
			],
			message: 'Substitution derived automatically from the cited row and the entered formula.'
		});
	});

	it('infers universal introduction substitutions from the cited row and target formula', () => {
		const result = inferQuantifierReplacements(
			'IU',
			PremiseParser.parsePremise('P(a)').tree,
			PremiseParser.parsePremise('∀x [P(x)]').tree
		);

		expect(result).toEqual({
			status: 'inferred',
			replacements: [
				{ value: 'a', kind: 'variable' },
				{ value: 'x', kind: 'variable' }
			],
			message: 'Generalization derived automatically from the cited row and the entered formula.'
		});
	});

	it('warns when existential elimination does not yield a fresh constant in the target formula', () => {
		const result = inferQuantifierReplacements(
			'EEX',
			PremiseParser.parsePremise('∃x [P(x)]').tree,
			PremiseParser.parsePremise('P(y)').tree
		);

		expect(result).toEqual({
			status: 'invalid',
			replacements: [],
			message: 'Existential elimination expects a fresh constant. The entered formula does not provide one.'
		});
	});

	it('formats inferred existential elimination constants without empty parentheses in the display value', () => {
		const result = inferQuantifierReplacements(
			'EEX',
			PremiseParser.parsePremise('∃x [L(x) ∧ P(x)]').tree,
			PremiseParser.parsePremise('L(x()) ∧ P(x())').tree
		);

		expect(result).toEqual({
			status: 'inferred',
			replacements: [
				{ value: 'x', kind: 'variable' },
				{ value: 'x', kind: 'constant' }
			],
			message: 'Substitution derived automatically from the cited row and the entered formula.'
		});
	});
});


