import { DeductionRule, NDRule } from '../../rules/DeductionRule';

export type RulePresentation = {
	code: string;
	symbol: string;
	title: string;
	searchText: string;
};

const RULE_ALIASES: Record<string, string[]> = {
	IC: ['and intro', 'conjunction introduction', '∧ introduction'],
	EC: ['and elim', 'conjunction elimination', '∧ elimination'],
	ID: ['or intro', 'disjunction introduction', '∨ introduction'],
	ED: ['or elim', 'disjunction elimination', '∨ elimination'],
	II: ['implication introduction', 'conditional proof', '⊃ introduction'],
	MP: ['modus ponens', 'implication elimination', '⊃ elimination'],
	IE: ['equivalence introduction', 'biconditional introduction', '≡ introduction'],
	EE: ['equivalence elimination', 'biconditional elimination', '≡ elimination'],
	IU: ['forall intro', 'universal introduction', '∀ introduction'],
	EU: ['forall elim', 'universal elimination', '∀ elimination'],
	IEX: ['exists intro', 'existential introduction', '∃ introduction'],
	EEX: ['exists elim', 'existential elimination', '∃ elimination', 'fresh constant']
};

const FALLBACK_PRESENTATIONS: Record<
	string,
	Omit<RulePresentation, 'code' | 'searchText' | 'kind'>
> = {
	IC: { symbol: '∧I', title: 'Introduction of conjunction' },
	EC: { symbol: '∧E', title: 'Elimination of conjunction' },
	ID: { symbol: '∨I', title: 'Introduction of disjunction' },
	ED: { symbol: '∨E', title: 'Elimination of disjunction' },
	II: { symbol: '⊃I', title: 'Introduction of implication' },
	MP: { symbol: '⊃E', title: 'Modus ponens' },
	IE: { symbol: '≡I', title: 'Introduction of equivalence' },
	EE: { symbol: '≡E', title: 'Elimination of equivalence' },
	IU: { symbol: '∀I', title: 'Introduction of universal quantifier' },
	EU: { symbol: '∀E', title: 'Elimination of universal quantifier' },
	IEX: { symbol: '∃I', title: 'Introduction of existential quantifier' },
	EEX: { symbol: '∃E', title: 'Elimination of existential quantifier' }
};

function buildRulePresentation(rule: DeductionRule): RulePresentation {
	const fallback = FALLBACK_PRESENTATIONS[rule.short] ?? {
		symbol: rule.short,
		title: rule.title
	};
	const searchParts = [
		rule.short,
		fallback.symbol,
		fallback.title,
		rule.title,
		...(RULE_ALIASES[rule.short] ?? [])
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();

	return {
		code: rule.short,
		symbol: fallback.symbol,
		title: fallback.title,
		searchText: searchParts
	};
}

export function getRulePickerOptions(): RulePresentation[] {
	return DeductionRule.rules.map(buildRulePresentation);
}

export function getRulePresentation(code: string): RulePresentation {
	return (
		getRulePickerOptions().find((option) => option.code === code) ?? {
			code,
			symbol: code,
			title: code,
			searchText: code.toLowerCase()
		}
	);
}

export function getRuleActionText(code: string): string {
	switch (code) {
		case NDRule.EEX:
			return 'Pick a cited existential row and name its witness with a fresh constant';
		case NDRule.EALL:
			return 'Pick the quantified variable from the cited row and instantiate it with a term';
		case NDRule.IEX:
			return 'Choose a concrete symbol from the cited row and package it into an existential claim';
		case NDRule.IALL:
			return 'Choose a concrete symbol from the cited row and generalize it into a universal variable';
		default:
			return 'Configure how this rule should be applied';
	}
}
