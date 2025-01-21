import type {TreeRuleType} from "../../types/TreeRuleType";

export class Solution {
    name: string = "";
    premises: string[] = [""];
    conclusion: string = "";
    proof: TreeRuleType[] = [];

    constructor(name: string) {
        this.name = name;
    }

    toString() {
        return `${this.name}`;
    }
}