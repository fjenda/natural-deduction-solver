<script lang="ts">
    import {onMount} from "svelte";
    import {SyntaxChecker} from "../../SyntaxChecker";
    import {selectedRow} from "../../../../stores/solverStore";

    export let line: number = 1;
    export let formula: string = "A -> B";
    export let rule: string = "MP";
    export let premise: boolean = false;
    export let editable: boolean = false;
    export let onSave: (content: string, rule: string) => void;
    export let onEdit: () => void;
    export let onDelete: () => void;
    let highlighted: boolean = false;

    let inputContent: HTMLInputElement;
    let inputRule: HTMLInputElement;

    function handleInputChange(s: string): string {
        return SyntaxChecker.clean(s);
    }

    function selectRow() {
        if (editable) return;

        highlighted = !highlighted;
        $selectedRow = highlighted ? line : -1;
    }

    onMount(() => {
        // if (editable) {
        //     setTimeout(() => inputContent.focus(), 50);
        // }
    })
</script>

<div
    class="row"
    class:highlighted={highlighted}
    on:click={selectRow}
>
    <div class="line-number">
        {line}.
    </div>
    <div class="line-content">
        {#if editable}
            <input
                class="row-input"
                type="text"
                bind:value={formula}
                bind:this={inputContent}
                on:change={() => formula = handleInputChange(formula)}
            />
        {:else}
            {formula}
        {/if}
    </div>
    <div class="used-rule">
        {#if editable}
            <input
                class="row-input"
                type="text"
                bind:value={rule}
                bind:this={inputRule}
            />
        {:else}
            {rule}
        {/if}
    </div>

    <div class="separator">&nbsp;</div>

    {#if editable}
        <button
            class="action-button check-button"
            aria-label="Save"
            on:click|stopPropagation={() => onSave(formula, rule)}
        >
            <i class="fas fa-check"></i>
        </button>
    {:else}
        <button
            class="action-button edit-button"
            class:disabled={premise}
            disabled={premise}
            aria-label="Edit"
            on:click|stopPropagation={onEdit}
        >
            <i class="fas fa-edit"></i>
        </button>
        <button
            class="action-button delete-button"
            class:disabled={premise}
            disabled={premise}
            aria-label="Delete"
            on:click|stopPropagation={onDelete}
        >
            <i class="fas fa-times"></i>
        </button>
    {/if}
</div>

<style>
    .row {
        display: flex;
        gap: 1rem;
        justify-content: center;
        align-items: center;
        padding: 0.5rem;
        border-radius: 0.5rem;
        border: 1px solid var(--dark-border-color);
        background: var(--dark-element-color);
        font-family: monospace;
        font-size: 1.35em;
    }

    .row.highlighted {
        outline: 1px solid #00ff00;
        border-color: #00ff00;
    }

    .used-rule,
    .line-number {
        text-align: center;
        padding-inline: 0.5rem;
    }

    .used-rule {
        width: auto;
        flex-grow: 0;
        flex-shrink: 1;
    }

    .line-number {
        width: 2.5rem;
    }

    .line-content {
        text-align: left;
        flex-grow: 2;
    }

    .used-rule input,
    .line-content input {
        width: 100%;
        font-size: 1em;
    }

    .used-rule input {
        max-width: 8rem;
    }

    .row-input {
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--dark-border-color);
        color: var(--dark-text-color);
    }

    .separator {
        border-right: 1px solid var(--dark-border-color);
    }

    .action-button {
        background-color: transparent;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        transition: color 0.2s;
    }

    .action-button.disabled {
        cursor: not-allowed;
    }

    .check-button:hover:not(.disabled) {
        color: #00ff00;
    }

    .delete-button:hover:not(.disabled) {
        color: #ff0000;
    }

    .edit-button:hover:not(.disabled) {
        color: #ffcc00;
    }

    @media screen and (prefers-color-scheme: light) {
        .row {
            background: var(--light-bg-color);
            border: 1px solid var(--light-border-color);
        }

        .row-input {
            border: 1px solid var(--light-border-color);
            color: var(--light-text-color);
        }

        .row-input:focus {
            border: 1px solid var(--light-focus-color);
            outline: none;
        }

        .separator {
            border-right: 1px solid var(--light-border-color);
        }

        .row.highlighted {
            border-color: #00c800;
        }
    }
</style>