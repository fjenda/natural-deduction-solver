import SWIPL, { type SWIPLModule } from "swipl-wasm";
import { PrologQueryWrapper } from "./PrologQueryWrapper";
import type { Compound } from "../types/prolog/Compound";

import ruleset from "./ruleset.pl?raw";
import substitute from "./substitute.pl?raw";

/**
 * PrologController is a singleton class that manages the SWIPL instance
 * and provides utility methods to interact with it.
 * @property {SWIPLModule | null} instance - The SWIPL instance.
 */
export class PrologController {
    private static instance: SWIPLModule | null = null;

    /**
     * Get the SWIPL instance.
     * If the instance does not exist, create it.
     */
    public static async getInstance(): Promise<SWIPLModule> {
        if (!PrologController.instance) {
            PrologController.instance = await SWIPL({
                arguments: ["-q", "-O"],
            });

            await PrologController.loadString(ruleset, 'rules');
            await PrologController.loadString(substitute, 'substitute');
        }

        return PrologController.instance;
    }

    /**
     * Load a string program into the SWIPL instance.
     * @param content - the program to load
     * @param id - id of the program
     */
    public static async loadString(content: string, id: string) {
        const instance = await PrologController.getInstance();
        return instance.prolog.load_string(content, id);
    }

    /**
     * Queries the Prolog instance with the given query.
     * @param query - the query to run
     */
    public static async query(query: string): Promise<PrologQueryWrapper> {
        const instance = await PrologController.getInstance();
        return new PrologQueryWrapper(instance.prolog.query(query));
    }

    /**
     * Parses a Prolog compound term into a Compound object.
     * @param compound - the compound term to parse
     */
    public static parsePrologCompound(compound: any): Compound {
        if (typeof compound === "object" && compound !== null) {
            const functor = (compound as { functor?: string }).functor;

            if (typeof functor === "string") {
                const args = (compound as Record<string, any>)[functor];

                return {
                    functor,
                    args: Array.isArray(args) ? args.map(PrologController.parsePrologCompound) : [],
                }
            }
        }

        return { functor: String(compound), args: [] };
    }
}