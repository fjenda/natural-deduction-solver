import {DeductionRule} from "./DeductionRules";
import {Parser} from "../../parsers/Parser";
import {get} from "svelte/store";
import {solverContent} from "../../../stores/solverStore";

export class FormulaParser {
    static parseFormula(formula: string): string {
        // syntax check
        let parser = new Parser();
        let res = parser.parse(formula);

        if (!res) {
            return DeductionRule.UNKNOWN.short;
        }

        res.print();

        return DeductionRule.EALL.short;
    }
}