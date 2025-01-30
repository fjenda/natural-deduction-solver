import type {NDRule} from "../lib/solver/parsers/DeductionRules";

/**
 * AppliedRule type
 * This type is used to represent a rule that has been applied to a line in the proof.
 * @param rule: NDRule - the rule that was applied
 * @param lines?: number[] - the lines that the rule was applied to
 */
export type AppliedRule = {
    rule: NDRule;
    lines?: number[];
}

