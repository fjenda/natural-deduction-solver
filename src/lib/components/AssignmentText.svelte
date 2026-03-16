<script lang="ts">
	import MathMLViewer from '../solver/components/MathMLViewer.svelte';
	import { EditState } from '../../types/EditState';
	import { editState } from '../../stores/stateStore';
	import { solverContent } from '../../stores/solverStore';
</script>

<div class="assignment-container">
	Find a proof for the following {$editState === EditState.SOLVER ? 'conclusion' : 'theorem'}:

	{#if $editState === EditState.SOLVER}
		<MathMLViewer value={$solverContent.conclusion.value} />
	{:else}
		<MathMLViewer value={$solverContent.whole.value} />
	{/if}
</div>

<style>
	.assignment-container {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
		font-weight: 500;
	}

	@media screen and (max-width: 950px) {
		.assignment-container {
			flex-direction: column;
			align-items: center;
			gap: var(--spacing-md);
		}
	}
</style>
