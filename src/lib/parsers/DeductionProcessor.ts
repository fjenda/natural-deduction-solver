import {Node} from "./Node";

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
    static getNextOperation(tree: Node): Node | null {
        let results: Node[] = [];
        let queue = [tree];
        let found = false;

        // breadth first search
        while (queue.length > 0) {
            let node = queue.shift();
            if (!node) continue;

            // if the node is an action
            if (this.isAction(node.type)) {
                // if the node is an operator block, add it to the results with value of the operator
                if (this.isOperator(node.type)) {
                    results.push(new Node(node.type, node.children[0].value));
                    queue.push(...node.children);
                    found = true;
                } else {
                    return new Node(node.type, node.children[0].value);
                }
            } else if (found && (node.type === "OperatorBlock" && node.children.length === 3 && node.children[2].type === "OperatorBlock")) {
                queue.push(...node.children);
            } else if (!found) {
                queue.push(...node.children);
            }
        }

        if (results.length === 0) {
            return null;
        }

        if (results.length === 1) {
            return results[0];
        }

        // check if all the results are the same operators
        let same = results.every(r => r.value === results[0].value);

        // if all are the same, evaluation proceeds with left-associative parentheses
        if (same) {
            return results[0];
        }

        // get the operator with the highest precedence
        let maxPrecedence = Math.max(...results.map(r => this.getPrecedence(r.value!)));
        let maxPrecedenceOperators = results.filter(r => this.getPrecedence(r.value!) === maxPrecedence);

        // if there are multiple operators with the same precedence, return the first one
        return maxPrecedenceOperators[0];
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
            let stack = [trees];

            // breadth first search
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

    private static findChild(tree: Node, type: string): Node | null {
        if (!tree) return null;

        for (let child of tree.children) {
            if (child.type === type) {
                return child;
            }
        }

        return null;
    }

    /**
     * Eliminates a quantifier from the tree
     * @param tree
     * @returns The tree with the quantifier eliminated
     */
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

    private static introduceOperatorInternal(first: Node, second: Node, operator: Node) {
        if (!first || !second || !operator) return null;

        // remove the "Formula" block wrapper around the first and second trees
        if (first.type === "Formula") {
            first = first.children[0];
        }

        if (second.type === "Formula") {
            second = second.children[0];
        }

        // create new operator block
        let node = new Node("Formula");
        let operatorBlock = new Node("OperatorBlock");

        operatorBlock.setChildren([operator, second]);
        node.setChildren([first, operatorBlock]);

        return node;
    }

    // TODO: determine whether to use the first or second tree as the first argument
    //       and whether to wrap the trees in a ParenthesesBlock
    static introduceOperator(first: Node, second: Node, operator: string): Node | null {
        switch (operator) {
            case "&":
                return this.introduceOperatorInternal(first, second, new Node("LogicalOp", "&"));
            case "|":
                return this.introduceOperatorInternal(first, second, new Node("LogicalOp", "|"));
            case "->":
                return this.introduceOperatorInternal(first, second, new Node("LogicalOp", "->"));
            case "<->":
                return this.introduceOperatorInternal(first, second, new Node("LogicalOp", "<->"));
            default:
                return null;
        }
    }

    /**
     * Eliminates an operator from the tree
     * @param tree - The tree to eliminate the operator from
     * @returns The two halves of the tree split by the operator
     */
    static eliminateOperator(tree: Node): Node[] | null {
        if (!tree) return null;

        const nextOperation = this.getNextOperation(tree);
        if (!nextOperation) return null;

        let firstHalf: Node | null = null;
        let secondHalf = new Node("Formula");
        let found = false;
        let queue = [tree];

        while (queue.length > 0) {
            const node = queue.shift()!;
            if (!node) continue;

            if (node.type === "Formula" && node.children.length === 2 && node.children[1].type === "OperatorBlock") {
                const operator = node.children[1].children[0];
                if (operator.value === nextOperation.value) {
                    secondHalf.setChildren([node.children[1].children[1]]);
                    found = true;
                    break;
                }
            } else if (node.type === "OperatorBlock" && node.children.length === 3) {
                const operator = node.children[0];
                if (operator.value === nextOperation.value) {
                    secondHalf.setChildren([node.children[1], node.children[2]]);
                    found = true;
                    break;
                }
            }

            node.children.forEach((child) => {
                queue.push(child);
            });
        }

        if (!found) {
            return null;
        }

        // Reconstruct the first half with explicit pruning
        firstHalf = this.pruneTree(tree, nextOperation);

        if (!firstHalf) {
            return null;
        }

        const firstHalfString = this.toString(firstHalf);
        const secondHalfString = this.toString(secondHalf);

        console.log("First Half:", firstHalfString);
        console.log("Second Half:", secondHalfString);

        return [firstHalf, secondHalf];
    }

    /**
     * Recursively prunes the tree to construct the first half up to the operator.
     */
    static pruneTree(node: Node, operatorToRemove: Node): Node | null {
        if (!node) return null;

        const clonedNode = new Node(node.type, node.value);
        const op = operatorToRemove.value!;

        // check if the current node's children include the operator
        if (node.children[0]?.value === op) {
            clonedNode.children = [];
            return clonedNode;
        }

        // recursively prune children
        const prunedChildren = node.children.map(child =>
            this.pruneTree(child, operatorToRemove)
        );

        // set only non-null pruned children
        clonedNode.setChildren(prunedChildren.filter(child => child !== null));
        return clonedNode;
    }
}