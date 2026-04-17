/**
 * A simple token stream that allows for backtracking.
 * @property tokens - the tokens in the stream
 * @property index - the current index in the stream
 */
export class TokenStream {
	private readonly input: string;
	private readonly tokens: { value: string; raw: string; start: number; end: number }[];
	private index: number;

	/**
	 * Create a new token stream from an input string.
	 * @param input - the input string
	 * @constructor
	 */
	constructor(input: string) {
		this.input = input;
		this.tokens = [];

		for (let i = 0; i < input.length; ) {
			const token = input[i];
			if (/\s/.test(token)) {
				i++;
				continue;
			}

			if (input.startsWith('<->', i)) {
				this.tokens.push({ value: '≡', raw: '<->', start: i, end: i + 3 });
				i += 3;
				continue;
			}

			if (input.startsWith('->', i)) {
				this.tokens.push({ value: '⊃', raw: '->', start: i, end: i + 2 });
				i += 2;
				continue;
			}

			const mapped = TokenStream.mapAlternativeToken(token);
			this.tokens.push({ value: mapped, raw: token, start: i, end: i + 1 });
			i++;
		}

		this.index = 0;
	}

	private static mapAlternativeToken(token: string): string {
		switch (token) {
			case '&':
			case '^':
				return '∧';
			case '|':
				return '∨';
			case '!':
			case '-':
				return '¬';
			case '@':
				return '∀';
			case '?':
				return '∃';
			case '=':
				return '≡';
			default:
				return token;
		}
	}

	/**
	 * Get the current token in the stream.
	 * @returns the current token or null if the stream is at the end
	 */
	current(): string | null {
		return this.currentInfo()?.value ?? null;
	}

	/**
	 * Get the current token information in the stream.
	 * @returns the current token info or null if the stream is at the end
	 */
	currentInfo(): { value: string; raw: string; start: number; end: number } | null {
		return this.index < this.tokens.length ? this.tokens[this.index] : null;
	}

	/**
	 * Get the current parser span in the input.
	 * @returns the start and end offsets of the current token, or the EOF position
	 */
	currentSpan(): { start: number; end: number } {
		const current = this.currentInfo();
		if (current) return { start: current.start, end: current.end };

		return { start: this.input.length, end: this.input.length };
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
