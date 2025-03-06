import type { AppliedRule } from "./AppliedRule";

/**
 * TableRowData type
 * This type is used to represent the data of a row in the solver table
 * @param line: number - the line number of the row
 * @param formula: string - the formula of the row
 * @param rule: AppliedRule - the rule that resulted in the formula
 * @param editable: boolean - whether the row is editable or not
 */
export type TableRowData = {
    line: number;
    formula: string;
    rule: AppliedRule;
    editable: boolean;
}