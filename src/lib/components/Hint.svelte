<script lang="ts">
	interface HintProps {
		/** The hint text to display */
		text: string;
		/** Optional title for the hint popover */
		title?: string;
	}

	let { text, title }: HintProps = $props();

	let expanded = $state(false);

	/**
	 * Toggles the hint popover visibility.
	 */
	const toggle = () => {
		expanded = !expanded;
	};

	/**
	 * Closes the hint when clicking outside.
	 */
	const handleFocusOut = () => {
		expanded = false;
	};
</script>

<span class="hint-container" onfocusout={handleFocusOut}>
	<button
		class="hint-trigger"
		type="button"
		onclick={toggle}
		aria-label="Show hint"
		aria-expanded={expanded}
	>
		<i class="fas fa-circle-question"></i>
	</button>

	{#if expanded}
		<div class="hint-popover" role="tooltip">
			{#if title}
				<div class="hint-title">{title}</div>
			{/if}
			<div class="hint-text">{text}</div>
		</div>
	{/if}
</span>

<style>
	.hint-container {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.hint-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		border: none;
		background: none;
		color: var(--text-secondary);
		cursor: pointer;
		transition: color var(--transition-base);
		font-size: 0.85rem;
		opacity: 0.6;
	}

	.hint-trigger:hover {
		color: var(--accent);
		opacity: 1;
	}

	.hint-popover {
		position: absolute;
		top: calc(100% + 6px);
		left: 50%;
		transform: translateX(-50%);
		z-index: 200;
		min-width: 200px;
		max-width: 320px;
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		animation: fadeIn 0.15s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.hint-title {
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--accent);
		margin-bottom: var(--spacing-xs);
	}

	.hint-text {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
</style>
