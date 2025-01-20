import type {Node} from "../lib/parsers/Node";
import type {AppliedRule} from "./AppliedRule";

export type TreeRuleType = {
    line: number,
    tree: Node | null;
    rule: AppliedRule;
    value: string;
}