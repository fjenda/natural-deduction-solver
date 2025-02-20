import { deductionRules, indirectSolving, logicMode, selectedRows, solverContent } from "../../stores/solverStore";
import { PremiseParser } from "./parsers/PremiseParser";
import { DeductionRule, NDRule } from "../rules/DeductionRule";
import { FormulaComparer } from "./FormulaComparer";
import { get } from "svelte/store";
import { Node } from "../syntax-checker/Node";
import type { ProveRequest, ProveResult } from "../../types/EndpointResults/ProveResult";
import { ParseStrategy } from "../../types/ParseStrategy";
import type { TreeRuleType } from "../../types/TreeRuleType";
import type { IRule } from "../rules/IRule";
import { editState, solving } from "../../stores/stateStore";
import { EditState } from "../../types/EditState";
import { TheoremParser } from "./parsers/TheoremParser";
import { API_URL } from "../../../config";
import type { EndpointRequest, EndpointResult } from "../../types/EndpointResults/EndpointResult";

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

// export async function handlePost(endpoint: string, premises: string[], conclusion: string, rule: string): Promise<ProveResult> {
export async function handlePost<D = unknown>(endpoint: string, data: D): Promise<EndpointResult> {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        return await response.json();
    } catch (error) {
        console.error(error);
        return { success: false, message: "An error occurred while verifying the proof" };
    }
}

export async function queryProlog(rule: IRule, premises: string[], selected: number[]) {
    // send request to prolog
    const result = await handlePost<ProveRequest>('/prove', { premises: premises, conclusion: 'X', rule: rule.short }) as ProveResult;

    // get result
    if (!result.success) {
        return alert(result.message);
    }

    // console.log(result);

    addToProof(result, rule.short, selected);
}

export async function verifyResult(result: Node, premises: string[], rule: string) {
    // get the prolog results
    const other = await handlePost<ProveRequest>('/prove', { premises: premises, conclusion: 'X', rule: rule }) as ProveResult;
    const values = Array.isArray(other.results) ? other.results : [other.results];

    // compare with the one that user added, if they are the same, add them
    let exists: boolean = false;
    values.forEach(val => {
       const tmp = Node.fromPrologFormat(val ?? "");
       if (tmp.equals(result)) exists = true;
    });

    return exists;
}

export async function usable(rule: DeductionRule, row: number): Promise<{ highlighted: number[], applicable: boolean }> {
    const proof = get(solverContent).proof;
    const selected: string = proof[row - 1].tree?.toPrologFormat() ?? "";
    const indices: number[] = [];

    if (rule.inputSize === 1) {
        const { success } = await handlePost<ProveRequest>('/prove', { premises: [selected], conclusion: 'X', rule: rule.short }) as ProveResult;
        if (success) indices.push(row);
        return { applicable: !!indices.length, highlighted: indices };
    }

    for (const r of proof) {
        const i = proof.indexOf(r);
        if (i === row - 1) continue;

        const other: string = r.tree?.toPrologFormat() ?? "";
        const result = await handlePost<ProveRequest>('/prove', { premises: [selected, other], conclusion: 'X', rule: rule.short }) as ProveResult;
        if (!result.success) continue;

        // if DeductionProcessor.existsInProof()
        indices.push(r.line);
    }

    return { applicable: !!indices.length, highlighted: indices };
}

export function addToProof(result: ProveResult, rule: string, lines?: number[]): void {
    // add the result to the proof
    solverContent.update(sc => {
        const results = Array.isArray(result.results) ? result.results : [result.results];
        results.forEach(r => {
           const tree = Node.fromPrologFormat(r ?? "");
           const tmp = {
               line: sc.proof.length + 1,
               tree: tree.parenthesize(),
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

function existsInProof(formula: TreeRuleType): boolean {
    return get(solverContent).proof.findIndex(r => FormulaComparer.compare(r, formula)) !== -1;
}

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

export async function hasContradiction(): Promise<boolean> {
    const proofPFL = get(solverContent).proof.map(p => p.tree?.toPrologFormat() ?? "");
    const result = await handlePost<EndpointRequest>('/conflict', { proof: proofPFL }) as EndpointResult;
    return result.success;
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

export function setupProof(): boolean {
    if (!initializeProof()) return false;


    const isIndirect = get(indirectSolving);
    if (get(editState) === EditState.THEOREM) {
        let [left, right] = TheoremParser.splitTheorem(get(solverContent).conclusion.value);
        if (!left) {
            alert('Failed to parse left side of the theorem');
            return false;
        }

        solverContent.update(sc => {
           sc.proof.push({
               line: sc.proof.length + 1,
               tree: left,
               value: Node.generateString(left),
               rule: { rule: NDRule.ASS },
           });
           sc.indirect = isIndirect;
           return sc;
        });

        if (isIndirect) {
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

export function switchMode() {
    logicMode.update(mode => mode === ParseStrategy.PROPOSITIONAL ? ParseStrategy.PREDICATE : ParseStrategy.PROPOSITIONAL);
    deductionRules.set(DeductionRule.rules);
    get(solverContent).premises.forEach((premise, i) => {
        onChangePremise(premise.value, i);
    });
    onChangeConclusion(get(solverContent).conclusion.value);
}

export function resetSolving(): boolean {
    selectedRows.set([]);
    solverContent.update(sc => {
        sc.proof = [];
        return sc;
    });
    solving.set(false);

    return false;
}