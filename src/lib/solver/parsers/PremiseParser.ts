import { PrattParser } from '../../syntax-checker/PrattParser';
import { Node } from '../../syntax-checker/Node';
import { get } from 'svelte/store';
import { logicMode } from '../../../stores/solverStore';
import { editState } from '../../../stores/stateStore';
import type { ParsedExpression } from '../../../types/ParsedExpression';
import { ParseStrategy } from '../../../types/ParseStrategy';
import { EditState } from '../../../types/EditState';

/**
 * This class is responsible for parsing the premises
 */
export class PremiseParser {
	private static resolveStrategy(strategy?: ParseStrategy): ParseStrategy {
		if (strategy) return strategy;

		const mode = get(logicMode);
		if (get(editState) === EditState.THEOREM && mode === ParseStrategy.PREDICATE) {
			return ParseStrategy.THEOREM;
		}

		return mode;
	}

	/**
	 * Parses the premise using the PrattParser
	 * @param premise - the premise to parse
	 * @param strategy - strategy used for the parsing
	 * @returns the parsed premise
	 */
	static parsePremise(premise: string, strategy?: ParseStrategy): ParsedExpression {
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
		const mode = PremiseParser.resolveStrategy(strategy);
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
