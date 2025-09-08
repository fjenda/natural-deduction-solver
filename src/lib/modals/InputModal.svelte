<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';

	interface SelectRowModalProps extends CustomModalProps {
		content: string;
		placeholder: string;
		onConfirm: (modalInput: HTMLInputElement) => void;
	}

	const { id, index, isOpen, close, title, content, placeholder, onConfirm }: SelectRowModalProps =
		$props();

	let modalInput: HTMLInputElement;
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
	{#snippet body()}
		<div>
			<p>{content}</p>
			<input type="text" {placeholder} name="modal-input" bind:this={modalInput} />
		</div>
	{/snippet}

	{#snippet buttons()}
		<div slot="buttons">
			<button class="button" onclick={close}>Cancel</button>
			<button
				class="button"
				onclick={() => {
					onConfirm(modalInput);
					close();
				}}>Confirm</button
			>
		</div>
	{/snippet}
</CustomModal>

<style>
	p {
		margin: 0;
		padding: 0.5rem 0;
	}
</style>
