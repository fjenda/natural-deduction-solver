<script lang="ts">
    import { PrettySyntaxer } from "../../PrettySyntaxer";
    import { highlightedRows, selectedRows } from "../../../../stores/solverStore";
    import type { AppliedRule } from "../../../../types/AppliedRule";
    import { NDRule } from "../../../rules/DeductionRule";

    export let line: number;
    export let formula: string;
    export let rule: AppliedRule;
    export let premise: boolean = false;
    export let editable: boolean = false;
    export let onSave: (content: string, rule: string) => void;
    export let onEdit: () => void;
    export let onDelete: () => void;
    let formulaInput: HTMLInputElement;
    let ruleText: string = "";

    function handleInputChange(s: string): string {
        return PrettySyntaxer.clean(s);
    }

    $: highlighted = $selectedRows.includes(line);
    function selectRow() {
        // if the row is editable, do not highlight
        if (editable) return;

        // if the row is invalid, do not highlight
        if (invalid) {
            alert("Cannot highlight invalid row.\n" +
                  "Make sure the formula and rule are valid.");
            return;
        }

        // if we have 2 rows selected already, and we are trying to select a third
        // do not highlight
        if ($selectedRows.length === 2 && !highlighted) return;

        // update the selected rows
        selectedRows.update(rows => {
            if (rows.includes(line)) {
                return rows.filter(r => r !== line);
            } else {
                return [...rows, line];
            }
        });
    }

    // Predicate Logic
    // let operators: string[] = ['¬', '∧', '∨', '⊃', '≡', '∀', '∃'];

    // Propositional Logic
    let operators: string[] = ['¬', '∧', '∨', '⊃', '≡'];

    function insertOperator(operator: string) {
        // insert the operator at the current cursor position
        const cursorPosition = formulaInput.selectionStart;

        // get the text before and after the cursor
        let textBefore = formula?.slice(0, cursorPosition!);
        let textAfter = formula?.slice(cursorPosition!);

        // replace undefined with empty string
        if (!textBefore) textBefore = "";
        if (!textAfter) textAfter = "";

        // set the new value
        formula = textBefore + operator + textAfter;

        // keep the cursor at the same position
        const newPosition = cursorPosition! + 1;
        setTimeout(() => {
            if (!formulaInput) return;

            formulaInput.focus();
            formulaInput.setSelectionRange(newPosition, newPosition);
        }, 0);
    }

    // a row is usable if its line number is inside the highlightedRows store
    $: usable = $highlightedRows.includes(line);

    // a row is invalid if the rule is unknown and it's not editable
    $: invalid = (rule.rule === NDRule.UNKNOWN && !editable);

    $: mathmlFormula = PrettySyntaxer.toMathML(formula);
</script>

<a
    class="row"
    class:highlighted={highlighted}
    class:usable={usable}
    class:invalid={invalid}
    on:click={selectRow}
    role="button"
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
                bind:this={formulaInput}
                on:change={() => formula = handleInputChange(formula)}
            />
            <div class="operator-input">
                {#each operators as operator}
                    <button on:mousedown|preventDefault={() => insertOperator(operator)}>{operator}</button>
                {/each}
            </div>
        {:else}
            <!--{formula}-->
            {@html mathmlFormula}
        {/if}
    </div>
    <div class="used-rule">
        {#if editable}
            <input
                class="row-input"
                type="text"
                bind:value={ruleText}
            />
        {:else}
            {rule.rule} {rule.lines ? `${rule.lines.join(",")}` : ""}
        {/if}
    </div>

    <div class="separator">&nbsp;</div>

    {#if editable}
        <button
            class="action-button check-button"
            aria-label="Save"
            on:click|stopPropagation={() => onSave(formula, ruleText)}
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
</a>

<style>
    .row {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        align-items: center;
        padding: 0.5rem;
        border-radius: 0.5rem;
        border: 1px solid var(--dark-border-color);
        background: var(--dark-element-color);
        font-family: monospace;
        font-size: 1.35em;
        text-decoration: none;
        color: inherit;
        cursor: pointer;
    }

    .row:hover {
        background: var(--dark-bg-color);
    }

    .row.highlighted.usable,
    .row.highlighted {
        outline: 1px solid #00ff00;
        border-color: #00ff00;
    }

    .row.usable {
        outline: 1px solid #ffcc00;
        border-color: #ffcc00;
    }

    .row.invalid {
        outline: 1px solid #ff0000;
        border-color: #ff0000;
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
        position: relative;
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
        height: auto;
    }

    .separator {
        width: 1px;
        border-right: 1px solid var(--dark-border-color);
    }

    .action-button {
        display: flex;
        justify-content: center;
        align-items: center;
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

    .operator-input {
        display: none;
        position: absolute;
        max-width: 100%;
        top: 100%;
        right: 0;
        z-index: 10;
        color: black;
        padding: 0.15rem;
        border-radius: 0 0 0.5rem 0.5rem;
        border: 1px solid var(--dark-border-color);
        border-top: 0;
        background-color: var(--dark-bg-color);
    }

    .operator-input button {
        aspect-ratio: 1;
        padding: 0.225em 0.7em;
        font-size: 0.9em;
        font-family: monospace;
        margin: 0.15rem;
        background-color: var(--dark-element-color);
        color: var(--dark-text-color);
    }

    .operator-input button:hover {
        outline: none;
        border: 1px solid var(--light-border-color);
    }

    .line-content:focus-within .operator-input {
        display: flex;
        flex-wrap: wrap;
    }

    .line-content:focus-within .row-input {
        border-radius: 0.5rem 0.5rem 0 0.5rem;
    }

    @media screen and (prefers-color-scheme: light) {
        .row {
            background: var(--light-bg-color);
            border: 1px solid var(--light-border-color);
        }

        .row:hover {
            background: var(--light-element-color);
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
            outline: 1px solid #00c800;
        }

        .row.usable {
            border-color: #ffcc00;
            outline: 1px solid #ffcc00;
        }
    }
</style>