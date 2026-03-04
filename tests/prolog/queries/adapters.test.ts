import { beforeEach, describe, expect, it, vi } from 'vitest';
import { solverContent } from '../../../src/stores/solverStore';
import { Solution } from '../../../src/lib/solver/Solution';
import { Node } from '../../../src/lib/syntax-checker/Node';
import { NodeType } from '../../../src/lib/syntax-checker/NodeType';
import { ParseStrategy } from '../../../src/types/ParseStrategy';
import type {
	ArgsTableResult,
	BooleanResult,
	ContradictionResult,
	ProveResult,
	TheoremTableResults
} from '../../../src/types/prolog/PrologResult';

vi.mock('../../../src/prolog/PrologController', () => ({
	PrologController: {
		queryAll: vi.fn(),
		queryOnce: vi.fn(),
		parsePrologCompound: vi.fn((v) => v)
	}
}));

vi.mock('../../../src/types/prolog/Compound', () => ({
	compoundToString: vi.fn((v) => String(v))
}));

import { PrologController } from '../../../src/prolog/PrologController';
import { ProofHandler } from '../../../src/prolog/queries/ProofHandler';
import { ProofTable } from '../../../src/prolog/queries/ProofTable';
import { ArgsTable } from '../../../src/prolog/queries/ArgsTable';
import { TheoremTable } from '../../../src/prolog/queries/TheoremTable';

const prologMock = vi.mocked(PrologController);

describe('prolog query adapters', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		solverContent.set(new Solution('ProofAdapterTest'));
	});

	it('ProofHandler.proveLines creates query and de-duplicates terms', async () => {
		prologMock.queryAll.mockResolvedValueOnce([
			{ X: 'a' },
			{ X: 'a' },
			{ X: 'b' }
		] as ProveResult[]);

		const result = await ProofHandler.proveLines(
			[1, 3],
			{ short: 'MP', title: 'MP', inputSize: 2, outputSize: 1, detail: '' },
			['var(X)']
		);

		expect(prologMock.queryAll).toHaveBeenCalledWith("prove([1,3], X, 'MP', [var(X)]).");
		expect(result).toEqual(['a', 'b']);
	});

	it('ProofHandler.hasContradiction parses boolean from Prolog string', async () => {
		solverContent.update((sc) => {
			sc.proof = [
				{ line: 1, tree: new Node(NodeType.CONSTANT, 'A'), value: 'A', rule: { rule: 'PREM' } }
			];
			return sc;
		});
		prologMock.queryOnce.mockResolvedValueOnce({
			X: null,
			Y: null,
			Z: 'true'
		} as ContradictionResult);

		await expect(ProofHandler.hasContradiction()).resolves.toBe(true);
		expect(prologMock.queryOnce).toHaveBeenCalledWith("conflict_handler([const('A')], X, Y, Z).");
	});

	it('ProofHandler.substitute returns empty string when no result exists', async () => {
		prologMock.queryOnce.mockResolvedValueOnce(null);

		await expect(ProofHandler.substitute("const('A')", ['var(X)'], ['const(a)'])).resolves.toBe('');
	});

	it('ProofTable.get and boolean helpers handle null and success paths', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		prologMock.queryOnce.mockResolvedValueOnce(null);
		prologMock.queryOnce.mockResolvedValueOnce({ success: true } as BooleanResult);
		prologMock.queryOnce.mockResolvedValueOnce(null);

		await expect(ProofTable.get(4)).resolves.toBeNull();
		await expect(ProofTable.canDeleteRow(1)).resolves.toBe(true);
		await expect(ProofTable.isExistentialEliminationValid()).resolves.toBe(false);
		expect(warn).toHaveBeenCalledWith('No proof found for line 4');
	});

	it('ArgsTable.getMatching normalizes nodes and returns unique values', async () => {
		const fromPrologSpy = vi
			.spyOn(Node, 'fromPrologFormat')
			.mockImplementation((f) => new Node(NodeType.CONSTANT, f));
		const generateSpy = vi.spyOn(Node, 'generateString').mockImplementation((n) => String(n.value));

		prologMock.queryOnce.mockResolvedValueOnce({
			X: [{ 2: ["const('A')", "const('B')"] }, { 2: ["const('A')"] }]
		} as unknown as ArgsTableResult);

		await expect(ArgsTable.getMatching('predicate(p)')).resolves.toEqual([
			"const('A')",
			"const('B')"
		]);
		expect(prologMock.queryOnce).toHaveBeenCalledWith(
			'args_table_extract_from_term_and_get(predicate(p), X).'
		);
		expect(fromPrologSpy).toHaveBeenCalled();
		expect(generateSpy).toHaveBeenCalled();
	});

	it('TheoremTable lookup/getAll use expected query strings and null guards', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		prologMock.queryOnce.mockResolvedValueOnce(null);
		prologMock.queryOnce.mockResolvedValueOnce({
			X: [{ 0: 1, 1: 'A', 2: 'PREM', 3: [], 4: [] }]
		} as unknown as TheoremTableResults);

		await expect(TheoremTable.lookup('Reflexive', ParseStrategy.PREDICATE)).resolves.toBeNull();
		await expect(TheoremTable.getAll(ParseStrategy.PREDICATE)).resolves.toEqual([
			{ 0: 1, 1: 'A', 2: 'PREM', 3: [], 4: [] }
		]);
		expect(prologMock.queryOnce).toHaveBeenNthCalledWith(
			1,
			"theorem_table_lookup('Reflexive', 'PREDICATE', X)."
		);
		expect(prologMock.queryOnce).toHaveBeenNthCalledWith(
			2,
			"theorem_table_get_all(X, 'PREDICATE')."
		);
		expect(warn).toHaveBeenCalledWith('No theorem found for Reflexive');
	});
});
