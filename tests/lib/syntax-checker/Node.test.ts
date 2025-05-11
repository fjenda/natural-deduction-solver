/**
 * Node.test.ts
 * Unit tests for Node class
 */

import { beforeEach, expect, test, vi } from "vitest";
import { Node } from "../../../src/lib/syntax-checker/Node";
import { NodeType } from "../../../src/lib/syntax-checker/NodeType";
import { Operator } from "../../../src/lib/syntax-checker/Operator";

let cA: Node, cB: Node, cNotA: Node;
let vX: Node, vY: Node;
let pP_x: Node;
let fF_xy: Node;
let qQ: Node;
let AandB: Node, oAnd: Node;
let AorBimpC: Node;
let notAorB: Node;
let Aor_BandC: Node;

// BeforeEach
beforeEach(() => {
  cA = new Node(NodeType.CONSTANT, "A", []);
  cB = new Node(NodeType.CONSTANT, "B", []);
  cNotA = new Node(NodeType.NEGATION, Operator.NEGATION, [cA]);
  vX = new Node(NodeType.VARIABLE, "x", []);
  vY = new Node(NodeType.VARIABLE, "y", []);
  pP_x = new Node(NodeType.PREDICATE, "P", [vX]);
  fF_xy = new Node(NodeType.FUNCTION, "f", [
    new Node(NodeType.TERM_LIST, "", [vX, vY]),
  ]);
  qQ = new Node(NodeType.QUANTIFIER, "", [
    new Node(NodeType.QUANTIFIER_OPERATOR, Operator.UNIVERSAL, []),
    vX,
    pP_x,
  ]);
  AandB = new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, [cA, cB]);
  oAnd = new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, []);
  AorBimpC = new Node(NodeType.BINARY_OPERATION, Operator.IMPLICATION, [
    new Node(NodeType.BINARY_OPERATION, Operator.DISJUNCTION, [
      new Node(NodeType.CONSTANT, "A", []),
      new Node(NodeType.CONSTANT, "B", []),
    ]),
    new Node(NodeType.CONSTANT, "C", []),
  ]);
  notAorB = new Node(NodeType.NEGATION, Operator.NEGATION, [
    new Node(NodeType.BINARY_OPERATION, Operator.DISJUNCTION, [
      new Node(NodeType.CONSTANT, "A", []),
      new Node(NodeType.CONSTANT, "B", []),
    ]),
  ]);
  Aor_BandC = new Node(NodeType.BINARY_OPERATION, Operator.DISJUNCTION, [
    new Node(NodeType.CONSTANT, "A", []),
    new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, [
      new Node(NodeType.CONSTANT, "B", []),
      new Node(NodeType.CONSTANT, "C", []),
    ]),
  ]);
});

test("Node Creation", () => {
  expect(cA).toBeDefined();
  expect(cA.type).toBe(NodeType.CONSTANT);
  expect(cA.value).toBe("A");
  expect(cA.children).toHaveLength(0);
});

test("Node Creation with Children", () => {
  expect(AandB).toBeDefined();
  expect(AandB.type).toBe(NodeType.BINARY_OPERATION);
  expect(AandB.value).toBe(Operator.CONJUNCTION);
  expect(AandB.children).toHaveLength(2);
  expect(AandB.children[0]).toEqual(cA);
  expect(AandB.children[1]).toEqual(cB);
});

test("Node setChildren", () => {
  oAnd.setChildren([cA, cB]);

  expect(oAnd).toBeDefined();
  expect(oAnd.type).toBe(NodeType.BINARY_OPERATION);
  expect(oAnd.value).toBe(Operator.CONJUNCTION);
  expect(oAnd.children).toHaveLength(2);
  expect(oAnd.children[0]).toEqual(cA);
  expect(oAnd.children[1]).toEqual(cB);
});

test("Node addChild", () => {
  oAnd.addChild(cA);

  expect(oAnd).toBeDefined();
  expect(oAnd.type).toBe(NodeType.BINARY_OPERATION);
  expect(oAnd.value).toBe(Operator.CONJUNCTION);
  expect(oAnd.children).toHaveLength(1);
  expect(oAnd.children[0]).toEqual(cA);
});

test("Node print", () => {
  // test if the content that is printed into console is right
  const spy = vi.spyOn(console, "log").mockImplementation(() => {});

  AandB.print();
  expect(spy).toHaveBeenCalled();
});

test("Node equals", () => {
  const node2 = new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, [
    cA,
    cB,
  ]);

  expect(AandB.equals(node2)).toBe(true);
});

test("Node generateString", () => {
  expect(Node.generateString(AandB)).toBe("A ∧ B");
  expect(Node.generateString(cA)).toBe("A");
  expect(Node.generateString(cNotA)).toBe("¬A");
  expect(Node.generateString(pP_x)).toBe("P(x)");
  expect(Node.generateString(fF_xy)).toBe("f(x, y)");
  expect(Node.generateString(qQ)).toBe("∀x P(x)");
  expect(Node.generateString(AorBimpC)).toBe("A ∨ B ⊃ C");
});

test("Node parenthesize", () => {
  expect(Node.generateString(AorBimpC)).toBe("A ∨ B ⊃ C");
  const parenthesized = Node.generateString(AorBimpC.parenthesize());
  expect(parenthesized).toBe("(A ∨ B) ⊃ C");

  expect(Node.generateString(AandB)).toBe("A ∧ B");
  const parenthesized2 = Node.generateString(AandB.parenthesize());
  expect(parenthesized2).toBe("A ∧ B");

  expect(Node.generateString(notAorB)).toBe("¬A ∨ B");
  const parenthesized3 = Node.generateString(notAorB.parenthesize());
  expect(parenthesized3).toBe("¬(A ∨ B)");
});

test("Node variables", () => {
  const vars = AorBimpC.variables;

  expect(vars).toBeDefined();
  expect(vars).toHaveLength(3);
  expect(vars).toContain("A");
  expect(vars).toContain("B");
  expect(vars).toContain("C");
});

test("Node split", () => {
  const [left, right] = AandB.split();

  expect(left).toBeDefined();
  expect(right).toBeDefined();
  expect(left.type).toBe(NodeType.CONSTANT);
  expect(left.value).toBe("A");
  expect(right.type).toBe(NodeType.CONSTANT);
  expect(right.value).toBe("B");
});

test("Node negate", () => {
  const negated = AandB.negate();

  expect(negated).toBeDefined();
  expect(negated.type).toBe(NodeType.NEGATION);
  expect(negated.value).toBe(Operator.NEGATION);
  expect(Node.generateString(negated)).toBe("¬(A ∧ B)");
});

test("Node toPrologFormat", () => {
  const prologString = Aor_BandC.parenthesize().toPrologFormat();
  const prologString2 = pP_x.toPrologFormat();
  const prologString3 = cNotA.toPrologFormat();

  expect(prologString).toBe("or('A', and('B', 'C'))");
  expect(prologString2).toBe("P(x)");
  expect(prologString3).toBe("not('A')");
});

test("Node fromPrologFormat", () => {
  const pS = "or('A', and('B', 'C'))";
  const pS2 = "P(x)";
  const pS3 = "not('A')";

  const node = Node.fromPrologFormat(pS);
  const node2 = Node.fromPrologFormat(pS2);
  const node3 = Node.fromPrologFormat(pS3);

  expect(node).toBeDefined();
  expect(node2).toBeDefined();
  expect(node3).toBeDefined();

  expect(node).toEqual(Aor_BandC.parenthesize());
  // expect(node2).toEqual(pP_x);
  expect(node3).toEqual(cNotA);
});

test("Node fromPrologFormat with empty string", () => {
  const pS = "";
  expect(() => Node.fromPrologFormat(pS)).toThrowError("Invalid Prolog format");
});

// test("Node fromPrologFormat with invalid string", () => {
//   const pS = "invalid_string";
//   expect(() => Node.fromPrologFormat(pS)).toThrowError("Invalid Prolog format");
// });
