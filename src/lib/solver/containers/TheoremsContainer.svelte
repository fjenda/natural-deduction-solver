<script lang="ts">
	import TheoremsLayout from '../../layouts/TheoremsLayout.svelte';
	import { createTheorem, theorems } from '../../../stores/theoremsStore';
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

		const values = theorem.solution.whole.tree?.varNames;
		if (!values) return;

		theoremData.update((td) => {
			td.theoremId = index;
			td.vars = values;
			return td;
		});
		fillVariables();
	};
</script>

<div class="wrapper">
	<div class="section-header">
		<i class="fa-solid fa-book"></i>
		<h2>Theorems</h2>
	</div>
	<StyledButton text="Create Theorem" onClick={createTheorem} disabled={$solving} />
	<TheoremsLayout>
		{#if shownTheorems.length === 0}
			<p class="empty-text">No theorems added yet.</p>
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
</div>

<style>
	.section-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		width: 100%;
	}

	.section-header i {
		color: var(--accent);
		flex-shrink: 0;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.wrapper {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.empty-text {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin-top: var(--spacing-sm);
		text-align: center;
		padding: var(--spacing-xl);
	}
</style>
