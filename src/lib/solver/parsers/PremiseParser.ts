import {Lexer, TokenType} from './Lexer';
import {VariableTable} from "./VariableTable";
import {Parser} from "../../parsers/Parser";

export class PremiseParser {
    static parsePremise(premise: string | null) {
        if (premise === null || premise === '') {
            return false;
        }

        // remove all whitespaces
        premise = premise.replace(/\s/g, '');

        // syntax check
        let parser = new Parser();

        if (!parser.parse(premise)) {
            return false;
        }

        // TODO: check if all variables are declared
        //       get tokens from premise
        //       initialize variable table
        //       come up with a smart way to represent the tokens so its easy to apply the deduction rules

        return true;

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

