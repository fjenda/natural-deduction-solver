<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';

	type ConnectivePosition = 'before' | 'after';

	interface InputModalProps extends CustomModalProps {
		content: string;
		placeholder: string;
		showConnectivePosition?: boolean;
		defaultConnectivePosition?: ConnectivePosition;
		onConfirm: (modalInput: HTMLInputElement, connectivePosition?: ConnectivePosition) => void;
	}

	const {
		id,
		index,
		isOpen,
		close,
		title,
		content,
		placeholder,
		showConnectivePosition = false,
		defaultConnectivePosition = 'after',
		onConfirm
	}: InputModalProps = $props();

	let modalInput: HTMLInputElement;
	let connectivePosition = $state<ConnectivePosition>(defaultConnectivePosition);
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
	{#snippet body()}
		<div class="modal-form">
			<p class="description">{content}</p>
			<label class="input-label" for="modal-input">Formula</label>
			<input id="modal-input" type="text" {placeholder} name="modal-input" bind:this={modalInput} />
			{#if showConnectivePosition}
				<fieldset class="position-group">
					<legend class="position-title">Where should it be placed?</legend>
					<label class="position-option" for="position-before">
						<input
							id="position-before"
							type="radio"
							name="connective-position"
							value="before"
							bind:group={connectivePosition}
						/>
						<span>Before connective</span>
					</label>
					<label class="position-option" for="position-after">
						<input
							id="position-after"
							type="radio"
							name="connective-position"
							value="after"
							bind:group={connectivePosition}
						/>
						<span>After connective</span>
					</label>
				</fieldset>
			{/if}
		</div>
	{/snippet}

	{#snippet buttons()}
		<div class="actions" slot="buttons">
			<button class="button" onclick={close}>Cancel</button>
			<button
				class="button primary"
				onclick={() => {
					onConfirm(modalInput, showConnectivePosition ? connectivePosition : undefined);
					close();
				}}>Confirm</button
			>
		</div>
	{/snippet}
</CustomModal>

<style>
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		width: min(36rem, 100%);
	}

	.description {
		color: var(--text-secondary);
		font-size: 0.95rem;
		line-height: 1.6;
		padding: var(--spacing-md);
		background: var(--surface-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
	}

	.input-label {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text-primary);
	}

	input[name='modal-input'] {
		height: auto;
		font-size: 1rem;
		font-family: inherit;
		padding: var(--spacing-md);
	}

	.position-group {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		display: grid;
		gap: var(--spacing-md);
		background: var(--surface-elevated);
		transition: all var(--transition-base);
	}

	.position-group:hover {
		border-color: var(--accent);
		box-shadow: var(--shadow-sm);
	}

	.position-title {
		padding: 0 var(--spacing-sm);
		font-size: 0.9rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.position-option {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.position-option:hover {
		background: var(--button-hover);
		border-color: var(--accent);
	}

	.position-option input[type='radio'] {
		width: 1.125rem;
		height: 1.125rem;
		margin: 0;
		cursor: pointer;
		accent-color: var(--accent);
	}

	.position-option span {
		color: var(--text-primary);
	}

	.actions {
		display: flex;
		gap: var(--spacing-md);
		width: 100%;
	}

	.actions button {
		font-size: 1rem;
		padding: var(--spacing-md) var(--spacing-lg);
	}

	@media (max-width: 640px) {
		.modal-form {
			width: 100%;
		}
	}
</style>
