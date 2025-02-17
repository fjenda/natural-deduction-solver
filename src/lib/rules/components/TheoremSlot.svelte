<script lang="ts">
    import { selectedTheorem, removeTheorem, saveTheorem, editTheorem } from "../../../stores/theoremsStore";
    import { solverContent } from "../../../stores/solverStore";
    import { theorems } from "../../../stores/theoremsStore";
    import MathMLViewer from "../../solver/components/MathMLViewer.svelte";

    export let name: string = "";
    export let index: number = -1;
    let hovered: boolean = false;
    let hoveredTimeout: NodeJS.Timeout;

    function handleMouseOver() {
        hovered = true;
        clearTimeout(hoveredTimeout);
    }

    function handleMouseOut() {
        hovered = false;
        hoveredTimeout = setTimeout(() => {
            hovered = false;
        }, 100);
    }
</script>

<div
    class="theorem-slot"
    on:mouseenter={handleMouseOver}
    on:focus={handleMouseOver}
    on:mouseleave={handleMouseOut}
    on:blur={handleMouseOut}
>
    <div class="name">
        {#if index === $selectedTheorem}
            <input type="text" bind:value={$solverContent.name} class="name-input" placeholder="Theorem Name" />
        {:else if hovered && $theorems[index].conclusion.value}
            <MathMLViewer value={$theorems[index].conclusion.value} fontSize="1rem" padding="0" justifyContent="flex-start" />
        {:else}
            {name}
        {/if}
    </div>
    <div class="actions">
        {#if index === $selectedTheorem}
            <button class="save-button" aria-label="Save Theorem" on:click={() => saveTheorem(index)}>
                <i class="fa-regular fa-floppy-disk"></i>
            </button>
        {:else}
            <button class="edit-button" aria-label="Edit Theorem" on:click={() => editTheorem(index)} disabled={$selectedTheorem !== -1}>
                <i class="fas fa-edit"></i>
            </button>
        {/if}
        <button class="delete-button" aria-label="Delete Theorem" on:click={() => removeTheorem(index)}>
            <i class="fas fa-times"></i>
        </button>
    </div>
</div>

<style>
    .theorem-slot {
        width: 100%;
        height: 100%;
        padding: 1rem;
        background-color: var(--dark-element-color);
        border-radius: 0.5rem;
        border: 1px solid var(--dark-border-color);
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1rem;
        align-items: center;
        position: relative;
        line-height: 0;
    }

    .theorem-slot .name {
        text-align: left;
    }

    .theorem-slot .name input {
        width: 100%;
        padding: 0.5rem;
        border: none;
        outline: 1px solid var(--dark-border-color);
        border-radius: 0.25rem;
        background-color: var(--dark-element-color);
        color: #fff;
    }

    .theorem-slot .actions {
        display: flex;
        gap: 1rem;
    }

    .theorem-slot .actions button {
        width: 20px;
        aspect-ratio: 1;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
        transition: color 0.2s;
    }

    .theorem-slot .actions button i {
        font-size: 1.25rem;
    }

    .theorem-slot .actions .edit-button:disabled {
        cursor: not-allowed;
    }

    .theorem-slot .actions .delete-button:hover {
        color: #ff0000;
    }

    .theorem-slot .actions .save-button:hover {
        color: #00ff00;
    }

    .theorem-slot .actions .edit-button:hover:not([disabled]) {
        color: #ffa500;
    }

    .theorem-slot .actions button:focus {
        outline: none;
    }

    @media (prefers-color-scheme: light) {
        .theorem-slot {
            background-color: var(--light-element-color);
            border: 1px solid var(--light-border-color);
        }
    }
</style>