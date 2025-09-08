<div class="grid-layout">
	<slot />
</div>

<style>
	.grid-layout {
		padding: 1rem;
		display: flex;
		width: 100%;
		max-width: 1920px;
		height: 100%;
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
