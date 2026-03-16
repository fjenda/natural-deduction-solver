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
	{#snippet body()}
		<div class="body">
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
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.help-link {
		user-select: none;
		color: var(--accent);
		text-decoration: none;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all var(--transition-base);
		padding: var(--spacing-sm);
		border-radius: var(--radius-sm);
	}

	.help-link:hover {
		color: var(--accent-hover);
		text-decoration: underline;
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
		margin-top: var(--spacing-md);
		padding: var(--spacing-lg);
		background: var(--surface-elevated);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
	}

	.suggestion {
		padding: var(--spacing-sm) var(--spacing-md);
		font-size: 1rem;
		font-family: monospace;
		background-color: var(--button-bg);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
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
