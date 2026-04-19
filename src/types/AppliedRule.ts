export type RuleReplacementKind = 'variable' | 'constant' | 'term';

/**
 * A typed replacement used by quantifier rules.
 * `kind` is optional to keep legacy persisted data compatible.
 */
export type AppliedRuleReplacement = {
	value: string;
	kind?: RuleReplacementKind;
};

/**
 * AppliedRule type
 * This type is used to represent a rule that has been applied to a line in the proof.
 * @param rule: NDRule - the rule that was applied
 * @param lines?: number[] - the lines that the rule was applied to
 * @param replacements?: AppliedRuleReplacement[] - structured replacement metadata for quantifier rules
 */
export type AppliedRule = {
	rule: string;
	lines?: number[];
	replacements?: AppliedRuleReplacement[];
};

function replacementToString(replacement: AppliedRuleReplacement): string {
	if (replacement.kind === 'variable') return `var(${replacement.value})`;
	if (replacement.kind === 'constant') return `const(${replacement.value})`;
	return replacement.value;
}

function replacementToDisplayString(replacement: AppliedRuleReplacement): string {
	return replacement.value;
}

function parseReplacement(token: string): AppliedRuleReplacement {
	const value = token.trim();
	const variableMatch = value.match(/^var\((.*)\)$/i);
	if (variableMatch) {
		return { value: variableMatch[1].trim(), kind: 'variable' };
	}

	const constantMatch = value.match(/^const\((.*)\)$/i);
	if (constantMatch) {
		return { value: constantMatch[1].trim().replace(/^'(.*)'$/, '$1'), kind: 'constant' };
	}

	return { value };
}

export function cloneAppliedRule(appliedRule: AppliedRule): AppliedRule {
	return {
		rule: appliedRule.rule,
		lines: appliedRule.lines ? [...appliedRule.lines] : [],
		replacements: appliedRule.replacements
			? appliedRule.replacements.map((replacement) => ({ ...replacement }))
			: []
	};
}

export function normalizeAppliedRule(appliedRule: AppliedRule): AppliedRule {
	return {
		rule: appliedRule.rule.trim(),
		lines: (appliedRule.lines ?? []).filter((line) => Number.isFinite(line)),
		replacements: (appliedRule.replacements ?? [])
			.map((replacement) => ({
				value: replacement.value.trim(),
				kind: replacement.kind
			}))
			.filter((replacement) => replacement.value !== '')
	};
}

export function appliedRuleToString(appliedRule: AppliedRule): string {
	const lines = appliedRule.lines && appliedRule.lines.length > 0 ? ` ${appliedRule.lines.join(',')}` : '';
	const replacements =
		appliedRule.replacements && appliedRule.replacements.length > 0
			? ` ${appliedRule.replacements.map(replacementToString).join('/')}`
			: '';

	return `${appliedRule.rule}${lines}${replacements}`.trim();
}

export function appliedRuleToDisplayString(appliedRule: AppliedRule): string {
	const lines = appliedRule.lines && appliedRule.lines.length > 0 ? ` ${appliedRule.lines.join(',')}` : '';
	const replacements =
		appliedRule.replacements && appliedRule.replacements.length > 0
			? ` ${appliedRule.replacements.map(replacementToDisplayString).join('/')}`
			: '';

	return `${appliedRule.rule}${lines}${replacements}`.trim();
}

export function appliedRuleFromString(str: string): AppliedRule {
	const parts = str.trim().split(/\s+/).filter(Boolean);
	const rule = parts[0]?.toUpperCase() ?? '';
	const lines = parts[1]
		? parts[1]
				.split(',')
				.map((line) => Number(line))
				.filter((line) => Number.isFinite(line))
		: [];
	const replacementsToken = parts.slice(2).join(' ');
	const replacements = replacementsToken
		? replacementsToken
				.split('/')
				.map(parseReplacement)
				.filter((replacement) => replacement.value !== '')
		: [];

	return {
		rule,
		lines,
		replacements
	};
}
