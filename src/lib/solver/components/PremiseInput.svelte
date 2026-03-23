<script lang="ts">
	import { PrettySyntaxer } from '../parsers/PrettySyntaxer';
	import { PremiseParser } from '../parsers/PremiseParser';
	import MathMLViewer from './MathMLViewer.svelte';
	import OperatorKeyboard from '../../components/OperatorKeyboard.svelte';

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
	let isValid: boolean = $state(true);

	/**
	 * Validates the formula in real-time.
	 * Updates the isValid state based on whether the formula parses correctly.
	 */
	const validateInput = () => {
		const trimmed = (value ?? '').trim();
		if (!trimmed) {
			isValid = true;
			return;
		}
		const parsed = PremiseParser.parsePremise(trimmed);
		isValid = parsed.tree !== null;
	};

	/**
	 * Toggles between showing the MathML preview and the text input.
	 * @param event - the focus or click event
	 */
	function toggleInput(event: FocusEvent | MouseEvent) {
		show = !show;

		setTimeout(() => {
			if (inputElement) {
				if (document.activeElement === inputElement) {
					return;
				}

				inputElement.focus();

				if (event && event.target instanceof HTMLInputElement) {
					const clickPosition = event.target.selectionStart;
					inputElement.setSelectionRange(clickPosition, clickPosition);
				}
			}
		}, 10);
	}
</script>

<div
	class="wrapper"
	onclick={toggleInput}
	onfocusout={toggleInput}
	class:error={error || (!isValid && show)}
	class:valid={isValid && show && (value ?? '').trim().length > 0}
>
	{#if !show}
		<MathMLViewer {value} />
	{:else}
		<OperatorKeyboard>
			<input
				type="text"
				{placeholder}
				name="formula-{index}"
				{disabled}
				bind:this={inputElement}
				bind:value
				oninput={validateInput}
				onchange={() => {
					value = PrettySyntaxer.clean(value ?? '');
					onChange(value ?? '', index);
				}}
				tabindex={index + 1}
			/>
		</OperatorKeyboard>
	{/if}
</div>

<style>
	input {
		height: 3.5rem;
		text-decoration: none;
		width: 100%;
		padding: 0 var(--spacing-sm);
		border: none;
		background: transparent;
		color: var(--text-primary);
		font-size: 1rem;
		outline: none;
	}

	.wrapper.error {
		border-color: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}

	.wrapper.valid {
		border-color: var(--success);
	}

	.wrapper.valid:focus-within {
		border-color: var(--success);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(34, 197, 94, 0.1);
	}

	.wrapper.error:focus-within {
		border-color: #ef4444;
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(239, 68, 68, 0.1);
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

	.wrapper:focus-within {
		border-color: var(--accent);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	input[disabled] {
		color: inherit;
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
