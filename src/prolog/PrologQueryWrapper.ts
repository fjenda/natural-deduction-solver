import type { Query } from 'swipl-wasm';

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
	all(): unknown[] {
		const results = [];
		// @ts-expect-error: `this.query` is an iterable provided by the SWIPL library but lacks TypeScript typings
		for (const r of this.query) {
			results.push(r);
		}

		return results;
	}

	/**
	 * Get the first result of the Prolog Query
	 */
	once(): unknown {
		return this.query.once();
	}
}
