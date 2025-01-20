import type {NDRule} from "../lib/solver/parsers/DeductionRules";

export interface AppliedRule {
    rule: NDRule;
    lines?: number[];
}

