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
		gap: 0.75rem;
		min-width: min(34rem, 85vw);
	}

	.description {
		color: var(--text-secondary);
		font-size: 0.95rem;
		line-height: 1.4;
	}

	.input-label {
		font-weight: 600;
		font-size: 0.95rem;
	}

	input[name='modal-input'] {
		height: auto;
		font-size: 1rem;
		font-family: inherit;
		padding: 0.7rem 0.85rem;
	}

	.position-group {
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		padding: 0.75rem;
		display: grid;
		gap: 0.5rem;
	}

	.position-title {
		padding: 0 0.35rem;
		font-size: 0.9rem;
		color: var(--text-secondary);
	}

	.position-option {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.45rem 0.6rem;
		border: 1px solid transparent;
		border-radius: 0.6rem;
		cursor: pointer;
	}

	.position-option:hover {
		background: var(--button-bg);
		border-color: var(--border);
	}

	.position-option input[type='radio'] {
		width: 1rem;
		height: 1rem;
		margin: 0;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		width: 100%;
	}

	.actions button {
		font-size: 1rem;
		padding: 0.65rem 0.95rem;
	}

	@media (max-width: 640px) {
		.modal-form {
			min-width: min(25rem, 90vw);
		}
	}
</style>
