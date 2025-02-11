<script lang="ts">
    import TableRow from "./TableRow.svelte";
    import {solverContent} from "../../../../stores/solverStore";
    import type {TableRowData} from "../../../../types/TableRow";
    import {FormulaParser} from "../../parsers/FormulaParser";
    import type {TreeRuleType} from "../../../../types/TreeRuleType";
    import {NDRule} from "../../parsers/DeductionRules";
    import {FormulaComparer} from "../../FormulaComparer";

    let container: HTMLDivElement;

    export let data: TreeRuleType[] = []
    let rows: TableRowData[] = [];

    $: rows = data.map((d) => ({
        line: d.line,
        formula: d.value,
        rule: d.rule,
        editable: false,
    }));

    function addRow() {
        rows = [
            ...rows,
            {
                line: rows.length + 1,
                formula: "",
                rule: { rule: NDRule.UNKNOWN },
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
        return rows.filter(r => r.editable).length < 1;
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
                    const res = FormulaParser.parseFormula(content, i + 1, rule);

                    // check if the formula already exist in any other row
                    const formulaExists = $solverContent.proof
                        .filter((_, index) => index !== i)
                        .some(p => FormulaComparer.compare(p, res));

                    if (formulaExists) {
                        alert("Formula already exists in the proof.");
                        return;
                    }

                    $solverContent.proof[i] = res;

                    row.formula = $solverContent.proof[i].value;
                    row.rule = $solverContent.proof[i].rule;
                    row.editable = false;
                }}
                onEdit={() => {
                    // remove the row from the proof
                    row.editable = true;
                    $solverContent.proof.splice(i, 1);
                }}
                onDelete={() => {
                    solverContent.update(content => {
                        // remove the row from the proof
                        $solverContent.proof.splice(i, 1);
                        return content;
                    });
                }}
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
        background-color: #121212;
        padding: 0.5rem;
    }

    .table {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 100%;
    }

    button {
        height: 3.5rem;
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
            background: #efefef4d;
        }
    }
</style>