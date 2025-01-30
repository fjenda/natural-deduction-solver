import {Operator} from "../../syntax-checker/Operator";

/**
 * Natural Deduction Rules
 * Enums for the deduction rules
 */
export enum NDRule {
    // Propositional Logic
    ICON = 'IC', // Introduction of Conjunction
    ECON = 'EC', // Elimination of Conjunction
    IDIS = 'ID', // Introduction of Disjunction
    EDIS = 'ED', // Elimination of Disjunction
    IIMP = 'II', // Introduction of Implication
    MP = 'MP', // Elimination of Implication
    IEQ = 'IE', // Introduction of Equivalence
    EEQ = 'EE', // Elimination of Equivalence

    // Predicate Logic
    IALL = 'I∀', // Introduction of General Quantifier
    EALL = 'E∀', // Elimination of General Quantifier
    IEX = 'I∃', // Introduction of Existential Quantifier
    EEX = 'E∃', // Elimination of Existential Quantifier

    UNKNOWN = 'x',
    ASS = 'ASS',
    CONC = 'CONC',
}

/**
 * Class representing a deduction rule
 * @property {NDRule} short - abbreviation of the rule
 * @property {string} title - title of the rule
 * @property {Operator} operation - the operator that the rule uses
 * @property {number} inputSize - number of inputs
 * @property {number} outputSize - number of outputs
 * @property {string} detail - the detail that is shown when hovering over the rule
 */
export class DeductionRule {
    short: NDRule;
    title: string;
    operation: Operator;
    inputSize: number;
    outputSize: number;
    detail: string;

    /**
     * Constructor of the DeductionRule object
     * @param short - abbreviation of the rule title
     * @param title - title of the rule
     * @param operation - the operator that the rule uses
     * @param inputSize - number of inputs
     * @param outputSize - number of outputs
     * @param detail - the detail that is shown when hovering over the rule
     * @constructor
     */
    constructor(
        short: NDRule,
        title: string,
        operation: Operator = Operator.UNKNOWN,
        inputSize: number = 0,
        outputSize: number = 0,
        detail: string = "",
    ) {
        this.short = short;
        this.title = title;
        this.operation = operation;
        this.inputSize = inputSize;
        this.outputSize = outputSize;
        this.detail = detail;
    }

    static ASS = new DeductionRule(NDRule.ASS, 'Assumption');
    static CONC = new DeductionRule(NDRule.CONC, 'Conclusion');
    static UNKNOWN = new DeductionRule(NDRule.UNKNOWN, 'Unknown');
    static ICON = new DeductionRule(
        NDRule.ICON,
        'Introduction of Conjunction',
        Operator.CONJUNCTION,
        2,
        1,
        "<p>A, B ⊢ A ∧ B</p>",
    );


    static ECON = new DeductionRule(
        NDRule.ECON,
        'Elimination of Conjunction',
        Operator.CONJUNCTION,
        1,
        2,
        "<p>A ∧ B ⊢ A, B</p>",
    );

    static IDIS = new DeductionRule(
        NDRule.IDIS,
        'Introduction of Disjunction',
        Operator.DISJUNCTION,
        2, // the input is actually 1, the second part can be any valid formula
        1,
        "<p>A ⊢ A ∨ B</p><p>B ⊢ A ∨ B</p>",
    );

    static EDIS = new DeductionRule(
        NDRule.EDIS,
        'Elimination of Disjunction',
        Operator.DISJUNCTION,
        2,
        1,
        "<p>A ∨ B, ¬A ⊢ B</p><p>A ∨ B, ¬B ⊢ A</p>",
    );

    static IIMP = new DeductionRule(
        NDRule.IIMP,
        'Introduction of Implication',
        Operator.IMPLICATION,
        2,
        1,
        "<p>A, B ⊢ A ⊃ B</p>",
    );

    static MP = new DeductionRule(
        NDRule.MP,
        'Modus Ponens',
        Operator.IMPLICATION,
        2,
        1,
        "<p>A ⊃ B, A ⊢ B</p>",
    );

    static IEQ = new DeductionRule(
        NDRule.IEQ,
        'Introduction of Equivalence',
        Operator.EQUIVALENCE,
        2,
        1,
        "<p>A ⊃ B, B ⊃ A ⊢ A ≡ B</p>",
    );

    static EEQ = new DeductionRule(
        NDRule.EEQ,
        'Elimination of Equivalence',
        Operator.EQUIVALENCE,
        1,
        2,
        "<p>A ≡ B ⊢ A ⊃ B, B ⊃ A</p>",
    );

    static IALL = new DeductionRule(
        NDRule.IALL,
        'Introduction of General Quantifier',
        Operator.UNIVERSAL,
        1,
        1,
        "<p>A(x) ⊢ ∀xA(x)</p>",
    );

    static EALL = new DeductionRule(
        NDRule.EALL,
        'Elimination of General Quantifier',
        Operator.UNIVERSAL,
        1,
        1,
        "<p>∀xA(x) ⊢ A(x/t)</p>",
    );

    static IEX = new DeductionRule(
        NDRule.IEX,
        'Introduction of Existential Quantifier',
        Operator.EXISTENTIAL,
        1,
        1,
        "<p>A(x/t) ⊢ ∃xA(x)</p>",
    );

    static EEX = new DeductionRule(
        NDRule.EEX,
        'Elimination of Existential Quantifier',
        Operator.EXISTENTIAL,
        1,
        1,
        "<p>∃xA(x) ⊢ A(x/c)</p>",
    );

    static rules = [
        // DeductionRule.UNKNOWN,

        // Propositional Logic
        DeductionRule.ICON,
        DeductionRule.ECON,
        DeductionRule.IDIS,
        DeductionRule.EDIS,
        DeductionRule.IIMP,
        DeductionRule.MP,
        DeductionRule.IEQ,
        DeductionRule.EEQ,

        // Predicate Logic
        // DeductionRule.IALL,
        // DeductionRule.EALL,
        // DeductionRule.IEX,
        // DeductionRule.EEX,
    ];

    /**
     * Get the rule based on the abbreviation
     * @param short - abbreviation of the rule
     */
    public static getRule(short: string): DeductionRule {
        return DeductionRule.rules.find((rule) => rule.short === short) || DeductionRule.UNKNOWN;
    }
}