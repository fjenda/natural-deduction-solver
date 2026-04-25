import { describe, expect, it } from 'vitest';
import { appliedRuleFromString, appliedRuleToString } from '../../src/types/AppliedRule';
import {
	appliedRuleToPrologReplacements,
	getMissingProofLines,
	inferReplacementKind,
	replacementToProlog
} from '../../src/lib/solver/utils/appliedRuleUtils';

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

	it('infers fallback replacement kinds for quantifier rules', () => {
		expect(inferReplacementKind('EU', 0)).toBe('variable');
		expect(inferReplacementKind('EU', 1)).toBe('term');
		expect(inferReplacementKind('EEX', 1)).toBe('constant');
		expect(inferReplacementKind('IU', 1)).toBe('variable');
		expect(inferReplacementKind('MP', 0)).toBeUndefined();
	});

	it('converts individual replacements to prolog using explicit or inferred kinds', () => {
		expect(replacementToProlog({ value: 'x', kind: 'variable' })).toBe('var(x)');
		expect(replacementToProlog({ value: 'a', kind: 'constant' })).toBe('const(a)');
		expect(replacementToProlog({ value: 'f(a)', kind: 'term' })).toBe('function(f(var(a)))');
		expect(replacementToProlog({ value: 'y' }, 'variable')).toBe('var(y)');
	});

	it('returns null when a replacement cannot be converted to a term', () => {
		expect(replacementToProlog({ value: 'P(a)', kind: 'term' })).toBeNull();
	});

	it('returns null from appliedRuleToPrologReplacements when any replacement is invalid', () => {
		const replacements = appliedRuleToPrologReplacements({
			rule: 'EU',
			lines: [1],
			replacements: [{ value: 'x' }, { value: 'P(a)' }]
		});

		expect(replacements).toBeNull();
	});

	it('reports cited lines that are missing from the current proof', () => {
		expect(getMissingProofLines([0, 1, 3, 7], 4)).toEqual([0, 7]);
		expect(getMissingProofLines([1, 2, 4], 4)).toEqual([]);
	});
});


