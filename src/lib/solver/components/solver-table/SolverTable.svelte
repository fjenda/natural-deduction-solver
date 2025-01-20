<script lang="ts">
    import TableRow from "./TableRow.svelte";
    import {parsedProof, solverContent} from "../../../../stores/solverStore";
    import type {TableRowData} from "../../../../types/TableRow";
    import {FormulaParser} from "../../parsers/FormulaParser";
    let container: HTMLDivElement;

    export let rows: TableRowData[] = [];

    function addRow() {
        rows = [
            ...rows,
            {
                line: rows.length + 1,
                formula: "",
                rule: "",
                editable: true,
            },
        ];

        // scroll
        requestAnimationFrame(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: "smooth",
            });
        });
    }

    function canAddRow() {
        return rows.filter(r => r.editable).length < 2;
    }
</script>

<div class="table-wrapper" bind:this={container}>
    <div class="table">
        {#each rows as row, i}
            <TableRow
                line={row.line}
                formula={row.formula}
                rule={row.rule}
                premise={i <= $solverContent.premises.length - 1}
                editable={row.editable}
                onSave={(content, rule) => {

                    /*
                    <!-- TODO: 1. read `rule` and determine which rule was used                -->
                    <!--       2. apply the rule to the row numbers in the `rule`              -->
                    <!--       3. if the results differ from the `formula`, alert the user     -->
                    <!--       4. if the results are the same, update the `formula` and `rule` -->
                    */

                    $parsedProof[i] = FormulaParser.parseFormula(content, i + 1, rule);
                    console.log($parsedProof[i]);

                    row.formula = $parsedProof[i].value;
                    row.rule = $parsedProof[i].rule;
                    row.editable = false;
                }}
                onEdit={() => row.editable = true}
                onDelete={() => rows = rows.filter(r => r !== row)}
            />
        {/each}

            <button
                on:click={addRow}
                aria-label="Add row"
                class:disabled={!canAddRow()}
                disabled={!canAddRow()}
            >
                <i class="fas fa-plus"></i>
            </button>
    </div>
</div>

<style>
    .table-wrapper {
        flex: 1;
        overflow: hidden auto;
        border-radius: 0.5rem;
        border: 1px solid var(--dark-border-color);
        padding: 0.5rem;
    }

    .table {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 100%;
    }

    button.disabled {
        cursor: not-allowed;
    }

    button.disabled:hover {
        border: 1px solid var(--dark-border-color);
    }

    @media screen and (prefers-color-scheme: light) {
        .table-wrapper {
            border: 1px solid var(--light-border-color);
        }
    }
</style>