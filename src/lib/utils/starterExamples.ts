import { ParseStrategy } from '../../types/ParseStrategy';

/**
 * Represents a starter example for the natural deduction solver.
 * Each example contains a set of premises, a conclusion, and a logic mode.
 */
export interface StarterExample {
	/** Display name for the example */
	name: string;
	/** List of premise formulas */
	premises: string[];
	/** The conclusion formula */
	conclusion: string;
	/** Whether this is propositional or predicate logic */
	mode: ParseStrategy;
}

/**
 * Pre-configured starter examples for the natural deduction solver.
 * These serve as templates for users to quickly get started.
 */
export const starterExamples: StarterExample[] = [
	{
		name: 'Modus Ponens',
		premises: ['A ⊃ B', 'A'],
		conclusion: 'B',
		mode: ParseStrategy.PROPOSITIONAL
	},
	{
		name: 'Modus Tollens',
		premises: ['A ⊃ B', '¬B'],
		conclusion: '¬A',
		mode: ParseStrategy.PROPOSITIONAL
	},
	{
		name: 'Disjunctive Syllogism',
		premises: ['A ∨ B', '¬A'],
		conclusion: 'B',
		mode: ParseStrategy.PROPOSITIONAL
	},
	{
		name: 'Hypothetical Syllogism',
		premises: ['A ⊃ B', 'B ⊃ C'],
		conclusion: 'A ⊃ C',
		mode: ParseStrategy.PROPOSITIONAL
	},
	{
		name: 'Conjunction Introduction',
		premises: ['A', 'B'],
		conclusion: 'A ∧ B',
		mode: ParseStrategy.PROPOSITIONAL
	},
	{
		name: 'Complex Propositional',
		premises: ['(A ∧ B) ⊃ C', 'A', 'B'],
		conclusion: 'C',
		mode: ParseStrategy.PROPOSITIONAL
	},
	{
		name: 'Universal Elimination',
		premises: ['∀x [P(x) ⊃ Q(x)]', '∀x [P(x)]'],
		conclusion: '∀x [Q(x)]',
		mode: ParseStrategy.PREDICATE
	},
	{
		name: 'Existential to Universal',
		premises: ['∀x [L(x) ⊃ ¬S(x)]', '∃x [L(x) ∧ P(x)]'],
		conclusion: '∃x [¬S(x) ∧ P(x)]',
		mode: ParseStrategy.PREDICATE
	},
	{
		name: 'Predicate Chain',
		premises: ['∀x [A(x) ⊃ B(x)]', '∀x [B(x) ⊃ C(x)]', 'A(a)'],
		conclusion: 'C(a)',
		mode: ParseStrategy.PREDICATE
	}
];
