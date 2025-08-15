<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';

	interface SelectRowModalProps extends CustomModalProps {
		body: string;
		placeholder: string;
		onConfirm: (modalInput: HTMLInputElement) => void;
	}

	const { id, index, isOpen, close, title, body, placeholder, onConfirm }: SelectRowModalProps =
		$props();

	let modalInput: HTMLInputElement;
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
	<div slot="body">
		<p>{body}</p>
		<input type="text" {placeholder} name="modal-input" bind:this={modalInput} />
	</div>
	<div slot="buttons">
		<button class="button" on:click={close}>Cancel</button>
		<button
			class="button"
			on:click={() => {
				onConfirm(modalInput);
				close();
			}}>Confirm</button
		>
	</div>
</CustomModal>

<style>
	p {
		margin: 0;
		padding: 0.5rem 0;
	}
</style>
