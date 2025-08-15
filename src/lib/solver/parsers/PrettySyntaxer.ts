/**
 * This file contains the SyntaxChecker class, which is used to prettify the formula string.
 */
export class PrettySyntaxer {
	/**
	 * This method takes a formula string and cleans it by
	 *  1. replacing the alternative symbols with the standard symbols
	 *  2. adding spaces around the operators.
	 * @param f - The formula string to clean
	 * @returns The cleaned formula string
	 */
	public static clean(f: string): string {
		f = PrettySyntaxer.replaceAlternatives(f);
		f = PrettySyntaxer.prettyString(f);
		return f;
	}

	/**
	 * Takes a formula string and prettifies it by adding spaces around the operators.
	 * @param f The formula string to prettify
	 * @returns The prettified formula string
	 */
	private static prettyString(f: string): string {
		// trim the string
		f = f.trim();

		// Negation should not have a space after it
		f = f.replace(/\s*¬\s*/g, '¬');

		// All the other operators should have a space before and after them
		f = f.replace(/\s*∧\s*/g, ' ∧ ');
		f = f.replace(/\s*∨\s*/g, ' ∨ ');
		f = f.replace(/\s*⊃\s*/g, ' ⊃ ');
		f = f.replace(/\s*≡\s*/g, ' ≡ ');

		// Quantifiers should have a space before them and after the variable
		// f = f.replace(/\s*∀\s*/g, " ∀");
		// f = f.replace(/\s*∃\s*/g, " ∃");

		return f;
	}

	/**
	 * Takes a formula string and replaces the alternative symbols with the standard symbols.
	 * @param f The formula string to prettify
	 * @returns The prettified formula string
	 */
	private static replaceAlternatives(f: string): string {
		f = f.replace(/&/g, '∧');
		f = f.replace(/\^/g, '∧');
		f = f.replace(/\|/g, '∨');
		f = f.replace(/->/g, '⊃');
		f = f.replace(/<->/g, '≡');
		f = f.replace(/=/g, '≡');
		f = f.replace(/!/g, '¬');
		f = f.replace(/-/g, '¬');
		f = f.replace(/@/g, '∀');
		f = f.replace(/\?/g, '∃');

		return f;
	}

	/**
	 * Takes a rule string and cleans it by
	 * 1. removing extra spaces
	 * 2. replacing spaces around commas with just commas
	 * @param r The rule string to clean
	 * @returns The cleaned rule string
	 */
	public static cleanupRule(r: string): string {
		// rule should be in a format `ruleName line1?,line2?`
		r = r.trim();

		// convert letters to capital
		r = r.toUpperCase();

		// remove extra spaces
		r = r.replace(/\s+/g, ' ');

		// remove spaces around commas
		r = r.replace(/\s*,\s*/g, ',');
		return r;
	}

	/**
	 * Converts the plain text formula into MathML
	 * @param f The formula to convert
	 * @returns The MathML representation of the formula
	 */
	public static toMathML(f: string): string {
		return `
            <math xmlns="http://www.w3.org/1998/Math/MathML">
                <mtable>
                    ${f
											.split('\n') // Split the formula by newlines
											.map(
												(line) => `
                        <mtr>
                            <mtd>
                                ${line
																	.replace(/¬/g, '<mo>¬</mo>')
																	.replace(/∧/g, '<mo>∧</mo>')
																	.replace(/∨/g, '<mo>∨</mo>')
																	.replace(/⊃/g, '<mo>⊃</mo>')
																	.replace(/≡/g, '<mo>≡</mo>')
																	.replace(/,/g, '<mo>,</mo>')
																	.replace(/⊢/g, '<mo>⊢</mo>')
																	.replace(/∀/g, '<mo>∀</mo>')
																	.replace(/∃/g, '<mo>∃</mo>')
																	.replace(/\s/g, '<mi>&nbsp</mi>')
																	.replace(/\(/g, '<mo stretchy="false">(</mo>')
																	.replace(/\)/g, '<mo stretchy="false">)</mo>')
																	.replace(/\b([A-Za-z])\b/g, '<mi>$1</mi>')}
                            </mtd>
                        </mtr>`
											)
											.join('')}
                </mtable>
            </math>
        `;
	}
}
