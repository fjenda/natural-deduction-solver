<script lang="ts">
	import SolverLayout from '../../layouts/SolverLayout.svelte';
	import { EditState } from '../../../types/EditState';
	import { editState, solving } from '../../../stores/stateStore';
	import { addPremise, solverContent } from '../../../stores/solverStore';
	import PremiseInputContainer from './PremiseInputContainer.svelte';
	import StyledButton from '../../components/StyledButton.svelte';
	import AssignmentText from '../../components/AssignmentText.svelte';
	import SolutionControlsContainer from './SolutionControlsContainer.svelte';
	import SolverTable from '../components/solver-table/SolverTable.svelte';
	import { onChangeConclusion, onChangeTheorem } from '../actions/proofActions';
</script>

<SolverLayout>
	{#if !$solving && $editState === EditState.SOLVER}
		{#each Array.from($solverContent.premises) as p, i (i)}
			<PremiseInputContainer index={i} bind:value={p.value} />
		{/each}

		<StyledButton text="Add Premise" onClick={addPremise} />

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
