import {Operator} from "./Operator";
import {NodeType} from "./NodeType";

/**
 * Node class that represents a node in the abstract syntax tree
 * @property {NodeType} type - the type of the node
 * @property {Operator | string} value - the value of the node
 * @property {Array<Node>} children - the children of the node
 */
export class Node {
    type: NodeType;
    value?: Operator | string;
    children: Array<Node>;

    /**
     * Constructor for the Node class
     * @param type - the type of the node
     * @param value - the value of the node
     * @constructor
     */
    constructor(type: NodeType, value?: Operator | string) {
        this.type = type;
        this.value = value;
        this.children = [];
    }

    /**
     * Sets the children of the node
     * @param children - the children to set
     */
    setChildren(children: Node[]) {
        this.children = children;
    }

    /**
     * Add a child to the node
     * @param child - the child to add
     */
    addChild(child: Node) {
        this.children.push(child);
    }

    /**
     * Prints the node and its children in a tree-like structure
     * @param node - the node to print
     * @param indent - the indentation string
     * @param last - whether the node is the last child
     */
    private internalPrint(node: Node, indent: string, last: boolean) {
        const value = node.value ? `${node.value}` : `${node.type}`;

        console.log(indent + (last ? "└─" : "├─") + value);
        indent += last ? "  " : "│ ";

        for (let i = 0; i < node.children.length; i++) {
            this.internalPrint(node.children[i], indent, i === node.children.length - 1);
        }
    }

    /**
     * Prints the node and its children in a tree-like structure
     */
    print() {
        this.internalPrint(this, "", true);
    }

    /**
     * Checks if the node is equal to another node
     * @param other - the other node to compare
     * @returns {boolean} true if the nodes are equal
     */
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

        // recursively check children
        return (this.children || []).every((child: any, index: number) =>
            child.equals(other.children[index])
        );
    }

    /**
     * Generates a string representation of the node
     * @param node - the node to generate the string for
     * @returns {string} the string representation of the node
     */
    static generateString(node: Node): string {
        // if the node has no children, return the value or type
        if (node.children.length === 0) {
            return node.value ? `${node.value}` : `${node.type}`;
        }

        // generate the string for each child
        const childrenStrings = node.children.map(child => this.generateString(child));

        // generate the string based on the node type
        switch (node.type) {
            case NodeType.BINARY_OPERATION:
                return `${childrenStrings.join(` ${node.value} `)}`;

            case NodeType.NEGATION:
                return `${node.value}${childrenStrings[0]}`;

            case NodeType.PARENTHESES_BLOCK:
                return `(${childrenStrings[1]})`;

            case NodeType.PREDICATE:
                return `${node.value}(${childrenStrings.join(", ")})`;

            case NodeType.TERM_LIST:
                return childrenStrings.join(", ");

            default:
                return node.value ? `${node.value}` : `${node.type}`;
        }
    }

    /**
     * Recursive method that applies parentheses around the node
     * @returns {Node} the node with parentheses
     */
    public parenthesize(): Node {
        // parenthesize the children recrusively
        this.children = this.children.map(child => child.parenthesize());

        // don't wrap the node if it's one of the following types:
        // - variable, constant, negation block, parentheses block
        if (this.children.length === 0
            || this.type === NodeType.PARENTHESES_BLOCK
            || this.type === NodeType.NEGATION
            || this.type === NodeType.TERM_LIST
            || this.type === NodeType.PREDICATE
        ) {
            return this;
        }

        // parenthesize the node
        const par = new Node(NodeType.PARENTHESES_BLOCK);
        par.setChildren([new Node(NodeType.PARENTHESIS, Operator.LPAR), this, new Node(NodeType.PARENTHESIS, Operator.RPAR)]);

        return par;
    }

    /**
     * Simplifies the node by removing unnecessary parentheses blocks but keeping the structure
     * @returns {Node} the simplified tree
     */
    public simplify(): Node {
        // if the node is a ParenthesesBlock, replace it with its middle child
        if (this.type === NodeType.PARENTHESES_BLOCK && this.children.length === 3) {
            return this.children[1].simplify();
        }

        // otherwise, simplify the children recursively
        this.children = this.children.map(child => child.simplify());
        return this;
    }

    /**
     * Checks if the node is the negation of another node
     * @param {Node} other the other node
     * @returns {boolean} true if the node is the negation of the other node
     */
    public isNegationOf(other: Node): boolean {
        // TODO: do i need to make this better? for example:
        // -(A -> B) = -A v B
        // -(A v B) = -A & -B
        return this.type === NodeType.NEGATION
            && this.children.length === 1
            && this.children[0].equals(other);
    }
}