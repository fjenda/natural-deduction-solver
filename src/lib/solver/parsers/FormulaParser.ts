import {DeductionRule} from "./DeductionRules";
import {Parser} from "../../parsers/Parser";

export class FormulaParser {
    static parseFormula(formula: string): string {
        // syntax check
        let parser = new Parser();
        let res = parser.parse(formula);

        if (!res) {
            return DeductionRule.UNKNOWN.rule;
        }

        return DeductionRule.EALL.rule;
    }
}