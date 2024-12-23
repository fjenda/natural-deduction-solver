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

import { TokenStream} from "./TokenStream";
import { Node } from "./Node"


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

        console.log(tree);
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
        let savedIndex = this.tokenStream.save();

        if (!token) return null;

        // small character
        if (token.match(/[a-z]/)) {
            // function or constant
            if (this.tokenStream.match("(")) {
                const termList = this.parseTermList();
                console.log(this.tokenStream);
                if (!this.tokenStream.match(")")) {
                    if (THROW_ERRORS) {
                        throw new Error("Expected ) after term list in function call");
                    }

                    return null;
                }

                // empty termlist -> constant
                if (!termList) {
                    return new Node("Constant", token);
                }

                // function
                const node = new Node("Function", token);
                node.children.push(termList);
                return node;
            }

            // variable
            return new Node("Variable", token);
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

                const node = new Node("Predicate", token);
                node.children.push(termList!);

                return node;
            }

            // return new Node("Large", token);
            if (THROW_ERRORS) {
                throw new Error("Expected '(' after predicate " + token);
            }

            return null;
        }

        // if (token.match(/[a-g]/)) {
        //     return new Node("Constant", token);
        // }

        // if (token.match(/[a-z]/)) {
        //     return new Node("Variable", token);
        // }

        if (["@", "?", "∀", "∃"].includes(token)) {
            const node = new Node("Quantifier");
            node.children.push(new Node("QuantifierOperator", token));

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
            const node = new Node("Negation", token);
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

            const parenNode = new Node("ParenthesesBlock");
            parenNode.children.push(new Node("Parenthesis", "("), inner!, new Node("Parenthesis", ")"));

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

            const bracketNode = new Node("BracketsBlock");
            bracketNode.children.push(new Node("Bracket", "["), inner!, new Node("Bracket", "]"));

            return bracketNode;
        }

        this.tokenStream.restore(beforeToken);
        return null;
        // throw new Error(`Unexpected token: ${token}`);
    }

    private parseLed(operator: string, left: Node): Node | null {
        const precedence = PRECEDENCE[operator] || 0;

        if (operator.match(/[&|>=∧∨⊃≡]/)) {
            const right = this.parseExpression(precedence);

            if (!right) {
                if (THROW_ERRORS) {
                    throw new Error("Expected right side of binary operation");
                }

                return null;
            }

            const node = new Node("BinaryOperation", operator);
            node.children.push(left, right);

            return node;
        }

        if (THROW_ERRORS) {
            throw new Error(`Unknown operator: ${operator}`);
        }

        return null;
    }

    private parseTermList(): Node | null {
        const node = new Node("TermList");

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
            return new Node("Variable", token);
        }

        return null;
    }

    private getPrecedence(): number {
        const token = this.tokenStream.current();
        if (!token) return 0;

        return PRECEDENCE[token] || 0 ? PRECEDENCE[token] : 0;
    }
}