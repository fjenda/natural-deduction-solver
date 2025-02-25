import type { Query, SWIPLModule } from "swipl-wasm";

export class PrologQueryWrapper {
    private readonly query: Query;

    constructor(query: Query) {
        this.query = query;
    }

    all(): unknown[] {
        const results = [];
        for (let r of this.query) {
            results.push(r);
        }

        return results;
    }

    once(): unknown {
        return this.query.once();
    }

    next(): unknown {
        return this.query.next();
    }
}