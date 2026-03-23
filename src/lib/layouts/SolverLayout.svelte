<script>
	let { children } = $props();
</script>

<div class="solver-layout">
	{@render children()}
</div>

<style>
	.solver-layout {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		height: 100%;
		width: 100%;
		min-height: 0;
	}
</style>
