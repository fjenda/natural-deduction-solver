import { DeductionRule, NDRule } from '../../rules/DeductionRule';
import { PrattParser } from '../../syntax-checker/PrattParser';
import type { TreeRuleType } from '../../../types/TreeRuleType';
import { get } from 'svelte/store';
import { PrettySyntaxer } from './PrettySyntaxer';
import { logicMode, solverContent } from '../../../stores/solverStore';
import { Node } from '../../syntax-checker/Node';
import { Theorem } from '../../rules/Theorem';
import type { IRule } from '../../rules/IRule';
import { showToast } from '../../utils/showToast';
import { verifyProlog } from '../services/proofService';
import { appliedRuleFromString } from '../../../types/AppliedRule';

/**
 * The FormulaParser class is used to parse a formula and check if it is valid.
 * It also checks if the formula is a valid application of a deduction rule.
 * If the formula is valid, it returns the formula and the rule applied.
 * If the formula is not valid, it returns the formula and the unknown rule.
 */
export class FormulaParser {
	// static async parseFormula(formula: string, line: number, rule: string): Promise<TreeRuleType> {
	// 	// checks the syntax of the formula
	// 	const parser = new PrattParser(get(logicMode));
	// 	const res = parser.parse(formula);
	//
	// 	const tmp: TreeRuleType = {
	// 		line: line,
	// 		tree: null,
	// 		rule: { rule: NDRule.UNKNOWN },
	// 		value: formula
	// 	};
	//
	// 	// if the formula is not valid, return the error
	// 	if (!res) return tmp;
	//
	// 	// parenthesize the formula and value
	// 	tmp.tree = res.simplify().parenthesize();
	// 	tmp.value = Node.generateString(tmp.tree);
	//
	// 	// clean the rule string
	// 	rule = PrettySyntaxer.cleanupRule(rule);
	//
	// 	if (rule === 'PREM') {
	// 		return tmp;
	// 	}
	//
	// 	if (rule === 'CONC') {
	// 		tmp.rule = { rule: NDRule.CONC };
	// 		return tmp;
	// 	}
	//
	// 	// split the rule into its parts
	// 	if (!rule) return tmp;
	//
	// 	const appliedRule = appliedRuleFromString(rule);
	//
	// 	// no lines specified
	// 	if (!appliedRule.lines) return tmp;
	//
	// 	console.log(appliedRule);
	// 	// check if the lines mentioned exist
	// 	if (1 > appliedRule.lines[0] || appliedRule.lines[0] > get(solverContent).proof.length) {
	// 		showToast(`Row ${appliedRule.lines[0]} doesn't exist`, 'error');
	// 		return tmp;
	// 	}
	//
	// 	if (1 > appliedRule.lines[1] || appliedRule.lines[1] > get(solverContent).proof.length) {
	// 		showToast(`Row ${appliedRule.lines[1]} doesn't exist`, 'error');
	// 		return tmp;
	// 	}
	//
	// 	// now that we have the name of the rule and the rows it was used with, check if a rule like this exists
	// 	let usedRule: IRule = DeductionRule.getRule(appliedRule.rule);
	// 	if (usedRule === DeductionRule.UNKNOWN) {
	// 		usedRule = Theorem.getRule(appliedRule.rule);
	// 	}
	// 	// console.log(usedRule);
	// 	// if the rule wasn't found, return the unknown rule
	// 	if (usedRule === DeductionRule.UNKNOWN) {
	// 		tmp.rule = { rule: NDRule.UNKNOWN };
	// 		return tmp;
	// 	}
	//
	// 	// if we found the rule, try to apply it and check if the results differ
	// 	let second = null;
	// 	const first = get(solverContent).proof[appliedRule.lines[0] - 1];
	// 	if (appliedRule.lines[1]) {
	// 		second = get(solverContent).proof[appliedRule.lines[1] - 1];
	// 	}
	//
	// 	// apply the rule
	// 	let result;
	// 	if (usedRule === DeductionRule.IDIS) {
	// 		const [left, right] = tmp.tree.split();
	// 		result = await proveProlog(
	// 			[left.toPrologFormat(), right.toPrologFormat()],
	// 			usedRule,
	// 			appliedRule.lines,
	// 			[]
	// 		);
	// 	} else {
	// 		let prem: string[];
	// 		if (!second) {
	// 			// @ts-expect-error first.tree might not have a toPrologFormat method
	// 			prem = [first.tree.toPrologFormat()];
	// 		} else {
	// 			// @ts-expect-error first.tree or second.tree might not have a toPrologFormat method
	// 			prem = [first.tree.toPrologFormat(), second.tree.toPrologFormat()];
	// 		}
	// 		result = await verifyProlog(prem, usedRule, tmp.tree);
	// 	}
	//
	// 	// if the result is false, it's not correct
	// 	if (!result) return tmp;
	// 	tmp.rule = { rule: usedRule.short, lines: appliedRule.lines };
	// 	return tmp;
	// }

	/**
	 * Parses a formula and checks if it is a valid application of a deduction rule
	 * @param formula - the formula to parse
	 * @param line - the line number of the formula
	 * @param ruleStr - the rule applied to the formula as a string
	 * @returns a TreeRuleType object containing the parsed formula and the rule applied
	 */
	static async parseFormula(formula: string, line: number, ruleStr: string): Promise<TreeRuleType> {
		const parser = new PrattParser(get(logicMode));
		const res = parser.parse(formula);

		const base: TreeRuleType = {
			line,
			tree: null,
			rule: { rule: NDRule.UNKNOWN },
			value: formula
		};

		// stop early if syntax is wrong
		if (!res) return base;

		// normalize formula
		base.tree = res.simplify().parenthesize();
		base.value = Node.generateString(base.tree);

		// normalize rule string
		const cleanRule = PrettySyntaxer.cleanupRule(ruleStr);

		// trivial rules
		if (cleanRule === 'PREM') return base;
		if (cleanRule === 'CONC') return { ...base, rule: { rule: NDRule.CONC } };
		if (!cleanRule) return base;

		// parse applied rule (e.g. "EC 1,2")
		const applied = appliedRuleFromString(cleanRule);
		if (!applied.lines) return base;

		// validate lines
		if (!FormulaParser.linesExist(applied.lines)) return base;

		// resolve deduction/theorem rule
		const usedRule = FormulaParser.findRule(applied.rule);
		if (usedRule === DeductionRule.UNKNOWN) return base;

		// get premises from solver store
		const [first, second] = FormulaParser.getPremises(applied.lines);

		// apply rule
		const ok = await FormulaParser.checkRuleApplication(base.tree, usedRule, first, second);
		if (!ok) return base;

		// success
		return { ...base, rule: { rule: usedRule.short, lines: applied.lines } };
	}

	/** Helper functions for the main parseFormula function **/
	private static linesExist(lines: number[]): boolean {
		const proof = get(solverContent).proof;
		for (const l of lines) {
			if (l < 1 || l > proof.length) {
				showToast(`Row ${l} doesn't exist`, 'error');
				return false;
			}
		}
		return true;
	}

	private static findRule(ruleName: string): IRule {
		let rule: IRule = DeductionRule.getRule(ruleName);
		if (rule === DeductionRule.UNKNOWN) {
			rule = Theorem.getRule(ruleName);
		}
		return rule;
	}

	private static getPremises(lines: number[]) {
		const proof = get(solverContent).proof;
		const first = proof[lines[0] - 1];
		const second = lines[1] ? proof[lines[1] - 1] : null;
		return [first, second];
	}

	private static async checkRuleApplication(
		target: Node,
		rule: IRule,
		first: TreeRuleType | null,
		second: TreeRuleType | null
	): Promise<boolean> {
		let premises: string[] = [];
		if (rule === DeductionRule.IDIS) {
			const [left, right] = target.split();
			premises = [left.toPrologFormat(), right.toPrologFormat()];
		} else {
			premises = second
				? [first!.tree!.toPrologFormat(), second.tree!.toPrologFormat()]
				: [first!.tree!.toPrologFormat()];
		}

		return await verifyProlog(premises, rule, target);
	}
}
