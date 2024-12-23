import type {Node} from "../lib/parsers/Node";

export type TreeRuleType = {
    tree: Node | null;
    rule: string;
    value: string;
}