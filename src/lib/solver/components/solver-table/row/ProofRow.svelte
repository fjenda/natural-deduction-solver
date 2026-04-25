<script lang="ts">
	import { cloneAppliedRule, type AppliedRule } from '../../../../../types/AppliedRule';
	import { highlightedRows, selectedRows, solverContent } from '../../../../../stores/solverStore';
	import { NDRule } from '../../../../rules/DeductionRule';
	import { canDeleteRow } from '../../../services/proofService';
	import { showToast } from '../../../../utils/showToast';
	import FormulaEditor from './FormulaEditor.svelte';
	import MathMLViewer from '../../MathMLViewer.svelte';
	import RuleEditor from './RuleEditor.svelte';
	import RowActions from './RowActions.svelte';

	interface ProofRowProps {
		line: number;
		formula: string;
		rule: AppliedRule;
		premise: boolean;
		editable: boolean;
		onSave: (content: string, rule: AppliedRule) => void;
		onEdit: () => void;
		onDelete: () => void;
	}

	let {
		line,
		formula,
		rule,
		premise = false,
		editable = false,
		onSave,
		onEdit,
		onDelete
	}: ProofRowProps = $props();

	let ruleDraft = $state(cloneAppliedRule(rule));
	let removable = $state(false);
	let formulaValid = $state(true);
	let ruleValid = $state(true);

	/**
	 * Handles Enter key press in the formula editor.
	 * Triggers the save action with the current formula and rule text.
	 */
	const handleSaveFromKeyboard = () => {
		if (!formulaValid || !ruleValid) return;
		onSave(formula, ruleDraft);
	};

	const highlighted = $derived($selectedRows.includes(line));
	const usable = $derived($highlightedRows.includes(line));
	const invalid = $derived(rule.rule === NDRule.UNKNOWN && !editable);

	const selectRow = () => {
		if (editable) return;

		if (invalid) {
			showToast(
				'Cannot highlight invalid row.\n Make sure the formula and rule are valid.',
				'error'
			);
			return;
		}

		if ($selectedRows.length === 2 && !highlighted) return;

		selectedRows.update((rows) =>
			rows.includes(line) ? rows.filter((r) => r !== line) : [...rows, line]
		);
	};

	const handleRowKeydown = (event: KeyboardEvent) => {
		if (editable) return;

		const target = event.target as HTMLElement | null;
		if (target?.closest('input, textarea, select, button, [contenteditable="true"]')) {
			return;
		}

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			selectRow();
		}
	};

	$effect(() => {
		ruleDraft = cloneAppliedRule(rule);
		formulaValid = true;
		ruleValid = true;
	});

	$effect(() => {
		if (premise) {
			removable = false;
		} else {
			canDeleteRow(line, $solverContent.proof).then((r) => {
				removable = r;
			});
		}
	});
</script>

<div
	class="row"
	class:highlighted
	class:usable
	class:invalid
	class:editing={editable}
	onclick={selectRow}
	onkeydown={handleRowKeydown}
	role="button"
	tabindex="0"
>
	{#if editable}
		<div class="edit-layout">
			<div class="edit-main">
				<div class="line-number">{line}</div>
				<div class="line-content editing">
					<FormulaEditor
						bind:formula
						onEnter={handleSaveFromKeyboard}
						onValidationChange={(valid) => {
							formulaValid = valid;
						}}
					/>
				</div>
			</div>

			<div class="edit-footer">
				<div class="used-rule editing">
					<RuleEditor
						bind:ruleDraft
						{editable}
						onEnter={handleSaveFromKeyboard}
						onValidationChange={(valid) => {
							ruleValid = valid;
						}}
					/>
				</div>
				<div class="edit-actions">
					<RowActions
						{editable}
						{premise}
						{removable}
						{formula}
						{ruleDraft}
						canSave={formulaValid && ruleValid}
						{onSave}
						{onEdit}
						{onDelete}
					/>
				</div>
			</div>
		</div>
	{:else}
		<div class="formula-container">
			<div class="line-number">{line}</div>
			<div class="line-content" class:scrollable={!editable}>
				<MathMLViewer value={formula} style="justify-content: flex-start; padding: 0" />
			</div>
			<div class="used-rule">
				<RuleEditor bind:ruleDraft {editable} onEnter={handleSaveFromKeyboard} />
			</div>
		</div>

		<div class="separator">&nbsp;</div>

		<RowActions
			{editable}
			{premise}
			{removable}
			{formula}
			{ruleDraft}
			canSave={true}
			{onSave}
			{onEdit}
			{onDelete}
		/>
	{/if}
</div>

<style>
	.row {
		display: flex;
		gap: var(--spacing-md);
		justify-content: center;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--surface);
		font-family: monospace;
		font-size: 1.3em;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
		position: relative;
	}

	.row:hover {
		background: var(--surface-elevated);
		box-shadow: var(--shadow-md);
		/*transform: translateY(-1px);*/
	}

	.row.highlighted.usable,
	.row.highlighted {
		border-color: var(--success);
		box-shadow:
			0 0 0 2px var(--success-bg),
			var(--shadow-md);
		background: var(--surface);
	}

	.row.usable {
		border-color: var(--warning);
		box-shadow:
			0 0 0 2px var(--warning-bg),
			var(--shadow-md);
	}

	.row.invalid {
		border-color: var(--error);
		box-shadow:
			0 0 0 2px var(--error-bg),
			var(--shadow-md);
	}

	.formula-container {
		display: flex;
		align-items: center;
		flex-grow: 1;
		min-width: 0;
	}

	.edit-main {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		width: 100%;
		min-width: 0;
	}

	.edit-layout {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		width: 100%;
	}

	.edit-footer {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--spacing-md);
		width: 100%;
		padding-left: calc(2.5rem + var(--spacing-md));
	}

	.edit-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		align-self: center;
	}

	.used-rule,
	.line-number {
		text-align: center;
		padding-inline: var(--spacing-md);
	}

	.used-rule {
		width: auto;
		flex-grow: 0;
		flex-shrink: 1;
	}

	.used-rule.editing {
		flex: 1;
		padding-inline: 0;
		min-width: 0;
	}

	.line-number {
		width: 2.5rem;
		font-weight: 600;
		font-size: 0.85em;
		color: var(--text-secondary);
		user-select: none;
	}

	.line-content {
		position: relative;
		text-align: left;
		flex-grow: 2;
		min-width: 0;
	}

	.line-content.editing {
		flex: 1;
	}

	.line-content.scrollable {
		overflow-x: auto;
		white-space: nowrap;
		padding-bottom: 4px;
	}

	.separator {
		width: 1px;
		border-right: 1px solid var(--border);
	}

	.row.editing {
		flex-direction: column;
		align-items: stretch;
	}

	@media screen and (max-width: 1150px) {
		.used-rule,
		.line-number,
		.line-content {
			font-size: 0.8em;
		}
	}

	@media screen and (max-width: 1180px) {
		.edit-footer {
			padding-left: 0;
			grid-template-columns: 1fr;
		}

		.edit-actions {
			width: 100%;
			justify-content: flex-end;
		}
	}

	@media screen and (max-width: 950px) {
		.row {
			flex-direction: column;
			align-items: stretch;
		}

		.edit-main {
			align-items: stretch;
		}

		.separator {
			width: 100%;
			height: 1px;
			border-right: none;
			border-bottom: 1px solid var(--border);
		}
	}
</style>
