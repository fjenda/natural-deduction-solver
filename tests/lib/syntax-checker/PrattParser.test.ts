/**
 * PrattParser.test.ts
 * Unit tests for PrattParser
 */

import { expect, test } from "vitest";
import { PrattParser } from "../../../src/lib/syntax-checker/PrattParser";
import { ParseStrategy } from "../../../src/types/ParseStrategy";
import { NodeType } from "../../../src/lib/syntax-checker/NodeType";
import { Node } from "../../../src/lib/syntax-checker/Node";
import { Operator } from "../../../src/lib/syntax-checker/Operator";

/**
 * Test if the PrattParser instance is created correctly.
 */
test("PrattParser Instance", () => {
  const instance = new PrattParser(ParseStrategy.PROPOSITIONAL);
  expect(instance).toBeDefined();
});

/**
 * Test if the PrattParser parses a simple expression correctly.
 */
test("Simple Expression Parsing", () => {
  const parser = new PrattParser(ParseStrategy.PROPOSITIONAL);
  const res = parser.parse("A");
  expect(res).toBeDefined();
  expect(res?.value).toBe("A");
  expect(res?.type).toBe(NodeType.CONSTANT);
  expect(res?.children).toHaveLength(0);

  const res2 = parser.parse("a");
  expect(res2).toBeDefined();
  expect(res2?.value).toBe("a");
  expect(res2?.type).toBe(NodeType.CONSTANT);
  expect(res2?.children).toHaveLength(0);
});

/**
 * Test if the PrattParser correctly fails to parse an invalid expression.
 */
test("Invalid Expression Parsing", () => {
  const parser = new PrattParser(ParseStrategy.PROPOSITIONAL);
  const res = parser.parse("A ∧");
  expect(res).toBeNull();
});

/**
 * Test if the PrattParser parses a complex expression correctly.
 */
test("Complex Expression Parsing 1", () => {
  const parser = new PrattParser(ParseStrategy.PROPOSITIONAL);
  const res = parser.parse("(A ∧ (B ∨ C)) ⊃ D");
  expect(res).toBeDefined();

  const tree = new Node(NodeType.BINARY_OPERATION, Operator.IMPLICATION, [
    new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, [
      new Node(NodeType.CONSTANT, "A", []),
      new Node(NodeType.BINARY_OPERATION, Operator.DISJUNCTION, [
        new Node(NodeType.CONSTANT, "B", []),
        new Node(NodeType.CONSTANT, "C", []),
      ]),
    ]),
    new Node(NodeType.CONSTANT, "D", []),
  ]);

  expect(res?.simplify().equals(tree)).toBe(true);
});

/**
 * Test if the PrattParser parses a complex expression with nested parentheses correctly.
 */
test("Complex Expression Parsing 2", () => {
  const parser = new PrattParser(ParseStrategy.PROPOSITIONAL);
  const res = parser.parse("((A ∧ B) ∨ (C ⊃ D)) ⊃ E");
  expect(res).toBeDefined();

  const tree = new Node(NodeType.BINARY_OPERATION, Operator.IMPLICATION, [
    new Node(NodeType.PARENTHESES_BLOCK, "", [
      new Node(NodeType.PARENTHESIS, Operator.LPAR),
      new Node(NodeType.BINARY_OPERATION, Operator.DISJUNCTION, [
        new Node(NodeType.PARENTHESES_BLOCK, "", [
          new Node(NodeType.PARENTHESIS, Operator.LPAR),
          new Node(NodeType.BINARY_OPERATION, Operator.CONJUNCTION, [
            new Node(NodeType.CONSTANT, "A", []),
            new Node(NodeType.CONSTANT, "B", []),
          ]),
          new Node(NodeType.PARENTHESIS, Operator.RPAR),
        ]),
        new Node(NodeType.PARENTHESES_BLOCK, "", [
          new Node(NodeType.PARENTHESIS, Operator.LPAR),
          new Node(NodeType.BINARY_OPERATION, Operator.IMPLICATION, [
            new Node(NodeType.CONSTANT, "C", []),
            new Node(NodeType.CONSTANT, "D", []),
          ]),
          new Node(NodeType.PARENTHESIS, Operator.RPAR),
        ]),
      ]),
      new Node(NodeType.PARENTHESIS, Operator.RPAR),
    ]),
    new Node(NodeType.CONSTANT, "E", []),
  ]);

  expect(res?.equals(tree)).toBe(true);
});

test("Invalid Token Parsing", () => {
  const parser = new PrattParser(ParseStrategy.PROPOSITIONAL);
  const res = parser.parse("A + B");
  expect(res).toBeNull();
});

test("PL Function Parsing", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("f(x, y)");
  expect(res).toBeDefined();

  const tree = new Node(NodeType.FUNCTION, "f", [
    new Node(NodeType.TERM_LIST, "", [
      new Node(NodeType.VARIABLE, "x", []),
      new Node(NodeType.VARIABLE, "y", []),
    ]),
  ]);

  expect(res?.equals(tree)).toBe(true);
});

test("PL Constant Parsing", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("c()");
  expect(res).toBeDefined();

  const tree = new Node(NodeType.CONSTANT, "c", []);

  expect(res?.equals(tree)).toBe(true);
});

test("PL Predicate Parsing", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("P(x)");
  expect(res).toBeDefined();

  const tree = new Node(NodeType.PREDICATE, "P", [
    new Node(NodeType.TERM_LIST, "", [new Node(NodeType.VARIABLE, "x", [])]),
  ]);

  expect(res?.equals(tree)).toBe(true);
});

test("PL Universal Quantifier Parsing", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("∀x P(x)");
  expect(res).toBeDefined();

  const tree = new Node(NodeType.QUANTIFIER, "", [
    new Node(NodeType.QUANTIFIER_OPERATOR, Operator.UNIVERSAL, []),
    new Node(NodeType.VARIABLE, "x", []),
    new Node(NodeType.PREDICATE, "P", [
      new Node(NodeType.TERM_LIST, "", [new Node(NodeType.VARIABLE, "x", [])]),
    ]),
  ]);

  expect(res?.equals(tree)).toBe(true);
});

test("PL Brackets Parsing", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("[∀x P(x)]");
  expect(res).toBeDefined();

  const tree = new Node(NodeType.BRACKETS_BLOCK, "", [
    new Node(NodeType.BRACKET, Operator.LBRACKET),
    new Node(NodeType.QUANTIFIER, "", [
      new Node(NodeType.QUANTIFIER_OPERATOR, Operator.UNIVERSAL, []),
      new Node(NodeType.VARIABLE, "x", []),
      new Node(NodeType.PREDICATE, "P", [
        new Node(NodeType.TERM_LIST, "", [
          new Node(NodeType.VARIABLE, "x", []),
        ]),
      ]),
    ]),
    new Node(NodeType.BRACKET, Operator.RBRACKET),
  ]);

  expect(res?.equals(tree)).toBe(true);
});

test("Parse Token Function not closed", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("f(x, y");
  expect(res).toBeNull();
});

test("Parse Quantifier no Variable", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("∀");
  expect(res).toBeNull();
});

test("Parse Token Predicate not closed", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("P(x");
  expect(res).toBeNull();
});

test("Parse Token Predicate no TermList", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("P()");
  expect(res).toBeNull();
});

test("Parse Token PL Unknown Symbol", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("P(x) + Q(y)");
  expect(res).toBeNull();
});

test("Parse Token PL Quantifier no Formula", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("∀x");
  expect(res).toBeNull();
});

test("Parse Token Negation", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("¬P(x)");
  expect(res).toBeDefined();

  const tree = new Node(NodeType.NEGATION, Operator.NEGATION, [
    new Node(NodeType.PREDICATE, "P", [
      new Node(NodeType.TERM_LIST, "", [new Node(NodeType.VARIABLE, "x", [])]),
    ]),
  ]);

  expect(res?.equals(tree)).toBe(true);
});

test("Parse Token Negation no Formula", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("¬");
  expect(res).toBeNull();
});

test("Parse Token Parenthesis not closed", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("(A ∧ B");
  expect(res).toBeNull();
});

test("Parse Token Brackets not closed", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("[∀x P(x)");
  expect(res).toBeNull();
});

test("Parse Led Unknown Operator", () => {
  const parser = new PrattParser(ParseStrategy.PROPOSITIONAL);
  const res = parser.parse("((A + B) ∧ (C ∧ D))");
  expect(res).toBeNull();
});

test("Parse PL TermList no term after comma", () => {
  const parser = new PrattParser(ParseStrategy.PREDICATE);
  const res = parser.parse("f(x, , y)");
  expect(res).toBeNull();
});
