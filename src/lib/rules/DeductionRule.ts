import { PrettySyntaxer } from "../solver/PrettySyntaxer";
import { get } from "svelte/store";
import { logicMode } from "../../stores/solverStore";
import { ParseStrategy } from "../../types/ParseStrategy";
import type { IRule } from "./IRule";

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
    PREM = 'PREM',
    ASS = 'ASS',
    CONC = 'CONC',
}

/**
 * Class representing a deduction rule
 * @property {NDRule} short - abbreviation of the rule
 * @property {string} title - title of the rule
 * @property {number} inputSize - number of inputs
 * @property {number} outputSize - number of outputs
 * @property {string} detail - the detail that is shown when hovering over the rule
 */
export class DeductionRule implements IRule {
    short: NDRule;
    title: string;
    inputSize: number;
    outputSize: number;
    detail: string;

    /**
     * Constructor of the DeductionRule object
     * @param short - abbreviation of the rule title
     * @param title - title of the rule
     * @param inputSize - number of inputs
     * @param outputSize - number of outputs
     * @param detail - the detail that is shown when hovering over the rule
     * @constructor
     */
    constructor(
        short: NDRule,
        title: string,
        inputSize: number = 0,
        outputSize: number = 0,
        detail: string = "",
    ) {
        this.short = short;
        this.title = title;
        this.inputSize = inputSize;
        this.outputSize = outputSize;
        this.detail = detail;
    }

    static PREM = new DeductionRule(NDRule.PREM, 'Premise');
    static CONC = new DeductionRule(NDRule.CONC, 'Conclusion');
    static UNKNOWN = new DeductionRule(NDRule.UNKNOWN, 'Unknown');
    static ICON = new DeductionRule(
        NDRule.ICON,
        'Introduction of Conjunction',
        2,
        1,
        PrettySyntaxer.toMathML("A, B ⊢ A ∧ B"),
    );


    static ECON = new DeductionRule(
        NDRule.ECON,
        'Elimination of Conjunction',
        1,
        2,
        PrettySyntaxer.toMathML("A ∧ B ⊢ A, B"),
    );

    static IDIS = new DeductionRule(
        NDRule.IDIS,
        'Introduction of Disjunction',
        2, // the input is actually 1, the second part can be any valid formula
        1,
        PrettySyntaxer.toMathML("A ⊢ A ∨ B\nB ⊢ A ∨ B"),
    );

    static EDIS = new DeductionRule(
        NDRule.EDIS,
        'Elimination of Disjunction',
        2,
        1,
        PrettySyntaxer.toMathML("A ∨ B, ¬A ⊢ B\nA ∨ B, ¬B ⊢ A"),
    );

    static IIMP = new DeductionRule(
        NDRule.IIMP,
        'Introduction of Implication',
        2,
        1,
        PrettySyntaxer.toMathML("A, B ⊢ A ⊃ B"),
    );

    static MP = new DeductionRule(
        NDRule.MP,
        'Modus Ponens',
        2,
        1,
        PrettySyntaxer.toMathML("A ⊃ B, A ⊢ B"),
    );

    static IEQ = new DeductionRule(
        NDRule.IEQ,
        'Introduction of Equivalence',
        2,
        1,
        PrettySyntaxer.toMathML("A ⊃ B, B ⊃ A ⊢ A ≡ B"),
    );

    static EEQ = new DeductionRule(
        NDRule.EEQ,
        'Elimination of Equivalence',
        1,
        2,
        PrettySyntaxer.toMathML("A ≡ B ⊢ A ⊃ B\nA ≡ B ⊢ B ⊃ A"),
    );

    static IALL = new DeductionRule(
        NDRule.IALL,
        'Introduction of General Quantifier',
        1,
        1,
        PrettySyntaxer.toMathML("A(x) ⊢ ∀xA(x)"),
    );

    static EALL = new DeductionRule(
        NDRule.EALL,
        'Elimination of General Quantifier',
        1,
        1,
        PrettySyntaxer.toMathML("∀xA(x) ⊢ A(x/t)"),
    );

    static IEX = new DeductionRule(
        NDRule.IEX,
        'Introduction of Existential Quantifier',
        1,
        1,
        PrettySyntaxer.toMathML("A(x/t) ⊢ ∃xA(x)"),
    );

    static EEX = new DeductionRule(
        NDRule.EEX,
        'Elimination of Existential Quantifier',
        1,
        1,
        PrettySyntaxer.toMathML("∃xA(x) ⊢ A(x/c)"),
    );


    /**
     * Get the list of rules based on the logic mode
     */
    public static get rules(): DeductionRule[] {
        const baseRules = [
            // Propositional Logic
            DeductionRule.ICON,
            DeductionRule.ECON,
            DeductionRule.IDIS,
            DeductionRule.EDIS,
            DeductionRule.IIMP,
            DeductionRule.MP,
            DeductionRule.IEQ,
            DeductionRule.EEQ,
        ];

        if (get(logicMode) === ParseStrategy.PROPOSITIONAL)
            return baseRules;

        return [
            ...baseRules,
            // Predicate Logic
            DeductionRule.IALL,
            DeductionRule.EALL,
            DeductionRule.IEX,
            DeductionRule.EEX,
        ];
    }

    /**
     * Get the rule based on the abbreviation
     * @param short - abbreviation of the rule
     */
    public static getRule(short: string): DeductionRule {
        if (short === "PREM" || short === "CONC") {
            return short === "PREM" ? DeductionRule.PREM : DeductionRule.CONC;
        }

        return DeductionRule.rules.find((rule) => rule.short === short) || DeductionRule.UNKNOWN;
    }
}