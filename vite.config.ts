import { build, defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { configDefaults } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte()],
	base: '/natural-deduction-solver/',
	build: {
		sourcemap: true
	},
	test: {
		exclude: [
			...configDefaults.exclude,
			'src/stores/**',
			'src/types/**',
			'src/**/**.svelte',
			'**.js',
			'src/**.ts',

			'src/lib/solver/solverLogic.ts',
			'src/lib/solver/parsers/FormulaParser.ts',
			'src/lib/rules/Theorem.ts'
		],
		coverage: {
			exclude: [
				...configDefaults.exclude,
				'src/stores/**',
				'src/types/**',
				'src/**/**.svelte',
				'**.js',
				'src/**.ts',

				'src/lib/solver/solverLogic.ts',
				'src/lib/solver/Solution.ts',
				'src/lib/solver/parsers/FormulaParser.ts',
				'src/lib/rules/Theorem.ts',
				'src/lib/rules/TheoremRegistry.ts'
			]
		}
	}
});
