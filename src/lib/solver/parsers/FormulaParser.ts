import {DeductionRule, NDRule} from "./DeductionRules";
import {PrattParser} from "../../parsers/PrattParser";
import type {TreeRuleType} from "../../../types/TreeRuleType";
import {get} from "svelte/store";
import {DeductionProcessor} from "../../parsers/DeductionProcessor";
import {PrettySyntaxer} from "../PrettySyntaxer";
import {FormulaComparer} from "../FormulaComparer";
import {solverContent} from "../../../stores/solverStore";
import {Node} from "../../parsers/Node";

export class FormulaParser {
    static parseFormula(formula: string, line: number, rule: string): TreeRuleType {
        // checks the syntax of the formula
        let parser = new PrattParser();
        let res = parser.parse(formula);

        const tmp: TreeRuleType = {
            line: line,
            tree: null,
            rule: { rule: NDRule.UNKNOWN },
            value: formula,
        }

        // if the formula is not valid, return the error
        if (!res) return tmp;

        // parenthesize the formula and value
        tmp.tree = res.parenthesize();
        tmp.value = Node.generateString(tmp.tree);

        // clean the rule string
        rule = PrettySyntaxer.cleanupRule(rule);

        // TODO: assumptions will get added automatically, conclusion i don't know yet
        //
        // TODO: handle the case when we are proving the negation of the conclusion
        if (rule === "ASS") {
            tmp.rule = { rule: NDRule.ASS };
            return tmp;
        }

        if (rule === "CONC") {
            tmp.rule = { rule: NDRule.CONC };
            return tmp;
        }

        // split the rule into its parts
        if (!rule) return tmp;
        const ruleParts = rule.split(" ");
        const ruleName = ruleParts[0];
        const lines = ruleParts[1].split(",");
        const linesNumbers = lines.map(s => parseInt(s));
        const line1 = parseInt(lines[0]);
        const line2 = lines[1] ? parseInt(lines[1]) : null;

        // now that we have the name of the rule and the rows it was used with, check if a rule like this exists
        const usedRule = DeductionRule.getRule(ruleName);

        // if the rule wasn't found, return the unknown rule
        if (usedRule === DeductionRule.UNKNOWN) {
            tmp.rule = { rule: NDRule.UNKNOWN };
            return tmp;
        }

        // if we found the rule, try to apply it and check if the results differ
        let first, second = null;
        first = get(solverContent).proof[line1 - 1];
        if (line2) {
            second = get(solverContent).proof[line2 - 1];
        }

        // apply the rule
        const result = DeductionProcessor.applyRule(usedRule.short, first, second);

        // if the result is null, the rule wasn't applied correctly
        if (!result) return tmp;

        // some rules return an array of results, in that case we need to check if our result is in the array
        if (Array.isArray(result)) {
            if (!result.some((r) => FormulaComparer.compare(r, tmp))) {
                return tmp;
            }

            // the results are the same, return the rule
            tmp.rule = { rule: usedRule.short, lines: linesNumbers };
            return tmp;
        }

        // check if the results differ
        if (!FormulaComparer.compare(result, tmp)) {
            return tmp;
        }

        // the results are the same, return the rule
        tmp.rule = { rule: usedRule.short, lines: linesNumbers };
        return tmp;
    }
}