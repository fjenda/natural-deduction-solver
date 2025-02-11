import {Node} from "../../syntax-checker/Node";
import {Operator} from "../../syntax-checker/Operator";
import {NDRule} from "./DeductionRules";
import type {TreeRuleType} from "../../../types/TreeRuleType";
import {get} from "svelte/store";
import {selectedRows, solverContent} from "../../../stores/solverStore";
import {FormulaComparer} from "../FormulaComparer";
import {NodeType} from "../../syntax-checker/NodeType";
import type { ProveResult } from "../../../types/ProveResult";

/**
 * Class that processes deduction rules
 */
export class DeductionProcessor {
    /**
     * Splits the tree into two halves
     * @param tree - The tree to split
     * @returns The two halves of the tree
     */
    public static splitTree(tree: Node): Node[] {
        if (!tree) return [];

        return [tree.children[0], tree.children[1]];
    }

    public static getUsableRows(operation: NDRule): { highlighted: number[], applicable: boolean } {
        const selected = get(selectedRows);
        if (selected.length === 0) return { highlighted: [], applicable: false };

        const rows = get(solverContent).proof;
        const rowTreeSimple = rows[selected[0] - 1].tree?.simplify();
        if (!rowTreeSimple) return { highlighted: [], applicable: false };
        let indices: number[] = [];

        // remove duplicates and retain row numbers
        const uniqueRowsMap = new Map<string, number>();
        rows.forEach((row, index) => {
            if (index + 1 === selected[0]) return;

            if (FormulaComparer.compare(row, rows[selected[0] - 1])) return;

            if (!uniqueRowsMap.has(row.value)) {
                uniqueRowsMap.set(row.value, index + 1);
            }
        });

        switch (operation) {
            // A, B => A AND B
            case NDRule.ICON:
            // B => A IMP B
            case NDRule.IIMP: {
                // return the row_numbers of unique rows
                return { highlighted: Array.from(uniqueRowsMap.values()), applicable: true };
            }

            // A => A OR B || B => A OR B
            case NDRule.IDIS: {
                // this rule can have anything as the other row
                return { highlighted: [], applicable: true };
            }

            // A AND B => A, B
            case NDRule.ECON: {
                // check if the selected row has a conjunction operator
                if (rowTreeSimple.value === Operator.CONJUNCTION) {
                    return { highlighted: [selected[0]], applicable: true };
                }

                break;
            }

            // A OR B, !A => B || A OR B, !B => A
            case NDRule.EDIS: {
                // there are two cases, either the selected row has a disjunction or it's the "!A"
                // TODO: replace with enum
                let type = "disjunction";

                // check if the selected row has a disjunction operator
                if (rowTreeSimple.value !== Operator.DISJUNCTION) {
                    type = "basic";
                }

                switch (type) {
                    // selected row is A OR B
                    case "disjunction": {
                        // get the left and the right part
                        const [left, right] = this.splitTree(rowTreeSimple);
                        const leftSimple = left.simplify();
                        const rightSimple = right.simplify();

                        // check if the negated left part exists in the rules
                        const leftIndex = rows.findIndex(r => r.tree?.simplify().isNegationOf(leftSimple));

                        // check if the negated right part exists in the rules
                        const rightIndex = rows.findIndex(r => r.tree?.simplify().isNegationOf(rightSimple));

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
                        if (rowTreeSimple.value !== Operator.NEGATION) {
                            break;
                        }

                        // find all rows that have disjunction as the top operator
                        rows.forEach((r, index) => {
                            const rTreeSimple = r.tree?.simplify();
                            if (rTreeSimple?.value === Operator.DISJUNCTION) {
                                // split the tree into left and right parts
                                const [left, right] = this.splitTree(rTreeSimple!);

                                // check if the left or right part is the negation of the selected row
                                if (rowTreeSimple.isNegationOf(left) || rowTreeSimple.isNegationOf(right)) {
                                    indices.push(index + 1);
                                }
                            }
                        });

                        return { highlighted: indices, applicable: true };
                    }
                }

                return { highlighted: [], applicable: false };
            }

            // A IMP B, A => B
            case NDRule.MP: {
                // check if implication operator is present
                const hasImplication: boolean = rowTreeSimple.value === Operator.IMPLICATION;

                uniqueRowsMap.forEach((index, value) => {
                    const tmp = rows[index - 1].tree?.simplify();

                    // selected row is A
                    if (tmp?.value === Operator.IMPLICATION && tmp.children[0].equals(rowTreeSimple)) {
                        indices.push(index);
                    }

                    if (!hasImplication) return;

                    // selected row is A IMP B
                    const [left, _] = this.splitTree(rowTreeSimple);
                    if (tmp?.equals(left)) {
                        indices.push(index);
                    }
                });

                return { highlighted: indices, applicable: true };
            }

            // A IMP B, B IMP A => A EQ B
            case NDRule.IEQ: {
                // check if selected row has an implication operator
                if (rowTreeSimple.value !== Operator.IMPLICATION) break;

                // get the left and right part of the implication
                const [left, right] = this.splitTree(rowTreeSimple);

                // reorganize the implication into "right IMP left"
                const reorganized = new Node(NodeType.BINARY_OPERATION, Operator.IMPLICATION);
                reorganized.setChildren([right, left]);

                // check if the reorganized implication exists in the rules
                const reorganizedIndex = rows.findIndex(r => r.tree?.simplify().equals(reorganized));

                // if not found, return an empty array
                if (reorganizedIndex === -1) return { highlighted: [], applicable: false };

                return { highlighted: [reorganizedIndex + 1], applicable: true };
            }

            // A EQ B => A IMP B, B IMP A
            case NDRule.EEQ: {
                // check if the selected row has an equivalence operator
                if (rowTreeSimple.value !== Operator.EQUIVALENCE) {
                    break;
                }

                return { highlighted: [], applicable: true };
            }
        }


        return { highlighted: [], applicable: false };
    }

    /**
     * Checks if the formula already exists in the proof
     * @param formula The formula to check
     * @private
     */
    public static existsInProof(formula: TreeRuleType): boolean {
        return get(solverContent).proof.findIndex(r => FormulaComparer.compare(r, formula)) !== -1;
    }
}