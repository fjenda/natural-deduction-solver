<script lang="ts">
	import RuleGridContainer from './RuleGridContainer.svelte';
	import TheoremsContainer from './TheoremsContainer.svelte';
</script>

<div class="sidebar">
	<div class="rules-section">
		<RuleGridContainer />
	</div>
	<div class="divider"></div>
	<div class="theorems-section">
		<TheoremsContainer />
	</div>
</div>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 0;
		min-height: 0;
		overflow: hidden;
	}

	.rules-section {
		flex: 0 1 auto;
		min-height: 0;
		/*overflow-y: auto;*/
		padding-bottom: var(--spacing-md);
		border-bottom: 1px solid var(--border);
	}

	.divider {
		height: 1px;
		background: var(--border);
	}

	.theorems-section {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding-top: var(--spacing-md);
	}

	/* Custom scrollbar styling */
	.rules-section::-webkit-scrollbar,
	.theorems-section::-webkit-scrollbar {
		width: 8px;
	}

	.rules-section::-webkit-scrollbar-track,
	.theorems-section::-webkit-scrollbar-track {
		background: transparent;
	}

	.rules-section::-webkit-scrollbar-thumb,
	.theorems-section::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: var(--radius-md);
	}

	.rules-section::-webkit-scrollbar-thumb:hover,
	.theorems-section::-webkit-scrollbar-thumb:hover {
		background: var(--accent);
	}
</style>
