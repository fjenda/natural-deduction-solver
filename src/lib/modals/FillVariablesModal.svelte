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
				class="button primary"
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
		gap: var(--spacing-lg);
	}

	.arrow-icon {
		text-align: center;
		font-size: 1.5rem;
		color: var(--accent);
		margin: var(--spacing-md) auto;
		animation: bounce 1.5s ease-in-out infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(8px);
		}
	}

	.wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-lg);
		padding: var(--spacing-lg);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-elevated);
		transition: all var(--transition-base);
	}

	.wrapper:hover {
		border-color: var(--accent);
		box-shadow: var(--shadow-md);
	}

	.wrapper input {
		flex: 1;
		min-width: 0;
	}
</style>
