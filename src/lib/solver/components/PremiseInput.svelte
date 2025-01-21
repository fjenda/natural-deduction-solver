<script lang="ts">
    import {PrettySyntaxer} from "../PrettySyntaxer";

    export let placeholder: string;
    export let value: string | null = "";
    export let error: boolean = false;
    export let index: number;
    let inputElement: HTMLInputElement;

    let hint: string = "" +
        "Constants - [a-z]()\n" +
        "Variables - [a-z]\n" +
        "Functions - [a-z](par1, par2)\n" +
        "Predicates - [A-Z]()\n";

    // Predicate Logic
    // let operators: string[] = ['¬', '∧', '∨', '⊃', '≡', '∀', '∃'];

    // Propositional Logic
    let operators: string[] = ['¬', '∧', '∨', '⊃', '≡'];

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

            if (document.activeElement !== inputElement) inputElement.focus();

            inputElement.setSelectionRange(newPosition, newPosition);
        }, 0);
    }
</script>

<div class="wrapper">
    <input
        type="text"
        placeholder={placeholder}
        name="formula-{index}"
        bind:this={inputElement}
        bind:value={value}
        class:error={error}
        on:change={() => {
            value = PrettySyntaxer.clean(value ?? "");
        }}
    />
    <div class="operator-input">
        {#each operators as operator}
            <button on:mousedown|preventDefault={() => insertOperator(operator)}>{operator}</button>
        {/each}
    </div>
</div>

<style>
    input {
        height: 3.5rem;
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
        top: 3.5rem;
        right: 0;
        z-index: 10;
        color: black;
        padding: 0.25rem;
        border-radius: 0 0 0.5rem 0.5rem;
        border: 1px solid var(--dark-border-color);
        background-color: var(--dark-bg-color);
    }

    .operator-input button {
        aspect-ratio: 1;
        padding: 0.45em 0.8em;
        font-size: 1.35em;
        font-family: monospace;
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
    }

    .wrapper:focus-within input {
        border-radius: 0.5rem 0.5rem 0 0.5rem;
    }
</style>