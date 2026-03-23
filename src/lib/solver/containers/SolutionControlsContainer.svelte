<script lang="ts">
	import { editState, solving } from '../../../stores/stateStore';
	import { indirectSolving, solverContent } from '../../../stores/solverStore';
	import { canUndo, canRedo, undo, redo, startSession } from '../../../stores/historyStore';
	import StyledButton from '../../components/StyledButton.svelte';
	import { EditState } from '../../../types/EditState';
	import { showToast } from '../../utils/showToast';
	import { TheoremParser } from '../parsers/TheoremParser';
	import { get } from 'svelte/store';
	import { Node } from '../../syntax-checker/Node';
	import { modals } from 'svelte-modals';
	import PickTheoremVariantModal from '../../modals/PickTheoremVariantModal.svelte';
	import type { TheoremVariant } from '../../../types/TheoremVariant';
	import SelectProofTypeModal from '../../modals/SelectProofTypeModal.svelte';
	import ExportProofModal from '../../modals/ExportProofModal.svelte';
	import { setupProof, checkProof, resetSolving } from '../actions/proofActions';
	import Hint from '../../components/Hint.svelte';

	const startSolver = () => {
		if ($editState === EditState.SOLVER && !$solverContent.conclusion.tree) {
			return showToast('Invalid conclusion', 'error');
		}

		if ($editState === EditState.THEOREM && !$solverContent.whole.tree) {
			return showToast('Invalid theorem', 'error');
		}

		const setup = (isIndirect: boolean) => {
			indirectSolving.set(isIndirect);

			if ($editState === EditState.THEOREM) {
				solverContent.update((sc) => {
					if (!sc.whole.tree) sc.whole = sc.conclusion;
					return sc;
				});

				const theoremVariants = TheoremParser.getVariants(get(solverContent).whole);
				if (theoremVariants.length === 0) {
					return showToast('Invalid theorem format', 'error');
				}

				const theoremVariantButtons = theoremVariants.map((variant) => ({
					text: variant.premises.map((p) => Node.generateString(p)).join(', '),
					action: () => pickVariant(variant)
				}));

				modals.open(PickTheoremVariantModal, {
					title: 'Select the theorem variant',
					theoremVariantButtons: theoremVariantButtons
				});
			} else {
				setupProof().then((res) => {
					if (res) startSession();
					solving.set(res);
				});
			}
		};

		const pickVariant = (variant: TheoremVariant) => {
			solverContent.update((sc) => {
				sc.premises = variant.premises.map((p) => ({ value: Node.generateString(p), tree: p }));
				sc.conclusion = {
					value: Node.generateString(variant.conclusion),
					tree: variant.conclusion
				};
				return sc;
			});

			setupProof().then((res) => {
				if (res) startSession();
				solving.set(res);
			});
		};

		modals.open(SelectProofTypeModal, {
			title: 'Select Proof Type',
			message: 'Choose the type of proof you want to perform.',
			directProof: () => setup(false),
			indirectProof: () => setup(true)
		});
	};

	const openExport = () => {
		modals.open(ExportProofModal, {
			title: 'Export Proof'
		});
	};
</script>

<div class="controls-wrapper">
	<div class="button-wrapper">
		{#if $solving}
			<div class="undo-redo-group">
				<button
					class="button secondary"
					onclick={undo}
					disabled={!$canUndo}
					aria-label="Undo (Ctrl+Z)"
				>
					<i class="fa-solid fa-rotate-left"></i>
				</button>
				<button
					class="button secondary"
					onclick={redo}
					disabled={!$canRedo}
					aria-label="Redo (Ctrl+Y)"
				>
					<i class="fa-solid fa-rotate-right"></i>
				</button>
			</div>
		{/if}

		{#if $solving}
			<StyledButton text="Check Proof" onClick={checkProof} />
		{:else}
			<StyledButton text="Prove" onClick={startSolver} />
		{/if}
		<StyledButton text="Export" onClick={openExport} disabled={!$solving} />
		<StyledButton
			text="Reset"
			onClick={resetSolving}
			disabled={!$solving}
			hoverBorderColor="#ff0000"
		/>
	</div>

	{#if $solving}
		<div class="controls-hint">
			<Hint
				title="Building Your Proof"
				text="Select rows in the proof table by clicking them (up to 2), then click a deduction rule on the right to apply it. Use Undo/Redo or Ctrl+Z / Ctrl+Y to navigate your changes."
			/>
			<span class="hint-label">Need help?</span>
		</div>
	{/if}
</div>

<style>
	.controls-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.button-wrapper {
		display: flex;
		gap: var(--spacing-md);
	}

	.undo-redo-group {
		display: flex;
		gap: var(--spacing-sm);
	}

	.controls-hint {
		position: absolute;
		top: 0;
		right: 0;
		/*display: flex;*/
		/*align-items: center;*/
		/*justify-content: flex-end;*/
		gap: var(--spacing-xs);
	}

	.hint-label {
		font-size: 0.8rem;
		color: var(--text-secondary);
		opacity: 0.7;
	}
</style>
