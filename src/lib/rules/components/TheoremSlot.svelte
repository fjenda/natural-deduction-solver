<script lang="ts">
    import { solverContent, solverBackup } from "../../../stores/solverStore";
    import { theorems, selectedTheorem } from "../../../stores/theoremsStore";

    export let name: string = "";
    export let index: number = -1;

    function editTheorem() {
        $solverBackup = $solverContent;
        $solverContent = $theorems[index];
        $selectedTheorem = index;
    }

    function deleteTheorem() {
        theorems.update((theorems) => theorems.filter((_, i) => i !== index));
    }

    function saveTheorem() {
        theorems.update((theorems) => {
            theorems[index] = $solverContent;
            return theorems;
        });
        $selectedTheorem = -1;
        $solverContent = $solverBackup;
    }
</script>

<div class="theorem-slot">
    <div class="name">
        {name}
    </div>
    <div class="actions">
        {#if index === $selectedTheorem}
            <button class="edit-button" aria-label="Save Theorem" on:click={() => saveTheorem()}>
                <i class="fa-regular fa-floppy-disk"></i>
            </button>
        {:else}
            <button class="edit-button" aria-label="Edit Theorem" on:click={() => editTheorem()} disabled={$selectedTheorem !== -1}>
                <i class="fas fa-edit"></i>
            </button>
        {/if}
        <button class="delete-button" aria-label="Delete Theorem" on:click={() => deleteTheorem()}>
            <i class="fas fa-xmark"></i>
        </button>
    </div>
</div>

<style>
    .theorem-slot {
        width: 100%;
        height: 100%;
        padding: 1rem;
        background-color: #1a1a1a;
        border-radius: 0.5rem;
        border: 1px solid #424242;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1rem;
        align-items: center;
    }

    .theorem-slot .actions {
        display: flex;
        gap: 1rem;
    }

    .theorem-slot .actions button {
        width: fit-content;
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

    .theorem-slot .actions .delete-button:hover {
        color: #ff0000;
    }

    .theorem-slot .actions .edit-button:disabled {
        cursor: not-allowed;
    }

    .theorem-slot .actions .edit-button:hover:not([disabled]) {
        color: #ffa500;
    }

    .theorem-slot .actions button:focus {
        outline: none;
    }

    @media (prefers-color-scheme: light) {
        .theorem-slot {
            background-color: #f9f9f9;
            border: 1px solid #d1d1d1;
        }
    }
</style>