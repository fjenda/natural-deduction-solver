<script>
	let { children } = $props();
</script>

<div class="grid-layout">
	{@render children()}
</div>

<style>
	.grid-layout {
		padding: 1rem;
		display: flex;
		width: 100%;
		max-width: 1920px;
		height: calc(100% - 4rem);
		margin: 0 auto;
		gap: 1rem;
	}

	@media screen and (max-width: 950px) {
		.grid-layout {
			flex-direction: column;
			height: auto;
			padding: 0.5rem;
		}
	}
</style>
