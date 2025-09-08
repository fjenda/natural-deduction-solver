<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';

	interface SelectProofTypeModalProps extends CustomModalProps {
		directProof: () => void;
		indirectProof: () => void;
	}

	const { id, index, isOpen, close, title, directProof, indirectProof }: SelectProofTypeModalProps =
		$props();
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
	{#snippet buttons()}
		<div>
			<button
				class="button"
				onclick={() => {
					directProof();
					close();
				}}>Direct Proof</button
			>
			<button
				class="button"
				onclick={() => {
					indirectProof();
					close();
				}}>Indirect Proof</button
			>
		</div>
	{/snippet}
</CustomModal>
