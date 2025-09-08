<script lang="ts">
	import { PrettySyntaxer } from '../../parsers/PrettySyntaxer';
	import {
		highlightedRows,
		logicMode,
		selectedRows,
		solverContent
	} from '../../../../stores/solverStore';
	import { type AppliedRule, appliedRuleToString } from '../../../../types/AppliedRule';
	import { NDRule } from '../../../rules/DeductionRule';
	import { ParseStrategy } from '../../../../types/ParseStrategy';
	import { showToast } from '../../../utils/showToast';
	import { canDeleteRow } from '../../services/proofService';

	interface TableRowProps {
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
	}: TableRowProps = $props();

	let formulaInput: HTMLInputElement | null = $state(null);

	const handleInputChange = (s: string): string => {
		return PrettySyntaxer.clean(s);
	};

	const selectRow = () => {
		// if the row is editable, do not highlight
		if (editable) return;

		// if the row is invalid, do not highlight
		if (invalid) {
			showToast(
				'Cannot highlight invalid row.\n Make sure the formula and rule are valid.',
				'error'
			);
			return;
		}

		// if we have 2 rows selected already, and we are trying to select a third
		// do not highlight
		if ($selectedRows.length === 2 && !highlighted) return;

		// update the selected rows
		selectedRows.update((rows) => {
			if (rows.includes(line)) {
				return rows.filter((r) => r !== line);
			} else {
				return [...rows, line];
			}
		});
	};

	const operators = $derived(
		$logicMode === ParseStrategy.PROPOSITIONAL
			? ['¬', '∧', '∨', '⊃', '≡']
			: ['¬', '∧', '∨', '⊃', '≡', '∀', '∃']
	);

	function insertOperator(e: Event, operator: string) {
		e.preventDefault();

		// insert the operator at the current cursor position
		const cursorPosition = formulaInput.selectionStart;

		// get the text before and after the cursor
		let textBefore = formula?.slice(0, cursorPosition!);
		let textAfter = formula?.slice(cursorPosition!);

		// replace undefined with empty string
		if (!textBefore) textBefore = '';
		if (!textAfter) textAfter = '';

		// set the new value
		formula = textBefore + operator + textAfter;

		// keep the cursor at the same position
		const newPosition = cursorPosition! + 1;
		setTimeout(() => {
			if (!formulaInput) return;

			formulaInput.focus();
			formulaInput.setSelectionRange(newPosition, newPosition);
		}, 0);
	}

	const handleSave = (e: Event, formula: string, ruleText: string) => {
		e.stopPropagation();
		onSave(formula, ruleText);
	};

	const handleEdit = (e: Event) => {
		e.stopPropagation();
		onEdit();
	};

	const handleDelete = (e: Event) => {
		e.stopPropagation();
		onDelete();
	};

	const highlighted = $derived($selectedRows.includes(line));

	// a row is usable if its line number is inside the highlightedRows store
	const usable = $derived($highlightedRows.includes(line));

	// a row is invalid if the rule is unknown and it's not editable
	const invalid = $derived(rule.rule === NDRule.UNKNOWN && !editable);

	const mathmlFormula = $derived(PrettySyntaxer.toMathML(formula));

	let ruleText = $state(appliedRuleToString(rule));

	let removable = $state(false);

	$effect(async () => {
		if (premise) {
			removable = false;
		} else {
			removable = await canDeleteRow(line, $solverContent.proof);
		}
	});
</script>

<a class="row" class:highlighted class:usable class:invalid onclick={selectRow} role="button">
	<div class="formula-container">
		<div class="line-number">
			{line}.
		</div>
		<div class="line-content">
			{#if editable}
				<input
					class="row-input"
					type="text"
					bind:value={formula}
					bind:this={formulaInput}
					onchange={() => (formula = handleInputChange(formula))}
				/>
				<div class="operator-input">
					{#each operators as operator (operator)}
						<button onmousedown={(e) => insertOperator(e, operator)}>{operator}</button>
					{/each}
				</div>
			{:else}
				<!--{formula}-->
				{@html mathmlFormula}
			{/if}
		</div>
		<div class="used-rule">
			{#if editable}
				<input class="row-input" type="text" bind:value={ruleText} />
			{:else}
				{appliedRuleToString(rule)}
			{/if}
		</div>
	</div>

	<div class="separator">&nbsp;</div>

	<div class="actions-container">
		{#if editable}
			<button
				class="action-button check-button"
				aria-label="Save"
				onclick={(e) => handleSave(e, formula, ruleText)}
			>
				<i class="fas fa-check"></i>
			</button>
		{:else}
			<button
				class="action-button edit-button"
				class:disabled={premise}
				disabled={premise}
				aria-label="Edit"
				onclick={handleEdit}
			>
				<i class="fas fa-edit"></i>
			</button>
			<button
				class="action-button delete-button"
				class:disabled={!removable}
				disabled={!removable}
				aria-label="Delete"
				onclick={handleDelete}
			>
				<i class="fas fa-times"></i>
			</button>
		{/if}
	</div>
</a>

<style>
	.row {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		align-items: center;
		padding: 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border);
		background: var(--surface);
		font-family: monospace;
		font-size: 1.35em;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
	}

	.row:hover {
		background: var(--button-hover);
	}

	.row.highlighted.usable,
	.row.highlighted {
		outline: 1px solid #00ff00;
		border-color: #00ff00;
	}

	.row.usable {
		outline: 1px solid #ffcc00;
		border-color: #ffcc00;
	}

	.row.invalid {
		outline: 1px solid #ff0000;
		border-color: #ff0000;
	}

	.formula-container {
		display: flex;
		align-items: center;
		flex-grow: 1;
	}

	.actions-container {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-grow: 0;
	}

	.used-rule,
	.line-number {
		text-align: center;
		padding-inline: 0.5rem;
	}

	.used-rule {
		width: auto;
		flex-grow: 0;
		flex-shrink: 1;
	}

	.line-number {
		width: 2.5rem;
	}

	.line-content {
		position: relative;
		text-align: left;
		flex-grow: 2;
	}

	.used-rule input,
	.line-content input {
		width: 100%;
		font-size: 1em;
	}

	.used-rule input {
		max-width: 8rem;
	}

	.row-input {
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--border);
		color: var(--text-primary);
		height: auto;
	}

	.separator {
		width: 1px;
		border-right: 1px solid var(--border);
	}

	.action-button {
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		transition: color 0.2s;
	}

	.action-button.disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.check-button:hover:not(.disabled) {
		color: #00ff00;
	}

	.delete-button:hover:not(.disabled) {
		color: #ff0000;
	}

	.edit-button:hover:not(.disabled) {
		color: #ffcc00;
	}

	.operator-input {
		display: none;
		position: absolute;
		max-width: 100%;
		top: 100%;
		right: 0;
		z-index: 10;
		color: black;
		padding: 0.15rem;
		border-radius: 0 0 0.5rem 0.5rem;
		border: 1px solid var(--border);
		border-top: 0;
		background-color: var(--background);
	}

	.operator-input button {
		aspect-ratio: 1;
		padding: 0.225em 0.7em;
		font-size: 0.9em;
		font-family: monospace;
		margin: 0.15rem;
		background-color: var(--surface);
		color: var(--text-primary);
	}

	.operator-input button:hover {
		outline: none;
		border: 1px solid var(--border);
	}

	.line-content:focus-within .operator-input {
		display: flex;
		flex-wrap: wrap;
	}

	.line-content:focus-within .row-input {
		border-radius: 0.5rem 0.5rem 0 0.5rem;
	}

	:global(html):not(.dark-mode) {
		.row.highlighted {
			border-color: #00c800;
			outline: 1px solid #00c800;
		}

		.row.usable {
			border-color: #ffcc00;
			outline: 1px solid #ffcc00;
		}
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

		.actions-container {
			justify-content: flex-end;
			width: 100%;
		}
	}
</style>
