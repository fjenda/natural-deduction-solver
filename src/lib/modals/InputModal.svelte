<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';
	import OperatorKeyboard from '../components/OperatorKeyboard.svelte';
	import ParseDiagnosticHint from '../solver/components/ParseDiagnosticHint.svelte';
	import { PremiseParser } from '../solver/parsers/PremiseParser';
	import type { ParseDiagnostic } from '../../types/ParseDiagnostic';

	type ConnectivePosition = 'before' | 'after';
	type InputMode = 'formula' | 'number' | 'text';

	interface InputModalProps extends CustomModalProps {
		content: string;
		placeholder: string;
		inputMode?: InputMode;
		showConnectivePosition?: boolean;
		defaultConnectivePosition?: ConnectivePosition;
		onConfirm: (modalInput: HTMLInputElement, connectivePosition?: ConnectivePosition) => void;
	}

	const {
		id,
		index,
		isOpen,
		close,
		title,
		content,
		placeholder,
		inputMode = 'text',
		showConnectivePosition = false,
		defaultConnectivePosition = 'after',
		onConfirm
	}: InputModalProps = $props();

	let connectivePosition = $state<ConnectivePosition>(defaultConnectivePosition);
	let modalInput = $state<HTMLInputElement | undefined>(undefined);
	let value = $state('');
	let diagnostic = $state<ParseDiagnostic | undefined>(undefined);
	let isValid = $state(true);

	const usesFormulaInput = $derived(inputMode === 'formula');
	const inputLabel = $derived(
		inputMode === 'number' ? 'Row' : usesFormulaInput ? 'Formula' : 'Input'
	);
	const canConfirm = $derived.by(() => {
		const trimmed = value.trim();
		if (!trimmed) return false;
		if (inputMode === 'formula') return isValid;
		if (inputMode === 'number') return /^\d+$/.test(trimmed);
		return true;
	});

	function validateInput(currentValue: string) {
		if (inputMode !== 'formula') {
			isValid = true;
			diagnostic = undefined;
			return;
		}

		const trimmed = currentValue.trim();
		if (!trimmed) {
			isValid = true;
			diagnostic = undefined;
			return;
		}

		const parsed = PremiseParser.parsePremise(trimmed);
		isValid = parsed.tree !== null;
		diagnostic = parsed.diagnostic;
	}
</script>

<CustomModal
	{isOpen}
	{close}
	{title}
	{id}
	{index}
	contentWidth="min(35rem, calc(100vw - 2 * var(--spacing-lg)))"
>
	{#snippet body()}
		<div class="modal-form">
			<p class="description">{content}</p>
			<label class="input-label" for="modal-input">{inputLabel}</label>
			<div class="input-stack">
				{#if usesFormulaInput}
					<OperatorKeyboard inline compact>
						<input
							id="modal-input"
							type="text"
							{placeholder}
							name="modal-input"
							class:invalid={!isValid && value.trim().length > 0}
							bind:this={modalInput}
							bind:value
							oninput={() => validateInput(value)}
						/>
					</OperatorKeyboard>
					{#if diagnostic && value.trim().length > 0}
						<ParseDiagnosticHint {diagnostic} variant="compact" />
					{/if}
				{:else}
					<input
						id="modal-input"
						type={inputMode === 'number' ? 'number' : 'text'}
						{placeholder}
						name="modal-input"
						bind:this={modalInput}
						bind:value
					/>
				{/if}
			</div>
			{#if showConnectivePosition}
				<fieldset class="position-group">
					<legend class="position-title">Where should it be placed?</legend>
					<label class="position-option" for="position-before">
						<input
							id="position-before"
							type="radio"
							name="connective-position"
							value="before"
							bind:group={connectivePosition}
						/>
						<span>Before connective</span>
					</label>
					<label class="position-option" for="position-after">
						<input
							id="position-after"
							type="radio"
							name="connective-position"
							value="after"
							bind:group={connectivePosition}
						/>
						<span>After connective</span>
					</label>
				</fieldset>
			{/if}
		</div>
	{/snippet}

	{#snippet buttons()}
		<div class="actions" slot="buttons">
			<button class="button" onclick={close}>Cancel</button>
			<button
				class="button primary"
				disabled={!canConfirm}
				onclick={() => {
					if (!modalInput) return;
					onConfirm(modalInput, showConnectivePosition ? connectivePosition : undefined);
					close();
				}}>Confirm</button
			>
		</div>
	{/snippet}
</CustomModal>

<style>
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		width: 100%;
		min-width: 0;
	}

	.input-stack {
		display: grid;
		gap: 0.65rem;
		min-width: 0;
	}

	.description {
		color: var(--text-secondary);
		font-size: 0.95rem;
		line-height: 1.6;
		padding: var(--spacing-md);
		background: var(--surface-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
	}

	.input-label {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	input[name='modal-input'] {
		width: 100%;
		height: 3.5rem;
		font-size: 1rem;
		font-family: monospace;
		padding: 0 var(--spacing-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface-elevated);
		color: var(--text-primary);
		outline: none;
		transition:
			border-color var(--transition-base),
			box-shadow var(--transition-base);
	}

	input[name='modal-input']:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	input[name='modal-input'].invalid {
		border-color: var(--warning);
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
	}

	.position-group {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		display: grid;
		gap: var(--spacing-md);
		background: var(--surface-elevated);
		transition: all var(--transition-base);
	}

	.position-group:hover {
		border-color: var(--accent);
		box-shadow: var(--shadow-sm);
	}

	.position-title {
		padding: 0 var(--spacing-sm);
		font-size: 0.9rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.position-option {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.position-option:hover {
		background: var(--button-hover);
		border-color: var(--accent);
	}

	.position-option input[type='radio'] {
		width: 1.125rem;
		height: 1.125rem;
		margin: 0;
		cursor: pointer;
		accent-color: var(--accent);
	}

	.position-option span {
		color: var(--text-primary);
	}

	.actions {
		display: flex;
		gap: var(--spacing-md);
		width: 100%;
	}

	.actions button {
		font-size: 1rem;
		padding: var(--spacing-md) var(--spacing-lg);
	}

	@media (max-width: 640px) {
		.modal-form {
			width: 100%;
		}
	}
</style>
