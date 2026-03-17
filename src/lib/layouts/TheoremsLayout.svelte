<script>
	let { children } = $props();
</script>

<div class="theorem-wrapper">
	<div class="theorems">
		{@render children()}
	</div>
</div>

<style>
	.theorem-wrapper {
		width: 100%;
		/*max-height: 300px;*/
		flex-grow: 1;
		min-height: 0;
		padding: var(--spacing-md);
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-elevated);
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-base);
	}

	.theorems {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	/* Custom scrollbar styling */
	.theorem-wrapper::-webkit-scrollbar {
		width: 8px;
	}

	.theorem-wrapper::-webkit-scrollbar-track {
		background: var(--background);
		border-radius: var(--radius-md);
	}

	.theorem-wrapper::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: var(--radius-md);
	}

	.theorem-wrapper::-webkit-scrollbar-thumb:hover {
		background: var(--accent);
	}
</style>
