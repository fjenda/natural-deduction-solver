<script lang="ts">
	import SolverLayout from '../../layouts/SolverLayout.svelte';
	import { EditState } from '../../../types/EditState';
	import { editState, solving } from '../../../stores/stateStore';
	import { addPremise, solverContent } from '../../../stores/solverStore';
	import PremiseInputContainer from './PremiseInputContainer.svelte';
	import AssignmentText from '../../components/AssignmentText.svelte';
	import SolutionControlsContainer from './SolutionControlsContainer.svelte';
	import SolverTable from '../components/solver-table/SolverTable.svelte';
	import { loadExample, onChangeConclusion, onChangeTheorem } from '../actions/proofActions';
	import StyledButton from '../../components/StyledButton.svelte';
	import Hint from '../../components/Hint.svelte';
	import { starterExamples } from '../../utils/starterExamples';

	let showExamples = $state(false);

	/**
	 * Toggles the examples dropdown visibility.
	 */
	const toggleExamples = () => {
		showExamples = !showExamples;
	};

	/**
	 * Loads the selected starter example and closes the dropdown.
	 * @param example - the starter example to load
	 */
	const selectExample = (example: (typeof starterExamples)[0]) => {
		loadExample(example);
		showExamples = false;
	};
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

		<div class="examples-section">
			<button class="examples-toggle" onclick={toggleExamples}>
				<i class="fas fa-lightbulb"></i>
				{showExamples ? 'Hide Examples' : 'Load Example'}
			</button>

			{#if showExamples}
				<div class="examples-dropdown">
					{#each starterExamples as example (example.name)}
						<button class="example-item" onclick={() => selectExample(example)}>
							<span class="example-name">{example.name}</span>
							<span class="example-mode">{example.mode === 'PROPOSITIONAL' ? 'Prop' : 'Pred'}</span>
							<span class="example-formulas">
								{example.premises.join(', ')} ⊢ {example.conclusion}
							</span>
						</button>
					{/each}
				</div>
			{/if}
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

	.examples-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.examples-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px dashed var(--border);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--transition-base);
		font-size: 0.9rem;
	}

	.examples-toggle:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--button-hover);
	}

	.examples-toggle i {
		color: var(--warning);
	}

	.examples-dropdown {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface);
		box-shadow: var(--shadow-md);
		max-height: 300px;
		overflow-y: auto;
	}

	.example-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--button-bg);
		cursor: pointer;
		transition: all var(--transition-base);
		text-align: left;
		width: 100%;
	}

	.example-item:hover {
		border-color: var(--accent);
		background: var(--button-hover);
		transform: translateX(2px);
	}

	.example-name {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.95rem;
	}

	.example-mode {
		font-size: 0.75rem;
		color: var(--accent);
		background: rgba(99, 102, 241, 0.1);
		padding: 1px 6px;
		border-radius: var(--radius-sm);
		position: absolute;
		right: var(--spacing-sm);
		top: var(--spacing-sm);
	}

	.example-formulas {
		font-size: 0.85rem;
		color: var(--text-secondary);
		font-family: monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.example-item {
		position: relative;
	}
</style>
