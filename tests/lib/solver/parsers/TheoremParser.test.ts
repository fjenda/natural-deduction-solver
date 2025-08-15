import { beforeEach, expect, test } from 'vitest';
import type { ParsedExpression } from '../../../../src/types/ParsedExpression';
import { Node } from '../../../../src/lib/syntax-checker/Node';
import { NodeType } from '../../../../src/lib/syntax-checker/NodeType';
import { Operator } from '../../../../src/lib/syntax-checker/Operator';
import { Theorem } from '../../../../src/lib/rules/Theorem';
import { TheoremParser } from '../../../../src/lib/solver/parsers/TheoremParser';

let value: string;
let node: Node;
let parsedExpression: ParsedExpression;

beforeEach(() => {
	value = 'A ⊃ (B ⊃ (C ⊃ D))';
	node = new Node(NodeType.BINARY_OPERATION, Operator.IMPLICATION, [
		new Node(NodeType.CONSTANT, 'A'),
		new Node(NodeType.PARENTHESES_BLOCK, '', [
			new Node(NodeType.PARENTHESIS, Operator.LPAR),
			new Node(NodeType.BINARY_OPERATION, Operator.IMPLICATION, [
				new Node(NodeType.CONSTANT, 'B'),
				new Node(NodeType.PARENTHESES_BLOCK, '', [
					new Node(NodeType.PARENTHESIS, Operator.LPAR),
					new Node(NodeType.BINARY_OPERATION, Operator.IMPLICATION, [
						new Node(NodeType.CONSTANT, 'C'),
						new Node(NodeType.CONSTANT, 'D')
					]),
					new Node(NodeType.PARENTHESIS, Operator.RPAR)
				])
			]),
			new Node(NodeType.PARENTHESIS, Operator.RPAR)
		])
	]);

	parsedExpression = { tree: node, value: value };
});

test('TheoremParser getVariants', () => {
	const variants = TheoremParser.getVariants(parsedExpression);
	expect(variants.length).toBe(3);

	// A, B, C |- D
	expect(variants[0].premises.length).toBe(3);
	expect(variants[0].premises[0].value).toBe('A');
	expect(variants[0].premises[1].value).toBe('B');
	expect(variants[0].premises[2].value).toBe('C');
	expect(Node.generateString(variants[0].conclusion)).toBe('D');

	// A, B |- C ⊃ D
	expect(variants[1].premises.length).toBe(2);
	expect(variants[1].premises[0].value).toBe('A');
	expect(variants[1].premises[1].value).toBe('B');
	expect(Node.generateString(variants[1].conclusion)).toBe('C ⊃ D');

	// A |- B ⊃ (C ⊃ D)
	expect(variants[2].premises.length).toBe(1);
	expect(variants[2].premises[0].value).toBe('A');
	expect(Node.generateString(variants[2].conclusion)).toBe('B ⊃ (C ⊃ D)');
});
