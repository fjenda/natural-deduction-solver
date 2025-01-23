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

import {TokenStream} from "./TokenStream";
import {Node} from "./Node"
import {NodeType} from "./NodeType";
import {Operator} from "./Operator";


const PRECEDENCE: { [key: string]: number } = {
    "=": 1,
    "≡": 1,
    ">": 2,
    "⊃": 2,
    "|": 3,
    "∨": 3,
    "&": 4,
    "∧": 4,
    "!": 5,
    "¬": 5,
};

const THROW_ERRORS = false;

export class PrattParser {
    private tokenStream!: TokenStream;

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

    private parseToken(): Node | null {
        const token = this.tokenStream.current();
        const beforeToken = this.tokenStream.save();
        this.tokenStream.advance();
        // let savedIndex = this.tokenStream.save();

        if (!token) return null;

        // small character
        if (/[a-z]/.test(token)) {
            // function or constant
            if (this.tokenStream.match("(")) {
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

            // variable
            return new Node(NodeType.VARIABLE, token);
        }

        if (token.match(/[A-Z]/)) {
            if (this.tokenStream.match("(")) {
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

            if (THROW_ERRORS) {
                throw new Error("Expected '(' after predicate " + token);
            }

            return null;
        }

        if (["@", "?", "∀", "∃"].includes(token)) {
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

        if (["!", "¬"].includes(token)) {
            const right = this.parseExpression(PRECEDENCE[token]);
            const node = new Node(NodeType.NEGATION, token);
            node.children.push(right!);

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

    private parseVariable(): Node | null {
        const token = this.tokenStream.current();

        if (token && token.match(/[a-z]/)) {
            this.tokenStream.advance();
            return new Node(NodeType.VARIABLE, token);
        }

        return null;
    }

    private getPrecedence(): number {
        const token = this.tokenStream.current();
        if (!token) return 0;

        return PRECEDENCE[token] || 0 ? PRECEDENCE[token] : 0;
    }
}