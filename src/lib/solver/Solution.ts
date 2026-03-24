import type { TreeRuleType } from '../../types/TreeRuleType';
import type { ParsedExpression } from '../../types/ParsedExpression';
import { NDRule } from '../rules/DeductionRule';
import { FormulaComparer } from './FormulaComparer';

/**
 * Solution class
 * This class is used to store the solution of a proof
 * It contains the name of the solution, the premises, the conclusion and the proof
 * @property {string} name - the name of the solution
 * @property {ParsedExpression[]} premises - the premises of the solution
 * @property {ParsedExpression} conclusion - the conclusion of the solution
 * @property {TreeRuleType[]} proof - the proof of the solution
 */
export class Solution {
	name: string = '';
	premises: ParsedExpression[] = [];
	conclusion: ParsedExpression = { value: '', tree: null };
	proof: TreeRuleType[] = [];
	indirect: boolean = false;
	contradiction: boolean = false;
	whole: ParsedExpression = { value: '', tree: null };

	/**
	 * Constructor of the Solution class
	 * @param {string} name - the name of the solution
	 * @param {ParsedExpression} conclusion - the conclusion of the solution
	 * @constructor
	 */
	constructor(name: string, conclusion?: ParsedExpression) {
		this.name = name;
		this.premises = [{ value: '', tree: null }];

		if (conclusion) {
			this.conclusion = conclusion;
		}
	}

	/**
	 * Method that returns the string representation of the Solution
	 * @returns {string} the string representation of the Solution
	 */
	toString(): string {
		return `${this.name}`;
	}

	/**
	 * Method that returns a boolean indicating if the proof is valid
	 * @returns {boolean} a boolean indicating if the proof is valid
	 */
	public get valid(): boolean {
		return this.proof.every((row) => row.rule.rule !== NDRule.UNKNOWN);
	}

	/**
	 * Method that returns a boolean indicating if the proof is complete
	 * @returns {boolean} a boolean indicating if the proof is complete
	 */
	public get complete(): boolean {
		if (this.indirect && this.contradiction) return true;

		return this.compareConclusion(this.conclusion);
	}

	/**
	 * Method that compares the conclusion of the proof with the desired conclusion
	 * @param conclusion - the desired conclusion
	 * @private
	 */
	private compareConclusion(conclusion: ParsedExpression): boolean {
		return this.proof.some(
			(p) => p.tree && p.rule.rule !== NDRule.UNKNOWN && FormulaComparer.compare(p, conclusion)
		);
	}
}
