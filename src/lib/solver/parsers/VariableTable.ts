import type {Token} from "./Lexer";
import {TokenType} from "./Lexer";

export class VariableTable {
    private table: [key: TokenType, value: string][] = [];

    private constructor() {}

    static initialize(tokens: Token[]): VariableTable {
        let table = new VariableTable();

        for (let token of tokens) {
            switch (token.type) {
                case TokenType.FORALL:
                case TokenType.EXISTS:
                    table.addVariable(token.value!, TokenType.VAR); break;

                case TokenType.PREDICATE:
                case TokenType.FUNCTION:
                case TokenType.RELATION:
                case TokenType.CONST:
                        table.addVariable(token.value!, token.type); break;

                default: break;
            }
        }

        return table;
    }

    addVariable(variable: string, type: TokenType): void {
        if (!this.exists(variable)) {
            this.table.push([type, variable]);
        }
    }

    getType(type: TokenType): string[] {
        return this.table.filter(([t, _]) => t === type).map(([_, v]) => v);
    }

    clearVariables(): void {
        this.table = [];
    }

    exists(variable: string): boolean {
        return this.table.some(([_, v]) => v === variable);
    }

    printTable(): void {
        for (let variable of this.table) {
            console.log(variable[1] + " : " + variable[0]);
        }
    }
}