import { get } from 'svelte/store';
import { Solution } from '../solver/Solution';
import { ParseStrategy } from '../../types/ParseStrategy';
import type { ParsedExpression } from '../../types/ParsedExpression';
import type { TreeRuleType } from '../../types/TreeRuleType';
import type { AppliedRule } from '../../types/AppliedRule';
import { Node } from '../syntax-checker/Node';
import { PrattParser } from '../syntax-checker/PrattParser';
import { editState, solving } from '../../stores/stateStore';
import { EditState } from '../../types/EditState';
import { indirectSolving, logicMode, solverBackup, solverContent } from '../../stores/solverStore';
import { selectedTheorem, theorems } from '../../stores/theoremsStore';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type PersistedProofStep = {
	line: number;
	value: string;
	rule: AppliedRule;
};

type PersistedSolution = {
	name: string;
	premises: string[];
	conclusion: string;
	whole: string;
	proof?: PersistedProofStep[];
	indirect: boolean;
	contradiction: boolean;
};

type PersistedTheorem = {
	solution: PersistedSolution;
	mode: ParseStrategy;
};

type PersistedState = {
	version: number;
	logicMode: ParseStrategy;
	indirectSolving: boolean;
	solver: PersistedSolution;
	solverBackup: PersistedSolution;
	theorems: PersistedTheorem[];
};

export type PersistenceProvider = {
	hydrate: () => boolean;
	start: () => () => void;
	clear: () => void;
};

export const persistenceContextKey = Symbol('persistence-provider');

const STORAGE_KEY = 'natural-deduction-solver:state:v1';
const STORAGE_VERSION = 1;

const hasStorage = (storage: StorageLike | null): storage is StorageLike => storage !== null;

const isParseStrategy = (value: unknown): value is ParseStrategy => {
	return Object.values(ParseStrategy).includes(value as ParseStrategy);
};

const getStorage = (storage?: StorageLike): StorageLike | null => {
	if (storage) return storage;
	if (typeof window === 'undefined') return null;
	return window.localStorage;
};

const parseExpression = (value: string, mode: ParseStrategy): ParsedExpression => {
	const expression: ParsedExpression = {
		value,
		tree: null
	};

	if (value === '') return expression;

	const parser = new PrattParser(mode);
	const parsed = parser.parse(value.replace(/\s/g, ''));

	if (!parsed) return expression;

	const tree = parsed.simplify().parenthesize();
	expression.tree = tree;
	expression.value = Node.generateString(tree);

	return expression;
};

const normalizeRule = (value: unknown): AppliedRule | null => {
	if (!value || typeof value !== 'object') return null;
	const source = value as Partial<AppliedRule>;
	if (typeof source.rule !== 'string') return null;

	const rawLines = (value as { lines?: unknown }).lines;
	const rawReplacements = (value as { replacements?: unknown }).replacements;
	const lines = Array.isArray(rawLines)
		? rawLines.filter((line): line is number => typeof line === 'number' && Number.isFinite(line))
		: [];
	const replacements = Array.isArray(rawReplacements)
		? rawReplacements.filter(
				(replacement): replacement is string => typeof replacement === 'string'
			)
		: [];

	return {
		rule: source.rule,
		lines,
		replacements
	};
};

const normalizeProof = (value: unknown): PersistedProofStep[] => {
	if (!Array.isArray(value)) return [];

	const proof: PersistedProofStep[] = [];
	for (const [index, row] of value.entries()) {
		if (!row || typeof row !== 'object') continue;
		const source = row as Partial<PersistedProofStep>;
		if (typeof source.value !== 'string') continue;

		const rule = normalizeRule(source.rule);
		if (!rule) continue;

		proof.push({
			line:
				typeof source.line === 'number' && Number.isFinite(source.line) ? source.line : index + 1,
			value: source.value,
			rule
		});
	}

	return proof;
};

const serializeProofStep = (step: TreeRuleType): PersistedProofStep => ({
	line: step.line,
	value: step.value,
	rule: {
		rule: step.rule.rule,
		lines: step.rule.lines ? [...step.rule.lines] : [],
		replacements: step.rule.replacements ? [...step.rule.replacements] : []
	}
});

const deserializeProofStep = (
	step: PersistedProofStep,
	mode: ParseStrategy,
	index: number
): TreeRuleType => {
	const parsed = parseExpression(step.value, mode);
	return {
		line: step.line > 0 ? step.line : index + 1,
		value: parsed.value,
		tree: parsed.tree,
		rule: step.rule
	};
};

const serializeSolution = (solution: Solution): PersistedSolution => ({
	name: solution.name,
	premises: solution.premises.map((premise) => premise.value),
	conclusion: solution.conclusion.value,
	whole: solution.whole.value,
	proof: solution.proof.map((step) => serializeProofStep(step)),
	indirect: solution.indirect,
	contradiction: solution.contradiction
});

const deserializeSolution = (persisted: PersistedSolution, mode: ParseStrategy): Solution => {
	const solution = new Solution(persisted.name || 'Unnamed');
	solution.premises = persisted.premises.map((premise) => parseExpression(premise, mode));
	solution.conclusion = parseExpression(persisted.conclusion, mode);
	solution.whole = parseExpression(persisted.whole, mode);
	solution.indirect = persisted.indirect;
	solution.contradiction = persisted.contradiction;
	solution.proof = (persisted.proof ?? []).map((step, index) =>
		deserializeProofStep(step, mode, index)
	);
	return solution;
};

const normalizePersistedSolution = (value: unknown): PersistedSolution | null => {
	if (!value || typeof value !== 'object') return null;

	const source = value as Partial<PersistedSolution>;
	if (typeof source.name !== 'string') return null;
	const rawPremises = (value as { premises?: unknown }).premises;
	if (!Array.isArray(rawPremises)) return null;
	if (typeof source.conclusion !== 'string') return null;
	if (typeof source.whole !== 'string') return null;

	const premises = rawPremises.filter((premise): premise is string => typeof premise === 'string');

	return {
		name: source.name,
		premises,
		conclusion: source.conclusion,
		whole: source.whole,
		proof: normalizeProof(source.proof),
		indirect: Boolean(source.indirect),
		contradiction: Boolean(source.contradiction)
	};
};

const normalizePersistedState = (value: unknown): PersistedState | null => {
	if (!value || typeof value !== 'object') return null;

	const source = value as Partial<PersistedState>;
	if (source.version !== STORAGE_VERSION) return null;
	if (!isParseStrategy(source.logicMode)) return null;

	const solver = normalizePersistedSolution(source.solver);
	const solverBackup = normalizePersistedSolution(source.solverBackup);
	if (!solver || !solverBackup) return null;

	const persistedTheorems = Array.isArray(source.theorems) ? source.theorems : [];
	const normalizedTheorems: PersistedTheorem[] = [];

	for (const theorem of persistedTheorems) {
		if (!theorem || typeof theorem !== 'object') continue;
		const parsedTheorem = theorem as Partial<PersistedTheorem>;
		if (!isParseStrategy(parsedTheorem.mode)) continue;
		const parsedSolution = normalizePersistedSolution(parsedTheorem.solution);
		if (!parsedSolution) continue;
		normalizedTheorems.push({
			solution: parsedSolution,
			mode: parsedTheorem.mode
		});
	}

	return {
		version: STORAGE_VERSION,
		logicMode: source.logicMode,
		indirectSolving: Boolean(source.indirectSolving),
		solver,
		solverBackup,
		theorems: normalizedTheorems
	};
};

export const createPersistenceProvider = (storage?: StorageLike): PersistenceProvider => {
	const resolvedStorage = getStorage(storage);

	const readState = (): PersistedState | null => {
		if (!hasStorage(resolvedStorage)) return null;

		const raw = resolvedStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		try {
			const parsed = JSON.parse(raw) as unknown;
			const normalized = normalizePersistedState(parsed);
			if (normalized) return normalized;
			resolvedStorage.removeItem(STORAGE_KEY);
			return null;
		} catch {
			resolvedStorage.removeItem(STORAGE_KEY);
			return null;
		}
	};

	const writeState = () => {
		if (!hasStorage(resolvedStorage)) return;

		const state: PersistedState = {
			version: STORAGE_VERSION,
			logicMode: get(logicMode),
			indirectSolving: get(indirectSolving),
			solver: serializeSolution(get(solverContent)),
			solverBackup: serializeSolution(get(solverBackup)),
			theorems: get(theorems).map((theorem) => ({
				solution: serializeSolution(theorem.solution),
				mode: theorem.mode
			}))
		};

		resolvedStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	};

	const hydrate = (): boolean => {
		const state = readState();
		if (!state) return false;

		logicMode.set(state.logicMode);
		solverContent.set(deserializeSolution(state.solver, state.logicMode));
		solverBackup.set(deserializeSolution(state.solverBackup, state.logicMode));
		theorems.set(
			state.theorems.map((theorem) => ({
				solution: deserializeSolution(theorem.solution, theorem.mode),
				mode: theorem.mode
			}))
		);
		selectedTheorem.set(-1);
		editState.set(EditState.SOLVER);
		indirectSolving.set(state.indirectSolving);
		solving.set(false);

		return true;
	};

	const start = (): (() => void) => {
		if (!hasStorage(resolvedStorage)) return () => {};

		const unsubscribe = [
			solverContent.subscribe(() => writeState()),
			solverBackup.subscribe(() => writeState()),
			theorems.subscribe(() => writeState()),
			logicMode.subscribe(() => writeState()),
			indirectSolving.subscribe(() => writeState())
		];

		return () => {
			unsubscribe.forEach((stop) => stop());
		};
	};

	const clear = () => {
		if (!hasStorage(resolvedStorage)) return;
		resolvedStorage.removeItem(STORAGE_KEY);
	};

	return {
		hydrate,
		start,
		clear
	};
};

export const appPersistence = createPersistenceProvider();
