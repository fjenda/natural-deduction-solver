<script lang="ts">
	interface ButtonProps {
		onClick: () => void;
		text?: string;
		disabled?: boolean;
		hoverBorderColor?: string;
		style?: string;
	}

	let {
		text = 'Click Me',
		onClick,
		disabled = false,
		style = '',
		hoverBorderColor = '#00ff00'
	}: ButtonProps = $props();
</script>

<button
	class="btn"
	style={`--hover-color: ${hoverBorderColor}; ${style}`}
	onclick={onClick}
	{disabled}
>
	{text}
</button>

<style lang="scss">
	.btn {
		width: 100%;
		height: 3.5rem;
		padding: 0 var(--spacing-md);
		border-radius: var(--radius-md);
		background: var(--button-bg);
		border: 1px solid var(--border);
		color: var(--text-primary);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);

		&:focus[disabled],
		&:hover[disabled] {
			cursor: not-allowed;
		}

		&:focus {
			outline: none;
			box-shadow:
				0 0 0 3px var(--surface),
				0 0 0 5px var(--accent);
		}

		&:hover:not(:disabled) {
			color: var(--accent);
			border-color: var(--accent);
			background: var(--button-hover);
			transform: translateY(-2px);
			box-shadow: var(--shadow-md);
		}

		&:active:not(:disabled) {
			transform: translateY(0);
			box-shadow: var(--shadow-sm);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	@media screen and (max-width: 950px) {
		.btn {
			font-size: 0.9rem;
			height: auto;
			padding: var(--spacing-sm) var(--spacing-md);
		}
	}
</style>
