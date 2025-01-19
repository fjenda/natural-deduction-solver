/**
 * This file contains the SyntaxChecker class, which is used to prettify the formula string.
 */
export class SyntaxChecker {
    /**
     * This method takes a formula string and cleans it by
     *  1. replacing the alternative symbols with the standard symbols
     *  2. adding spaces around the operators.
     * @param f
     */
    public static clean(f: string): string {
        f = SyntaxChecker.replaceAlternatives(f);
        f = SyntaxChecker.prettyString(f);
        return f;
    }

    /**
     * This method takes a formula string and prettifies it by adding spaces around the operators.
     * @param f The formula string to prettify
     * @returns The prettified formula string
     */
    private static prettyString(f: string): string {
        // Negation should not have a space after it
        f = f.replace(/\s*¬\s*/g, "¬");

        // All the other operators should have a space before and after them
        f = f.replace(/\s*∧\s*/g, " ∧ ");
        f = f.replace(/\s*∨\s*/g, " ∨ ");
        f = f.replace(/\s*⊃\s*/g, " ⊃ ");
        f = f.replace(/\s*≡\s*/g, " ≡ ");
        return f;
    }

    /**
     * This method takes a formula string and replaces the alternative symbols with the standard symbols.
     * @param f The formula string to prettify
     * @returns The prettified formula string
     */
    private static replaceAlternatives(f: string): string {
        f = f.replace(/&/g, "∧");
        f = f.replace(/\^/g, "∧");
        f = f.replace(/\|/g, "∨");
        f = f.replace(/->/g, "⊃");
        f = f.replace(/<->/g, "≡");
        f = f.replace(/=/g, "≡");
        return f;
    }
}