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

    static introduceOperator(first: Node, second: Node, operator: Operator): Node | null {
        if (!first || !second) return null;

        first = first.simplify();
        second = second.simplify();

        // first = first.parenthesize();
        // second = second.parenthesize();

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
        const selected = get(selectedRows);
        if (selected.length === 0) return { highlighted: [], applicable: false };

        const rows = get(solverContent).proof;
        const rowTreeSimple = rows[selected[0] - 1].tree?.simplify();
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
            // A => A OR B || B => A OR B
            // TODO: handle the second case where the selected row is the part of the disjunction
            case NDRule.IDIS:
            // B => A IMP B
            case NDRule.IIMP: {
                // return the row_numbers of unique rows
                return { highlighted: Array.from(uniqueRowsMap.values()), applicable: true };
            }

            // A AND B => A, B
            case NDRule.ECON: {
                // check if the selected row has a conjunction operator
                if (rowTreeSimple?.value === Operator.CONJUNCTION) {
                    return { highlighted: [selected[0]], applicable: true };
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
                if (rowTreeSimple?.value !== Operator.DISJUNCTION) {
                    type = "basic";
                }

                switch (type) {
                    // selected row is A OR B
                    case "disjunction": {
                        // get the left and the right part
                        const [left, right] = this.splitTree(rowTreeSimple);

                        let negatedLeft = new Node("Negation", Operator.NEGATION);
                        negatedLeft.setChildren([left]);
                        const negatedLeftSimple = negatedLeft.simplify();

                        let negatedRight = new Node("Negation", Operator.NEGATION);
                        negatedRight.setChildren([right]);
                        const negatedRightSimple = negatedRight.simplify();

                        // check if the negated left part exists in the rules
                        const leftIndex = rows.findIndex(r => r.tree?.simplify().equals(negatedLeftSimple));

                        // check if the negated right part exists in the rules
                        const rightIndex = rows.findIndex(r => r.tree?.simplify().equals(negatedRightSimple));

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
                        if (rowTreeSimple?.value !== Operator.NEGATION) {
                            break;
                        }

                        // find all rows that have disjunction as the top operator

                        rows.forEach((r, index) => {
                            const rTreeSimple = r.tree?.simplify();
                            if (rTreeSimple?.value === Operator.DISJUNCTION) {
                                // split the tree into left and right parts
                                const [left, right] = this.splitTree(rTreeSimple!);

                                // check if the left or right part is the same as the selected row
                                // TODO: finish this

                                indices.push(index + 1);
                            }
                        });
                    }
                }

                break;
            }

            // A IMP B, A => B
            case NDRule.MP: {
                // check if implication operator is present
                const hasImplication: boolean = rowTreeSimple?.value === Operator.IMPLICATION;

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
                if (rowTreeSimple?.value !== Operator.IMPLICATION) {
                    break;
                }

                // get the left and right part of the implication
                const [left, right] = this.splitTree(rowTreeSimple);

                // reorganize the implication into "right IMP left"
                const reorganized = new Node("BinaryOperation", Operator.IMPLICATION);
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
                if (rowTreeSimple?.value !== Operator.EQUIVALENCE) {
                    break;
                }

                // TODO: should anything happen after? I don't think so
                return { highlighted: [], applicable: true };
            }
        }


        return { highlighted: [], applicable: false };
    }

    public static applyRule(operation: NDRule, selected: TreeRuleType, other: TreeRuleType | null): TreeRuleType | TreeRuleType[] | null {
        // simpler tree structure without parentheses
        const rowTreeSimple: Node = selected.tree?.simplify();

        switch (operation) {
            // A, B => A AND B
            case NDRule.ICON: {
                // if no other row is selected, return
                if (!other) return;

                // introduce the conjunction operator
                const res = this.introduceOperator(selected.tree!, other.tree!, Operator.CONJUNCTION);
                if (!res) return;

                // generate the string representation of the tree
                const resString = Node.generateString(res);
                if (!resString) return;

                // construct a tmp object
                const tmp: TreeRuleType = {
                    line: get(solverContent).proof.length + 1,
                    tree: res,
                    rule: { rule: NDRule.ICON, lines: [selected.line, other.line] },
                    value: resString
                };

                // check if it already exists in the proof
                if (this.existsInProof(tmp)) return;

                return tmp;
            }
            case NDRule.ECON: {
                let [left, right] = this.splitTree(rowTreeSimple!);
                left = left.parenthesize();
                right = right.parenthesize();

                const leftString = Node.generateString(left);
                const rightString = Node.generateString(right);
                if (!leftString || !rightString) return;

                const result: TreeRuleType[] = [];
                let lineOffset = 1;
                const leftTmp: TreeRuleType = {
                    line: get(solverContent).proof.length + lineOffset,
                    tree: left,
                    rule: { rule: NDRule.ECON, lines: [selected.line] },
                    value: leftString
                };
                if (!this.existsInProof(leftTmp)) {
                    result.push(leftTmp);
                    lineOffset++;
                }

                const rightTmp: TreeRuleType = {
                    line: get(solverContent).proof.length + lineOffset,
                    tree: right,
                    rule: { rule: NDRule.ECON, lines: [selected.line] },
                    value: rightString
                };

                if (!this.existsInProof(rightTmp)) {
                    result.push(rightTmp);
                }

                return result;
            }
            case NDRule.IDIS: {
                if (!other) return;

                let res = this.introduceOperator(selected.tree!, other.tree!, Operator.DISJUNCTION);
                if (!res) return;

                const resString = Node.generateString(res);
                if (!resString) return;

                const tmp: TreeRuleType = {
                    line: get(solverContent).proof.length + 1,
                    tree: res,
                    rule: { rule: NDRule.IDIS, lines: [selected.line, other.line] },
                    value: resString
                };

                if (this.existsInProof(tmp)) return;

                return tmp;
            }
            case NDRule.EDIS: {
                if (!other) return;
                // TODO: determine which tree to use as the first argument
                //       it could be `A v B` or `!A`, we need get the left side of the first tree
                //       for now the first is used since the way usableRows are acquired
                console.log(selected, other);
                // check if we are in parentheses
                let [left, right] = this.splitTree(rowTreeSimple!);

                left = left.parenthesize();
                right = right.parenthesize();

                const leftString = Node.generateString(left);
                const rightString = Node.generateString(right);
                if (!leftString || !rightString) return;

                // determine if the other row is the negated left or right part of the disjunction
                return;
            }
            case NDRule.IIMP: {
                if (!other) return;

                let res = this.introduceOperator(selected.tree!, other.tree!, Operator.IMPLICATION);
                if (!res) return;

                const resString = Node.generateString(res);
                if (!resString) return;

                const tmp: TreeRuleType = {
                    line: get(solverContent).proof.length + 1,
                    tree: res,
                    rule: { rule: NDRule.IIMP, lines: [selected.line, other.line] },
                    value: resString
                };

                if (this.existsInProof(tmp)) return;

                return {
                    line: get(solverContent).proof.length + 1,
                    tree: res,
                    rule: { rule: NDRule.IIMP, lines: [selected.line, other.line] },
                    value: resString
                };
            }
            case NDRule.MP: {
                if (!other) return;

                // get the implication part
                const otherTreeSimple: Node = other.tree!.simplify();
                let leftSelected, rightSelected: Node | null = null;
                let leftOther, rightOther: Node | null = null;

                if (rowTreeSimple?.value === Operator.IMPLICATION) {
                    [leftSelected, rightSelected] = this.splitTree(rowTreeSimple!);
                }

                if (otherTreeSimple?.value === Operator.IMPLICATION) {
                    [leftOther, rightOther] = this.splitTree(otherTreeSimple!);
                }

                let res: Node | null = null;
                if (leftSelected?.equals(otherTreeSimple)) {
                    res = rightSelected;
                }

                if (leftOther?.equals(rowTreeSimple)) {
                    res = rightOther;
                }

                if (!res) return;
                res = res.parenthesize();

                const resString = Node.generateString(res);
                if (!resString) return;

                const tmp: TreeRuleType = {
                    line: get(solverContent).proof.length + 1,
                    tree: res,
                    rule: { rule: NDRule.MP, lines: [selected.line, other.line ] },
                    value: resString
                }

                if (this.existsInProof(tmp)) return;

                return tmp;
            }
            case NDRule.IEQ: {
                if (!other) return;

                // replace the top operator
                const [left, right] = this.splitTree(rowTreeSimple!);
                const res = this.introduceOperator(left, right, Operator.EQUIVALENCE);
                if (!res) return;

                const resString = Node.generateString(res);
                if (!resString) return;

                const tmp: TreeRuleType = {
                    line: get(solverContent).proof.length + 1,
                    tree: res,
                    rule: { rule: NDRule.IEQ, lines: [selected.line, other.line] },
                    value: resString
                };

                if (this.existsInProof(tmp)) return;

                return tmp;
            }
            case NDRule.EEQ: {
                const [left, right] = this.splitTree(rowTreeSimple!);

                let res1 = this.introduceOperator(left, right, Operator.IMPLICATION);
                let res2 = this.introduceOperator(right, left, Operator.IMPLICATION);
                if (!res1 || !res2) return;

                const resString1 = Node.generateString(res1);
                const resString2 = Node.generateString(res2);
                if (!resString1 || !resString2) return;

                const result: TreeRuleType[] = [];
                let lineOffset = 1;
                const tmp1: TreeRuleType = {
                    line: get(solverContent).proof.length + lineOffset,
                    tree: res1,
                    rule: { rule: NDRule.EEQ, lines: [selected.line] },
                    value: resString1
                };

                if (!this.existsInProof(tmp1)) {
                    result.push(tmp1);
                    lineOffset++;
                }

                const tmp2: TreeRuleType = {
                    line: get(solverContent).proof.length + lineOffset,
                    tree: res2,
                    rule: { rule: NDRule.EEQ, lines: [selected.line] },
                    value: resString2
                };

                if (!this.existsInProof(tmp2)) {
                    result.push(tmp2);
                }

                return result;
            }
        }
    }

    private static existsInProof(formula: TreeRuleType): boolean {
        return get(solverContent).proof.findIndex(r => FormulaComparer.compare(r, formula)) !== -1;
    }
}