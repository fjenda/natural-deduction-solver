
export class Solution {
    name: string = "";
    premises: string[] = [""];
    conclusion: string | null = null;
    proof: string | null = "";

    constructor(name: string) {
        this.name = name;
    }

    addPremise(premise: string) {
        this.premises.push(premise);
    }

    setConclusion(conclusion: string) {
        this.conclusion = conclusion;
    }

    addProof(premise: string) {
        this.proof += `${premise}\n`;
    }

    toString() {
        return `${this.name}`;
    }
}