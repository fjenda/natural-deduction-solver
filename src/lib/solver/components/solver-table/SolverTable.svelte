<script lang="ts">
	import { solverContent } from '../../../../stores/solverStore';
	import { FormulaParser } from '../../parsers/FormulaParser';
	import { NDRule } from '../../../rules/DeductionRule';
	import { FormulaComparer } from '../../FormulaComparer';
	import type { TableRowData } from '../../../../types/TableRow';
	import type { TreeRuleType } from '../../../../types/TreeRuleType';
	import { showToast } from '../../../utils/showToast';
	import { removeRow } from '../../actions/proofActions';
	import ProofRow from './row/ProofRow.svelte';
	import { existsInProof } from '../../utils/proofUtils';
	import { ProofTable } from '../../../../prolog/queries/ProofTable';

	interface SolverTableProps {
		data: TreeRuleType[];
	}

	let { data }: SolverTableProps = $props();

	let rows: TableRowData[] = $state([]);

	$effect(() => {
		rows = data.map((d) => ({ line: d.line, formula: d.value, rule: d.rule, editable: false }));
	});
	let container: HTMLDivElement;

	/**
	 * Adds a new row to the proof
	 */
	const addRow = () => {
		rows = [
			...rows,
			{
				line: rows.length + 1,
				formula: '',
				rule: { rule: NDRule.UNKNOWN },
				editable: true
			}
		];

		// scroll
		requestAnimationFrame(() => {
			container.scrollTo({
				top: container.scrollHeight,
				behavior: 'smooth'
			});
		});
	};

	/**
	 * Checks if we can add a new row to the proof
	 * @returns {boolean} true if we can add a new row, false otherwise
	 */
	const canAddRow = (): boolean => {
		return rows.filter((r) => r.editable).length < 1;
	};
</script>

<div class="table-wrapper" bind:this={container}>
	<div class="table">
		{#each rows as row, i (i)}
			<ProofRow
				line={row.line}
				formula={row.formula}
				rule={row.rule}
				premise={i <= $solverContent.premises.length - 1}
				editable={row.editable}
				onSave={async (content, rule) => {
					const res = await FormulaParser.parseFormula(content, i + 1, rule);

					// check if the formula already exists in any other row
					if (existsInProof(res)) {
						showToast('Formula already exists in the proof.', 'error');
						return;
					}

					$solverContent.proof.splice(i, 0, res);

					row.formula = $solverContent.proof[i].value;
					row.rule = $solverContent.proof[i].rule;
					row.editable = false;
				}}
				onEdit={() => {
					// remove the row from the proof
					row.editable = true;
					$solverContent.proof.splice(i, 1);
				}}
				onDelete={() => {
					removeRow(i);
				}}
			/>
		{/each}

		<button
			onclick={addRow}
			aria-label="Add row"
			class:disabled={!canAddRow()}
			disabled={!canAddRow()}
		>
			<i class="fas fa-plus"></i>
			Proof
		</button>
	</div>
</div>

<style>
	.table-wrapper {
		flex: 1;
		overflow: hidden auto;
		border-radius: 0.5rem;
		border: 1px solid var(--border);
		background-color: var(--background);
		padding: 0.5rem;
	}

	.table {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 100%;
	}

	button {
		width: 100%;
		height: 3.5rem;
	}

	button.disabled {
		cursor: not-allowed;
	}

	button.disabled:hover {
		border: 1px solid var(--border);
	}
</style>
