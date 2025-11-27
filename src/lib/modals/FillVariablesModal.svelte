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
			<MathMLViewer value={$theorems[$theoremData.theoremId]?.solution.whole.value} />

			<div class="arrow-icon">
				<i class="fa-solid fa-arrow-down-long"></i>
			</div>

			<!--			<div class="wrapper">-->
			<!--				<InteractiveNode node={$theorems[$theoremData.theoremId].solution.whole.tree} />-->
			<!--			</div>-->

			{#each $theoremData.vars as v, i (i)}
				<div class="wrapper">
					<MathMLViewer value={v.varName} />
					<input type="text" placeholder={`${v.varName}`} bind:value={$theoremData.varInputs[i]} />
				</div>
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

	.arrow-icon {
		text-align: center;
		font-size: 1.2rem;
		color: var(--color-primary);
		margin: 0.5rem auto;
	}

	.wrapper {
		display: flex;
		justify-content: center;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		flex-direction: row;
	}
</style>
