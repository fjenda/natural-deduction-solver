/**
 * PrologController.test.ts
 * Unit tests for PrologController
 */

import { expect, test } from 'vitest';
import { PrologController } from '../../src/prolog/PrologController';
import type { ProveResult } from "../../src/types/prolog/PrologResult";
import { compoundToString } from "../../src/types/prolog/Compound";

type QueryResult = {
    X: number;
};

/**
 * Test if the PrologController instance is created correctly.
 */
test('PrologController Instance', async () => {
    const instance = await PrologController.instance();
    expect(instance).toBeDefined();
});

/**
 * Test if the PrologController returns correct results for a simple query.
 */
test('Simple Prolog Query', async () => {
    const instance = await PrologController.instance();
    expect(instance).toBeDefined();

    const result = (await PrologController.query('member(X, [1, 2, 3])')).all() as QueryResult[];
    expect(result).toBeDefined();
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty('X');
    expect(result[0].X).toBe(1);
    expect(result[1].X).toBe(2);
    expect(result[2].X).toBe(3);
});

/**
 * Test if the PrologController returns correct results for a natural deduction query.
 */
test('Natural Deduction Query', async () => {
    const instance = await PrologController.instance();
    expect(instance).toBeDefined();

    const result = (await PrologController.query("prove_handler(['A', 'B'], X, \'IC\').")).once() as ProveResult;
    expect(result).toBeDefined();

    const parsedResult = PrologController.parsePrologCompound(result.X);
    expect(parsedResult).toHaveProperty('functor');
    expect(parsedResult.functor).toBe('and');
    expect(parsedResult.args).toHaveLength(2);

    expect(parsedResult.args[0]).toHaveProperty('functor');
    expect(parsedResult.args[1]).toHaveProperty('functor');
    expect(parsedResult.args[0].functor).toBe('A');
    expect(parsedResult.args[1].functor).toBe('B');
});

/**
 * Helper function for easy testing of NDS queries.
 */
async function NDSQuery(rule: string, prem: string[], conc: string[]) {
    const instance = await PrologController.instance();
    expect(instance).toBeDefined();

    const query = `prove_handler([${prem.join(',')}], X, '${rule}').`;
    const results = (await PrologController.query(query)).all() as ProveResult[];
    expect(results).toBeDefined();

    const parsed = results.map(r => compoundToString(PrologController.parsePrologCompound(r.X)));
    expect(parsed).toBeDefined();

    for (const c of conc) {
        expect(parsed).toContain(c);
    }
}

/**
 * Test if the PrologController returns correct results for all natural deduction rules.
 */
test('Natural Deduction Rules', async () => {
    // Conjunction
    await NDSQuery('IC', ["'A'", "'B'"], ["and('A', 'B')"]);
    await NDSQuery('EC', ["and('A', 'B')"], ["'A'", "'B'"]);

    // Disjunction
    await NDSQuery('ID', ["'A'", "'B'"], ["or('A', 'B')"]);
    await NDSQuery('ED', ["or('A', 'B')", "not('A')"], ["'B'"]);
    await NDSQuery('ED', ["or('A', 'B')", "not('B')"], ["'A'"]);

    // Implication
    await NDSQuery('II', ["'A'", "'B'"], ["imp('A', 'B')"]);
    await NDSQuery('MP', ["imp('A', 'B')", "'A'"], ["'B'"]);

    // Equivalence
    await NDSQuery('IE', ["imp('A', 'B')", "imp('B', 'A')"], ["eq('A', 'B')"]);
    await NDSQuery('EE', ["eq('A', 'B')"], ["imp('A', 'B')", "imp('B', 'A')"]);
});