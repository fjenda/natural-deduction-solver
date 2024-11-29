import {Node} from "./Node";

export class DeductionProcessor {
    static isAction(token: string): boolean {
        return ["QuantifierBlock", "NegationBlock", "OperatorBlock"].includes(token);
    }

    static isOperator(token: string): boolean {
        return ["OperatorBlock"].includes(token);
    }


    // breadth first search to find the first action which we can remove
    // in case there are multiple actions, we will return an array of all of them
    static getNextOperation(tree: Node): Node[] | null {
        let results: Node[] = [];
        let queue = [tree];

        while (queue.length > 0) {
            let node = queue.shift();
            if (!node) continue;

            if (this.isAction(node.type)) {
                if (this.isOperator(node.type)) {
                    results.push(new Node(node.type , node.children[0].value));
                    queue.push(...node.children);
                } else {
                    return results.length > 0 ? results : [new Node(node.type, node.children[0].value)];
                }
            } else {
                queue.push(...node.children);
            }
        }

        return results.length > 0 ? results : null;
    }

    // depth first search to build the string
    static toString(tree: Node): string {
        let stack = [tree];
        let result = "";

        while (stack.length > 0) {
            let node = stack.pop();
            if (!node) continue;

            if (node.children.length > 0) {
                stack.push(...[...node.children].reverse());
            }

            if (!node.value) continue;

            if (node.type === "LogicalOp") {
                result += ` ${node.value} `;
            } else {
                result += node.value;
            }
        }

        return result;
    }

    // Gets all available constants that are not used in any of the premises
    private static getAvailableConstants(trees: Node | Node[]): Set<string> {
        let usedConstants = new Set<string>();

        if (Array.isArray(trees)) {
            for (let tree of trees) {
                this.getAvailableConstants(tree).forEach(constant => usedConstants.add(constant));
            }
        } else {
            let stack = [trees];

            while (stack.length > 0) {
                let node = stack.pop();
                if (!node) continue;

                if (node.type === "Constant") {
                    usedConstants.add(node.value!);
                }

                stack.push(...node.children);
            }
        }

        // return constants [a-g] that are not in the constants set
        let constants: Set<string> = new Set();
        for (let i = 97; i <= 103; i++) {
            if (!usedConstants.has(String.fromCharCode(i))) {
                constants.add(String.fromCharCode(i));
                // break;
            }
        }

        return constants;
    }

    static getAvailableConstant(tree: Node): string {
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

    // Replaces a variable in the whole tree to a given value
    static replaceVariable(tree: Node, variable: string, replacement: string): Node {
        if (!tree) return tree;

        if (tree.type === "Variable" && tree.value === variable) {
            return new Node("Constant", replacement);
        }

        tree.children = tree.children.map(child => this.replaceVariable(child, variable, replacement));
        return tree;
    }

    private static findChild(tree: Node, type: string): Node | null {
        if (!tree) return null;

        for (let child of tree.children) {
            if (child.type === type) {
                return child;
            }
        }

        return null;
    }

    // eliminate quantifier from the tree
    static eliminateQuantifier(tree: Node): Node | null {
        if (!tree) return null;

        if (tree.type === "Formula" && tree.children.length === 1 && tree.children[0].type === "QuantifierBlock") {
            return this.eliminateQuantifier(tree.children[0]);
        }

        if (tree.type === "QuantifierBlock" && tree.children.length === 3 && ["?", "@"].includes(tree.children[0].value!)) {
            const constant = this.getAvailableConstant(tree);

            const res = this.replaceVariable(tree.children[2], tree.children[1].value!, constant);
            return this.eliminateQuantifier(res);
        }

        if (tree.type === "Formula" && tree.children.length === 1 && tree.children[0].type === "BracketsBlock") {
            return this.eliminateQuantifier(tree.children[0]);
        }

        if (tree.type === "BracketsBlock" && tree.children.length === 3 && tree.children[1].type === "Formula") {
            return tree.children[1];
        }

        return tree;
    }

    // TODO: make this private and create a public method that handles the creation of the operator node
    static introduceOperator(first: Node, second: Node, operator: Node): Node | null {
        if (!first || !second || !operator) return null;

        // remove the "Formula" block wrapper around the first and second trees
        if (first.type === "Formula") {
            first = first.children[0];
        }

        if (second.type === "Formula") {
            second = second.children[0];
        }

        let node = new Node("Formula");
        let operatorBlock = new Node("OperatorBlock");

        operatorBlock.setChildren([second, operator]);
        node.setChildren([operatorBlock, first]);

        return node;
    }

    static eliminateOperator(tree: Node): Node[] | null {
        if (!tree) return null;

        if (tree.type === "Formula" && tree.children.length === 2 && tree.children[0].type === "OperatorBlock") {
            return [tree.children[1], tree.children[0].children[0]];
        }

        return null;
    }
}