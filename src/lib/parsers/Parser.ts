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

const LOGGING: boolean = false;

export class Parser {
    private tokenStream!: TokenStream;

    parse(formula: string): boolean {
        this.tokenStream = new TokenStream(formula);
        const result = this.parseFormula();

        if (LOGGING) console.log('result', result, this.tokenStream.current());

        if (!result || !this.tokenStream.isAtEnd()) {
            if (LOGGING) {
                console.error(
                    `Parsing failed at index ${
                        this.tokenStream.isAtEnd() ? "end" : this.tokenStream.current()
                    }`
                );
            }
            return false;
        }

        return true;
    }

    private parseFormula(): boolean {
        if (LOGGING) console.log('formula', this.tokenStream.current());
        return this.parseFormulaSimple() && this.parseFormulaPrime();
    }

    private parseFormulaPrime(): boolean {
        if (LOGGING) console.log('formula prime', this.tokenStream.current());
        if (this.parseLogicalOp()) {
            return this.parseFormulaSimple() && this.parseFormulaPrime();
        }
        return true; // ε
    }

    private parseFormulaSimple(): boolean {
        if (LOGGING) console.log('formula simple', this.tokenStream.current());
        if (this.tokenStream.match('[')) {
            if (this.parseFormula() && this.tokenStream.match(']')) {
                return true;
            }
        } else if (this.tokenStream.match('(')) {
            if (this.parseFormula() && this.tokenStream.match(')')) {
                return true;
            }
        } else if (this.tokenStream.match('!') && this.parseFormula()) {
            return true;
        } else if (this.parseQuantifier() && this.parseVariable() && this.parseFormula()) {
            return true;
        } else if (this.parsePredicate() && this.tokenStream.match('(') && this.parseTermList() && this.tokenStream.match(')')) {
            return true;
        } else if (this.parseConstant()) {
            return true;
        } else if ((this.parseVariable() || this.parseConstant()) && this.tokenStream.match('(') && this.parseTermList() && this.tokenStream.match(')')) {
            return true;
        }
        return false;
    }

    private parseLogicalOp(): boolean {
        if (LOGGING) console.log('logical op', this.tokenStream.current());
        return this.tokenStream.match('&') ||
            this.tokenStream.match('|') ||
            this.tokenStream.match('>') ||
            this.tokenStream.match('=');
    }

    private parseQuantifier(): boolean {
        if (LOGGING) console.log('quantifier', this.tokenStream.current());
        return this.tokenStream.match('@') || this.tokenStream.match('?');
    }

    private parseTermList(): boolean {
        if (LOGGING) console.log('term list', this.tokenStream.current());
        return this.parseTerm() && this.parseTermListTail();
    }

    private parseTermListTail(): boolean {
        if (LOGGING) console.log('term list tail', this.tokenStream.current());
        if (this.tokenStream.match(',') && this.parseTerm() && this.parseTermListTail()) {
            return true;
        }
        return true; // ε
    }

    private parseTerm(): boolean {
        if (LOGGING) console.log('term', this.tokenStream.current());
        return (
            this.parseVariable() ||
            this.parseConstant() ||
            (this.parseFunction() &&
                this.tokenStream.match('(') &&
                this.parseTermList() &&
                this.tokenStream.match(')'))
        );
    }

    private parsePredicate(): boolean {
        if (LOGGING) console.log('predicate', this.tokenStream.current());
        return this.parseVariable() || this.parseLarge();
    }

    private parseFunction(): boolean {
        if (LOGGING) console.log('function', this.tokenStream.current());
        return this.parseVariable() || this.parseConstant();
    }

    private parseConstant(): boolean {
        if (LOGGING) console.log('constant', this.tokenStream.current());
        const current = this.tokenStream.current();
        if (current && current.match(/[a-g]/)) {
            this.tokenStream.advance();
            return true;
        }
        return false;
    }

    private parseVariable(): boolean {
        if (LOGGING) console.log('variable', this.tokenStream.current());
        const current = this.tokenStream.current();
        if (current && current.match(/[h-z]/)) {
            this.tokenStream.advance();
            return true;
        }
        return false;
    }

    private parseLarge(): boolean {
        if (LOGGING) console.log('large', this.tokenStream.current());
        const current = this.tokenStream.current();
        if (current && current.match(/[A-Z]/)) {
            this.tokenStream.advance();
            return true;
        }
        return false;
    }
}
