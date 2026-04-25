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
	 * Returns whether the target state has already been reached somewhere in the proof.
	 * For direct proofs this means the required conclusion appears on some valid row.
	 * For indirect proofs this means a contradiction appears somewhere in the proof.
	 * @returns {boolean} a boolean indicating if the target state has been reached
	 */
	public get proofReached(): boolean {
		if (this.indirect) {
			return this.contradictionPairLines !== null;
		}

		return this.compareConclusion(this.conclusion);
	}

	/**
	 * Returns whether the proof is complete.
	 * For direct proofs the last row must be the desired conclusion.
	 * For indirect proofs the last row must participate in the contradiction.
	 * @returns {boolean} a boolean indicating if the proof is complete
	 */
	public get proofComplete(): boolean {
		const lastRow = this.proof.at(-1);
		if (!this.isUsableRow(lastRow)) return false;

		if (!this.indirect) {
			return Boolean(this.conclusion.tree) && FormulaComparer.compare(lastRow, this.conclusion);
		}

		return this.usableProofRows.some(
			(row) => row.line !== lastRow.line && this.rowsContradict(row, lastRow)
		);
	}

	/**
	 * Backwards-compatible alias for callers still using the old name.
	 */
	public get complete(): boolean {
		return this.proofComplete;
	}

	/**
	 * Returns the first contradiction pair found in the proof, if any.
	 */
	public get contradictionPairLines(): [number, number] | null {
		for (let i = 0; i < this.usableProofRows.length; i++) {
			for (let j = i + 1; j < this.usableProofRows.length; j++) {
				const first = this.usableProofRows[i];
				const second = this.usableProofRows[j];

				if (this.rowsContradict(first, second)) {
					return [first.line, second.line];
				}
			}
		}

		return null;
	}

	/**
	 * Method that compares the conclusion of the proof with the desired conclusion
	 * @param conclusion - the desired conclusion
	 * @private
	 */
	private compareConclusion(conclusion: ParsedExpression): boolean {
		return this.usableProofRows.some((row) => FormulaComparer.compare(row, conclusion));
	}

	private get usableProofRows(): TreeRuleType[] {
		return this.proof.filter((row): row is TreeRuleType => this.isUsableRow(row));
	}

	private isUsableRow(
		row?: TreeRuleType
	): row is TreeRuleType & { tree: NonNullable<TreeRuleType['tree']> } {
		return Boolean(row?.tree) && row!.rule.rule !== NDRule.UNKNOWN;
	}

	private rowsContradict(first: TreeRuleType, second: TreeRuleType): boolean {
		if (!this.isUsableRow(first) || !this.isUsableRow(second)) return false;

		const firstPfl = first.tree.toPrologFormat();
		const secondPfl = second.tree.toPrologFormat();

		return secondPfl === `not(${firstPfl})` || firstPfl === `not(${secondPfl})`;
	}
}
