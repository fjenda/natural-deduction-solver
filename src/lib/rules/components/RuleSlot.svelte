<script lang="ts">
    import type {DeductionRule} from "../../solver/parsers/DeductionRules";
    import {DeductionProcessor} from "../../parsers/DeductionProcessor";
    import {highlightedRows, selectedRows} from "../../../stores/solverStore";

    export let rule: DeductionRule;
    export let onClick: () => void;
    export let onMouseOver: () => void;
    export let onMouseOut: () => void;

    function handleClick() {
        const result = DeductionProcessor.getUsableRows(rule.short);
        if (!result.applicable) return;

        highlightedRows.set(result.highlighted);
        onClick();
        highlightedRows.set([]);
    }

    function setButtonDisabled() {
        return $selectedRows.length !== rule.inputSize;
    }

</script>

<button
    class="rule-slot"
    title="{rule.title}"
    class:disabled={setButtonDisabled}
    on:mouseover={onMouseOver}
    on:mouseout={onMouseOut}
    on:mousedown|preventDefault={handleClick}
>
    {rule.short}
</button>

<style>
    .rule-slot {
        /*display: flex;*/
        /*justify-content: center;*/
        /*align-items: center;*/
        font-size: 1.25rem;
        max-width: 7.5rem;
        width: calc(25% - 1rem);
        aspect-ratio: 1;
        padding: 1rem;
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

    @media screen and (max-width: 1200px) {
        .rule-slot {
            width: calc(33% - 1rem);
        }
    }

    /*@media screen and (max-width: 950px) {*/
    /*    .rule-slot {*/
    /*        width: calc(50% - 1rem);*/
    /*    }*/
    /*}*/
</style>