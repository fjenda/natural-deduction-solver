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

		&:focus[disabled],
		&:hover[disabled] {
			cursor: not-allowed;
		}

		&:focus,
		&:hover {
			color: var(--hover-color);
			border: 1px solid var(--hover-color);
			outline: none;
		}
	}

	@media screen and (max-width: 950px) {
		.btn {
			font-size: 0.9rem;
			height: auto;
		}
	}
</style>
