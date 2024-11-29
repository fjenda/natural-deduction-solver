import {Lexer, TokenType} from './Lexer';
import {VariableTable} from "./VariableTable";
import {Parser} from "../../parsers/Parser";
import {get} from "svelte/store";
import {solverContent} from "../../../stores/solverStore";
import {DeductionProcessor} from "../../parsers/DeductionProcessor";
import {Node} from "../../parsers/Node";

export class PremiseParser {
    static parsePremise(premise: string | null) {
        if (premise === null || premise === '') {
            return false;
        }

        // remove all whitespaces
        premise = premise.replace(/\s/g, '');

        // syntax check
        let parser = new Parser();
        let res = parser.parse(premise);

        if (!res) {
            return false;
        }

        res.print();
        console.log(`Before: ${DeductionProcessor.toString(res)}`);
        res = DeductionProcessor.eliminateQuantifier(res)!;
        console.log(`After:  ${DeductionProcessor.toString(res)}`);
        // console.log(DeductionProcessor.getNextOperation(res));

        // console.log(DeductionProcessor.toString(DeductionProcessor.eliminateQuantifier(res)!));

        // let newPremises = DeductionProcessor.eliminateOperator(res);
        // for (let premise of newPremises!) {
        //     console.log(DeductionProcessor.toString(premise));
        // }


        // get(solverContent).proof

        return res;
        // TODO: check if all variables are declared
        //       get tokens from premise
        //       initialize variable table
        //       come up with a smart way to represent the tokens so its easy to apply the deduction rules


        // // get tokens from premise
        // let tokens = Lexer.lex(premise);
        //
        // // initialize variable table
        // let variables = VariableTable.initialize(tokens);
        //
        // // check if all variables are declared
        // for (let token of tokens) {
        //     if (token.type == TokenType.VAR) {
        //         if (!variables.exists(token.value!)) {
        //             console.log(`Variable ${token.value} not declared`);
        //             return null;
        //         }
        //     }
        // }
        //
        // console.log(tokens);
        // variables.printTable();

        // return tokens;
    }
}

