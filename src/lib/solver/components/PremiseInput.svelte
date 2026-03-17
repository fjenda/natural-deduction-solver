<script lang="ts">
	import { PrettySyntaxer } from '../parsers/PrettySyntaxer';
	import MathMLViewer from './MathMLViewer.svelte';
	import { logicMode } from '../../../stores/solverStore';
	import { ParseStrategy } from '../../../types/ParseStrategy';

	interface PremiseInputProps {
		placeholder: string;
		value?: string;
		error?: boolean;
		index: number;
		disabled?: boolean;
		onChange: (value: string, index: number) => void;
	}

	let {
		placeholder,
		value = $bindable(''),
		error = false,
		index,
		disabled = false,
		onChange
	}: PremiseInputProps = $props();

	let inputElement: HTMLInputElement | undefined = $state();
	let show: boolean = $state(false);

	let hint: string =
		'' +
		'Constants - [a-z]()\n' +
		'Variables - [a-z]\n' +
		'Functions - [a-z](par1, par2)\n' +
		'Predicates - [A-Z]()\n';

	const operators = $derived(
		$logicMode === ParseStrategy.PROPOSITIONAL
			? ['¬', '∧', '∨', '⊃', '≡']
			: ['¬', '∧', '∨', '⊃', '≡', '∀', '∃']
	);

	function insertOperator(e: Event, operator: string) {
		e.preventDefault();

		// insert the operator at the current cursor position
		const cursorPosition = inputElement?.selectionStart;

		// get the text before and after the cursor
		let textBefore = value?.slice(0, cursorPosition!);
		let textAfter = value?.slice(cursorPosition!);

		// replace undefined with empty string
		if (!textBefore) textBefore = '';
		if (!textAfter) textAfter = '';

		// set the new value
		value = textBefore + operator + textAfter;

		// keep the cursor at the same position
		const newPosition = cursorPosition! + 1;
		setTimeout(() => {
			if (!inputElement) return;

			if (document.activeElement !== inputElement) inputElement.focus();

			inputElement.setSelectionRange(newPosition, newPosition);
		}, 0);
	}

	function toggleInput(event: FocusEvent | MouseEvent) {
		show = !show;

		setTimeout(() => {
			if (inputElement) {
				// if already focused, don't move the cursor
				if (document.activeElement === inputElement) {
					return;
				}

				inputElement.focus();

				// set the cursor position based on the clicked position
				if (event && event.target instanceof HTMLInputElement) {
					const clickPosition = event.target.selectionStart;
					inputElement.setSelectionRange(clickPosition, clickPosition);
				}
			}
		}, 10);
	}
</script>

<div class="wrapper" onclick={toggleInput} onfocusout={toggleInput} class:error>
	{#if !show}
		<MathMLViewer {value} />
	{:else}
		<input
			type="text"
			{placeholder}
			name="formula-{index}"
			{disabled}
			bind:this={inputElement}
			bind:value
			onchange={() => {
				value = PrettySyntaxer.clean(value ?? '');
				onChange(value ?? '', index);
			}}
			tabindex={index + 1}
		/>
		<div class="operator-input">
			{#each operators as operator (operator)}
				<button onmousedown={(e) => insertOperator(e, operator)}>{operator}</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	input {
		height: 3.5rem;
		text-decoration: none;
	}

	.wrapper.error {
		border-color: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}

	.operator-input {
		display: none;
		position: absolute;
		top: 3.5rem;
		right: 0;
		z-index: 10;
		padding: var(--spacing-sm);
		border-radius: 0 0 var(--radius-md) var(--radius-md);
		border: 1px solid var(--border);
		border-top: none;
		background-color: var(--background);
		gap: var(--spacing-xs);
		box-shadow: var(--shadow-lg);
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

	.operator-input button {
		aspect-ratio: 1;
		padding: var(--spacing-sm);
		font-size: 1.35em;
		font-family: monospace;
		background-color: var(--button-bg);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
	}

	.operator-input button:hover {
		background-color: var(--button-hover);
		border-color: var(--accent);
		color: var(--accent);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.operator-input button:active {
		transform: translateY(0);
	}

	.wrapper {
		width: 100%;
		height: 3.5rem;
		border-radius: var(--radius-md);
		background: var(--surface);
		border: 1px solid var(--border);
		position: relative;
		display: flex;
		overflow: visible;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
	}

	/*.wrapper:hover:not(:focus-within) {*/
	/*	box-shadow: var(--shadow-md);*/
	/*}*/

	.wrapper:focus-within {
		border-color: var(--accent);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.wrapper:focus-within .operator-input {
		display: flex;
	}

	.wrapper:focus-within input {
		border-radius: var(--radius-md) var(--radius-md) 0 0;
	}

	input[disabled] {
		color: inherit;
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media screen and (max-width: 950px) {
		.operator-input {
			padding: var(--spacing-xs);
		}

		.operator-input button {
			padding: var(--spacing-xs);
			font-size: 1.15em;
			border-radius: var(--radius-sm);
		}
	}
</style>
