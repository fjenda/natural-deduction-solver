import type { IRule } from './IRule';

/**
 * Class representing a user-defined theorem that can be used as a rule in proofs
 * @property {string} short - abbreviation of the theorem
 * @property {string} title - title of the theorem
 * @property {number} inputSize - number of inputs
 * @property {number} outputSize - number of outputs
 * @property {string} detail - the detail that is shown when hovering over the theorem
 */
export class Theorem implements IRule {
	detail: string;
	inputSize: number;
	outputSize: number;
	short: string;
	title: string;

	/**
	 * Constructor of the Theorem object
	 * @param short - abbreviation of the theorem
	 * @param title - title of the theorem
	 * @param inputSize - number of inputs
	 * @param outputSize - number of outputs
	 * @param detail - the detail that is shown when hovering over the theorem
	 * @constructor
	 */
	constructor(
		short: string,
		title: string,
		inputSize: number = 0,
		outputSize: number = 0,
		detail: string = ''
	) {
		this.short = short;
		this.title = title;
		this.inputSize = inputSize;
		this.outputSize = outputSize;
		this.detail = detail;
	}

	/**
	 * Creates a Theorem instance from a rule name
	 * @param ruleName - the name of the rule to create
	 * @returns {Theorem} a new Theorem instance
	 */
	public static getRule(ruleName: string): Theorem {
		return new Theorem(ruleName, ruleName);
	}
}
