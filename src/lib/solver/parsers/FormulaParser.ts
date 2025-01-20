import {DeductionRule} from "./DeductionRules";
import {PrattParser} from "../../parsers/PrattParser";
import type {TreeRuleType} from "../../../types/TreeRuleType";
import {get} from "svelte/store";
import {parsedProof, selectedRow} from "../../../stores/solverStore";
import {DeductionProcessor} from "../../parsers/DeductionProcessor";
import {PrettySyntaxer} from "../PrettySyntaxer";
import {FormulaComparer} from "../FormulaComparer";
export class FormulaParser {
    static parseFormula(formula: string, line: number, rule: string): TreeRuleType {
        // checks the syntax of the formula
        let parser = new PrattParser();
        let res = parser.parse(formula);

        // if the formula is not valid, return the error
        if (!res) {
            return {line: line, tree: null, rule: DeductionRule.UNKNOWN.short, value: formula};
        }

        // clean the rule string
        rule = PrettySyntaxer.cleanupRule(rule);

        // if the rule is `ASS` or `CONC`, return the rule (no need to check it was added automatically)
        // TODO: that might not actually be the case, check on this later
        //
        // TODO: handle the case when we are proving the negation of the conclusion
        if (rule === "ASS" || rule === "CONC") {
            return {line: line, tree: res, rule: rule, value: formula};
        }

        // split the rule into its parts
        const ruleParts = rule.split(" ");
        const ruleName = ruleParts[0];
        const lines = ruleParts[1].split(",");
        const line1 = parseInt(lines[0]);
        const line2 = lines[1] ? parseInt(lines[1]) : null;

        // now that we have the name of the rule and the rows it was used with, check if a rule like this exists
        const usedRule = DeductionRule.getRule(ruleName);

        // if the rule wasn't found, return the unknown rule
        if (usedRule === DeductionRule.UNKNOWN) {
            return {line: line, tree: null, rule: usedRule.short, value: formula};
        }

        // if we found the rule, try to apply it and check if the results differ
        let first, second = null;
        first = get(parsedProof)[line1 - 1];
        if (line2) {
            second = get(parsedProof)[line2 - 1];
        }

        const result = DeductionProcessor.applyRule(usedRule.short, first, second);
        console.log(result);

        // if the result is null, the rule wasn't applied correctly
        if (!result) {
            return {line: line, tree: res, rule: 'x', value: formula};
        }

        // some rules return an array of results, in that case we need to check if our result is in the array
        if (Array.isArray(result)) {
            if (!result.some((r) => FormulaComparer.compareFormulas(r.value, formula))) {
                return {line: line, tree: res, rule: 'x', value: formula};
            }

            // the results are the same, return the rule
            return {line: line, tree: res, rule: rule, value: formula};
        }

        // check if the results differ
        if (!FormulaComparer.compareFormulas(result.value, formula)) {
            return {line: line, tree: res, rule: 'x', value: formula};
        }

        // the results are the same, return the rule
        return {line: line, tree: res, rule: rule, value: formula};
    }
}