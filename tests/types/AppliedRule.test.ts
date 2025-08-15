/**
 * AppliedRule.test.ts
 * Unit tests for AppliedRule type
 */

import { expect, test } from 'vitest';
import { type AppliedRule, appliedRuleToString } from '../../src/types/AppliedRule';

test('AppliedRule simple toString', () => {
	const rule: AppliedRule = {
		rule: 'TMP'
	};

	const result = appliedRuleToString(rule);
	expect(result).toBe('TMP');
});

test('AppliedRule complex toString', () => {
	const rule: AppliedRule = {
		rule: 'IC',
		lines: [1, 2]
	};

	const result = appliedRuleToString(rule);
	expect(result).toBe('IC 1,2');
});
