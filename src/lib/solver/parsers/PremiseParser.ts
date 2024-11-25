import {Lexer, TokenType} from './Lexer';
import {VariableTable} from "./VariableTable";

export class PremiseParser {
    static parsePremise(premise: string | null) {
        if (premise === null || premise === '') {
            return null;
        }

        // remove whitespace around
        premise = premise.trim();

        // get tokens from premise
        let tokens = Lexer.lex(premise);

        // initialize variable table
        let variables = VariableTable.initialize(tokens);

        // check if all variables are declared
        for (let token of tokens) {
            if (token.type == TokenType.VAR) {
                if (!variables.exists(token.value!)) {
                    console.log(`Variable ${token.value} not declared`);
                    return null;
                }
            }
        }

        console.log(tokens);
        variables.printTable();

        return tokens;
    }
}

