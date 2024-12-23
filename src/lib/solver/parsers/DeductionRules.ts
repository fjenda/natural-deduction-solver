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
    // fn: (node: Node) => Node | null;

    // constructor(short: DeductionRuleEnum, title: string, fn: (node: Node) => Node | null) {
    constructor(short: NDRule, title: string, operation: Operator = Operator.UNKNOWN) {
        this.short = short;
        this.title = title;
        this.operation = operation;
        // this.fn = fn;
    }

    static UNKNOWN = new DeductionRule(NDRule.UNKNOWN, 'Unknown');
    static ICON = new DeductionRule(NDRule.ICON, 'Introduction of Conjunction', Operator.CONJUNCTION);
    static ECON = new DeductionRule(NDRule.ECON, 'Elimination of Conjunction', Operator.CONJUNCTION);
    static IDIS = new DeductionRule(NDRule.IDIS, 'Introduction of Disjunction', Operator.DISJUNCTION);
    static EDIS = new DeductionRule(NDRule.EDIS, 'Elimination of Disjunction', Operator.DISJUNCTION);
    static IIMP = new DeductionRule(NDRule.IIMP, 'Introduction of Implication', Operator.IMPLICATION);
    static MP = new DeductionRule(NDRule.MP, 'Modus Ponens', Operator.IMPLICATION);
    static IEQ = new DeductionRule(NDRule.IEQ, 'Introduction of Equivalence', Operator.EQUIVALENCE);
    static EEQ = new DeductionRule(NDRule.EEQ, 'Elimination of Equivalence', Operator.EQUIVALENCE);
    static IALL = new DeductionRule(NDRule.IALL, 'Introduction of General Quantifier', Operator.UNIVERSAL);
    static EALL = new DeductionRule(NDRule.EALL, 'Elimination of General Quantifier', Operator.UNIVERSAL);
    static IEX = new DeductionRule(NDRule.IEX, 'Introduction of Existential Quantifier', Operator.EXISTENTIAL);
    static EEX = new DeductionRule(NDRule.EEX, 'Elimination of Existential Quantifier', Operator.EXISTENTIAL);

    static rules = [
        // DeductionRule.UNKNOWN,
        DeductionRule.ICON,
        DeductionRule.ECON,
        DeductionRule.IDIS,
        DeductionRule.EDIS,
        DeductionRule.IIMP,
        DeductionRule.MP,
        DeductionRule.IEQ,
        DeductionRule.EEQ,
        DeductionRule.IALL,
        DeductionRule.EALL,
        DeductionRule.IEX,
        DeductionRule.EEX,
    ];
}