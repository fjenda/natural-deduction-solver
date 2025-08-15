/**
 * Operator.test.ts
 * Unit tests for Operator class
 */

import { expect, test } from 'vitest';
import {
	Operator,
	operatorToProlog,
	operatorFromProlog
} from '../../../src/lib/syntax-checker/Operator';

const ops = [
	Operator.CONJUNCTION,
	Operator.DISJUNCTION,
	Operator.IMPLICATION,
	Operator.EQUIVALENCE,
	Operator.NEGATION,
	Operator.UNIVERSAL,
	Operator.EXISTENTIAL,
	Operator.LPAR,
	Operator.RPAR
];

const prologOps = ['and', 'or', 'imp', 'eq', 'not', 'forall', 'exists', '(', ')'];

test('Operator to Prolog', () => {
	ops.forEach((op, index) => {
		expect(operatorToProlog(op)).toBe(prologOps[index]);
	});
});

test('Operator from Prolog', () => {
	prologOps.forEach((op, index) => {
		expect(operatorFromProlog(op)).toBe(ops[index]);
	});
});
