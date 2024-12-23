<script lang="ts">
    import Hint from "svelte-hint";

    export let placeholder: string;
    export let value: string | null = "";
    export let error: boolean = false;
    let inputElement: HTMLInputElement;

    let hint: string = "" +
        "Constants - [a-z]()\n" +
        "Variables - [a-z]\n" +
        "Functions - [a-z](par1, par2)\n" +
        "Predicates - [A-Z]()\n";

    let operators: string[] = ['¬', '∧', '∨', '⊃', '≡', '∀', '∃'];

    function insertOperator(operator: string) {
        // insert the operator at the current cursor position
        const cursorPosition = inputElement.selectionStart;

        // get the text before and after the cursor
        let textBefore = value?.slice(0, cursorPosition!);
        let textAfter = value?.slice(cursorPosition!);

        // replace undefined with empty string
        if (!textBefore) textBefore = "";
        if (!textAfter) textAfter = "";

        // set the new value
        value = textBefore + operator + textAfter;

        // keep the cursor at the same position
        const newPosition = cursorPosition! + 1;
        setTimeout(() => {
            if (!inputElement) return;

            inputElement.focus();
            inputElement.setSelectionRange(newPosition, newPosition);
        }, 0);
    }
</script>

<div class="wrapper">
    <input type="text" placeholder={placeholder} bind:this={inputElement} bind:value={value} class:error={error} />
    <div class="operator-input">
        {#each operators as operator}
            <button on:click={() => insertOperator(operator)}>{operator}</button>
        {/each}
    </div>
</div>

<style>
    input {
        height: 3.5rem;
        /*flex-grow: 1;*/
        /*transition: background-color 0.2s;*/
        text-decoration: none;
    }

    input.error::placeholder {
        color: white;
    }

    input.error {
        background-color: #df7171;
    }

    .operator-input {
        display: none;
        position: absolute;
        max-width: 13rem;
        top: 3.5rem;
        right: 0;
        z-index: 10;
        color: black;
        padding: 0.5rem;
        border-radius: 0 0 0.5rem 0.5rem;
        border: 1px solid var(--dark-border-color);
        background-color: var(--dark-bg-color);
    }

    .operator-input button {
        width: calc(33% - 0.15rem - 0.5rem);
        aspect-ratio: 1;
        margin: 0.15rem;
        background-color: var(--dark-element-color);
        color: var(--dark-text-color);
    }

    .operator-input button:hover {
        outline: none;
        border: 1px solid var(--light-border-color);
    }

    @media (prefers-color-scheme: light) {
        .operator-input button {
            border: 1px solid var(--light-border-color);
            background: var(--light-element-color);
            color: var(--light-text-color);
        }

        .operator-input button:hover {
            border: 1px solid var(--dark-border-color);
        }

        .operator-input {
            background-color: var(--light-bg-color);
            border: 1px solid var(--light-border-color);
        }
    }

    .wrapper {
        width: 100%;
        position: relative;
    }

    .wrapper:focus-within .operator-input {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }

    .wrapper:focus-within input {
        border-radius: 0.5rem 0.5rem 0 0.5rem;
    }
</style>