import {PrattParser} from "../../syntax-checker/PrattParser";
import type {TreeRuleType} from "../../../types/TreeRuleType";
import type {AppliedRule} from "../../../types/AppliedRule";

/**
 * This class is responsible for parsing the premises
 */
export class PremiseParser {
    /**
     * Parses the premise using the PrattParser
     * @param premise - the premise to parse
     * @param line - the line number
     * @param rule - the rule that was applied
     * @returns the parsed premise
     */
    static parsePremise(premise: string, line: number, rule: AppliedRule): TreeRuleType {
        // construct the return object
        const tmp: TreeRuleType = {
            line: line,
            tree: null,
            rule: rule,
            value: premise,
        }

        // if the premise is empty, return the object
        if (premise === '') {
            return tmp;
        }

        // remove all whitespaces
        premise = premise.replace(/\s/g, '');

        // syntax check
        let pratt = new PrattParser();
        let res = pratt.parse(premise);

        // if the formula is not valid, return the error
        if (!res) return tmp;
        // res.print();

        // set the tree
        tmp.tree = res;
        return tmp;
    }
}

