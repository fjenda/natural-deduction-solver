/**
 * A simple token stream that allows for backtracking.
 * @property tokens - the tokens in the stream
 * @property index - the current index in the stream
 */
export class TokenStream {
    private readonly tokens: string[];
    private index: number;

    /**
     * Create a new token stream from an input string.
     * @param input - the input string
     * @constructor
     */
    constructor(input: string) {
        this.tokens = input.split(/\s*/).filter(token => token.length > 0);
        this.index = 0;
    }

    /**
     * Get the current token in the stream.
     * @returns the current token or null if the stream is at the end
     */
    current(): string | null {
        return this.index < this.tokens.length ? this.tokens[this.index] : null;
    }

    /**
     * Match the current token in the stream with a given token.
     * If the tokens match, advance the stream.
     * @param token - the token to match
     * @returns true if the tokens match, false otherwise
     */
    match(token: string): boolean {
        if (this.current() === token) {
            this.advance();
            return true;
        }
        return false;
    }

    /**
     * Advance the stream to the next token.
     */
    advance(): void {
        this.index++;
    }

    /**
     * Check if the stream is at the end.
     * @returns true if the stream is at the end, false otherwise
     */
    isAtEnd(): boolean {
        return this.index >= this.tokens.length;
    }

    /**
     * Save the current index in the stream.
     * @returns the current index
     */
    save(): number {
        return this.index;
    }

    /**
     * Restore the stream to a previously saved index.
     * @param savedIndex - the saved index
     */
    restore(savedIndex: number): void {
        this.index = savedIndex;
    }
}