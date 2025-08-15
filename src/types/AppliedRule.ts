/**
 * AppliedRule type
 * This type is used to represent a rule that has been applied to a line in the proof.
 * @param rule: NDRule - the rule that was applied
 * @param lines?: number[] - the lines that the rule was applied to
 */
export type AppliedRule = {
	rule: string;
	lines?: number[];
	replacements?: string[];
};

export function appliedRuleToString(appliedRule: AppliedRule): string {
	return (
		appliedRule.rule +
		(appliedRule.lines ? ' ' + appliedRule.lines.join(',') : '') +
		(appliedRule.replacements ? ' ' + appliedRule.replacements.join('/') : '')
	);
}

export function appliedRuleFromString(str: string): AppliedRule {
	const parts = str.split(' ');

	// Rule structure
	// {name} {lines?} {replacements?}
	const rule: AppliedRule = {
		rule: parts[0]
	};

	if (parts[1]) {
		rule.lines = parts[1].split(',').map(Number);
	}

	if (parts[2]) {
		rule.replacements = parts[2].split('/').map((s) => s.trim());
	}

	return rule;
}
