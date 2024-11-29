export class Node {
    type: string;
    value?: string;
    children: Array<Node>;

    constructor(type: string, value?: string) {
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

    removeNullChildren() {
        this.children = this.children.filter(child => child !== null);
        for (let child of this.children) {
            child.removeNullChildren();
        }
    }
}