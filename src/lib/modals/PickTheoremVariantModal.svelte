<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';
	import type { ButtonContent } from '../../types/ButtonContent';

	interface SelectProofTypeModalProps extends CustomModalProps {
		theoremVariantButtons: ButtonContent[];
	}

	const { id, index, isOpen, close, title, theoremVariantButtons }: SelectProofTypeModalProps =
		$props();
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
	{#snippet buttons()}
		<div>
			{#each theoremVariantButtons as button (button.text)}
				<button
					class="button"
					onclick={() => {
						button.action();
						close();
					}}
				>
					{button.text}
				</button>
			{/each}
		</div>
	{/snippet}
</CustomModal>
