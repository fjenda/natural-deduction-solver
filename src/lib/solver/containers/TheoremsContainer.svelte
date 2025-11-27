<script lang="ts">
	import TheoremsLayout from '../../layouts/TheoremsLayout.svelte';
	import { addTheorem, theorems } from '../../../stores/theoremsStore';
	import { logicMode, theoremData } from '../../../stores/solverStore';
	import TheoremSlot from '../../rules/components/TheoremSlot.svelte';
	import { solving } from '../../../stores/stateStore';
	import { fillVariables } from '../actions/proofActions';
	import StyledButton from '../../components/StyledButton.svelte';
	import { ParseStrategy } from '../../../types/ParseStrategy';
	import type { Solution } from '../Solution';

	const shownTheorems = $derived(
		$logicMode === ParseStrategy.PROPOSITIONAL
			? $theorems.filter((t) => t.mode === ParseStrategy.PROPOSITIONAL)
			: $theorems
	);

	const handleTheoremClick = (
		theorem: { solution: Solution; mode: ParseStrategy },
		index: number
	) => {
		if (!$solving) return;

		console.log(theorem.solution.whole.tree);
		const values = theorem.solution.whole.tree?.varNames;
		console.log(values);

		if (!values) return;
		theoremData.update((td) => {
			td.theoremId = index;
			td.vars = values;
			return td;
		});
		fillVariables();
	};
</script>

<h2>Theorems</h2>
<StyledButton text="Add Theorem" onClick={addTheorem} />
<TheoremsLayout>
	{#if shownTheorems.length === 0}
		<p>No theorems added yet.</p>
	{/if}

	{#each $theorems as theorem, i (theorem.solution.name)}
		{#if shownTheorems.includes(theorem)}
			<TheoremSlot
				name={theorem.solution.name}
				index={i}
				valid={theorem.solution.valid && theorem.solution.complete}
				onClick={() => {
					handleTheoremClick(theorem, i);
				}}
			/>
		{/if}
	{/each}
</TheoremsLayout>
