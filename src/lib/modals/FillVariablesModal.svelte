<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';
	import MathMLViewer from '../solver/components/MathMLViewer.svelte';
	import { theorems } from '../../stores/theoremsStore';
	import { theoremData } from '../../stores/solverStore';

	interface FillVariablesModalProps extends CustomModalProps {
		onConfirm: () => void;
	}

	const { id, index, isOpen, close, title, onConfirm }: FillVariablesModalProps = $props();
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
	{#snippet body()}
		<div slot="body" class="body">
			<MathMLViewer value={$theorems[$theoremData.theoremId]?.whole.value} />
			{#each $theoremData.vars as v, i (i)}
				<input type="text" placeholder={`${v}`} bind:value={$theoremData.varInputs[i]} />
			{/each}
		</div>
	{/snippet}

	{#snippet buttons()}
		<div slot="buttons">
			<button
				class="button"
				onclick={() => {
					close();
				}}>Cancel</button
			>
			<button
				class="button"
				onclick={() => {
					onConfirm();
					close();
				}}>Confirm</button
			>
		</div>
	{/snippet}
</CustomModal>

<style>
	.body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
