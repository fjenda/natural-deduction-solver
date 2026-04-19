import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/prolog/queries/ProofTable', () => ({
	ProofTable: {
		edit: vi.fn()
	}
}));

vi.mock('../../src/lib/utils/showToast', () => ({
	showToast: vi.fn()
}));

import { PremiseParser } from '../../src/lib/solver/parsers/PremiseParser';
import { FormulaParser } from '../../src/lib/solver/parsers/FormulaParser';
import { Solution } from '../../src/lib/solver/Solution';
import { getRulePickerOptions } from '../../src/lib/solver/utils/rulePresentation';
import { ProofTable } from '../../src/prolog/queries/ProofTable';
import { logicMode, solverContent } from '../../src/stores/solverStore';
import { theorems } from '../../src/stores/theoremsStore';
import { editState } from '../../src/stores/stateStore';
import { ParseStrategy } from '../../src/types/ParseStrategy';
import { EditState } from '../../src/types/EditState';
import { showToast } from '../../src/lib/utils/showToast';

function makeSolvedTheorem(name: string, formula: string, mode = ParseStrategy.PREDICATE) {
	const parsed = PremiseParser.parsePremise(formula, ParseStrategy.THEOREM);
	const theorem = new Solution(name);
	const rowRule = { rule: 'PREM', lines: [], replacements: [] };

	theorem.name = name;
	theorem.whole = parsed;
	theorem.conclusion = parsed;
	theorem.proof = [
		{
			line: 1,
			value: parsed.value,
			tree: parsed.tree,
			rule: rowRule
		}
	];

	return { solution: theorem, mode };
}

describe('theorem rule support', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		logicMode.set(ParseStrategy.PREDICATE);
		editState.set(EditState.SOLVER);
		solverContent.set(new Solution('Current'));
		theorems.reset();
	});

	it('uses theorem parsing automatically while editing a predicate theorem', () => {
		editState.set(EditState.THEOREM);

		const parsed = PremiseParser.parsePremise('A ⊃ A');

		expect(parsed.tree).not.toBeNull();
		expect(parsed.diagnostic).toBeUndefined();
	});

	it('does not expose saved theorems in the built-in rule picker metadata', () => {
		theorems.set([
			makeSolvedTheorem('Self Implication', 'A ⊃ A'),
			{ solution: new Solution('Draft theorem'), mode: ParseStrategy.PREDICATE }
		]);

		const options = getRulePickerOptions();
		const pickerOption = options.find((option) => option.code === 'Self Implication');

		expect(pickerOption).toBeUndefined();
	});

	it('rejects theorem names entered directly as row rules', async () => {
		theorems.set([makeSolvedTheorem('Self Implication', 'A ⊃ A')]);

		const result = await FormulaParser.parseFormula('P(a) ⊃ P(a)', 1, {
			rule: 'Self Implication',
			lines: [99],
			replacements: [{ value: 'unused' }]
		});

		expect(result.rule).toEqual({ rule: 'x' });
		expect(vi.mocked(showToast)).toHaveBeenCalledWith(
			"Rule Self Implication doesn't exist",
			'error'
		);
		expect(vi.mocked(ProofTable.edit)).not.toHaveBeenCalled();
	});
});

