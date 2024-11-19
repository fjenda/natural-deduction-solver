export enum DeductionRule {
    ICON = 'IC', // Introduction of Conjunction
    ECON = 'EC', // Elimination of Conjunction
    IDIS = 'ID', // Introduction of Disjunction
    EDIS = 'ED', // Elimination of Disjunction
    IIMP = 'II', // Introduction of Implication
    // EI = 'EI', // Elimination of Implication
    MP = 'MP', // Modus Ponens
    IEQ = 'IE', // Introduction of Equivalence
    EEQ = 'EE', // Elimination of Equivalence
    IALL = 'I∀', // Introduction of General Quantifier
    EALL = 'E∀', // Elimination of General Quantifier
    IEX = 'I∃', // Introduction of Existential Quantifier
    EEX = 'E∃', // Elimination of Existential Quantifier
    INEG = 'IN', // Introduction of Negation
    ENEG = 'EN', // Elimination of Negation
    NDIS = 'ND', // Negation of Disjunction
    NCON = 'NC', // Negation of Conjunction
    NIMP = 'NI', // Negation of Implication
    TIMP = 'TI', // Transitivity of Implication
    TR = 'TR', // Transposition
    MT = 'MT', // Modus Tollens

    UNKNOWN = '⨯',
}
