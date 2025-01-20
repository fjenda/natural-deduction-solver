import {Operator} from "../../parsers/Operator";

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
}

export class DeductionRule {
    short: NDRule;
    title: string;
    operation: Operator;
    inputSize: number;
    outputSize: number;

    // constructor(short: DeductionRuleEnum, title: string, fn: (node: Node) => Node | null) {
    constructor(
        short: NDRule,
        title: string,
        operation: Operator = Operator.UNKNOWN,
        inputSize: number = 0,
        outputSize: number = 0
    ) {
        this.short = short;
        this.title = title;
        this.operation = operation;
        this.inputSize = inputSize;
        this.outputSize = outputSize;
    }

    static UNKNOWN = new DeductionRule(NDRule.UNKNOWN, 'Unknown');
    static ICON = new DeductionRule(
        NDRule.ICON,
        'Introduction of Conjunction',
        Operator.CONJUNCTION,
        2,
        1
    );

    static ECON = new DeductionRule(
        NDRule.ECON,
        'Elimination of Conjunction',
        Operator.CONJUNCTION,
        1,
        2
    );

    static IDIS = new DeductionRule(
        NDRule.IDIS,
        'Introduction of Disjunction',
        Operator.DISJUNCTION,
        1,
        1
    );

    static EDIS = new DeductionRule(
        NDRule.EDIS,
        'Elimination of Disjunction',
        Operator.DISJUNCTION,
        2,
        1
    );

    static IIMP = new DeductionRule(
        NDRule.IIMP,
        'Introduction of Implication',
        Operator.IMPLICATION,
        1,
        1
    );

    static MP = new DeductionRule(
        NDRule.MP,
        'Modus Ponens',
        Operator.IMPLICATION,
        2,
        1
    );

    static IEQ = new DeductionRule(
        NDRule.IEQ,
        'Introduction of Equivalence',
        Operator.EQUIVALENCE,
        2,
        1
    );

    static EEQ = new DeductionRule(
        NDRule.EEQ,
        'Elimination of Equivalence',
        Operator.EQUIVALENCE,
        1,
        2
    );

    static IALL = new DeductionRule(
        NDRule.IALL,
        'Introduction of General Quantifier',
        Operator.UNIVERSAL,
        1,
        1
    );

    static EALL = new DeductionRule(
        NDRule.EALL,
        'Elimination of General Quantifier',
        Operator.UNIVERSAL,
        1,
        1
    );

    static IEX = new DeductionRule(
        NDRule.IEX,
        'Introduction of Existential Quantifier',
        Operator.EXISTENTIAL,
        1,
        1
    );

    static EEX = new DeductionRule(
        NDRule.EEX,
        'Elimination of Existential Quantifier',
        Operator.EXISTENTIAL,
        1,
        1
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
}