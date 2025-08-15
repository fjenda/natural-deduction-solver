import { Operator, operatorFromProlog, operatorToProlog } from './Operator';
import { NodeType } from './NodeType';
import { get } from 'svelte/store';
import { logicMode } from '../../stores/solverStore';
import { ParseStrategy } from '../../types/ParseStrategy';

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

	// /**
	//  * Constructor for the Node class
	//  * @param type - the type of the node
	//  * @param value - the value of the node
	//  * @constructor
	//  */
	// constructor(type: NodeType, value?: Operator | string) {
	//     this.type = type;
	//     this.value = value;
	//     this.children = [];
	// }

	/**
	 * Constructor for the Node class
	 * @param type - the type of the node
	 * @param value - the value of the node
	 * @param children - the children of the node
	 */
	constructor(type: NodeType, value: Operator | string = '', children: Node[] = []) {
		this.type = type;
		this.value = value;
		this.children = children;
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

		console.log(indent + (last ? '└─' : '├─') + value);
		indent += last ? '  ' : '│ ';

		for (let i = 0; i < node.children.length; i++) {
			this.internalPrint(node.children[i], indent, i === node.children.length - 1);
		}
	}

	/**
	 * Prints the node and its children in a tree-like structure
	 */
	print() {
		this.internalPrint(this, '', true);
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
		return (this.children || []).every((child: Node, index: number) =>
			child.equals(other.children[index])
		);
	}

	/**
	 * Generates a string representation of the node
	 * @param node - the node to generate the string for
	 * @returns {string} the string representation of the node
	 */
	static generateString(node: Node): string {
		// if the node is a constant, keep the parentheses after
		if (node.type === NodeType.CONSTANT) {
			return get(logicMode) === ParseStrategy.PROPOSITIONAL ? `${node.value}` : `${node.value}()`;
		}

		// if the node has no children, return the value or type
		if (node.children.length === 0) {
			return node.value ? `${node.value}` : `${node.type}`;
		}

		// generate the string for each child
		const childrenStrings = node.children.map((child) => this.generateString(child));

		// generate the string based on the node type
		switch (node.type) {
			case NodeType.BINARY_OPERATION:
				return `${childrenStrings.join(` ${node.value} `)}`;

			case NodeType.NEGATION:
				return `${node.value}${childrenStrings[0]}`;

			case NodeType.PARENTHESES_BLOCK:
				return `(${childrenStrings[1]})`;

			case NodeType.BRACKETS_BLOCK:
				return `[${childrenStrings[1]}]`;

			case NodeType.PREDICATE:
				return `${node.value}(${childrenStrings.join(', ')})`;

			case NodeType.TERM_LIST:
				return childrenStrings.join(', ');

			case NodeType.FUNCTION:
				return `${node.value}(${childrenStrings.join(', ')})`;

			case NodeType.QUANTIFIER:
				// console.log(node);
				return `${childrenStrings[0]}${childrenStrings[1]} ${childrenStrings[2]}`;

			default:
				return node.value ? `${node.value}` : `${node.type}`;
		}
	}

	/**
	 * Recursive method that applies parentheses around the node
	 * @returns {Node} the node with parentheses
	 */
	public parenthesize(first: boolean = true): Node {
		// if there's only one, and it's either conjunction or disjunction, don't parenthesize it
		const ops = this.operators();
		if (
			first &&
			ops.size <= 1 &&
			(ops.has(Operator.CONJUNCTION) || ops.has(Operator.DISJUNCTION))
		) {
			return this;
		}

		// parenthesize the children recursively
		this.children = this.children.map((child) => child.parenthesize(false));

		// don't wrap the node if it's one of the following types:
		// - variable, constant, negation block, parentheses block
		if (
			this.children.length === 0 ||
			this.type === NodeType.PARENTHESES_BLOCK ||
			this.type === NodeType.BRACKETS_BLOCK ||
			this.type === NodeType.NEGATION ||
			this.type === NodeType.TERM_LIST ||
			this.type === NodeType.PREDICATE ||
			this.type === NodeType.FUNCTION
		) {
			return this;
		}

		// parenthesize the node if it's not the first one
		if (first) return this;
		const par = new Node(NodeType.PARENTHESES_BLOCK);
		par.setChildren([
			new Node(NodeType.PARENTHESIS, Operator.LPAR),
			this,
			new Node(NodeType.PARENTHESIS, Operator.RPAR)
		]);

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

		// // if the node is a BracketsBlock, replace it with its middle child
		// if (this.type === NodeType.BRACKETS_BLOCK && this.children.length === 3) {
		//     return this.children[1].simplify();
		// }

		// otherwise, simplify the children recursively
		this.children = this.children.map((child) => child.simplify());
		return this;
	}

	/**
	 * Returns all the operators used in the tree
	 * @private
	 */
	private operators(): Set<Operator> {
		if (this.children.length === 0) {
			return new Set(this.type === NodeType.BINARY_OPERATION ? [this.value as Operator] : []);
		}

		// const operators = new Set(this.type === NodeType.BINARY_OPERATION ? [this.value as Operator] : []);
		const operators = new Set<Operator>();
		if (this.type === NodeType.BINARY_OPERATION) {
			operators.add(this.value as Operator);
		}

		// TODO: This check might not be enough, maybe we need to check more things
		if (
			this.type === NodeType.NEGATION &&
			this.children.length === 1 &&
			this.children[0].type === NodeType.BINARY_OPERATION
		) {
			operators.add(Operator.NEGATION);
		}

		this.children.forEach((child) => {
			child.operators().forEach((op) => operators.add(op));
		});

		return operators;
	}

	/**
	 * Negates the formula by wrapping it in parentheses and adding a negation operator
	 */
	public negate(): Node {
		const neg = new Node(NodeType.NEGATION, Operator.NEGATION);
		neg.addChild(this.simplify().parenthesize(false));
		return neg;
	}

	public toPrologFormat(): string {
		switch (this.type) {
			case NodeType.VARIABLE:
				return `var(${this.value})`;

			case NodeType.PREDICATE:
				return `predicate(${this.value?.toLowerCase()}(${this.children.map((child) => child.toPrologFormat()).join(', ')}))`;

			case NodeType.FUNCTION:
				return `function(${this.value}(${this.children.map((child) => child.toPrologFormat()).join(', ')}))`;

			case NodeType.QUANTIFIER: {
				const quantifier = this.children[0].value === Operator.UNIVERSAL ? 'forall' : 'exists';
				const variable = this.children[1].toPrologFormat();
				const rest = this.children[2].toPrologFormat();

				return `${quantifier}(${variable}, ${rest})`;
			}

			case NodeType.NEGATION:
				return `${operatorToProlog(this.value as Operator)}(${this.children[0].toPrologFormat()})`;

			case NodeType.PARENTHESES_BLOCK:
			case NodeType.BRACKETS_BLOCK:
				return this.children[1].toPrologFormat();

			case NodeType.BINARY_OPERATION:
				return `${operatorToProlog(this.value as Operator)}(${this.children.map((child) => child.toPrologFormat()).join(', ')})`;

			case NodeType.TERM_LIST:
				return this.children.map((child) => child.toPrologFormat()).join(', ');

			// case NodeType.PARENTHESIS:
			//     break;
			//
			// case NodeType.BRACKET:
			//     break;
			//
			// case NodeType.QUANTIFIER_OPERATOR:
			//     break;
			//
			// case NodeType.CONSTANT:
			//     break;

			default: {
				// if value is upper-case, wrap in single quotes
				if (!this.value) return '';
				return this.value === this.value.toUpperCase() ? `'${this.value}'` : `${this.value}`;
			}
		}
	}

	/**
	 * Converts a string in Prolog format to a Node
	 * @param f - the string in Prolog format
	 * @returns {Node} the parsed node
	 */
	public static fromPrologFormat(f: string): Node {
		if (!f) {
			throw new Error('Invalid Prolog format');
		}

		f = f.trim();

		// if there are no parentheses, it's a constant
		if (!f.includes('(')) {
			// the format is 'constant'

			// if its upper-case slice the single quotes
			if (f[0] === "'" && f[f.length - 1] === "'") {
				return new Node(NodeType.CONSTANT, f.slice(1, -1));
			}

			return new Node(NodeType.CONSTANT, f);
		}

		// match function calls
		const match = f.match(/^(\w+)\((.*)\)$/);
		if (!match) {
			throw new Error(`Invalid Prolog format ${f}`);
		}

		const op = match[1];
		const args = match[2];

		const children = Node.parseArgs(args).map(Node.fromPrologFormat);

		if (op === 'var') {
			return new Node(NodeType.VARIABLE, children[0].value);
		}

		if (op === 'predicate') {
			const node = new Node(NodeType.PREDICATE, children[0].value?.toUpperCase());
			node.setChildren(children[0].children);
			node.simplify().parenthesize();
			return node;
		}

		if (op === 'function') {
			const node = new Node(NodeType.FUNCTION, children[0].value);
			node.setChildren(children[0].children);
			node.simplify().parenthesize();
			return node;
		}

		if (op === 'exists') {
			const node = new Node(NodeType.QUANTIFIER);
			node.children.push(new Node(NodeType.QUANTIFIER_OPERATOR, Operator.EXISTENTIAL));
			node.children.push(children[0]);
			const br = new Node(NodeType.BRACKETS_BLOCK, '', [
				new Node(NodeType.BRACKET, Operator.LBRACKET),
				children[1],
				new Node(NodeType.BRACKET, Operator.RBRACKET)
			]);
			node.children.push(br);
			return node;
		}

		if (op === 'forall') {
			const node = new Node(NodeType.QUANTIFIER);
			node.children.push(new Node(NodeType.QUANTIFIER_OPERATOR, Operator.UNIVERSAL));
			node.children.push(children[0]);
			const br = new Node(NodeType.BRACKETS_BLOCK, '', [
				new Node(NodeType.BRACKET, Operator.LBRACKET),
				children[1],
				new Node(NodeType.BRACKET, Operator.RBRACKET)
			]);
			node.children.push(br);
			return node;
		}

		if (op === 'not') {
			const node = new Node(NodeType.NEGATION, operatorFromProlog(op));
			node.setChildren(children);
			return node;
		}

		const node = new Node(NodeType.BINARY_OPERATION, operatorFromProlog(op));
		node.setChildren(children);
		node.simplify().parenthesize();

		return node;
	}

	/**
	 * Parses the arguments of a Prolog function
	 * @param args - the arguments string
	 * @returns {string[]} the parsed arguments
	 * @private
	 */
	private static parseArgs(args: string): string[] {
		let depth = 0;
		let curr = '';
		const res: string[] = [];

		for (let i = 0; i < args.length; i++) {
			const char = args[i];

			if (char === '(') depth++;
			if (char === ')') depth--;

			if (char === ',' && depth === 0) {
				res.push(curr.trim());
				curr = '';
			} else {
				curr += char;
			}
		}

		if (curr.trim()) res.push(curr.trim());

		return res;
	}

	/**
	 * Splits the tree in half
	 * @returns {Node[]} left and right children of the tree
	 */
	public split(): Node[] {
		return [this.children[0], this.children[1]];
	}

	/**
	 * Returns the variables used in the tree
	 * @returns {Set<string>} the variables used in the tree
	 */
	public get variables(): Set<string> {
		const vars = new Set<string>();

		if ([NodeType.VARIABLE, NodeType.CONSTANT].includes(this.type)) {
			vars.add(this.value as string);
			return vars;
		}

		this.children.forEach((child) => {
			child.variables.forEach((v) => vars.add(v));
		});

		return vars;
	}
}
