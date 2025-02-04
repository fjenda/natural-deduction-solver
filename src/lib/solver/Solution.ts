import type {TreeRuleType} from "../../types/TreeRuleType";
import type {ParsedExpression} from "../../types/ParsedExpression";

/**
 * Solution class
 * This class is used to store the solution of a proof
 * It contains the name of the solution, the premises, the conclusion and the proof
 * @property {string} name - the name of the solution
 * @property {string[]} premises - the premises of the solution
 * @property {string} conclusion - the conclusion of the solution
 * @property {TreeRuleType[]} proof - the proof of the solution
 */
export class Solution {
    name: string = "";
    premises: ParsedExpression[] = [];
    conclusion: ParsedExpression = { value: "", tree: null };
    proof: TreeRuleType[] = [];

    /**
     * Constructor of the Solution class
     * @param {string} name - the name of the solution
     * @param {ParsedExpression[]} premises - the premises of the solution
     * @constructor
     */
    constructor(name: string, premises?: ParsedExpression[]) {
        this.name = name;

        if (premises) {
            this.premises = premises;
        }
    }

    /**
     * Method that returns the string representation of the Solution
     * @returns {string} the string representation of the Solution
     */
    toString(): string {
        return `${this.name}`;
    }
}