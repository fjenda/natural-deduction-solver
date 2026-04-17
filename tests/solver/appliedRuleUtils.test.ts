import { describe, expect, it } from 'vitest';
import { appliedRuleFromString, appliedRuleToString } from '../../src/types/AppliedRule';
import { appliedRuleToPrologReplacements } from '../../src/lib/solver/utils/appliedRuleUtils';

describe('applied rule helpers', () => {
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
});


