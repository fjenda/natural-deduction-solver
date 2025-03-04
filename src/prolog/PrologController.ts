import SWIPL, { type SWIPLModule } from "swipl-wasm";
import type { Compound } from "../types/prolog/Compound";
import { PrologQueryWrapper } from "./PrologQueryWrapper";

import ruleset from "./ruleset.pl?raw";
import substitute from "./substitute.pl?raw";

export class PrologController {
    private static instance: SWIPLModule | null = null;

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

    public static async loadString(content: string, id: string) {
        const instance = await PrologController.getInstance();
        return instance.prolog.load_string(content, id);
    }

    public static async query(query: string): Promise<PrologQueryWrapper> {
        const instance = await PrologController.getInstance();
        return new PrologQueryWrapper(instance.prolog.query(query));
    }

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