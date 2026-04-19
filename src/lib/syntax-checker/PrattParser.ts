// Parser-faithful grammar over normalized tokens (see TokenStream for ASCII aliases):
// Formula      ::= Equiv
// Equiv        ::= Impl ( '≡' Impl )*
// Impl         ::= Or ( '⊃' Or )*
// Or           ::= And ( '∨' And )*
// And          ::= Prefix ( '∧' Prefix )*
// Prefix       ::= '¬' Prefix | Quantified | Primary
// Quantified   ::= ('∀' | '∃') Variable Prefix
//                // quantified bodies bind only a prefix form; larger bodies must be wrapped in [] or ()
// Primary      ::= '(' Formula ')' | '[' Formula ']' | Atomic
// Atomic (PROP):: Upper | Lower
// Atomic (PRED):: Upper '(' NonEmptyTermList ')' | Lower | Lower '(' [ TermList ] ')'
// Atomic (THEOREM)
//              ::= Upper [ '(' NonEmptyTermList ')' ]
//               | Lower
//               | Lower '(' [ TermList ] ')'
// TermList     ::= Term ( ',' Term )*
// Term         ::= Lower '(' TermList ')' | Lower
// Variable     ::= Lower
// Upper        ::= [A-Z]
// Lower        ::= [a-z]

import { TokenStream } from './TokenStream';
import { Node } from './Node';
import { NodeType } from './NodeType';
import { Operator } from './Operator';
import { ParseStrategy } from '../../types/ParseStrategy';
import type { ParseDiagnostic } from '../../types/ParseDiagnostic';

/**
 * Precedence table for operators
 */
const PRECEDENCE: { [key: string]: number } = {
	'≡': 1,
	'⊃': 2,
	'∨': 3,
	'∧': 4,
	'¬': 5
};

// const THROW_ERRORS = false;

/**
 * PrattParser class
 * This class is used to parse a formula using the Pratt parsing algorithm
 * The algorithm is based on the precedence of the operators
 */
export class PrattParser {
	private tokenStream!: TokenStream;
	private readonly strategy!: ParseStrategy;
	private diagnostic: ParseDiagnostic | null = null;
	private source = '';

	/**
	 * Constructor for the PrattParser
	 * @param strategy - the strategy to use for parsing
	 * @constructor
	 */
	constructor(strategy: ParseStrategy) {
		this.strategy = strategy;
	}

	/**
	 * Parse a formula
	 * @param formula - the formula to parse
	 * @returns the root of the parsed tree
	 */
	parse(formula: string): Node | null {
		this.source = formula;
		this.tokenStream = new TokenStream(formula);
		this.diagnostic = null;

		const tree = this.parseExpression(0);
		if (!tree) {
			if (!this.diagnostic) {
				this.recordDiagnostic('Unable to parse formula.', ['valid formula']);
			}
			return null;
		}

		if (!this.tokenStream.isAtEnd()) {
			this.recordDiagnostic('Unexpected trailing token.', ['end of input']);
			return null;
		}

		return tree;
	}

	get lastDiagnostic(): ParseDiagnostic | null {
		return this.diagnostic;
	}

	/**
	 * Parse an expression with a given precedence
	 * @param precedence - the precedence of the current operator
	 * @returns the parsed node or null if the expression is not valid
	 * @private
	 */
	private parseExpression(precedence: number): Node | null {
		let left = this.parseToken();

		if (!left) return null;

		while (!this.tokenStream.isAtEnd() && precedence < this.getPrecedence()) {
			const token = this.tokenStream.current();
			this.tokenStream.advance();
			left = this.parseLed(token!, left!);

			if (!left) {
				return null;
			}
		}

		return left;
	}

	/**
	 * Parse a token
	 * @returns the parsed node or null if the token is not recognized
	 * @private
	 */
	private parseToken(): Node | null {
		const token = this.tokenStream.current();
		const beforeToken = this.tokenStream.save();

		if (!token) {
			this.recordDiagnostic('Unexpected end of input.', ['formula']);
			return null;
		}

		this.tokenStream.advance();

		// small character
		if (/[a-z]/.test(token)) {
			// function or constant
			if (this.tokenStream.match('(') && this.strategy === ParseStrategy.PREDICATE) {
				if (!this.tokenStream.current()) {
					this.recordDiagnostic(`Missing closing ')' after function ${token}.`, [')']);
					return null;
				}

				const termList = this.parseTermList();
				if (!this.tokenStream.match(')')) {
					this.recordDiagnostic(`Missing closing ')' after function ${token}.`, [')']);
					return null;
				}

				// empty termlist -> constant
				if (!termList) {
					return new Node(NodeType.CONSTANT, token);
				}

				// function
				const node = new Node(NodeType.FUNCTION, token);
				node.children.push(termList);
				return node;
			}

			// constant if not in predicate mode
			if (this.strategy === ParseStrategy.PROPOSITIONAL) {
				return new Node(NodeType.CONSTANT, token);
			}

			// variable
			return new Node(NodeType.VARIABLE, token);
		}

		if (token.match(/[A-Z]/)) {
			if (
				this.tokenStream.match('(') &&
				[ParseStrategy.PREDICATE, ParseStrategy.THEOREM].includes(this.strategy)
			) {
				if (!this.tokenStream.current() || this.tokenStream.current() === ')') {
					this.recordDiagnostic(`Predicate ${token} requires at least one argument.`, ['term']);
					return null;
				}

				const termList = this.parseTermList();
				if (!termList) {
					this.recordDiagnostic(`Predicate ${token} requires at least one argument.`, ['term']);
					return null;
				}

				if (!this.tokenStream.match(')')) {
					this.recordDiagnostic(`Missing closing ')' after predicate ${token}.`, [')']);
					return null;
				}

				const node = new Node(NodeType.PREDICATE, token);
				node.children.push(termList!);

				return node;
			}

			if (this.strategy === ParseStrategy.THEOREM) {
				return new Node(NodeType.PREDICATE, token);
			}

			if (this.strategy === ParseStrategy.PREDICATE) {
				this.recordDiagnostic(
					`Predicate ${token} requires parentheses with at least one argument in predicate mode.`,
					['(']
				);
				return null;
			}

			return new Node(NodeType.CONSTANT, token);
		}

		if (
			['∀', '∃'].includes(token) &&
			[ParseStrategy.PREDICATE, ParseStrategy.THEOREM].includes(this.strategy)
		) {
			const node = new Node(NodeType.QUANTIFIER);
			node.children.push(new Node(NodeType.QUANTIFIER_OPERATOR, token));

			const variable = this.parseVariable();
			if (!variable) {
				this.recordDiagnostic('Expected a variable after the quantifier.', ['variable']);
				return null;
			}
			node.children.push(variable);

			const formula = this.parseToken();
			if (!formula) {
				this.recordDiagnostic('Expected a formula after the quantifier variable.', ['formula']);
				return null;
			}
			node.children.push(formula);

			return node;
		}

		if (['¬'].includes(token)) {
			const right = this.parseExpression(PRECEDENCE[token]);
			if (!right) {
				this.recordDiagnostic('Expected a formula after negation.', ['formula']);
				return null;
			}

			const node = new Node(NodeType.NEGATION, token);
			node.children.push(right);

			return node;
		}

		if (token === '(') {
			const inner = this.parseExpression(0);
			if (!inner) {
				return null;
			}

			if (!this.tokenStream.match(')')) {
				this.recordDiagnostic(`Missing closing ')'.`, [')']);
				return null;
			}

			const parenNode = new Node(NodeType.PARENTHESES_BLOCK);
			parenNode.children.push(
				new Node(NodeType.PARENTHESIS, Operator.LPAR),
				inner!,
				new Node(NodeType.PARENTHESIS, Operator.RPAR)
			);

			return parenNode;
		}

		if (token === '[') {
			const inner = this.parseExpression(0);
			if (!inner) {
				return null;
			}

			if (!this.tokenStream.match(']')) {
				this.recordDiagnostic(`Missing closing ']'.`, [']']);
				return null;
			}

			const bracketNode = new Node(NodeType.BRACKETS_BLOCK);
			bracketNode.children.push(
				new Node(NodeType.BRACKET, Operator.LBRACKET),
				inner!,
				new Node(NodeType.BRACKET, Operator.RBRACKET)
			);

			return bracketNode;
		}

		this.tokenStream.restore(beforeToken);
		this.recordDiagnostic(`Unexpected token '${token}'.`, [
			'formula',
			'predicate',
			'variable',
			'constant'
		]);
		return null;
	}

	/**
	 * Parse a token that is a led (left denotation)
	 * @param operator - the operator
	 * @param left - the left node
	 * @returns the parsed node or null if the token is not recognized
	 * @private
	 */
	private parseLed(operator: string, left: Node): Node | null {
		const precedence = PRECEDENCE[operator] || 0;

		if (operator.match(/[∧∨⊃≡]/)) {
			const right = this.parseExpression(precedence);

			if (!right) {
				this.recordDiagnostic(`Expected a formula after '${operator}'.`, ['formula']);
				return null;
			}

			const node = new Node(NodeType.BINARY_OPERATION, operator);
			node.children.push(left, right);

			return node;
		}

		return null;
	}

	/**
	 * Parse a term list
	 * @returns the parsed node or null if the term list is not valid
	 * @private
	 */
	private parseTermList(): Node | null {
		const node = new Node(NodeType.TERM_LIST);

		const term = this.parseTerm();

		if (!term) {
			return null;
		}
		node.children.push(term);

		while (this.tokenStream.match(',')) {
			const nextTerm = this.parseTerm();
			if (!nextTerm) {
				this.recordDiagnostic('Expected a term after the comma.', ['term']);
				return null;
			}
			node.children.push(nextTerm);
		}

		return node;
	}

	/**
	 * Parse a single term (variable, constant, or function application)
	 * @returns the parsed node or null if the term is not valid
	 * @private
	 */
	private parseTerm(): Node | null {
		const token = this.tokenStream.current();

		if (!token || !/[a-z]/.test(token)) {
			this.recordDiagnostic('Expected a term.', ['term']);
			return null;
		}

		this.tokenStream.advance();

		// function application: f(t1, t2, ...)
		if (this.tokenStream.match('(')) {
			if (!this.tokenStream.current()) {
				this.recordDiagnostic(`Missing closing ')' after function ${token}.`, [')']);
				return null;
			}

			const termList = this.parseTermList();

			if (!this.tokenStream.match(')')) {
				this.recordDiagnostic(`Missing closing ')' after function ${token}.`, [')']);
				return null;
			}

			// empty termlist -> constant
			if (!termList) {
				return new Node(NodeType.CONSTANT, token);
			}

			const node = new Node(NodeType.FUNCTION, token);
			node.children.push(termList);
			return node;
		}

		// bare lowercase: variable
		return new Node(NodeType.VARIABLE, token);
	}

	/**
	 * Parse a variable
	 * @returns the parsed node or null if the variable is not valid
	 * @private
	 */
	private parseVariable(): Node | null {
		const token = this.tokenStream.current();

		if (token && token.match(/[a-z]/)) {
			this.tokenStream.advance();
			return new Node(NodeType.VARIABLE, token);
		}

		return null;
	}

	private recordDiagnostic(message: string, expected: string[] = []): void {
		const { start, end } = this.tokenStream.currentSpan();
		const found = this.tokenStream.currentInfo()?.raw ?? this.tokenStream.current();
		const severity = found ? 'error' : 'warning';

		if (
			this.diagnostic &&
			(start < this.diagnostic.start ||
				(start === this.diagnostic.start && end <= this.diagnostic.end))
		) {
			return;
		}

		this.diagnostic = {
			message,
			severity,
			start,
			end,
			source: this.source,
			found,
			expected
		};
	}

	/**
	 * Get the precedence of the current token
	 * @returns the precedence of the current token
	 * @private
	 */
	private getPrecedence(): number {
		const token = this.tokenStream.current();
		if (!token) return 0;

		return PRECEDENCE[token] ?? 0;
	}
}
