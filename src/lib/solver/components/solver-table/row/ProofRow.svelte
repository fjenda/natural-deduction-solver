<script lang="ts">
	import { type AppliedRule, appliedRuleToString } from '../../../../../types/AppliedRule';
	import {
		highlightedRows,
		logicMode,
		selectedRows,
		solverContent
	} from '../../../../../stores/solverStore';
	import { NDRule } from '../../../../rules/DeductionRule';
	import { PrettySyntaxer } from '../../../parsers/PrettySyntaxer';
	import { ParseStrategy } from '../../../../../types/ParseStrategy';
	import { canDeleteRow } from '../../../services/proofService';
	import { showToast } from '../../../../utils/showToast';
	import FormulaEditor from './FormulaEditor.svelte';
	import RuleEditor from './RuleEditor.svelte';
	import RowActions from './RowActions.svelte';

	interface ProofRowProps {
		line: number;
		formula: string;
		rule: AppliedRule;
		premise: boolean;
		editable: boolean;
		onSave: (content: string, rule: string) => void;
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

	let ruleText = $state(appliedRuleToString(rule));
	let removable = $state(false);

	const highlighted = $derived($selectedRows.includes(line));
	const usable = $derived($highlightedRows.includes(line));
	const invalid = $derived(rule.rule === NDRule.UNKNOWN && !editable);

	const mathmlFormula = $derived(PrettySyntaxer.toMathML(formula));

	const operators = $derived(
		$logicMode === ParseStrategy.PROPOSITIONAL
			? ['¬', '∧', '∨', '⊃', '≡']
			: ['¬', '∧', '∨', '⊃', '≡', '∀', '∃']
	);

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

<a class="row" class:highlighted class:usable class:invalid onclick={selectRow} role="button">
	<div class="formula-container">
		<div class="line-number">{line}</div>
		<div class="line-content" class:scrollable={!editable}>
			{#if editable}
				<FormulaEditor bind:formula {operators} />
			{:else}
				{@html mathmlFormula}
			{/if}
		</div>
		<div class="used-rule">
			<RuleEditor bind:ruleText {rule} {editable} />
		</div>
	</div>

	<div class="separator">&nbsp;</div>

	<RowActions {editable} {premise} {removable} {formula} {ruleText} {onSave} {onEdit} {onDelete} />
</a>

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
		background: var(--button-hover);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
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

	.line-content.scrollable {
		overflow-x: auto;
		white-space: nowrap;
		padding-bottom: 4px;
	}

	.separator {
		width: 1px;
		border-right: 1px solid var(--border);
	}

	@media screen and (max-width: 1150px) {
		.used-rule,
		.line-number,
		.line-content {
			font-size: 0.8em;
		}
	}

	@media screen and (max-width: 950px) {
		.row {
			flex-direction: column;
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
