import {DeductionRule} from "./DeductionRules";
import { EarleyParser, Rule } from '../../earley-parser/EarleyParser';

export class FormulaParser {
    // constants - [a-g]
    // variables - [h-z]
    // functions - [a-z(x,y,z)]
    // predicates - function or relation
    // relations - [A-Z(x)]

    static initParser() {
        let grammar = [
            new Rule('Formula', ['[' , 'Formula', ']']),
            new Rule('Formula', ['(', 'Formula', ')']),
            new Rule('Formula', ['Formula', 'LogicalOp', 'Formula', 'LogicalTail']),
            new Rule('Formula', ['!', 'Formula']),
            new Rule('Formula', ['Quantifier', 'Variable', 'Formula']),
            new Rule('Formula', ['Predicate', '(', 'TermList', ')']),
            new Rule('Formula', ['Constant']),

            new Rule('LogicalOp', ['&']),
            new Rule('LogicalOp', ['|']),
            new Rule('LogicalOp', ['>']),
            new Rule('LogicalOp', ['=']),

            new Rule('LogicalTail', ['LogicalOp', 'Formula', 'LogicalTail']),
            new Rule('LogicalTail', []),

            new Rule('Quantifier', ['@']),
            new Rule('Quantifier', ['?']),

            new Rule('TermList', ['Term', 'TermListTail']),
            new Rule('TermListTail', [',', 'Term', 'TermListTail']),
            new Rule('TermListTail', []),

            new Rule('Term', ['Variable']),
            new Rule('Term', ['Constant']),
            new Rule('Term', ['Function', '(', 'TermList', ')']),

            new Rule('Predicate', ['Variable']),
            new Rule('Predicate', ['Large']),

            new Rule('Function', ['Variable']),
            new Rule('Function', ['Constant']),
        ]

        // constant - [a-g]
        for (let i = 0; i < 7; i++) {
            grammar.push(new Rule('Constant', [String.fromCharCode(97 + i)]));
        }

        // small letters without constants - [h-z]
        for (let i = 7; i < 26; i++) {
            grammar.push(new Rule('Variable', [String.fromCharCode(97 + i)]));
        }

        // large letters
        for (let i = 0; i < 26; i++) {
            grammar.push(new Rule('Large', [String.fromCharCode(65 + i)]));
        }

        return new EarleyParser('Formula', grammar);
    }

    static parser: EarleyParser = this.initParser();

    static parseFormula(formula: string): string {
        // check syntax
        let res = this.parser.parse(formula);

        if (!res) {
            return DeductionRule.UNKNOWN.rule;
        }




        return DeductionRule.EALL.rule;
    }
}