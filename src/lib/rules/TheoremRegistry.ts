import type { Solution } from '../solver/Solution';
import type { TreeRuleType } from '../../types/TreeRuleType';
import { DeductionRule } from './DeductionRule';

type TheoremName = string;
export class TheoremRegistry {
	private dependencyGraph: Record<TheoremName, TheoremName[]> = {};

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

	getGraph(): Record<TheoremName, TheoremName[]> {
		return this.dependencyGraph;
	}
}
