import { expect, test } from "vitest";
import { PremiseParser } from "../../../../src/lib/solver/parsers/PremiseParser";
import { NodeType } from "../../../../src/lib/syntax-checker/NodeType";
import { Operator } from "../../../../src/lib/syntax-checker/Operator";

test("PremiseParser parsePremise", () => {
  const premise = "(A ∧ B) ⊃ C";
  const parsedPremise = PremiseParser.parsePremise(premise);

  expect(parsedPremise.value).toBe(premise);
  expect(parsedPremise.tree).toBeDefined();
  expect(parsedPremise.tree?.type).toBe(NodeType.BINARY_OPERATION);
  expect(parsedPremise.tree?.value).toBe(Operator.IMPLICATION);
  expect(parsedPremise.tree?.children.length).toBe(2);
  expect(parsedPremise.tree?.children[0].type).toBe(NodeType.PARENTHESES_BLOCK);
  expect(parsedPremise.tree?.children[0].children.length).toBe(3);
  expect(parsedPremise.tree?.children[0].children[1].type).toBe(
    NodeType.BINARY_OPERATION,
  );
  expect(parsedPremise.tree?.children[0].children[1].value).toBe(
    Operator.CONJUNCTION,
  );
  expect(parsedPremise.tree?.children[0].children[1].children.length).toBe(2);
  expect(parsedPremise.tree?.children[0].children[1].children[0].type).toBe(
    NodeType.CONSTANT,
  );
  expect(parsedPremise.tree?.children[0].children[1].children[0].value).toBe(
    "A",
  );
  expect(parsedPremise.tree?.children[0].children[1].children[1].type).toBe(
    NodeType.CONSTANT,
  );
  expect(parsedPremise.tree?.children[0].children[1].children[1].value).toBe(
    "B",
  );
  expect(parsedPremise.tree?.children[1].type).toBe(NodeType.CONSTANT);
  expect(parsedPremise.tree?.children[1].value).toBe("C");
});

test("PremiseParser parsePremise with empty string", () => {
  const premise = "";
  const parsedPremise = PremiseParser.parsePremise(premise);

  expect(parsedPremise.value).toBe(premise);
  expect(parsedPremise.tree).toBeNull();
});

test("PremiseParser parsePremise with invalid formula", () => {
  const premise = "A ∧ B ⊃";
  const parsedPremise = PremiseParser.parsePremise(premise);

  expect(parsedPremise.value).toBe(premise);
  expect(parsedPremise.tree).toBeNull();
});
