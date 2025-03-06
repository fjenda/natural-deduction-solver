import type { Query } from "swipl-wasm";

/**
 * Wrapper class for the Prolog Query
 * @property {Query} query - the Prolog Query
 */
export class PrologQueryWrapper {
    private readonly query: Query;

    /**
     * Constructor for the PrologQueryWrapper
     * @param query - the Prolog Query
     * @constructor
     */
    constructor(query: Query) {
        this.query = query;
    }

    /**
     * Get all the results of the Prolog Query
     */
    all(): any[] {
        const results = [];
        for (let r of this.query) {
            results.push(r);
        }

        return results;
    }

    /**
     * Get the first result of the Prolog Query
     */
    once(): any {
        return this.query.once();
    }

    /**
     * Get the next result of the Prolog Query
     */
    next(): any {
        return this.query.next();
    }
}