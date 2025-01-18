import type {Node} from "../lib/parsers/Node";

export type TreeRuleType = {
    line: number,
    tree: Node | null;
    rule: string;
    value: string;
}