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

/**
 * Convert operator to Prolog format
 * @param {Operator} op the operator to convert
 * @returns {string} the operator in Prolog format
 */
export function operatorToProlog(op: Operator): string {
    switch (op) {
        case Operator.CONJUNCTION:
            return "and";
        case Operator.DISJUNCTION:
            return "or";
        case Operator.IMPLICATION:
            return "impl";
        case Operator.EQUIVALENCE:
            return "eq";
        case Operator.NEGATION:
            return "not";
        case Operator.UNIVERSAL:
            return "forall";
        case Operator.EXISTENTIAL:
            return "exists";
        default:
            return op;
    }
}