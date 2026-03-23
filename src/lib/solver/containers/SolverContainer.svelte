<script lang="ts">
	import SolverLayout from '../../layouts/SolverLayout.svelte';
	import { EditState } from '../../../types/EditState';
	import { editState, solving } from '../../../stores/stateStore';
	import { addPremise, solverContent } from '../../../stores/solverStore';
	import PremiseInputContainer from './PremiseInputContainer.svelte';
	import AssignmentText from '../../components/AssignmentText.svelte';
	import SolutionControlsContainer from './SolutionControlsContainer.svelte';
	import SolverTable from '../components/solver-table/SolverTable.svelte';
	import { onChangeConclusion, onChangeTheorem } from '../actions/proofActions';
	import StyledButton from '../../components/StyledButton.svelte';
	import Hint from '../../components/Hint.svelte';
</script>

<SolverLayout>
	{#if !$solving && $editState === EditState.SOLVER}
		<div class="section-header">
			<span>Premises & Conclusion</span>
			<Hint
				title="Getting Started"
				text="Enter your premises and a conclusion below. You can use logical operators like ¬, ∧, ∨, ⊃, ≡. An operator keyboard will appear when you focus an input field. Click 'Prove' when ready."
			/>
		</div>

		{#each Array.from($solverContent.premises) as p, i (i)}
			<PremiseInputContainer index={i} bind:value={p.value} error={!p.tree} />
		{/each}

		<StyledButton text="Add Premise" onClick={addPremise} />

		<div class="conclusion-header">
			<span>Conclusion</span>
			<Hint
				title="The Conclusion"
				text="This is what you want to prove from your premises. Once you click 'Prove', you'll construct a proof by applying deduction rules step by step."
			/>
		</div>

		<PremiseInputContainer
			placeholder="Conclusion"
			bind:value={$solverContent.conclusion.value}
			index={$solverContent.premises.length + 1}
			onChange={() => onChangeConclusion($solverContent.conclusion.value)}
			error={!$solverContent.conclusion.tree}
		/>
	{/if}

	{#if !$solving && $editState === EditState.THEOREM}
		<PremiseInputContainer
			placeholder="Theorem"
			bind:value={$solverContent.whole.value}
			error={!$solverContent.whole.tree}
			index={$solverContent.premises.length + 1}
			onChange={() => onChangeTheorem($solverContent.whole.value)}
		/>
	{/if}

	{#if $solving}
		<AssignmentText />
	{/if}

	<SolutionControlsContainer />

	{#if $solving}
		<SolverTable data={$solverContent.proof} />
	{/if}
</SolverLayout>

<style>
	.section-header,
	.conclusion-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
</style>
