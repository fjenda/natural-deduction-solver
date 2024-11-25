export class TokenStream {
    private readonly tokens: string[];
    private index: number = 0;

    constructor(input: string) {
        this.tokens = input.split('');
    }

    current(): string | undefined {
        return this.tokens[this.index];
    }

    match(expected: string): boolean {
        if (this.current() === expected) {
            this.index++;
            return true;
        }
        return false;
    }

    advance(): void {
        if (!this.isAtEnd()) {
            this.index++;
        }
    }

    isAtEnd(): boolean {
        return this.index >= this.tokens.length;
    }
}