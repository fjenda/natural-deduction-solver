<script lang="ts">
	interface TooltipProps {
		content: string;
		position: 'top' | 'bottom' | 'left' | 'right';
		show: boolean;
	}

	let { content, position, show }: TooltipProps = $props();
</script>

<div class="tooltip {position}" class:show>
	{@html content}
</div>

<style>
	.tooltip {
		position: absolute;
		background: linear-gradient(135deg, var(--surface-elevated), var(--surface));
		color: var(--text-primary);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		z-index: 1000;
		display: none;
		width: max-content;
		font-size: 0.9rem;
		font-weight: 500;
		box-shadow: var(--shadow-lg);
		pointer-events: none;
		max-width: 250px;
		text-align: center;
		word-wrap: break-word;
	}

	.tooltip.bottom::before {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border-left: 0.5rem solid transparent;
		border-right: 0.5rem solid transparent;
		border-bottom: 0.5rem solid var(--surface);
		top: -0.5rem;
		left: 50%;
		transform: translateX(-50%);
		filter: drop-shadow(0 -1px 0 var(--border));
	}

	.tooltip.top::after {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border-left: 0.5rem solid transparent;
		border-right: 0.5rem solid transparent;
		border-top: 0.5rem solid var(--surface);
		bottom: -0.5rem;
		left: 50%;
		transform: translateX(-50%);
		filter: drop-shadow(0 1px 0 var(--border));
	}

	.tooltip.left::after {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border-top: 0.5rem solid transparent;
		border-bottom: 0.5rem solid transparent;
		border-left: 0.5rem solid var(--surface);
		right: -0.5rem;
		top: 50%;
		transform: translateY(-50%);
		filter: drop-shadow(1px 0 0 var(--border));
	}

	.tooltip.right::after {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border-top: 0.5rem solid transparent;
		border-bottom: 0.5rem solid transparent;
		border-right: 0.5rem solid var(--surface);
		left: -0.5rem;
		top: 50%;
		transform: translateY(-50%);
		filter: drop-shadow(-1px 0 0 var(--border));
	}

	.tooltip.show {
		display: flex;
		flex-direction: column;
		animation: tooltipFadeIn var(--transition-base);
	}

	@keyframes tooltipFadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.tooltip.bottom {
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: var(--spacing-sm);
	}

	.tooltip.bottom.show {
		animation: tooltipFadeInBottom var(--transition-base);
	}

	@keyframes tooltipFadeInBottom {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.tooltip.left {
		top: 50%;
		right: 100%;
		transform: translateY(-50%);
		margin-right: var(--spacing-sm);
	}

	.tooltip.left.show {
		animation: tooltipFadeInLeft var(--transition-base);
	}

	@keyframes tooltipFadeInLeft {
		from {
			opacity: 0;
			transform: translateY(-50%) translateX(8px);
		}
		to {
			opacity: 1;
			transform: translateY(-50%) translateX(0);
		}
	}

	.tooltip.right {
		top: 50%;
		left: 100%;
		transform: translateY(-50%);
		margin-left: var(--spacing-sm);
	}

	.tooltip.right.show {
		animation: tooltipFadeInRight var(--transition-base);
	}

	@keyframes tooltipFadeInRight {
		from {
			opacity: 0;
			transform: translateY(-50%) translateX(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(-50%) translateX(0);
		}
	}

	.tooltip.top {
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: var(--spacing-sm);
	}

	.tooltip.top.show {
		animation: tooltipFadeInTop var(--transition-base);
	}

	@keyframes tooltipFadeInTop {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>
