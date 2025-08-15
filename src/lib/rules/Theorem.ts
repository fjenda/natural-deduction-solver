import type { IRule } from './IRule';

export class Theorem implements IRule {
	detail: string;
	inputSize: number;
	outputSize: number;
	short: string;
	title: string;

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

	public static getRule(ruleName: string): Theorem {
		return new Theorem(ruleName, ruleName);
	}
}
