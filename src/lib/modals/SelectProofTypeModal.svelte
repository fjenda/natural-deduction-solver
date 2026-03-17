<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';

	interface SelectProofTypeModalProps extends CustomModalProps {
		directProof: () => void;
		indirectProof: () => void;
	}

	const { id, index, isOpen, close, title, directProof, indirectProof }: SelectProofTypeModalProps =
		$props();

	const options = [
		{
			title: 'Direct Proof',
			description: 'Start from premises and derive the conclusion directly.',
			action: directProof,
			icon: 'fa-solid fa-arrow-right'
		},
		{
			title: 'Indirect Proof',
			description: 'Assume negation of the goal and derive a contradiction.',
			action: indirectProof,
			icon: 'fa-solid fa-not-equal'
		}
	];
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
	{#snippet body()}
		<div class="proof-options">
			{#each options as option (option.title)}
				<button
					type="button"
					class="proof-card"
					onclick={() => {
						option.action();
						close();
					}}
				>
					<span class="icon"><i class={option.icon}></i></span>
					<span class="text">
						<span class="title">{option.title}</span>
						<span class="description">{option.description}</span>
					</span>
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
	.proof-options {
		display: grid;
		gap: var(--spacing-md);
		width: min(34rem, 100%);
	}

	.proof-card {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-elevated);
		text-align: left;
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
	}

	.proof-card:hover {
		border-color: var(--accent);
		box-shadow: var(--shadow-md);
	}

	.icon {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-md);
		display: grid;
		place-items: center;
		background: rgba(37, 99, 235, 0.12);
		color: var(--accent);
	}

	.text {
		display: grid;
		gap: 0.15rem;
	}

	.title {
		display: block;
		font-size: 1rem;
		font-weight: 600;
	}

	.description {
		display: block;
		font-size: 0.9rem;
		color: var(--text-secondary);
	}
</style>
