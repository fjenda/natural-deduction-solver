import { get } from 'svelte/store';
import { selectedRows, solverContent } from '../../../stores/solverStore';
import type { TreeRuleType } from '../../../types/TreeRuleType';
import type { IRule } from '../../rules/IRule';
import { DeductionRule, NDRule } from '../../rules/DeductionRule';
import { FormulaComparer } from '../FormulaComparer';
import { Node } from '../../syntax-checker/Node';
import { NodeType } from '../../syntax-checker/NodeType';
import { Operator } from '../../syntax-checker/Operator';

export interface HintRule {
	rule: IRule;
	applicableRows: number[];
	confidence: number;
	message: string;
}

const TIP_RULE: IRule = {
	short: 'TIP',
	title: 'Strategy',
	inputSize: 0,
	outputSize: 0,
	detail: ''
};

function cloneNode(node: Node): Node {
	return Node.fromPrologFormat(node.toPrologFormat());
}

function unwrap(node: Node): Node {
	let current = node;

	while (
		(current.type === NodeType.PARENTHESES_BLOCK || current.type === NodeType.BRACKETS_BLOCK) &&
		current.children[1]
	) {
		current = current.children[1];
	}

	return current;
}

function nodeToParsedExpression(node: Node) {
	const cloned = cloneNode(node);
	return {
		value: Node.generateString(cloned),
		tree: cloned
	};
}

function nodeEquals(left: Node, right: Node): boolean {
	return cloneNode(left).toPrologFormat() === cloneNode(right).toPrologFormat();
}

function rowMatchesNode(row: TreeRuleType, node: Node): boolean {
	if (!row.tree) return false;
	return FormulaComparer.compare(row, nodeToParsedExpression(node));
}

function usableRows(proof: TreeRuleType[]): TreeRuleType[] {
	return proof.filter((row): row is TreeRuleType & { tree: Node } => {
		return Boolean(row.tree) && row.rule.rule !== NDRule.UNKNOWN;
	});
}

function getBinaryParts(node: Node, operator: Operator): [Node, Node] | null {
	const unwrapped = unwrap(cloneNode(node));
	if (
		unwrapped.type !== NodeType.BINARY_OPERATION ||
		unwrapped.value !== operator ||
		unwrapped.children.length !== 2
	) {
		return null;
	}

	return [unwrapped.children[0], unwrapped.children[1]];
}

function getNegatedChild(node: Node): Node | null {
	const unwrapped = unwrap(cloneNode(node));
	if (unwrapped.type !== NodeType.NEGATION || unwrapped.children.length !== 1) {
		return null;
	}

	return unwrapped.children[0];
}

function getQuantifierBody(node: Node, operator?: Operator): Node | null {
	const unwrapped = unwrap(cloneNode(node));
	if (unwrapped.type !== NodeType.QUANTIFIER || unwrapped.children.length < 3) {
		return null;
	}

	if (operator && unwrapped.children[0]?.value !== operator) {
		return null;
	}

	return unwrap(unwrapped.children[2]);
}

function makeBinaryNode(operator: Operator, left: Node, right: Node): Node {
	return new Node(NodeType.BINARY_OPERATION, operator, [cloneNode(left), cloneNode(right)]);
}

function makeNegationNode(node: Node): Node {
	return new Node(NodeType.NEGATION, Operator.NEGATION, [cloneNode(node)]);
}

function lineLabel(lines: number[]): string {
	if (lines.length === 0) return 'the relevant rows';
	if (lines.length === 1) return `row ${lines[0]}`;
	if (lines.length === 2) return `rows ${lines[0]} and ${lines[1]}`;
	return `rows ${lines.join(', ')}`;
}

function findRowsMatching(node: Node, rows: TreeRuleType[]): TreeRuleType[] {
	return rows.filter((row) => rowMatchesNode(row, node));
}

function selectionBoost(lines: number[], selected: Set<number>): number {
	return lines.reduce((score, line) => score + (selected.has(line) ? 0.03 : 0), 0);
}

function dedupeLines(lines: number[]): number[] {
	return [...new Set(lines)].sort((a, b) => a - b);
}

function addHint(hints: HintRule[], hint: HintRule) {
	const normalizedLines = dedupeLines(hint.applicableRows);
	const normalizedHint = { ...hint, applicableRows: normalizedLines };
	const existingIndex = hints.findIndex(
		(existing) =>
			existing.rule.short === normalizedHint.rule.short &&
			existing.message === normalizedHint.message &&
			existing.applicableRows.join(',') === normalizedHint.applicableRows.join(',')
	);

	if (existingIndex === -1) {
		hints.push(normalizedHint);
		return;
	}

	if (hints[existingIndex].confidence < normalizedHint.confidence) {
		hints[existingIndex] = normalizedHint;
	}
}

function sortRowsForPreference(rows: TreeRuleType[], selected: Set<number>): TreeRuleType[] {
	return [...rows].sort((left, right) => {
		const leftScore = (selected.has(left.line) ? 1000 : 0) + left.line;
		const rightScore = (selected.has(right.line) ? 1000 : 0) + right.line;
		return rightScore - leftScore;
	});
}

function bestSingleRow(rows: TreeRuleType[], selected: Set<number>): TreeRuleType | null {
	return sortRowsForPreference(rows, selected)[0] ?? null;
}

function bestPair(
	leftRows: TreeRuleType[],
	rightRows: TreeRuleType[],
	selected: Set<number>
): [TreeRuleType, TreeRuleType] | null {
	let best: [TreeRuleType, TreeRuleType] | null = null;
	let bestScore = -1;

	for (const left of leftRows) {
		for (const right of rightRows) {
			if (left.line === right.line) continue;

			const score =
				(selectionBoost([left.line, right.line], selected) * 100) + Math.max(left.line, right.line);

			if (score > bestScore) {
				best = [left, right];
				bestScore = score;
			}
		}
	}

	return best;
}

function contradictionContext(): string {
	const assumptionRow = get(solverContent).proof.find((row) => row.rule.rule === NDRule.CONC);
	return assumptionRow ? ` This would contradict row ${assumptionRow.line}.` : '';
}

function addImmediateGoalHint(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	const solution = get(solverContent);
	const goal = solution.conclusion.tree;
	if (!goal || solution.indirect) return;

	const matchingRows = sortRowsForPreference(findRowsMatching(goal, rows), selected);
	if (matchingRows.length === 0 || solution.proofComplete) return;

	const bestRow = matchingRows[0];
	addHint(hints, {
		rule: TIP_RULE,
		applicableRows: [bestRow.line],
		confidence: 0.99,
		message: `You already derived the conclusion on row ${bestRow.line}, but the checker only accepts it when it is the last row of the proof.`
	});
}

function addContradictionHint(hints: HintRule[]) {
	const solution = get(solverContent);
	if (!solution.indirect) return;

	const pair = solution.contradictionPairLines;
	if (!pair) return;

	addHint(hints, {
		rule: TIP_RULE,
		applicableRows: [...pair],
		confidence: solution.proofComplete ? 1 : 0.99,
		message: solution.proofComplete
			? `The last row already closes a contradiction with ${lineLabel([...pair])}. The proof is ready to check.`
			: `You already have a contradiction on ${lineLabel([...pair])}. In this app, the last row must participate in the contradiction, so derive either side again as your next step.`
	});
}

function addConjunctionGoalHints(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	const goal = get(solverContent).conclusion.tree;
	if (!goal) return;

	const parts = getBinaryParts(goal, Operator.CONJUNCTION);
	if (!parts) return;

	const [left, right] = parts;
	const leftRows = findRowsMatching(left, rows);
	const rightRows = findRowsMatching(right, rows);
	const pair = bestPair(leftRows, rightRows, selected);

	if (pair) {
		addHint(hints, {
			rule: DeductionRule.ICON,
			applicableRows: [pair[0].line, pair[1].line],
			confidence: 0.96 + selectionBoost([pair[0].line, pair[1].line], selected),
			message: `${lineLabel([pair[0].line, pair[1].line])} already give both parts of the goal, so IC reaches the conclusion in one step.${contradictionContext()}`
		});
		return;
	}

	const leftRow = bestSingleRow(leftRows, selected);
	const rightRow = bestSingleRow(rightRows, selected);

	if (leftRow && !rightRow) {
		addHint(hints, {
			rule: TIP_RULE,
			applicableRows: [leftRow.line],
			confidence: 0.84 + selectionBoost([leftRow.line], selected),
			message: `Row ${leftRow.line} already gives the left side of the goal. Derive ${Node.generateString(cloneNode(right))} next, then use IC.`
		});
	}

	if (rightRow && !leftRow) {
		addHint(hints, {
			rule: TIP_RULE,
			applicableRows: [rightRow.line],
			confidence: 0.84 + selectionBoost([rightRow.line], selected),
			message: `Row ${rightRow.line} already gives the right side of the goal. Derive ${Node.generateString(cloneNode(left))} next, then use IC.`
		});
	}
}

function addDisjunctionGoalHints(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	const goal = get(solverContent).conclusion.tree;
	if (!goal) return;

	const parts = getBinaryParts(goal, Operator.DISJUNCTION);
	if (!parts) return;

	const [left, right] = parts;
	const leftRow = bestSingleRow(findRowsMatching(left, rows), selected);
	const rightRow = bestSingleRow(findRowsMatching(right, rows), selected);

	if (leftRow) {
		addHint(hints, {
			rule: DeductionRule.IDIS,
			applicableRows: [leftRow.line],
			confidence: 0.94 + selectionBoost([leftRow.line], selected),
			message: `Row ${leftRow.line} already matches one side of the goal. Use ID there and insert ${Node.generateString(cloneNode(right))}.${contradictionContext()}`
		});
	}

	if (rightRow) {
		addHint(hints, {
			rule: DeductionRule.IDIS,
			applicableRows: [rightRow.line],
			confidence: 0.94 + selectionBoost([rightRow.line], selected),
			message: `Row ${rightRow.line} already matches one side of the goal. Use ID there and insert ${Node.generateString(cloneNode(left))}.${contradictionContext()}`
		});
	}
}

function addImplicationGoalHints(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	const goal = get(solverContent).conclusion.tree;
	if (!goal) return;

	const parts = getBinaryParts(goal, Operator.IMPLICATION);
	if (!parts) return;

	const [antecedent, consequent] = parts;
	const consequentRow = bestSingleRow(findRowsMatching(consequent, rows), selected);

	if (consequentRow) {
		addHint(hints, {
			rule: DeductionRule.IIMP,
			applicableRows: [consequentRow.line],
			confidence: 0.95 + selectionBoost([consequentRow.line], selected),
			message: `Row ${consequentRow.line} already gives the consequent. Use II there and insert ${Node.generateString(cloneNode(antecedent))}.${contradictionContext()}`
		});
		return;
	}

	addHint(hints, {
		rule: TIP_RULE,
		applicableRows: [],
		confidence: 0.72,
		message: `To prove ${Node.generateString(cloneNode(goal))}, focus on deriving ${Node.generateString(cloneNode(consequent))} somewhere in the proof. Then II can introduce the implication.`
	});
}

function addEquivalenceGoalHints(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	const goal = get(solverContent).conclusion.tree;
	if (!goal) return;

	const parts = getBinaryParts(goal, Operator.EQUIVALENCE);
	if (!parts) return;

	const [left, right] = parts;
	const leftToRight = makeBinaryNode(Operator.IMPLICATION, left, right);
	const rightToLeft = makeBinaryNode(Operator.IMPLICATION, right, left);
	const leftToRightRows = findRowsMatching(leftToRight, rows);
	const rightToLeftRows = findRowsMatching(rightToLeft, rows);
	const pair = bestPair(leftToRightRows, rightToLeftRows, selected);

	if (pair) {
		addHint(hints, {
			rule: DeductionRule.IEQ,
			applicableRows: [pair[0].line, pair[1].line],
			confidence: 0.95 + selectionBoost([pair[0].line, pair[1].line], selected),
			message: `${lineLabel([pair[0].line, pair[1].line])} already prove both directions, so IE gives the equivalence goal immediately.${contradictionContext()}`
		});
		return;
	}

	const oneDirectionRow = bestSingleRow([...leftToRightRows, ...rightToLeftRows], selected);
	if (oneDirectionRow) {
		const missingDirection = leftToRightRows.some((row) => row.line === oneDirectionRow.line)
			? Node.generateString(cloneNode(rightToLeft))
			: Node.generateString(cloneNode(leftToRight));

		addHint(hints, {
			rule: TIP_RULE,
			applicableRows: [oneDirectionRow.line],
			confidence: 0.84 + selectionBoost([oneDirectionRow.line], selected),
			message: `Row ${oneDirectionRow.line} already gives one direction of the equivalence. Derive ${missingDirection} next, then use IE.`
		});
	}
}

function addUniversalGoalHints(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	const goal = get(solverContent).conclusion.tree;
	if (!goal) return;

	const body = getQuantifierBody(goal, Operator.UNIVERSAL);
	if (!body) return;

	const bodyRow = bestSingleRow(findRowsMatching(body, rows), selected);
	if (!bodyRow) return;

	addHint(hints, {
		rule: DeductionRule.IALL,
		applicableRows: [bodyRow.line],
		confidence: 0.9 + selectionBoost([bodyRow.line], selected),
		message: `Row ${bodyRow.line} already matches the body of the universal goal. IU is the most direct next step here.${contradictionContext()}`
	});
}

function addExistentialGoalStrategy(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	const goal = get(solverContent).conclusion.tree;
	if (!goal) return;

	const body = getQuantifierBody(goal, Operator.EXISTENTIAL);
	if (!body) return;

	const matchingPredicateRow = bestSingleRow(
		rows.filter((row) => {
			if (!row.tree) return false;
			const rowRoot = unwrap(cloneNode(row.tree));
			const bodyRoot = unwrap(cloneNode(body));
			return rowRoot.type === bodyRoot.type && rowRoot.value === bodyRoot.value;
		}),
		selected
	);

	if (!matchingPredicateRow) return;

	addHint(hints, {
		rule: DeductionRule.IEX,
		applicableRows: [matchingPredicateRow.line],
		confidence: 0.79 + selectionBoost([matchingPredicateRow.line], selected),
		message: `Row ${matchingPredicateRow.line} looks like a concrete instance of the existential goal. Try IEX there if the witness term matches.`
	});
}

function addModusPonensHints(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	const goal = get(solverContent).conclusion.tree;
	if (!goal) return;

	for (const implicationRow of rows) {
		const parts = getBinaryParts(implicationRow.tree, Operator.IMPLICATION);
		if (!parts) continue;

		const [antecedent, consequent] = parts;
		if (!nodeEquals(consequent, goal)) continue;

		const antecedentRows = findRowsMatching(antecedent, rows).filter(
			(row) => row.line !== implicationRow.line
		);
		const pair = bestPair([implicationRow], antecedentRows, selected);
		if (!pair) continue;

		addHint(hints, {
			rule: DeductionRule.MP,
			applicableRows: [pair[0].line, pair[1].line],
			confidence: 0.95 + selectionBoost([pair[0].line, pair[1].line], selected),
			message: `${lineLabel([pair[0].line, pair[1].line])} fit MP and produce the goal directly.${contradictionContext()}`
		});
	}
}

function addConjunctionEliminationHints(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	const goal = get(solverContent).conclusion.tree;
	if (!goal) return;

	for (const row of rows) {
		const parts = getBinaryParts(row.tree, Operator.CONJUNCTION);
		if (!parts) continue;

		if (!nodeEquals(parts[0], goal) && !nodeEquals(parts[1], goal)) continue;

		addHint(hints, {
			rule: DeductionRule.ECON,
			applicableRows: [row.line],
			confidence: 0.93 + selectionBoost([row.line], selected),
			message: `Row ${row.line} is a conjunction containing the goal, so EC can extract exactly what you need.${contradictionContext()}`
		});
	}
}

function addDisjunctionEliminationHints(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	const goal = get(solverContent).conclusion.tree;
	if (!goal) return;

	for (const disjunctionRow of rows) {
		const parts = getBinaryParts(disjunctionRow.tree, Operator.DISJUNCTION);
		if (!parts) continue;

		const [left, right] = parts;
		const notLeftRows = findRowsMatching(makeNegationNode(left), rows).filter(
			(row) => row.line !== disjunctionRow.line
		);
		const notRightRows = findRowsMatching(makeNegationNode(right), rows).filter(
			(row) => row.line !== disjunctionRow.line
		);

		if (nodeEquals(right, goal)) {
			const pair = bestPair([disjunctionRow], notLeftRows, selected);
			if (pair) {
				addHint(hints, {
					rule: DeductionRule.EDIS,
					applicableRows: [pair[0].line, pair[1].line],
					confidence: 0.92 + selectionBoost([pair[0].line, pair[1].line], selected),
					message: `${lineLabel([pair[0].line, pair[1].line])} fit ED and yield the goal.${contradictionContext()}`
				});
			}
		}

		if (nodeEquals(left, goal)) {
			const pair = bestPair([disjunctionRow], notRightRows, selected);
			if (pair) {
				addHint(hints, {
					rule: DeductionRule.EDIS,
					applicableRows: [pair[0].line, pair[1].line],
					confidence: 0.92 + selectionBoost([pair[0].line, pair[1].line], selected),
					message: `${lineLabel([pair[0].line, pair[1].line])} fit ED and yield the goal.${contradictionContext()}`
				});
			}
		}
	}
}

function addEquivalenceEliminationHints(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	const goal = get(solverContent).conclusion.tree;
	if (!goal) return;

	const implicationGoal = getBinaryParts(goal, Operator.IMPLICATION);
	if (!implicationGoal) return;

	const [left, right] = implicationGoal;

	for (const row of rows) {
		const parts = getBinaryParts(row.tree, Operator.EQUIVALENCE);
		if (!parts) continue;

		const matchesDirection =
			(nodeEquals(parts[0], left) && nodeEquals(parts[1], right)) ||
			(nodeEquals(parts[0], right) && nodeEquals(parts[1], left));

		if (!matchesDirection) continue;

		addHint(hints, {
			rule: DeductionRule.EEQ,
			applicableRows: [row.line],
			confidence: 0.9 + selectionBoost([row.line], selected),
			message: `Row ${row.line} is the matching equivalence, so EE can extract the implication goal directly.${contradictionContext()}`
		});
	}
}

function addSelectedRowHints(hints: HintRule[], rows: TreeRuleType[], selected: Set<number>) {
	if (selected.size !== 1) return;

	const selectedLine = [...selected][0];
	const row = rows.find((candidate) => candidate.line === selectedLine);
	if (!row?.tree) return;

	const goal = get(solverContent).conclusion.tree;
	if (!goal) return;

	const goalConjunction = getBinaryParts(goal, Operator.CONJUNCTION);
	if (goalConjunction) {
		const [left, right] = goalConjunction;
		if (rowMatchesNode(row, left)) {
			addHint(hints, {
				rule: TIP_RULE,
				applicableRows: [row.line],
				confidence: 0.86,
				message: `You selected row ${row.line}, which already gives one conjunct of the goal. Now look for ${Node.generateString(cloneNode(right))}.`
			});
		}

		if (rowMatchesNode(row, right)) {
			addHint(hints, {
				rule: TIP_RULE,
				applicableRows: [row.line],
				confidence: 0.86,
				message: `You selected row ${row.line}, which already gives one conjunct of the goal. Now look for ${Node.generateString(cloneNode(left))}.`
			});
		}
	}

	const selectedConjunction = getBinaryParts(row.tree, Operator.CONJUNCTION);
	if (selectedConjunction && (nodeEquals(selectedConjunction[0], goal) || nodeEquals(selectedConjunction[1], goal))) {
		addHint(hints, {
			rule: DeductionRule.ECON,
			applicableRows: [row.line],
			confidence: 0.88,
			message: `Your selected row ${row.line} is a conjunction that contains the goal. EC is the natural next move.`
		});
	}
}

function addFallbackStrategyHint(hints: HintRule[]) {
	if (hints.length > 0) return;

	const solution = get(solverContent);
	const goal = solution.conclusion.tree;
	if (!goal) {
		addHint(hints, {
			rule: TIP_RULE,
			applicableRows: [],
			confidence: 0.5,
			message: 'Set a valid conclusion before asking for a proof hint.'
		});
		return;
	}

	if (solution.indirect) {
		const assumptionRow = solution.proof.find((row) => row.rule.rule === NDRule.CONC);
		addHint(hints, {
			rule: TIP_RULE,
			applicableRows: assumptionRow ? [assumptionRow.line] : [],
			confidence: 0.68,
			message: assumptionRow
				? `This is an indirect proof. Work from row ${assumptionRow.line} and try to derive a contradiction with an existing row.`
				: 'This is an indirect proof. Try to derive a contradiction from the negated conclusion.'
		});
		return;
	}

	if (getBinaryParts(goal, Operator.CONJUNCTION)) {
		addHint(hints, {
			rule: TIP_RULE,
			applicableRows: [],
			confidence: 0.68,
			message: 'For a conjunction goal, try to derive each side separately. Once both are available, use IC.'
		});
		return;
	}

	if (getBinaryParts(goal, Operator.DISJUNCTION)) {
		addHint(hints, {
			rule: TIP_RULE,
			applicableRows: [],
			confidence: 0.68,
			message: 'For a disjunction goal, it is enough to derive either side. Then ID can finish the proof.'
		});
		return;
	}

	if (getBinaryParts(goal, Operator.IMPLICATION)) {
		addHint(hints, {
			rule: TIP_RULE,
			applicableRows: [],
			confidence: 0.68,
			message: 'For an implication goal, focus on deriving the consequent first. Then II can wrap it into the target implication.'
		});
		return;
	}

	if (getBinaryParts(goal, Operator.EQUIVALENCE)) {
		addHint(hints, {
			rule: TIP_RULE,
			applicableRows: [],
			confidence: 0.68,
			message: 'For an equivalence goal, try to derive both directions as implications. IE needs one row for each direction.'
		});
		return;
	}

	if (getQuantifierBody(goal, Operator.UNIVERSAL)) {
		addHint(hints, {
			rule: TIP_RULE,
			applicableRows: [],
			confidence: 0.68,
			message: 'For a universal goal, look for a row that already proves the quantified body in a general form. Then use IU.'
		});
		return;
	}

	if (getQuantifierBody(goal, Operator.EXISTENTIAL)) {
		addHint(hints, {
			rule: TIP_RULE,
			applicableRows: [],
			confidence: 0.68,
			message: 'For an existential goal, try to derive one concrete instance first. Then IEX can introduce the quantifier.'
		});
		return;
	}

	addHint(hints, {
		rule: TIP_RULE,
		applicableRows: [],
		confidence: 0.65,
		message: 'Look for a row that already contains the goal as part of a conjunction, implication, or disjunction. Elimination rules are often the best next step.'
	});
}

export async function getHintRules(): Promise<HintRule[]> {
	const solution = get(solverContent);
	const rows = usableRows(solution.proof);
	const selected = new Set(get(selectedRows));
	const hints: HintRule[] = [];

	if (rows.length === 0) {
		return [];
	}

	addContradictionHint(hints);
	addImmediateGoalHint(hints, rows, selected);
	addConjunctionGoalHints(hints, rows, selected);
	addDisjunctionGoalHints(hints, rows, selected);
	addImplicationGoalHints(hints, rows, selected);
	addEquivalenceGoalHints(hints, rows, selected);
	addUniversalGoalHints(hints, rows, selected);
	addExistentialGoalStrategy(hints, rows, selected);
	addModusPonensHints(hints, rows, selected);
	addConjunctionEliminationHints(hints, rows, selected);
	addDisjunctionEliminationHints(hints, rows, selected);
	addEquivalenceEliminationHints(hints, rows, selected);
	addSelectedRowHints(hints, rows, selected);
	addFallbackStrategyHint(hints);

	return hints.sort((left, right) => right.confidence - left.confidence).slice(0, 5);
}

export async function getTextHint(): Promise<string> {
	const hints = await getHintRules();
	return hints[0]?.message ?? 'No goal-directed hint is available yet.';
}
