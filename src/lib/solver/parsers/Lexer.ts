export enum TokenType {
    // brackets
    OpenParen = "(",
    CloseParen = ")",
    OpenBracket = "[",
    CloseBracket = "]",

    // operators
    AND = "&",
    OR = "|",
    NOT = "!",
    IMP = ">",
    EQ = "=",

    // constants
    CONST = "const",
    VAR = "var",
    FUNCTION = "func",
    PREDICATE = "pred",
    RELATION = "rel",

    COMMA = ",",
    SPACE = " ",

    // quantifiers
    FORALL = "@",
    EXISTS = "?",
}

export interface Token {
    type: TokenType;
    value?: string;
}

export class Lexer {
    static lex(formula: string): Token[] {
        let tokens: Token[] = [];
        let i = 0;
        while (i < formula.length) {
            let c = formula[i];
            // if (c === ' ') {
            //     i++;
            //     continue;
            // }

            switch (c) {
                case '(':
                    tokens.push({ type: TokenType.OpenParen });
                    break;
                case ')':
                    tokens.push({ type: TokenType.CloseParen });
                    break;
                case '[':
                    tokens.push({ type: TokenType.OpenBracket });
                    break;
                case ']':
                    tokens.push({ type: TokenType.CloseBracket });
                    break;
                case '&':
                    tokens.push({ type: TokenType.AND });
                    break;
                case '|':
                    tokens.push({ type: TokenType.OR });
                    break;
                case '!':
                    tokens.push({ type: TokenType.NOT });
                    break;
                case '>':
                    tokens.push({ type: TokenType.IMP });
                    break;
                case '=':
                    tokens.push({ type: TokenType.EQ });
                    break;
                case '@':
                    tokens.push({ type: TokenType.FORALL, value: formula[i + 1] });
                    break;
                case '?':
                    tokens.push({ type: TokenType.EXISTS, value: formula[i + 1] });
                    break;
                case ',':
                    tokens.push({ type: TokenType.COMMA });
                    break;
                case ' ':
                    tokens.push({ type: TokenType.SPACE });
                    break;
                default:
                    if (c.match(/[a-g]/)) {
                        if (i + 1 < formula.length && formula[i + 1] === '(') {
                            tokens.push({ type: TokenType.FUNCTION, value: c });
                            tokens.push({ type: TokenType.OpenParen });
                            i++;
                        } else {
                            tokens.push({ type: TokenType.CONST, value: c });
                        }
                    } else if (c.match(/[h-z]/)) {
                        if (i + 1 < formula.length && formula[i + 1] === '(') {
                            tokens.push({ type: TokenType.FUNCTION, value: c });
                            tokens.push({ type: TokenType.OpenParen });
                            i++;
                        } else {
                            tokens.push({ type: TokenType.VAR, value: c });
                        }
                    } else if (c.match(/[A-Z]/)) {
                        if (i + 1 < formula.length && formula[i + 1] === '(') {
                            tokens.push({ type: TokenType.PREDICATE, value: c });
                            tokens.push({ type: TokenType.OpenParen });
                            i++;
                        } else {
                            tokens.push({ type: TokenType.RELATION, value: c });
                        }
                    } else {
                        throw new Error(`Unexpected character: ${c}`);
                    }
                    break;
            }
            i++;
        }

        return tokens;
    }
}