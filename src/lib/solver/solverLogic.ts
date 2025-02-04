import { selectedRows, solverContent } from "../../stores/solverStore";
import { PremiseParser } from "./parsers/PremiseParser";
import { DeductionProcessor } from "./parsers/DeductionProcessor";
import { NDRule } from "./parsers/DeductionRules";
import { FormulaComparer } from "./FormulaComparer";
import type { TreeRuleType } from "../../types/TreeRuleType";
import { get } from "svelte/store";

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

export function checkProof() {
    const proof = get(solverContent).proof;
    const exists = proof.some(p => p.tree && p.rule.rule !== NDRule.UNKNOWN && FormulaComparer.compare(p, get(solverContent).conclusion));

    alert(exists ? "Proof is correct" : "Proof does not contain a valid row with the conclusion");
}
