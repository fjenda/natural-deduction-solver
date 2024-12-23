import {DeductionRule} from "./DeductionRules";
import {PrattParser} from "../../parsers/PrattParser";
import type {TreeRuleType} from "../../../types/TreeRuleType";
export class FormulaParser {
    static parseFormula(formula: string): TreeRuleType {
        // syntax check
        let parser = new PrattParser();
        let res = parser.parse(formula);

        if (!res) {
            return {tree: null, rule: DeductionRule.UNKNOWN.short, value: formula};
        }

        res.print();

        return {tree: res, rule: DeductionRule.EALL.short, value: formula};
    }
}