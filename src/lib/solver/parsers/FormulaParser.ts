import { DeductionRule, NDRule } from "../../rules/DeductionRule";
import { PrattParser } from "../../syntax-checker/PrattParser";
import type { TreeRuleType } from "../../../types/TreeRuleType";
import { get } from "svelte/store";
import { PrettySyntaxer } from "./PrettySyntaxer";
import { logicMode, solverContent } from "../../../stores/solverStore";
import { Node } from "../../syntax-checker/Node";
import { Theorem } from "../../rules/Theorem";
import type { IRule } from "../../rules/IRule";
import { showToast } from "../../utils/showToast";
import { proveProlog, verifyProlog } from "../services/proofService";
import { appliedRuleFromString } from "../../../types/AppliedRule";

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
  static async parseFormula(
    formula: string,
    line: number,
    rule: string,
  ): Promise<TreeRuleType> {
    // checks the syntax of the formula
    let parser = new PrattParser(get(logicMode));
    let res = parser.parse(formula);

    const tmp: TreeRuleType = {
      line: line,
      tree: null,
      rule: { rule: NDRule.UNKNOWN },
      value: formula,
    };

    // if the formula is not valid, return the error
    if (!res) return tmp;

    // parenthesize the formula and value
    tmp.tree = res.simplify().parenthesize();
    tmp.value = Node.generateString(tmp.tree);

    // clean the rule string
    rule = PrettySyntaxer.cleanupRule(rule);

    // TODO: premises will get added automatically, conclusion i don't know yet
    // TODO: handle the case when we are proving the negation of the conclusion
    if (rule === "PREM") {
      return tmp;
    }

    if (rule === "CONC") {
      tmp.rule = { rule: NDRule.CONC };
      return tmp;
    }

    // split the rule into its parts
    if (!rule) return tmp;

    const appliedRule = appliedRuleFromString(rule);

    // no lines specified
    if (!appliedRule.lines) return tmp;

    // check if the lines mentioned exist
    if (appliedRule.lines[0] > get(solverContent).proof.length) {
      showToast(`Row ${appliedRule.lines[0]} doesn't exist`, "error");
      return tmp;
    }

    if (
      appliedRule.lines[1] &&
      appliedRule.lines[1] > get(solverContent).proof.length
    ) {
      showToast(`Row ${appliedRule.lines[1]} doesn't exist`, "error");
      return tmp;
    }

    // now that we have the name of the rule and the rows it was used with, check if a rule like this exists
    let usedRule: IRule = DeductionRule.getRule(appliedRule.rule);
    if (usedRule === DeductionRule.UNKNOWN) {
      usedRule = Theorem.getRule(appliedRule.rule);
    }
    // console.log(usedRule);
    // if the rule wasn't found, return the unknown rule
    if (usedRule === DeductionRule.UNKNOWN) {
      tmp.rule = { rule: NDRule.UNKNOWN };
      return tmp;
    }

    // if we found the rule, try to apply it and check if the results differ
    let first = null;
    let second = null;
    first = get(solverContent).proof[appliedRule.lines[0] - 1];
    if (appliedRule.lines[1]) {
      second = get(solverContent).proof[appliedRule.lines[1] - 1];
    }

    // apply the rule
    let result = null;
    if (usedRule === DeductionRule.IDIS) {
      const [left, right] = tmp.tree.split();
      result = proveProlog(
        [left.toPrologFormat(), right.toPrologFormat()],
        usedRule,
        [tmp.line],
        [],
      );
    } else {
      let prem: string[] = [];
      if (!second) {
        // @ts-ignore
        prem = [first.tree.toPrologFormat()];
      } else {
        // @ts-ignore
        prem = [first.tree.toPrologFormat(), second.tree.toPrologFormat()];
      }
      result = await verifyProlog(prem, usedRule, tmp.tree);
    }

    // if the result is false, it's not correct
    if (!result) return tmp;
    tmp.rule = { rule: usedRule.short, lines: appliedRule.lines };
    return tmp;
  }
}
