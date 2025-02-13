import type {NDRule} from "../lib/rules/DeductionRule";

/**
 * AppliedRule type
 * This type is used to represent a rule that has been applied to a line in the proof.
 * @param rule: NDRule - the rule that was applied
 * @param lines?: number[] - the lines that the rule was applied to
 */
export type AppliedRule = {
    rule: string;
    lines?: number[];
}

