<script lang="ts">
	import { PrettySyntaxer } from '../../../parsers/PrettySyntaxer';
	import { PremiseParser } from '../../../parsers/PremiseParser';
	import OperatorKeyboard from '../../../../components/OperatorKeyboard.svelte';

	interface FormulaEditorProps {
		formula: string;
		onEnter?: () => void;
		/** Callback fired when validation state changes */
		onValidationChange?: (valid: boolean) => void;
	}

	let { formula = $bindable(), onEnter, onValidationChange }: FormulaEditorProps = $props();

	let isValid = $state(true);
	let hasContent = $state(false);

	/**
	 * Validates the formula in real-time using PremiseParser.
	 * Updates the validation state and notifies the parent.
	 */
	const validateFormula = () => {
		const trimmed = formula.trim();
		hasContent = trimmed.length > 0;

		if (!hasContent) {
			isValid = true;
			onValidationChange?.(true);
			return;
		}

		const parsed = PremiseParser.parsePremise(trimmed);
		isValid = parsed.tree !== null;
		onValidationChange?.(isValid);
	};

	/**
	 * Cleans the formula input on change and re-validates.
	 */
	const handleInputChange = () => {
		formula = PrettySyntaxer.clean(formula);
		validateFormula();
	};

	/**
	 * Handles keydown events in the formula input.
	 * Triggers save on Enter key.
	 * @param event - the keyboard event
	 */
	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && onEnter) {
			event.preventDefault();
			onEnter();
		}
	};
</script>

<OperatorKeyboard>
	<input
		id="row-input"
		class="row-input"
		class:valid={hasContent && isValid}
		class:invalid={hasContent && !isValid}
		type="text"
		bind:value={formula}
		oninput={validateFormula}
		onchange={handleInputChange}
		onkeydown={handleKeydown}
		placeholder="Enter formula..."
	/>
</OperatorKeyboard>

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

	.row-input.valid {
		border-color: var(--success);
	}

	.row-input.valid:focus {
		border-color: var(--success);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(34, 197, 94, 0.1);
	}

	.row-input.invalid {
		border-color: var(--error);
	}

	.row-input.invalid:focus {
		border-color: var(--error);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(239, 68, 68, 0.1);
	}
</style>
