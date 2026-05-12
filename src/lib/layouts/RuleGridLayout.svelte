<script>
	let { children } = $props();
</script>

<div class="rule-grid">
	{@render children()}
</div>

<style>
	.rule-grid {
		width: 100%;
		--max-width: 20rem;
		max-width: calc(var(--max-width) + 3rem); /* 20rem + 3 * 1rem gap */
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		justify-content: center;
	}

	/* High resolution adjustments */
	@media (min-width: 2560px) {
		.rule-grid {
			--max-width: 24rem;
		}
	}

	@media (min-width: 3840px) {
		.rule-grid {
			--max-width: 32rem;
		}
	}
</style>
