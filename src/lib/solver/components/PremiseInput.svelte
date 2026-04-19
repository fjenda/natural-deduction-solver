<script lang="ts">
	import { PrettySyntaxer } from '../parsers/PrettySyntaxer';
	import { PremiseParser } from '../parsers/PremiseParser';
	import MathMLViewer from './MathMLViewer.svelte';
	import OperatorKeyboard from '../../components/OperatorKeyboard.svelte';
	import ParseDiagnosticHint from './ParseDiagnosticHint.svelte';
	import type { ParseDiagnostic } from '../../../types/ParseDiagnostic';

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
	let diagnostic = $state<ParseDiagnostic | undefined>(undefined);

	/**
	 * Validates the formula in real-time.
	 * Updates the isValid state based on whether the formula parses correctly.
	 */
	const validateInput = () => {
		const trimmed = (value ?? '').trim();
		if (!trimmed) {
			isValid = true;
			diagnostic = undefined;
			return;
		}
		const parsed = PremiseParser.parsePremise(trimmed);
		isValid = parsed.tree !== null;
		diagnostic = parsed.diagnostic;
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
		<MathMLViewer {value} style="justify-content: flex-start;" />
	{:else}
		<div class="editor-stack">
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

			{#if (value ?? '').trim().length > 0 && diagnostic}
				<ParseDiagnosticHint {diagnostic} />
			{/if}
		</div>
	{/if}
</div>

<style>
	.editor-stack {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
	}

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
		border-color: var(--error);
		box-shadow: 0 0 0 3px var(--error-bg);
	}

	.wrapper.valid {
		border-color: var(--success);
	}

	.wrapper.valid:focus-within {
		border-color: var(--success);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px var(--success-bg);
	}

	.wrapper.error:focus-within {
		border-color: var(--error);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px var(--error-bg);
	}

	.wrapper {
		width: 100%;
		min-height: 3.5rem;
		border-radius: var(--radius-md);
		background: var(--surface);
		border: 1px solid var(--border);
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: visible;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
		padding: 0;
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
