import type {AppliedRule} from "./AppliedRule";

export interface TableRowData {
    line: number;
    formula: string;
    rule: AppliedRule;
    editable: boolean;
}