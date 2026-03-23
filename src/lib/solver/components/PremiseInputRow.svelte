<script lang="ts">
	import { removePremise } from '../../../stores/solverStore';
	import type { Snippet } from 'svelte';

	interface PremiseInputRowProps {
		index: number;
		removable: boolean;
		children: Snippet;
	}

	let { index, removable, children }: PremiseInputRowProps = $props();
</script>

<div class="premise-input-wrapper">
	{@render children()}
	<button
		type="button"
		aria-label="Remove premise"
		onclick={() => removable && removePremise(index)}
		disabled={!removable}
	>
		<i class="fa fa-xmark"></i>
	</button>
</div>

<style>
	.premise-input-wrapper {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.premise-input-wrapper button i {
		font-size: 1.25rem;
	}

	.premise-input-wrapper button {
		width: 2.5rem;
		aspect-ratio: 1;
		padding: var(--spacing-sm);
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid var(--border);
		transition: all var(--transition-base);
		background: var(--button-bg);
		color: var(--text-primary);
		border-radius: var(--radius-md);
		cursor: pointer;
		box-shadow: var(--shadow-sm);
	}

	.premise-input-wrapper button:hover:not(:disabled) {
		color: var(--error);
		border-color: var(--error);
		background: var(--error-bg);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.premise-input-wrapper button:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 3px var(--surface),
			0 0 0 5px var(--accent);
	}

	.premise-input-wrapper button:active:not(:disabled) {
		transform: translateY(0);
	}

	.premise-input-wrapper button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	:global(html):not(.dark-mode) {
		.premise-input-wrapper button:disabled {
			opacity: 0.5;
		}
	}
</style>
