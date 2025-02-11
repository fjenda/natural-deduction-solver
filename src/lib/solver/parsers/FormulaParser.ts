import { DeductionRule, NDRule } from "./DeductionRules";
import { PrattParser } from "../../syntax-checker/PrattParser";
import type { TreeRuleType } from "../../../types/TreeRuleType";
import { get } from "svelte/store";
import { DeductionProcessor } from "./DeductionProcessor";
import { PrettySyntaxer } from "../PrettySyntaxer";
import { FormulaComparer } from "../FormulaComparer";
import { logicMode, solverContent } from "../../../stores/solverStore";
import { Node } from "../../syntax-checker/Node";
import { queryProlog, verifyResult } from "../solverLogic";

/**
 * The FormulaParser class is used to parse a formula and check if it is valid
 * It also checks if the formula is a valid application of a deduction rule
 * If the formula is valid, it returns the formula and the rule that was applied
 * If the formula is not valid, it returns the formula and the unknown rule
 */
export class FormulaParser {
    /**
     * Parses a formula and checks if it is a valid application of a deduction rule
     * @param formula - the formula to parse
     * @param line - the line number of the formula
     * @param rule - the rule that was applied to the formula
     */
    static parseFormula(formula: string, line: number, rule: string): TreeRuleType {
        // checks the syntax of the formula
        let parser = new PrattParser(get(logicMode));
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
        tmp.tree = res.simplify().parenthesize();
        tmp.value = Node.generateString(tmp.tree);

        // clean the rule string
        rule = PrettySyntaxer.cleanupRule(rule);

        // TODO: assumptions will get added automatically, conclusion i don't know yet
        // TODO: handle the case when we are proving the negation of the conclusion
        if (rule === "ASS") {
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

        // no lines specified
        if (!ruleParts[1]) return tmp;

        const lines = ruleParts[1].split(",");
        const linesNumbers = lines.map(s => parseInt(s));
        const line1 = parseInt(lines[0]);
        const line2 = lines[1] ? parseInt(lines[1]) : null;

        // check if the lines mentioned exist
        if (line1 > get(solverContent).proof.length) {
            alert(`Row ${line1} doesn't exist`);
            return tmp;
        }

        if (line2 && line2 > get(solverContent).proof.length) {
            alert(`Row ${line2} doesn't exist`);
            return tmp;
        }

        // now that we have the name of the rule and the rows it was used with, check if a rule like this exists
        const usedRule = DeductionRule.getRule(ruleName);

        // if the rule wasn't found, return the unknown rule
        if (usedRule === DeductionRule.UNKNOWN) {
            tmp.rule = { rule: NDRule.UNKNOWN };
            return tmp;
        }

        // if we found the rule, try to apply it and check if the results differ
        let first = null;
        let second = null;
        first = get(solverContent).proof[line1 - 1];
        if (line2) {
            second = get(solverContent).proof[line2 - 1];
        }

        // apply the rule
        let result = null;
        if (usedRule === DeductionRule.IDIS) {
            const [left, right] = tmp.tree.split();
            result = queryProlog(usedRule, [left.toPrologFormat(), right.toPrologFormat()], [tmp.line]);
        } else {
            let prem: string[] = [];
            if (!second) {
                // @ts-ignore
                prem = [first.tree.toPrologFormat()];
            } else {
                // @ts-ignore
                prem = [first.tree.toPrologFormat(), second.tree.toPrologFormat()];
            }
            result = verifyResult(tmp.tree, prem, usedRule.short);
        }

        // if the result is false, it's not correct
        if (!result) return tmp;
        tmp.rule = { rule: usedRule.short, lines: linesNumbers };
        return tmp;
    }
}