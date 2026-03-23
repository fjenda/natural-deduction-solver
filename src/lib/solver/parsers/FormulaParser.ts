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
import { ProofTable } from '../../../prolog/queries/ProofTable';

/**
 * The FormulaParser class is used to parse a formula and check if it is valid.
 * It also checks if the formula is a valid application of a deduction rule.
 * If the formula is valid, it returns the formula and the rule applied.
 * If the formula is not valid, it returns the formula and the unknown rule.
 */
export class FormulaParser {
	/**
	 * Parses a formula and checks if it is a valid application of a deduction rule
	 * @param formula - the formula to parse
	 * @param line - the line number of the formula
	 * @param ruleStr - the rule applied to the formula as a string
	 * @returns a TreeRuleType object containing the parsed formula and the rule applied
	 */
	static async parseFormula(formula: string, line: number, ruleStr: string): Promise<TreeRuleType> {
		const mode = get(logicMode);
		const parser = new PrattParser(mode);
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
		if (!FormulaParser.linesExist(applied.lines)) {
			showToast("One or more specified lines don't exist", 'error');
			return base;
		}

		// resolve deduction/theorem rule
		const usedRule = FormulaParser.findRule(applied.rule);
		if (usedRule === DeductionRule.UNKNOWN) {
			showToast(`Rule ${applied.rule} doesn't exist`, 'error');
			return base;
		}

		// get premises from solver store
		const [first, second] = FormulaParser.getPremises(applied.lines);

		// apply rule
		const params = applied.replacements ?? [];
		const paramsCopy = [...params];
		if (['EEX', 'EU'].includes(usedRule.short)) {
			paramsCopy[0] = `var(${params[0]})`;
		} else if (['IEX', 'IU'].includes(usedRule.short)) {
			paramsCopy[1] = `var(${params[1]})`;
		}

		// We can only use a constant in EEX
		if (usedRule.short === 'EEX') paramsCopy[1] = `const(${params[1]})`;

		const ok = await FormulaParser.checkRuleApplication(
			base.tree,
			usedRule,
			first,
			second,
			paramsCopy
		);
		if (!ok) return base;

		await ProofTable.edit(
			base.line,
			base.tree.toPrologFormat(),
			usedRule.short,
			applied.lines,
			paramsCopy
		);

		// success
		return {
			...base,
			rule: { rule: usedRule.short, lines: applied.lines, replacements: params }
		};
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
			if (rule.detail === '' && rule.inputSize === 0 && rule.outputSize === 0) {
				rule = DeductionRule.UNKNOWN;
			}
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
		second: TreeRuleType | null,
		params: string[]
	): Promise<boolean> {
		let premises: string[];
		if (rule === DeductionRule.IDIS) {
			const [left, right] = target.split();
			premises = [left.toPrologFormat(), right.toPrologFormat()];
		} else {
			premises = second
				? [first!.tree!.toPrologFormat(), second.tree!.toPrologFormat()]
				: [first!.tree!.toPrologFormat()];
		}

		return await verifyProlog(premises, rule, params, target);
	}
}
