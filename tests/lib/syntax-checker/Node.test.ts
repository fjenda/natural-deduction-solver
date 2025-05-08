/**
 * Node.test.ts
 * Unit tests for Node class
 */

import { expect, test, vi } from 'vitest';
import { Node } from '../../../src/lib/syntax-checker/Node';
import { NodeType } from '../../../src/lib/syntax-checker/NodeType';
import { Operator } from "../../../src/lib/syntax-checker/Operator";

test('Node Creation', () => {
    const node = new Node(NodeType.CONSTANT, 'A', []);
    expect(node).toBeDefined();
    expect(node.type).toBe(NodeType.CONSTANT);
    expect(node.value).toBe('A');
    expect(node.children).toHaveLength(0);
});

test('Node Creation with Children', () => {
    const childNode = new Node(NodeType.CONSTANT, 'B', []);
    const parentNode = new Node(NodeType.BINARY_OPERATION, 'AND', [childNode]);

    expect(parentNode).toBeDefined();
    expect(parentNode.type).toBe(NodeType.BINARY_OPERATION);
    expect(parentNode.value).toBe('AND');
    expect(parentNode.children).toHaveLength(1);
    expect(parentNode.children[0]).toEqual(childNode);
});

test('Node setChildren', () => {
    const child1 = new Node(NodeType.CONSTANT, 'B', []);
    const child2 = new Node(NodeType.CONSTANT, 'C', []);
    const parent = new Node(NodeType.BINARY_OPERATION, 'AND', []);
    parent.setChildren([child1, child2]);

    expect(parent).toBeDefined();
    expect(parent.type).toBe(NodeType.BINARY_OPERATION);
    expect(parent.value).toBe('AND');
    expect(parent.children).toHaveLength(2);
    expect(parent.children[0]).toEqual(child1);
    expect(parent.children[1]).toEqual(child2);
});

test('Node addChild', () => {
    const parent = new Node(NodeType.BINARY_OPERATION, 'AND', []);
    const child = new Node(NodeType.CONSTANT, 'B', []);
    parent.addChild(child);

    expect(parent).toBeDefined();
    expect(parent.type).toBe(NodeType.BINARY_OPERATION);
});

test('Node print', () => {
    const child1 = new Node(NodeType.CONSTANT, 'B', []);
    const child2 = new Node(NodeType.CONSTANT, 'C', []);
    const parent = new Node(NodeType.BINARY_OPERATION, 'AND', [child1, child2]);

    // test if the content that is printed into console is right
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    parent.print();
    expect(spy).toHaveBeenCalled();
})

test('Node equals', () => {
    const child1 = new Node(NodeType.CONSTANT, 'A', []);
    const child2 = new Node(NodeType.CONSTANT, 'B', []);
    const node1 = new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, [child1, child2]);
    const node2 = new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, [child1, child2]);

    expect(node1.equals(node2)).toBe(true);
});

test('Node generateString', () => {
    const child1 = new Node(NodeType.CONSTANT, 'A', []);
    const child2 = new Node(NodeType.CONSTANT, 'B', []);
    const node = new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, [child1, child2]);

    expect(Node.generateString(node)).toBe('A ∧ B');
    expect(Node.generateString(child1)).toBe('A');
});