import {Node} from "./Node";
import {Operator} from "./Operator";
import {NDRule} from "../solver/parsers/DeductionRules";
import type {TreeRuleType} from "../../types/TreeRuleType";
import {get} from "svelte/store";
import {parsedProof, selectedRow, solverContent} from "../../stores/solverStore";

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
            case "∧":
                return this.introduceOperatorInternal(first, second, new Node("BinaryOperation", "∧"));
            case "∨":
                return this.introduceOperatorInternal(first, second, new Node("BinaryOperation", "∨"));
            case "⊃":
                return this.introduceOperatorInternal(first, second, new Node("BinaryOperation", "⊃"));
            case "≡":
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

    public static getUsableRows(operation: NDRule): { highlighted: number[], applicable: boolean } {
        const rows = get(parsedProof);

        if (get(selectedRow) === -1) return { highlighted: [], applicable: false };

        const uniqueRowsMap = new Map<string, number>();
        switch (operation) {
            // A, B => A AND B
            case NDRule.ICON:
            // A => A OR B || B => A OR B
            case NDRule.IDIS:
            // B => A IMP B
            case NDRule.IIMP: {
                // remove duplicates and retain row numbers
                rows.forEach((row, index) => {
                    if (index + 1 === get(selectedRow)) return;

                    if (row.value === rows[get(selectedRow) - 1].value) return;

                    if (!uniqueRowsMap.has(row.value)) {
                        uniqueRowsMap.set(row.value, index + 1);
                    }
                });

                // return the row_numbers of unique rows
                return { highlighted: Array.from(uniqueRowsMap.values()), applicable: true };
            }

            // A AND B => A, B
            case NDRule.ECON: {
                // check if the selected row has a conjunction operator
                const row = rows[get(selectedRow) - 1];
                if (row.tree?.value === "∧") {
                    return { highlighted: [get(selectedRow)], applicable: true };
                }

                break;
            }

            // TODO: Some cases need parentheses around them, figure out how to handle that
            //       A  =   a OR b IMP c
            //       !A = !(a OR b IMP c)
            //       For now it works only for simple formulas like a single constant, variable or function
            // A OR B, !A => B || A OR B, !B => A
            case NDRule.EDIS: {
                // there are two cases, either the selected row has a disjunction or it's the "!A"
                // TODO: replace with enum
                let type = "disjunction";

                // check if the selected row has a disjunction operator
                const row = rows[get(selectedRow) - 1];
                if (row.tree?.value !== "∨") {
                    type = "basic";
                }

                switch (type) {
                    // selected row is A OR B
                    case "disjunction": {
                        // get the left and the right part
                        const [left, right] = this.splitTree(row.tree!);

                        let negatedLeft = new Node("Negation", "¬");
                        negatedLeft.setChildren([left]);

                        let negatedRight = new Node("Negation", "¬");
                        negatedRight.setChildren([right]);

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

                        return { highlighted: indices, applicable: true };
                    }

                    // selected row is !A
                    case "basic": {
                        // check if the selected row is a negation
                        const row = rows[get(selectedRow) - 1];
                        if (row.tree?.value !== "¬") {
                            break;
                        }

                        // TODO: Finish this
                    }
                }

                break;
            }

            // A IMP B, A => B
            case NDRule.MP: {
                // there are two cases, either the selected row has an implication or it's the "A"
                // TODO: replace with enum
                let type = "implication";

                // check if implication operator is present
                const row = rows[get(selectedRow) - 1];
                if (row.tree?.value !== "⊃") {
                    type = "basic";
                }

                switch (type) {
                    // selected row is A IMP B
                    case "implication": {
                        // get the left and right part of the implication
                        const [left, right] = this.splitTree(row.tree!);

                        // check if the left part is present in the rules
                        const leftIndex = rows.findIndex(r => r.tree?.equals(left));

                        // if not found, return an empty array
                        if (leftIndex === -1) return { highlighted: [], applicable: false };

                        return { highlighted: [leftIndex + 1], applicable: true };
                    }

                    // selected row is A
                    case "basic": {
                        // remove duplicates and retain row numbers
                        rows.forEach((row, index) => {
                            if (index + 1 === get(selectedRow)) return;

                            if (row.value === rows[get(selectedRow) - 1].value) return;

                            if (!uniqueRowsMap.has(row.value)) {
                                uniqueRowsMap.set(row.value, index + 1);
                            }
                        });
                        // get rules that have implication operators
                        // and have the selected row as the left part of the implication
                        let indices: number[] = [];
                        uniqueRowsMap.forEach((index, value) => {
                            if (rows[index - 1].tree?.value === "⊃" && rows[index - 1].tree?.children[0].equals(row.tree!)) {
                                indices.push(index);
                            }
                        });

                        return { highlighted: indices, applicable: true };
                    }
                }

                break;
            }

            // A IMP B, B IMP A
            case NDRule.IEQ: {
                // check if selected row has an implication operator
                const row = rows[get(selectedRow) - 1];
                if (row.tree?.value !== "⊃") {
                    break;
                }

                // get the left and right part of the implication
                const [left, right] = this.splitTree(row.tree!);

                // reorganize the implication into "right IMP left"
                const reorganized = new Node("BinaryOperation", "⊃");
                reorganized.setChildren([right, left]);

                // check if the reorganized implication exists in the rules
                const reorganizedIndex = rows.findIndex(r => r.tree?.equals(reorganized));

                // if not found, return an empty array
                if (reorganizedIndex === -1) return { highlighted: [], applicable: false };

                return { highlighted: [reorganizedIndex + 1], applicable: true };
            }

            // A EQ B => A IMP B, B IMP A
            case NDRule.EEQ: {
                // check if the selected row has an equivalence operator
                const row = rows[get(selectedRow) - 1];
                if (row.tree?.value !== "≡") {
                    break;
                }

                // TODO: should anything happen after? I don't think so
                return { highlighted: [], applicable: true };
            }
        }


        return { highlighted: [], applicable: false };
    }

    public static applyRule(operation: NDRule, other: TreeRuleType) {
        const selected = get(parsedProof)[get(selectedRow) - 1];

        switch (operation) {
            // A, B => A AND B
            case NDRule.ICON: {
                const res = this.introduceOperator(selected.tree!, other.tree!, "∧");
                if (!res) return;

                const resString = Node.generateString(res);
                if (!resString) return;

                solverContent.update(content => {
                    content.addProof(resString);
                    return content;
                });
            }
        }
    }

    // public canApplyRule(row: TreeRuleType): { applicable: boolean, rows?: number[] } {
    //     switch (row.rule) {
    //         case NDRule.ECON: {
    //             if (row.tree?.value === "∧") {
    //                 return { applicable: true };
    //             }
    //         }
    //
    //         case NDRule.EDIS: {
    //
    //         }
    //     }
    // }
}