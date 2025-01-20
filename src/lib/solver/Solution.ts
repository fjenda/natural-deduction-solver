export class Solution {
    name: string = "";
    premises: string[] = [""];
    conclusion: string | null = null;
    proof: string | null = "";

    constructor(name: string) {
        this.name = name;
    }

    toString() {
        return `${this.name}`;
    }
}