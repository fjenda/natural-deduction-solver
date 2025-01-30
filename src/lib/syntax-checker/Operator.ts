/**
 * Operator enum
 * This enum is used to represent the different operators that can be used in a formula.
 */
export enum Operator {
    UNKNOWN = "x",
    CONJUNCTION = "∧",
    DISJUNCTION = "∨",
    IMPLICATION = "⊃",
    EQUIVALENCE = "≡",
    NEGATION = "¬",
    UNIVERSAL = "∀",
    EXISTENTIAL = "∃",
    LPAR = "(",
    RPAR = ")",
    LBRACKET = "[",
    RBRACKET = "]",
}