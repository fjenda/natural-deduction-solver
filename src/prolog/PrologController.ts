import SWIPL, { type SWIPLModule } from 'swipl-wasm';
import { PrologQueryWrapper } from './PrologQueryWrapper';
import type { Compound } from '../types/prolog/Compound';

import ruleset from './pl/ruleset.pl?raw';
import substitute from './pl/substitute.pl?raw';
import test_rules from './pl/test_rules.pl?raw';
import proof_table from './pl/proof_table.pl?raw';
import args_table from './pl/args_table.pl?raw';
import theorem_table from './pl/theorem_table.pl?raw';

/**
 * PrologController is a singleton class that manages the SWIPL instance
 * and provides utility methods to interact with it.
 * @property {SWIPLModule | null} module - The SWIPL instance.
 * @property {Promise<unknown>} queryLock - A lock to ensure queries are executed sequentially.
 */
export class PrologController {
	private static module: SWIPLModule | null = null;

	private static queryLock: Promise<unknown> = Promise.resolve();

	/**
	 * Get the SWIPL instance.
	 * If the instance does not exist, create it.
	 */
	public static async instance(): Promise<SWIPLModule> {
		if (!PrologController.module) {
			PrologController.module = await SWIPL({
				arguments: ['-q', '-O'],
				print(str: string) {
					console.log(`[Prolog] ${str}`);
				},
				printErr(str: string) {
					console.error(`[Prolog Error] ${str}`);
				}
			});

			// await PrologController.loadString(ruleset, "rules");
			await PrologController.loadString(substitute, 'substitute');
			await PrologController.loadString(proof_table, 'proof_table');
			await PrologController.loadString(args_table, 'args_table');
			await PrologController.loadString(theorem_table, 'theorem_table');
			await PrologController.loadString(test_rules, 'test_rules');
		}

		return PrologController.module;
	}

	/**
	 * Load a string program into the SWIPL instance.
	 * @param content - the program to load
	 * @param id - id of the program
	 */
	public static async loadString(content: string, id: string) {
		const instance = await PrologController.instance();
		// @ts-expect-error: `load_string` is not typed in the SWIPL module
		return instance.prolog.load_string(content, id);
	}

	/**
	 * Queries the Prolog instance once and returns the first result or null if no result is found.
	 * @param q - the query to run
	 */
	public static queryOnce<T = unknown>(q: string): Promise<T | null> {
		PrologController.queryLock = PrologController.queryLock.then(async () => {
			const instance = await PrologController.instance();
			const wrapper = new PrologQueryWrapper(instance.prolog.query(q));
			return wrapper.once() as Promise<T | null>;
		});

		return PrologController.queryLock as Promise<T | null>;
	}

	/**
	 * Queries the Prolog instance and returns all results as an array.
	 * @param q - the query to run
	 */
	public static queryAll<T = unknown>(q: string): Promise<T[]> {
		PrologController.queryLock = PrologController.queryLock.then(async () => {
			const instance = await PrologController.instance();
			const wrapper = new PrologQueryWrapper(instance.prolog.query(q));
			return wrapper.all() as unknown as Promise<T[]>;
		});

		return PrologController.queryLock as Promise<T[]>;
	}

	/**
	 * Queries the Prolog instance with the given query.
	 * @param query - the query to run
	 */
	public static async query(query: string): Promise<PrologQueryWrapper> {
		const instance = await PrologController.instance();

		// chain queries through queryLock
		PrologController.queryLock = PrologController.queryLock.then(async () => {
			return new PrologQueryWrapper(instance.prolog.query(query));
		});

		// wait for this query wrapper
		return PrologController.queryLock as Promise<PrologQueryWrapper>;
	}

	/**
	 * Parses a Prolog compound term into a Compound object.
	 * @param compound - the compound term to parse
	 */
	public static parsePrologCompound(compound: unknown): Compound {
		if (typeof compound === 'object' && compound !== null) {
			const functor = (compound as { functor?: string }).functor;

			if (functor) {
				const args = (compound as Record<string, unknown>)[functor];

				return {
					functor,
					args: Array.isArray(args) ? args.map(PrologController.parsePrologCompound) : []
				};
			}
		}

		return { functor: String(compound), args: [] };
	}
}
