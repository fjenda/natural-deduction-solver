<script lang="ts">
	import { editState, solving } from '../../../stores/stateStore';
	import { indirectSolving, solverContent } from '../../../stores/solverStore';
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
	import { setupProof } from '../utils/proofUtils';
	import { checkProof, resetSolving } from '../actions/proofActions';

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
				setupProof().then((res) => solving.set(res));
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

			setupProof().then((res) => solving.set(res));
		};

		modals.open(SelectProofTypeModal, {
			title: 'Select Proof Type',
			message: 'Choose the type of proof you want to perform.',
			directProof: () => setup(false),
			indirectProof: () => setup(true)
		});
	};
</script>

<div class="button-wrapper">
	{#if $solving}
		<StyledButton text="Check Proof" onClick={checkProof} />
	{:else}
		<StyledButton text="Prove" onClick={startSolver} />
	{/if}
	<StyledButton
		text="Reset"
		onClick={resetSolving}
		disabled={!$solving}
		hoverBorderColor="#ff0000"
	/>
</div>

<style>
	.button-wrapper {
		display: flex;
		gap: 1rem;
	}
</style>
