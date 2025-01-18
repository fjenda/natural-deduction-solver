<script lang="ts">
    import type {ButtonContent} from "../types/ButtonContent";

    export let show;
    export let content = '';
    export let buttons: ButtonContent[] = [];
</script>

<div class="modal" class:hidden={!show}>
    <div class="modal-content">
        <div class="modal-header">
            <h2>Modal Header</h2>
        </div>
        <div class="modal-body">
            {content}
            <slot name="body" />
        </div>
        <div class="modal-footer">
            {#each buttons as button}
                <button on:click={button.action}>{button.text}</button>
            {/each}
        </div>
    </div>
</div>

<style>
    .modal {
        display: block;
        position: fixed;
        z-index: 100;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0, 0, 0, 0.4);
    }

    .modal.hidden {
        display: none;
    }

    .modal-content {
        background-color: var(--dark-element-color);
        margin: 15% auto;
        padding: 1.5rem;
        border: 1px solid var(--dark-border-color);
        width: fit-content;
        max-width: 50rem;
        border-radius: 0.5rem;
    }

    .modal-header {
        text-align: center;
        color: var(--dark-text-color)
    }

    .modal-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 0.5rem;
    }

    .modal-footer {
        padding: 0.25rem 0.5rem;
        display: flex;
        justify-content: center;
        gap: 0.5rem;
    }

    @media screen and (prefers-color-scheme: light) {
        .modal-content {
            background-color: var(--light-element-color);
            border: 1px solid var(--light-border-color);
        }

        .modal-header {
            color: var(--light-text-color)
        }
    }
</style>