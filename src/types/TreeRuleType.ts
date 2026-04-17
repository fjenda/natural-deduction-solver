import type { Node } from '../lib/syntax-checker/Node';
import type { AppliedRule } from './AppliedRule';
import type { ParseDiagnostic } from './ParseDiagnostic';

/**
 * TreeRuleType type
 * This type is a combination of line number, its syntax tree, rule that was applied to it, and its value
 * @param line: number - the line number of the rule
 * @param tree: Node | null - the syntax tree of the rule
 * @param rule: AppliedRule - the rule that was applied to the tree
 * @param value: string - the value of the rule
 */
export type TreeRuleType = {
	line: number;
	tree: Node | null;
	rule: AppliedRule;
	value: string;
	diagnostic?: ParseDiagnostic;
};
