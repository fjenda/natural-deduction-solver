<script lang="ts">
    import type {DeductionRule} from "../../solver/parsers/DeductionRules";
    import {DeductionProcessor} from "../../parsers/DeductionProcessor";
    import {highlightedRows, parsedProof} from "../../../stores/solverStore";

    export let rule: DeductionRule;

    function handleMouseOver() {
        let rows = DeductionProcessor.getUsableRows(rule.short);
        highlightedRows.set(rows.highlighted);
    }

    function handleMouseOut() {
        highlightedRows.set([]);
    }

    function handleClick() {
        // TODO: handle selecting a rule using a modal or something if there are multiple choices
        //       for now just select the first one
        highlightedRows.set(DeductionProcessor.getUsableRows(rule.short).highlighted);
        DeductionProcessor.applyRule(rule.short, $parsedProof[$highlightedRows[0] - 1]);
        highlightedRows.set([]);
    }

</script>

<div class="rule-slot"
     title="{rule.title}"
     on:mouseover={handleMouseOver}
     on:mouseout={handleMouseOut}
     on:mousedown|preventDefault={handleClick}
>
    {rule.short}
</div>

<style>
    .rule-slot {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.25rem;

        width: 100%;
        aspect-ratio: 1;
        /*padding: 1.5rem;*/
        cursor: pointer;
        border-radius: 0.5rem;
        border: 1px solid var(--dark-border-color);
        background: var(--dark-element-color);
    }

    .rule-slot:hover {
        border: 1px solid var(--light-border-color);
    }

    @media (prefers-color-scheme: light) {
        .rule-slot {
            border: 1px solid var(--light-border-color);
            background: var(--light-element-color);
        }

        .rule-slot:hover {
            border: 1px solid var(--dark-border-color);
        }
    }
</style>