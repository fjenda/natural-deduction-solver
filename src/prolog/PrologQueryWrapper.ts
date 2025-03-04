import type { Query, SWIPLModule } from "swipl-wasm";

export class PrologQueryWrapper {
    private readonly query: Query;

    constructor(query: Query) {
        this.query = query;
    }

    all(): any[] {
        const results = [];
        for (let r of this.query) {
            results.push(r);
        }

        return results;
    }

    once(): any {
        return this.query.once();
    }

    next(): any {
        return this.query.next();
    }
}