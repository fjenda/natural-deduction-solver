import {DeductionRule} from "./DeductionRules";
import {PrattParser} from "../../parsers/PrattParser";
import type {TreeRuleType} from "../../../types/TreeRuleType";
import {get} from "svelte/store";
import {parsedProof, selectedRow} from "../../../stores/solverStore";
import {DeductionProcessor} from "../../parsers/DeductionProcessor";
export class FormulaParser {
    static parseFormula(formula: string): TreeRuleType {
        // syntax check
        let parser = new PrattParser();
        let res = parser.parse(formula);

        if (!res) {
            return {tree: null, rule: DeductionRule.UNKNOWN.short, value: formula};
        }

        // res.print();

        // 0. Determine if the result has an operator at the top
        // const topOperator = res.getTopOperator();
        //
        // // 0a. If the formula is just a simple "variable"
        // if (!topOperator) {
        //     // 1. Find all the premises that have this variable
        //     const allPremises = get(parsedProof);
        //     const varPremises = allPremises.filter(premise => premise.value.includes(formula) && premise.value !== formula);
        //     // console.log(allPremises);
        //     // console.log(varPremises);
        //
        //     // 2. Check if using any elimination rule would give this result
        //     // - meaning find the top operator of the premise
        //     // - check if you can use an elimination rule
        //     // - if yes use it and compare
        //     for (let p of varPremises) {
        //         const topOp = p.tree?.getTopOperator();
        //         if (!topOp) return;
        //
        //         const pIndex = allPremises.indexOf(p);
        //         selectedRow.set(pIndex + 1);
        //
        //         const res =
        //             DeductionProcessor.getUsableRowsFromOperation(topOp, true);
        //
        //         if (!res.applicable) return;
        //     }
        //
        //
        //     // 3a. If it does, return the rule
        //     // 3b. If it does not, return an error
        // }

        // TODO: Determine what rule it was added from
        // 0b. If the formula has an operator
        // 1. Find the top operator
        // 2. Determine the left and right premises
        // 3. Check if they are present in the proof
        // 4a. If they are, check if using the introduction rule would give this result
        // 5a. If it does, return the rule
        // 4b. If they are not, check if using any elimination rule would give this result
        // 5b. If it does, return the rule
        // 4c. If they are not, return an error


        // Finally if the row is an assumption from the premises, return blank (no rule)
        return {tree: res, rule: "", value: formula};
    }
}