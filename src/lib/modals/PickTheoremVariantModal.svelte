<script lang="ts">
    import CustomModal, { type CustomModalProps } from "./CustomModal.svelte";
    import type { ButtonContent } from "../../types/ButtonContent";

    interface SelectProofTypeModalProps extends CustomModalProps {
        theoremVariantButtons: ButtonContent[];
    }

    const {
        id,
        index,
        isOpen,
        close,
        title,
        theoremVariantButtons,
    }: SelectProofTypeModalProps = $props();
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
    <div slot="buttons">
        {#each theoremVariantButtons as button}
            <button class="button" on:click={() => { button.action(); close(); }}>
                {button.text}
            </button>
        {/each}
    </div>
</CustomModal>