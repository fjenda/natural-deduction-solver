<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';
	import type { ButtonContent } from '../../types/ButtonContent';

	interface SelectProofTypeModalProps extends CustomModalProps {
		theoremVariantButtons: ButtonContent[];
	}

	const { id, index, isOpen, close, title, theoremVariantButtons }: SelectProofTypeModalProps =
		$props();
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
	{#snippet body()}
		<div class="variant-list">
			{#each theoremVariantButtons as button, i (button.text)}
				<button
					type="button"
					class="variant-card"
					onclick={() => {
						button.action();
						close();
					}}
				>
					<span class="variant-index">{i + 1}</span>
					<span class="variant-text">{button.text}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet buttons()}
		<div>
			<button class="button" onclick={close}>Cancel</button>
		</div>
	{/snippet}
</CustomModal>

<style>
	.variant-list {
		display: grid;
		gap: var(--spacing-sm);
		width: min(34rem, 100%);
	}

	.variant-card {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--surface-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		text-align: left;
		box-shadow: var(--shadow-sm);
	}

	.variant-card:hover {
		border-color: var(--accent);
		box-shadow: var(--shadow-md);
	}

	.variant-index {
		width: 1.8rem;
		height: 1.8rem;
		border-radius: 999px;
		display: grid;
		place-items: center;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent);
		background: rgba(37, 99, 235, 0.12);
	}

	.variant-text {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-primary);
	}
</style>
