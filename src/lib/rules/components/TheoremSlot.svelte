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
			opacity 200ms ease,
			transform 200ms ease;
		pointer-events: none;
		max-height: 0;
		overflow: hidden;
	}

	.mathml-viewer-wrapper.visible {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
		max-height: 500px; /* arbitrary large enough value */
		/*max-width: 250px;*/

		overflow: auto hidden;
		white-space: nowrap;
		padding-bottom: 4px;
	}

	p:not(.visible) {
		opacity: 0;
	}

	.theorem-slot {
		width: 100%;
		height: 100%;
		padding: 1rem;
		background-color: var(--surface);
		border-radius: 0.5rem;
		outline: 1px solid var(--border);
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		align-items: center;
		position: relative;
		line-height: 0;
		overflow: hidden;
	}

	.theorem-slot:hover,
	.theorem-slot:focus {
		outline: 1px solid var(--border);
	}

	.theorem-slot:hover {
		cursor: pointer;
	}

	.theorem-slot.invalid:hover {
		cursor: not-allowed;
	}

	.theorem-slot.invalid {
		outline-color: #ff0000;
	}

	.theorem-slot .name {
		text-align: left;
		min-width: 0;
	}

	.theorem-slot .name input {
		width: 100%;
		padding: 0.5rem;
		border: none;
		outline: 1px solid var(--border);
		border-radius: 0.25rem;
		background-color: var(--surface);
		color: #fff;
	}

	.theorem-slot .actions {
		display: flex;
		gap: 1rem;
	}

	.theorem-slot .actions button {
		width: 20px;
		aspect-ratio: 1;
		padding: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		outline: none;
		transition: color 0.2s;
	}

	.theorem-slot .actions button i {
		font-size: 1.25rem;
	}

	.theorem-slot .actions .edit-button:disabled {
		cursor: not-allowed;
	}

	.theorem-slot .actions .delete-button:hover {
		color: #ff0000;
	}

	.theorem-slot .actions .save-button:hover {
		color: #00ff00;
	}

	.theorem-slot .actions .edit-button:hover:not([disabled]) {
		color: #ffa500;
	}

	.theorem-slot .actions button:focus {
		outline: none;
	}
</style>
