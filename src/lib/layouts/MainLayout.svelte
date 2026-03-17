<script>
	let { children } = $props();
</script>

<div class="grid-layout">
	{@render children()}
</div>

<style>
	.grid-layout {
		padding: var(--spacing-xl);
		display: flex;
		width: 100%;
		max-width: 1920px;
		height: calc(100% - 4rem);
		margin: 0 auto;
		gap: var(--spacing-lg);
		align-items: stretch;
	}

	@media screen and (max-width: 1200px) {
		.grid-layout {
			padding: var(--spacing-lg);
			gap: var(--spacing-md);
		}
	}

	@media screen and (max-width: 950px) {
		.grid-layout {
			flex-direction: column;
			height: auto;
			padding: var(--spacing-md);
			gap: var(--spacing-md);
		}
	}
</style>
