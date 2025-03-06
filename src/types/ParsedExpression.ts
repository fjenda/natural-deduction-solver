import type { Node } from "../lib/syntax-checker/Node";

/**
 * ParsedExpression type
 * This type is a combination of a syntax tree and its value
 * @param tree: Node | null - the syntax tree of the expression
 * @param value: string - the value of the expression
 */
export type ParsedExpression = {
    tree: Node | null;
    value: string;
}