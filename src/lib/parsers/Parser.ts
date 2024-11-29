// Recursive descent parser for grammar:
// Formula -> SimpleFormula FormulaPrime
// FormulaPrime -> LogicalOp SimpleFormula FormulaPrime | ε
// FormulaSimple -> '[' Formula ']'
//                | '(' Formula ')'
//                | '!' Formula
//                | Quantifier Variable Formula
//                | Predicate '(' TermList ')'
//                | Constant
//
// LogicalOp -> '&' | '|' | '>' | '='
// Quantifier -> '@' | '?'
// TermList -> Term TermListTail
// TermListTail -> ',' Term TermListTail | ε
// Term -> Variable | Constant | Function '(' TermList ')'
// Predicate -> Variable | Large
// Function -> Variable | Constant
// Constant -> [a-g]
// Variable -> [h-z]
// Large -> [A-Z]

import { TokenStream} from "./TokenStream";
import { Node } from "./Node"

const LOGGING: boolean = false;


// TODO: Replace string types with enums, we're not in the 90s anymore
export class Parser {
    private tokenStream!: TokenStream;

    parse(formula: string): Node | null {
        this.tokenStream = new TokenStream(formula);
        const tree = this.parseFormula();

        if (LOGGING) console.log('result', tree, this.tokenStream.current());

        if (!tree || !this.tokenStream.isAtEnd()) {
            if (LOGGING) {
                console.error(
                    `Parsing failed at index ${
                        this.tokenStream.isAtEnd() ? "end" : this.tokenStream.current()
                    }`
                );
            }
            return null;
        }

        // remove all children that are null
        tree.removeNullChildren();

        return tree;
    }

    private parseFormula(): Node | null {
        if (LOGGING) console.log('formula', this.tokenStream.current());
        const formulaSimple = this.parseFormulaSimple();
        if (!formulaSimple) return null;

        const formulaPrime = this.parseFormulaPrime();
        const node = new Node("Formula");
        node.children.push(formulaSimple);

        if (formulaSimple) {
            node.children.push(formulaPrime!);
        }

        return node;
    }

    private parseFormulaPrime(): Node | null {
        if (LOGGING) console.log('formula prime', this.tokenStream.current());

        const logicalOp = this.parseLogicalOp();

        if (logicalOp) {
            const simpleFormula = this.parseFormulaSimple();
            if (!simpleFormula) return null;

            const formulaPrime = this.parseFormulaPrime();
            const node = new Node("OperatorBlock");
            node.children.push(logicalOp, simpleFormula);

            if (formulaPrime) {
                node.children.push(formulaPrime);
            }

            return node;
        }

        return null;
    }

    private parseFormulaSimple(): Node | null {
        if (LOGGING) console.log('formula simple', this.tokenStream.current());

        const startIndex = this.tokenStream.save();

        // [Formula]
        if (this.tokenStream.match('[')) {
            const formula = this.parseFormula();
            if (formula && this.tokenStream.match(']')) {
                const node = new Node("BracketsBlock");
                node.children.push(new Node("Bracket", "["), formula, new Node("Bracket", "]"));
                return node;
            }
            this.tokenStream.restore(startIndex);
        }

        // (Formula)
        if (this.tokenStream.match('(')) {
            const formula = this.parseFormula();
            if (formula && this.tokenStream.match(')')) {
                const node = new Node("ParenthesesBlock");
                node.children.push(new Node("Parenthesis", "("), formula, new Node("Parenthesis", ")"));
                return node;
            }
            this.tokenStream.restore(startIndex);
        }

        // !Formula
        if (this.tokenStream.match('!')) {
            const formula = this.parseFormula();
            if (formula) {
                const node = new Node("NegationBlock");
                node.children.push(new Node("Negation", "!"), formula);
                return node;
            }
            this.tokenStream.restore(startIndex);
        }

        // Quantifier Variable Formula
        const quantifier = this.parseQuantifier();
        if (quantifier) {
            const variableStartIndex = this.tokenStream.save();
            const variable = this.parseVariable();
            if (!variable) this.tokenStream.restore(variableStartIndex);

            const formulaStartIndex = this.tokenStream.save();
            const formula = this.parseFormula();
            if (!formula) this.tokenStream.restore(formulaStartIndex);

            if (quantifier && variable && formula) {
                const node = new Node("QuantifierBlock");
                node.children.push(quantifier, variable, formula);
                return node;
            }
            this.tokenStream.restore(startIndex);
        }

        // Predicate (TermList)
        const predicate = this.parsePredicate();
        if (predicate && this.tokenStream.match('(')) {
            const termList = this.parseTermList();
            if (termList && this.tokenStream.match(')')) {
                const node = new Node("PredicateBlock");
                node.children.push(predicate, new Node("Parenthesis", "("), termList, new Node("Parenthesis", ")"));
                return node;
            }
            this.tokenStream.restore(startIndex);
        }

        // Constant
        const constant = this.parseConstant();
        if (constant) return constant;

        // Function (TermList)
        const func = this.parseFunction();
        if (func && this.tokenStream.match('(')) {
            const termList = this.parseTermList();
            if (termList && this.tokenStream.match(')')) {
                const node = new Node("FunctionBlock");
                node.children.push(func, new Node("Parenthesis", "("), termList, new Node("Parenthesis", ")"));
                return node;
            }
            this.tokenStream.restore(startIndex);
        }

        return null;
    }


    private parseLogicalOp(): Node | null {
        if (LOGGING) console.log('logical op', this.tokenStream.current());
        const current = this.tokenStream.current();
        if (this.tokenStream.match('&') || this.tokenStream.match('|') || this.tokenStream.match('>') || this.tokenStream.match('=')) {
            return new Node("LogicalOp", current!);
        }
        return null;
    }

    private parseQuantifier(): Node | null {
        if (LOGGING) console.log('quantifier', this.tokenStream.current());
        const current = this.tokenStream.current();
        if (this.tokenStream.match('@') || this.tokenStream.match('?')) {
            return new Node("Quantifier", current!);
        }
        return null;
    }

    private parseTermList(): Node | null {
        if (LOGGING) console.log('term list', this.tokenStream.current());
        const term = this.parseTerm();
        if (!term) return null;

        const termListTail = this.parseTermListTail();
        const node = new Node("TermList");
        node.children.push(term);
        if (termListTail) {
            node.children.push(termListTail);
        }
        return node;
    }

    private parseTermListTail(): Node | null {
        if (LOGGING) console.log('term list tail', this.tokenStream.current());
        if (this.tokenStream.match(',')) {
            const term = this.parseTerm();
            if (!term) return null;

            const termListTail = this.parseTermListTail();
            const node = new Node("TermListTail");
            node.children.push(new Node("Comma", ","), term);
            if (termListTail) {
                node.children.push(termListTail);
            }
            return node;
        }
        return null; // ε
    }


    private parseTerm(): Node | null {
        if (LOGGING) console.log('term', this.tokenStream.current());
        return (
            this.parseVariable() ||
            this.parseConstant() ||
            this.parseFunctionCall()
        );
    }

    private parseFunctionCall(): Node | null {
        if (LOGGING) console.log('function', this.tokenStream.current());
        const func = this.parseFunction();
        if (func && this.tokenStream.match('(')) {
            const termList = this.parseTermList();
            if (termList && this.tokenStream.match(')')) {
                const node = new Node("FunctionCall");
                node.children.push(func, new Node("Parenthesis", "("), termList, new Node("Parenthesis", ")"));
                return node;
            }
        }
        return null;
    }

    private parsePredicate(): Node | null {
        if (LOGGING) console.log('predicate', this.tokenStream.current());
        return this.parseVariable() || this.parseLarge();
    }

    private parseFunction(): Node | null {
        if (LOGGING) console.log('function', this.tokenStream.current());
        return this.parseVariable() || this.parseConstant();
    }

    private parseConstant(): Node | null {
        if (LOGGING) console.log('constant', this.tokenStream.current());
        const current = this.tokenStream.current();
        if (current && current.match(/[a-g]/)) {
            this.tokenStream.advance();
            return new Node("Constant", current);
        }
        return null;
    }

    private parseVariable(): Node | null {
        if (LOGGING) console.log('variable', this.tokenStream.current());
        const current = this.tokenStream.current();
        if (current && current.match(/[h-z]/)) {
            this.tokenStream.advance();
            return new Node("Variable", current);
        }
        return null;
    }

    private parseLarge(): Node | null {
        if (LOGGING) console.log('large', this.tokenStream.current());
        const current = this.tokenStream.current();
        if (current && current.match(/[A-Z]/)) {
            this.tokenStream.advance();
            return new Node("Large", current);
        }
        return null;
    }
}
