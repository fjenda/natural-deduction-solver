import { expect, test } from 'vitest';
import { PrettySyntaxer } from '../../../src/lib/solver/parsers/PrettySyntaxer';

test('PrettySyntaxer clean', () => {
	const str = '   - p   | q   &  r  -> s  ';
	const expected = '¬p ∨ q ∧ r ⊃ s';
	const result = PrettySyntaxer.clean(str);

	expect(result).toBe(expected);
});

test('PrettySyntaxer cleanupRule', () => {
	const str = '  IC 1    , 3  ';
	const expected = 'IC 1,3';
	const result = PrettySyntaxer.cleanupRule(str);

	expect(result).toBe(expected);
});

test('PrettySyntaxer toMathML', () => {
	const str = '¬p ∨ q ∧ r ⊃ s';
	const result = PrettySyntaxer.toMathML(str);
	const expected = `
    <math xmlns="http://www.w3.org/1998/Math/MathML">
        <mtable>
            <mtr>
                <mtd>
                <mo>¬</mo><mi>p</mi><mo>∨</mo><mi>q</mi><mo>∧</mo><mi>r</mi><mo>⊃</mo><mi>s</mi>
                </mtd>
            </mtr>
        </mtable>
    </math>
  `;

	// normalize whitespace for comparison
	const normalizedResult = result.replace(/\s+/g, ' ');
	const normalizedExpected = expected.replace(/\s+/g, ' ');
	expect(normalizedResult).toEqual(normalizedExpected);
});
