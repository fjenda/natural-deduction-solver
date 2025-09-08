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
		/*flex-grow: 1;*/
		max-height: 300px;
		padding: 0.5rem;
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--surface);
	}

	.theorems {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
