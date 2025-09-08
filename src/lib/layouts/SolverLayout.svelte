<script>
	let { children } = $props();
</script>

<div class="solver-layout">
	{@render children()}
</div>

<style>
	.solver-layout {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
		width: 100%;
	}
</style>
