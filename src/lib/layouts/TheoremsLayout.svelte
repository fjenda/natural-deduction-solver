<div class="theorem-wrapper">
	<div class="theorems">
		<slot />
	</div>
</div>

<style>
	.theorem-wrapper {
		width: 100%;
		/*flex-grow: 1;*/
		max-height: 300px;
		padding: 0.5rem;
		overflow-y: auto;
		border: 1px solid var(--dark-border-color);
		border-radius: 0.5rem;
		background: var(--dark-bg-color);
	}

	@media (prefers-color-scheme: light) {
		.theorem-wrapper {
			border: 1px solid #d1d1d1;
			background-color: #fff;
		}
	}

	.theorems {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
