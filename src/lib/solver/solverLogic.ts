import { selectedRows, solverContent } from "../../stores/solverStore";
import { PremiseParser } from "./parsers/PremiseParser";
import { DeductionProcessor } from "./parsers/DeductionProcessor";
import { DeductionRule, NDRule } from "./parsers/DeductionRules";
import { FormulaComparer } from "./FormulaComparer";
import type { TreeRuleType } from "../../types/TreeRuleType";
import { get } from "svelte/store";
import { Node } from "../syntax-checker/Node";
import type { ProveResult } from "../../types/ProveResult";

const API_PORT = 3000;
const API_URL = `http://localhost:${API_PORT}/prove`;

export function onChangePremise(value: string, index: number) {
    solverContent.update(sc => {
        sc.premises[index] = PremiseParser.parsePremise(value);
        return sc;
    });
}

export function onChangeConclusion(value: string) {
    solverContent.update(sc => {
        sc.conclusion = PremiseParser.parsePremise(value);
        return sc;
    });
}

export async function queryProlog(premises: string[], conclusion: string, rule: string): Promise<ProveResult> {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                premises: premises.filter(p => p.trim() !== ''),
                conclusion,
                rule,
            }),
        });

        return await response.json();
    } catch (error) {
        console.error(error);
        return { success: false, results: [], message: "An error occurred while verifying the proof" };
    }
}

export async function verifyResult(rule: DeductionRule, premises: string[], selected: number[]) {
    // send request to prolog
    const result: ProveResult = await queryProlog(premises, 'X', rule.short);
    console.log(result);

    // get result
    if (!result.success) {
        return alert(result.message);
    }

    addToProof(result, rule.short, selected);
}

export function applyRule(short: NDRule, row1: TreeRuleType, row2: TreeRuleType) {
    const result = DeductionProcessor.applyRule(short, row1, row2);
    if (!result) return;

    solverContent.update(sc => {
        if (Array.isArray(result)) {
            result.forEach(res => {
                sc.proof[res.line - 1] = res;
            });
        } else {
            sc.proof[result.line - 1] = result;
        }
        return sc;
    });

    selectedRows.set([]);
}

export function addToProof(result: ProveResult, rule: NDRule, lines: number[]): void {
    // add the result to the proof
    solverContent.update(sc => {
        const results = Array.isArray(result.results) ? result.results : [result.results];
        results.forEach(r => {
           const tree = Node.fromPrologFormat(r);
           const tmp = {
               line: sc.proof.length + 1,
               tree: tree.parenthesize(),
               value: Node.generateString(tree),
               rule: { rule: rule, lines: lines }
           };

           if (!DeductionProcessor.existsInProof(tmp)) {
               sc.proof.push(tmp);
           }
        });
        return sc;
    });
}

export function checkProof() {
    const proof = get(solverContent).proof;
    const exists = proof.some(p => p.tree && p.rule.rule !== NDRule.UNKNOWN && FormulaComparer.compare(p, get(solverContent).conclusion));

    alert(exists ? "Proof is correct" : "Proof does not contain a valid row with the conclusion");
}

// Adds all existing premises to the proof and checks if they are valid
function initializeProof(): boolean {
    // add the premises to the proof
    solverContent.update(sc => {
        sc.proof = sc.premises.map(((p, i) => ({ line: i + 1, tree: p.tree, value: p.value, rule: { rule: NDRule.ASS } })));
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

export function setupProof(isIndirect: boolean) {
    if (!initializeProof()) return;

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
}