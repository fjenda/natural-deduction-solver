import { deductionRules, indirectSolving, logicMode, selectedRows, solverContent } from "../../stores/solverStore";
import { PremiseParser } from "./parsers/PremiseParser";
import { DeductionRule, NDRule } from "../rules/DeductionRule";
import { FormulaComparer } from "./FormulaComparer";
import { get } from "svelte/store";
import { Node } from "../syntax-checker/Node";
import { ParseStrategy } from "../../types/ParseStrategy";
import type { TreeRuleType } from "../../types/TreeRuleType";
import type { IRule } from "../rules/IRule";
import { editState, solving } from "../../stores/stateStore";
import { EditState } from "../../types/EditState";
import {theorems} from "../../stores/theoremsStore";
import { PrologController } from "../../prolog/PrologController";
import { compoundToString } from "../../types/prolog/Compound";
import type { ContradictionResult, ProveResult, SubstitutionResult } from "../../types/prolog/PrologResult";
import type {TheoremData} from "../../types/TheoremData";

/**
 * Parses the premise and adds it to the solver content
 * @param value - the premise to parse
 * @param index - the index of the premise
 */
export function onChangePremise(value: string, index: number) {
    solverContent.update(sc => {
        sc.premises[index] = PremiseParser.parsePremise(value);
        return sc;
    });
}

/**
 * Parses the conclusion and adds it to the solver content
 * @param value - the theorem to parse
 */
export function onChangeConclusion(value: string) {
    solverContent.update(sc => {
        sc.conclusion = PremiseParser.parsePremise(value);
        return sc;
    });
}

/**
 * Queries Prolog to handle calculation of the result of the rule application
 * @param premises - the premises used from the proof
 * @param rule - the rule used
 */
async function queryProlog(premises: string[], rule: IRule): Promise<string[]> {
    // construct query
    const query = `prove_handler([${premises.join(',')}], X, '${rule.short}').`;

    // query prolog
    const results = (await PrologController.query(query)).all() as ProveResult[];

    // parse results into strings
    return results.map(r => compoundToString(PrologController.parsePrologCompound(r.X)));
}

/**
 * Proves the selected row using the Prolog engine
 * @param premises - the premises used from the proof
 * @param rule - the rule used
 * @param selected - the selected row
 */
export async function proveProlog(premises: string[], rule: IRule, selected: number[]) {
    // get results
    const resultsPFL: string[] = await queryProlog(premises, rule);

    // no results
    if (resultsPFL.length === 0) return;

    // add to proof
    addProof(resultsPFL, rule.short, selected);
}

/**
 * Verifies the proof using the Prolog engine
 * @param premises - the premises used from the proof
 * @param rule - the rule used
 * @param result - the result to verify
 */
export async function verifyProlog(premises: string[], rule: IRule, result: Node) {
    // get results
    const resultsPFL: string[] = await queryProlog(premises, rule);

    // no results
    if (resultsPFL.length === 0) return false;

    // check if exists
    const tmp = result.toPrologFormat();
    return resultsPFL.includes(tmp);
}

/**
 * Adds the proof to the solver content, checking if it already exists
 * @param results - the results to add
 * @param rule - the rule used
 * @param lines - the lines used
 */
export function addProof(results: string[], rule: string, lines: number[]) {
    solverContent.update(sc => {
        results.forEach(r => {
            const tree = Node.fromPrologFormat(r ?? "");
            const tmp = {
                line: sc.proof.length + 1,
                tree: tree.simplify().parenthesize(),
                value: Node.generateString(tree),
                rule: { rule: rule, lines: lines ?? [] },
            };

            if (!existsInProof(tmp)) {
                sc.proof.push(tmp);
            }
        });
        return sc;
    });
}

/**
 * Checks for usable rows in the proof for the highlighted row and rule
 * @param rule - the rule to check
 * @param row - the row to check
 */
export async function usable(rule: IRule, row: number): Promise<{ highlighted: number[], applicable: boolean }> {
    const proof = get(solverContent).proof;
    const selected: string = proof[row - 1].tree?.toPrologFormat() ?? "";
    const indices: number[] = [];

    if (rule.inputSize === 1) {
        const success = (await queryProlog([selected], rule)).length > 0;
        if (success) indices.push(row);
        return { applicable: !!indices.length, highlighted: indices };
    }

    for (const r of proof) {
        const i = proof.indexOf(r);
        if (i === row - 1) continue;

        const other: string = r.tree?.toPrologFormat() ?? "";
        const results = await queryProlog([selected, other], rule);
        if (results.length === 0) continue;

        indices.push(r.line);
    }

    return { applicable: !!indices.length, highlighted: indices };
}

/**
 * Returns a boolean indicating if the formula already exists in the proof
 * @param formula - the formula to check
 * @returns {boolean} true if the formula exists in the proof, false otherwise
 */
function existsInProof(formula: TreeRuleType): boolean {
    return get(solverContent).proof.findIndex(r => FormulaComparer.compare(r, formula)) !== -1;
}

/**
 * Checks if the final proof is correct
 */
export async function checkProof() {
    const contradiction = await hasContradiction();
    const isIndirect = get(indirectSolving);

    if (contradiction) {
        if (isIndirect) {
            alert("Proof contains a contradiction, it is correct");
            solverContent.update(sc => {
                sc.contradiction = true;
                return sc;
            });
            return;
        }

        alert("Something went wrong, proof contains a contradiction");
        return;
    }

    if (isIndirect) {
        alert("Proof does not contain a contradiction, it is incorrect");
        solverContent.update(sc => {
            sc.contradiction = false;
            return sc;
        });
        return;
    }


    const exists = get(solverContent).complete;
    alert(exists ? "Proof is correct" : "Proof does not contain a valid row with the conclusion");
}

/**
 * Checks if the proof contains a contradiction using the Prolog engine
 */
export async function hasContradiction() {
    const proofPFL = get(solverContent).proof.map(p => p.tree?.toPrologFormat() ?? "");
    const query = `conflict_handler([${proofPFL.join(",")}], X, Y, Z).`;
    const result = (await PrologController.query(query)).once() as ContradictionResult;

    if (typeof result.Z === "string") {
        result.Z = result.Z === "true";
    }
    return result.Z;
}

/**
 * Substitutes the theorem variables with the user's input using the Prolog engine
 * @param theoremData - the theorem data
 * @param newVars - the new variables to be added
 */
export async function substitute(theoremData: TheoremData, newVars: string[]) {
    const theorem = get(theorems)[theoremData.theoremId];
    const theoremPFL = theorem.whole.tree?.toPrologFormat() ?? "";

    const query = `substitute(${theoremPFL}, [${Array.from(theoremData.vars).join(",")}], [${newVars.join(",")}], X).`;
    const result = (await PrologController.query(query)).once() as SubstitutionResult;

    const tmp = compoundToString(PrologController.parsePrologCompound(result.X));
    addProof([tmp], theorem.name, []);
}

/**
 * Adds all the existing premises to the proof and checks if they are valid
 * @returns {boolean} true if all premises are valid, false otherwise
 */
function initializeProof(): boolean {
    // add the premises to the proof
    solverContent.update(sc => {
        sc.proof = sc.premises.map(((p, i) => ({ line: i + 1, tree: p.tree, value: p.value, rule: { rule: NDRule.PREM } })));
        return sc;
    })

    // check if premises in proof are all valid
    const invalidPremise = get(solverContent).premises.some((_, i) => !get(solverContent).proof[i].tree);
    if (invalidPremise) {
        alert("One or more premises are not valid");
        return false;
    }

    return true;
}

/**
 * Sets up the proof by adding the premises and the negated conclusion if we're solving indirectly
 * @returns {boolean} true if the proof was set up successfully, false otherwise
 */
export function setupProof(): boolean {
    if (!initializeProof()) return false;


    const isIndirect = get(indirectSolving);
    if (get(editState) === EditState.THEOREM) {
        // if any of the premises isn't valid
        if (!get(solverContent).premises.every(p => p.tree)) {
            alert('Failed to parse left side of the theorem');
            return false;
        }

        solverContent.update(sc => {
           sc.indirect = isIndirect;
           return sc;
        });

        if (isIndirect) {
            const right = get(solverContent).conclusion.tree;
            if (!right) {
                alert('Failed to parse right side of the theorem');
                return false;
            }

            const neg = right.negate();
            solverContent.update(sc => {
                sc.proof.push({
                    line: sc.proof.length + 1,
                    tree: neg,
                    value: Node.generateString(neg),
                    rule: { rule: NDRule.CONC },
                });
                return sc;
            });
        }

        return true;
    }

    if (isIndirect) {
        // @ts-ignore
        const neg = get(solverContent).conclusion.tree.negate();
        solverContent.update(sc => {
            sc.proof.push({
                line: sc.proof.length + 1,
                tree: neg,
                value: Node.generateString(neg),
                rule: { rule: NDRule.CONC },
            });
            return sc;
        });
    }

    return true;
}

/**
 * Switches the mode between propositional and predicate logic
 * TODO: Predicate logic isn't supported yet
 */
export function switchMode() {
    logicMode.update(mode => mode === ParseStrategy.PROPOSITIONAL ? ParseStrategy.PREDICATE : ParseStrategy.PROPOSITIONAL);
    deductionRules.set(DeductionRule.rules);
    get(solverContent).premises.forEach((premise, i) => {
        onChangePremise(premise.value, i);
    });
    onChangeConclusion(get(solverContent).conclusion.value);
}

/**
 * Resets the solving state
 */
export function resetSolving(): void {
    selectedRows.set([]);
    solverContent.update(sc => {
        sc.proof = [];
        return sc;
    });
    solving.set(false);
}