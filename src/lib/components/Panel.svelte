<script lang="ts">
	import type { Snippet } from 'svelte';

	interface PanelProps {
		variant: 'fullwidth' | 'small';
		children: Snippet;
	}

	let { variant = 'fullwidth', children }: PanelProps = $props();
</script>

<div class="wrapper {variant}">
	<div class="content">
		{@render children()}
	</div>
</div>

<style>
	.wrapper {
		width: 100%;
		display: flex;
		flex-direction: column;
		/*height: 100%;*/
		overflow: hidden;
		background-color: var(--surface);
		border-radius: 0.5rem;
		border: 1px solid var(--border);
	}

	.content {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 1rem;
		flex: 1;
		align-items: center;
		border-radius: 0.5rem;
		padding: 1.5rem;
		text-align: center;
	}

	.fullwidth {
		width: 100%;
	}

	.small {
		max-width: 600px;
	}

	@media screen and (max-width: 950px) {
		.small {
			/*width: 100%;*/
			max-width: none;
		}

		.content {
			padding: 0.5rem;
			gap: 0.5rem;
		}
	}
</style>
