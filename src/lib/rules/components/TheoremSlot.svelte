<script lang="ts">
	import {
		selectedTheorem,
		removeTheorem,
		saveTheorem,
		editTheorem
	} from '../../../stores/theoremsStore';
	import { solverContent } from '../../../stores/solverStore';
	import { theorems } from '../../../stores/theoremsStore';
	import MathMLViewer from '../../solver/components/MathMLViewer.svelte';
	import { ProofTable } from '../../../prolog/queries/ProofTable';

	interface TheoremSlotProps {
		name: string;
		index: number;
		valid: boolean;
		onClick: () => void;
	}

	let { name, index, valid, onClick }: TheoremSlotProps = $props();

	let hovered: boolean = $state(false);
	let hoveredTimeout: NodeJS.Timeout;

	const handleMouseOver = () => {
		hovered = true;
		clearTimeout(hoveredTimeout);
	};

	const handleMouseOut = () => {
		hovered = false;
		hoveredTimeout = setTimeout(() => {
			hovered = false;
		}, 100);
	};

	const stopPropagation = (e: Event) => {
		e.stopPropagation();
	};

	const handleSaveTheorem = (e: Event) => {
		e.stopPropagation();
		saveTheorem(index);
		ProofTable.clear();
	};

	const handleEditTheorem = (e: Event) => {
		e.stopPropagation();
		editTheorem(index);
	};

	const handleDeleteTheorem = (e: Event) => {
		e.stopPropagation();
		removeTheorem(index);
	};
</script>

<div
	class="theorem-slot"
	class:invalid={!valid}
	onmouseenter={handleMouseOver}
	onfocus={handleMouseOver}
	onmouseleave={handleMouseOut}
	onblur={handleMouseOut}
	onclick={valid ? onClick : null}
>
	<div class="name">
		{#if index === $selectedTheorem}
			<input
				type="text"
				bind:value={$solverContent.name}
				onclick={stopPropagation}
				class="name-input"
				placeholder="Theorem Name"
			/>
		{:else}
			<p class:visible={!hovered}>{name}</p>
			<div class="mathml-viewer-wrapper" class:visible={hovered}>
				<MathMLViewer value={$theorems[index].solution.whole.value} style="font-size: 1.1rem" />
			</div>
		{/if}
	</div>
	<div class="actions">
		{#if index === $selectedTheorem}
			<button class="save-button" aria-label="Save Theorem" onclick={handleSaveTheorem}>
				<i class="fa-regular fa-floppy-disk"></i>
			</button>
		{:else}
			<button
				class="edit-button"
				aria-label="Edit Theorem"
				onclick={handleEditTheorem}
				disabled={$selectedTheorem !== -1}
			>
				<i class="fas fa-edit"></i>
			</button>
		{/if}
		<button class="delete-button" aria-label="Delete Theorem" onclick={handleDeleteTheorem}>
			<i class="fas fa-times"></i>
		</button>
	</div>
</div>

<style>
	.mathml-viewer-wrapper {
		opacity: 0;
		transform: translateY(-0.5rem);
		transition:
			opacity var(--transition-base),
			transform var(--transition-base);
		pointer-events: none;
		max-height: 0;
		overflow: hidden;
	}

	.mathml-viewer-wrapper.visible {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
		max-height: 500px;
		overflow: auto hidden;
		white-space: nowrap;
		padding-bottom: 4px;
	}

	p:not(.visible) {
		opacity: 0;
		display: none;
	}

	.theorem-slot {
		width: 100%;
		height: 100%;
		padding: var(--spacing-lg);
		background-color: var(--surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--spacing-lg);
		align-items: center;
		position: relative;
		line-height: 0;
		overflow: hidden;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
	}

	.theorem-slot:hover:not(.invalid) {
		border-color: var(--accent);
		box-shadow:
			var(--shadow-md),
			0 0 0 1px var(--accent-subtle);
		cursor: pointer;
		transform: translateY(-1px);
	}

	.theorem-slot:focus {
		outline: none;
		box-shadow:
			0 0 0 3px var(--surface),
			0 0 0 5px var(--accent);
	}

	.theorem-slot.invalid {
		border-color: var(--error);
		box-shadow:
			0 0 0 2px var(--error-bg),
			var(--shadow-sm);
	}

	.theorem-slot.invalid:hover {
		cursor: not-allowed;
	}

	.theorem-slot .name {
		text-align: left;
		min-width: 0;
	}

	.theorem-slot .name input {
		width: 100%;
		padding: var(--spacing-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background-color: var(--surface-elevated);
		color: var(--text-primary);
		transition: all var(--transition-base);
	}

	.theorem-slot .name input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	.theorem-slot .actions {
		display: flex;
		gap: var(--spacing-sm);
	}

	.theorem-slot .actions button {
		width: 2.25rem;
		aspect-ratio: 1;
		padding: var(--spacing-sm);
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--button-bg);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
	}

	.theorem-slot .actions button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.theorem-slot .actions button:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 3px var(--surface),
			0 0 0 5px var(--accent);
	}

	.theorem-slot .actions button:active:not(:disabled) {
		transform: translateY(0);
	}

	.theorem-slot .actions .edit-button:disabled {
		cursor: not-allowed;
		opacity: 0.4;
	}

	.theorem-slot .actions .delete-button:hover:not(:disabled) {
		color: var(--error);
		border-color: var(--error);
		background: var(--error-bg);
	}

	.theorem-slot .actions .save-button:hover:not(:disabled) {
		color: var(--success);
		border-color: var(--success);
		background: var(--success-bg);
	}

	.theorem-slot .actions .edit-button:hover:not(:disabled) {
		color: var(--warning);
		border-color: var(--warning);
		background: var(--warning-bg);
	}
</style>
