import { describe, expect, it } from 'vitest';
import { PrattParser } from '../../src/lib/syntax-checker/PrattParser';
import { ParseStrategy } from '../../src/types/ParseStrategy';

describe('PrattParser diagnostics', () => {
	it('reports unexpected trailing tokens', () => {
		const parser = new PrattParser(ParseStrategy.PROPOSITIONAL);
		const result = parser.parse('A)');

		expect(result).toBeNull();
		expect(parser.lastDiagnostic).toMatchObject({
			message: 'Unexpected trailing token.',
			severity: 'error',
			start: 1,
			end: 2,
			found: ')'
		});
	});

	it('reports incomplete expressions at end of input', () => {
		const parser = new PrattParser(ParseStrategy.PROPOSITIONAL);
		const result = parser.parse('(A ∧ B');

		expect(result).toBeNull();
		expect(parser.lastDiagnostic).toMatchObject({
			message: "Missing closing ')'.",
			severity: 'warning',
			start: 6,
			end: 6,
			found: null
		});
	});

	it('reports invalid quantifier variables precisely', () => {
		const parser = new PrattParser(ParseStrategy.PREDICATE);
		const result = parser.parse('∀(P(a))');

		expect(result).toBeNull();
		expect(parser.lastDiagnostic).toMatchObject({
			message: 'Expected a variable after the quantifier.',
			severity: 'error',
			start: 1,
			end: 2,
			found: '('
		});
	});

	it("reports missing closing ']' inside quantified formulas", () => {
		const parser = new PrattParser(ParseStrategy.PREDICATE);
		const result = parser.parse('∀x[P(x)');

		expect(result).toBeNull();
		expect(parser.lastDiagnostic).toMatchObject({
			message: "Missing closing ']'.",
			severity: 'warning',
			start: 7,
			end: 7,
			found: null
		});
	});

	it('reports empty predicate arguments inside quantified formulas', () => {
		const parser = new PrattParser(ParseStrategy.PREDICATE);
		const result = parser.parse('∀x[P(');

		expect(result).toBeNull();
		expect(parser.lastDiagnostic).toMatchObject({
			message: 'Predicate P requires at least one argument.',
			severity: 'warning',
			start: 5,
			end: 5,
			found: null
		});
	});

	it('reports empty predicate argument lists directly', () => {
		const parser = new PrattParser(ParseStrategy.PREDICATE);
		const result = parser.parse('P()');

		expect(result).toBeNull();
		expect(parser.lastDiagnostic).toMatchObject({
			message: 'Predicate P requires at least one argument.',
			severity: 'error',
			start: 2,
			end: 3,
			found: ')'
		});
	});

	it('reports missing closing parenthesis for functions', () => {
		const parser = new PrattParser(ParseStrategy.PREDICATE);
		const result = parser.parse('f(x,y');

		expect(result).toBeNull();
		expect(parser.lastDiagnostic).toMatchObject({
			message: "Missing closing ')' after function f.",
			severity: 'warning',
			start: 5,
			end: 5,
			found: null
		});
	});

	it('accepts alternative symbols during parsing', () => {
		const parser = new PrattParser(ParseStrategy.PREDICATE);
		const result = parser.parse('@x[P(x) -> ?y[Q(y) & -R(y)]]');

		expect(result).not.toBeNull();
		expect(parser.lastDiagnostic).toBeNull();
	});
});

