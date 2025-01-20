import {DeductionRule} from "./DeductionRules";
import {PrattParser} from "../../parsers/PrattParser";
import type {TreeRuleType} from "../../../types/TreeRuleType";
import {get} from "svelte/store";
import {parsedProof, selectedRow} from "../../../stores/solverStore";
import {DeductionProcessor} from "../../parsers/DeductionProcessor";
export class FormulaParser {
    static parseFormula(formula: string, line: number): TreeRuleType {
        // syntax check
        let parser = new PrattParser();
        let res = parser.parse(formula);

        if (!res) {
            return {line: line, tree: null, rule: DeductionRule.UNKNOWN.short, value: formula};
        }

        // Finally if the row is an assumption from the premises, return blank (no rule)
        return {line: line, tree: res, rule: "", value: formula};
    }
}