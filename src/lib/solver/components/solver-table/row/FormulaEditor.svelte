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
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--border);
		color: var(--text-primary);
		height: auto;
	}

	.row-input:focus + .operator-input {
		display: flex;
		flex-wrap: wrap;
	}

	.row-input:focus {
		border-radius: 0.5rem 0.5rem 0 0.5rem;
	}

	.operator-input {
		display: none;
		position: absolute;
		/*max-width: 100%;*/
		top: 100%;
		right: 0;
		z-index: 10;
		/*color: black;*/
		padding: 0.15rem;
		border-radius: 0 0 0.5rem 0.5rem;
		border: 1px solid var(--border);
		border-top: 0;
		background-color: var(--background);
	}

	.operator-input button {
		aspect-ratio: 1;
		padding: 0.225em 0.7em;
		font-size: 1em;
		font-family: monospace;
		margin: 0.15rem;
		background-color: var(--surface);
		color: var(--text-primary);
	}
</style>
