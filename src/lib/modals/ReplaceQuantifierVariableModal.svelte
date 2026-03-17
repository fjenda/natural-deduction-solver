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

	function toggleSuggestions() {
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
	{#snippet body()}
		<div class="body">
			<div class="formula-card">
				<p class="label">Selected expression</p>
				<div class="mathml-row">
					<MathMLViewer value={row.value} />
				</div>
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
				<button
					type="button"
					onclick={toggleSuggestions}
					class="help-link"
					aria-expanded={showSuggestions}>{showSuggestions ? 'Hide tips' : 'Show tips'}</button
				>
			</div>
			{#if showSuggestions}
				<div class="suggestions" role="listbox" aria-label="Suggestions" transition:slide>
					{#if suggestions && suggestions.length > 0}
						{#each suggestions as s, i (s + '-' + i)}
							<button type="button" class="suggestion" onclick={() => chooseSuggestion(s)}
								>{s}</button
							>
						{/each}
					{:else}
						<div class="no-suggestions">No suggestions available</div>
					{/if}
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet buttons()}
		<div>
			<button
				class="button"
				onclick={() => {
					showSuggestions = false;
					close();
				}}>Cancel</button
			>
			<button
				class="button primary"
				onclick={() => {
					onConfirm(modalInput);
					showSuggestions = false;
					close();
				}}>Confirm</button
			>
		</div>
	{/snippet}
</CustomModal>

<style>
	.body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		width: min(34rem, 100%);
	}

	.formula-card {
		padding: var(--spacing-md);
		background: var(--surface-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
	}

	.label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: var(--spacing-sm);
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.modal-input {
		font-size: 1rem;
		height: auto;
		padding: var(--spacing-md);
	}

	.help-link {
		user-select: none;
		color: var(--accent);
		text-decoration: none;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		border: 1px solid var(--border);
		background: var(--surface-elevated);
		transition: all var(--transition-base);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-sm);
	}

	.help-link:hover {
		color: var(--accent-hover);
		border-color: var(--accent);
		background: rgba(37, 99, 235, 0.1);
	}

	.help-link:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 3px var(--surface),
			0 0 0 5px var(--accent);
	}

	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-xs);
		padding: var(--spacing-lg);
		background: var(--surface-elevated);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-sm);
	}

	.suggestion {
		padding: var(--spacing-sm) var(--spacing-md);
		font-size: 0.95rem;
		font-family: monospace;
		background-color: var(--surface);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 999px;
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.suggestion:hover {
		background-color: var(--button-hover);
		color: var(--accent);
		border-color: var(--accent);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.suggestion:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 3px var(--surface),
			0 0 0 5px var(--accent);
	}

	.no-suggestions {
		color: var(--text-secondary);
		font-size: 0.9rem;
		padding: var(--spacing-md) 0;
	}
</style>
