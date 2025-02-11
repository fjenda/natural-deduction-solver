import {PrattParser} from "../../syntax-checker/PrattParser";
import {Node} from "../../syntax-checker/Node";
import type {ParsedExpression} from "../../../types/ParsedExpression";
import { get } from "svelte/store";
import { logicMode } from "../../../stores/solverStore";

/**
 * This class is responsible for parsing the premises
 */
export class PremiseParser {
    /**
     * Parses the premise using the PrattParser
     * @param premise - the premise to parse
     * @returns the parsed premise
     */
    static parsePremise(premise: string): ParsedExpression {
        // construct the return object
        const tmp: ParsedExpression = {
            tree: null,
            value: premise,
        };

        // if the premise is empty, return the object
        if (premise === '') {
            return tmp;
        }

        // remove all whitespaces
        premise = premise.replace(/\s/g, '');

        // syntax check
        let parser = new PrattParser(get(logicMode));
        let res = parser.parse(premise);

        // if the formula is not valid, return the error
        if (!res) return tmp;
        // res.print();

        const tree = res.simplify().parenthesize();

        // set the tree
        tmp.tree = tree;
        tmp.value = Node.generateString(tree);

        return tmp;
    }
}

