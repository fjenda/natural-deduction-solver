import {Node} from "./Node";
import {Operator} from "./Operator";
import {NDRule} from "../solver/parsers/DeductionRules";
import type {TreeRuleType} from "../../types/TreeRuleType";
import {get} from "svelte/store";
import {selectedRow} from "../../stores/solverStore";

export class DeductionProcessor {
    /**
     *  Checks if the token is an action
     *  @param token - The token to check
     *  @returns True if the token is an action, false otherwise
     */
    static isAction(token: string): boolean {
        return ["QuantifierBlock", "NegationBlock", "OperatorBlock"].includes(token);
    }

    /**
     *  Checks if the token is an operator
     *  @param token - The token to check
     *  @returns True if the token is an operator, false otherwise
     */
    static isOperator(token: string): boolean {
        return ["OperatorBlock", "NegationBlock"].includes(token);
    }

    static getPrecedence(operator: string): number {
        switch (operator) {
            case "!":
                return 0;
            case "&":
                return 1;
            case "|":
                return 2;
            case ">":
                return 3;
            case "=":
                return 4;
            default:
                return -1;
        }
    }

    /**
     * Gets the next operation to perform using a breadth-first search
     * @param tree - The tree to search
     * @returns The next operation to perform or null if there are no actions
     */
    static getNextOperation(tree: Node): Operator {
        // return the root of the tree
        return tree.value as Operator;
    }

    // depth first search to build the string
    /**
     * Converts the tree to a string using a depth-first search
     * @param tree - The tree to convert
     * @returns The string representation of the tree
     */
    static toString(tree: Node): string {
        let stack = [tree];
        let result = "";

        // depth first search
        while (stack.length > 0) {
            let node = stack.pop();
            if (!node) continue;

            // if the node has children, add them to the stack
            if (node.children.length > 0) {
                stack.push(...[...node.children].reverse());
            }

            if (!node.value) continue;

            // if the node is a logical operator, add spacing around it
            if (node.type === "LogicalOp") {
                result += ` ${node.value} `;
            } else {
                result += node.value;
            }
        }

        return result;
    }

    // Gets all available constants that are not used in any of the premises
    /**
     * Gets all available constants that are not used in any of the premises
     * @param trees - The premise(s) to check
     * @private
     * @returns The set of available constants
     */
    private static getAvailableConstants(trees: Node | Node[]): Set<string> {
        let usedConstants = new Set<string>();

        if (Array.isArray(trees)) {
            // get all constants from all premises
            for (let tree of trees) {
                this.getAvailableConstants(tree).forEach(constant => usedConstants.add(constant));
            }
        } else {
            console.log(`Checking constants for tree: ${this.toString(trees)}`);
            let stack = [trees];

            // breadth first search
            while (stack.length > 0) {
                let node = stack.pop();
                if (!node) continue;

                console.log(`Checking node: ${node.type} - ${node.value}`)
                if (node.type === "Constant") {
                    console.log(`Adding constant ${node.value} to used constants`);
                    usedConstants.add(node.value!);
                }

                stack.push(...node.children);
            }
        }

        // return constants [a-g] that are not in the constants set
        // TODO: change to a more dynamic solution
        let constants: Set<string> = new Set();
        for (let i = 97; i <= 103; i++) {
            if (!usedConstants.has(String.fromCharCode(i))) {
                constants.add(String.fromCharCode(i));
                // break;
            }
        }

        return constants;
    }

    // TODO:
    //  create a VariableTable that will hold all available and used variables/constants/functions/predicates
    //  and will be used to get the next available constant
    /**
     * Gets the next available constant
     * @param tree - The tree(s) to check
     * @returns The next available constant
     */
    static getAvailableConstant(tree: Node | Node[]): string {
        let constants = this.getAvailableConstants(tree);

        if (constants.size === 0) {
            throw new Error("No available constants");
        }

        const value = constants.values().next().value;
        if (typeof value !== "string") {
            throw new Error("No available constants");
        }

        return value;
    }

    /**
     * Replaces a variable in the whole tree to a given value
     * @param tree
     * @param variable
     * @param replacement
     * @returns The tree with the variable replaced
     */
    static replaceVariable(tree: Node, variable: string, replacement: string): Node {
        if (!tree) return tree;

        // find the variable block and replace it with the replacement
        if (tree.type === "Variable" && tree.value === variable) {
            return new Node("Constant", replacement);
        }

        // recursively call the function on all children
        tree.children = tree.children.map(child => this.replaceVariable(child, variable, replacement));
        return tree;
    }

    // private static findChild(tree: Node, type: string): Node | null {
    //     if (!tree) return null;
    //
    //     for (let child of tree.children) {
    //         if (child.type === type) {
    //             return child;
    //         }
    //     }
    //
    //     return null;
    // }

    /**
     * Eliminates a quantifier from the tree
     * @param tree
     * @returns The tree with the quantifier eliminated
     */
    static eliminateQuantifier(tree: Node): Node | null {
        if (!tree) return null;

        return tree.children[2].children[1];
    }

    private static introduceOperatorInternal(first: Node, second: Node, operator: Node) {
        if (!first || !second || !operator) return null;

        operator.setChildren([first, second]);

        return operator;
    }

    // TODO: determine whether to use the first or second tree as the first argument
    //       and whether to wrap the trees in a ParenthesesBlock
    static introduceOperator(first: Node, second: Node, operator: string): Node | null {
        switch (operator) {
            case "&":
                return this.introduceOperatorInternal(first, second, new Node("BinaryOperation", "∧"));
            case "|":
                return this.introduceOperatorInternal(first, second, new Node("BinaryOperation", "∨"));
            case ">":
                return this.introduceOperatorInternal(first, second, new Node("BinaryOperation", "⊃"));
            case "=":
                return this.introduceOperatorInternal(first, second, new Node("BinaryOperation", "≡"));
            default:
                return null;
        }
    }

    /**
     * Eliminates an operator from the tree
     * @param tree - The tree to eliminate the operator from
     * @param operator - The operator to eliminate
     * @returns The two halves of the tree split by the operator
     */
    static eliminateOperator(tree: Node, operator: Operator): Node[] | null {
        if (!tree) return null;

        console.log(`Eliminating operator: ${operator}`);

        switch (operator) {
            case Operator.CONJUNCTION: {
                // if the operator is a conjunction, we split the tree into two halves
                return this.splitTree(tree);
            }
            case Operator.DISJUNCTION: {
                // TODO
            }
            case Operator.IMPLICATION: {
                // TODO
                break;
            }
            case Operator.EQUIVALENCE: {
                // TODO
                break;
            }
            case Operator.NEGATION: {
                // TODO
                break;
            }
            default:
                return null;
        }

        return null;
    }

    /**
     * Splits the tree into two halves
     * @param tree - The tree to split
     * @returns The two halves of the tree
     */
    private static splitTree(tree: Node): Node[] {
        if (!tree) return [];

        return [tree.children[0], tree.children[1]];
    }

    public static getUsableRows(rows: TreeRuleType[], operation: NDRule): number[] {
        switch (operation) {
            case NDRule.ICON: {
                // remove duplicates and retain row numbers
                const uniqueRowsMap = new Map<string, number>();

                rows.forEach((row, index) => {
                    if (index + 1 === get(selectedRow)) return;

                    if (!uniqueRowsMap.has(row.value)) {
                        uniqueRowsMap.set(row.value, index + 1);
                    }
                });

                // return the row_numbers of unique rows
                return Array.from(uniqueRowsMap.values());
            }

            case NDRule.ECON: {
                // check if the selected row has a conjunction operator
                const row = rows[get(selectedRow) - 1];
                if (row.tree?.value === "∧") {
                    return [get(selectedRow)];
                }

                break;
            }

            case NDRule.IDIS: {
                // remove duplicates and retain row numbers
                const uniqueRowsMap = new Map<string, number>();

                rows.forEach((row, index) => {
                    if (index + 1 === get(selectedRow)) return;

                    if (!uniqueRowsMap.has(row.value)) {
                        uniqueRowsMap.set(row.value, index + 1);
                    }
                });

                // return the row_numbers of unique rows
                return Array.from(uniqueRowsMap.values());
            }

            // TODO: maybe make this work the other way? meaning if i select !A and find A | B i can use this?
            case NDRule.EDIS: {
                // check if the selected row has a disjunction operator
                const row = rows[get(selectedRow) - 1];
                if (row.tree?.value !== "∨") {
                    break;
                }

                // get the left and the right part
                let negatedLeft = new Node("Negation", "¬");
                negatedLeft.children.push(row.tree.children[0]);

                let negatedRight = new Node("Negation", "¬");
                negatedRight.children.push(row.tree.children[1]);

                // check if the negated left part exists in the rules
                const leftIndex = rows.findIndex(r => r.tree?.equals(negatedLeft));

                // check if the negated right part exists in the rules
                const rightIndex = rows.findIndex(r => r.tree?.equals(negatedRight));

                let indices: number[] = [];
                if (leftIndex !== -1) {
                    indices.push(leftIndex + 1);
                }

                if (rightIndex !== -1) {
                    indices.push(rightIndex + 1);
                }

                return indices;
            }
        }


        return [];
    }

    public canApplyRule(row: TreeRuleType): { applicable: boolean, rows?: number[] } {
        switch (row.rule) {
            case NDRule.ECON: {
                if (row.tree?.value === "∧") {
                    return { applicable: true };
                }
            }

            case NDRule.EDIS: {

            }
        }
    }

    /**
     * Recursively prunes the tree to construct the first half up to the operator.
     */
    // static pruneTree(node: Node, operatorToRemove: Node): Node | null {
    //     if (!node) return null;
    //
    //     const clonedNode = new Node(node.type, node.value);
    //     const op = operatorToRemove.value!;
    //
    //     // check if the current node's children include the operator
    //     if (node.children[0]?.value === op) {
    //         clonedNode.children = [];
    //         return clonedNode;
    //     }
    //
    //     // recursively prune children
    //     const prunedChildren = node.children.map(child =>
    //         this.pruneTree(child, operatorToRemove)
    //     );
    //
    //     // set only non-null pruned children
    //     clonedNode.setChildren(prunedChildren.filter(child => child !== null));
    //     return clonedNode;
    // }


}