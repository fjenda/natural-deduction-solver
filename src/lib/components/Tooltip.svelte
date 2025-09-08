<script lang="ts">
	export let content: string;
	export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
	export let show: boolean = false;
</script>

<div class="tooltip {position}" class:show>
	{@html content}
</div>

<style>
	.tooltip {
		position: absolute;
		background-color: #333;
		color: white;
		padding: 0.5rem;
		border-radius: 0.5rem;
		z-index: 1000;
		display: none;
		width: max-content;
		font-size: 1.25em;
	}

	.tooltip.bottom::before {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border-left: 0.5rem solid transparent;
		border-right: 0.5rem solid transparent;
		border-bottom: 0.5rem solid #333;
		top: -0.5rem;
		left: 50%;
		transform: translateX(-50%);
	}

	.tooltip.top::after {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border-left: 0.5rem solid transparent;
		border-right: 0.5rem solid transparent;
		border-top: 0.5rem solid #333;
		bottom: -0.5rem;
		left: 50%;
		transform: translateX(-50%);
	}

	.tooltip.left::after {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border-top: 0.5rem solid transparent;
		border-bottom: 0.5rem solid transparent;
		border-left: 0.5rem solid #333;
		right: -0.5rem;
		top: 50%;
		transform: translateY(-50%);
	}

	.tooltip.right::after {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border-top: 0.5rem solid transparent;
		border-bottom: 0.5rem solid transparent;
		border-right: 0.5rem solid #333;
		left: -0.5rem;
		top: 50%;
		transform: translateY(-50%);
	}

	.tooltip.show {
		display: flex;
		flex-direction: column;
	}

	.tooltip.bottom {
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
	}

	.tooltip.left {
		top: 50%;
		right: 100%;
		transform: translateY(-50%);
	}

	.tooltip.right {
		top: 50%;
		left: 100%;
		transform: translateY(-50%);
	}

	.tooltip.top {
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
	}
</style>
