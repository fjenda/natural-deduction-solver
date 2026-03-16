<script lang="ts">
	import type { Snippet } from 'svelte';

	interface PanelProps {
		variant?: 'fullwidth' | 'small';
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
		overflow: hidden;
		background-color: var(--surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-md);
		transition: all var(--transition-base);
	}

	.content {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: var(--spacing-lg);
		flex: 1;
		align-items: center;
		border-radius: var(--radius-lg);
		padding: var(--spacing-xl);
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
			max-width: none;
		}

		.content {
			padding: var(--spacing-lg);
			gap: var(--spacing-md);
		}
	}
</style>
