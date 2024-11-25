export enum DeductionRuleEnum {
    ICON = 'IC', // Introduction of Conjunction
    ECON = 'EC', // Elimination of Conjunction
    IDIS = 'ID', // Introduction of Disjunction
    EDIS = 'ED', // Elimination of Disjunction
    IIMP = 'II', // Introduction of Implication
    MP = 'MP', // Elimination of Implication
    IEQ = 'IE', // Introduction of Equivalence
    EEQ = 'EE', // Elimination of Equivalence

    IALL = 'I∀', // Introduction of General Quantifier
    EALL = 'E∀', // Elimination of General Quantifier
    IEX = 'I∃', // Introduction of Existential Quantifier
    EEX = 'E∃', // Elimination of Existential Quantifier

    UNKNOWN = 'x',
}

export class DeductionRule {
    rule: DeductionRuleEnum;
    title: string;

    constructor(rule: DeductionRuleEnum, title: string) {
        this.rule = rule;
        this.title = title;
    }

    static UNKNOWN = new DeductionRule(DeductionRuleEnum.UNKNOWN, 'Unknown');
    static ICON = new DeductionRule(DeductionRuleEnum.ICON, 'Introduction of Conjunction');
    static ECON = new DeductionRule(DeductionRuleEnum.ECON, 'Elimination of Conjunction');
    static IDIS = new DeductionRule(DeductionRuleEnum.IDIS, 'Introduction of Disjunction');
    static EDIS = new DeductionRule(DeductionRuleEnum.EDIS, 'Elimination of Disjunction');
    static IIMP = new DeductionRule(DeductionRuleEnum.IIMP, 'Introduction of Implication');
    static MP = new DeductionRule(DeductionRuleEnum.MP, 'Modus Ponens');
    static IEQ = new DeductionRule(DeductionRuleEnum.IEQ, 'Introduction of Equivalence');
    static EEQ = new DeductionRule(DeductionRuleEnum.EEQ, 'Elimination of Equivalence');
    static IALL = new DeductionRule(DeductionRuleEnum.IALL, 'Introduction of General Quantifier');
    static EALL = new DeductionRule(DeductionRuleEnum.EALL, 'Elimination of General Quantifier');
    static IEX = new DeductionRule(DeductionRuleEnum.IEX, 'Introduction of Existential Quantifier');
    static EEX = new DeductionRule(DeductionRuleEnum.EEX, 'Elimination of Existential Quantifier');

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