<script lang="ts">
	import TheoremsLayout from '../../layouts/TheoremsLayout.svelte';
	import { addTheorem, theorems } from '../../../stores/theoremsStore';
	import { logicMode, theoremData } from '../../../stores/solverStore';
	import TheoremSlot from '../../rules/components/TheoremSlot.svelte';
	import { solving } from '../../../stores/stateStore';
	import { fillVariables } from '../actions/proofActions';
	import StyledButton from '../../components/StyledButton.svelte';
</script>

<h2>Theorems</h2>
<StyledButton text="Add Theorem" onClick={addTheorem} />
<TheoremsLayout>
	{#if $theorems.filter((t) => t.mode === $logicMode).length === 0}
		<p>No theorems added yet.</p>
	{/if}

	{#each $theorems as theorem, i (theorem.solution.name)}
		{#if theorem.mode === $logicMode}
			<TheoremSlot
				name={theorem.solution.name}
				index={i}
				valid={theorem.solution.valid && theorem.solution.complete}
				onClick={() => {
					if (!$solving) return;

					const values = theorem.solution.whole.tree?.variables;
					if (!values) return;
					theoremData.update((td) => {
						td.theoremId = i;
						td.vars = new Set(values);
						return td;
					});
					fillVariables();
				}}
			/>
		{/if}
	{/each}
</TheoremsLayout>
