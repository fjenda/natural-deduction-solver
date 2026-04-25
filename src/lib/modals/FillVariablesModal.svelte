<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';
	import MathMLViewer from '../solver/components/MathMLViewer.svelte';
	import { theorems } from '../../stores/theoremsStore';
	import { theoremData } from '../../stores/solverStore';
	import { PremiseParser } from '../solver/parsers/PremiseParser';
	import { PrettySyntaxer } from '../solver/parsers/PrettySyntaxer';
	import { validateSubstitution } from '../solver/services/proofService';
	import { ProofHandler } from '../../prolog/queries/ProofHandler';
	import { Node } from '../syntax-checker/Node';
	import { ParseStrategy } from '../../types/ParseStrategy';
	import OperatorKeyboard from '../components/OperatorKeyboard.svelte';
	import ParseDiagnosticHint from '../solver/components/ParseDiagnosticHint.svelte';
	import type { ParseDiagnostic } from '../../types/ParseDiagnostic';

	interface FillVariablesModalProps extends CustomModalProps {
		onConfirm: () => void;
	}

	type ValidationState = {
		status: 'empty' | 'invalid' | 'dependency' | 'valid';
		message: string;
		prolog?: string;
		diagnostic?: ParseDiagnostic;
	};

	const { id, index, isOpen, close, title, onConfirm }: FillVariablesModalProps = $props();

	let activeIndex = $state(0);
	let previewValue = $state('');
	let previewStatus = $state<'idle' | 'loading' | 'error' | 'ready'>('idle');
	let previewMessage = $state('Fill all variables to generate a live preview.');

	const theorem = $derived($theorems[$theoremData.theoremId]);
	const theoremValue = $derived(theorem?.solution.whole.value ?? '');
	const theoremPfl = $derived(theorem?.solution.whole.tree?.toPrologFormat() ?? '');
	const activeVariable = $derived($theoremData.vars[activeIndex]);

	const validationStates = $derived.by(() => {
		return $theoremData.vars.map((v, i) =>
			validateVariableInput(v.varName, $theoremData.varInputs[i] ?? '')
		);
	});

	const activeValidation = $derived(validationStates[activeIndex]);
	const validCount = $derived(validationStates.filter((v) => v.status === 'valid').length);
	const canConfirm = $derived(
		$theoremData.vars.length > 0 && validationStates.length === $theoremData.vars.length
			? validationStates.every((v) => v.status === 'valid')
			: false
	);

	$effect(() => {
		if (!isOpen) return;

		theoremData.update((current) => {
			const normalized = current.vars.map((_, i) => current.varInputs[i] ?? '');
			const changed =
				normalized.length !== current.varInputs.length ||
				normalized.some((value, i) => value !== current.varInputs[i]);

			if (!changed) return current;
			return { ...current, varInputs: normalized };
		});
	});

	$effect(() => {
		const varsLength = $theoremData.vars.length;
		if (varsLength === 0) {
			activeIndex = 0;
			return;
		}

		if (activeIndex > varsLength - 1) {
			activeIndex = 0;
		}
	});

	$effect(() => {
		if (!isOpen) {
			previewValue = '';
			previewStatus = 'idle';
			previewMessage = 'Fill all variables to generate a live preview.';
			return;
		}

		const vars = $theoremData.vars;
		const states = validationStates;

		if (!vars.length) {
			previewValue = theoremValue;
			previewStatus = 'ready';
			previewMessage = 'No variables to substitute in this theorem.';
			return;
		}

		if (states.some((state) => state.status === 'invalid' || state.status === 'dependency')) {
			previewValue = theoremValue;
			previewStatus = 'error';
			previewMessage = 'Fix highlighted variables to unlock preview.';
			return;
		}

		if (states.some((state) => state.status === 'empty')) {
			previewValue = theoremValue;
			previewStatus = 'idle';
			previewMessage = 'Fill all variables to generate a live preview.';
			return;
		}

		if (!theoremPfl) {
			previewValue = theoremValue;
			previewStatus = 'error';
			previewMessage = 'Theorem preview is currently unavailable.';
			return;
		}

		const oldVars = vars.map((v) => v.prologString);
		const newVars = states.map((state) => state.prolog ?? '');
		previewStatus = 'loading';
		previewMessage = 'Computing preview...';

		let cancelled = false;
		const handle = setTimeout(async () => {
			try {
				const result = await ProofHandler.substitute(theoremPfl, oldVars, newVars);
				if (cancelled) return;

				if (!result) {
					previewValue = theoremValue;
					previewStatus = 'error';
					previewMessage = 'Preview failed. Please verify variable values.';
					return;
				}

				const parsed = Node.fromPrologFormat(result);
				previewValue = Node.generateString(parsed);
				previewStatus = 'ready';
				previewMessage = 'Live preview is ready.';
			} catch {
				if (cancelled) return;
				previewValue = theoremValue;
				previewStatus = 'error';
				previewMessage = 'Preview failed. Please verify variable values.';
			}
		}, 180);

		return () => {
			cancelled = true;
			clearTimeout(handle);
		};
	});

	function updateVariable(index: number, value: string) {
		theoremData.update((current) => {
			const varInputs = [...current.varInputs];
			varInputs[index] = value;
			return { ...current, varInputs };
		});
	}

	function statusLabel(state: ValidationState) {
		switch (state.status) {
			case 'valid':
				return 'Ready';
			case 'invalid':
				return 'Invalid';
			case 'dependency':
				return 'Dependency';
			default:
				return 'Pending';
		}
	}

	function validateVariableInput(varName: string, inputVal: string): ValidationState {
		const normalizedInput = inputVal.trim();
		if (!normalizedInput) {
			return { status: 'empty', message: 'Enter a formula for this variable.' };
		}

		const theoremFormula = PremiseParser.parsePremise(
			PrettySyntaxer.clean(varName),
			ParseStrategy.THEOREM
		);
		const formula = PremiseParser.parsePremise(PrettySyntaxer.clean(normalizedInput));
		if (!formula.tree) {
			return {
				status: 'invalid',
				message: 'Invalid formula syntax.',
				diagnostic: formula.diagnostic
			};
		}

		if (!theoremFormula.tree) {
			return { status: 'invalid', message: 'Variable placeholder is invalid.' };
		}

		const dependencies = theoremFormula.tree.getFreeVars();
		for (const dependency of dependencies) {
			if (!validateSubstitution(formula.tree, dependency)) {
				return {
					status: 'dependency',
					message: `Missing dependency for ${dependency}.`
				};
			}
		}

		return {
			status: 'valid',
			message: 'Looks good.',
			prolog: formula.tree.toPrologFormat()
		};
	}

	function handleActiveVariableInput(event: Event) {
		updateVariable(activeIndex, (event.currentTarget as HTMLInputElement).value);
	}

	function handleConfirm() {
		if (!canConfirm) return;
		onConfirm();
		close();
	}
</script>

<CustomModal
	{isOpen}
	{close}
	{title}
	{id}
	{index}
	contentWidth="min(70rem, calc(100vw - 2 * var(--spacing-lg)))"
	onPrimaryAction={handleConfirm}
	submitOnEnter={true}
>
	{#snippet body()}
		<div class="body">
			<div class="panel theorem-panel">
				<div class="panel-header">
					<p>Original theorem</p>
				</div>
				<MathMLViewer value={theoremValue} style="height: auto;" />
			</div>

			<div class="panel variable-panel">
				<div class="panel-header">
					<p>Variables</p>
					<span>{validCount} / {$theoremData.vars.length} ready</span>
				</div>

				<div class="chip-grid">
					{#each $theoremData.vars as v, i (i)}
						<button
							type="button"
							class="variable-chip"
							class:active={i === activeIndex}
							onclick={() => {
								activeIndex = i;
							}}
						>
							<span class="chip-formula"><MathMLViewer value={v.varName} /></span>
							<span
								class="chip-status"
								class:valid={validationStates[i]?.status === 'valid'}
								class:error={validationStates[i]?.status === 'invalid' ||
									validationStates[i]?.status === 'dependency'}
								>{statusLabel(validationStates[i])}</span
							>
						</button>
					{/each}
				</div>

				{#if activeVariable}
					<div class="editor-card">
						<div class="editor-header">
							<span>Editing</span>
							<MathMLViewer value={activeVariable.varName} />
						</div>
						<OperatorKeyboard inline compact>
							<input
								class="row-input"
								type="text"
								value={$theoremData.varInputs[activeIndex] ?? ''}
								placeholder={`Set ${activeVariable.varName}`}
								oninput={handleActiveVariableInput}
							/>
						</OperatorKeyboard>
						{#if activeValidation?.diagnostic && activeValidation.status === 'invalid'}
							<ParseDiagnosticHint diagnostic={activeValidation.diagnostic} variant="compact" />
						{:else}
							<p class="input-hint" class:error={activeValidation?.status !== 'valid'}>
								{activeValidation?.message}
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<div class="panel preview-panel">
				<div class="panel-header">
					<p>Result preview</p>
					<span class="preview-status" class:error={previewStatus === 'error'}>
						{previewMessage}
					</span>
				</div>
				<div class="preview-body" class:loading={previewStatus === 'loading'}>
					<MathMLViewer value={previewValue || theoremValue} />
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet buttons()}
		<div>
			<button
				class="button"
				onclick={() => {
					close();
				}}>Cancel</button
			>
			<button
				class="button primary"
				disabled={!canConfirm}
				onclick={handleConfirm}>Confirm</button
			>
		</div>
	{/snippet}
</CustomModal>

<style>
	.body {
		display: grid;
		grid-template-columns: minmax(0, 1.09fr) minmax(0, 1fr);
		grid-template-areas:
			'theorem variables'
			'preview variables';
		gap: var(--spacing-lg);
		width: min(100%, 68rem);
		min-width: 0;
	}

	.panel {
		padding: var(--spacing-lg);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-elevated);
		box-shadow: var(--shadow-sm);
		min-width: 0;
	}

	.theorem-panel {
		grid-area: theorem;
	}

	.variable-panel {
		grid-area: variables;
		display: grid;
		gap: var(--spacing-md);
		align-content: start;
	}

	.preview-panel {
		grid-area: preview;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
	}

	.panel-header p {
		font-weight: 600;
	}

	.panel-header span {
		font-size: 0.9rem;
		color: var(--text-secondary);
	}

	.chip-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
		gap: var(--spacing-sm);
	}

	.variable-chip {
		display: grid;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
		box-shadow: none;
	}

	.variable-chip.active {
		border-color: var(--accent);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.chip-formula :global(.mathml-viewer) {
		font-size: 1rem;
		padding: 0;
		justify-content: flex-start;
	}

	.chip-status {
		justify-self: start;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.15rem 0.45rem;
		border-radius: 99px;
		background: var(--button-bg);
		color: var(--text-secondary);
	}

	.chip-status.valid {
		color: #1e9f65;
		background: rgba(16, 185, 129, 0.18);
	}

	.chip-status.error {
		color: #dc2626;
		background: rgba(239, 68, 68, 0.15);
	}

	.editor-card {
		display: grid;
		gap: 0.65rem;
		padding: var(--spacing-md);
		min-width: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface);
	}

	.editor-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.editor-header :global(.mathml-viewer) {
		padding: 0;
		font-size: 1rem;
	}

	.row-input {
		width: 100%;
		height: 3.5rem;
		padding: 0 var(--spacing-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface-elevated);
		color: var(--text-primary);
		font-size: 1rem;
		outline: none;
		transition:
			border-color var(--transition-base),
			box-shadow var(--transition-base);
	}

	.row-input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.input-hint {
		font-size: 0.85rem;
		color: #1e9f65;
		line-height: 1.4;
	}

	.input-hint.error {
		color: #dc2626;
	}

	.preview-panel .preview-status.error {
		color: #dc2626;
	}

	.preview-body {
		border: 1px dashed var(--border);
		border-radius: var(--radius-md);
		padding: var(--spacing-sm);
		background: var(--surface);
		transition: all var(--transition-base);
	}

	.preview-body.loading {
		opacity: 0.75;
	}

	@media (max-width: 980px) {
		.body {
			grid-template-columns: 1fr;
			grid-template-areas:
				'theorem'
				'variables'
				'preview';
			width: 100%;
		}

		.panel {
			padding: var(--spacing-md);
		}
	}
</style>
