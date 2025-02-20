import type { TreeRuleType } from "../../types/TreeRuleType";
import type { ParsedExpression } from "../../types/ParsedExpression";
import { NDRule } from "../rules/DeductionRule";
import { FormulaComparer } from "./FormulaComparer";
import { TheoremParser } from "./parsers/TheoremParser";
import { Node } from "../syntax-checker/Node";

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
    name: string = "";
    premises: ParsedExpression[] = [];
    conclusion: ParsedExpression = { value: "", tree: null };
    proof: TreeRuleType[] = [];
    indirect: boolean = false;
    contradiction: boolean = false;

    /**
     * Constructor of the Solution class
     * @param {string} name - the name of the solution
     * @param {ParsedExpression} conclusion - the conclusion of the solution
     * @constructor
     */
    constructor(name: string, conclusion?: ParsedExpression) {
        this.name = name;

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

    public get complete(): boolean {
        if (this.indirect && this.contradiction) return true;

        if (this.premises.length === 0) {
            return this.isCompleteTheorem();
        }

        return this.compareConclusion(this.conclusion);
    }

    private isCompleteTheorem(): boolean {
        const [_, right] = TheoremParser.splitTheorem(this.conclusion.value);
        if (!right) {
            return false;
        }

        const conclusion = { value: Node.generateString(right), tree: right };
        return this.compareConclusion(conclusion);
    }

    private compareConclusion(conclusion: ParsedExpression): boolean {
        return this.proof
            .some(p => p.tree
                && p.rule.rule !== NDRule.UNKNOWN
                && FormulaComparer.compare(p, conclusion)
            );
    }
}