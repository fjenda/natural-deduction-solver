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
import {
	appliedRuleFromString,
	cloneAppliedRule,
	normalizeAppliedRule,
	type AppliedRule
} from '../../../types/AppliedRule';
import { ProofTable } from '../../../prolog/queries/ProofTable';
import { appliedRuleToPrologReplacements, getMissingProofLines } from '../utils/appliedRuleUtils';

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
	 * @param ruleInput - the rule applied to the formula
	 * @returns a TreeRuleType object containing the parsed formula and the rule applied
	 */
	static async parseFormula(
		formula: string,
		line: number,
		ruleInput: string | AppliedRule
	): Promise<TreeRuleType> {
		const mode = get(logicMode);
		const parser = new PrattParser(mode);
		const res = parser.parse(formula);

		const base: TreeRuleType = {
			line,
			tree: null,
			rule: { rule: NDRule.UNKNOWN },
			value: formula,
			diagnostic: parser.lastDiagnostic ?? undefined
		};

		// stop early if syntax is wrong
		if (!res) return base;

		// normalize formula
		base.tree = res.simplify().parenthesize();
		base.value = Node.generateString(base.tree);
		base.diagnostic = undefined;

		const applied = FormulaParser.normalizeRuleInput(ruleInput);

		// trivial rules
		if (applied.rule === 'PREM') return { ...base, rule: { rule: NDRule.PREM } };
		if (applied.rule === 'CONC') return { ...base, rule: { rule: NDRule.CONC } };
		if (!applied.rule) return base;

		// validate lines
		if (!FormulaParser.linesExist(applied.lines ?? [])) {
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
		const [first, second] = FormulaParser.getPremises(applied.lines ?? []);
		if (!FormulaParser.hasRequiredPremises(applied.lines ?? [], usedRule, first)) {
			return base;
		}

		// apply rule
		const paramsCopy = appliedRuleToPrologReplacements(applied);
		if (paramsCopy === null) {
			showToast('Invalid substitution input.', 'error');
			return base;
		}

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
			applied.lines ?? [],
			paramsCopy
		);

		// success
		return {
			...base,
			rule: { ...cloneAppliedRule(applied), rule: usedRule.short }
		};
	}

	private static normalizeRuleInput(ruleInput: string | AppliedRule): AppliedRule {
		if (typeof ruleInput === 'string') {
			return normalizeAppliedRule(appliedRuleFromString(PrettySyntaxer.cleanupRule(ruleInput)));
		}

		return normalizeAppliedRule(ruleInput);
	}

	/**
	 * Checks if the given line numbers exist in the current proof
	 * @param lines - the line numbers to check
	 * @returns {boolean} true if all lines exist
	 */
	private static linesExist(lines: number[]): boolean {
		if (lines.length === 0) return true;

		const proofLength = get(solverContent).proof.length;
		const missingLines = getMissingProofLines(lines, proofLength);
		if (missingLines.length > 0) {
			showToast(`Row ${missingLines[0]} doesn't exist`, 'error');
			return false;
		}

		return true;
	}

	/**
	 * Finds a rule by name, checking both deduction rules and theorems
	 * @param ruleName - the name of the rule to find
	 * @returns {IRule} the matching rule, or DeductionRule.UNKNOWN if not found
	 */
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

	/**
	 * Retrieves the premise formulas from the proof at the given line numbers
	 * @param lines - the line numbers to retrieve premises from
	 * @returns {Array} the first and second premise (second may be null)
	 */
	private static getPremises(lines: number[]) {
		const proof = get(solverContent).proof;
		const first = proof[lines[0] - 1];
		const second = lines[1] ? proof[lines[1] - 1] : null;
		return [first, second];
	}

	private static hasRequiredPremises(
		lines: number[],
		rule: IRule,
		first: TreeRuleType | null | undefined
	): boolean {
		if (lines.length > 0 && first?.tree) return true;
		if (rule.inputSize === 0) return true;

		showToast('Please reference at least one valid row.', 'error');
		return false;
	}

	/**
	 * Verifies that a rule application is correct using the Prolog engine
	 * @param target - the target formula node
	 * @param rule - the rule being applied
	 * @param first - the first premise
	 * @param second - the second premise (may be null)
	 * @param params - the parameters for the rule application
	 * @returns {Promise<boolean>} true if the rule application is valid
	 */
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
