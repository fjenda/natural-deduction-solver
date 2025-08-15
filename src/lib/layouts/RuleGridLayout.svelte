<div class="rule-grid">
	<slot />
</div>

<style>
	.rule-grid {
		width: 100%;
		max-width: calc(20rem + 3rem); /* 20rem + 3 * 1rem gap */
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
	}
</style>
