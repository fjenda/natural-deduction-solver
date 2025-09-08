<script lang="ts">
	import { PrettySyntaxer } from '../parsers/PrettySyntaxer';
	import MathMLViewer from './MathMLViewer.svelte';
	import { logicMode } from '../../../stores/solverStore';
	import { ParseStrategy } from '../../../types/ParseStrategy';

	export let placeholder: string;
	export let value: string | null = '';
	export let error: boolean = false;
	export let index: number;
	export let disabled: boolean = false;
	export let onChange: (value: string, index: number) => void;
	let inputElement: HTMLInputElement;
	let show: boolean = false;

	let hint: string =
		'' +
		'Constants - [a-z]()\n' +
		'Variables - [a-z]\n' +
		'Functions - [a-z](par1, par2)\n' +
		'Predicates - [A-Z]()\n';

	$: operators =
		$logicMode === ParseStrategy.PROPOSITIONAL
			? ['¬', '∧', '∨', '⊃', '≡']
			: ['¬', '∧', '∨', '⊃', '≡', '∀', '∃'];

	function insertOperator(operator: string) {
		// insert the operator at the current cursor position
		const cursorPosition = inputElement.selectionStart;

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

<div class="wrapper" on:click={toggleInput} on:focusout={toggleInput} class:error>
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
			on:change={() => {
				value = PrettySyntaxer.clean(value ?? '');
				onChange(value ?? '', index);
			}}
			tabindex={index + 1}
		/>
		<div class="operator-input">
			{#each operators as operator (operator)}
				<button on:mousedown|preventDefault={() => insertOperator(operator)}>{operator}</button>
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
		border-color: #ff0000;
	}

	.operator-input {
		display: none;
		position: absolute;
		top: 3.5rem;
		right: 0;
		z-index: 10;
		color: black;
		padding: 0.25rem;
		border-radius: 0 0 0.5rem 0.5rem;
		border: 1px solid var(--dark-border-color);
		background-color: var(--dark-bg-color);
	}

	.operator-input button {
		aspect-ratio: 1;
		padding: 0.45em 0.8em;
		font-size: 1.35em;
		font-family: monospace;
		margin: 0.15rem;
		background-color: var(--dark-element-color);
		color: var(--dark-text-color);
	}

	.operator-input button:hover {
		outline: none;
		border: 1px solid var(--light-border-color);
	}

	.wrapper {
		width: 100%;
		height: 3.5rem;
		border-radius: 0.5rem;
		background: var(--dark-bg-color);
		border: 1px solid var(--dark-border-color);
		position: relative;
		display: flex;
	}

	.wrapper:focus-within {
		border: 0;
	}

	.wrapper:focus-within .operator-input {
		display: flex;
	}

	.wrapper:focus-within input {
		border-radius: 0.5rem 0.5rem 0 0.5rem;
	}

	input[disabled] {
		color: inherit;
	}

	@media (prefers-color-scheme: light) {
		.operator-input button {
			border: 1px solid var(--light-border-color);
			background: var(--light-element-color);
			color: var(--light-text-color);
		}

		.operator-input button:hover {
			border: 1px solid var(--dark-border-color);
		}

		.operator-input {
			background-color: var(--light-bg-color);
			border: 1px solid var(--light-border-color);
		}

		.wrapper {
			background: #ffffff;
			border: 1px solid var(--light-border-color);
		}
	}

	@media screen and (max-width: 950px) {
		.operator-input {
			padding: 0.15rem;
		}

		.operator-input button {
			padding: 0.35em 0.62em;
			font-size: 1.15em;
			border-radius: 0.35rem;
		}
	}
</style>
