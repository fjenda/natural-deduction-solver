var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig } from 'vite';
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
        exclude: __spreadArray(__spreadArray([], configDefaults.exclude, true), [
            'src/stores/**',
            'src/types/**',
            'src/**/**.svelte',
            '**.js',
            'src/**.ts',
            'src/lib/solver/solverLogic.ts',
            'src/lib/solver/parsers/FormulaParser.ts',
            'src/lib/rules/Theorem.ts'
        ], false),
        coverage: {
            exclude: __spreadArray(__spreadArray([], configDefaults.exclude, true), [
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
            ], false)
        }
    }
});
