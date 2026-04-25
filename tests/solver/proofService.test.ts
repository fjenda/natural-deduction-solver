import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/prolog/queries/ProofHandler', () => ({
	ProofHandler: {
		prove: vi.fn(),
		proveLines: vi.fn()
	}
}));

vi.mock('../../src/lib/utils/showToast', () => ({
	showToast: vi.fn()
}));

import { provePrologLines, verifyProlog } from '../../src/lib/solver/services/proofService';
import { ProofHandler } from '../../src/prolog/queries/ProofHandler';
import { showToast } from '../../src/lib/utils/showToast';

const proofHandlerMock = vi.mocked(ProofHandler);
const toastMock = vi.mocked(showToast);

const mpRule = {
	short: 'MP',
	title: 'Modus Ponens',
	inputSize: 2,
	outputSize: 1,
	detail: ''
};

const existentialEliminationRule = {
	short: 'EEX',
	title: 'Elimination of Existential Quantifier',
	inputSize: 1,
	outputSize: 1,
	detail: ''
};

describe('proofService feedback', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('shows a generic toast when an interactive rule is not applicable', async () => {
		proofHandlerMock.proveLines.mockResolvedValueOnce([]);

		await provePrologLines([1, 2], mpRule, []);

		expect(toastMock).toHaveBeenCalledWith(
			'Rule MP is not applicable to the selected rows.',
			'error'
		);
	});

	it('keeps specialized quantifier failure messages when verification returns no result', async () => {
		proofHandlerMock.prove.mockResolvedValueOnce([]);

		const result = await verifyProlog([], existentialEliminationRule, [], {
			toPrologFormat: () => 'predicate(p)',
			simplify: () => ({ toPrologFormat: () => 'predicate(p)' }),
			equals: () => false
		} as never);

		expect(result).toBe(false);
		expect(toastMock).toHaveBeenCalledWith(
			'The constant is not fresh! It already appears in the proof.',
			'error'
		);
	});

	it('shows a direct message when the entered formula does not match the rule result', async () => {
		proofHandlerMock.prove.mockResolvedValueOnce(['predicate(q)']);

		const result = await verifyProlog([], mpRule, [], {
			toPrologFormat: () => 'predicate(p)',
			simplify: () => ({ toPrologFormat: () => 'predicate(p)' }),
			equals: () => false
		} as never);

		expect(result).toBe(false);
		expect(toastMock).toHaveBeenCalledWith(
			'The entered formula does not follow from the cited rows by rule MP.',
			'error'
		);
	});
});
