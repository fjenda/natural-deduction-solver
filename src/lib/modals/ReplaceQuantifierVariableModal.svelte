<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';
	import MathMLViewer from '../solver/components/MathMLViewer.svelte';
	import type { TreeRuleType } from '../../types/TreeRuleType';
	import { slide } from 'svelte/transition';

	interface ReplaceQuantifierVariableModalProps extends CustomModalProps {
		row: TreeRuleType;
		placeholder: string;
		onConfirm: (modalInput: HTMLInputElement) => void;
		suggestions: string[];
	}

	const {
		id,
		index,
		isOpen,
		close,
		title,
		row,
		placeholder,
		onConfirm,
		suggestions
	}: ReplaceQuantifierVariableModalProps = $props();

	let modalInput: HTMLInputElement;
	let showSuggestions = $state(false);

	function toggleSuggestions(event: MouseEvent) {
		event.preventDefault();
		showSuggestions = !showSuggestions;
	}

	function chooseSuggestion(s: string) {
		if (modalInput) {
			modalInput.value = s;
			modalInput.focus();
		}
		showSuggestions = false;
	}
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
	<div slot="body" class="body">
		<div class="mathml-row">
			<MathMLViewer value={row.value} />
		</div>
		<div class="input-row">
			<input
				type="text"
				{placeholder}
				name="modal-input"
				bind:this={modalInput}
				autocomplete="off"
				class="modal-input"
			/>
			<a onclick={toggleSuggestions} class="help-link">Help</a>
		</div>
		{#if showSuggestions}
			<div class="suggestions" role="listbox" aria-label="Suggestions" transition:slide>
				{#if suggestions && suggestions.length > 0}
					{#each suggestions as s, i (s + '-' + i)}
						<button type="button" class="suggestion" onclick={() => chooseSuggestion(s)}>{s}</button
						>
					{/each}
				{:else}
					<div class="no-suggestions">No suggestions available</div>
				{/if}
			</div>
		{/if}
	</div>
	<div slot="buttons">
		<button
			class="button"
			onclick={() => {
				showSuggestions = false;
				close();
			}}>Cancel</button
		>
		<button
			class="button"
			onclick={() => {
				onConfirm(modalInput);
				showSuggestions = false;
				close();
			}}>Confirm</button
		>
	</div>
</CustomModal>

<style>
	.body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.help-link {
		user-select: none;
		color: var(--text-primary);
		text-decoration: underline;
		cursor: pointer;
		font-size: 0.95rem;
		margin-left: 0.5rem;
	}

	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.suggestion {
		aspect-ratio: 1;
		padding: 0.225em 0.7em;

		font-size: 1rem;
		font-family: monospace;
		margin: 0.15rem;
		background-color: var(--button-bg);
		color: var(--text-primary);
	}

	.suggestion:hover {
		outline: none;
		background-color: var(--button-hover);
		color: var(--accent);
		border: 1px solid var(--border);
	}

	.no-suggestions {
		color: #666;
		font-size: 0.95rem;
		padding: 0.25rem 0;
	}
</style>
