<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';
	import MathMLViewer from '../solver/components/MathMLViewer.svelte';
	import type { TreeRuleType } from '../../types/TreeRuleType';

	interface ReplaceQuantifierVariableModalProps extends CustomModalProps {
		row: TreeRuleType;
		placeholder: string;
		onConfirm: (modalInput: HTMLInputElement) => void;
	}

	const {
		id,
		index,
		isOpen,
		close,
		title,
		row,
		placeholder,
		onConfirm
	}: ReplaceQuantifierVariableModalProps = $props();

	let modalInput: HTMLInputElement;
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
	<div slot="body" class="body">
		<MathMLViewer value={row.value} />
		<input type="text" {placeholder} name="modal-input" bind:this={modalInput} />
	</div>
	<a href="javascript:;">Help</a>
	<div slot="buttons">
		<button
			class="button"
			onclick={() => {
				close();
			}}>Cancel</button
		>
		<button
			class="button"
			onclick={() => {
				onConfirm(modalInput);
				close();
			}}>Confirm</button
		>
	</div>
</CustomModal>

<style>
	.body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
