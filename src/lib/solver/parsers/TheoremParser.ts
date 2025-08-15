import { Node } from '../../syntax-checker/Node';
import { NodeType } from '../../syntax-checker/NodeType';
import { Operator } from '../../syntax-checker/Operator';
import type { TheoremVariant } from '../../../types/TheoremVariant';
import type { ParsedExpression } from '../../../types/ParsedExpression';

/**
 * The TheoremParser class is used to parse a theorem and check if it is valid
 * It also checks if the formula is a valid application of a deduction rule
 * If the formula is valid, it returns the formula and the rule that was applied
 * If the formula is not valid, it returns the formula and the unknown rule
 */
export class TheoremParser {
	/**
	 * Returns all possible variants of the theorem
	 * for input A -> (B -> (C -> D)), it returns [[A, B -> (C -> D)], [A, B, C -> D], [A, B, C, D]]
	 * @param node - the node to get the variants from
	 */
	static getVariants(node: ParsedExpression): TheoremVariant[] {
		let variants: TheoremVariant[] = [];
		let newNode = node.tree!;
		const premises: Node[] = [];
		while (newNode.type === NodeType.BINARY_OPERATION && newNode.value === Operator.IMPLICATION) {
			premises.push(newNode.children[0].simplify().parenthesize());
			const copy = [...premises];
			variants = [
				{
					premises: copy,
					conclusion: newNode.children[1].simplify().parenthesize()
				},
				...variants
			];
			newNode = newNode.children[1].simplify().parenthesize();
		}

		return variants;
	}
}
