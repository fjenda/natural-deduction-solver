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
		gap: 1rem;
	}

	.premise-input-wrapper button i {
		font-size: 1.25rem;
	}

	.premise-input-wrapper button {
		width: 20px;
		aspect-ratio: 1;
		padding: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		transition: color 0.2s;
		background: none;
	}

	.premise-input-wrapper button:hover {
		color: #ff0000;
	}

	.premise-input-wrapper button:disabled {
		cursor: not-allowed;
		color: rgba(255, 255, 255, 0.3);
	}

	.premise-input-wrapper button:hover,
	.premise-input-wrapper button:focus {
		outline: none;
		border: none;
	}

	:global(html):not(.dark-mode) {
		.premise-input-wrapper button:disabled {
			color: rgba(16, 16, 16, 0.3);
		}
	}
</style>
