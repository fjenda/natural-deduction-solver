import { beforeEach, expect, test } from 'vitest';
import type { TreeRuleType } from '../../../src/types/TreeRuleType';
import { FormulaComparer } from '../../../src/lib/solver/FormulaComparer';
import { Node } from '../../../src/lib/syntax-checker/Node';
import { NodeType } from '../../../src/lib/syntax-checker/NodeType';
import { Operator } from '../../../src/lib/syntax-checker/Operator';

let AandB: Node, AorB: Node, AandBOuterParentheses: Node, AandBParentheses: Node;

beforeEach(() => {
	AandB = new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, [
		new Node(NodeType.CONSTANT, 'A', []),
		new Node(NodeType.CONSTANT, 'B', [])
	]);

	AandBOuterParentheses = new Node(NodeType.PARENTHESES_BLOCK, '', [
		new Node(NodeType.PARENTHESIS, Operator.LPAR, []),
		new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, [
			new Node(NodeType.CONSTANT, 'A', []),
			new Node(NodeType.CONSTANT, 'B', [])
		]),
		new Node(NodeType.PARENTHESIS, Operator.RPAR, [])
	]);

	AandBParentheses = new Node(NodeType.PARENTHESES_BLOCK, '', [
		new Node(NodeType.PARENTHESIS, Operator.LPAR, []),
		new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, [
			new Node(NodeType.PARENTHESES_BLOCK, '', [
				new Node(NodeType.PARENTHESIS, Operator.LPAR, []),
				new Node(NodeType.CONSTANT, 'A', []),
				new Node(NodeType.PARENTHESIS, Operator.RPAR, [])
			]),
			new Node(NodeType.PARENTHESES_BLOCK, '', [
				new Node(NodeType.PARENTHESIS, Operator.LPAR, []),
				new Node(NodeType.CONSTANT, 'B', []),
				new Node(NodeType.PARENTHESIS, Operator.RPAR, [])
			])
		]),
		new Node(NodeType.PARENTHESIS, Operator.RPAR, [])
	]);

	AorB = new Node(NodeType.BINARY_OPERATION, Operator.DISJUNCTION, [
		new Node(NodeType.CONSTANT, 'A', []),
		new Node(NodeType.CONSTANT, 'B', [])
	]);
});

test('FormulaComparer compare simple formulas', () => {
	const f1: TreeRuleType = {
		line: 1,
		tree: AandB,
		rule: { rule: 'PREM' },
		value: 'A ∧ B'
	};

	const f2: TreeRuleType = {
		line: 2,
		tree: AandB,
		rule: { rule: 'PREM' },
		value: 'A ∧ B'
	};

	// with outer parentheses
	const f3: TreeRuleType = {
		line: 2,
		tree: AandBOuterParentheses,
		rule: { rule: 'PREM' },
		value: '(A ∧ B)'
	};

	const result = FormulaComparer.compare(f1, f2);
	expect(result).toBe(true);

	const result2 = FormulaComparer.compare(f1, f3);
	expect(result2).toBe(true);
});

test('FormulaComparer compare different formulas', () => {
	const f1: TreeRuleType = {
		line: 1,
		tree: AandB,
		rule: { rule: 'PREM' },
		value: 'A ∧ B'
	};

	const f2: TreeRuleType = {
		line: 2,
		tree: AorB,
		rule: { rule: 'PREM' },
		value: 'A ∨ B'
	};

	const result = FormulaComparer.compare(f1, f2);
	expect(result).toBe(false);
});

test('FormulaComparer compare formulas with all parentheses', () => {
	const f1: TreeRuleType = {
		line: 1,
		tree: AandB,
		rule: { rule: 'PREM' },
		value: 'A ∧ B'
	};

	const f2: TreeRuleType = {
		line: 2,
		tree: AandBParentheses,
		rule: { rule: 'PREM' },
		value: '((A) ∧ (B))'
	};

	const result = FormulaComparer.compare(f1, f2);
	expect(result).toBe(true);
});
