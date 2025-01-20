import {Node} from "./Node";
import {Operator} from "./Operator";
import {NDRule} from "../solver/parsers/DeductionRules";
import type {TreeRuleType} from "../../types/TreeRuleType";
import {get} from "svelte/store";
import {selectedRows, solverContent} from "../../stores/solverStore";
import {FormulaComparer} from "../solver/FormulaComparer";

export class DeductionProcessor {
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

    // TODO: determine whether to use the first or second tree as the first argument
    //       and whether to wrap the trees in a ParenthesesBlock
    static introduceOperator(first: Node, second: Node, operator: Operator): Node | null {
        if (!first || !second) return null;

        const op = new Node("BinaryOperation", operator);
        op.setChildren([first, second]);
        return op.parenthesize();
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
        const rows = get(solverContent).proof;

        const selected = get(selectedRows);
        if (selected.length === 0) return { highlighted: [], applicable: false };

        const uniqueRowsMap = new Map<string, number>();
        switch (operation) {
            // A, B => A AND B
            case NDRule.ICON:
            // A => A OR B || B => A OR B
            // TODO: handle the second case?
            case NDRule.IDIS:
            // B => A IMP B
            case NDRule.IIMP: {
                // remove duplicates and retain row numbers
                rows.forEach((row, index) => {
                    if (index + 1 === selected[0]) return;

                    if (row.value === rows[selected[0] - 1].value) return;

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
                const row = rows[selected[0] - 1];
                if (row.tree?.value === Operator.CONJUNCTION) {
                    return { highlighted: [selected[0]], applicable: true };
                }

                // if it doesn't maybe its inside parentheses
                if (row.tree?.type === "ParenthesesBlock") {
                    const inner = row.tree.children[1];
                    if (inner.value === Operator.CONJUNCTION) {
                        return { highlighted: [selected[0]], applicable: true };
                    }
                }

                break;
            }

            // TODO: Some cases need parentheses around them, figure out how to handle that
            //        A =   a OR b IMP c
            //       !A = !(a OR b IMP c)
            //       For now it works only for simple formulas like a single constant, variable or function
            // A OR B, !A => B || A OR B, !B => A
            case NDRule.EDIS: {
                // there are two cases, either the selected row has a disjunction or it's the "!A"
                // TODO: replace with enum
                let type = "disjunction";

                // check if the selected row has a disjunction operator
                const row = rows[selected[0] - 1];
                if (row.tree?.value !== Operator.DISJUNCTION) {
                    type = "basic";
                }

                switch (type) {
                    // selected row is A OR B
                    case "disjunction": {
                        // get the left and the right part
                        const [left, right] = this.splitTree(row.tree!);

                        let negatedLeft = new Node("Negation", Operator.NEGATION);
                        negatedLeft.setChildren([left]);

                        let negatedRight = new Node("Negation", Operator.NEGATION);
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
                        const row = rows[selected[0] - 1];
                        if (row.tree?.value !== Operator.NEGATION) {
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
                const row = rows[selected[0] - 1];
                if (row.tree?.value !== Operator.IMPLICATION) {
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
                            if (index + 1 === selected[0]) return;

                            if (row.value === rows[selected[0] - 1].value) return;

                            if (!uniqueRowsMap.has(row.value)) {
                                uniqueRowsMap.set(row.value, index + 1);
                            }
                        });
                        // get rules that have implication operators
                        // and have the selected row as the left part of the implication
                        let indices: number[] = [];
                        uniqueRowsMap.forEach((index, value) => {
                            if (rows[index - 1].tree?.value === Operator.IMPLICATION && rows[index - 1].tree?.children[0].equals(row.tree!)) {
                                indices.push(index);
                            }
                        });

                        return { highlighted: indices, applicable: true };
                    }
                }

                break;
            }

            // A IMP B, B IMP A => A EQ B
            case NDRule.IEQ: {
                // check if selected row has an implication operator
                const row = rows[selected[0] - 1];
                if (row.tree?.value !== Operator.IMPLICATION) {
                    break;
                }

                // get the left and right part of the implication
                const [left, right] = this.splitTree(row.tree!);

                // reorganize the implication into "right IMP left"
                const reorganized = new Node("BinaryOperation", Operator.IMPLICATION);
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
                const row = rows[selected[0] - 1];
                if (row.tree?.value !== Operator.EQUIVALENCE) {
                    break;
                }

                // TODO: should anything happen after? I don't think so
                return { highlighted: [], applicable: true };
            }
        }


        return { highlighted: [], applicable: false };
    }

    public static applyRule(operation: NDRule, selected: TreeRuleType, other: TreeRuleType | null): TreeRuleType | TreeRuleType[] | null {
        switch (operation) {
            // A, B => A AND B
            case NDRule.ICON: {
                if (!other) return;

                const res = this.introduceOperator(selected.tree!, other.tree!, Operator.CONJUNCTION);
                if (!res) return;

                const resString = Node.generateString(res);
                if (!resString) return;

                // check if it already exists
                if (get(solverContent).proof.findIndex(row => FormulaComparer.compareFormulas(row.value, resString)) !== -1) {
                    alert("This formula already exists in the proof");
                    return;
                }

                return {
                    line: get(solverContent).proof.length + 1,
                    tree: res,
                    rule: { rule: NDRule.ICON, lines: [selected.line, other.line] },
                    value: resString
                };
            }
            case NDRule.ECON: {
                // check if we are in parentheses
                let left: Node, right: Node;
                if (selected.tree?.type === "ParenthesesBlock") {
                    [left, right] = this.splitTree(selected.tree.children[1]);
                } else {
                    [left, right] = this.splitTree(selected.tree!);
                }

                const leftString = Node.generateString(left);
                const rightString = Node.generateString(right);
                if (!leftString || !rightString) return;

                const result: TreeRuleType[] = [];
                if (get(solverContent).proof.findIndex(row => row.value === leftString) === -1) {
                    result.push({
                        line: get(solverContent).proof.length + 1,
                        tree: left,
                        rule: { rule: NDRule.ECON, lines: [selected.line] },
                        value: leftString
                    });
                }

                if (get(solverContent).proof.findIndex(row => row.value === rightString) === -1) {
                    result.push({
                        line: get(solverContent).proof.length + 2,
                        tree: right,
                        rule: { rule: NDRule.ECON, lines: [selected.line] },
                        value: rightString
                    });
                }

                return result;
            }
            case NDRule.IIMP: {
                if (!other) return;

                let res = this.introduceOperator(selected.tree!, other.tree!, Operator.IMPLICATION);
                if (!res) return;

                const resString = Node.generateString(res);
                if (!resString) return;

                if (get(solverContent).proof.findIndex(row => row.value === resString) !== -1)
                    return;

                return {
                    line: get(solverContent).proof.length + 1,
                    tree: res,
                    rule: { rule: NDRule.IIMP, lines: [selected.line, other.line] },
                    value: resString
                };
            }
        }
    }

    public static getUsableRowsFromOperation(operator: string, elimination: boolean = false) {
        switch (operator) {
            case "∧": return this.getUsableRows(elimination ? NDRule.ECON : NDRule.ICON);
            case "∨": return this.getUsableRows(elimination ? NDRule.EDIS : NDRule.IDIS);
            case "⊃": return this.getUsableRows(elimination ? NDRule.MP : NDRule.IIMP);
            case "≡": return this.getUsableRows(elimination ? NDRule.EEQ : NDRule.IEQ);
            case "¬": break;
        }
    }
}