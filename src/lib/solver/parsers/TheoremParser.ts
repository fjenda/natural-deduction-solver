import { PrattParser } from "../../syntax-checker/PrattParser";
import { get } from "svelte/store";
import { logicMode } from "../../../stores/solverStore";
import { Node } from "../../syntax-checker/Node";

import { NodeType } from "../../syntax-checker/NodeType";
import { Operator } from "../../syntax-checker/Operator";

/**
 * The TheoremParser class is used to parse a theorem and check if it is valid
 * It also checks if the formula is a valid application of a deduction rule
 * If the formula is valid, it returns the formula and the rule that was applied
 * If the formula is not valid, it returns the formula and the unknown rule
 */
export class TheoremParser {
    static splitTheorem(formula: string): Node[] | null[] {
        // checks the syntax of the theorem
        let parser = new PrattParser(get(logicMode));
        let res = parser.parse(formula);

        if (!res) return [null, null];

        // the top operator should be an implication
        res = res.simplify();
        if (res.type !== NodeType.BINARY_OPERATION || res.value !== Operator.IMPLICATION) {
            return [null, null];
        }

        return res.split().map(n => n.parenthesize());
    }
}