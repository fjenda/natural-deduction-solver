import { PrattParser } from '../../syntax-checker/PrattParser';
import { Node } from '../../syntax-checker/Node';
import { get } from 'svelte/store';
import { logicMode } from '../../../stores/solverStore';
import type { ParsedExpression } from '../../../types/ParsedExpression';

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
		const rawPremise = premise;

		// construct the return object
		const tmp: ParsedExpression = {
			tree: null,
			value: premise,
			diagnostic: undefined
		};

		// if the premise is empty, return the object
		if (premise === '') {
			return tmp;
		}

		// remove all whitespaces
		premise = premise.replace(/\s/g, '');

		// syntax check
		const mode = get(logicMode);
		const parser = new PrattParser(mode);
		const res = parser.parse(premise);

		// if the formula is not valid, return the error
		if (!res) {
			tmp.value = rawPremise;
			tmp.diagnostic = parser.lastDiagnostic ?? undefined;
			return tmp;
		}

		const tree = res.simplify().parenthesize();

		// set the tree
		tmp.tree = tree;
		tmp.value = Node.generateString(tree);
		tmp.diagnostic = undefined;

		return tmp;
	}
}
