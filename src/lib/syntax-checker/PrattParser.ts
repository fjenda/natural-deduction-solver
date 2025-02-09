// Formula -> SimpleFormula FormulaPrime
// FormulaPrime -> LogicalOp SimpleFormula FormulaPrime | ε
// FormulaSimple -> '[' Formula ']'
//                | '(' Formula ')'
//                | '!' Formula
//                | Quantifier Small Formula
//                | Predicate '(' TermList ')'
//                | Constant
//
// LogicalOp -> '&' | '|' | '>' | '='
// Quantifier -> '@' | '?'
// TermList -> Term TermListTail
// TermListTail -> ',' Term TermListTail | ε
// Term -> Function '(' TermList ')'
// Predicate -> Large | Small
// Function -> Small
// Constant -> [a-g]
// Variable -> [h-z]
// Large -> [A-Z]
// Small -> [a-z]

import { TokenStream } from "./TokenStream";
import { Node } from "./Node"
import { NodeType } from "./NodeType";
import { Operator } from "./Operator";
import { ParseStrategy } from "../../types/ParseStrategy";

/**
 * Precedence table for operators
 */
const PRECEDENCE: { [key: string]: number } = {
    "≡": 1,
    "⊃": 2,
    "∨": 3,
    "∧": 4,
    "¬": 5,
};

const THROW_ERRORS = false;

/**
 * PrattParser class
 * This class is used to parse a formula using the Pratt parsing algorithm
 * The algorithm is based on the precedence of the operators
 */
export class PrattParser {
    private tokenStream!: TokenStream;
    private readonly strategy!: ParseStrategy;

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
        this.tokenStream = new TokenStream(formula);
        const tree = this.parseExpression(0);

        if (!this.tokenStream.isAtEnd()) {
            if (THROW_ERRORS) {
                throw new Error("Unexpected token: " + this.tokenStream.current());
            }

            return null;
        }

        // console.log(tree);
        return tree;
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
        this.tokenStream.advance();

        if (!token) return null;

        // small character
        if (/[a-z]/.test(token)) {
            // function or constant
            if (this.tokenStream.match("(") && this.strategy === ParseStrategy.PREDICATE) {
                const termList = this.parseTermList();
                if (!this.tokenStream.match(")")) {
                    if (THROW_ERRORS) {
                        throw new Error("Expected ) after term list in function call");
                    }

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
            if (this.strategy !== ParseStrategy.PREDICATE) {
                return new Node(NodeType.CONSTANT, token);
            }

            // variable
            return new Node(NodeType.VARIABLE, token);
        }

        if (token.match(/[A-Z]/)) {
            if (this.tokenStream.match("(") && this.strategy === ParseStrategy.PREDICATE) {
                const termList = this.parseTermList();
                if (!this.tokenStream.match(")")) {
                    if (THROW_ERRORS) {
                        throw new Error("Expected ) after term list in predicate call");
                    }

                    return null;
                }

                if (!termList) {
                    if (THROW_ERRORS) {
                        throw new Error("Expected term list in predicate call");
                    }

                    return null;
                }

                const node = new Node(NodeType.PREDICATE, token);
                node.children.push(termList!);

                return node;
            }

            if (THROW_ERRORS && this.strategy === ParseStrategy.PREDICATE) {
                throw new Error("Expected '(' after predicate " + token);
            }

            if (this.strategy === ParseStrategy.PREDICATE) {
                return null;
            }

            return new Node(NodeType.CONSTANT, token);
        }
        
        if (["∀", "∃"].includes(token) && this.strategy === ParseStrategy.PREDICATE) {
            const node = new Node(NodeType.QUANTIFIER);
            node.children.push(new Node(NodeType.QUANTIFIER_OPERATOR, token));

            const variable = this.parseVariable();
            if (!variable) {
                if (THROW_ERRORS) {
                    throw new Error("Expected variable after quantifier " + token);
                }

                return null;
            }
            node.children.push(variable);

            const formula = this.parseExpression(0);
            if (!formula) {
                if (THROW_ERRORS) {
                    throw new Error("Expected formula after quantifier " + token);
                }

                return null;
            }
            node.children.push(formula);

            return node;
        }

        if (["¬"].includes(token)) {
            const right = this.parseExpression(PRECEDENCE[token]);
            if (!right) {
                if (THROW_ERRORS) {
                    throw new Error("Expected right side of unary operation");
                }

                return null;
            }

            const node = new Node(NodeType.NEGATION, token);
            node.children.push(right);

            return node;
        }

        if (token === "(") {
            const inner = this.parseExpression(0);
            if (!this.tokenStream.match(")")) {
                if (THROW_ERRORS) {
                    throw new Error("Expected )");
                }

                return null;
            }

            const parenNode = new Node(NodeType.PARENTHESES_BLOCK);
            parenNode.children.push(new Node(NodeType.PARENTHESIS, Operator.LPAR), inner!, new Node(NodeType.PARENTHESIS, Operator.RPAR));

            return parenNode;
        }

        if (token === "[") {
            const inner = this.parseExpression(0);
            if (!this.tokenStream.match("]")) {
                if (THROW_ERRORS) {
                    throw new Error("Expected ]");
                }

                return null;
            }

            const bracketNode = new Node(NodeType.BRACKETS_BLOCK);
            bracketNode.children.push(new Node(NodeType.BRACKET, Operator.LBRACKET), inner!, new Node(NodeType.BRACKET, Operator.RBRACKET));

            return bracketNode;
        }

        this.tokenStream.restore(beforeToken);
        return null;
        // throw new Error(`Unexpected token: ${token}`);
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
                if (THROW_ERRORS) {
                    throw new Error("Expected right side of binary operation");
                }

                return null;
            }

            const node = new Node(NodeType.BINARY_OPERATION, operator);
            node.children.push(left, right);

            return node;
        }

        if (THROW_ERRORS) {
            throw new Error(`Unknown operator: ${operator}`);
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

        const term = this.parseExpression(0);

        if (!term) {
            if (THROW_ERRORS) {
                throw new Error("Expected at least one term in TermList");
            }

            return null;
        }
        node.children.push(term!);

        while (this.tokenStream.match(",")) {
            const nextTerm = this.parseExpression(0);
            if (!nextTerm) {
                if (THROW_ERRORS) {
                    throw new Error("Expected term after ',' in TermList");
                }

                return null;
            }
            node.children.push(nextTerm!);
        }

        return node;
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

    /**
     * Get the precedence of the current token
     * @returns the precedence of the current token
     * @private
     */
    private getPrecedence(): number {
        const token = this.tokenStream.current();
        if (!token) return 0;

        return PRECEDENCE[token] || 0 ? PRECEDENCE[token] : 0;
    }
}