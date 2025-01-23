export class TokenStream {
    private tokens: string[];
    private index: number;

    constructor(input: string) {
        this.tokens = input.split(/\s*/).filter(token => token.length > 0);
        this.index = 0;
    }

    current(): string | null {
        return this.index < this.tokens.length ? this.tokens[this.index] : null;
    }

    match(token: string): boolean {
        if (this.current() === token) {
            this.advance();
            return true;
        }
        return false;
    }

    advance(): void {
        this.index++;
    }

    isAtEnd(): boolean {
        return this.index >= this.tokens.length;
    }

    // New methods for backtracking
    save(): number {
        return this.index;
    }

    restore(savedIndex: number): void {
        this.index = savedIndex;
    }
}