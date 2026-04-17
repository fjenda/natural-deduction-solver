import { PremiseParser } from '../parsers/PremiseParser';
import { Node } from '../../syntax-checker/Node';
import { NodeType } from '../../syntax-checker/NodeType';
import type {
	AppliedRule,
	AppliedRuleReplacement,
	RuleReplacementKind
} from '../../../types/AppliedRule';

export function getMissingProofLines(lines: number[], proofLength: number): number[] {
	return lines.filter((line) => line < 1 || line > proofLength);
}

export function inferReplacementKind(
	rule: string,
	index: number
): RuleReplacementKind | undefined {
	switch (rule) {
		case 'EU':
			return index === 0 ? 'variable' : 'term';
		case 'EEX':
			return index === 0 ? 'variable' : 'constant';
		case 'IU':
		case 'IEX':
			return index === 1 ? 'variable' : undefined;
		default:
			return undefined;
	}
}

export function replacementFromProlog(replacement: string): AppliedRuleReplacement {
	const node = Node.fromPrologFormat(replacement);

	if (node.type === NodeType.VARIABLE) {
		return { value: node.value ?? '', kind: 'variable' };
	}

	if (node.type === NodeType.CONSTANT) {
		return { value: node.value ?? '', kind: 'constant' };
	}

	return {
		value: Node.generateString(node),
		kind: 'term'
	};
}

function parseTermReplacement(value: string): Node | null {
	const parsed = PremiseParser.parsePremise(value);
	if (!parsed.tree) return null;

	if (![NodeType.CONSTANT, NodeType.VARIABLE, NodeType.FUNCTION].includes(parsed.tree.type)) {
		return null;
	}

	return parsed.tree;
}

export function replacementToProlog(
	replacement: AppliedRuleReplacement,
	fallbackKind?: RuleReplacementKind
): string | null {
	const kind = replacement.kind ?? fallbackKind;
	const value = replacement.value.trim();
	if (!value) return null;

	if (kind === 'variable') {
		return `var(${value})`;
	}

	if (kind === 'constant') {
		return new Node(NodeType.CONSTANT, value).toPrologFormat();
	}

	const parsed = parseTermReplacement(value);
	return parsed?.toPrologFormat() ?? null;
}

export function appliedRuleToPrologReplacements(appliedRule: AppliedRule): string[] | null {
	const replacements = appliedRule.replacements ?? [];
	const resolved = replacements.map((replacement, index) =>
		replacementToProlog(replacement, inferReplacementKind(appliedRule.rule, index))
	);

	if (resolved.some((replacement) => replacement === null)) {
		return null;
	}

	return resolved as string[];
}


