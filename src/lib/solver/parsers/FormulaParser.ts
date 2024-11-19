import {DeductionRule} from "../../../types/DeductionRules";
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
            new Rule('Formula', ['Formula', '&', 'Formula']),
            new Rule('Formula', ['Formula', '|', 'Formula']),
            new Rule('Formula', ['Formula', '>', 'Formula']),
            new Rule('Formula', ['Formula', '=', 'Formula']),
            new Rule('Formula', ['!', 'Formula']),
            new Rule('Formula', ['Quantifier', 'Variable', 'Formula']),
            new Rule('Formula', ['Predicate', '(', 'TermList', ')']),

            // @ - all, ? - exists
            new Rule('Quantifier', ['@']),
            new Rule('Quantifier', ['?']),

            new Rule('Term', ['Variable']),
            new Rule('Term', ['Constant']),
            new Rule('Term', ['Function', '(', 'TermList', ')']),

            new Rule('TermList', ['Term']),
            new Rule('TermList', ['Term', ',', 'TermList']),
        ]

        // constant - [a-g]
        for (let i = 0; i < 7; i++) {
            grammar.push(new Rule('Constant', [String.fromCharCode(97 + i)]));
        }

        // small letters without constants - [h-z]
        for (let i = 7; i < 26; i++) {
            grammar.push(new Rule('Small', [String.fromCharCode(97 + i)]));
        }

        // large letters
        for (let i = 0; i < 26; i++) {
            grammar.push(new Rule('Large', [String.fromCharCode(65 + i)]));
        }

        // predicate - function or relation, so small or large letter
        grammar.push(new Rule('Predicate', ['Small']));
        grammar.push(new Rule('Predicate', ['Large']));

        // variable - [h-z]
        grammar.push(new Rule('Variable', ['Small']));

        // function - [a-z(x,y,z)]
        grammar.push(new Rule('Function', ['Small']));

        return new EarleyParser('Formula', grammar);
    }

    static parser: EarleyParser = this.initParser();

    static parseFormula(formula: string): DeductionRule {
        // check syntax
        let res = this.parser.parse(formula);

        if (!res) {
            return DeductionRule.UNKNOWN;
        }

        // check semantics
        // TODO

        return DeductionRule.EALL;
    }
}