import type { Solution } from '../solver/Solution';
import type { TreeRuleType } from '../../types/TreeRuleType';
import { DeductionRule } from './DeductionRule';

type TheoremName = string;

/**
 * Registry that manages theorem dependencies and detects circular references
 * @property {Record<TheoremName, TheoremName[]>} dependencyGraph - graph of theorem dependencies
 */
export class TheoremRegistry {
	private dependencyGraph: Record<TheoremName, TheoremName[]> = {};

	/**
	 * Registers a theorem in the dependency graph, rejecting circular dependencies
	 * @param theorem - the solution (theorem) to register
	 * @returns {boolean} true if the theorem was registered, false if it would cause a cycle
	 */
	registerTheorem(theorem: Solution): boolean {
		const name = theorem.name;
		// temporarily add to graph to check for cycle
		this.dependencyGraph[name] = this.extractDependencies(theorem.proof);

		if (this.hasCycle(name)) {
			console.warn(`Cannot register "${name}". Circular dependency detected.`);
			delete this.dependencyGraph[name];
			return false;
		}

		return true;
	}

	/**
	 * Extracts the names of theorems used in a proof
	 * @param proof - the proof steps to extract dependencies from
	 * @returns {string[]} array of theorem names that the proof depends on
	 */
	private extractDependencies(proof: TreeRuleType[]): string[] {
		const mapped = proof.map((row) => DeductionRule.getRule(row.rule.rule));
		// if the rule is unknown, it's a theorem, and we want the original name
		// if the rule is not unknown, we want the name of the rule

		const names = mapped.map((rule, i) => {
			if (rule === DeductionRule.UNKNOWN) {
				return proof[i].rule.rule;
			}
			return null;
		});

		// filter out null values
		const filteredNames = names.filter((name) => name !== null) as string[];

		// remove duplicates
		return Array.from(new Set(filteredNames));
	}

	/**
	 * Checks if adding a theorem would create a circular dependency using DFS
	 * @param start - the theorem name to start the cycle check from
	 * @returns {boolean} true if a cycle is detected
	 */
	private hasCycle(start: TheoremName): boolean {
		const visited = new Set<TheoremName>();
		const stack = new Set<TheoremName>();

		const dfs = (node: TheoremName): boolean => {
			if (stack.has(node)) return true;
			if (visited.has(node)) return false;

			visited.add(node);
			stack.add(node);

			for (const neighbor of this.dependencyGraph[node] || []) {
				if (dfs(neighbor)) return true;
			}

			stack.delete(node);
			return false;
		};

		return dfs(start);
	}

	/**
	 * Returns the current dependency graph
	 * @returns {Record<TheoremName, TheoremName[]>} the dependency graph mapping theorem names to their dependencies
	 */
	getGraph(): Record<TheoremName, TheoremName[]> {
		return this.dependencyGraph;
	}
}
