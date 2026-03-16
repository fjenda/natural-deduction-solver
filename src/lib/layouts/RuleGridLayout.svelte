<script>
	let { children } = $props();
</script>

<div class="rule-grid">
	{@render children()}
</div>

<style>
	.rule-grid {
		width: 100%;
		max-width: calc(20rem + 3rem); /* 20rem + 3 * 1rem gap */
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		justify-content: center;
	}
</style>
