import type { TreeRuleType } from '../../types/TreeRuleType';
import type { ParsedExpression } from '../../types/ParsedExpression';

/**
 * Class that compares two formulas to check if they are equivalent
 * It compares the strings and the trees of the formulas
 */
export class FormulaComparer {
	/**
	 * Compares two formulas to check if they are equivalent
	 * @param f1 - the first formula
	 * @param f2 - the second formula
	 * @returns true if the formulas are equivalent, false otherwise
	 */
	public static compare(f1: TreeRuleType, f2: TreeRuleType | ParsedExpression): boolean {
		// if they are the same, return true
		if (f1.value === f2.value) {
			return true;
		}

		// if they are the same, but one has outer parentheses, return true
		// this is to handle the case when the user adds parentheses to the formula
		if (f1.value === `(${f2.value})` || f2.value === `(${f1.value})`) {
			return true;
		}

		// if one of the trees is not defined, return false
		if (!f1.tree || !f2.tree) return false;

		// then we check the trees
		const tree1 = f1.tree.simplify();
		const tree2 = f2.tree.simplify();

		// if the prolog format of the trees is the same, return true
		if (tree1.toPrologFormat() === tree2.toPrologFormat()) {
			return true;
		}

		// if they are the same, but one lacks the structure of the parentheses, for example:
		// `a ∧ b ⊃ c ∨ d` is the same as `((a ∧ b) ⊃ (c ∨ d))`
		// we remove the parentheses blocks and after that compare the trees

		// first we check the strings without the parentheses
		// if they are different, then there's no need to check the actual structure of the trees
		// also we check if the trees are defined
		const f1NoParen = f1.value.replace(/(\(|\))/g, '');
		const f2NoParen = f2.value.replace(/(\(|\))/g, '');
		if (f1NoParen !== f2NoParen) {
			return false;
		}

		// if they are the same, return true
		if (tree1.equals(tree2)) {
			return true;
		}

		// if they are different, return false
		return false;
	}
}
