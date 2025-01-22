import type {Operator} from "./Operator";
import {Operator} from "./Operator";

export class Node {
    type: string;
    value?: Operator;
    children: Array<Node>;

    constructor(type: string, value?: Operator) {
        this.type = type;
        this.value = value;
        this.children = [];
    }

    setChildren(children: Node[]) {
        this.children = children;
    }

    addChild(child: Node) {
        this.children.push(child);
    }

    private internalPrint(node: Node, indent: string, last: boolean) {
        const value = node.value ? `${node.value}` : `${node.type}`;

        console.log(indent + (last ? "└─" : "├─") + value);
        indent += last ? "  " : "│ ";

        for (let i = 0; i < node.children.length; i++) {
            this.internalPrint(node.children[i], indent, i === node.children.length - 1);
        }
    }

    print() {
        this.internalPrint(this, "", true);
    }

    equals(other: Node): boolean {
        // same object
        if (this === other) return true;

        // one is null/undefined
        if (!this || !other) return false;

        // different types
        if (this.type !== other.type) return false;

        // different values
        if (this.value !== other.value) return false;

        // different number of children
        if ((this.children || []).length !== (other.children || []).length) return false;

        return (this.children || []).every((child: any, index: number) =>
            child.equals(other.children[index])
        );
    }

    static generateString(node: Node): string {
        if (node.children.length === 0) {
            return node.value ? `${node.value}` : `${node.type}`;
        }

        const childrenStrings = node.children.map(child => this.generateString(child));

        switch (node.type) {
            case "BinaryOperation":
                return `${childrenStrings.join(` ${node.value} `)}`;

            case 'Negation':
                return `${node.value}${childrenStrings[0]}`;

            case "ParenthesesBlock":
                return `(${childrenStrings[1]})`;

            default:
                return node.type;
        }
    }

    public getTopOperator(): string | null {
        // no children means it's a variable or a constant
        if (this.children.length === 0) {
            return null;
        }

        // if it's a binary operation, return the operator
        if (this.type === "BinaryOperation") {
            return this.value!;
        }

        // if it's a parentheses block, return the top operator of the child
        if (this.type === "ParenthesesBlock") {
            return this.children[1].getTopOperator();
        }

        // TODO: anything else to handle?
    }

    /**
     * Recursive function that applies parentheses around the node
     * @returns {Node} the node with parentheses
     */
    public parenthesize(): Node {
        // parenthesize the children recrusively
        this.children = this.children.map(child => child.parenthesize());

        // don't wrap the node if it's one of the following types:
        // - variable, constant, negation block, parentheses block
        if (this.children.length === 0 || this.type === "ParenthesesBlock" || this.type === "Negation") {
            return this;
        }

        // parenthesize the node
        const par = new Node("ParenthesesBlock");
        par.setChildren([new Node("Parenthesis", Operator.LPAR), this, new Node("Parenthesis", Operator.RPAR)]);

        return par;
    }

    /**
     * Simplifies the node by removing unnecessary parentheses blocks but keeping the structure
     * @returns {Node} the simplified tree
     */
    public simplify(): Node {
        // if the node is a ParenthesesBlock, replace it with its middle child
        if (this.type === "ParenthesesBlock" && this.children.length === 3) {
            return this.children[1].simplify();
        }

        // otherwise, simplify the children recursively
        this.children = this.children.map(child => child.simplify());
        return this;
    }
}