<script lang="ts">
	import { PrettySyntaxer } from '../../../parsers/PrettySyntaxer';

	interface FormulaEditorProps {
		formula: string;
		operators: string[];
	}

	let { formula = $bindable(), operators }: FormulaEditorProps = $props();

	let formulaInput: HTMLInputElement | null = $state(null);

	const handleInputChange = () => {
		formula = PrettySyntaxer.clean(formula);
	};

	const insertOperator = (e: Event, operator: string) => {
		e.preventDefault();
		if (!formulaInput) return;

		const cursorPosition = formulaInput.selectionStart ?? 0;
		const textBefore = formula.slice(0, cursorPosition);
		const textAfter = formula.slice(cursorPosition);

		formula = textBefore + operator + textAfter;

		const newPosition = cursorPosition + 1;
		setTimeout(() => {
			formulaInput?.focus();
			formulaInput?.setSelectionRange(newPosition, newPosition);
		}, 0);
	};
</script>

<input
	id="row-input"
	class="row-input"
	type="text"
	bind:value={formula}
	bind:this={formulaInput}
	onchange={handleInputChange}
/>
<div class="operator-input">
	{#each operators as operator (operator)}
		<button onmousedown={(e) => insertOperator(e, operator)}>{operator}</button>
	{/each}
</div>

<style>
	.row-input {
		width: 100%;
		font-size: 1em;
		padding: var(--spacing-sm);
		border: 1px solid var(--border);
		color: var(--text-primary);
		background: var(--surface);
		height: auto;
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
	}

	.row-input:focus {
		border-color: var(--accent);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(37, 99, 235, 0.1);
		border-radius: var(--radius-md) var(--radius-md) 0 0;
	}

	.row-input:focus + .operator-input {
		display: flex;
		flex-wrap: wrap;
		animation: slideDown var(--transition-fast) ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.operator-input {
		display: none;
		position: absolute;
		top: 100%;
		right: 0;
		z-index: 100;
		padding: var(--spacing-sm);
		border-radius: 0 0 var(--radius-md) var(--radius-md);
		border: 1px solid var(--border);
		border-top: none;
		background-color: var(--background);
		gap: var(--spacing-xs);
		box-shadow: var(--shadow-lg);
	}

	.operator-input button {
		padding: var(--spacing-sm);
		font-size: 1em;
		font-family: monospace;
		background-color: var(--button-bg);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.operator-input button:hover {
		background-color: var(--button-hover);
		border-color: var(--accent);
		color: var(--accent);
		transform: translateY(-1px);
	}

	.operator-input button:active {
		transform: translateY(0);
	}
</style>
